import React from 'react';
import { ConversionCategory } from '../types/converter';
import { 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Code, 
  Globe, 
  Scissors, 
  Stamp, 
  RotateCw,
  ArrowRightLeft,
  CheckCircle2,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ConversionMatrixProps {
  onSelectCategory: (category: ConversionCategory) => void;
}

export const ConversionMatrix: React.FC<ConversionMatrixProps> = ({ onSelectCategory }) => {
  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
          Convert Between Any Document Format
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Everything runs 100% in your browser. Fast, private, with zero server uploads and ready to host anywhere.
        </p>
      </div>

      {/* Grid of Conversion Capabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card 1: PDF to Word / Docs */}
        <div 
          onClick={() => onSelectCategory('pdf-to-other')}
          className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-200 shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition">
                PDF ⇄ Word (.docx)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Extract text, paragraphs, headings, and data columns into editable Microsoft Word documents, or render DOCX to PDF.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
            <span>Try PDF to Word</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 2: PDF to Images */}
        <div 
          onClick={() => onSelectCategory('pdf-to-other')}
          className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-200 shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition">
                PDF ⇄ High-Res Images
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Render every PDF page into crystal-clear PNG, JPG, or WebP at 72, 144, or 216 DPI with ZIP download, or combine photos into PDF.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
            <span>Try PDF to Image</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 3: PDF to Excel / CSV */}
        <div 
          onClick={() => onSelectCategory('pdf-to-other')}
          className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-200 shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition">
                PDF ⇄ Excel & CSV Data
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Automatically extract tabular grids, invoice line items, and numeric data into .xlsx spreadsheets or universal CSV.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
            <span>Try Excel Extraction</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 4: Markdown & Plain Text */}
        <div 
          onClick={() => onSelectCategory('other-to-pdf')}
          className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-200 shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition">
                Markdown / TXT ⇄ PDF
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Transform Markdown notes, code snippets, and documentation into beautifully styled PDF reports with automatic pagination.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
            <span>Try Markdown to PDF</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 5: HTML / Web */}
        <div 
          onClick={() => onSelectCategory('pdf-to-other')}
          className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-200 shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-sm border border-sky-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition">
                HTML & JSON ⇄ PDF
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Generate clean, standalone HTML pages or structured JSON from PDF layouts, or render HTML code into PDF.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
            <span>Try HTML Export</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 6: PDF Toolbox */}
        <div 
          onClick={() => onSelectCategory('pdf-tools')}
          className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-200 shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-sm border border-rose-500/20">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition">
                Merge, Split, Watermark & Rotate
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Powerful toolbox to merge multiple PDFs, extract pages into ZIPs, stamp confidential watermarks, or compress file sizes.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
            <span>Open PDF Toolbox</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

      </div>
    </div>
  );
};
