import { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Clock,
  User,
} from 'lucide-react';
import {
  resolveAttendanceException,
  OperationsApiError,
} from '../../../lib/operations-service';

interface AttendanceExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exceptionId: string;
  title: string;
  code: string | null;
  description: string;
  guidance: string;
  staffName?: string | null;
  detectedAt?: string | null;
  onResolved: () => void;
}

export function AttendanceExceptionModal({
  isOpen,
  onClose,
  exceptionId,
  title,
  code,
  description,
  guidance,
  staffName,
  detectedAt,
  onResolved,
}: AttendanceExceptionModalProps) {
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolved, setResolved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleResolve = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await resolveAttendanceException({
        exceptionId,
        reason: resolutionNote.trim() || undefined,
      });

      setResolved(true);
      onResolved();
    } catch (err) {
      if (err instanceof OperationsApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to resolve exception. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle size={18} aria-hidden />
            </div>
            <div>
              <h2
                id="attendance-modal-title"
                className="text-base font-bold text-[var(--color-ink)]"
              >
                Resolve Attendance Exception
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Authoritative attendance review & exception closure
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs text-[var(--color-ink)]">
          {/* Issue Details Box */}
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-hover)] p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--color-ink)]">
                {title}
              </span>
              {code && (
                <span className="font-mono text-[10px] font-bold text-[var(--color-muted)]">
                  {code}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--color-ink-secondary)]">
              {description}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-[var(--color-line)] pt-2 text-[11px] text-[var(--color-muted)]">
              {staffName && (
                <span className="flex items-center gap-1">
                  <User size={12} aria-hidden /> {staffName}
                </span>
              )}
              {detectedAt && (
                <span className="flex items-center gap-1">
                  <Clock size={12} aria-hidden />{' '}
                  {new Date(detectedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Operational Guidance */}
          {guidance && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-950">
              <span className="font-semibold text-blue-900">
                Resolution Guidance:
              </span>{' '}
              {guidance}
            </div>
          )}

          {resolved ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2
                  size={18}
                  className="text-emerald-700"
                  aria-hidden
                />
                Exception Authoritatively Resolved
              </div>
              <p className="mt-1 text-xs">
                The attendance exception has been updated and closed in the
                authoritative database.
              </p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-[var(--color-error-border)] bg-[var(--color-error-surface)] p-3 text-xs text-[var(--color-error-text)]"
                  role="alert"
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="resolution-note"
                  className="mb-1.5 flex items-center gap-1 font-semibold text-[var(--color-ink)]"
                >
                  <FileText size={12} aria-hidden /> Resolution Note (Optional)
                </label>
                <textarea
                  id="resolution-note"
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Record operational rationale, manager approval, or shift verification notes…"
                  className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-2.5 text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-hidden"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-line)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]"
          >
            {resolved ? 'Done' : 'Cancel'}
          </button>
          {!resolved && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleResolve}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" aria-hidden />
                  Resolving…
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} aria-hidden />
                  Confirm & Resolve Exception
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
