import React, { useState, useRef } from 'react';
import { performPdfOcr, performImageOcr, exportOcrToDocx, BatchOcrResult } from '../services/ocrService';
import { downloadBlob, formatBytes } from '../utils/formatHelpers';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Loader2, 
  Globe, 
  FileCheck, 
  Layers, 
  RefreshCw,
  ShieldCheck,
  Zap
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish (Español)' },
  { code: 'fra', name: 'French (Français)' },
  { code: 'deu', name: 'German (Deutsch)' },
  { code: 'hin', name: 'Hindi (हिन्दी)' },
  { code: 'chi_sim', name: 'Chinese Simplified (简体中文)' },
  { code: 'jpn', name: 'Japanese (日本語)' },
  { code: 'ara', name: 'Arabic (العربية)' },
  { code: 'por', name: 'Portuguese (Português)' },
  { code: 'ita', name: 'Italian (Italiano)' },
  { code: 'rus', name: 'Russian (Русский)' },
];

export const OcrExtractSuite: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [ocrResult, setOcrResult] = useState<BatchOcrResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeViewPage, setActiveViewPage] = useState(1);
  const [editableText, setEditableText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setOcrResult(null);
      setEditableText('');
    }
  };

  const handleRunOcr = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setProgress(5);
      setStatusMessage('Preparing OCR engine...');

      let result: BatchOcrResult;

      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        result = await performPdfOcr(selectedFile, language, undefined, (p, msg) => {
          setProgress(p);
          setStatusMessage(msg);
        });
      } else {
        result = await performImageOcr(selectedFile, language, (p, msg) => {
          setProgress(p);
          setStatusMessage(msg);
        });
      }

      setOcrResult(result);
      setEditableText(result.fullText);
      setActiveViewPage(1);
    } catch (err: any) {
      alert('OCR Failed: ' + (err.message || 'Unknown error occurred.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!editableText) return;
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!editableText || !selectedFile) return;
    const blob = new Blob([editableText], { type: 'text/plain;charset=utf-8' });
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    downloadBlob(blob, `${baseName}_extracted_ocr.txt`);
  };

  const handleDownloadDocx = async () => {
    if (!ocrResult || !selectedFile) return;
    try {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      const blob = await exportOcrToDocx(ocrResult, baseName);
      downloadBlob(blob, `${baseName}_extracted_ocr.docx`);
    } catch (err: any) {
      alert('Word export failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-sky-950/70 border border-indigo-500/20 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              100% In-Browser WebAssembly OCR (No Cloud Uploads)
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Scanned PDF & Image to Searchable Text & Word
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Extract selectable text, invoices, receipts, and book scans from PDF and image files with multilingual optical character recognition.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero Server Exposure (100% Private)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Config */}
        <div className="lg:col-span-5 space-y-4">
          {/* File Picker */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
              selectedFile 
                ? 'border-indigo-500/60 bg-indigo-950/20 shadow-lg shadow-indigo-950/50' 
                : 'border-slate-700/80 hover:border-indigo-500/40 bg-slate-900/40 hover:bg-slate-900/70'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,image/bmp" 
              className="hidden" 
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                {selectedFile ? <FileCheck className="w-6 h-6 text-emerald-400" /> : <Upload className="w-6 h-6" />}
              </div>

              {selectedFile ? (
                <div>
                  <p className="font-semibold text-white text-sm truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatBytes(selectedFile.size)} • Click to switch file</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-200 text-sm">Drop scanned PDF or image here</p>
                  <p className="text-xs text-slate-500 mt-1">Supports PDF, PNG, JPG, WEBP, BMP</p>
                </div>
              )}
            </div>
          </div>

          {/* OCR Config Settings */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Document Language
            </h3>

            <div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Choosing the matching language significantly increases text recognition accuracy.
              </p>
            </div>

            {/* Start OCR Button */}
            <button
              onClick={handleRunOcr}
              disabled={!selectedFile || isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Recognizing Text ({progress}%)...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Start Optical Character Recognition</span>
                </>
              )}
            </button>

            {/* Live Progress feedback */}
            {isProcessing && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="truncate pr-2">{statusMessage || 'Processing...'}</span>
                  <span className="font-semibold text-indigo-400">{progress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: OCR Results & Export */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-semibold text-sm text-slate-200">Recognized Document Text</h3>
                  {ocrResult && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {ocrResult.averageConfidence}% Confidence
                    </span>
                  )}
                </div>

                {ocrResult && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Download raw text file"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>.TXT</span>
                    </button>
                    <button
                      onClick={handleDownloadDocx}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-indigo-600/30"
                      title="Download formatted Word document"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>Word (.DOCX)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Editable Text Area */}
              {ocrResult ? (
                <div className="space-y-3">
                  <textarea
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    rows={15}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm font-mono text-slate-300 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
                    placeholder="Recognized text will appear here..."
                  />

                  {ocrResult.pages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      <span className="text-slate-500 text-[11px] shrink-0">Jump to Page:</span>
                      {ocrResult.pages.map((p) => (
                        <button
                          key={p.pageNumber}
                          onClick={() => {
                            setActiveViewPage(p.pageNumber);
                            setEditableText(p.text);
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            activeViewPage === p.pageNumber
                              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Page {p.pageNumber}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setActiveViewPage(0);
                          setEditableText(ocrResult.fullText);
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                          activeViewPage === 0
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All Pages
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">No Document Processed Yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Upload a scanned PDF or photo invoice and click "Start OCR" to view and export editable text.
                  </p>
                </div>
              )}
            </div>

            {ocrResult && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>Total Words: {editableText.split(/\s+/).filter(Boolean).length}</span>
                <span>Pages Processed: {ocrResult.pages.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
