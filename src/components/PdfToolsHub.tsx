import React, { useState, useEffect } from 'react';
import { 
  mergePdfFiles, 
  watermarkPdf, 
  rotatePdfPages, 
  splitPdf,
  addPageNumbersToPdf 
} from '../services/pdfTools';
import { 
  unlockPdfDocument, 
  updatePdfMetadata, 
  readPdfMetadata, 
  generateDarkModePdf, 
  cropPdfMargins, 
  applyRedactionsToPdf,
  PdfMetadata,
  RedactionBox
} from '../services/pdfSecurityService';
import { compressPdf } from '../services/pdfToFormat';
import { downloadBlob, formatBytes } from '../utils/formatHelpers';
import { 
  FileStack, 
  Scissors, 
  Stamp, 
  RotateCw, 
  FileDown, 
  Loader2, 
  Upload, 
  Check, 
  Sparkles, 
  ArrowRight,
  Layers,
  ShieldCheck,
  Hash,
  Lock,
  Unlock,
  FileEdit,
  Moon,
  Crop,
  EyeOff,
  Trash2,
  Plus
} from 'lucide-react';

type ToolTab = 
  | 'merge' 
  | 'split' 
  | 'compress' 
  | 'watermark' 
  | 'rotate' 
  | 'numbers'
  | 'unlock'
  | 'metadata'
  | 'darkmode'
  | 'crop'
  | 'redact';

