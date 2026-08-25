import React, { useState } from 'react';
import { 
  mergePdfFiles, 
  watermarkPdf, 
  rotatePdfPages, 
  splitPdf 
} from '../services/pdfTools';
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
  ShieldCheck
} from 'lucide-react';

type ToolTab = 'merge' | 'split' | 'compress' | 'watermark' | 'rotate';

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

  return (
    <div className="space-y-6">
      
      {/* Sub-tools switcher tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
        {[
          { id: 'merge', label: 'Merge PDFs', icon: FileStack },
          { id: 'split', label: 'Split Pages', icon: Scissors },
          { id: 'compress', label: 'Compress PDF', icon: FileDown },
          { id: 'watermark', label: 'Add Watermark', icon: Stamp },
          { id: 'rotate', label: 'Rotate Pages', icon: RotateCw },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTool(tab.id as ToolTab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool Content Panels */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl">
        
        {/* MERGE TOOL */}
        {activeTool === 'merge' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileStack className="w-5 h-5 text-indigo-400" />
                <span>Merge Multiple PDF Documents</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Combine 2 or more separate PDF files into a single continuous PDF in your desired sequence.
              </p>
            </div>

            {/* Upload Area for Merge */}
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40 relative">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setMergeFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Click or drag PDF files to combine</p>
              <p className="text-xs text-slate-400 mt-1">Select 2 or more files</p>
            </div>

            {/* List of Files to Merge */}
            {mergeFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Merge Sequence ({mergeFiles.length} files)
                </h4>
                <div className="space-y-2">
                  {mergeFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-white font-medium truncate">{file.name}</span>
                        <span className="text-slate-500 text-xs shrink-0">({formatBytes(file.size)})</span>
                      </div>
                      <button
                        onClick={() => setMergeFiles(mergeFiles.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleMerge}
              disabled={mergeFiles.length < 2 || isMerging}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-40"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Merging PDFs ({mergeProgress}%)...</span>
                </>
              ) : (
                <>
                  <FileStack className="w-4 h-4" />
                  <span>Merge {mergeFiles.length} PDFs into One</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* SPLIT TOOL */}
        {activeTool === 'split' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Scissors className="w-5 h-5 text-indigo-400" />
                <span>Split PDF into Separate Pages</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Extract every individual page from a PDF and download as a ZIP archive of single-page PDFs.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40 relative">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSplitFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">
                {splitFile ? splitFile.name : 'Select PDF file to split'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {splitFile ? `${formatBytes(splitFile.size)} - Click to change` : 'Extract all pages'}
              </p>
            </div>

            <button
              onClick={handleSplit}
              disabled={!splitFile || isSplitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-40"
            >
              {isSplitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Splitting Pages ({splitProgress}%)...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>Split into Individual PDFs (ZIP)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* COMPRESS TOOL */}
        {activeTool === 'compress' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileDown className="w-5 h-5 text-indigo-400" />
                <span>Compress & Reduce PDF File Size</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Optimize image assets and downscale embedded elements for smaller email-ready PDFs.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40 relative">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCompressFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">
                {compressFile ? compressFile.name : 'Select PDF file to compress'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {compressFile ? `${formatBytes(compressFile.size)} - Click to change` : 'Drag and drop your PDF'}
              </p>
            </div>

            {/* Compression Level Selector */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'low', label: 'Light', desc: 'Slight reduction, high visual quality' },
                { id: 'medium', label: 'Balanced', desc: 'Great balance of quality & size' },
                { id: 'high', label: 'Extreme', desc: 'Maximum size reduction for emails' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setCompressLevel(lvl.id as any)}
                  className={`p-3 rounded-xl border text-left transition ${
                    compressLevel === lvl.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-sm">{lvl.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{lvl.desc}</p>
                </button>
              ))}
            </div>

            {compressResult && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <span>Compressed from <strong>{formatBytes(compressResult.orig)}</strong> down to <strong>{formatBytes(compressResult.next)}</strong>!</span>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            )}

            <button
              onClick={handleCompress}
              disabled={!compressFile || isCompressing}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-40"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compressing Document ({compressProgress}%)...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Compress & Download PDF</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* WATERMARK TOOL */}
        {activeTool === 'watermark' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Stamp className="w-5 h-5 text-indigo-400" />
                <span>Stamp Custom Watermark</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Overlay custom security or draft text diagonally across every page of your PDF.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40 relative">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setWatermarkFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">
                {watermarkFile ? watermarkFile.name : 'Select PDF file to watermark'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {watermarkFile ? `${formatBytes(watermarkFile.size)} - Click to change` : 'Drag and drop PDF here'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. CONFIDENTIAL"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Opacity: {Math.round(watermarkOpacity * 100)}%</label>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Angle</label>
                <select
                  value={watermarkRotation}
                  onChange={(e) => setWatermarkRotation(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="45">45° Diagonal</option>
                  <option value="0">0° Horizontal</option>
                  <option value="90">90° Vertical</option>
                  <option value="-45">-45° Reverse Diagonal</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleWatermark}
              disabled={!watermarkFile || !watermarkText.trim() || isWatermarking}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-40"
            >
              {isWatermarking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Applying Watermark ({watermarkProgress}%)...</span>
                </>
              ) : (
                <>
                  <Stamp className="w-4 h-4" />
                  <span>Apply Watermark & Download</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ROTATE TOOL */}
        {activeTool === 'rotate' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <RotateCw className="w-5 h-5 text-indigo-400" />
                <span>Rotate PDF Orientation</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Fix sideways or upside-down scans by rotating all pages permanently.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40 relative">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setRotateFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">
                {rotateFile ? rotateFile.name : 'Select PDF file to rotate'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {rotateFile ? `${formatBytes(rotateFile.size)} - Click to change` : 'Drag and drop PDF here'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { angle: 90, label: 'Rotate 90° Right', desc: 'Clockwise rotation' },
                { angle: 180, label: 'Rotate 180°', desc: 'Upside down flip' },
                { angle: 270, label: 'Rotate 90° Left', desc: 'Counter-clockwise' },
              ].map((opt) => (
                <button
                  key={opt.angle}
                  type="button"
                  onClick={() => setRotationAngle(opt.angle as any)}
                  className={`p-3 rounded-xl border text-left transition ${
                    rotationAngle === opt.angle
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleRotate}
              disabled={!rotateFile || isRotating}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-40"
            >
              {isRotating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rotating Document ({rotateProgress}%)...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>Rotate PDF by {rotationAngle}° & Download</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
