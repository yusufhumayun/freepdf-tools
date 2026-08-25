export interface ImageResizePreset {
  id: string;
  name: string;
  category: 'id-photo' | 'social' | 'custom' | 'signature';
  width: number;
  height: number;
  aspectRatio: number; // width / height
  maxSizeKb?: number;
  description: string;
}

export interface TargetCompressResult {
  blob: Blob;
  fileName: string;
  originalSize: number;
  finalSize: number;
  width: number;
  height: number;
  quality: number;
  format: string;
  url: string;
}

export const RESIZE_PRESETS: ImageResizePreset[] = [
  {
    id: 'passport-us-in',
    name: 'US Passport / Visa (2x2 in)',
    category: 'id-photo',
    width: 600,
    height: 600,
    aspectRatio: 1,
    maxSizeKb: 240,
    description: 'Standard 2" x 2" (600x600 px @ 300 DPI) for US Passport & Visa',
  },
  {
    id: 'passport-eu-in',
    name: 'Schengen / Indian / UK (35x45 mm)',
    category: 'id-photo',
    width: 413,
    height: 531,
    aspectRatio: 35 / 45,
    maxSizeKb: 100,
    description: 'Standard 35mm x 45mm ID photo for European, Indian & UK visas',
  },
  {
    id: 'exam-job-photo',
    name: 'Job / Exam Portal Photo (20-50 KB)',
    category: 'id-photo',
    width: 200,
    height: 230,
    aspectRatio: 200 / 230,
    maxSizeKb: 50,
    description: 'Standard 200x230 px candidate photo under 50KB for government/job portals',
  },
  {
    id: 'exam-signature-portal',
    name: 'Job / Exam Signature (10-20 KB)',
    category: 'signature',
    width: 140,
    height: 60,
    aspectRatio: 140 / 60,
    maxSizeKb: 20,
    description: '140x60 px scanned handwritten signature capped below 20KB',
  },
  {
    id: 'linkedin-avatar',
    name: 'LinkedIn / Social Avatar (1:1)',
    category: 'social',
    width: 800,
    height: 800,
    aspectRatio: 1,
    description: 'High-definition 1:1 square profile picture',
  },
  {
    id: 'linkedin-banner',
    name: 'LinkedIn Header Banner',
    category: 'social',
    width: 1584,
    height: 396,
    aspectRatio: 1584 / 396,
    description: '1584 x 396 px horizontal profile banner',
  },
  {
    id: 'instagram-portrait',
    name: 'Instagram Portrait (4:5)',
    category: 'social',
    width: 1080,
    height: 1350,
    aspectRatio: 4 / 5,
    description: '1080 x 1350 px optimized vertical feed post',
  },
  {
    id: 'custom-free',
    name: 'Custom Dimensions & Exact KB',
    category: 'custom',
    width: 1200,
    height: 800,
    aspectRatio: 1.5,
    description: 'Specify your own custom width, height, and file size target',
  },
];

/**
 * Iteratively compresses an image canvas to meet a strict maximum file size in Kilobytes (KB)
 */
export async function resizeAndCompressImage(
  file: File | Blob,
  targetWidth: number,
  targetHeight: number,
  options: {
    format?: 'image/jpeg' | 'image/png' | 'image/webp';
    targetMaxKb?: number;
    maintainAspectRatio?: boolean;
    cropMode?: 'contain' | 'cover' | 'stretch';
    backgroundColor?: string;
    transparentBackground?: boolean;
    isSignatureClean?: boolean; // Boost contrast & turn off-white background transparent
  } = {}
): Promise<TargetCompressResult> {
  const {
    format = 'image/jpeg',
    targetMaxKb,
    cropMode = 'cover',
    backgroundColor = '#ffffff',
    isSignatureClean = false,
  } = options;

  // 1. Load image onto memory
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (err) => reject(err);
    image.src = url;
  });

  // 2. Setup canvas
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(targetWidth));
  canvas.height = Math.max(1, Math.round(targetHeight));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize canvas context');

  // Fill background
  if (format === 'image/jpeg' || (backgroundColor && backgroundColor !== 'transparent')) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw image with requested crop mode
  if (cropMode === 'stretch') {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  } else if (cropMode === 'contain') {
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  } else {
    // cover mode (center crop)
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  }

  // If signature cleaning is enabled, boost contrast and remove grayish paper background
  if (isSignatureClean) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Threshold: if bright enough (paper background), turn pure white or transparent
      if (gray > 195) {
        if (format === 'image/png') {
          data[i + 3] = 0; // Transparent
        } else {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
      } else {
        // Darken dark ink pixels for punchy crisp signature
        const factor = Math.max(0, (gray / 195) * 0.7);
        data[i] = Math.round(r * factor);
        data[i + 1] = Math.round(g * factor);
        data[i + 2] = Math.round(b * factor);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // 3. Binary Search / Iterative Compression for Target Max KB
  let bestBlob: Blob | null = null;
  let bestQuality = 0.92;

  if (format === 'image/png') {
    // PNG doesn't support variable quality in toBlob, export directly
    bestBlob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/png')
    );
  } else {
    // JPEG or WEBP: Binary search quality parameter to hit under targetMaxKb
    if (!targetMaxKb || targetMaxKb <= 0) {
      bestQuality = 0.88;
      bestBlob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b || new Blob()), format, bestQuality)
      );
    } else {
      const targetBytes = targetMaxKb * 1024;
      let minQ = 0.05;
      let maxQ = 0.98;
      let iterations = 0;

      while (iterations < 7) {
        iterations++;
        const midQ = (minQ + maxQ) / 2;
        const currentBlob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b || new Blob()), format, midQ)
        );

        bestBlob = currentBlob;
        bestQuality = midQ;

        if (currentBlob.size <= targetBytes) {
          if (currentBlob.size >= targetBytes * 0.85) {
            // Target satisfied within 15% margin
            break;
          }
          // Can try higher quality
          minQ = midQ;
        } else {
          // File too large, reduce quality
          maxQ = midQ;
        }
      }
    }
  }

  if (!bestBlob) {
    throw new Error('Failed to generate image');
  }

  const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
  const originalFileName = (file as File).name || 'image';
  const baseName = originalFileName.replace(/\.[^/.]+$/, '');

  return {
    blob: bestBlob,
    fileName: `${baseName}_${canvas.width}x${canvas.height}.${ext}`,
    originalSize: file.size,
    finalSize: bestBlob.size,
    width: canvas.width,
    height: canvas.height,
    quality: Math.round(bestQuality * 100),
    format: ext,
    url: URL.createObjectURL(bestBlob),
  };
}
