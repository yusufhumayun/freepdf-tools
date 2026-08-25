import React from 'react';
import { FileItem, TargetFormat } from '../types/converter';
import { TARGET_FORMATS, formatBytes, downloadBlob } from '../utils/formatHelpers';
import JSZip from 'jszip';
import { Play, Download, Trash2, CheckCircle, Loader2, Sparkles, Layers } from 'lucide-react';

interface BatchSummaryBarProps {
  items: FileItem[];
  onConvertAll: () => void;
  onClearAll: () => void;
  onSetAllTargetFormats: (format: TargetFormat) => void;
  isConvertingAll: boolean;
}

export const BatchSummaryBar: React.FC<BatchSummaryBarProps> = ({
  items,
  onConvertAll,
  onClearAll,
  onSetAllTargetFormats,
  isConvertingAll,
}) => {
  if (items.length === 0) return null;

  const totalSize = items.reduce((acc, it) => acc + it.size, 0);
  const completedItems = items.filter((it) => it.status === 'completed');
  const pendingItems = items.filter((it) => it.status === 'idle');
  const errorItems = items.filter((it) => it.status === 'error');

  const handleDownloadAllZip = async () => {
    if (completedItems.length === 0) return;

    if (completedItems.length === 1 && completedItems[0].resultBlob && completedItems[0].resultFileName) {
      downloadBlob(completedItems[0].resultBlob, completedItems[0].resultFileName);
      return;
    }

    const zip = new JSZip();
    for (const item of completedItems) {
      if (item.resultBlob && item.resultFileName) {
        zip.file(item.resultFileName, item.resultBlob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `OmniPDF_Batch_Export_${completedItems.length}_files.zip`);
  };

  const isAllPdfSource = items.every((it) => it.sourceFormat === 'pdf');

  return (
    <div className="sticky bottom-4 z-20 rounded-2xl bg-slate-900/95 border border-indigo-500/30 p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200">
      
      {/* Left: Summary Stats & Global Target Format Switcher */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="font-semibold text-white">{items.length} Files</span>
            <span>•</span>
            <span>{formatBytes(totalSize)}</span>
            {completedItems.length > 0 && (
              <>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{completedItems.length} Ready</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            All conversions processed 100% in your browser
          </p>
        </div>

        {/* Bulk Format Selector (if PDF files) */}
        {isAllPdfSource && pendingItems.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Set all to:</span>
            <select
              onChange={(e) => onSetAllTargetFormats(e.target.value as TargetFormat)}
              className="bg-transparent text-indigo-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="docx" className="bg-slate-900">Word (.docx)</option>
              <option value="png" className="bg-slate-900">PNG Images (.png)</option>
              <option value="jpg" className="bg-slate-900">JPG Images (.jpg)</option>
              <option value="xlsx" className="bg-slate-900">Excel (.xlsx)</option>
              <option value="csv" className="bg-slate-900">CSV Data (.csv)</option>
              <option value="txt" className="bg-slate-900">Text (.txt)</option>
              <option value="md" className="bg-slate-900">Markdown (.md)</option>
              <option value="html" className="bg-slate-900">HTML (.html)</option>
              <option value="json" className="bg-slate-900">JSON (.json)</option>
            </select>
          </div>
        )}
      </div>

      {/* Right: Actions (Convert All, Download All ZIP, Clear) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
        <button
          onClick={onClearAll}
          disabled={isConvertingAll}
          className="px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 text-xs sm:text-sm font-medium transition disabled:opacity-40"
        >
          Clear All
        </button>

        {completedItems.length > 0 && (
          <button
            id="btn-download-all-zip"
            onClick={handleDownloadAllZip}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 transition duration-150"
          >
            <Download className="w-4 h-4" />
            <span>Download All ({completedItems.length})</span>
          </button>
        )}

        {pendingItems.length > 0 && (
          <button
            id="btn-convert-all"
            onClick={onConvertAll}
            disabled={isConvertingAll}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 transition duration-150 disabled:opacity-50"
          >
            {isConvertingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Converting...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Convert All ({pendingItems.length})</span>
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
};
