export type ConversionCategory = 
  | 'pdf-to-other' 
  | 'other-to-pdf' 
  | 'ocr'
  | 'image-suite' 
  | 'sign-pdf' 
  | 'pdf-tools';

export type TargetFormat = 
  | 'docx' 
  | 'png' 
  | 'jpg' 
  | 'webp' 
  | 'txt' 
  | 'md' 
  | 'html' 
  | 'xlsx' 
  | 'csv' 
  | 'json'
  | 'pdf';

export type SourceFormat = 
  | 'pdf' 
  | 'image' 
  | 'docx' 
  | 'txt' 
  | 'md' 
  | 'xlsx' 
  | 'csv' 
  | 'html' 
  | 'json';

export type PdfToolAction = 
  | 'merge' 
  | 'split' 
  | 'compress' 
  | 'watermark' 
  | 'rotate' 
  | 'organize';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  sourceFormat: SourceFormat;
  targetFormat: TargetFormat;
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  statusMessage?: string;
  error?: string;
  resultBlob?: Blob;
  resultFileName?: string;
  resultUrl?: string;
  previewUrl?: string;
  pageCount?: number;
  thumbnails?: string[];
  options: ConversionOptions;
}

export interface ConversionOptions {
  // Image to PDF options
  pageSize?: 'a4' | 'letter' | 'fit' | 'legal';
  orientation?: 'portrait' | 'landscape' | 'auto';
  margin?: 'none' | 'small' | 'normal';
  imageQuality?: number; // 0.1 to 1.0

  // PDF to Image options
  dpiScale?: number; // 1 (72dpi), 1.5, 2 (144dpi), 3 (216dpi)
  imageFormat?: 'png' | 'jpg' | 'jpeg' | 'webp';
  pageRange?: string; // e.g. "1-5, 8"

  // PDF to DOCX / Text options
  preserveFormatting?: boolean;
  extractTables?: boolean;

  // Watermark options
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkFontSize?: number;
  watermarkColor?: string;
  watermarkRotation?: number;

  // Rotation
  rotationDegrees?: 90 | 180 | 270;

  // Compression
  compressionLevel?: 'low' | 'medium' | 'high';
}

export interface FormatConfig {
  id: TargetFormat;
  name: string;
  extension: string;
  mimeType: string;
  iconName: string;
  badge: string;
  category: 'document' | 'image' | 'data' | 'web';
  description: string;
}

export interface PdfPageItem {
  pageNumber: number;
  thumbnailUrl: string;
  rotation: number;
  selected: boolean;
}
