import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  HelpCircle,
  FileCheck,
  AlertCircle,
  BookOpen,
  ListOrdered,
  Layers,
  Globe,
  Loader2,
  ChevronDown,
  RotateCcw,
  Info
} from 'lucide-react';
import { marked } from 'marked';
import { loadPdfDocument, extractPdfTextStructure, ExtractedPageText } from '../services/pdfToFormat';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface DocumentContext {
  filename: string;
  size: number;
  numPages: number;
  totalWords: number;
  text: string;
  pages: ExtractedPageText[];
}

const SAMPLE_DOCUMENTS = [
  {
    title: '📄 Standard Business & NDA Agreement',
    filename: 'Mutual_NDA_Agreement_Sample.pdf',
    text: `MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT

1. PURPOSE AND SCOPE
This Non-Disclosure Agreement ("Agreement") is entered into on January 15, 2026, between Alpha Tech Innovations Inc. ("Disclosing Party") and Beta Solutions LLC ("Receiving Party"). The parties wish to explore a potential business partnership regarding Artificial Intelligence software development and cloud integration.

2. CONFIDENTIAL INFORMATION
Confidential Information includes all proprietary technical data, source code, financial projections, customer lists, business strategies, and product roadmap documents disclosed by either party during discussions.

3. OBLIGATIONS & RESTRICTIONS
The Receiving Party agrees to:
- Maintain confidentiality with the same degree of care used for its own confidential data (no less than reasonable care).
- Limit disclosure strictly to employees with a legitimate "need to know".
- Not reverse engineer, decompile, or copy any software architecture shared.
- Return or permanently destroy all confidential materials within 14 business days of written request.

4. DURATION & TERM
This agreement remains binding for a period of three (3) years from the effective date. Trade secret obligations shall survive indefinitely under applicable state and federal laws.

5. GOVERNING LAW & JURISDICTION
This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to conflict of law principles. Any legal proceedings shall take place in San Francisco County Courts.`
  },
  {
    title: '🔬 AI & Cloud Computing Research Overview',
    filename: 'AI_Cloud_Efficiency_Report_2026.pdf',
    text: `EXECUTIVE RESEARCH BRIEF: OPTIMIZING BROWSER-BASED INFERENCE & WEB COMPUTING (2026)

Abstract:
As WebAssembly (Wasm) and WebGPU runtimes mature, client-side data processing is rapidly displacing traditional server-bound pipelines. This paper evaluates the performance, security, and bandwidth savings of client-side document processing compared to cloud-hosted equivalents.

Key Findings:
1. Latency Reductions: Local document parsing and OCR on consumer laptops showed an average 78% reduction in latency compared to server round-trips for files under 25MB.
2. Privacy Compliance: By ensuring zero data transit across public networks, organizations achieve instant GDPR, HIPAA, and CCPA compliance for personal document handling.
3. Bandwidth Savings: Cloud egress and ingress transfer costs dropped to $0 for document transformation workflows.
4. Scalability Limits: Documents exceeding 300 pages or 150MB still benefit from hybrid serverless chunking due to browser tab memory constraints (typically capped at 2GB heap per worker).

Recommendations for 2026-2027:
- Implement WebAssembly SIMD acceleration for text search and compression.
- Use client-side embeddings for zero-knowledge vector indexing on confidential PDFs.`
  }
];

const QUICK_PROMPTS = [
  { id: 'summarize', label: 'Summarize Document', icon: Sparkles, color: 'text-indigo-400', task: 'summarize', prompt: 'Please generate a comprehensive executive summary of this document with key highlights.' },
  { id: 'action_items', label: 'Action Items & Deadlines', icon: ListOrdered, color: 'text-amber-400', task: 'action_items', prompt: 'Extract all action items, obligations, deliverables, and important deadlines into a checklist.' },
  { id: 'key_points', label: 'Key Figures & Statistics', icon: BookOpen, color: 'text-cyan-400', task: 'key_points', prompt: 'What are the most critical numbers, statistics, metrics, and dates mentioned in this file?' },
  { id: 'explain_simple', label: 'Explain in Simple Terms', icon: Info, color: 'text-emerald-400', task: 'explain_simple', prompt: 'Explain the main concepts of this document in simple, jargon-free English (ELI5).' },
  { id: 'quiz', label: 'Generate 5 Quiz Questions', icon: HelpCircle, color: 'text-purple-400', task: 'quiz', prompt: 'Create a 5-question comprehension quiz based on this document with answers explained.' },
];

const TRANSLATION_LANGUAGES = [
  'Spanish',
  'Hindi',
  'French',
  'German',
  'Arabic',
  'Chinese (Mandarin)',
  'Japanese',
  'Portuguese',
  'Bengali',
  'Russian'
];

