import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Bug, 
  Sparkles, 
  Mail, 
  Check, 
  Heart,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'feedback' | 'share';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'feedback',
}) => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'share'>(defaultTab);
  const [feedbackType, setFeedbackType] = useState<'feature' | 'bug' | 'praise'>('feature');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      const href = window.location.href;
      if (href.includes('github.io/pdf-converter')) {
        return 'https://yusufhumayun.github.io/pdf-converter/';
      }
      // Clean URL (remove hash and query params)
      const clean = window.location.origin + window.location.pathname;
      return clean.endsWith('/') ? clean : `${clean}/`;
    }
    return 'https://yusufhumayun.github.io/pdf-converter/';
  };

  const currentUrl = getShareUrl();
  const shareTitle = 'FreePDF Tools - 100% Free & Private Online PDF, OCR & Photo KB Suite';
  const shareText = 'Check out FreePDF Tools: Convert, Merge, Split, OCR, and resize exam photos & signatures to exact KB limits in-browser with zero uploads!';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n\n${currentUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(currentUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=PDF,FreeTools,Productivity`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(currentUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Construct mailto link with pre-filled details for direct delivery
    const subject = encodeURIComponent(`[FreePDF Tools Feedback] - ${feedbackType.toUpperCase()}`);
    const body = encodeURIComponent(
      `Feedback Type: ${feedbackType}\nUser Email: ${userEmail || 'Not provided'}\n\nMessage:\n${message}\n\nBrowser: ${navigator.userAgent}`
    );
    
    // Direct trigger email client fallback + simulated client success confirmation
    window.open(`mailto:yusufhumayunhsbc@gmail.com?subject=${subject}&body=${body}`, '_blank');

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setUserEmail('');
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'feedback'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact & Feedback</span>
            </button>

            <button
              onClick={() => setActiveTab('share')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'share'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share App</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Contact & Feedback */}
        {activeTab === 'feedback' && (
          <div className="pt-5 space-y-4">
            {submitted ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Thank You for Your Feedback!</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Your feedback helps us continuously improve FreePDF Tools for everyone.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    Send Feedback or Feature Request
                  </h3>
                  <p className="text-xs text-slate-400">
                    Have an idea, found a bug, or need a new document tool? Let us know directly!
                  </p>
                </div>

                {/* Feedback Type Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feature')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      feedbackType === 'feature'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Feature</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('bug')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      feedbackType === 'bug'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Bug className="w-3.5 h-3.5 text-rose-400" />
                    <span>Report Bug</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('praise')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      feedbackType === 'praise'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-amber-400" />
                    <span>Say Thanks</span>
                  </button>
                </div>

                {/* Textarea */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Your Message</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder={
                      feedbackType === 'bug'
                        ? 'Describe what happened, file type, or error message...'
                        : feedbackType === 'feature'
                        ? 'What tool or enhancement would make your workflow faster?'
                        : 'Tell us how FreePDF Tools helped you today!'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Your Email (Optional, if you'd like a reply)</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Message</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Share App */}
        {activeTab === 'share' && (
          <div className="pt-5 space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-indigo-400" />
                Spread the Word
              </h3>
              <p className="text-xs text-slate-400">
                Help friends, students & colleagues discover 100% free, private PDF & Photo editing.
              </p>
            </div>

            {/* Quick Copy Link Box */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-300 font-mono truncate">{currentUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-sm"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* 1-Click Social Sharing Grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-400 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-xs">
                  WA
                </div>
                <span className="text-xs font-medium text-slate-200">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleShareTwitter}
                className="p-3 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 text-sky-400 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center font-bold text-xs">
                  𝕏
                </div>
                <span className="text-xs font-medium text-slate-200">Twitter / 𝕏</span>
              </button>

              <button
                type="button"
                onClick={handleShareLinkedIn}
                className="p-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-400 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-xs">
                  in
                </div>
                <span className="text-xs font-medium text-slate-200">LinkedIn</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400 shrink-0" />
              <span>FreePDF Tools is non-profit and privacy-first. Sharing helps us keep it 100% free!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
