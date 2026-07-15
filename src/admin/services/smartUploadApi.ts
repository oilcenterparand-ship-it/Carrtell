import { supabase } from '../../lib/supabase';
import { optimizeImageWithWatermark, SmartImageOptions, SmartImageResult } from '../../lib/smartImage';

export type UploadFolder = 'products' | 'banners' | 'brands' | 'categories' | 'packages' | 'watermarks';

export interface SmartUploadResult extends SmartImageResult {
  path: string;
  publicUrl: string;
}

// Carrtell upload system uses one single bucket to avoid policy/bucket name conflicts.
export const CARRTELL_STORAGE_BUCKET = 'carrtell-media';

function safeBaseName(fileName: string) {
  const base = fileName.replace(/\.[^/.]+$/, '') || 'image';
  return base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff-_]+/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function makePath(folder: UploadFolder, file: File) {
  const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ext = file.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'webp');
  return `${folder}/${id}-${safeBaseName(file.name)}.${ext}`;
}

function normalizeStorageError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown storage error');
  if (message.includes('Bucket not found')) return 'Bucket carrtell-media پیدا نشد. SQL فایل storage_bucket_policy_fix.sql را اجرا کن.';
  if (message.includes('row-level security') || message.includes('policy') || message.includes('403')) return 'دسترسی Storage کامل نیست. SQL فایل storage_bucket_policy_fix.sql را اجرا کن.';
  return message;
}

export async function smartUploadImage(
  file: File,
  folder: UploadFolder,
  options: SmartImageOptions = {},
  bucket = CARRTELL_STORAGE_BUCKET
): Promise<SmartUploadResult> {
  if (!file) throw new Error('فایلی انتخاب نشده است');

  const optimized = await optimizeImageWithWatermark(file, options);
  const path = makePath(folder, optimized.file);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, optimized.file, {
      cacheControl: '31536000',
      contentType: optimized.file.type || 'image/webp',
      upsert: true,
    });

  if (error) throw new Error(normalizeStorageError(error));

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    ...optimized,
    path,
    publicUrl: data.publicUrl,
  };
}

export async function uploadRawWatermarkLogo(file: File, bucket = CARRTELL_STORAGE_BUCKET) {
  if (!file) throw new Error('فایلی انتخاب نشده است');

  const optimized = await optimizeImageWithWatermark(file, {
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.9,
    watermarkEnabled: false,
  });

  const path = makePath('watermarks', optimized.file);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, optimized.file, {
      cacheControl: '31536000',
      contentType: optimized.file.type || 'image/webp',
      upsert: true,
    });

  if (error) throw new Error(normalizeStorageError(error));

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { ...optimized, path, publicUrl: data.publicUrl };
}
