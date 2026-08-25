import React, { useRef, useState } from 'react';
import { ConversionCategory } from '../types/converter';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Code, 
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  createSampleMarkdownFile, 
  createSampleCsvFile, 
  createSampleImageFile 
} from '../utils/formatHelpers';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface DropZoneProps {
  category: ConversionCategory;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  category,
  onFilesSelected,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptString = () => {
    if (category === 'pdf-to-other' || category === 'pdf-tools') {
      return '.pdf,application/pdf';
    }
    return '.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg,.docx,.txt,.md,.xlsx,.xls,.csv,.html,.json';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      onFilesSelected(selected);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  // Generate an authentic sample PDF in memory
  const handleLoadSamplePdf = async () => {
    try {
      setIsGeneratingSample(true);
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Page 1
      const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page1.getSize();

      page1.drawText('OmniPDF Universal Engine Report', {
        x: 50,
        y: height - 80,
        size: 22,
        font: boldFont,
        color: rgb(0.1, 0.15, 0.3),
      });

      page1.drawText('Sample Document for Multi-Format Conversion Testing', {
        x: 50,
        y: height - 110,
        size: 12,
        font,
        color: rgb(0.4, 0.45, 0.55),
      });

      page1.drawLine({
        start: { x: 50, y: height - 125 },
        end: { x: width - 50, y: height - 125 },
        thickness: 1.5,
        color: rgb(0.8, 0.85, 0.9),
      });

      const bodyLines = [
        '1. Executive Summary',
        'This sample multi-page PDF document is generated in-memory to test conversion capabilities.',
        'Convert this document to Microsoft Word (.docx), high-resolution images (.png/.jpg),',
        'structured Excel spreadsheets (.xlsx), plain text (.txt), Markdown (.md), or standalone HTML.',
        '',
        '2. Performance & Architecture',
        '• 100% Client-Side Engine: No cloud servers touch your documents.',
        '• Instantaneous Conversion: Parallel streaming pipelines.',
        '• GitHub Pages Compatible: Zero server costs, infinite scalability.',
        '',
        '3. Tabular Dataset Sample',
        'Product SKU\tCategory\tUnits Sold\tTotal Revenue ($)',
        'SKU-9021\tEnterprise Suite\t1,420\t$284,000',
        'SKU-7742\tCloud Connector\t3,890\t$194,500',
        'SKU-3120\tSecurity Guard\t850\t$127,500',
        'SKU-5510\tAnalytics Pro\t2,100\t$315,000',
      ];

      let curY = height - 160;
      for (const line of bodyLines) {
        const isHeading = line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.');
        const isHeaderRow = line.includes('Product SKU');
        page1.drawText(line, {
          x: 50,
          y: curY,
          size: isHeading ? 14 : isHeaderRow ? 11 : 10.5,
          font: isHeading || isHeaderRow ? boldFont : font,
          color: isHeading ? rgb(0.2, 0.25, 0.4) : isHeaderRow ? rgb(0.1, 0.4, 0.8) : rgb(0.2, 0.2, 0.25),
        });
        curY -= isHeading ? 26 : 20;
      }

      // Page 2
      const page2 = pdfDoc.addPage([595.28, 841.89]);
      page2.drawText('Page 2: Conversion Validation Checklist', {
        x: 50,
        y: height - 80,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.15, 0.3),
      });

      const page2Lines = [
        'Test Scenarios to Try in OmniPDF Studio:',
        '• Click "PDF to Anything" and select Word (.docx) to generate an editable Word document.',
        '• Click "PNG" or "JPG" to render high-DPI raster pages with ZIP download.',
        '• Click "Excel (.xlsx)" or "CSV" to extract the data table from page 1.',
        '• Try the "PDF Toolbox" to add a diagonal watermark, split pages, or rotate.',
      ];

      curY = height - 130;
      for (const line of page2Lines) {
        page2.drawText(line, {
          x: 50,
          y: curY,
          size: 11,
          font,
          color: rgb(0.25, 0.25, 0.3),
        });
        curY -= 24;
      }

      const pdfBytes = await pdfDoc.save();
      const samplePdfFile = new File([pdfBytes], 'OmniPDF_Sample_Document.pdf', { type: 'application/pdf' });
      onFilesSelected([samplePdfFile]);
    } catch (err) {
      console.error('Failed to create sample PDF', err);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const handleLoadSampleMarkdown = async () => {
    const file = await createSampleMarkdownFile();
    onFilesSelected([file]);
  };

  const handleLoadSampleCsv = async () => {
    const file = await createSampleCsvFile();
    onFilesSelected([file]);
  };

  const handleLoadSampleImage = async () => {
    const file = await createSampleImageFile();
    onFilesSelected([file]);
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={getAcceptString()}
        multiple
        className="hidden"
        id="file-upload-input"
        disabled={disabled}
      />

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group overflow-hidden ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-950/30 scale-[1.008]'
            : 'border-slate-700/80 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-600 shadow-xl'
        }`}
      >
        {/* Subtle radial glow background */}
        <div className="absolute inset-0 bg-radial from-indigo-500/5 to-transparent pointer-events-none" />

        <div className="relative flex flex-col items-center justify-center space-y-4">
          
          {/* Animated upload icon */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition duration-300 shadow-md">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base sm:text-lg font-semibold text-white">
              {category === 'pdf-to-other'
                ? 'Drop PDF file(s) here, or browse files'
                : category === 'other-to-pdf'
                ? 'Drop Images, Word, Markdown, Excel, or Text here'
                : 'Drop PDF file(s) here for Merge, Split, or Tools'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              {category === 'pdf-to-other'
                ? 'Supports single or batch PDF conversion to Word, Excel, Images, Markdown, and more'
                : category === 'other-to-pdf'
                ? 'Convert PNG, JPG, WebP, DOCX, MD, TXT, CSV, XLSX, or HTML into PDF'
                : 'Merge multiple PDFs, split into pages, compress size, or apply watermarks'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-indigo-600/30 transition pointer-events-none"
            >
              Select Files
            </button>
            <span className="text-xs text-slate-400">
              or drop them anywhere in this box
            </span>
          </div>

        </div>
      </div>

      {/* Quick Test Drive Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <span className="text-slate-400 font-medium flex items-center">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
          Quick Test Drive (No files? Try these):
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          {category === 'pdf-to-other' || category === 'pdf-tools' ? (
            <button
              id="btn-sample-pdf"
              type="button"
              disabled={isGeneratingSample}
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSamplePdf();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 font-medium transition flex items-center space-x-1"
            >
              <FileText className="w-3 h-3" />
              <span>{isGeneratingSample ? 'Creating PDF...' : 'Sample PDF (with tables)'}</span>
            </button>
          ) : null}

          {category === 'other-to-pdf' ? (
            <>
              <button
                id="btn-sample-image"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSampleImage();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 border border-sky-500/20 font-medium transition flex items-center space-x-1"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Sample Image</span>
              </button>

              <button
                id="btn-sample-markdown"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSampleMarkdown();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 font-medium transition flex items-center space-x-1"
              >
                <Code className="w-3 h-3" />
                <span>Sample Markdown (.md)</span>
              </button>

              <button
                id="btn-sample-csv"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSampleCsv();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/20 font-medium transition flex items-center space-x-1"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Sample CSV Data</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
