export type WatermarkPosition = 'top-right' | 'top-left' | 'center' | 'bottom-right' | 'bottom-left';

export interface SmartImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  watermarkEnabled?: boolean;
  watermarkTextEnabled?: boolean;
  watermarkLogoEnabled?: boolean;
  watermarkText?: string;
  watermarkLogoUrl?: string;
  watermarkOpacity?: number;
  watermarkPosition?: WatermarkPosition;
  watermarkTextColor?: string;
  watermarkTextSize?: number;
  watermarkLogoSize?: number;
  backgroundColor?: string;
}

export interface SmartImageResult {
  file: File;
  previewUrl: string;
  originalSize: number;
  optimizedSize: number;
  savedPercent: number;
  width?: number;
  height?: number;
}

const DEFAULT_OPTIONS: Required<Omit<SmartImageOptions, 'watermarkLogoUrl'>> & { watermarkLogoUrl?: string } = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.82,
  watermarkEnabled: true,
  watermarkTextEnabled: true,
  watermarkLogoEnabled: false,
  watermarkText: 'Carrtell.ir',
  watermarkLogoUrl: undefined,
  watermarkOpacity: 0.2,
  watermarkPosition: 'bottom-right',
  watermarkTextColor: '#111827',
  watermarkTextSize: 4.5,
  watermarkLogoSize: 18,
  backgroundColor: 'transparent',
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function getTargetSize(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

function getPosition(canvasW: number, canvasH: number, itemW: number, itemH: number, position: WatermarkPosition, margin: number) {
  switch (position) {
    case 'top-left': return { x: margin, y: margin };
    case 'top-right': return { x: canvasW - itemW - margin, y: margin };
    case 'center': return { x: (canvasW - itemW) / 2, y: (canvasH - itemH) / 2 };
    case 'bottom-left': return { x: margin, y: canvasH - itemH - margin };
    case 'bottom-right':
    default: return { x: canvasW - itemW - margin, y: canvasH - itemH - margin };
  }
}

async function canvasToWebpFile(canvas: HTMLCanvasElement, fileName: string, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('خطا در تبدیل عکس به WebP'));
      const safeName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-');
      resolve(new File([blob], `${safeName || 'image'}.webp`, { type: 'image/webp' }));
    }, 'image/webp', quality);
  });
}

export async function optimizeImageWithWatermark(inputFile: File, options: SmartImageOptions = {}): Promise<SmartImageResult> {
  const opt = { ...DEFAULT_OPTIONS, ...options };
  const source = await loadImageFromFile(inputFile);
  const size = getTargetSize(source.naturalWidth, source.naturalHeight, opt.maxWidth, opt.maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('مرورگر از پردازش عکس پشتیبانی نمی‌کند');

  // Keep PNG/WebP alpha intact. A solid canvas background permanently burns a
  // white/black rectangle into otherwise transparent product and icon files.
  if (opt.backgroundColor && opt.backgroundColor !== 'transparent') {
    ctx.fillStyle = opt.backgroundColor;
    ctx.fillRect(0, 0, size.width, size.height);
  } else {
    ctx.clearRect(0, 0, size.width, size.height);
  }
  ctx.drawImage(source, 0, 0, size.width, size.height);

  if (opt.watermarkEnabled) {
    const opacity = Math.max(0.05, Math.min(1, opt.watermarkOpacity));
    const margin = Math.max(12, Math.round(size.width * 0.035));
    ctx.save();
    ctx.globalAlpha = opacity;

    if (opt.watermarkLogoEnabled && opt.watermarkLogoUrl) {
      try {
        const logo = await loadImageFromUrl(opt.watermarkLogoUrl);
        const logoW = Math.round(size.width * (Math.max(5, Math.min(50, opt.watermarkLogoSize)) / 100));
        const logoH = Math.round((logo.naturalHeight / logo.naturalWidth) * logoW);
        const pos = getPosition(size.width, size.height, logoW, logoH, opt.watermarkPosition, margin);
        ctx.drawImage(logo, pos.x, pos.y, logoW, logoH);
      } catch {
        // اگر لوگو لود نشد، آپلود عکس متوقف نشود.
      }
    }

    if (opt.watermarkTextEnabled && opt.watermarkText?.trim()) {
      const fontSize = Math.max(14, Math.round(size.width * (Math.max(1, Math.min(12, opt.watermarkTextSize)) / 100)));
      ctx.font = `700 ${fontSize}px Vazirmatn, Tahoma, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.direction = 'ltr';
      const text = opt.watermarkText.trim();
      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      const textH = fontSize;
      const pos = getPosition(size.width, size.height, textW, textH, opt.watermarkPosition, margin);
      ctx.fillStyle = opt.watermarkTextColor || '#111827';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.08));
      ctx.strokeText(text, pos.x, pos.y + textH / 2);
      ctx.fillText(text, pos.x, pos.y + textH / 2);
    }

    ctx.restore();
  }

  const optimized = await canvasToWebpFile(canvas, inputFile.name, opt.quality);
  return {
    file: optimized,
    previewUrl: URL.createObjectURL(optimized),
    originalSize: inputFile.size,
    optimizedSize: optimized.size,
    savedPercent: inputFile.size ? Math.max(0, Math.round((1 - optimized.size / inputFile.size) * 100)) : 0,
    width: size.width,
    height: size.height,
  };
}
