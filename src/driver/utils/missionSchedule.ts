export type MissionScheduleSource = {
  scheduled_at?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  created_at?: string | null;
};

export function getMissionDate(job: MissionScheduleSource): Date | null {
  const raw = job.scheduled_at || [job.preferred_date, job.preferred_time].filter(Boolean).join('T');
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getMissionTimestamp(job: MissionScheduleSource): number {
  return getMissionDate(job)?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

export function formatMissionDate(job: MissionScheduleSource): string {
  const date = getMissionDate(job);
  if (!date) return 'تاریخ تعیین نشده';
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatMissionTime(job: MissionScheduleSource): string {
  const date = getMissionDate(job);
  if (!date) return job.preferred_time || 'ساعت تعیین نشده';
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function getMissionTimingBadge(job: MissionScheduleSource) {
  const date = getMissionDate(job);
  if (!date) return { label: 'زمان نامشخص', tone: 'neutral' as const };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;
  const time = date.getTime();

  if (time < now.getTime()) return { label: 'عقب‌افتاده', tone: 'danger' as const };
  if (time >= startOfToday && time < startOfTomorrow) return { label: 'امروز', tone: 'today' as const };
  return { label: 'برنامه‌ریزی‌شده', tone: 'upcoming' as const };
}

export function toDateTimeLocalValue(job: MissionScheduleSource): string {
  const date = getMissionDate(job);
  if (!date) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
