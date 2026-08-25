import React, { useState, useRef, useEffect } from 'react';
import { stampSignatureOnPdf } from '../services/pdfTools';
import { loadPdfDocument, generatePdfThumbnails } from '../services/pdfToFormat';
import { downloadBlob, formatBytes } from '../utils/formatHelpers';
import { 
  PenTool, 
  Upload, 
  Trash2, 
  Check, 
  Download, 
  RotateCcw, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  Move,
  FileCheck2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PdfSignaturePad: React.FC = () => {
  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfThumbnails, setPdfThumbnails] = useState<string[]>([]);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Signature state
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [sigBlob, setSigBlob] = useState<Blob | null>(null);
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [inkColor, setInkColor] = useState<string>('#000000');
  const [penWidth, setPenWidth] = useState<number>(3);

  // Placement state on active PDF page
  const [posX, setPosX] = useState<number>(50); // percentage (0-100)
  const [posY, setPosY] = useState<number>(75); // percentage (0-100)
  const [sigScale, setSigScale] = useState<number>(140); // width in px

  // Execution state
  const [isSigning, setIsSigning] = useState(false);
  const [signedResult, setSignedResult] = useState<{ blob: Blob; fileName: string } | null>(null);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Initialize and clear signature canvas
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigBlob(null);
    setSigUrl(null);
  };

  // Convert drawn signature on canvas to transparent PNG blob
  const exportDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        setSigBlob(blob);
        setSigUrl(URL.createObjectURL(blob));
      }
    }, 'image/png');
  };

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = inkColor;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    exportDrawnSignature();
  };

  // Upload signature image handler
  const handleSignatureUpload = (file: File) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        // Auto-clean signature background
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (gray > 190) {
            data[i + 3] = 0; // Make transparent
          }
        }
        ctx.putImageData(imgData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            setSigBlob(blob);
            setSigUrl(URL.createObjectURL(blob));
          }
        }, 'image/png');
      }
    };
    img.src = url;
  };

  // Handle PDF file selection
  const handlePdfSelected = async (file: File) => {
    setPdfFile(file);
    setSignedResult(null);
    try {
      const pdf = await loadPdfDocument(file);
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      const thumbs = await generatePdfThumbnails(file, Math.min(pdf.numPages, 10));
      setPdfThumbnails(thumbs);
    } catch (err) {
      alert('Could not load PDF document preview');
    }
  };

  // Stamp signature onto PDF
  const handleApplySignature = async () => {
    if (!pdfFile || !sigBlob) {
      alert('Please upload a PDF document and draw or upload your signature');
      return;
    }

    try {
      setIsSigning(true);
      const aspectRatio = 0.45; // standard signature box ratio
      const width = sigScale;
      const height = sigScale * aspectRatio;

      const res = await stampSignatureOnPdf(pdfFile, sigBlob, {
        pageNumber: currentPage,
        xPercent: posX,
        yPercent: posY,
        width,
        height,
      });

      setSignedResult(res);
      try {
        confetti({ particleCount: 40, spread: 65, origin: { y: 0.8 } });
      } catch (_) {}
    } catch (err: any) {
      alert(err.message || 'Failed to stamp signature onto PDF');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <PenTool className="w-3.5 h-3.5" />
            <span>Interactive Signature & Form Signer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
            Draw, Sign & Stamp PDFs
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Create your handwritten signature with mouse, stylus, or touch, download as a crisp transparent PNG, or stamp it directly onto any PDF page.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Private & In-Memory</span>
        </div>
      </div>

      {/* Grid: Signature Pad & PDF Placement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Signature Creation Pad (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white flex items-center space-x-2">
                <PenTool className="w-4 h-4 text-indigo-400" />
                <span>Create Your Signature</span>
              </span>

              <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setSignatureMode('draw')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    signatureMode === 'draw' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Draw
                </button>
                <button
                  onClick={() => setSignatureMode('upload')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    signatureMode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Upload Photo
                </button>
              </div>
            </div>

            {signatureMode === 'draw' ? (
              <div className="space-y-3">
                {/* Canvas Box */}
                <div className="relative rounded-xl bg-white border border-slate-300 shadow-inner overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 touch-none cursor-crosshair"
                  />
                  {!sigBlob && (
                    <span className="absolute pointer-events-none text-xs text-slate-400 italic">
                      Sign here using your mouse or finger
                    </span>
                  )}
                </div>

                {/* Drawing Controls */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Ink:</span>
                    <button
                      onClick={() => setInkColor('#000000')}
                      className={`w-5 h-5 rounded-full bg-black border-2 transition ${
                        inkColor === '#000000' ? 'border-indigo-400 scale-110' : 'border-transparent'
                      }`}
                    />
                    <button
                      onClick={() => setInkColor('#1e40af')}
                      className={`w-5 h-5 rounded-full bg-blue-800 border-2 transition ${
                        inkColor === '#1e40af' ? 'border-indigo-400 scale-110' : 'border-transparent'
                      }`}
                    />
                  </div>

                  <button
                    onClick={handleClearCanvas}
                    className="flex items-center space-x-1 text-slate-400 hover:text-red-400 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Upload scanned signature */
              <div className="space-y-3">
                <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 text-center flex flex-col items-center justify-center cursor-pointer bg-slate-950/60 transition">
                  <Upload className="w-6 h-6 text-indigo-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-200">Upload handwritten paper photo</span>
                  <span className="text-[10px] text-slate-500 mt-1">Background will be auto-cleaned to transparent</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleSignatureUpload(e.target.files[0])}
                  />
                </label>
              </div>
            )}

            {/* Signature Preview & Download PNG button */}
            {sigBlob && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Signature Ready</span>
                </span>
                <button
                  onClick={() => downloadBlob(sigBlob, 'my_signature_transparent.png')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Transparent PNG</span>
                </button>
              </div>
            )}

          </div>

          {/* Quick instructions card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <span className="font-semibold text-slate-300 block">How to Stamp onto PDF:</span>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Upload your PDF file on the right side.</li>
              <li>Select which page to sign.</li>
              <li>Drag the signature box or use sliders to position it.</li>
              <li>Click &quot;Stamp & Download Signed PDF&quot;.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: PDF Viewer & Interactive Stamping (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Target PDF Document</span>
              </span>

              {pdfFile && (
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-slate-300 font-medium">Page {currentPage} of {numPages}</span>
                  <button
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                    className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {!pdfFile ? (
              <label className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-10 text-center flex flex-col items-center justify-center cursor-pointer bg-slate-950/60 transition min-h-[300px]">
                <Upload className="w-8 h-8 text-indigo-400 mb-3" />
                <span className="text-sm font-semibold text-white">Upload PDF to Sign</span>
                <span className="text-xs text-slate-500 mt-1">Contracts, forms, declarations, or agreements</span>
                <span className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition">
                  Browse PDF Document
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePdfSelected(e.target.files[0])}
                />
              </label>
            ) : (
              <div className="space-y-4">
                
                {/* PDF Page Preview with Placed Signature overlay */}
                <div className="relative mx-auto max-w-[380px] sm:max-w-[440px] aspect-[1/1.414] bg-white rounded-xl shadow-2xl border border-slate-700 overflow-hidden select-none">
                  {pdfThumbnails[currentPage - 1] ? (
                    <img
                      src={pdfThumbnails[currentPage - 1]}
                      alt={`Page ${currentPage}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                      Loading Page {currentPage}...
                    </div>
                  )}

                  {/* Placed signature tag */}
                  {sigUrl && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${posX}%`,
                        top: `${posY}%`,
                        transform: 'translate(-50%, -50%)',
                        width: `${(sigScale / 400) * 100}%`,
                      }}
                      className="border-2 border-dashed border-indigo-500 bg-indigo-500/10 rounded p-1 cursor-move shadow-lg group"
                    >
                      <img src={sigUrl} alt="Signature" className="w-full object-contain pointer-events-none" />
                      <span className="absolute -top-5 left-0 bg-indigo-600 text-white text-[9px] px-1 rounded font-semibold">
                        Signature Box
                      </span>
                    </div>
                  )}
                </div>

                {/* Placement Sliders */}
                {sigBlob && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-400 flex items-center justify-between">
                          <span>Horizontal Position:</span>
                          <span className="text-indigo-400 font-mono">{posX}%</span>
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={posX}
                          onChange={(e) => setPosX(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 flex items-center justify-between">
                          <span>Vertical Position:</span>
                          <span className="text-indigo-400 font-mono">{posY}%</span>
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="95"
                          value={posY}
                          onChange={(e) => setPosY(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 flex items-center justify-between">
                          <span>Signature Size:</span>
                          <span className="text-indigo-400 font-mono">{sigScale}px</span>
                        </label>
                        <input
                          type="range"
                          min="80"
                          max="220"
                          value={sigScale}
                          onChange={(e) => setSigScale(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={handleApplySignature}
                  disabled={!sigBlob || isSigning}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
                >
                  {isSigning ? (
                    <span>Stamping Signature onto Document...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Stamp & Export Signed PDF</span>
                    </>
                  )}
                </button>

              </div>
            )}

          </div>

          {/* Signed Output Card */}
          {signedResult && (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
                  <FileCheck2 className="w-5 h-5" />
                  <span>Document Signed Successfully!</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-emerald-900/50">
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-white">{signedResult.fileName}</p>
                  <p className="text-slate-400">File Size: {formatBytes(signedResult.blob.size)}</p>
                </div>

                <button
                  onClick={() => downloadBlob(signedResult.blob, signedResult.fileName)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Signed PDF</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
