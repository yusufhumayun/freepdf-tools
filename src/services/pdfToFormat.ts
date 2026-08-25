import * as pdfjsLib from 'pdfjs-dist';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { ConversionOptions } from '../types/converter';

// Setup pdfjs worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/**
 * Loads a PDF file and returns the pdf document proxy
 */
export async function loadPdfDocument(file: File | ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  return await loadingTask.promise;
}

/**
 * Extract thumbnails for pages
 */
export async function generatePdfThumbnails(file: File, maxPages: number = 6): Promise<string[]> {
  try {
    const pdf = await loadPdfDocument(file);
    const count = Math.min(pdf.numPages, maxPages);
    const thumbnails: string[] = [];

    for (let i = 1; i <= count; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.35 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      thumbnails.push(canvas.toDataURL('image/jpeg', 0.8));
    }
    return thumbnails;
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    return [];
  }
}

/**
 * Extract structured text items per page
 */
export interface ExtractedPageText {
  pageNumber: number;
  text: string;
  lines: string[];
  tables?: string[][][];
}

export async function extractPdfTextStructure(
  pdf: pdfjsLib.PDFDocumentProxy, 
  onProgress?: (progress: number, status: string) => void
): Promise<ExtractedPageText[]> {
  const numPages = pdf.numPages;
  const pages: ExtractedPageText[] = [];

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) {
      onProgress(Math.round((i / numPages) * 60), `Extracting text from page ${i} of ${numPages}...`);
    }
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Group text items by Y-coordinate (approximate lines)
    const lineMap = new Map<number, { x: number; str: string }[]>();
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim().length > 0) {
        // Round y to group items on same line
        const y = Math.round(item.transform[5]);
        const x = item.transform[4];
        if (!lineMap.has(y)) {
          lineMap.set(y, []);
        }
        lineMap.get(y)!.push({ x, str: item.str });
      }
    }

    // Sort lines from top (highest Y) to bottom
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const lines: string[] = [];

    for (const y of sortedY) {
      const items = lineMap.get(y)!;
      // Sort items left to right
      items.sort((a, b) => a.x - b.x);
      const lineText = items.map(it => it.str).join(' ');
      if (lineText.trim().length > 0) {
        lines.push(lineText);
      }
    }

    const fullText = lines.join('\n');
    pages.push({
      pageNumber: i,
      text: fullText,
      lines,
    });
  }

  return pages;
}

/**
 * 1. Convert PDF to DOCX (.docx Word document)
 */
