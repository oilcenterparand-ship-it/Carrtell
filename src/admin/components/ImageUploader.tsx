import { useState } from 'react';
import { ImageIcon, Trash2, UploadCloud } from 'lucide-react';
import { optimizeImageForUpload, uploadOptimizedPublicImage, type UploadFolder } from '../services/uploadApi';

type Props = {
  label: string;
  value?: string;
  folder?: UploadFolder;
  onChange: (url: string) => void;
  help?: string;
  compact?: boolean;
};

function formatFileSize(size: number) {
  if (!size) return '0 KB';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function ImageUploader({ label, value, folder = 'products', onChange, help, compact = false }: Props) {
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

      const url = await uploadOptimizedPublicImage(optimized, file.name, folder);
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
    <div className={`rounded-xl border border-slate-700 bg-slate-800/80 ${compact ? 'p-2.5' : 'p-3'}`} data-testid="admin-image-uploader">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-200">
        <span className="flex items-center gap-1.5 font-bold"><ImageIcon className="h-4 w-4 text-amber-300" />{label}</span>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-300">
          <UploadCloud className="h-4 w-4" />
          {uploading ? 'در حال آماده‌سازی...' : 'انتخاب عکس'}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      </div>

      <p className={`mb-2 rounded-lg bg-slate-900/70 px-3 text-slate-300 ${compact ? 'py-1.5 text-[10px] leading-5' : 'py-2 text-xs leading-6'}`}>
        {help || 'عکس خودکار کوچک، فشرده و WebP می‌شود؛ همان فایل بهینه‌شده فقط یک‌بار آپلود خواهد شد.'}
      </p>

      {status && <p className="mb-2 text-xs font-bold text-emerald-300">{status}</p>}

      <div className="flex gap-2">
        <input
          placeholder="یا آدرس عکس را دستی وارد کن"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white outline-none focus:border-amber-400"
        />
        {value && <button type="button" onClick={() => onChange('')} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-300" title="حذف تصویر"><Trash2 className="h-4 w-4" /></button>}
      </div>
      {value && (
        <img src={value} alt={label} loading="lazy" decoding="async" className={`mt-2 w-full rounded-lg bg-slate-950 object-contain ${compact ? 'h-16' : 'h-24'}`} />
      )}
    </div>
  );
}

export default ImageUploader;
