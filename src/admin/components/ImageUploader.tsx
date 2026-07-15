import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { optimizeImageForUpload, uploadPublicImage, type UploadFolder } from '../services/uploadApi';

type Props = {
  label: string;
  value?: string;
  folder?: UploadFolder;
  onChange: (url: string) => void;
};

function formatFileSize(size: number) {
  if (!size) return '0 KB';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageUploader({ label, value, folder = 'products', onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  async function handleFile(file?: File) {
    if (!file) return;
    try {
      setUploading(true);
      setStatus('در حال فشرده‌سازی و تبدیل به WebP...');

      const optimized = await optimizeImageForUpload(file, folder);
      const savedPercent = optimized.originalSize
        ? Math.max(0, Math.round((1 - optimized.optimizedSize / optimized.originalSize) * 100))
        : 0;

      setStatus(
        optimized.skippedOptimization
          ? `آپلود فایل اصلی (${formatFileSize(optimized.optimizedSize)})`
          : `بهینه شد: ${formatFileSize(optimized.originalSize)} ← ${formatFileSize(optimized.optimizedSize)} (${savedPercent}% سبک‌تر)`
      );

      const url = await uploadPublicImage(file, folder);
      onChange(url);
      setStatus('تصویر سبک و آماده نمایش شد ✅');
    } catch (error) {
      console.error(error);
      alert('آپلود تصویر انجام نشد. Storage و Policy را بررسی کن.');
      setStatus('');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-200">
        <span>{label}</span>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300">
          <UploadCloud className="h-4 w-4" />
          {uploading ? 'در حال آماده‌سازی...' : 'انتخاب عکس'}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      </div>

      <p className="mb-2 rounded-lg bg-slate-900/70 px-3 py-2 text-xs leading-6 text-slate-300">
        عکس‌ها قبل از آپلود خودکار کوچک، فشرده و WebP می‌شوند تا سایت سبک و سریع بماند.
      </p>

      {status && <p className="mb-2 text-xs font-bold text-emerald-300">{status}</p>}

      <input
        placeholder="یا آدرس عکس را دستی وارد کن"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-slate-900 p-2 text-sm text-white outline-none"
      />
      {value && (
        <img src={value} alt={label} loading="lazy" decoding="async" className="mt-3 h-24 w-full rounded-lg object-cover" />
      )}
    </div>
  );
}

export default ImageUploader;
