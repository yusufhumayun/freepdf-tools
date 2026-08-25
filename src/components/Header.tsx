import React from 'react';
import { ConversionCategory } from '../types/converter';
import { 
  FileSpreadsheet, 
  ArrowRightLeft, 
  Layers, 
  Zap,
  Crop,
  PenTool,
  FileText,
  HelpCircle,
  Share2,
  MessageSquare,
  Bot,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeCategory: ConversionCategory;
  onSelectCategory: (category: ConversionCategory) => void;
  onOpenFeedback: (defaultTab?: 'feedback' | 'share') => void;
  onQuickShare: () => void;
  fileCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenFeedback,
  onQuickShare,
}) => {
  const tabs = [
    {
      id: 'ai-chat' as ConversionCategory,
      label: 'AI PDF Assistant',
      badge: 'Chat, Summarize & Q&A with Gemini',
      icon: Bot,
      color: 'text-violet-400',
      isNew: true,
    },
    {
      id: 'pdf-to-other' as ConversionCategory,
      label: 'PDF to Other',
      badge: 'Word, Excel, JPG',
      icon: FileSpreadsheet,
      color: 'text-indigo-400',
    },
    {
      id: 'other-to-pdf' as ConversionCategory,
      label: 'Other to PDF',
      badge: 'Docs & Images to PDF',
      icon: ArrowRightLeft,
      color: 'text-indigo-400',
    },
    {
      id: 'ocr' as ConversionCategory,
      label: 'OCR & Text',
      badge: 'Scanned PDF & Images',
      icon: FileText,
      color: 'text-cyan-400',
    },
    {
      id: 'image-suite' as ConversionCategory,
      label: 'Photo & KB Resizer',
      badge: 'Exam Photo & Sign KB',
      icon: Crop,
      color: 'text-amber-400',
    },
    {
      id: 'sign-pdf' as ConversionCategory,
      label: 'Sign & Stamp',
      badge: 'Draw, Type & Stamp',
      icon: PenTool,
      color: 'text-emerald-400',
    },
    {
      id: 'pdf-tools' as ConversionCategory,
      label: 'PDF Tools',
      badge: 'Merge, Split, Number, Watermark',
      icon: Layers,
      color: 'text-sky-400',
    },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Top Bar: Brand + Quick Actions */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3 border-b border-slate-800/60">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <a href="#" className="font-bold text-base sm:text-lg tracking-tight text-white font-['Plus_Jakarta_Sans'] hover:text-indigo-300 transition">
                  Free<span className="text-indigo-400">PDF</span> Tools
                </a>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  <Zap className="w-3 h-3 mr-1 text-indigo-400" />
                  100% Free & In-Browser
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                All-in-one in-browser PDF, OCR, Exam Photo KB & Document Suite
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* 1-Click Share Button */}
            <button
              id="btn-header-share"
              onClick={onQuickShare}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition shadow-sm cursor-pointer"
              title="Share FreePDF Tools (Copies link or opens share menu)"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Share</span>
            </button>

            {/* Feedback / Contact Button */}
            <button
              id="btn-header-feedback"
              onClick={() => onOpenFeedback('feedback')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition shadow-sm cursor-pointer"
              title="Send Feedback, report bug, or request a tool"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Feedback</span>
            </button>

            <a
              href="#faq"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition"
              title="View FAQ & Help"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">FAQ</span>
            </a>
          </div>

        </div>

        {/* Dedicated Category Navigation Bar - All 7 Tools Visible & Accessible */}
        <div className="py-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
          <nav className="flex items-center gap-1.5 min-w-max lg:min-w-0 lg:grid lg:grid-cols-7 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => onSelectCategory(tab.id)}
                  className={`flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap relative ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={tab.badge}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : tab.color}`} />
                  <span className="truncate">{tab.label}</span>
                  {tab.isNew && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping absolute top-1.5 right-1.5" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>
    </header>
  );
};
