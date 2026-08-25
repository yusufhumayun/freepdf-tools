import { PDFDocument, rgb } from 'pdf-lib';
import jsPDF from 'jspdf';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { marked } from 'marked';
import { ConversionOptions } from '../types/converter';

// Standard point dimensions (72 points = 1 inch)
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
};

/**
 * 1. Convert Image(s) to PDF
 */
export async function convertImagesToPdf(
  files: File[],
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(10, 'Initializing PDF document...');
  const pdfDoc = await PDFDocument.create();

  const pageSize = options.pageSize || 'a4';
  const marginOption = options.margin || 'none';
  const margin = marginOption === 'normal' ? 36 : marginOption === 'small' ? 18 : 0;
  const orientation = options.orientation || 'auto';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(
      Math.round(20 + ((i + 1) / files.length) * 70),
      `Processing image ${i + 1} of ${files.length} (${file.name})...`
    );

    const arrayBuffer = await file.arrayBuffer();
    let image;

    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    const isJpg = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');

    if (isPng) {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else if (isJpg) {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else {
      // For WebP, GIF, SVG, BMP: convert to PNG canvas first
      const dataUrl = await fileToDataUrl(file);
      const pngBytes = await imageToPngBytes(dataUrl);
      image = await pdfDoc.embedPng(pngBytes);
    }

    const imgWidth = image.width;
    const imgHeight = image.height;

    let pageWidth: number;
    let pageHeight: number;

    if (pageSize === 'fit') {
      pageWidth = imgWidth + margin * 2;
      pageHeight = imgHeight + margin * 2;
    } else {
      const standard = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
      let isLandscape = false;
      if (orientation === 'landscape') {
        isLandscape = true;
      } else if (orientation === 'portrait') {
        isLandscape = false;
      } else {
        // Auto
        isLandscape = imgWidth > imgHeight;
      }

      pageWidth = isLandscape ? standard.height : standard.width;
      pageHeight = isLandscape ? standard.width : standard.height;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate dimensions with aspect ratio preserved inside margins
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const scale = Math.min(usableWidth / imgWidth, usableHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const x = margin + (usableWidth - drawWidth) / 2;
    const y = margin + (usableHeight - drawHeight) / 2;

    page.drawImage(image, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  onProgress?.(95, 'Assembling PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  const baseName = files.length === 1 
    ? files[0].name.replace(/\.[^/.]+$/, '') 
    : `converted_images_${files.length}_pages`;

  onProgress?.(100, 'PDF created successfully!');
  return {
    blob,
    fileName: `${baseName}.pdf`,
  };
}

/**
 * 2. Convert Word (.docx) to PDF
 */
export async function convertDocxToPdf(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(15, 'Parsing Word (.docx) structure...');
  const arrayBuffer = await file.arrayBuffer();

  const mammothResult = await mammoth.convertToHtml({ arrayBuffer });
  const html = mammothResult.value;

  onProgress?.(45, 'Rendering document to PDF pages...');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  // Render HTML to PDF using jsPDF HTML engine with styled container
  const container = document.createElement('div');
  container.style.width = '555pt';
  container.style.padding = '40pt 40pt';
  container.style.color = '#1e293b';
  container.style.fontFamily = 'Helvetica, Arial, sans-serif';
  container.style.fontSize = '11pt';
  container.style.lineHeight = '1.6';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = `
    <h1 style="font-size: 20pt; color: #0f172a; margin-bottom: 16pt; font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 8pt;">${baseName}</h1>
    <div style="font-size: 11pt; line-height: 1.6;">${html || '<p>Empty Document</p>'}</div>
  `;
  document.body.appendChild(container);

  try {
    await doc.html(container, {
      callback: () => {},
      x: 20,
      y: 20,
      width: 555,
      windowWidth: 800,
      autoPaging: 'text',
      margin: [30, 20, 30, 20],
    });
  } finally {
    document.body.removeChild(container);
  }

  onProgress?.(90, 'Finalizing PDF output...');
  const pdfBlob = doc.output('blob');
  onProgress?.(100, 'DOCX to PDF conversion complete!');

  return {
    blob: pdfBlob,
    fileName: `${baseName}.pdf`,
  };
}

/**
 * 3. Convert Markdown (.md) or Text (.txt) to PDF
 */
export async function convertTextOrMarkdownToPdf(
  file: File,
  isMarkdown: boolean,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(15, `Reading ${isMarkdown ? 'Markdown' : 'Text'} file...`);
  const rawText = await file.text();
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  let parsedHtml = '';
  if (isMarkdown) {
    onProgress?.(35, 'Compiling Markdown elements...');
    parsedHtml = await marked.parse(rawText);
  } else {
    // Plain text: escape and preserve line breaks
    parsedHtml = rawText
      .split('\n')
      .map(line => `<p style="margin: 4pt 0;">${escapeHtml(line) || '&nbsp;'}</p>`)
      .join('');
  }

  onProgress?.(60, 'Rendering styled PDF pages...');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const container = document.createElement('div');
  container.style.width = '555pt';
  container.style.padding = '30pt 30pt';
  container.style.color = '#1e293b';
  container.style.fontFamily = 'Helvetica, Arial, sans-serif';
  container.style.fontSize = '10.5pt';
  container.style.lineHeight = '1.6';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = `
    <style>
      h1 { font-size: 18pt; color: #0f172a; margin-top: 14pt; margin-bottom: 10pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt; }
      h2 { font-size: 15pt; color: #1e293b; margin-top: 12pt; margin-bottom: 8pt; }
      h3 { font-size: 13pt; color: #334155; margin-top: 10pt; margin-bottom: 6pt; }
      p { margin: 6pt 0; font-size: 10.5pt; }
      ul, ol { margin: 6pt 0 6pt 20pt; }
      li { margin: 3pt 0; }
      code { background-color: #f1f5f9; padding: 2pt 4pt; border-radius: 3pt; font-family: monospace; font-size: 9.5pt; }
      pre { background-color: #0f172a; color: #f8fafc; padding: 10pt; border-radius: 6pt; overflow-x: auto; font-size: 9.5pt; font-family: monospace; }
      pre code { background: none; color: inherit; padding: 0; }
      blockquote { border-left: 3pt solid #6366f1; padding-left: 10pt; color: #64748b; margin: 8pt 0; font-style: italic; }
      table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
      th, td { border: 1px solid #cbd5e1; padding: 6pt 8pt; text-align: left; font-size: 9.5pt; }
      th { background-color: #f8fafc; font-weight: bold; }
    </style>
    <h1>${baseName}</h1>
    ${parsedHtml}
  `;
  document.body.appendChild(container);

  try {
    await doc.html(container, {
      callback: () => {},
      x: 20,
      y: 20,
      width: 555,
      windowWidth: 800,
      autoPaging: 'text',
      margin: [30, 20, 30, 20],
    });
  } finally {
    document.body.removeChild(container);
  }

  onProgress?.(90, 'Finalizing document...');
  const pdfBlob = doc.output('blob');
  onProgress?.(100, 'Conversion completed!');

  return {
    blob: pdfBlob,
    fileName: `${baseName}.pdf`,
  };
}

/**
 * 4. Convert Spreadsheet (Excel .xlsx, .csv) to PDF
 */
export async function convertSpreadsheetToPdf(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(15, 'Reading workbook data...');
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  const sheetNames = wb.SheetNames;
  if (sheetNames.length === 0) throw new Error('No sheets found in spreadsheet');

  onProgress?.(40, 'Formatting tabular pages...');
  const doc = new jsPDF({
    orientation: 'landscape', // Landscape for wide tables
    unit: 'pt',
    format: 'a4',
  });

  const container = document.createElement('div');
  container.style.width = '800pt';
  container.style.padding = '25pt';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Helvetica, Arial, sans-serif';
  container.style.backgroundColor = '#ffffff';

  let sheetsHtml = `<h1 style="font-size: 18pt; margin-bottom: 12pt; border-bottom: 2px solid #cbd5e1; padding-bottom: 6pt;">${baseName}</h1>`;

  for (const sheetName of sheetNames) {
    const ws = wb.Sheets[sheetName];
    const data: (string | number)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (data.length === 0) continue;

    sheetsHtml += `
      <div style="margin-bottom: 24pt;">
        <h2 style="font-size: 13pt; color: #4338ca; margin-bottom: 8pt; font-weight: bold;">Sheet: ${sheetName}</h2>
        <table style="border-collapse: collapse; width: 100%; font-size: 8.5pt;">
          <tbody>
            ${data.map((row, rIdx) => {
              const isHeader = rIdx === 0;
              return `
                <tr style="background-color: ${isHeader ? '#f1f5f9' : rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  ${row.map(cell => `
                    <${isHeader ? 'th' : 'td'} style="border: 1px solid #cbd5e1; padding: 4pt 6pt; text-align: left; ${isHeader ? 'font-weight: bold; color: #0f172a;' : ''}">
                      ${escapeHtml(String(cell ?? ''))}
                    </${isHeader ? 'th' : 'td'}>
                  `).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = sheetsHtml;
  document.body.appendChild(container);

  try {
    await doc.html(container, {
      callback: () => {},
      x: 20,
      y: 20,
      width: 790,
      windowWidth: 1100,
      autoPaging: 'text',
      margin: [25, 20, 25, 20],
    });
  } finally {
    document.body.removeChild(container);
  }

  onProgress?.(90, 'Generating PDF...');
  const pdfBlob = doc.output('blob');
  onProgress?.(100, 'Spreadsheet to PDF conversion complete!');

  return {
    blob: pdfBlob,
    fileName: `${baseName}.pdf`,
  };
}

/**
 * 5. Convert HTML / Webpage / Code to PDF
 */
export async function convertHtmlToPdf(
  file: File,
  options: ConversionOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; fileName: string }> {
  onProgress?.(20, 'Reading HTML file...');
  const rawHtml = await file.text();
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  onProgress?.(50, 'Rendering HTML elements to PDF...');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const container = document.createElement('div');
  container.style.width = '555pt';
  container.style.padding = '30pt';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = rawHtml;
  document.body.appendChild(container);

  try {
    await doc.html(container, {
      callback: () => {},
      x: 20,
      y: 20,
      width: 555,
      windowWidth: 850,
      autoPaging: 'text',
      margin: [30, 20, 30, 20],
    });
  } finally {
    document.body.removeChild(container);
  }

  onProgress?.(90, 'Finalizing output...');
  const pdfBlob = doc.output('blob');
  onProgress?.(100, 'HTML to PDF completed!');

  return {
    blob: pdfBlob,
    fileName: `${baseName}.pdf`,
  };
}

// Helpers
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function imageToPngBytes(dataUrl: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context error'));
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return reject(new Error('Blob creation failed'));
        const buffer = await blob.arrayBuffer();
        resolve(buffer);
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
