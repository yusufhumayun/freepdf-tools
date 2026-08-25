import { FormatConfig, SourceFormat, TargetFormat } from '../types/converter';

export const TARGET_FORMATS: Record<TargetFormat, FormatConfig> = {
  docx: {
    id: 'docx',
    name: 'Word Document',
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    iconName: 'FileText',
    badge: 'DOCX',
    category: 'document',
    description: 'Editable Microsoft Word format with preserved text formatting and tables.',
  },
  png: {
    id: 'png',
    name: 'PNG Images',
    extension: '.png',
    mimeType: 'image/png',
    iconName: 'Image',
    badge: 'PNG',
    category: 'image',
    description: 'Lossless high-resolution page renders with crystal-clear clarity.',
  },
  jpg: {
    id: 'jpg',
    name: 'JPEG Images',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    iconName: 'Image',
    badge: 'JPG',
    category: 'image',
    description: 'Optimized compressed photos and document image renders.',
  },
  webp: {
    id: 'webp',
    name: 'WebP Images',
    extension: '.webp',
    mimeType: 'image/webp',
    iconName: 'Image',
    badge: 'WEBP',
    category: 'image',
    description: 'Next-gen modern web image format with ultra-small file size.',
  },
  xlsx: {
    id: 'xlsx',
    name: 'Excel Spreadsheet',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    iconName: 'Table',
    badge: 'XLSX',
    category: 'data',
    description: 'Structured spreadsheet table extraction for Microsoft Excel.',
  },
  csv: {
    id: 'csv',
    name: 'CSV Data',
    extension: '.csv',
    mimeType: 'text/csv',
    iconName: 'Grid',
    badge: 'CSV',
    category: 'data',
    description: 'Universal comma-separated tabular data for databases and analytics.',
  },
  txt: {
    id: 'txt',
    name: 'Plain Text',
    extension: '.txt',
    mimeType: 'text/plain',
    iconName: 'FileCode',
    badge: 'TXT',
    category: 'document',
    description: 'Clean raw text extraction with page demarcations.',
  },
  md: {
    id: 'md',
    name: 'Markdown',
    extension: '.md',
    mimeType: 'text/markdown',
    iconName: 'Code',
    badge: 'MD',
    category: 'document',
    description: 'Structured Markdown document with headings, bullet lists, and code sections.',
  },
  html: {
    id: 'html',
    name: 'HTML Webpage',
    extension: '.html',
    mimeType: 'text/html',
    iconName: 'Globe',
    badge: 'HTML',
    category: 'web',
    description: 'Responsive styled standalone HTML webpage.',
  },
  json: {
    id: 'json',
    name: 'JSON Data',
    extension: '.json',
    mimeType: 'application/json',
    iconName: 'Braces',
    badge: 'JSON',
    category: 'data',
    description: 'Hierarchical structured JSON data with pages and lines.',
  },
  pdf: {
    id: 'pdf',
    name: 'PDF Document',
    extension: '.pdf',
    mimeType: 'application/pdf',
    iconName: 'FileText',
    badge: 'PDF',
    category: 'document',
    description: 'Standard Portable Document Format ready for print or sharing.',
  },
};

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function detectSourceFormat(file: File): SourceFormat {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith('.pdf') || type.includes('pdf')) return 'pdf';
  if (name.endsWith('.docx') || type.includes('wordprocessingml')) return 'docx';
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || type.includes('spreadsheet') || type.includes('excel')) return 'xlsx';
  if (name.endsWith('.csv') || type.includes('csv')) return 'csv';
  if (name.endsWith('.md') || name.endsWith('.markdown')) return 'md';
  if (name.endsWith('.txt') || type.startsWith('text/plain')) return 'txt';
  if (name.endsWith('.html') || name.endsWith('.htm') || type.includes('html')) return 'html';
  if (name.endsWith('.json') || type.includes('json')) return 'json';
  if (
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.webp') ||
    name.endsWith('.gif') ||
    name.endsWith('.bmp') ||
    name.endsWith('.svg') ||
    type.startsWith('image/')
  ) {
    return 'image';
  }

  return 'txt';
}

export function getAvailableTargetFormats(sourceFormat: SourceFormat): TargetFormat[] {
  if (sourceFormat === 'pdf') {
    return ['docx', 'png', 'jpg', 'webp', 'xlsx', 'csv', 'txt', 'md', 'html', 'json'];
  }
  return ['pdf'];
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Sample file creators for quick testing
export async function createSampleMarkdownFile(): Promise<File> {
  const content = `# Project Overview & Annual Report

Welcome to the **OmniPDF Studio** document summary.

## Key Performance Metrics
Here is the quarter-over-quarter financial growth breakdown:

| Quarter | Revenue ($M) | Growth Rate | Target Met |
| :--- | :--- | :--- | :--- |
| Q1 2026 | $12.4M | +18.4% | Yes |
| Q2 2026 | $15.1M | +21.7% | Yes |
| Q3 2026 | $19.8M | +31.1% | Yes |

### Core Strategic Objectives
* **Ultra-Fast Processing**: Client-side document compilation with zero latency.
* **100% Data Privacy**: No remote server uploads, all memory is freed locally.
* **Multi-Format Versatility**: Effortlessly convert between PDF, Word, Excel, Markdown, and Images.

> *"Simplicity is the prerequisite for reliability."* — Edsger W. Dijkstra

\`\`\`javascript
// Automatic batch processor example
const result = await omniPdf.convert({
  target: 'pdf',
  quality: 0.95
});
\`\`\`
`;
  return new File([content], 'Sample_Report.md', { type: 'text/markdown' });
}

export async function createSampleCsvFile(): Promise<File> {
  const content = `Employee ID,Full Name,Department,Role,Salary,Location
EMP-101,Sarah Jenkins,Engineering,Lead Architect,$165000,San Francisco
EMP-102,David Chen,Design,Principal Product Designer,$145000,New York
EMP-103,Elena Rostova,Data Science,Senior ML Engineer,$155000,London
EMP-104,Marcus Miller,Product,Director of Product,$175000,Austin
EMP-105,Amina Diallo,Operations,Head of Security,$160000,Singapore
`;
  return new File([content], 'Company_Directory.csv', { type: 'text/csv' });
}

export async function createSampleImageFile(): Promise<File> {
  // Generate a stylish gradient banner image
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(0.5, '#6366f1');
  gradient.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 800);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OmniPDF Studio Presentation', 600, 360);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Universal PDF & Document Conversion Engine', 600, 430);

  // Decorative border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 1120, 720);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(b => resolve(b!), 'image/png');
  });

  return new File([blob], 'Sample_Presentation_Slide.png', { type: 'image/png' });
}
