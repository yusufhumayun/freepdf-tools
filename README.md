# 📄 FreePDF Tools

> **100% Free, Private & Client-Side PDF, OCR & Photo Utility Suite**  
> 🔗 **Live Website:** [https://yusufhumayun.github.io/freepdf-tools/](https://yusufhumayun.github.io/freepdf-tools/)

---

## 🌟 Overview

**FreePDF Tools** is a modern, privacy-first web application designed for students, job applicants, professionals, and everyday users. Unlike conventional PDF tools that upload sensitive documents to third-party cloud servers, **FreePDF Tools processes 100% of your files locally in your browser**. Your documents, signatures, and photos never leave your device.

---

## ✨ Key Features & Capabilities

### 1. 🤖 AI PDF Assistant (Chat with Document via Gemini)
- **Chat & Q&A**: Ask any question in natural language about your uploaded document.
- **Executive Summarization**: Generate structured summaries with core highlights, critical takeaways, and next steps in 1 click.
- **Action Items & Deadlines**: Extract all obligations, milestones, and deliverable checklists.
- **Key Figures & Statistics**: Automatically pull out all financial figures, dates, and metrics.
- **Plain English (ELI5) Mode**: Explain dense technical, academic, or legal jargon in simple terms.
- **Multi-Language Translation**: Translate document insights into Spanish, French, Hindi, German, Arabic, Chinese, and more.
- **Study Quiz Generator**: Create 5-question comprehension quizzes with answer keys for exam revision.
- **Sample Documents Included**: Instant trial with pre-loaded sample agreements and research briefs.

### 2. 🔄 PDF Conversion & Extraction
- **PDF to Other**: Convert PDF documents to **Word (.docx)**, **Excel (.xlsx)**, **Images (JPG, PNG)**, and clean plain text (.txt).
- **Other to PDF**: Convert images (JPG, PNG, WebP) and document files directly into high-quality PDFs.
- **Batch Processing**: Convert multiple documents simultaneously with 1-click batch download (.zip or individual files).

### 2. 🔍 OCR & Text Recognition (Multi-Language)
- Extract selectable text from **scanned PDF pages** and **images** (receipts, book pages, handwritten notes).
- Powered by client-side WebAssembly OCR (Tesseract.js).
- Built-in live text editor with search, word count, line count, and one-click copy/export to `.txt`.

### 3. ✂️ Exam Photo & Signature KB Resizer (Job/Govt Portal Ready)
- Tailored for exam portals, government forms, visa applications, and student registrations.
- **Exact File Size Target**: Compress and resize images to precise target ranges (e.g., *20 KB – 50 KB*, *50 KB – 100 KB*, or custom KB).
- **Standard Presets**:
  - Passport Photo (3.5 × 4.5 cm / 200×230 px)
  - Signature Box (3.5 × 1.5 cm / 140×60 px)
  - Postcard / Document size
- Interactive cropping, rotation, aspect ratio locking, and real-time KB preview.

### 4. ✍️ PDF Sign & Stamp
- Add verified signatures and official stamps to any PDF document.
- **3 Signature Methods**:
  - 🖌️ **Draw**: Smooth digital pen with custom color, thickness, and smoothing.
  - ⌨️ **Type**: Professional cursive and calligraphic signature fonts.
  - 📤 **Upload**: Import existing signature images with automatic transparent background detection.
- Multi-page navigation, drag-and-drop placement, live scaling, and instant PDF re-export.

### 5. 📑 Essential PDF Utilities
- **Merge PDF**: Combine multiple PDFs into a single organized document with drag-and-drop reordering.
- **Split PDF**: Extract specific page ranges or split each page into separate files.
- **Page Numbering**: Add customizable page numbers (header/footer, multiple positions & styles).
- **Watermarking**: Stamp custom text or confidentiality watermarks across pages.
- **Rotate & Organize**: Rotate orientation (90°, 180°, 270°) and delete unwanted pages.

---

## 🔒 Privacy & Security Guarantee

- 🛡️ **Zero Cloud Uploads**: All WebAssembly, Canvas, and PDF manipulations happen strictly within your browser's local sandbox.
- ⚡ **Works Offline**: Once loaded, tools work seamlessly even without an active internet connection.
- 🚫 **No Tracking / No Paywalls**: No signup required, no file size caps, and no daily limits.

---

## 🛠️ Built With

- **Framework**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Engines**: `pdf-lib`, `pdfjs-dist`
- **OCR Engine**: `tesseract.js` (WebAssembly)
- **Document Exporting**: `docx`, `xlsx`, `jszip`
- **Deployment**: GitHub Actions + GitHub Pages

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yusufhumayun/freepdf-tools.git
   cd freepdf-tools
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🌐 Deployment to GitHub Pages

This project is configured with automated GitHub Actions.

1. Fork or clone this repository.
2. Ensure your repository is named `freepdf-tools` (or update `base: './'` in `vite.config.ts`).
3. Go to **Settings** → **Pages** on your GitHub repository.
4. Under **Build and deployment > Source**, select **GitHub Actions**.
5. Push any commit to the `main` branch — GitHub will automatically build and deploy the app!

---

## 💬 Feedback & Contributions

Contributions, bug reports, and feature suggestions are welcome!

- 🐛 **Report an Issue**: Open a GitHub issue or use the built-in **Feedback** button in the app.
- 💡 **Suggest a Feature**: Let us know what PDF or image tool you'd like to see next.
- 📧 **Direct Contact**: [yusufhumayunhsbc@gmail.com](mailto:yusufhumayunhsbc@gmail.com)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

*Made with ❤️ for privacy, simplicity, and speed.*
