import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { ConversionOptions } from '../types/converter';
export { splitPdf } from './pdfToFormat';

/**
 * 1. Merge multiple PDFs into one
 */
export async function mergePdfFiles(
  files: File[],
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  if (files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  onProgress?.(10, 'Creating merged PDF document...');
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(
      Math.round(15 + ((i + 1) / files.length) * 75),
      `Merging ${file.name} (${i + 1} of ${files.length})...`
    );

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }

  onProgress?.(95, 'Saving combined PDF...');
  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  onProgress?.(100, 'Merge completed successfully!');
  return {
    blob,
    fileName: `merged_document_${files.length}_files.pdf`,
  };
}

/**
 * 2. Add Watermark to PDF
 */
export async function watermarkPdf(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  const text = options.watermarkText?.trim() || 'CONFIDENTIAL';
  const opacity = options.watermarkOpacity ?? 0.3;
  const rotationDeg = options.watermarkRotation ?? 45;
  const fontSize = options.watermarkFontSize ?? 48;

  onProgress?.(15, 'Loading PDF for watermarking...');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  onProgress?.(40, 'Stamping watermark across pages...');

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: (height - textHeight) / 2,
      size: fontSize,
      font,
      color: rgb(0.4, 0.4, 0.45),
      opacity,
      rotate: degrees(rotationDeg),
    });
  }

  onProgress?.(90, 'Saving watermarked PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'Watermark applied!');
  return {
    blob,
    fileName: `${baseName}_watermarked.pdf`,
  };
}

/**
 * 3. Add Page Numbers to PDF
 */
export async function addPageNumbersToPdf(
  file: File,
  options: {
    position?: 'bottom-center' | 'bottom-right' | 'top-right';
    format?: 'Page {n} of {total}' | '{n} / {total}' | 'Page {n}' | '{n}';
    fontSize?: number;
    startFrom?: number;
  } = {},
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  const {
    position = 'bottom-center',
    format = 'Page {n} of {total}',
    fontSize = 10,
    startFrom = 1,
  } = options;

  onProgress?.(20, 'Loading PDF document...');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  onProgress?.(50, `Adding page numbers to ${total} pages...`);

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const pageNum = startFrom + i;
    const { width, height } = page.getSize();

    const label = format
      .replace('{n}', pageNum.toString())
      .replace('{total}', (startFrom + total - 1).toString());

    const textWidth = font.widthOfTextAtSize(label, fontSize);

    let x = (width - textWidth) / 2;
    let y = 25; // bottom margin

    if (position === 'bottom-right') {
      x = width - textWidth - 35;
      y = 25;
    } else if (position === 'top-right') {
      x = width - textWidth - 35;
      y = height - 30;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.35),
    });
  }

  onProgress?.(90, 'Saving numbered PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'Page numbers stamped!');
  return {
    blob,
    fileName: `${baseName}_numbered.pdf`,
  };
}

/**
 * 4. Rotate PDF Pages
 */
export async function rotatePdfPages(
  file: File,
  rotationAngle: 90 | 180 | 270,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(20, 'Loading PDF document...');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  onProgress?.(50, `Rotating ${pages.length} pages by ${rotationAngle}°...`);
  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotationAngle) % 360));
  });

  onProgress?.(85, 'Saving rotated document...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'Rotation completed!');
  return {
    blob,
    fileName: `${baseName}_rotated_${rotationAngle}deg.pdf`,
  };
}

/**
 * 5. Organize, Reorder, or Filter PDF Pages
 */
export async function reorganizePdf(
  file: File,
  pageOrder: { originalIndex: number; rotation: number }[],
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(15, 'Loading original PDF...');
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const newDoc = await PDFDocument.create();

  onProgress?.(40, 'Rebuilding custom page sequence...');
  for (let i = 0; i < pageOrder.length; i++) {
    const item = pageOrder[i];
    const [copiedPage] = await newDoc.copyPages(srcDoc, [item.originalIndex]);
    
    if (item.rotation) {
      const curAngle = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((curAngle + item.rotation) % 360));
    }
    
    newDoc.addPage(copiedPage);
  }

  onProgress?.(90, 'Saving reorganized PDF...');
  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'New PDF generated!');
  return {
    blob,
    fileName: `${baseName}_reorganized.pdf`,
  };
}

/**
 * 6. Stamp signature / image onto PDF
 */
export async function stampSignatureOnPdf(
  pdfFile: File,
  signaturePngBlob: Blob,
  placement: {
    pageNumber: number; // 1-indexed
    xPercent: number; // 0 to 100
    yPercent: number; // 0 to 100
    width: number;
    height: number;
  },
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(20, 'Loading PDF & Signature...');
  const pdfArrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer);

  const sigArrayBuffer = await signaturePngBlob.arrayBuffer();
  const signatureImage = await pdfDoc.embedPng(sigArrayBuffer);

  const pages = pdfDoc.getPages();
  const targetPageIdx = Math.max(0, Math.min(placement.pageNumber - 1, pages.length - 1));
  const page = pages[targetPageIdx];
  const { width: pageWidth, height: pageHeight } = page.getSize();

  // Convert percentages to PDF coordinate space (y is from bottom up in PDF)
  const x = (placement.xPercent / 100) * pageWidth;
  const y = pageHeight - ((placement.yPercent / 100) * pageHeight) - placement.height;

  onProgress?.(60, 'Stamping signature onto page...');
  page.drawImage(signatureImage, {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: placement.width,
    height: placement.height,
  });

  onProgress?.(90, 'Saving signed PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = pdfFile.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'PDF Signed Successfully!');
  return {
    blob,
    fileName: `${baseName}_signed.pdf`,
  };
}

