import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, Sparkles, HelpCircle, Lock, Zap } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: 'privacy' | 'conversion' | 'resizer' | 'ocr';
}

const FAQS: FaqItem[] = [
  {
    category: 'privacy',
    question: 'Are my PDF documents and uploaded photos safe & private?',
    answer: 'Yes, 100%! Unlike traditional cloud-based converters that upload your confidential files to remote servers, FreePDF Tools processes all files entirely inside your browser memory using WebAssembly and client-side JavaScript. Your files never leave your device or touch an external server.',
  },
  {
    category: 'conversion',
    question: 'How do I convert a PDF to Word (.docx) without losing tables and formatting?',
    answer: 'Select the "PDF to Other" tab, drag & drop your PDF, and select DOCX as the target format. Our intelligent parser reconstructs document paragraphs, table borders, headings, and lists into genuine native Microsoft Word formatting.',
  },
  {
    category: 'resizer',
    question: 'How can I compress an exam photo or passport image to exactly 50 KB or 20 KB?',
    answer: 'Go to the "Photo & KB Resizer" tab, upload your photo or signature, enter your exact target file size in KB (e.g. 50 KB or 20 KB), and select the desired pixel dimensions (like 3.5 x 4.5 cm). The tool uses an iterative binary search compression algorithm to guarantee your file fits under the target limit without unnecessary pixel degradation.',
  },
  {
    category: 'ocr',
    question: 'Can I extract text from scanned PDFs, invoices, and photo receipts?',
    answer: 'Yes! Navigate to the "OCR & Text" tab, upload your scanned PDF or photo, pick the document language (English, Spanish, Hindi, French, German, Chinese, etc.), and click "Start OCR". You can copy the recognized text with 1 click or export it directly as an editable Word (.docx) document.',
  },
  {
    category: 'conversion',
    question: 'How do I combine multiple PDF files into a single document?',
    answer: 'Click on the "Merge / Split / Edit PDF" tab, select the "Merge PDF" tool, and upload multiple PDF files. You can arrange the files in any sequence and download the unified PDF instantly.',
  },
  {
    category: 'privacy',
    question: 'How can I stamp my signature onto a PDF contract online?',
    answer: 'Open the "Sign & Stamp" tab. You can draw your signature on the interactive smooth canvas (or upload a signature image), then place and resize it precisely over any page of your PDF contract.',
  },
  {
    category: 'privacy',
    question: 'How do I redact or black out private information (SSN, phone number) on a PDF?',
    answer: 'Under the "Merge / Split / Edit PDF" tab, choose the "Redact & Censor" or "Sanitize Metadata" tool to permanently burn opaque censor boxes over confidential data and remove hidden document author metadata.',
  }
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mt-16 pt-12 border-t border-slate-800/80 space-y-8" id="faq">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          Frequently Asked Questions & How-To Guides
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Everything You Need to Know About FreePDF Tools
        </h2>
        <p className="text-slate-400 text-sm">
          Learn how in-browser client-side document processing guarantees maximum speed and complete data confidentiality.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-800 bg-slate-900/50 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-700"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="font-semibold text-sm sm:text-base text-slate-200">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 mt-1">
                  <p className="pt-3">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SEO Trust Features Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-6">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">100% Client-Side Private</h4>
            <p className="text-xs text-slate-500 mt-0.5">Files never leave your local browser RAM memory.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Instant Processing</h4>
            <p className="text-xs text-slate-500 mt-0.5">Zero upload queue wait times, powered by WebAssembly.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Unlimited & Free</h4>
            <p className="text-xs text-slate-500 mt-0.5">No email signups, subscriptions, or hidden limits.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
