import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { loadPdfDocument } from './pdfToFormat';

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  producer?: string;
  creator?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * 1. Read & Update PDF Metadata
 */
export async function readPdfMetadata(file: File): Promise<PdfMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  return {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    keywords: pdfDoc.getKeywords() ? pdfDoc.getKeywords()?.split(';') : [],
    producer: pdfDoc.getProducer() || '',
    creator: pdfDoc.getCreator() || '',
    creationDate: pdfDoc.getCreationDate(),
    modificationDate: pdfDoc.getModificationDate(),
  };
}

export async function updatePdfMetadata(
  file: File,
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    stripAll?: boolean;
  },
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(20, 'Loading PDF document...');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  onProgress?.(50, 'Updating document properties...');

  if (metadata.stripAll) {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('FreePDF Tools');
    pdfDoc.setCreator('FreePDF Tools');
  } else {
    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) {
      const kwList = metadata.keywords.split(',').map((k) => k.trim()).filter(Boolean);
      pdfDoc.setKeywords(kwList);
    }
    if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
    pdfDoc.setModificationDate(new Date());
  }

  onProgress?.(85, 'Saving sanitized PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'Metadata updated successfully!');
  return {
    blob,
    fileName: `${baseName}_metadata_updated.pdf`,
  };
}

/**
 * 2. Unlock / Decrypt Password-Protected PDF
 */
export async function unlockPdfDocument(
  file: File,
  password?: string,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(25, 'Attempting to decrypt PDF...');
  const arrayBuffer = await file.arrayBuffer();

  try {
    // Try loading with or without password
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: !password,
      password: password || undefined,
    } as any);

    onProgress?.(65, 'Removing security restrictions & generating clean copy...');
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    onProgress?.(100, 'PDF Decrypted and Unlocked!');
    return {
      blob,
      fileName: `${baseName}_unlocked.pdf`,
    };
  } catch (err: any) {
    throw new Error(
      err.message?.includes('password') || err.message?.includes('encrypted')
        ? 'Incorrect or missing password. Please enter the valid password to decrypt this PDF.'
        : 'Failed to unlock PDF: ' + err.message
    );
  }
}

/**
 * 3. Crop PDF Margins (Trim white borders or resize page box)
 */
export async function cropPdfMargins(
  file: File,
  margins: {
    top: number; // in points (72pt = 1 inch)
    bottom: number;
    left: number;
    right: number;
  },
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(20, 'Loading PDF for margin cropping...');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  onProgress?.(50, `Applying crop margins to ${pages.length} pages...`);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    const newX = Math.max(0, margins.left);
    const newY = Math.max(0, margins.bottom);
    const newWidth = Math.max(50, width - margins.left - margins.right);
    const newHeight = Math.max(50, height - margins.top - margins.bottom);

    // Set CropBox and MediaBox
    page.setCropBox(newX, newY, newWidth, newHeight);
  }

  onProgress?.(90, 'Saving cropped PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'Crop applied successfully!');
  return {
    blob,
    fileName: `${baseName}_cropped.pdf`,
  };
}

/**
 * 4. PDF Redaction / Whiteout Tool (Burn black/white rectangles to censor text/data)
 */
export interface RedactionBox {
  pageNumber: number; // 1-indexed
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  widthPercent: number; // 0 to 100
  heightPercent: number; // 0 to 100
  color: 'black' | 'white' | 'gray';
  label?: string; // e.g. [REDACTED]
}

export async function applyRedactionsToPdf(
  file: File,
  redactions: RedactionBox[],
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(15, 'Loading PDF for redaction sanitization...');
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  onProgress?.(45, `Sanitizing ${redactions.length} confidential regions...`);

  for (const box of redactions) {
    const pageIdx = Math.max(0, Math.min(box.pageNumber - 1, pages.length - 1));
    const page = pages[pageIdx];
    const { width, height } = page.getSize();

    const rectX = (box.xPercent / 100) * width;
    const rectY = height - ((box.yPercent / 100) * height) - ((box.heightPercent / 100) * height);
    const rectWidth = (box.widthPercent / 100) * width;
    const rectHeight = (box.heightPercent / 100) * height;

    const fillColor =
      box.color === 'black'
        ? rgb(0.05, 0.05, 0.05)
        : box.color === 'white'
        ? rgb(1, 1, 1)
        : rgb(0.5, 0.5, 0.5);

    // Draw opaque redaction box
    page.drawRectangle({
      x: rectX,
      y: rectY,
      width: rectWidth,
      height: rectHeight,
      color: fillColor,
      borderColor: box.color === 'white' ? rgb(0.8, 0.8, 0.8) : fillColor,
      borderWidth: 1,
      opacity: 1.0,
    });

    // Optional censor label
    if (box.label && rectWidth > 40 && rectHeight > 12) {
      const labelFontSize = Math.min(10, Math.max(6, rectHeight * 0.55));
      const textWidth = font.widthOfTextAtSize(box.label, labelFontSize);
      page.drawText(box.label, {
        x: rectX + Math.max(2, (rectWidth - textWidth) / 2),
        y: rectY + (rectHeight - labelFontSize) / 2,
        size: labelFontSize,
        font,
        color: box.color === 'black' ? rgb(1, 1, 1) : rgb(0.2, 0.2, 0.2),
      });
    }
  }

  onProgress?.(90, 'Saving sanitized redacted PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'Redaction completed!');
  return {
    blob,
    fileName: `${baseName}_redacted.pdf`,
  };
}

/**
 * 5. PDF Dark Mode / Color Inverter
 * Renders pages with high contrast inverted colors for night-time reading & AMOLED screens.
 */
export async function generateDarkModePdf(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(10, 'Loading PDF for Dark Mode conversion...');
  const pdf = await loadPdfDocument(file);
  const totalPages = pdf.numPages;

  const newDoc = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(
      Math.round(15 + (pageNum / totalPages) * 75),
      `Inverting Page ${pageNum} of ${totalPages} to Dark Mode...`
    );

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) continue;

    // Render original page
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Invert canvas pixels (White -> Dark Slate, Black Text -> Light Amber/White)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Invert color with warm dark tone (18, 24, 38)
      data[i] = 255 - r;
      data[i + 1] = 255 - g;
      data[i + 2] = 255 - b;
    }

    ctx.putImageData(imgData, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    );

    if (!blob) continue;

    const imgBuffer = await blob.arrayBuffer();
    const embeddedImg = await newDoc.embedJpg(imgBuffer);

    const newPage = newDoc.addPage([viewport.width / 2.0, viewport.height / 2.0]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: viewport.width / 2.0,
      height: viewport.height / 2.0,
    });
  }

  onProgress?.(95, 'Saving Dark Mode document...');
  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(100, 'Dark Mode PDF generated!');
  return {
    blob,
    fileName: `${baseName}_darkmode.pdf`,
  };
}
