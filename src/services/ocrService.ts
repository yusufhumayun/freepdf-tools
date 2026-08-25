import { createWorker } from 'tesseract.js';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { loadPdfDocument } from './pdfToFormat';

export interface OcrResult {
  text: string;
  confidence: number;
  pageNumber: number;
  lines: string[];
}

export interface BatchOcrResult {
  pages: OcrResult[];
  fullText: string;
  averageConfidence: number;
}

/**
 * Perform in-browser OCR on an Image File (PNG, JPG, WEBP, etc.)
 */
export async function performImageOcr(
  imageFile: File,
  language: string = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<BatchOcrResult> {
  onProgress?.(10, 'Initializing WebAssembly OCR engine...');
  const worker = await createWorker(language);

  try {
    onProgress?.(30, `Recognizing text in ${imageFile.name}...`);
    const imageUrl = URL.createObjectURL(imageFile);
    
    const ret = await worker.recognize(imageUrl);
    URL.revokeObjectURL(imageUrl);

    onProgress?.(90, 'Processing recognized text...');
    const text = ret.data.text.trim();
    const rawLines = (ret.data as any).lines;
    const lines = Array.isArray(rawLines) ? rawLines.map((l: any) => (l.text || '').trim()).filter(Boolean) : text.split('\n');

    await worker.terminate();
    onProgress?.(100, 'OCR text extraction complete!');

    return {
      pages: [
        {
          text,
          confidence: Math.round(ret.data.confidence || 90),
          pageNumber: 1,
          lines,
        }
      ],
      fullText: text,
      averageConfidence: Math.round(ret.data.confidence || 90),
    };
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

/**
 * Perform in-browser OCR on a Scanned PDF Document
 */
export async function performPdfOcr(
  pdfFile: File,
  language: string = 'eng',
  pageRange?: { start: number; end: number },
  onProgress?: (progress: number, status: string) => void
): Promise<BatchOcrResult> {
  onProgress?.(5, 'Loading PDF for optical character recognition...');
  const pdf = await loadPdfDocument(pdfFile);
  const totalPages = pdf.numPages;

  const startPage = pageRange ? Math.max(1, pageRange.start) : 1;
  const endPage = pageRange ? Math.min(totalPages, pageRange.end) : Math.min(totalPages, 15); // limit batch to 15 pages for memory safety

  onProgress?.(15, `Initializing OCR engine (${language})...`);
  const worker = await createWorker(language);

  const pageResults: OcrResult[] = [];
  let totalConfidence = 0;

  try {
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const currentStep = pageNum - startPage + 1;
      const totalSteps = endPage - startPage + 1;
      const baseProgress = 15 + Math.round((currentStep / totalSteps) * 75);

      onProgress?.(
        baseProgress,
        `Rendering & reading Page ${pageNum} of ${endPage}...`
      );

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for sharp text recognition

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) throw new Error('Could not create canvas context for OCR');

      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png', 0.95)
      );

      if (!blob) continue;

      const pageImgUrl = URL.createObjectURL(blob);
      const ret = await worker.recognize(pageImgUrl);
      URL.revokeObjectURL(pageImgUrl);

      const pageText = ret.data.text.trim();
      const pageConfidence = Math.round(ret.data.confidence || 85);
      totalConfidence += pageConfidence;

      const rawLines = (ret.data as any).lines;
      const lines = Array.isArray(rawLines) ? rawLines.map((l: any) => (l.text || '').trim()).filter(Boolean) : pageText.split('\n');

      pageResults.push({
        text: pageText,
        confidence: pageConfidence,
        pageNumber: pageNum,
        lines,
      });
    }

    await worker.terminate();
    onProgress?.(95, 'Synthesizing document...');

    const fullText = pageResults
      .map((p) => `--- PAGE ${p.pageNumber} ---\n\n${p.text}`)
      .join('\n\n');

    const avgConfidence = pageResults.length > 0 ? Math.round(totalConfidence / pageResults.length) : 0;

    onProgress?.(100, 'OCR completed successfully!');
    return {
      pages: pageResults,
      fullText,
      averageConfidence: avgConfidence,
    };
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

/**
 * Export Extracted OCR Text to formatted Word (.docx)
 */
export async function exportOcrToDocx(
  ocrResult: BatchOcrResult,
  documentTitle: string = 'OCR_Extracted_Document'
): Promise<Blob> {
  const docSections = [];

  for (const page of ocrResult.pages) {
    const pageParagraphs = [];

    // Header per page
    pageParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Document Page ${page.pageNumber}`,
            bold: true,
            size: 24, // 12pt
            color: '4F46E5',
          }),
        ],
        spacing: { before: 200, after: 120 },
      })
    );

    // Text lines
    for (const line of page.lines) {
      if (line.trim()) {
        pageParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 22, // 11pt
              }),
            ],
            spacing: { after: 80, line: 276 },
          })
        );
      }
    }

    docSections.push({
      properties: {},
      children: pageParagraphs,
    });
  }

  const doc = new Document({
    sections: docSections.length > 0 ? docSections : [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun(ocrResult.fullText || 'No text extracted')],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
