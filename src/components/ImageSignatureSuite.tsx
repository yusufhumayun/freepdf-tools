import React, { useState, useRef, useEffect } from 'react';
import { 
  RESIZE_PRESETS, 
  ImageResizePreset, 
  resizeAndCompressImage, 
  TargetCompressResult 
} from '../services/imageResizer';
import { downloadBlob, formatBytes } from '../utils/formatHelpers';
import { 
  Crop, 
  Maximize2, 
  Sparkles, 
  Download, 
  Upload, 
  Check, 
  Sliders, 
  Image as ImageIcon, 
  FileText, 
  RefreshCw, 
  HelpCircle,
  FileCheck2,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ImageSignatureSuite: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'signature-clean'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<ImageResizePreset>(RESIZE_PRESETS[0]);
  
  // Custom Controls
  const [customWidth, setCustomWidth] = useState<number>(600);
  const [customHeight, setCustomHeight] = useState<number>(600);
  const [targetMaxKb, setTargetMaxKb] = useState<number | ''>(50);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [cropMode, setCropMode] = useState<'cover' | 'contain' | 'stretch'>('cover');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [cleanSignatureInk, setCleanSignatureInk] = useState<boolean>(false);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TargetCompressResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // File selection
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP, etc.)');
      return;
    }
    setSelectedFile(file);
    setResult(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Read natural dimensions
    const img = new Image();
    img.onload = () => {
      if (activeTab === 'custom') {
        setCustomWidth(img.naturalWidth);
        setCustomHeight(img.naturalHeight);
      }
    };
    img.src = url;
  };

  // Sync preset changes
  const handleSelectPreset = (preset: ImageResizePreset) => {
    setSelectedPreset(preset);
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
    if (preset.maxSizeKb) {
      setTargetMaxKb(preset.maxSizeKb);
    } else {
      setTargetMaxKb('');
    }
    if (preset.category === 'signature') {
      setCleanSignatureInk(true);
    } else {
      setCleanSignatureInk(false);
    }
  };

  // Execute Resize & Target Sizing
  const handleProcess = async () => {
    if (!selectedFile) return;
    try {
      setIsProcessing(true);

      const targetW = activeTab === 'presets' ? selectedPreset.width : customWidth;
      const targetH = activeTab === 'presets' ? selectedPreset.height : customHeight;
      const maxKbNum = typeof targetMaxKb === 'number' && targetMaxKb > 0 ? targetMaxKb : undefined;

      const res = await resizeAndCompressImage(selectedFile, targetW, targetH, {
        format: outputFormat,
        targetMaxKb: maxKbNum,
        cropMode,
        backgroundColor: bgColor,
        isSignatureClean: cleanSignatureInk || activeTab === 'signature-clean',
      });

      setResult(res);
      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.85 } });
      } catch (_) {}
    } catch (err: any) {
      alert(err.message || 'Image processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Exact Target KB/MB & Standard Presets</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
            Photo, Signature & Target-Size Resizer
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Format government exam photos, passport visas, and candidate signatures to exact pixel dimensions and strict KB weight limits in browser memory.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Server Uploads</span>
        </div>
      </div>

      {/* Main Grid: Upload & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Upload & Preview Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition flex flex-col items-center justify-center min-h-[280px] sm:min-h-[340px] bg-slate-900/60 ${
              dragOver
                ? 'border-indigo-400 bg-indigo-950/40'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            {previewUrl ? (
              <div className="space-y-4 w-full flex flex-col items-center">
                <div className="relative max-h-56 max-w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800 p-2 shadow-inner flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="max-h-52 object-contain rounded-lg"
                  />
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-200 truncate max-w-xs">{selectedFile?.name}</p>
                  <p>Original Size: <span className="text-indigo-400 font-medium">{formatBytes(selectedFile?.size || 0)}</span></p>
                </div>

                <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium cursor-pointer transition">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose Different Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-3 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Drop your photo or signature here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports JPG, PNG, WebP, BMP, GIF
                  </p>
                </div>
                <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 cursor-pointer transition">
                  Browse Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-2">
            <span className="font-semibold text-slate-400 block">Popular Requirements:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSelectPreset(RESIZE_PRESETS[2])}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 transition text-[11px]"
              >
                Exam Photo (20-50 KB)
              </button>
              <button
                onClick={() => handleSelectPreset(RESIZE_PRESETS[3])}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 transition text-[11px]"
              >
                Signature (10-20 KB)
              </button>
              <button
                onClick={() => handleSelectPreset(RESIZE_PRESETS[0])}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 transition text-[11px]"
              >
                US Visa (2x2 in)
              </button>
              <button
                onClick={() => handleSelectPreset(RESIZE_PRESETS[1])}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 transition text-[11px]"
              >
                Schengen (35x45mm)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Dimension & Target KB Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            
            {/* Mode Switcher */}
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTab('presets');
                  setCleanSignatureInk(false);
                }}
                className={`flex-1 py-2 rounded-lg transition ${
                  activeTab === 'presets'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Standard Presets
              </button>
              <button
                onClick={() => {
                  setActiveTab('custom');
                  setCleanSignatureInk(false);
                }}
                className={`flex-1 py-2 rounded-lg transition ${
                  activeTab === 'custom'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Pixels & KB
              </button>
              <button
                onClick={() => {
                  setActiveTab('signature-clean');
                  setCleanSignatureInk(true);
                  setOutputFormat('image/png');
                  setBgColor('transparent');
                  setCustomWidth(140);
                  setCustomHeight(60);
                  setTargetMaxKb(20);
                }}
                className={`flex-1 py-2 rounded-lg transition ${
                  activeTab === 'signature-clean'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Clean Signature
              </button>
            </div>

            {/* Content for Presets */}
            {activeTab === 'presets' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300">Select Preset Profile:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {RESIZE_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        selectedPreset.id === preset.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200">{preset.name}</span>
                        {preset.maxSizeKb && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                            &lt; {preset.maxSizeKb}KB
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{preset.width} × {preset.height} px</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-1">{preset.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom pixel inputs */}
            {(activeTab === 'custom' || activeTab === 'signature-clean') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Width (px)</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Height (px)</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-indigo-400 flex items-center justify-between">
                      <span>Max KB Target</span>
                      <span className="text-[10px] text-slate-500">Optional</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={targetMaxKb}
                      onChange={(e) => setTargetMaxKb(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-indigo-400 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {activeTab === 'signature-clean' && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                    <p className="font-semibold flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Signature Auto-Whitener Enabled</span>
                    </p>
                    <p className="text-[11px] text-slate-300">
                      We will automatically remove the yellowish paper background, darken the handwritten ink, and make the background transparent.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Settings row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              
              {/* Output format */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Output Format</label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="image/jpeg">JPG (.jpg)</option>
                  <option value="image/png">PNG (.png / Transparent)</option>
                  <option value="image/webp">WebP (.webp)</option>
                </select>
              </div>

              {/* Crop Mode */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Fitting Mode</label>
                <select
                  value={cropMode}
                  onChange={(e) => setCropMode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="cover">Center Crop (Fill)</option>
                  <option value="contain">Fit with Margins</option>
                  <option value="stretch">Stretch to Fit</option>
                </select>
              </div>

              {/* Background fill */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Background</label>
                <select
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="#ffffff">Pure White (#FFF)</option>
                  <option value="#000000">Black (#000)</option>
                  <option value="#f8fafc">Light Gray (#F8)</option>
                  <option value="transparent">Transparent (PNG)</option>
                </select>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleProcess}
              disabled={!selectedFile || isProcessing}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <span>Optimizing & Resizing...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Resize & Compress to Exact Specs</span>
                </>
              )}
            </button>

          </div>

          {/* Result Card */}
          {result && (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
                  <FileCheck2 className="w-5 h-5" />
                  <span>Image Optimized Successfully!</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {result.width} × {result.height} px
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-emerald-900/50">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden p-1">
                    <img
                      src={result.url}
                      alt="Output Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-white truncate max-w-[200px]">{result.fileName}</p>
                    <p className="text-slate-400">
                      File Size: <span className="text-emerald-400 font-bold">{formatBytes(result.finalSize)}</span>
                      <span className="text-slate-500 ml-1">({Math.round((result.finalSize / 1024))} KB)</span>
                    </p>
                    <p className="text-slate-500 text-[11px]">Reduced from {formatBytes(result.originalSize)}</p>
                  </div>
                </div>

                <button
                  onClick={() => downloadBlob(result.blob, result.fileName)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
