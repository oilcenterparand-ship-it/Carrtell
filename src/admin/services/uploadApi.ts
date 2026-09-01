import { supabase } from '../../lib/supabase';
import { optimizeImageWithWatermark } from '../../lib/smartImage';
import { getActiveWatermarkProfile, getImageSettings, type WatermarkTarget } from './imageSettingsApi';

export type UploadFolder = 'products' | 'banners' | 'brands' | 'categories' | 'packages' | 'service-icons' | 'watermarks';

export type ImageUploadOptions = {
  maxSize?: number;
  quality?: number;
  watermarkEnabled?: boolean;
};

export const CARRTELL_STORAGE_BUCKET = 'carrtell-media';

const DEFAULT_OPTIONS_BY_FOLDER: Record<UploadFolder, Required<Pick<ImageUploadOptions, 'maxSize' | 'quality'>>> = {
  products: { maxSize: 900, quality: 0.82 },
  banners: { maxSize: 1600, quality: 0.84 },
  brands: { maxSize: 500, quality: 0.86 },
  categories: { maxSize: 420, quality: 0.86 },
  packages: { maxSize: 900, quality: 0.82 },
  'service-icons': { maxSize: 320, quality: 0.86 },
  watermarks: { maxSize: 500, quality: 0.9 },
};

export type OptimizedImageResult = {
  file: File;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  skippedOptimization: boolean;
};

function formatSafeBaseName(fileName: string) {
  const rawName = fileName.replace(/\.[^/.]+$/, '') || 'image';
  return rawName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff-_]+/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

function folderToTarget(folder: UploadFolder): WatermarkTarget | null {
  if (folder === 'watermarks' || folder === 'service-icons') return null;
  return folder as WatermarkTarget;
}

function normalizeStorageError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown storage error');
  if (message.includes('Bucket not found')) return 'Bucket carrtell-media پیدا نشد. SQL فایل storage_bucket_policy_fix.sql را اجرا کن.';
  if (message.includes('row-level security') || message.includes('policy') || message.includes('403')) return 'Policy آپلود Storage کامل نیست. SQL فایل storage_bucket_policy_fix.sql را اجرا کن.';
  return message;
}

async function getWatermarkOptions(folder: UploadFolder, force?: boolean) {
  const defaults = DEFAULT_OPTIONS_BY_FOLDER[folder];

  if (folder === 'watermarks') {
    return {
      maxWidth: defaults.maxSize,
      maxHeight: defaults.maxSize,
      quality: defaults.quality,
      watermarkEnabled: false,
    };
  }

  try {
    const settings = await getImageSettings();
    const profile = getActiveWatermarkProfile(settings);
    const target = folderToTarget(folder);
    const enabled = force ?? (settings.enabled && !!target && settings.applyTo[target]);

    return {
      maxWidth: defaults.maxSize,
      maxHeight: defaults.maxSize,
      quality: defaults.quality,
      watermarkEnabled: enabled,
      watermarkTextEnabled: enabled && profile.textEnabled,
      watermarkLogoEnabled: enabled && profile.logoEnabled,
      watermarkText: profile.text,
      watermarkLogoUrl: profile.logoUrl || undefined,
      watermarkOpacity: profile.opacity,
      watermarkPosition: profile.position,
      watermarkTextColor: profile.textColor,
      watermarkTextSize: profile.textSize,
      watermarkLogoSize: profile.logoSize,
    };
  } catch (error) {
    console.warn('Watermark settings unavailable, using safe defaults', error);
    return {
      maxWidth: defaults.maxSize,
      maxHeight: defaults.maxSize,
      quality: defaults.quality,
      watermarkEnabled: folder === 'products',
      watermarkTextEnabled: folder === 'products',
      watermarkLogoEnabled: false,
      watermarkText: 'Carrtell.ir',
      watermarkOpacity: 0.2,
      watermarkPosition: 'bottom-right' as const,
    };
  }
}

export async function optimizeImageForUpload(
  file: File,
  folder: UploadFolder = 'products',
  options: ImageUploadOptions = {}
): Promise<OptimizedImageResult> {
  if (!file) throw new Error('فایلی انتخاب نشده است');

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return {
      file,
      originalSize: file.size,
      optimizedSize: file.size,
      width: 0,
      height: 0,
      skippedOptimization: true,
    };
  }

  const smartOptions = await getWatermarkOptions(folder, options.watermarkEnabled);
  const optimized = await optimizeImageWithWatermark(file, smartOptions);

  return {
    file: optimized.file,
    originalSize: optimized.originalSize,
    optimizedSize: optimized.optimizedSize,
    width: optimized.width || 0,
    height: optimized.height || 0,
    skippedOptimization: false,
  };
}

export async function uploadPublicImage(
  file: File,
  folder: UploadFolder = 'products',
  options: ImageUploadOptions = {}
) {
  if (!file) throw new Error('فایلی انتخاب نشده است');

  const optimized = await optimizeImageForUpload(file, folder, options);
  const fileToUpload = optimized.file;
  const extension = fileToUpload.type === 'image/webp' ? 'webp' : (fileToUpload.name.split('.').pop() || 'webp');
  const safeBase = formatSafeBaseName(file.name);
  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeBase}.${extension}`;

  const { error } = await supabase.storage
    .from(CARRTELL_STORAGE_BUCKET)
    .upload(safeName, fileToUpload, {
      cacheControl: '31536000',
      upsert: true,
      contentType: fileToUpload.type || 'image/webp',
    });

  if (error) throw new Error(normalizeStorageError(error));

  const { data } = supabase.storage
    .from(CARRTELL_STORAGE_BUCKET)
    .getPublicUrl(safeName);

  return data.publicUrl;
}

/** Upload an image that has already passed through optimizeImageForUpload.
 * This avoids performing the relatively expensive canvas/WebP conversion twice
 * when the UI needs to show the compression result before uploading. */
export async function uploadOptimizedPublicImage(
  optimized: OptimizedImageResult,
  originalFileName: string,
  folder: UploadFolder = 'products'
) {
  const fileToUpload = optimized.file;
  const extension = fileToUpload.type === 'image/webp' ? 'webp' : (fileToUpload.name.split('.').pop() || 'webp');
  const safeBase = formatSafeBaseName(originalFileName);
  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeBase}.${extension}`;

  const { error } = await supabase.storage
    .from(CARRTELL_STORAGE_BUCKET)
    .upload(safeName, fileToUpload, {
      cacheControl: '31536000',
      upsert: true,
      contentType: fileToUpload.type || 'image/webp',
    });

  if (error) throw new Error(normalizeStorageError(error));

  const { data } = supabase.storage
    .from(CARRTELL_STORAGE_BUCKET)
    .getPublicUrl(safeName);

  return data.publicUrl;
}
