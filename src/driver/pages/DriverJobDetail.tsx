import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DriverJob,
  completeDriverJob,
  driverStatusLabels,
  getDriverJobById,
  resetTestDriverJob,
  updateDriverJobStatus,
} from '../services/driverJobsApi';

type WizardStep =
  | 'km'
  | 'km_before_photo'
  | 'services'
  | 'issue_check'
  | 'notes'
  | 'km_after_photo'
  | 'review'
  | 'signature';

type VehicleIssue = 'oil_leak' | 'worn_tire' | 'brake_pad' | 'weak_battery' | 'coolant' | 'other';

const serviceOptions = [
  'تعویض روغن موتور',
  'تعویض فیلتر روغن',
  'تعویض فیلتر هوا',
  'تعویض فیلتر کابین',
  'تعویض ضدیخ',
  'بازدید عمومی خودرو',
];

const issueLabels: Record<VehicleIssue, string> = {
  oil_leak: 'نشتی روغن',
  worn_tire: 'لاستیک فرسوده',
  brake_pad: 'لنت نیاز به بررسی دارد',
  weak_battery: 'باتری ضعیف است',
  coolant: 'سطح مایع خنک‌کننده پایین است',
  other: 'سایر موارد',
};

export default function DriverJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<DriverJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<WizardStep>('km');
  const [finalKm, setFinalKm] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [hasIssue, setHasIssue] = useState<boolean | null>(null);
  const [issues, setIssues] = useState<VehicleIssue[]>([]);
  const [otherIssue, setOtherIssue] = useState('');
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getDriverJobById(id);
      setJob(data);
      setFinalKm(data.final_km ? String(data.final_km) : data.current_km ? String(data.current_km) : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت مأموریت');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const status = useMemo(() => String(job?.status || 'assigned'), [job?.status]);

  async function changeStatus(nextStatus: 'en_route' | 'arrived' | 'in_progress') {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await updateDriverJobStatus(id, nextStatus);
      setJob(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در تغییر وضعیت مأموریت');
    } finally {
      setSaving(false);
    }
  }

  function submitKm(event: FormEvent) {
    event.preventDefault();
    const km = Number(finalKm);
    if (!km || km < 1) {
      setError('کیلومتر فعلی خودرو را درست وارد کن.');
      return;
    }
    setError(null);
    setStep('km_before_photo');
  }

  function toggleService(item: string) {
    setServices((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  }

  function toggleIssue(issue: VehicleIssue) {
    setIssues((current) => current.includes(issue) ? current.filter((value) => value !== issue) : [...current, issue]);
  }

  async function handlePhoto(file: File | undefined, target: 'before' | 'after') {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('فقط فایل تصویری انتخاب کن.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError('حجم تصویر باید کمتر از ۶ مگابایت باشد.');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    target === 'before' ? setBeforePhoto(dataUrl) : setAfterPhoto(dataUrl);
    setError(null);
  }

  async function complete() {
    if (!id || !signature) return;
    const issueText = hasIssue
      ? issues.map((item) => item === 'other' && otherIssue.trim() ? otherIssue.trim() : issueLabels[item]).join('، ')
      : 'مورد خاصی مشاهده نشد';
    const reportNotes = [
      `سرویس‌های انجام‌شده: ${services.join('، ')}`,
      `وضعیت بازدید: ${issueText}`,
      notes.trim() ? `توضیحات: ${notes.trim()}` : '',
      `عکس قبل: ${beforePhoto ? 'ثبت شد' : 'ثبت نشد'}`,
      `عکس بعد: ${afterPhoto ? 'ثبت شد' : 'ثبت نشد'}`,
      'امضای مشتری: ثبت شد',
    ].filter(Boolean).join('\n');

    try {
      setSaving(true);
      setError(null);
      const updated = await completeDriverJob(id, {
        finalKm: Number(finalKm),
        usedProducts: services.map((item) => `${item} * 1`).join('\n'),
        notes: reportNotes,
        serviceType: services.join('، ') || 'سرویس در محل Carrtell',
        changedItems: services,
        warningNotes: hasIssue ? issueText : '',
      });
      setJob(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت پایان سرویس');
    } finally {
      setSaving(false);
    }
  }

  function restartTest() {
    if (id !== 'test') return;
    const fresh = resetTestDriverJob();
    setJob(fresh);
    setStep('km');
    setFinalKm(fresh.current_km ? String(fresh.current_km) : '');
    setServices([]);
    setBeforePhoto(null);
    setAfterPhoto(null);
    setHasIssue(null);
    setIssues([]);
    setOtherIssue('');
    setNotes('');
    setSignature(null);
    setError(null);
  }

  if (loading) return <PageShell><StateCard>در حال دریافت مأموریت...</StateCard></PageShell>;
  if (!job) return <PageShell><ErrorBox text={error || 'مأموریت پیدا نشد.'} /></PageShell>;

  return (
    <PageShell>
      <header className="mb-5 flex items-center justify-between gap-3">
        <Link to="/driver/dashboard" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">بازگشت</Link>
        <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
          {driverStatusLabels[status] || 'مأموریت'}
        </span>
      </header>

      <JobSummary job={job} />
      {error && <ErrorBox text={error} />}

      <div className="mx-auto mt-5 max-w-2xl">
        {status === 'completed' ? (
          <CompletedCard job={job} isTest={id === 'test'} onRestart={restartTest} />
        ) : status === 'assigned' || status === 'confirmed' ? (
          <QuestionCard eyebrow="مرحله شروع" title="برای حرکت آماده‌ای؟" description="آدرس و شماره مشتری را بررسی کن.">
            <ContactActions job={job} />
            <PrimaryButton disabled={saving} onClick={() => changeStatus('en_route')}>شروع حرکت</PrimaryButton>
          </QuestionCard>
        ) : status === 'en_route' ? (
          <QuestionCard eyebrow="در مسیر" title="به محل مشتری رسیدی؟" description="پس از حضور در محل، گزینه زیر را بزن.">
            <ContactActions job={job} />
            <PrimaryButton disabled={saving} onClick={() => changeStatus('arrived')}>بله، رسیدم</PrimaryButton>
          </QuestionCard>
        ) : status === 'arrived' ? (
          <QuestionCard eyebrow="تحویل خودرو" title="آماده شروع سرویس هستی؟" description="پس از تأیید، مراحل ثبت سرویس نمایش داده می‌شوند.">
            <PrimaryButton disabled={saving} onClick={() => changeStatus('in_progress')}>شروع سرویس</PrimaryButton>
          </QuestionCard>
        ) : (
          <ServiceWizard
            step={step}
            setStep={setStep}
            job={job}
            finalKm={finalKm}
            setFinalKm={setFinalKm}
            services={services}
            toggleService={toggleService}
            beforePhoto={beforePhoto}
            afterPhoto={afterPhoto}
            onPhoto={handlePhoto}
            hasIssue={hasIssue}
            setHasIssue={setHasIssue}
            issues={issues}
            toggleIssue={toggleIssue}
            otherIssue={otherIssue}
            setOtherIssue={setOtherIssue}
            notes={notes}
            setNotes={setNotes}
            signature={signature}
            setSignature={setSignature}
            saving={saving}
            onKmSubmit={submitKm}
            onComplete={complete}
          />
        )}
      </div>
    </PageShell>
  );
}

function ServiceWizard(props: {
  step: WizardStep;
  setStep: (step: WizardStep) => void;
  job: DriverJob;
  finalKm: string;
  setFinalKm: (value: string) => void;
  services: string[];
  toggleService: (item: string) => void;
  beforePhoto: string | null;
  afterPhoto: string | null;
  onPhoto: (file: File | undefined, target: 'before' | 'after') => void;
  hasIssue: boolean | null;
  setHasIssue: (value: boolean) => void;
  issues: VehicleIssue[];
  toggleIssue: (issue: VehicleIssue) => void;
  otherIssue: string;
  setOtherIssue: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  signature: string | null;
  setSignature: (value: string | null) => void;
  saving: boolean;
  onKmSubmit: (event: FormEvent) => void;
  onComplete: () => void;
}) {
  const stepIndex: Record<WizardStep, number> = {
    km: 1,
    km_before_photo: 2,
    services: 3,
    issue_check: 4,
    notes: 5,
    km_after_photo: 6,
    review: 7,
    signature: 8,
  };

  return (
    <>
      <Progress current={stepIndex[props.step]} total={8} />

      {props.step === 'km' && (
        <QuestionCard eyebrow="مرحله ۱" title="کیلومتر فعلی خودرو چند است؟" description={`کیلومتر قبلی: ${props.job.current_km?.toLocaleString('fa-IR') || 'نامشخص'}`}>
          <form onSubmit={props.onKmSubmit} className="space-y-4">
            <input autoFocus value={props.finalKm} onChange={(e) => props.setFinalKm(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="input-big" placeholder="مثلاً ۸۵۰۰۰" />
            <PrimaryButton type="submit">ادامه</PrimaryButton>
          </form>
        </QuestionCard>
      )}

      {props.step === 'km_before_photo' && (
        <PhotoStep eyebrow="مرحله ۲" title="از کیلومتر خودرو قبل از سرویس عکس بگیر" description="صفحه کیلومترشمار واضح و کامل داخل تصویر باشد." photo={props.beforePhoto} onChange={(file) => props.onPhoto(file, 'before')} onNext={() => props.setStep('services')} onBack={() => props.setStep('km')} />
      )}

      {props.step === 'services' && (
        <QuestionCard eyebrow="مرحله ۳" title="کدام سرویس‌ها انجام شدند؟" description="یک یا چند گزینه را انتخاب کن.">
          <div className="grid gap-3 sm:grid-cols-2">
            {serviceOptions.map((item) => <Selectable key={item} selected={props.services.includes(item)} onClick={() => props.toggleService(item)}>{item}</Selectable>)}
          </div>
          <PrimaryButton disabled={!props.services.length} onClick={() => props.setStep('issue_check')}>ادامه</PrimaryButton>
          <BackButton onClick={() => props.setStep('km_before_photo')} />
        </QuestionCard>
      )}

      {props.step === 'issue_check' && (
        <QuestionCard eyebrow="مرحله ۴" title="مورد خاصی در خودرو مشاهده شد؟" description="در صورت وجود مشکل، گزینه بله را بزن تا فهرست باز شود.">
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceButton selected={props.hasIssue === false} onClick={() => { props.setHasIssue(false); props.setStep('notes'); }}>خیر، موردی نبود</ChoiceButton>
            <ChoiceButton selected={props.hasIssue === true} secondary onClick={() => { props.setHasIssue(true); }}>بله، مشکلی مشاهده شد</ChoiceButton>
          </div>

          {props.hasIssue === true && (
            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-3 text-sm font-black text-slate-800">موارد مشاهده‌شده را انتخاب کن:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(issueLabels) as VehicleIssue[]).map((item) => <Selectable key={item} selected={props.issues.includes(item)} onClick={() => props.toggleIssue(item)}>{issueLabels[item]}</Selectable>)}
              </div>
              {props.issues.includes('other') && <textarea value={props.otherIssue} onChange={(e) => props.setOtherIssue(e.target.value)} className="text-area mt-3" rows={3} placeholder="مورد مشاهده‌شده را بنویس..." />}
            </div>
          )}

          <PrimaryButton disabled={props.hasIssue === null || (props.hasIssue === true && !props.issues.length)} onClick={() => props.setStep('notes')}>ادامه</PrimaryButton>
          <BackButton onClick={() => props.setStep('services')} />
        </QuestionCard>
      )}

      {props.step === 'notes' && (
        <QuestionCard eyebrow="مرحله ۵" title="توضیح دیگری داری؟" description="این مرحله اختیاری است.">
          <textarea autoFocus value={props.notes} onChange={(e) => props.setNotes(e.target.value)} className="text-area" rows={5} placeholder="توضیحات تکمیلی برای مشتری یا مدیریت..." />
          <PrimaryButton onClick={() => props.setStep('km_after_photo')}>ادامه</PrimaryButton>
          <BackButton onClick={() => props.setStep('issue_check')} />
        </QuestionCard>
      )}

      {props.step === 'km_after_photo' && (
        <PhotoStep eyebrow="مرحله ۶" title="از کیلومتر خودرو بعد از سرویس عکس بگیر" description="پس از پایان کار، تصویر نهایی کیلومترشمار را ثبت کن." photo={props.afterPhoto} onChange={(file) => props.onPhoto(file, 'after')} onNext={() => props.setStep('review')} onBack={() => props.setStep('notes')} />
      )}

      {props.step === 'review' && (
        <QuestionCard eyebrow="مرحله ۷" title="اطلاعات را بررسی کن" description="پس از تأیید، فقط امضای مشتری باقی می‌ماند.">
          <ReviewRow label="کیلومتر" value={Number(props.finalKm).toLocaleString('fa-IR')} />
          <ReviewRow label="سرویس‌های انجام‌شده" value={props.services.join('، ')} />
          <ReviewRow label="عکس کیلومتر" value={`${props.beforePhoto ? 'قبل ✓' : 'قبل ثبت نشد'} — ${props.afterPhoto ? 'بعد ✓' : 'بعد ثبت نشد'}`} />
          <ReviewRow label="موارد مشاهده‌شده" value={props.hasIssue ? props.issues.map((item) => item === 'other' && props.otherIssue ? props.otherIssue : issueLabels[item]).join('، ') : 'موردی مشاهده نشد'} />
          <ReviewRow label="توضیحات" value={props.notes || 'ندارد'} />
          <PrimaryButton onClick={() => props.setStep('signature')}>تأیید و دریافت امضای مشتری</PrimaryButton>
          <BackButton onClick={() => props.setStep('km_after_photo')} />
        </QuestionCard>
      )}

      {props.step === 'signature' && (
        <QuestionCard eyebrow="مرحله ۸ - مرحله نهایی" title="امضای مشتری را ثبت کن" description="پس از امضا، سرویس نهایی و تکمیل می‌شود.">
          <SignaturePad value={props.signature} onChange={props.setSignature} />
          <PrimaryButton disabled={!props.signature || props.saving} onClick={props.onComplete}>{props.saving ? 'در حال ثبت...' : 'ثبت امضا و پایان سرویس'}</PrimaryButton>
          <BackButton onClick={() => props.setStep('review')} />
        </QuestionCard>
      )}
    </>
  );
}

function PhotoStep({ eyebrow, title, description, photo, onChange, onNext, onBack }: { eyebrow: string; title: string; description: string; photo: string | null; onChange: (file?: File) => void; onNext: () => void; onBack: () => void }) {
  return (
    <QuestionCard eyebrow={eyebrow} title={title} description={description}>
      <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-amber-400">
        {photo ? <img src={photo} alt="پیش‌نمایش" className="mx-auto max-h-72 rounded-2xl object-contain" /> : <div className="py-12 text-slate-500"><div className="text-4xl">📷</div><div className="mt-3 font-bold">انتخاب یا گرفتن عکس</div></div>}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onChange(e.target.files?.[0])} />
      </label>
      <PrimaryButton disabled={!photo} onClick={onNext}>ادامه</PrimaryButton>
      <BackButton onClick={onBack} />
    </QuestionCard>
  );
}

function SignaturePad({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = 180;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  function point(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function move(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = event.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function end(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(event.currentTarget.toDataURL('image/png'));
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  }

  return (
    <div>
      <canvas ref={canvasRef} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} className="h-[180px] w-full touch-none rounded-2xl border border-slate-300 bg-white" />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>{value ? 'امضا ثبت شد ✓' : 'داخل کادر امضا کنید'}</span><button type="button" onClick={clear} className="text-red-300">پاک کردن امضا</button></div>
    </div>
  );
}

function Selectable({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border px-4 py-4 text-right font-bold transition ${selected ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm' : 'border-slate-200 bg-white text-slate-800 hover:border-amber-300 hover:bg-amber-50/40'}`}>{selected ? '✓ ' : ''}{children}</button>;
}

function JobSummary({ job }: { job: DriverJob }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="h-1.5 bg-gradient-to-l from-amber-400 via-yellow-400 to-amber-500" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-amber-600">مأموریت سرویس در محل</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900">{job.customer_name || 'مشتری'}</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">{job.car_name || 'خودرو ثبت نشده'}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center">
            <div className="text-xs text-slate-500">وضعیت مأموریت</div>
            <div className="mt-1 text-sm font-black text-amber-700">فعال</div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a href={job.customer_phone ? `tel:${job.customer_phone}` : undefined} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 transition hover:border-amber-300">📞 {job.customer_phone || 'شماره ثبت نشده'}</a>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-7 text-slate-700">🧭 {job.address_text || 'آدرس ثبت نشده'}</div>
        </div>
      </div>
    </section>
  );
}
function ContactActions({ job }: { job: DriverJob }) {
  const mapUrl = job.latitude && job.longitude ? `https://www.google.com/maps?q=${job.latitude},${job.longitude}` : undefined;
  return <div className="grid grid-cols-2 gap-3"><a href={job.customer_phone ? `tel:${job.customer_phone}` : undefined} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 text-center text-sm font-bold">تماس با مشتری</a><a href={mapUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 text-center text-sm font-bold">باز کردن مسیر</a></div>;
}

function QuestionCard({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-7"><p className="text-xs font-black text-amber-600">{eyebrow}</p><h2 className="mt-3 text-xl font-black leading-9 sm:text-2xl">{title}</h2><p className="mt-2 text-sm leading-7 text-slate-500">{description}</p><div className="mt-6 space-y-3">{children}</div></section>;
}

function Progress({ current, total }: { current: number; total: number }) {
  return <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="mb-2 flex justify-between text-xs font-bold text-slate-500"><span>گزارش سرویس</span><span>{current.toLocaleString('fa-IR')} از {total.toLocaleString('fa-IR')}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-amber-400 to-yellow-500 transition-all" style={{ width: `${Math.round(current / total * 100)}%` }} /></div></div>;
}

function PrimaryButton({ children, onClick, disabled, type = 'button' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  return <button type={type} onClick={onClick} disabled={disabled} className="w-full rounded-2xl bg-gradient-to-l from-amber-400 to-yellow-500 px-5 py-4 font-black text-white shadow-lg shadow-amber-500/20 transition hover:from-amber-500 hover:to-yellow-600 disabled:cursor-not-allowed disabled:opacity-50">{children}</button>;
}

function ChoiceButton({ children, onClick, secondary = false, selected = false }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; selected?: boolean }) {
  return <button type="button" onClick={onClick} className={`w-full rounded-2xl border px-5 py-4 text-right font-black transition ${selected ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm' : secondary ? 'border-slate-200 bg-white text-slate-800 hover:border-amber-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400'}`}>{selected ? '✓ ' : ''}{children}</button>;
}

function BackButton({ onClick }: { onClick: () => void }) { return <button type="button" onClick={onClick} className="w-full px-4 py-2 text-sm text-slate-500 hover:text-amber-600">بازگشت به مرحله قبل</button>; }
function ReviewRow({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-2 whitespace-pre-line text-sm font-bold leading-7 text-slate-800">{value}</div></div>; }

function CompletedCard({ job, isTest, onRestart }: { job: DriverJob; isTest: boolean; onRestart: () => void }) {
  return <StateCard><div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-3xl">✓</div><h2 className="mt-4 text-2xl font-black text-emerald-600">سرویس با موفقیت تکمیل شد</h2><p className="mt-2 text-sm text-slate-500">کیلومتر ثبت‌شده: {job.final_km?.toLocaleString('fa-IR') || '-'}</p><Link to="/driver/dashboard" className="mt-6 inline-block rounded-2xl bg-gradient-to-l from-amber-400 to-yellow-500 px-6 py-3 font-black text-white">بازگشت به مأموریت‌ها</Link>{isTest && <button type="button" onClick={onRestart} className="mt-3 block w-full text-sm text-slate-500">شروع تست از مرحله اول</button>}</div></StateCard>;
}

function StateCard({ children }: { children: React.ReactNode }) { return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 shadow-xl">{children}</div>; }
function ErrorBox({ text }: { text: string }) { return <div className="my-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{text}</div>; }
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900" dir="rtl">
      <style>{`
        .input-big{width:100%;border-radius:1rem;border:1px solid #cbd5e1;background:#fff;padding:1rem;text-align:center;font-size:1.5rem;font-weight:900;outline:none;color:#0f172a}
        .input-big:focus,.text-area:focus{border-color:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.10)}
        .text-area{width:100%;border-radius:1rem;border:1px solid #cbd5e1;background:#fff;padding:1rem;line-height:2;outline:none;color:#0f172a}
      `}</style>
      <div className="mx-auto max-w-4xl px-4 py-5 sm:py-8">{children}</div>
    </main>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('خواندن تصویر ناموفق بود.'));
    reader.readAsDataURL(file);
  });
}
