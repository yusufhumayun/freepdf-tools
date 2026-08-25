import React from 'react';
import { ConversionCategory } from '../types/converter';
import { 
  FileSpreadsheet, 
  ArrowRightLeft, 
  Wrench, 
  ShieldCheck, 
  Github, 
  Sparkles,
  Zap
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Omni<span className="text-indigo-400">PDF</span> Studio
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  <Zap className="w-3 h-3 mr-1 text-indigo-400" />
                  Client-Side
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Universal PDF & Document Conversion Studio
              </p>
            </div>
          </div>

          {/* Center Category Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              id="tab-pdf-to-other"
              onClick={() => onSelectCategory('pdf-to-other')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                activeCategory === 'pdf-to-other'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>PDF to Anything</span>
            </button>

            <button
              id="tab-other-to-pdf"
              onClick={() => onSelectCategory('other-to-pdf')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                activeCategory === 'other-to-pdf'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Anything to PDF</span>
            </button>

            <button
              id="tab-pdf-tools"
              onClick={() => onSelectCategory('pdf-tools')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                activeCategory === 'pdf-tools'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>PDF Toolbox</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              id="btn-open-github-guide"
              onClick={onOpenGithubGuide}
              className="flex items-center space-x-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition shadow-sm"
              title="Learn how to host this on GitHub Pages for free"
            >
              <Github className="w-4 h-4 text-slate-300" />
              <span className="hidden md:inline">Host on GitHub</span>
            </button>

            <div 
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              title="All conversions happen inside your browser memory with zero cloud file uploads"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Private</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
