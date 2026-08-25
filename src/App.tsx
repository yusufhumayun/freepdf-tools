/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ConversionCategory, 
  FileItem, 
  TargetFormat, 
  ConversionOptions 
} from './types/converter';
import { 
  detectSourceFormat, 
  getAvailableTargetFormats, 
  downloadBlob 
} from './utils/formatHelpers';
import { 
  convertPdfToDocx, 
  convertPdfToImages, 
  convertPdfToTxt, 
  convertPdfToMarkdown, 
  convertPdfToHtml, 
  convertPdfToSpreadsheet,
  generatePdfThumbnails,
  loadPdfDocument
} from './services/pdfToFormat';
import { 
  convertImagesToPdf, 
  convertDocxToPdf, 
  convertTextOrMarkdownToPdf, 
  convertSpreadsheetToPdf, 
  convertHtmlToPdf 
} from './services/formatToPdf';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { FileItemCard } from './components/FileItemCard';
import { BatchSummaryBar } from './components/BatchSummaryBar';
import { PdfToolsHub } from './components/PdfToolsHub';
import { ConversionMatrix } from './components/ConversionMatrix';
import { PageOrganizerModal } from './components/PageOrganizerModal';
import { FeedbackModal } from './components/FeedbackModal';
import { ImageSignatureSuite } from './components/ImageSignatureSuite';
import { PdfSignaturePad } from './components/PdfSignaturePad';
import { OcrExtractSuite } from './components/OcrExtractSuite';
import { FaqSection } from './components/FaqSection';
import { 
  ShieldCheck, 
  Zap, 
  Layers, 
  Sparkles,
  Lock,
  ArrowRightLeft,
  ClipboardCheck,
  Share2,
  MessageSquare
} from 'lucide-react';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<ConversionCategory>('pdf-to-other');
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  const [organizerTargetItem, setOrganizerTargetItem] = useState<FileItem | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackDefaultTab, setFeedbackDefaultTab] = useState<'feedback' | 'share'>('feedback');
  const [clipboardToast, setClipboardToast] = useState<string | null>(null);

  // Sync state with URL hash on mount & hash change for SEO deep-linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['pdf-to-other', 'other-to-pdf', 'ocr', 'image-suite', 'sign-pdf', 'pdf-tools'].includes(hash)) {
        setActiveCategory(hash as ConversionCategory);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Update URL hash when category changes
  const handleSelectCategory = (cat: ConversionCategory) => {
    setActiveCategory(cat);
    window.location.hash = cat;
  };

  // Global Clipboard Paste (Ctrl+V / Cmd+V) Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const pastedFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        handleFilesSelected(pastedFiles);
        setClipboardToast(`Pasted ${pastedFiles.length} file(s) from clipboard!`);
        setTimeout(() => setClipboardToast(null), 3000);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Handle new files dropped or selected
  const handleFilesSelected = async (newFiles: File[]) => {
    const createdItems: FileItem[] = [];

    for (const file of newFiles) {
      const sourceFormat = detectSourceFormat(file);
      const availableTargets = getAvailableTargetFormats(sourceFormat);
      const defaultTarget: TargetFormat = sourceFormat === 'pdf' ? 'docx' : 'pdf';

      const defaultOptions: ConversionOptions = {
        dpiScale: 2.0,
        imageFormat: 'png',
        preserveFormatting: true,
        extractTables: true,
        pageSize: 'a4',
        orientation: 'auto',
        margin: 'none',
      };

      const item: FileItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        sourceFormat,
        targetFormat: defaultTarget,
        status: 'idle',
        progress: 0,
        options: defaultOptions,
      };

      // If PDF, extract page count and thumbnails asynchronously
      if (sourceFormat === 'pdf') {
        loadPdfDocument(file)
          .then(async (pdf) => {
            const pageCount = pdf.numPages;
            const thumbnails = await generatePdfThumbnails(file, 4);
            setFileItems((prev) =>
              prev.map((it) =>
                it.id === item.id ? { ...it, pageCount, thumbnails } : it
              )
            );
          })
          .catch(() => {});
      }

      createdItems.push(item);
    }

    setFileItems((prev) => [...prev, ...createdItems]);
  };

  // Update target format for a specific item
  const handleUpdateTargetFormat = (id: string, format: TargetFormat) => {
    setFileItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, targetFormat: format, status: 'idle', resultBlob: undefined } : item
      )
    );
  };

  // Update options for a specific item
  const handleUpdateOptions = (id: string, options: Partial<ConversionOptions>) => {
    setFileItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, options: { ...item.options, ...options } }
          : item
      )
    );
  };

  // Remove a single item
  const handleRemoveItem = (id: string) => {
    setFileItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear all items
  const handleClearAll = () => {
    setFileItems([]);
  };

  // Set all target formats in batch
  const handleSetAllTargetFormats = (format: TargetFormat) => {
    setFileItems((prev) =>
      prev.map((item) =>
        item.sourceFormat === 'pdf'
          ? { ...item, targetFormat: format, status: 'idle', resultBlob: undefined }
          : item
      )
    );
  };

  // Core conversion execution for a single item
  const executeConversion = async (item: FileItem): Promise<boolean> => {
    const updateProgress = (progress: number, statusMessage?: string) => {
      setFileItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, progress, statusMessage } : it
        )
      );
    };

    setFileItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? { ...it, status: 'converting', progress: 5, statusMessage: 'Starting conversion...' }
          : it
      )
    );

    try {
      let resultBlob: Blob;
      let resultFileName: string;

      // 1. PDF TO OTHER FORMATS
      if (item.sourceFormat === 'pdf') {
        switch (item.targetFormat) {
          case 'docx': {
            const res = await convertPdfToDocx(item.file, item.options, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          case 'png':
          case 'jpg':
          case 'webp': {
            const imgOptions = { ...item.options, imageFormat: item.targetFormat as any };
            const res = await convertPdfToImages(item.file, imgOptions, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          case 'txt': {
            const res = await convertPdfToTxt(item.file, item.options, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          case 'md': {
            const res = await convertPdfToMarkdown(item.file, item.options, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          case 'html': {
            const res = await convertPdfToHtml(item.file, item.options, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          case 'xlsx':
          case 'csv':
          case 'json': {
            const res = await convertPdfToSpreadsheet(item.file, item.targetFormat, item.options, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          default:
            throw new Error(`Unsupported target format: ${item.targetFormat}`);
        }
      } 
      // 2. OTHER FORMATS TO PDF
      else {
        switch (item.sourceFormat) {
          case 'image': {
            const res = await convertImagesToPdf([item.file], item.options, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          case 'docx': {
            const res = await convertDocxToPdf(item.file, item.options, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          case 'md':
          case 'txt': {
            const res = await convertTextOrMarkdownToPdf(item.file, item.sourceFormat === 'md', item.options, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          case 'xlsx':
          case 'csv': {
            const res = await convertSpreadsheetToPdf(item.file, item.options, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          case 'html':
          case 'json': {
            const res = await convertHtmlToPdf(item.file, item.options, updateProgress);
            resultBlob = res.blob;
            resultFileName = res.fileName;
            break;
          }
          default:
            throw new Error(`Unsupported source format: ${item.sourceFormat}`);
        }
      }

      setFileItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'completed',
                progress: 100,
                statusMessage: 'Ready for download',
                resultBlob,
                resultFileName,
              }
            : it
        )
      );
      return true;
    } catch (err: any) {
      console.error('Conversion failed for item:', item.name, err);
      setFileItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'error',
                progress: 0,
                error: err.message || 'Conversion failed. Please verify the file is valid.',
              }
            : it
        )
      );
      return false;
    }
  };

  // Convert a single item by id
  const handleConvertSingle = async (id: string) => {
    const item = fileItems.find((it) => it.id === id);
    if (!item) return;
    await executeConversion(item);
  };

  // Batch convert all pending files
  const handleConvertAll = async () => {
    const pendingItems = fileItems.filter((it) => it.status !== 'completed');
    if (pendingItems.length === 0) return;

    setIsConvertingAll(true);
    for (const item of pendingItems) {
      await executeConversion(item);
    }
    setIsConvertingAll(false);
  };

  // Combine multiple queued images into 1 single PDF
  const handleCombineAllImagesToSinglePdf = async () => {
    const imageItems = fileItems.filter((it) => it.sourceFormat === 'image');
    if (imageItems.length === 0) return;

    try {
      setIsConvertingAll(true);
      const files = imageItems.map((it) => it.file);
      const options = imageItems[0]?.options || {};
      const { blob, fileName } = await convertImagesToPdf(files, options);
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Failed to combine images to PDF');
    } finally {
      setIsConvertingAll(false);
    }
  };

  const imageCountInQueue = fileItems.filter((it) => it.sourceFormat === 'image').length;

  const handleQuickShare = async () => {
    const getShareUrl = () => {
      const href = window.location.href;
      if (href.includes('github.io/pdf-converter')) {
        return 'https://yusufhumayun.github.io/pdf-converter/';
      }
      const clean = window.location.origin + window.location.pathname;
      return clean.endsWith('/') ? clean : `${clean}/`;
    };

    const shareUrl = getShareUrl();
    const shareTitle = 'FreePDF Tools - Free Online PDF, OCR & Photo KB Suite';
    const shareText = 'Check out FreePDF Tools: 100% Free & Private in-browser PDF, OCR and KB Photo Suite!';

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // User cancelled or fallback to clipboard
      }
    }

    // Fallback: Copy link and display nice toast
    navigator.clipboard.writeText(shareUrl);
    setClipboardToast('Link copied to clipboard! Share it with friends & colleagues 🚀');
    setTimeout(() => setClipboardToast(null), 3500);
  };

  const handleOpenFeedbackModal = (defaultTab: 'feedback' | 'share' = 'feedback') => {
    setFeedbackDefaultTab(defaultTab);
    setIsFeedbackModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-indigo-500 selection:text-white">
      
      {/* Header Bar */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onOpenFeedback={handleOpenFeedbackModal}
        onQuickShare={handleQuickShare}
        fileCount={fileItems.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        
        {/* Dynamic Category View */}
        {activeCategory === 'ocr' ? (
          /* OPTICAL CHARACTER RECOGNITION (OCR) VIEW */
          <div className="space-y-6">
            <OcrExtractSuite />
          </div>
        ) : activeCategory === 'image-suite' ? (
          /* PHOTO & SIGNATURE RESIZER VIEW */
          <div className="space-y-6">
            <ImageSignatureSuite />
          </div>
        ) : activeCategory === 'sign-pdf' ? (
          /* PDF SIGNATURE & STAMP PAD VIEW */
          <div className="space-y-6">
            <PdfSignaturePad />
          </div>
        ) : activeCategory === 'pdf-tools' ? (
          /* PDF TOOLBOX VIEW */
          <div className="space-y-6">
            <PdfToolsHub />
          </div>
        ) : (
          /* CONVERSION WORKFLOW VIEW */
          <div className="space-y-6">
            
            {/* Drop Zone Area */}
            <DropZone
              category={activeCategory}
              onFilesSelected={handleFilesSelected}
              disabled={isConvertingAll}
            />

            {/* Special Action: Combine multi-images into 1 PDF */}
            {activeCategory === 'other-to-pdf' && imageCountInQueue >= 2 && (
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center space-x-3 text-xs sm:text-sm">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                    {imageCountInQueue}
                  </div>
                  <div>
                    <p className="font-semibold text-white">Combine all {imageCountInQueue} images into 1 multi-page PDF?</p>
                    <p className="text-slate-400 text-xs">Assemble pages in one single document with custom orientation and margins.</p>
                  </div>
                </div>
                <button
                  onClick={handleCombineAllImagesToSinglePdf}
                  disabled={isConvertingAll}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 transition shrink-0 cursor-pointer"
                >
                  Combine into 1 PDF
                </button>
              </div>
            )}

            {/* Active Queue List */}
            {fileItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Conversion Queue ({fileItems.length})</span>
                  </h3>
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-slate-500 hover:text-red-400 transition cursor-pointer"
                  >
                    Clear queue
                  </button>
                </div>

                <div className="space-y-3">
                  {fileItems.map((item) => (
                    <FileItemCard
                      key={item.id}
                      item={item}
                      onUpdateTargetFormat={handleUpdateTargetFormat}
                      onUpdateOptions={handleUpdateOptions}
                      onConvertSingle={handleConvertSingle}
                      onRemove={handleRemoveItem}
                      onOpenOrganizer={(target) => setOrganizerTargetItem(target)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sticky Bottom Batch Summary & Controls */}
            <BatchSummaryBar
              items={fileItems}
              onConvertAll={handleConvertAll}
              onClearAll={handleClearAll}
              onSetAllTargetFormats={handleSetAllTargetFormats}
              isConvertingAll={isConvertingAll}
            />

            {/* Feature matrix & format overview */}
            {fileItems.length === 0 && (
              <ConversionMatrix onSelectCategory={handleSelectCategory} />
            )}

          </div>
        )}

        {/* Global SEO Rich FAQ & Guides Section */}
        <FaqSection />

      </main>

      {/* Floating Clipboard Toast */}
      {clipboardToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-indigo-600 text-white font-medium text-xs sm:text-sm shadow-xl shadow-indigo-600/40 flex items-center gap-2 animate-bounce">
          <ClipboardCheck className="w-4 h-4 text-emerald-300" />
          <span>{clipboardToast}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-400">
              Zero-Server Architecture: All conversions, OCR, and optimizations run strictly inside your browser memory.
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleOpenFeedbackModal('feedback')}
              className="text-slate-400 hover:text-slate-200 transition flex items-center space-x-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Contact & Feedback</span>
            </button>

            <button
              onClick={() => handleOpenFeedbackModal('share')}
              className="text-slate-400 hover:text-slate-200 transition flex items-center space-x-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Share App</span>
            </button>

            <a
              href="#faq"
              className="text-slate-400 hover:text-slate-200 transition"
            >
              Privacy & FAQ
            </a>
          </div>
        </div>
      </footer>

      {/* Feedback & Share Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        defaultTab={feedbackDefaultTab}
      />

      {/* Page Organizer Modal */}
      <PageOrganizerModal
        item={organizerTargetItem}
        isOpen={!!organizerTargetItem}
        onClose={() => setOrganizerTargetItem(null)}
      />

    </div>
  );
}
