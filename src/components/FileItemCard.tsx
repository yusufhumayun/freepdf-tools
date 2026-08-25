import React, { useState } from 'react';
import { FileItem, TargetFormat } from '../types/converter';
import { TARGET_FORMATS, formatBytes, downloadBlob, getAvailableTargetFormats } from '../utils/formatHelpers';
import { 
  Download, 
  Trash2, 
  Settings2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Play, 
  Eye,
  ChevronDown,
  Sparkles,
  Layers
} from 'lucide-react';

interface FileItemCardProps {
  item: FileItem;
  onUpdateTargetFormat: (id: string, format: TargetFormat) => void;
  onUpdateOptions: (id: string, options: Partial<FileItem['options']>) => void;
  onConvertSingle: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenOrganizer?: (item: FileItem) => void;
}

export const FileItemCard: React.FC<FileItemCardProps> = ({
  item,
  onUpdateTargetFormat,
  onUpdateOptions,
  onConvertSingle,
  onRemove,
  onOpenOrganizer,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const availableFormats = getAvailableTargetFormats(item.sourceFormat);
  const targetConfig = TARGET_FORMATS[item.targetFormat] || TARGET_FORMATS.pdf;

  const isConverting = item.status === 'converting';
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      isCompleted 
        ? 'border-emerald-500/30 bg-slate-900/90 shadow-lg shadow-emerald-500/5'
        : isConverting
        ? 'border-indigo-500/50 bg-slate-900/90 shadow-lg shadow-indigo-500/10'
        : isError
        ? 'border-red-500/30 bg-slate-900/90'
        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80 shadow-md'
    }`}>
      
      {/* Top Main Row */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: File Icon & Metadata */}
        <div className="flex items-start space-x-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-xs shadow-inner">
            {item.sourceFormat.toUpperCase()}
          </div>

          <div className="min-w-0 space-y-1">
            <h4 className="font-semibold text-sm sm:text-base text-white truncate" title={item.name}>
              {item.name}
            </h4>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{formatBytes(item.size)}</span>
              {item.pageCount ? (
                <>
                  <span>•</span>
                  <span className="text-indigo-300 font-medium">{item.pageCount} Pages</span>
                </>
              ) : null}
              {isCompleted && item.resultBlob && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Result: {formatBytes(item.resultBlob.size)}</span>
                </>
              )}
            </div>

            {/* Thumbnails preview strip if available */}
            {item.thumbnails && item.thumbnails.length > 0 && (
              <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto pb-1">
                {item.thumbnails.slice(0, 4).map((thumb, idx) => (
                  <img
                    key={idx}
                    src={thumb}
                    alt={`Page ${idx + 1}`}
                    className="w-8 h-11 object-cover rounded border border-slate-700 shadow-sm shrink-0 bg-white"
                  />
                ))}
                {item.thumbnails.length > 4 && (
                  <span className="text-[10px] text-slate-500 font-medium px-1">
                    +{item.thumbnails.length - 4} more
                  </span>
                )}
                {onOpenOrganizer && item.sourceFormat === 'pdf' && (
                  <button
                    onClick={() => onOpenOrganizer(item)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium px-1 ml-1"
                  >
                    Organize Pages
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Target Selector & Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 shrink-0">
          
          {/* Target Format Selector (if PDF source) */}
          {availableFormats.length > 1 && !isCompleted && !isConverting && (
            <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
              <span className="text-xs text-slate-400 font-medium">Convert to:</span>
              <select
                value={item.targetFormat}
                onChange={(e) => onUpdateTargetFormat(item.id, e.target.value as TargetFormat)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-indigo-300 focus:outline-none cursor-pointer"
              >
                {availableFormats.map((fmt) => (
                  <option key={fmt} value={fmt} className="bg-slate-900 text-slate-200">
                    {TARGET_FORMATS[fmt]?.name || fmt.toUpperCase()} ({TARGET_FORMATS[fmt]?.badge})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Display or Conversion Controls */}
          {isConverting ? (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs sm:text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>{item.statusMessage || `Converting (${item.progress}%)...`}</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center space-x-2">
              <button
                id={`btn-download-${item.id}`}
                onClick={() => {
                  if (item.resultBlob && item.resultFileName) {
                    downloadBlob(item.resultBlob, item.resultFileName);
                  }
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 transition duration-150"
              >
                <Download className="w-4 h-4" />
                <span>Download {targetConfig.badge}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {/* Settings Toggle */}
              <button
                id={`btn-settings-${item.id}`}
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl border transition ${
                  showSettings
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
                title="Conversion Quality & Layout Settings"
              >
                <Settings2 className="w-4 h-4" />
              </button>

              {/* Convert Single Button */}
              <button
                id={`btn-convert-${item.id}`}
                onClick={() => onConvertSingle(item.id)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 transition duration-150"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Convert</span>
              </button>
            </div>
          )}

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.id)}
            disabled={isConverting}
            className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-800/60 transition disabled:opacity-40"
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Progress Bar (Visible while converting) */}
      {isConverting && (
        <div className="w-full bg-slate-800/80 h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(item.progress, 5)}%` }}
          />
        </div>
      )}

      {/* Error Banner */}
      {isError && (
        <div className="px-5 py-2.5 bg-red-950/40 border-t border-red-500/20 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{item.error || 'Failed to convert file. Please try again.'}</span>
          </div>
          <button
            onClick={() => onConvertSingle(item.id)}
            className="text-red-400 hover:text-red-200 underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Settings Drawer */}
      {showSettings && !isConverting && !isCompleted && (
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/60 space-y-4 text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Conversion Options for {targetConfig.name}</span>
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-white"
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Format specific: PDF to Images settings */}
            {(item.targetFormat === 'png' || item.targetFormat === 'jpg' || item.targetFormat === 'webp') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Image Resolution (DPI)</label>
                  <select
                    value={item.options.dpiScale || 2.0}
                    onChange={(e) => onUpdateOptions(item.id, { dpiScale: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1.0">Standard 72 DPI (Fastest, smaller)</option>
                    <option value="2.0">High-Res 144 DPI (Crisp, Recommended)</option>
                    <option value="3.0">Ultra-High 216 DPI (Print Quality)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Page Range (e.g. 1-3, 5)</label>
                  <input
                    type="text"
                    placeholder="All pages (e.g. 1-5)"
                    value={item.options.pageRange || ''}
                    onChange={(e) => onUpdateOptions(item.id, { pageRange: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            {/* Format specific: Other to PDF settings */}
            {item.targetFormat === 'pdf' && item.sourceFormat === 'image' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Page Size</label>
                  <select
                    value={item.options.pageSize || 'a4'}
                    onChange={(e) => onUpdateOptions(item.id, { pageSize: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="a4">A4 (Standard 210 x 297 mm)</option>
                    <option value="letter">US Letter (8.5 x 11 in)</option>
                    <option value="fit">Fit to Image Aspect Ratio</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Orientation</label>
                  <select
                    value={item.options.orientation || 'auto'}
                    onChange={(e) => onUpdateOptions(item.id, { orientation: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="auto">Auto-Detect per image</option>
                    <option value="portrait">Force Portrait</option>
                    <option value="landscape">Force Landscape</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-medium">Page Margins</label>
                  <select
                    value={item.options.margin || 'none'}
                    onChange={(e) => onUpdateOptions(item.id, { margin: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="none">No Margins (Edge-to-edge)</option>
                    <option value="small">Small Margin (18pt)</option>
                    <option value="normal">Standard Margin (36pt)</option>
                  </select>
                </div>
              </>
            )}

            {/* Format specific: PDF to DOCX / Data */}
            {item.targetFormat === 'docx' && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-slate-400 font-medium">Table & Structure Extraction</label>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id={`table-extract-${item.id}`}
                    checked={item.options.extractTables !== false}
                    onChange={(e) => onUpdateOptions(item.id, { extractTables: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor={`table-extract-${item.id}`} className="text-slate-300">
                    Auto-detect and convert aligned data columns into Word tables
                  </label>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