export const AiPdfChatSuite: React.FC = () => {
  const [doc, setDoc] = useState<DocumentContext | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Spanish');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState<boolean>(false);
  const [showRawTextModal, setShowRawTextModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiGenerating]);

  // Handle PDF File Upload & Local Text Parsing
  const processPdfFile = async (file: File) => {
    setIsLoadingDoc(true);
    setLoadingStatus('Loading document...');
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const pdf = await loadPdfDocument(file);
        setLoadingStatus(`Reading ${pdf.numPages} pages in browser...`);
        const extractedPages = await extractPdfTextStructure(pdf, (progress, status) => {
          setLoadingStatus(status);
        });

        const fullText = extractedPages.map(p => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n\n');
        const words = fullText.trim().split(/\s+/).filter(Boolean).length;

        const newDoc: DocumentContext = {
          filename: file.name,
          size: file.size,
          numPages: pdf.numPages,
          totalWords: words,
          text: fullText,
          pages: extractedPages,
        };

        setDoc(newDoc);
        setMessages([
          {
            id: 'init-msg',
            sender: 'assistant',
            content: `👋 I have analyzed **"${file.name}"** (${pdf.numPages} pages, ~${words.toLocaleString()} words).\n\nWhat would you like to know or extract from this document? You can use the quick prompts above or ask any specific question!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const newDoc: DocumentContext = {
          filename: file.name,
          size: file.size,
          numPages: 1,
          totalWords: words,
          text,
          pages: [{ pageNumber: 1, text, lines: text.split('\n') }],
        };
        setDoc(newDoc);
        setMessages([
          {
            id: 'init-msg',
            sender: 'assistant',
            content: `👋 Loaded **"${file.name}"** (~${words.toLocaleString()} words).\n\nFeel free to ask questions, request a summary, or extract action items!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        alert('Please upload a PDF (.pdf) or text (.txt) file.');
      }
    } catch (err: any) {
      console.error('Error reading PDF:', err);
      alert('Could not read text from this file. If it is a scanned image PDF, please try the OCR tool first!');
    } finally {
      setIsLoadingDoc(false);
      setLoadingStatus('');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleSelect = (sample: typeof SAMPLE_DOCUMENTS[0]) => {
    const words = sample.text.trim().split(/\s+/).filter(Boolean).length;
    const sampleDoc: DocumentContext = {
      filename: sample.filename,
      size: 15420,
      numPages: 2,
      totalWords: words,
      text: sample.text,
      pages: [{ pageNumber: 1, text: sample.text, lines: sample.text.split('\n') }],
    };
    setDoc(sampleDoc);
    setMessages([
      {
        id: 'sample-init',
        sender: 'assistant',
        content: `Loaded sample document: **"${sample.title}"**.\n\nTry clicking **"Summarize Document"** or ask: *"What are the main restrictions in this agreement?"*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Send message to Server-Side Gemini API
  const handleSendMessage = async (customPrompt?: string, task?: string, targetLang?: string) => {
    const promptToSend = customPrompt || inputValue;
    if (!promptToSend.trim() || isAiGenerating) return;

    if (!doc) {
      alert('Please upload or select a document first!');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!customPrompt) setInputValue('');
    setIsAiGenerating(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ sender: m.sender, content: m.content })),
          documentContext: {
            filename: doc.filename,
            text: doc.text,
            numPages: doc.numPages,
            totalWords: doc.totalWords,
          },
          task: task || 'chat',
          targetLanguage: targetLang,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer from AI server.');
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: data.reply || 'No response provided.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...newMessages, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: `⚠️ **Error processing request**: ${err.message || 'Unable to connect to Gemini API.'}\n\n*Tip: Check that the Gemini API key is configured.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportChat = (format: 'md' | 'txt') => {
    if (messages.length === 0) return;
    const header = `# FreePDF AI Chat - ${doc?.filename || 'Document'}\nDate: ${new Date().toLocaleString()}\n\n---\n\n`;
    const body = messages
      .map(m => `### ${m.sender === 'user' ? '👤 User' : '🤖 AI Assistant'} (${m.timestamp})\n\n${m.content}\n\n`)
      .join('\n');

    const fullContent = header + body;
    const blob = new Blob([fullContent], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${doc?.filename || 'doc'}_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMarkdown = (content: string) => {
    try {
      const html = marked.parse(content, { gfm: true, breaks: true });
      return { __html: html as string };
    } catch {
      return { __html: content };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Title & Privacy Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
                AI PDF Assistant
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Powered by Gemini
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Ask questions, summarize long reports, extract deadlines & tables from any PDF
            </p>
          </div>
        </div>

        {/* Current Document Status Badge / Actions */}
        {doc ? (
          <div className="flex items-center gap-2 flex-wrap bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 px-2.5 py-1 bg-slate-900 rounded-lg text-xs text-slate-200">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold max-w-[150px] truncate">{doc.filename}</span>
              <span className="text-slate-500">({doc.numPages} pgs • ~{doc.totalWords.toLocaleString()} words)</span>
            </div>

            <button
              onClick={() => setShowRawTextModal(true)}
              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700 cursor-pointer"
              title="Inspect extracted text"
            >
              View Text
            </button>

            <button
              onClick={() => {
                setDoc(null);
                setMessages([]);
              }}
              className="px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 rounded-lg transition border border-rose-800/40 cursor-pointer"
              title="Change document"
            >
              Change File
            </button>
          </div>
        ) : null}
      </div>

      {/* Main Grid: Document Loader OR Chat View */}
      {!doc ? (
        <div className="space-y-6">
          {/* File Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center space-y-4 shadow-lg hover:shadow-indigo-500/10"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processPdfFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 group-hover:scale-110 group-hover:border-indigo-400 transition-all flex items-center justify-center text-indigo-400 shadow-inner">
              {isLoadingDoc ? (
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              ) : (
                <UploadCloud className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                {isLoadingDoc ? loadingStatus : 'Drop your PDF here to chat with AI'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Supports books, study notes, contracts, research papers, resumes, and invoices.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-950/60 px-3.5 py-1.5 rounded-full border border-indigo-800/60">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% In-Browser Text Extraction • Instant Analysis</span>
            </div>
          </div>

          {/* Sample Documents for Instant Trial */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Or Try with a Sample Document:
              </h4>
              <span className="text-xs text-slate-500">1-click test</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SAMPLE_DOCUMENTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSampleSelect(sample)}
                  className="flex items-start text-left p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/60 flex items-center justify-center text-indigo-400 shrink-0 mr-3 group-hover:scale-105 transition">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition">
                      {sample.title}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {sample.filename} • Ready to summarize & test questions
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Chat Interface Active */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column: Quick Action Pills & Tools */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Quick Actions Panel */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Quick AI Tasks
              </h4>

              <div className="space-y-1.5">
                {QUICK_PROMPTS.map((qp) => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={qp.id}
                      disabled={isAiGenerating}
                      onClick={() => handleSendMessage(qp.prompt, qp.task)}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-950/80 hover:bg-indigo-950/50 hover:text-white border border-slate-800 hover:border-indigo-500/40 transition text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${qp.color} group-hover:scale-110 transition`} />
                      <span className="truncate">{qp.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Translate Action */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-sky-400" /> Translate Summary
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 hover:border-slate-700"
                  >
                    <span>{selectedLanguage}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showLanguageDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto p-1">
                      {TRANSLATION_LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setSelectedLanguage(lang);
                            setShowLanguageDropdown(false);
                            handleSendMessage(`Please provide a concise summary of this document translated into ${lang}.`, 'translate', lang);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-indigo-600 hover:text-white rounded-lg transition"
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Chat Management Tools */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Conversation
              </h4>

              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleExportChat('md')}
                  disabled={messages.length <= 1}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export Chat (.md)</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm('Clear chat history for this document?')) {
                      setMessages([
                        {
                          id: 'cleared-msg',
                          sender: 'assistant',
                          content: `Chat history cleared. You are still chatting with **"${doc.filename}"**. What would you like to know?`,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        },
                      ]);
                    }
                  }}
                  disabled={messages.length <= 1}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/40 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Chat Canvas */}
          <div className="lg:col-span-3 flex flex-col h-[650px] bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            
            {/* Chat Top Status Header */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold text-slate-200">Gemini 3.7 Flash Active</span>
                <span className="text-slate-500">• Context: {doc.filename}</span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                {messages.length} messages
              </span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 p-0.5 shrink-0 shadow-md">
                        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                          <Bot className="w-4 h-4 text-indigo-400" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`relative group max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : msg.isError
                          ? 'bg-rose-950/80 border border-rose-700 text-rose-200 rounded-tl-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {/* Message Content with Markdown parsing */}
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div
                          className="prose prose-invert prose-sm max-w-none text-slate-200 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-indigo-400 [&_p]:my-1.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs [&_strong]:text-indigo-200 [&_blockquote]:border-l-indigo-400 [&_blockquote]:bg-slate-900/50 [&_blockquote]:px-2 [&_blockquote]:py-1 [&_code]:bg-slate-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
                          dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                        />
                      )}

                      {/* Message Meta / Action Toolbar */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/40 text-[10px] text-slate-400">
                        <span>{msg.timestamp}</span>

                        {!isUser && !msg.isError && (
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="flex items-center space-x-1 hover:text-indigo-300 transition cursor-pointer px-1 py-0.5 rounded"
                            title="Copy response"
                          >
                            {copiedIndex === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* AI Thinking Animation */}
              {isAiGenerating && (
                <div className="flex items-start space-x-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 p-0.5 shrink-0 shadow-md">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-indigo-400 animate-spin" />
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-300 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-slate-400 ml-1">Analyzing document with Gemini...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Ask a question about ${doc.filename}...`}
                  disabled={isAiGenerating}
                  className="flex-1 bg-slate-900 text-slate-100 text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder:text-slate-500"
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isAiGenerating}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium rounded-xl transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-indigo-600/30 shrink-0"
                  title="Send Question"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 mt-2">
                <span>Press Enter to send</span>
                <span>Context: ~{doc.totalWords.toLocaleString()} words loaded in browser</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Raw Extracted Text Inspection Modal */}
      {showRawTextModal && doc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Extracted Document Text Preview</h3>
              </div>
              <button
                onClick={() => setShowRawTextModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-slate-300 bg-slate-950/50 whitespace-pre-wrap leading-relaxed">
              {doc.text}
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>{doc.numPages} Pages Extracted</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(doc.text);
                  alert('Full text copied to clipboard!');
                }}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs"
              >
                Copy Full Text
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
