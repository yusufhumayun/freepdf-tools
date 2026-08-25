import React, { useEffect, useState } from 'react';
import { FileItem } from '../types/converter';
import { loadPdfDocument } from '../services/pdfToFormat';
import { reorganizePdf } from '../services/pdfTools';
import { downloadBlob } from '../utils/formatHelpers';
import { X, RotateCw, Trash2, ArrowLeft, ArrowRight, Download, Loader2, Check, Sparkles, Layers } from 'lucide-react';

interface PageOrganizerModalProps {
  item: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PageState {
  originalIndex: number; // 0-based
  pageNumber: number; // 1-based display
  thumbnailUrl: string;
  rotation: number; // 0, 90, 180, 270
}

export const PageOrganizerModal: React.FC<PageOrganizerModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [pages, setPages] = useState<PageState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    if (!isOpen || !item || item.sourceFormat !== 'pdf') return;

    let isMounted = true;

    async function loadPages() {
      try {
        setIsLoading(true);
        const pdf = await loadPdfDocument(item!.file);
        const numPages = pdf.numPages;
        const loaded: PageState[] = [];

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.4 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;
          const thumb = canvas.toDataURL('image/jpeg', 0.85);

          loaded.push({
            originalIndex: i - 1,
            pageNumber: i,
            thumbnailUrl: thumb,
            rotation: 0,
          });
        }

        if (isMounted) {
          setPages(loaded);
        }
      } catch (err) {
        console.error('Failed to render pages for organizer', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPages();

    return () => {
      isMounted = false;
    };
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleRotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      alert('You must keep at least 1 page.');
      return;
    }
    setPages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMovePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    setPages(newPages);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const pageSequence = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const { blob, fileName } = await reorganizePdf(
        item.file,
        pageSequence,
        (prog) => setExportProgress(prog)
      );

      downloadBlob(blob, fileName);
      onClose();
    } catch (err) {
      console.error('Reorganization failed', err);
      alert('Failed to export reorganized PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Visual Page Organizer</h3>
              <p className="text-xs text-slate-400">
                Reorder, rotate, or remove pages from <span className="text-indigo-300">{item.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area: Grid of Pages */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm text-slate-400">Loading page thumbnails...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              No pages available to display.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((page, idx) => (
                <div
                  key={`${page.originalIndex}-${idx}`}
                  className="group relative rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 flex flex-col items-center hover:border-indigo-500/50 hover:shadow-lg transition duration-150"
                >
                  {/* Position badge */}
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                    <span className="font-semibold text-slate-300">
                      Page {idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (Orig: {page.originalIndex + 1})
                    </span>
                  </div>

                  {/* Thumbnail with rotation */}
                  <div className="w-full aspect-[3/4] bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-inner relative">
                    <img
                      src={page.thumbnailUrl}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-full object-contain transition-transform duration-200"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                  </div>

                  {/* Action Controls Toolbar */}
                  <div className="w-full flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleMovePage(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
                      title="Move left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleRotatePage(idx)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeletePage(idx)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                      title="Delete page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleMovePage(idx, 'right')}
                      disabled={idx === pages.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
                      title="Move right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs text-slate-400">
            Total Pages: <strong className="text-white">{pages.length}</strong>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm font-medium transition"
            >
              Cancel
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting || pages.length === 0}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF ({exportProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Save & Download Reorganized PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
