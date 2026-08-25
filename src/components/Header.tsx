import React from 'react';
import { ConversionCategory } from '../types/converter';
import { 
  FileSpreadsheet, 
  ArrowRightLeft, 
  Layers, 
  ShieldCheck, 
  Github, 
  Sparkles,
  Zap,
  Crop,
  PenTool
} from 'lucide-react';

interface HeaderProps {
  activeCategory: ConversionCategory;
  onSelectCategory: (category: ConversionCategory) => void;
  onOpenGithubGuide: () => void;
  fileCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenGithubGuide,
  fileCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-xl tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Free<span className="text-indigo-400">PDF</span> Tools
                </h1>
                <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  <Zap className="w-3 h-3 mr-1 text-indigo-400" />
                  100% Free & Private
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block">
                Universal PDF, Document & Photo Utility Suite
              </p>
            </div>
          </div>

          {/* Center Category Navigation Tabs (Scrollable on small mobile) */}
          <div className="overflow-x-auto no-scrollbar py-1">
            <nav className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-inner whitespace-nowrap">
              <button
                id="tab-pdf-to-other"
                onClick={() => onSelectCategory('pdf-to-other')}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  activeCategory === 'pdf-to-other'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>PDF to Other</span>
              </button>

              <button
                id="tab-other-to-pdf"
                onClick={() => onSelectCategory('other-to-pdf')}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  activeCategory === 'other-to-pdf'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Other to PDF</span>
              </button>

              <button
                id="tab-image-suite"
                onClick={() => onSelectCategory('image-suite')}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  activeCategory === 'image-suite'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Crop className="w-3.5 h-3.5 text-amber-400" />
                <span>Photo & KB Resizer</span>
              </button>

              <button
                id="tab-sign-pdf"
                onClick={() => onSelectCategory('sign-pdf')}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  activeCategory === 'sign-pdf'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sign & Stamp</span>
              </button>

              <button
                id="tab-pdf-tools"
                onClick={() => onSelectCategory('pdf-tools')}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  activeCategory === 'pdf-tools'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title="Merge, Split, Number, Watermark, Compress & Rotate PDFs"
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Merge / Split / Edit PDF</span>
              </button>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="btn-open-github-guide"
              onClick={onOpenGithubGuide}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition shadow-sm"
              title="Learn how to host this on GitHub Pages for free"
            >
              <Github className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden md:inline">Deploy Guide</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
