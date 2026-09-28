/** Development-only, in-memory timings for named authoritative reads. */
export const READ_OPERATION_NAMES = [
  'today.snapshot',
  'bookings.branch-list',
  'bookings.options',
  'bookings.customer-search',
  'customers.list',
  'customers.detail',
  'attendance.workspace',
  'attendance.history',
  'schedule.day',
  'schedule.availability',
  'schedule.staff-full',
  'schedule.week',
  'home-service.queue',
  'home-service.drivers',
  'home-service.detail',
  'home-service.recommendations',
  'staff.roster',
  'staff.assignable-services',
  'staff.applications',
  'staff.schedule-week',
] as const;

export type ReadOperationName = (typeof READ_OPERATION_NAMES)[number];

export type ReadPerformanceMetric = Readonly<{
  operation: ReadOperationName;
  durationMs: number;
  outcome: 'success' | 'error';
  recordedAt: number;
}>;

export const READ_PERFORMANCE_HISTORY_LIMIT = 200;

const metrics: ReadPerformanceMetric[] = [];

function now(): number {
  return typeof performance !== 'undefined' &&
    typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function record(
  operation: ReadOperationName,
  startedAt: number,
  outcome: ReadPerformanceMetric['outcome'],
): void {
  try {
    const durationMs = Math.max(0, now() - startedAt);
    metrics.push({ operation, durationMs, outcome, recordedAt: Date.now() });
    if (metrics.length > READ_PERFORMANCE_HISTORY_LIMIT) metrics.shift();
    console.info(
      `[CradlePerf] ${operation} ${durationMs.toFixed(1)}ms ${outcome}`,
    );
  } catch {
    // Diagnostics must never change the result of an authoritative read.
  }
}

export function measureReadOperation<T>(
  name: ReadOperationName,
  operation: () => Promise<T>,
): Promise<T> {
  if (!import.meta.env.DEV) return operation();

  let startedAt: number;
  try {
    startedAt = now();
  } catch {
    return operation();
  }

  try {
    return operation().then(
      (value) => {
        record(
          name,
          startedAt,
          typeof value === 'object' &&
            value !== null &&
            'ok' in value &&
            value.ok === false
            ? 'error'
            : 'success',
        );
        return value;
      },
      (error: unknown) => {
        record(name, startedAt, 'error');
        throw error;
      },
    );
  } catch (error) {
    record(name, startedAt, 'error');
    throw error;
  }
}

export function getReadPerformanceSnapshot(): ReadPerformanceMetric[] {
  return metrics.map((metric) => ({ ...metric }));
}

export function clearReadPerformanceMetrics(): void {
  metrics.length = 0;
}
