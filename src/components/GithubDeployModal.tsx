import React, { useState } from 'react';
import { X, Copy, Check, Github, ExternalLink, Terminal, Shield, Sparkles } from 'lucide-react';

interface GithubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubDeployModal: React.FC<GithubDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const workflowYaml = `name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Build static site
        run: npm run build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`;

  const gitCommands = `# 1. Initialize git and commit your code
git init
git add .
git commit -m "Initial commit: OmniPDF Studio"

# 2. Add your GitHub repository remote
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git

# 3. Push to GitHub
git push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Deploy to GitHub Pages</h2>
              <p className="text-xs text-slate-400">Host your converter website for free with 0 server costs</p>
            </div>
          </div>
          <button
            id="btn-close-github-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-slate-300">
          
          {/* Benefit Callout */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white text-xs sm:text-sm">
                100% Client-Side Engine — Zero Backend Server Needed
              </p>
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                Because all conversions (PDF to Word, Images, Excel, Markdown, and PDF creation) run purely inside the user's browser, you can host this on GitHub Pages for free forever with unlimited traffic and absolute privacy.
              </p>
            </div>
          </div>

          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-white">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-xs text-white">1</span>
              <span>Create a Repository on GitHub</span>
            </div>
            <p className="text-xs text-slate-400 pl-8">
              Go to <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center">GitHub New Repo <ExternalLink className="w-3 h-3 ml-0.5" /></a> and create a public or private repository (e.g. <code>omnidoc-converter</code>).
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-white">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-xs text-white">2</span>
              <span>Push this Code to GitHub</span>
            </div>
            <div className="pl-8">
              <div className="relative group rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-slate-200">
                <button
                  onClick={() => copyToClipboard(gitCommands, 'git')}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center space-x-1 transition"
                >
                  {copiedSection === 'git' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'git' ? 'Copied' : 'Copy'}</span>
                </button>
                <pre className="overflow-x-auto pr-16">{gitCommands}</pre>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-white">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-xs text-white">3</span>
              <span>GitHub Actions Workflow (Already included in <code>.github/workflows/deploy.yml</code>)</span>
            </div>
            <div className="pl-8">
              <div className="relative group rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto">
                <button
                  onClick={() => copyToClipboard(workflowYaml, 'yaml')}
                  className="sticky top-0 float-right px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center space-x-1 transition"
                >
                  {copiedSection === 'yaml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'yaml' ? 'Copied' : 'Copy'}</span>
                </button>
                <pre>{workflowYaml}</pre>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-white">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-xs text-white">4</span>
              <span>Enable GitHub Pages in Settings</span>
            </div>
            <div className="pl-8 text-xs text-slate-400 space-y-1">
              <p>1. Open your repository on GitHub and click <strong className="text-white">Settings</strong> &rarr; <strong className="text-white">Pages</strong>.</p>
              <p>2. Under <strong className="text-white">Build and deployment &gt; Source</strong>, choose <strong className="text-indigo-400">GitHub Actions</strong>.</p>
              <p>3. Your website will be live in 60 seconds at: <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">https://&lt;username&gt;.github.io/&lt;repo-name&gt;/</code> 🎉</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
