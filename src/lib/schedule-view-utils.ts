function toMinutes(value: string | null | undefined): number | null {
  if (!value) return null;

  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

export function formatScheduleTime(value: string | null | undefined): string {
  const minutes = toMinutes(value);
  if (minutes === null) return '—';

  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(mins).padStart(2, '0')} ${suffix}`;
}