export const PdfToolsHub: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolTab>('merge');

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  // Watermark state
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkRotation, setWatermarkRotation] = useState(45);
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [watermarkProgress, setWatermarkProgress] = useState(0);

  // Rotate state
  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateProgress, setRotateProgress] = useState(0);

  // Compress state
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [compressLevel, setCompressLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [compressResult, setCompressResult] = useState<{ orig: number; next: number } | null>(null);

  // Split state
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitProgress, setSplitProgress] = useState(0);

  // Page Numbers state
  const [numbersFile, setNumbersFile] = useState<File | null>(null);
  const [numbersPosition, setNumbersPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  const [numbersFormat, setNumbersFormat] = useState<'Page {n} of {total}' | '{n} / {total}' | 'Page {n}' | '{n}'>('Page {n} of {total}');
  const [isNumbering, setIsNumbering] = useState(false);
  const [numbersProgress, setNumbersProgress] = useState(0);

  // Unlock PDF state
  const [unlockFile, setUnlockFile] = useState<File | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0);

  // Metadata editor state
  const [metaFile, setMetaFile] = useState<File | null>(null);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaSubject, setMetaSubject] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [stripAllMeta, setStripAllMeta] = useState(false);
  const [isUpdatingMeta, setIsUpdatingMeta] = useState(false);
  const [metaProgress, setMetaProgress] = useState(0);

  // Dark mode inverter state
  const [darkModeFile, setDarkModeFile] = useState<File | null>(null);
  const [isDarkModing, setIsDarkModing] = useState(false);
  const [darkModeProgress, setDarkModeProgress] = useState(0);

  // Margin crop state
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropMargin, setCropMargin] = useState(36); // 36pt = 0.5 inch
  const [isCropping, setIsCropping] = useState(false);
  const [cropProgress, setCropProgress] = useState(0);

  // Redact state
  const [redactFile, setRedactFile] = useState<File | null>(null);
  const [redactions, setRedactions] = useState<RedactionBox[]>([
    { pageNumber: 1, xPercent: 15, yPercent: 20, widthPercent: 70, heightPercent: 4, color: 'black', label: '[CONFIDENTIAL]' },
  ]);
  const [isRedacting, setIsRedacting] = useState(false);
  const [redactProgress, setRedactProgress] = useState(0);

  // Load metadata when meta file is chosen
  useEffect(() => {
    if (metaFile) {
      readPdfMetadata(metaFile).then((data) => {
        setMetaTitle(data.title || '');
        setMetaAuthor(data.author || '');
        setMetaSubject(data.subject || '');
        setMetaKeywords(data.keywords?.join(', ') || '');
      }).catch(() => {});
    }
  }, [metaFile]);

  // Handlers
  const handleMerge = async () => {
    if (mergeFiles.length < 2) return;
    try {
      setIsMerging(true);
      const { blob, fileName } = await mergePdfFiles(mergeFiles, (p) => setMergeProgress(p));
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Merge failed');
    } finally {
      setIsMerging(false);
    }
  };

  const handleWatermark = async () => {
    if (!watermarkFile) return;
    try {
      setIsWatermarking(true);
      const { blob, fileName } = await watermarkPdf(
        watermarkFile,
        {
          watermarkText,
          watermarkOpacity,
          watermarkRotation,
          watermarkFontSize: 44,
        },
        (p) => setWatermarkProgress(p)
      );
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Watermark failed');
    } finally {
      setIsWatermarking(false);
    }
  };

  const handleRotate = async () => {
    if (!rotateFile) return;
    try {
      setIsRotating(true);
      const { blob, fileName } = await rotatePdfPages(rotateFile, rotationAngle, (p) => setRotateProgress(p));
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Rotation failed');
    } finally {
      setIsRotating(false);
    }
  };

  const handleCompress = async () => {
    if (!compressFile) return;
    try {
      setIsCompressing(true);
      setCompressResult(null);
      const { blob, fileName, originalSize, newSize } = await compressPdf(
        compressFile,
        { compressionLevel: compressLevel },
        (p) => setCompressProgress(p)
      );
      setCompressResult({ orig: originalSize, next: newSize });
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Compression failed');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSplit = async () => {
    if (!splitFile) return;
    try {
      setIsSplitting(true);
      const { blob, fileName } = await splitPdf(splitFile, undefined, (p) => setSplitProgress(p));
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Split failed');
    } finally {
      setIsSplitting(false);
    }
  };

  const handleAddPageNumbers = async () => {
    if (!numbersFile) return;
    try {
      setIsNumbering(true);
      const { blob, fileName } = await addPageNumbersToPdf(
        numbersFile,
        { position: numbersPosition, format: numbersFormat },
        (p) => setNumbersProgress(p)
      );
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Page numbering failed');
    } finally {
      setIsNumbering(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockFile) return;
    try {
      setIsUnlocking(true);
      const { blob, fileName } = await unlockPdfDocument(unlockFile, unlockPassword, (p) => setUnlockProgress(p));
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Unlock failed');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!metaFile) return;
    try {
      setIsUpdatingMeta(true);
      const { blob, fileName } = await updatePdfMetadata(
        metaFile,
        {
          title: metaTitle,
          author: metaAuthor,
          subject: metaSubject,
          keywords: metaKeywords,
          stripAll: stripAllMeta,
        },
        (p) => setMetaProgress(p)
      );
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Metadata update failed');
    } finally {
      setIsUpdatingMeta(false);
    }
  };

  const handleDarkMode = async () => {
    if (!darkModeFile) return;
    try {
      setIsDarkModing(true);
      const { blob, fileName } = await generateDarkModePdf(darkModeFile, (p) => setDarkModeProgress(p));
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Dark mode conversion failed');
    } finally {
      setIsDarkModing(false);
    }
  };

  const handleCrop = async () => {
    if (!cropFile) return;
    try {
      setIsCropping(true);
      const { blob, fileName } = await cropPdfMargins(
        cropFile,
        { top: cropMargin, bottom: cropMargin, left: cropMargin, right: cropMargin },
        (p) => setCropProgress(p)
      );
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Crop failed');
    } finally {
      setIsCropping(false);
    }
  };

  const handleRedact = async () => {
    if (!redactFile || redactions.length === 0) return;
    try {
      setIsRedacting(true);
      const { blob, fileName } = await applyRedactionsToPdf(redactFile, redactions, (p) => setRedactProgress(p));
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err.message || 'Redaction failed');
    } finally {
      setIsRedacting(false);
    }
  };

  const addRedactionRow = () => {
    setRedactions((prev) => [
      ...prev,
      {
        pageNumber: 1,
        xPercent: 20,
        yPercent: Math.min(80, (prev.length + 1) * 20),
        widthPercent: 60,
        heightPercent: 4,
        color: 'black',
        label: '[REDACTED]',
      },
    ]);
  };

  const removeRedactionRow = (index: number) => {
    setRedactions((prev) => prev.filter((_, i) => i !== index));
  };

  const tools = [
    { id: 'merge', label: 'Merge PDF', icon: FileStack, desc: 'Combine multiple PDF files into one' },
    { id: 'split', label: 'Split PDF', icon: Scissors, desc: 'Extract pages to individual PDF files' },
    { id: 'compress', label: 'Compress PDF', icon: FileDown, desc: 'Downscale & optimize document size' },
    { id: 'watermark', label: 'Watermark', icon: Stamp, desc: 'Stamp diagonal text or confidentiality' },
    { id: 'numbers', label: 'Page Numbers', icon: Hash, desc: 'Stamp custom page numbering' },
    { id: 'rotate', label: 'Rotate Pages', icon: RotateCw, desc: 'Rotate document 90°, 180°, or 270°' },
    { id: 'unlock', label: 'Unlock PDF', icon: Unlock, desc: 'Decrypt & remove restrictions' },
    { id: 'metadata', label: 'Edit Metadata', icon: FileEdit, desc: 'Modify Title, Author & Properties' },
    { id: 'darkmode', label: 'Dark Mode PDF', icon: Moon, desc: 'Invert colors for night reading' },
    { id: 'crop', label: 'Crop Margins', icon: Crop, desc: 'Trim whitespace & scanned borders' },
    { id: 'redact', label: 'Redact & Censor', icon: EyeOff, desc: 'Black out sensitive data' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              11 In-Browser PDF Utilities
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Merge, Split, Number, Watermark, Decrypt & Edit PDFs
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              100% Client-Side PDF workspace: combine, extract, stamp page numbers, edit metadata, or redact confidential records in seconds.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-3 py-2 rounded-xl shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero Server Uploads</span>
          </div>
        </div>
      </div>

      {/* Responsive Horizontal Tool Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin border-b border-slate-800">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id as ToolTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool Content Containers */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 min-h-[380px]">
        {/* 1. MERGE PDF */}
        {activeTool === 'merge' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Merge Multiple PDFs</h3>
              <p className="text-xs text-slate-400">Select 2 or more PDF files to combine into a unified document.</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files) {
                    setMergeFiles(Array.from(e.target.files));
                  }
                }}
                className="hidden"
                id="merge-input"
              />
              <label htmlFor="merge-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <FileStack className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {mergeFiles.length > 0 ? `${mergeFiles.length} PDF files selected` : 'Click to select multiple PDF files'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Hold Ctrl / Cmd to select multiple files</span>
              </label>
            </div>

            {mergeFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {mergeFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-300 truncate max-w-sm">{i + 1}. {f.name}</span>
                    <span className="text-slate-500 shrink-0">{formatBytes(f.size)}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleMerge}
              disabled={mergeFiles.length < 2 || isMerging}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileStack className="w-4 h-4" />}
              <span>{isMerging ? `Merging (${mergeProgress}%)...` : `Combine ${mergeFiles.length || ''} PDFs`}</span>
            </button>
          </div>
        )}

        {/* 2. SPLIT PDF */}
        {activeTool === 'split' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Split PDF into Individual Pages</h3>
              <p className="text-xs text-slate-400">Extract each page of your PDF into separate files packaged in a single ZIP download.</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setSplitFile(e.target.files[0]);
                }}
                className="hidden"
                id="split-input"
              />
              <label htmlFor="split-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Scissors className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {splitFile ? splitFile.name : 'Click to select PDF to split'}
                </span>
                <span className="text-xs text-slate-500 mt-1">{splitFile ? formatBytes(splitFile.size) : 'Supports any multi-page PDF'}</span>
              </label>
            </div>

            <button
              onClick={handleSplit}
              disabled={!splitFile || isSplitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isSplitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
              <span>{isSplitting ? `Splitting Pages (${splitProgress}%)...` : 'Split & Download ZIP'}</span>
            </button>
          </div>
        )}

        {/* 3. COMPRESS PDF */}
        {activeTool === 'compress' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Compress & Reduce PDF File Size</h3>
              <p className="text-xs text-slate-400">Optimize and downscale internal assets to shrink document footprint.</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setCompressFile(e.target.files[0]);
                }}
                className="hidden"
                id="compress-input"
              />
              <label htmlFor="compress-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <FileDown className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {compressFile ? compressFile.name : 'Click to select PDF to compress'}
                </span>
                <span className="text-xs text-slate-500 mt-1">{compressFile ? formatBytes(compressFile.size) : 'Reduces file size for email & uploads'}</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setCompressLevel(lvl)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    compressLevel === lvl
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-semibold text-xs capitalize">{lvl} Compression</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {lvl === 'low' ? 'Best Quality' : lvl === 'medium' ? 'Balanced' : 'Smallest Size'}
                  </p>
                </button>
              ))}
            </div>

            {compressResult && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400">
                <span>Original: {formatBytes(compressResult.orig)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="font-bold">Compressed: {formatBytes(compressResult.next)} ({Math.round(((compressResult.orig - compressResult.next) / compressResult.orig) * 100)}% smaller)</span>
              </div>
            )}

            <button
              onClick={handleCompress}
              disabled={!compressFile || isCompressing}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isCompressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span>{isCompressing ? `Compressing (${compressProgress}%)...` : 'Compress PDF'}</span>
            </button>
          </div>
        )}

        {/* 4. WATERMARK PDF */}
        {activeTool === 'watermark' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Add Watermark to PDF</h3>
              <p className="text-xs text-slate-400">Stamp diagonal text watermark across all pages.</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setWatermarkFile(e.target.files[0]);
                }}
                className="hidden"
                id="watermark-input"
              />
              <label htmlFor="watermark-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Stamp className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {watermarkFile ? watermarkFile.name : 'Click to select PDF'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="CONFIDENTIAL, SAMPLE, DRAFT..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Opacity ({Math.round(watermarkOpacity * 100)}%)</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleWatermark}
              disabled={!watermarkFile || isWatermarking}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isWatermarking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stamp className="w-4 h-4" />}
              <span>{isWatermarking ? `Watermarking (${watermarkProgress}%)...` : 'Apply Watermark & Download'}</span>
            </button>
          </div>
        )}

        {/* 5. PAGE NUMBERS */}
        {activeTool === 'numbers' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Stamp Page Numbers</h3>
              <p className="text-xs text-slate-400">Add dynamic page numbers across all pages of your PDF document.</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setNumbersFile(e.target.files[0]);
                }}
                className="hidden"
                id="numbers-input"
              />
              <label htmlFor="numbers-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Hash className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {numbersFile ? numbersFile.name : 'Click to select PDF'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Position</label>
                <select
                  value={numbersPosition}
                  onChange={(e: any) => setNumbersPosition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Numbering Format</label>
                <select
                  value={numbersFormat}
                  onChange={(e: any) => setNumbersFormat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Page {n} of {total}">Page 1 of 10</option>
                  <option value="{n} / {total}">1 / 10</option>
                  <option value="Page {n}">Page 1</option>
                  <option value="{n}">1, 2, 3...</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleAddPageNumbers}
              disabled={!numbersFile || isNumbering}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isNumbering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
              <span>{isNumbering ? `Numbering (${numbersProgress}%)...` : 'Add Page Numbers & Download'}</span>
            </button>
          </div>
        )}

        {/* 6. ROTATE PAGES */}
        {activeTool === 'rotate' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Rotate PDF Pages</h3>
              <p className="text-xs text-slate-400">Rotate all pages of your PDF document clockwise.</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setRotateFile(e.target.files[0]);
                }}
                className="hidden"
                id="rotate-input"
              />
              <label htmlFor="rotate-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <RotateCw className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {rotateFile ? rotateFile.name : 'Click to select PDF to rotate'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {([90, 180, 270] as const).map((angle) => (
                <button
                  key={angle}
                  onClick={() => setRotationAngle(angle)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    rotationAngle === angle
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-semibold text-sm">{angle}°</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {angle === 90 ? 'Right' : angle === 180 ? 'Upside Down' : 'Left'}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={handleRotate}
              disabled={!rotateFile || isRotating}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isRotating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
              <span>{isRotating ? `Rotating (${rotateProgress}%)...` : `Rotate ${rotationAngle}° & Download`}</span>
            </button>
          </div>
        )}

        {/* 7. UNLOCK PDF */}
        {activeTool === 'unlock' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Unlock & Decrypt PDF</h3>
              <p className="text-xs text-slate-400">Permanently remove password protection & editing restrictions.</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setUnlockFile(e.target.files[0]);
                }}
                className="hidden"
                id="unlock-input"
              />
              <label htmlFor="unlock-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Unlock className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {unlockFile ? unlockFile.name : 'Click to select protected PDF'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Strips restriction flags and saves unlocked copy</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Known Password (if password-locked)</label>
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Enter password (leave empty if document has only permission locks)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleUnlock}
              disabled={!unlockFile || isUnlocking}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isUnlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              <span>{isUnlocking ? `Decrypting (${unlockProgress}%)...` : 'Unlock & Save PDF'}</span>
            </button>
          </div>
        )}

        {/* 8. EDIT METADATA */}
        {activeTool === 'metadata' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">PDF Metadata & Properties Editor</h3>
              <p className="text-xs text-slate-400">View, modify, or strip hidden document properties (Title, Author, Keywords).</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setMetaFile(e.target.files[0]);
                }}
                className="hidden"
                id="meta-input"
              />
              <label htmlFor="meta-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <FileEdit className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {metaFile ? metaFile.name : 'Click to select PDF'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Document Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Official Proposal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Author Name</label>
                <input
                  type="text"
                  value={metaAuthor}
                  onChange={(e) => setMetaAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Subject</label>
                <input
                  type="text"
                  value={metaSubject}
                  onChange={(e) => setMetaSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Q3 Financial Report"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="finance, report, 2026"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <input
                type="checkbox"
                id="strip-meta"
                checked={stripAllMeta}
                onChange={(e) => setStripAllMeta(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="strip-meta" className="text-xs text-slate-300 cursor-pointer">
                <span className="font-semibold text-white">Sanitize Privacy Mode:</span> Strip all hidden creator software & author tracking metadata.
              </label>
            </div>

            <button
              onClick={handleUpdateMetadata}
              disabled={!metaFile || isUpdatingMeta}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isUpdatingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileEdit className="w-4 h-4" />}
              <span>{isUpdatingMeta ? `Saving (${metaProgress}%)...` : 'Update PDF Metadata'}</span>
            </button>
          </div>
        )}

        {/* 9. DARK MODE PDF */}
        {activeTool === 'darkmode' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Dark Mode PDF Inverter</h3>
              <p className="text-xs text-slate-400">Inverts white backgrounds to high-contrast dark tones for night reading & AMOLED displays.</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setDarkModeFile(e.target.files[0]);
                }}
                className="hidden"
                id="darkmode-input"
              />
              <label htmlFor="darkmode-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Moon className="w-6 h-6 text-indigo-300" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {darkModeFile ? darkModeFile.name : 'Click to select PDF'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Transforms pages to eye-friendly dark background</span>
              </label>
            </div>

            <button
              onClick={handleDarkMode}
              disabled={!darkModeFile || isDarkModing}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isDarkModing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Moon className="w-4 h-4" />}
              <span>{isDarkModing ? `Inverting Pages (${darkModeProgress}%)...` : 'Convert to Dark Mode PDF'}</span>
            </button>
          </div>
        )}

        {/* 10. CROP MARGINS */}
        {activeTool === 'crop' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Crop PDF Margins & Trim Borders</h3>
              <p className="text-xs text-slate-400">Trim extra white borders from scanned documents or books.</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setCropFile(e.target.files[0]);
                }}
                className="hidden"
                id="crop-input"
              />
              <label htmlFor="crop-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Crop className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {cropFile ? cropFile.name : 'Click to select PDF'}
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Margin Trim Amount</span>
                <span className="font-semibold text-indigo-400">{cropMargin} pt ({Math.round(cropMargin / 72 * 10) / 10} inch)</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={cropMargin}
                onChange={(e) => setCropMargin(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <button
              onClick={handleCrop}
              disabled={!cropFile || isCropping}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isCropping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crop className="w-4 h-4" />}
              <span>{isCropping ? `Cropping (${cropProgress}%)...` : 'Crop Margins & Download'}</span>
            </button>
          </div>
        )}

        {/* 11. REDACT & CENSOR */}
        {activeTool === 'redact' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Redact & Censor Confidential PDF Data</h3>
              <p className="text-xs text-slate-400">Permanently draw opaque blackout/whiteout boxes over private data (SSN, phone, account numbers).</p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setRedactFile(e.target.files[0]);
                }}
                className="hidden"
                id="redact-input"
              />
              <label htmlFor="redact-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <EyeOff className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {redactFile ? redactFile.name : 'Click to select PDF for sanitization'}
                </span>
              </label>
            </div>

            {/* Redaction box definitions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>Censor Regions ({redactions.length})</span>
                <button
                  type="button"
                  onClick={addRedactionRow}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Region</span>
                </button>
              </div>

              {redactions.map((box, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2 items-center text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Page #</label>
                    <input
                      type="number"
                      min="1"
                      value={box.pageNumber}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setRedactions((prev) => prev.map((r, i) => i === idx ? { ...r, pageNumber: val } : r));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Top Pos %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={box.yPercent}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setRedactions((prev) => prev.map((r, i) => i === idx ? { ...r, yPercent: val } : r));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Color</label>
                    <select
                      value={box.color}
                      onChange={(e: any) => {
                        setRedactions((prev) => prev.map((r, i) => i === idx ? { ...r, color: e.target.value } : r));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      <option value="black">Blackout</option>
                      <option value="white">Whiteout</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Label</label>
                    <input
                      type="text"
                      value={box.label || ''}
                      onChange={(e) => {
                        setRedactions((prev) => prev.map((r, i) => i === idx ? { ...r, label: e.target.value } : r));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                      placeholder="[REDACTED]"
                    />
                  </div>

                  <div className="flex justify-end pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => removeRedactionRow(idx)}
                      disabled={redactions.length <= 1}
                      className="p-1.5 rounded text-slate-500 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRedact}
              disabled={!redactFile || isRedacting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isRedacting ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
              <span>{isRedacting ? `Sanitizing (${redactProgress}%)...` : 'Apply Redactions & Download Clean PDF'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