export async function convertPdfToDocx(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(10, 'Loading PDF document...');
  const pdf = await loadPdfDocument(file);
  const totalPages = pdf.numPages;

  onProgress?.(25, 'Extracting content and structure...');
  const pages = await extractPdfTextStructure(pdf, (p, msg) => onProgress?.(25 + Math.round(p * 0.4), msg));

  onProgress?.(70, 'Constructing Word document formatting...');
  const docxChildren: (Paragraph | Table)[] = [];

  // Title header
  docxChildren.push(
    new Paragraph({
      text: file.name.replace(/\.[^/.]+$/, ''),
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    
    if (totalPages > 1) {
      docxChildren.push(
        new Paragraph({
          text: `Page ${page.pageNumber}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
    }

    for (const line of page.lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect table-like rows (e.g. comma/tab/multiple spaced columns)
      const tabColumns = line.split(/\t{1,}|\s{3,}/).filter(Boolean);
      if (options.extractTables && tabColumns.length >= 3) {
        const table = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: tabColumns.map(col => new TableCell({
                children: [new Paragraph({ text: col.trim() })],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                }
              }))
            })
          ]
        });
        docxChildren.push(table);
      } else if (trimmed.length < 60 && (trimmed.toUpperCase() === trimmed || /^[0-9]+\.\s+[A-Z]/.test(trimmed))) {
        // Likely a heading
        docxChildren.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed, bold: true, size: 24 })],
            spacing: { before: 160, after: 80 },
          })
        );
      } else {
        docxChildren.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  onProgress?.(85, 'Packaging DOCX file...');
  const doc = new Document({
    sections: [{
      properties: {},
      children: docxChildren,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  onProgress?.(100, 'DOCX conversion completed!');

  return {
    blob,
    fileName: `${baseName}.docx`,
  };
}

/**
 * 2. Convert PDF to Images (PNG, JPG, WebP)
 */
export async function convertPdfToImages(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string; isZip: boolean }> {
  onProgress?.(10, 'Loading PDF for rendering...');
  const pdf = await loadPdfDocument(file);
  const totalPages = pdf.numPages;
  const scale = options.dpiScale || 2.0; // default 2x high resolution
  const format = options.imageFormat || 'png';
  const mimeType = format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : format;

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  // Parse page range if specified (e.g., "1-3, 5")
  const targetPages: number[] = [];
  if (options.pageRange && options.pageRange.trim()) {
    const parts = options.pageRange.split(',');
    for (const part of parts) {
      const matchRange = part.trim().match(/^(\d+)-(\d+)$/);
      if (matchRange) {
        const start = parseInt(matchRange[1], 10);
        const end = parseInt(matchRange[2], 10);
        for (let p = start; p <= end; p++) {
          if (p >= 1 && p <= totalPages && !targetPages.includes(p)) {
            targetPages.push(p);
          }
        }
      } else {
        const p = parseInt(part.trim(), 10);
        if (p >= 1 && p <= totalPages && !targetPages.includes(p)) {
          targetPages.push(p);
        }
      }
    }
  } else {
    for (let i = 1; i <= totalPages; i++) {
      targetPages.push(i);
    }
  }

  if (targetPages.length === 0) {
    for (let i = 1; i <= totalPages; i++) targetPages.push(i);
  }

  // Single page -> direct image download
  if (targetPages.length === 1) {
    const pNum = targetPages[0];
    onProgress?.(40, `Rendering page ${pNum}...`);
    const page = await pdf.getPage(pNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Fill white background for JPEGs
    if (format === 'jpeg' || format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob failed'));
      }, mimeType, 0.92);
    });

    onProgress?.(100, 'Rendering completed!');
    return {
      blob,
      fileName: `${baseName}_page_${pNum}.${ext}`,
      isZip: false,
    };
  }

  // Multi-page -> Bundle into a ZIP archive
  const zip = new JSZip();
  const folder = zip.folder(baseName) || zip;

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pNum = targetPages[idx];
    const progressPercent = Math.round(20 + ((idx + 1) / targetPages.length) * 70);
    onProgress?.(progressPercent, `Rendering page ${pNum} of ${totalPages}...`);

    const page = await pdf.getPage(pNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (format === 'jpeg' || format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    const imgBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), mimeType, 0.92);
    });

    const pagePadded = String(pNum).padStart(String(totalPages).length, '0');
    folder.file(`${baseName}_page_${pagePadded}.${ext}`, imgBlob);
  }

  onProgress?.(95, 'Compressing images into ZIP...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  onProgress?.(100, 'Conversion completed!');

  return {
    blob: zipBlob,
    fileName: `${baseName}_images.zip`,
    isZip: true,
  };
}

/**
 * 3. Convert PDF to Plain Text (.txt)
 */
export async function convertPdfToTxt(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(20, 'Reading PDF document...');
  const pdf = await loadPdfDocument(file);
  const totalPages = pdf.numPages;

  onProgress?.(50, 'Extracting text streams...');
  const pages = await extractPdfTextStructure(pdf, (p, msg) => onProgress?.(50 + Math.round(p * 0.4), msg));

  const textSections: string[] = [];
  textSections.push(`=== Document: ${file.name} ===\n`);

  for (const p of pages) {
    if (totalPages > 1) {
      textSections.push(`\n--- [Page ${p.pageNumber}] ---\n`);
    }
    textSections.push(p.text);
  }

  const resultText = textSections.join('\n');
  const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'Text extraction complete!');
  return {
    blob,
    fileName: `${baseName}.txt`,
  };
}

/**
 * 4. Convert PDF to Markdown (.md)
 */
export async function convertPdfToMarkdown(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(20, 'Parsing PDF layout...');
  const pdf = await loadPdfDocument(file);
  const totalPages = pdf.numPages;

  onProgress?.(50, 'Extracting structured content...');
  const pages = await extractPdfTextStructure(pdf, (p, msg) => onProgress?.(50 + Math.round(p * 0.4), msg));

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const mdLines: string[] = [];

  mdLines.push(`# ${baseName}\n`);

  for (const page of pages) {
    if (totalPages > 1) {
      mdLines.push(`\n## Page ${page.pageNumber}\n`);
    }

    for (const line of page.lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (/^[0-9]+\.\s+[A-Z]/.test(trimmed)) {
        mdLines.push(`\n### ${trimmed}\n`);
      } else if (/^[-*•]\s+/.test(trimmed)) {
        mdLines.push(`* ${trimmed.replace(/^[-*•]\s+/, '')}`);
      } else if (trimmed.length < 50 && trimmed.toUpperCase() === trimmed && /[A-Z]/.test(trimmed)) {
        mdLines.push(`\n#### ${trimmed}\n`);
      } else {
        mdLines.push(`${line}\n`);
      }
    }
  }

  const resultMd = mdLines.join('\n');
  const blob = new Blob([resultMd], { type: 'text/markdown;charset=utf-8' });

  onProgress?.(100, 'Markdown conversion complete!');
  return {
    blob,
    fileName: `${baseName}.md`,
  };
}

/**
 * 5. Convert PDF to HTML (.html)
 */
export async function convertPdfToHtml(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(20, 'Analyzing PDF layout...');
  const pdf = await loadPdfDocument(file);
  const totalPages = pdf.numPages;

  onProgress?.(50, 'Extracting text and formatting...');
  const pages = await extractPdfTextStructure(pdf, (p, msg) => onProgress?.(50 + Math.round(p * 0.4), msg));
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${baseName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    }
    .page-divider {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 40px 0;
    }
    .page-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 24px;
    }
    h1 { color: #0f172a; margin-top: 0; font-size: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #1e293b; margin-top: 28px; font-size: 20px; }
    p { margin: 12px 0; font-size: 16px; word-break: break-word; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${baseName}</h1>
    ${pages.map(page => `
      <div class="page-section">
        ${totalPages > 1 ? `<div class="page-badge">Page ${page.pageNumber}</div>` : ''}
        ${page.lines.map(line => `<p>${escapeHtml(line)}</p>`).join('\n')}
      </div>
      ${page.pageNumber < totalPages ? '<hr class="page-divider" />' : ''}
    `).join('\n')}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  onProgress?.(100, 'HTML generated successfully!');

  return {
    blob,
    fileName: `${baseName}.html`,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 6. Convert PDF to Excel / CSV / JSON (.xlsx, .csv, .json)
 */
export async function convertPdfToSpreadsheet(
  file: File,
  targetFormat: 'xlsx' | 'csv' | 'json',
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(20, 'Analyzing PDF tables and data...');
  const pdf = await loadPdfDocument(file);

  onProgress?.(50, 'Extracting tabular data...');
  const pages = await extractPdfTextStructure(pdf, (p, msg) => onProgress?.(50 + Math.round(p * 0.4), msg));
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  // Parse lines into grid rows
  const allRows: string[][] = [];
  let maxCols = 1;

  for (const page of pages) {
    for (const line of page.lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Delimiter detection: tabs, commas, or 2+ consecutive spaces
      let cols = line.split(/\t/);
      if (cols.length <= 1) {
        cols = line.split(/,\s*/);
      }
      if (cols.length <= 1) {
        cols = line.split(/\s{2,}/);
      }
      if (cols.length > maxCols) maxCols = cols.length;
      allRows.push(cols.map(c => c.trim()));
    }
  }

  onProgress?.(80, `Formatting ${targetFormat.toUpperCase()} data...`);

  if (targetFormat === 'json') {
    // Structured JSON
    const jsonData = {
      title: baseName,
      totalPages: pages.length,
      extractedRows: allRows,
      pages: pages.map(p => ({
        pageNumber: p.pageNumber,
        lines: p.lines,
      })),
    };
    const jsonStr = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    onProgress?.(100, 'JSON conversion completed!');
    return { blob, fileName: `${baseName}.json` };
  }

  // Create Excel workbook using SheetJS (XLSX)
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws['!cols'] = Array(maxCols).fill({ wch: 20 });
  XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

  if (targetFormat === 'csv') {
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8' });
    onProgress?.(100, 'CSV export completed!');
    return { blob, fileName: `${baseName}.csv` };
  }

  // XLSX
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  onProgress?.(100, 'Excel export completed!');

  return { blob, fileName: `${baseName}.xlsx` };
}

/**
 * 7. Compress / Optimize PDF
 */
export async function compressPdf(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string; originalSize: number; newSize: number }> {
  onProgress?.(10, 'Loading PDF for optimization...');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await loadPdfDocument(arrayBuffer);
  const totalPages = pdf.numPages;

  const quality = options.compressionLevel === 'high' ? 0.5 : options.compressionLevel === 'medium' ? 0.7 : 0.85;
  const scale = options.compressionLevel === 'high' ? 1.0 : options.compressionLevel === 'medium' ? 1.3 : 1.6;

  onProgress?.(30, 'Compressing and optimizing page bitmaps...');
  const newPdfDoc = await PDFDocument.create();

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(Math.round(30 + (i / totalPages) * 50), `Processing page ${i} of ${totalPages}...`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
    const jpegBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());

    const embeddedImage = await newPdfDoc.embedJpg(jpegBytes);
    const originalViewport = page.getViewport({ scale: 1.0 });

    const newPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });
  }

  onProgress?.(90, 'Saving optimized PDF...');
  const newPdfBytes = await newPdfDoc.save();
  const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'PDF compressed successfully!');
  return {
    blob,
    fileName: `${baseName}_compressed.pdf`,
    originalSize: file.size,
    newSize: blob.size,
  };
}

/**
 * 8. Split PDF into separate pages or ranges
 */
export async function splitPdf(
  file: File,
  pageRange?: string,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(10, 'Loading PDF for splitting...');
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = srcDoc.getPageCount();
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  const zip = new JSZip();

  for (let i = 0; i < totalPages; i++) {
    onProgress?.(Math.round(20 + ((i + 1) / totalPages) * 70), `Extracting page ${i + 1} of ${totalPages}...`);
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
    newDoc.addPage(copiedPage);

    const pdfBytes = await newDoc.save();
    const pagePadded = String(i + 1).padStart(String(totalPages).length, '0');
    zip.file(`${baseName}_page_${pagePadded}.pdf`, pdfBytes);
  }

  onProgress?.(95, 'Archiving split PDFs into ZIP...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  onProgress?.(100, 'Split completed!');

  return {
    blob: zipBlob,
    fileName: `${baseName}_split_pages.zip`,
  };
}
