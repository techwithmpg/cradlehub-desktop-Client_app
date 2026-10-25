import { useState } from 'react';
import {
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  generateDeviceRecovery,
  OperationsApiError,
} from '../../../lib/operations-service';
import type { DeviceRecoveryResult } from '../../../types/operations';

interface DeviceRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
  reasonCode: string;
  message: string;
  onGenerated: () => void;
}

export function DeviceRecoveryModal({
  isOpen,
  onClose,
  staffId,
  staffName,
  reasonCode,
  message,
  onGenerated,
}: DeviceRecoveryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [recoveryResult, setRecoveryResult] =
    useState<DeviceRecoveryResult | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await generateDeviceRecovery({ staffId });
      setRecoveryResult(result);
      onGenerated();
    } catch (err) {
      if (err instanceof OperationsApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to generate recovery token. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (recoveryResult?.activationUrl) {
      navigator.clipboard.writeText(recoveryResult.activationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Smartphone size={18} aria-hidden />
            </div>
            <div>
              <h2
                id="recovery-modal-title"
                className="text-base font-bold text-[var(--color-ink)]"
              >
                Staff Phone Recovery & Activation
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Authoritative replacement device provisioning
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
          {/* Target Staff and Issue Context */}
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-hover)] p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--color-ink)]">
                Staff Member: {staffName}
              </span>
              <span className="font-mono text-[10px] font-bold text-[var(--color-muted)]">
                {reasonCode}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-ink-secondary)]">
              {message}
            </p>
          </div>

          {errorMessage && (
            <div
              className="flex items-start gap-2 rounded-lg border border-[var(--color-error-border)] bg-[var(--color-error-surface)] p-3 text-xs text-[var(--color-error-text)]"
              role="alert"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {recoveryResult ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2
                    size={18}
                    className="text-emerald-700"
                    aria-hidden
                  />
                  Recovery Token Generated
                </div>
                <p className="mt-1 text-xs">
                  A single-use device activation link has been created. Send
                  this link to {staffName} to activate their replacement device.
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-800">
                  <Clock size={12} aria-hidden />
                  Expires:{' '}
                  {new Date(recoveryResult.expiresAt).toLocaleTimeString()}
                </div>
              </div>

              {recoveryResult.activationUrl && (
                <div>
                  <label className="mb-1 block font-semibold text-[var(--color-ink)]">
                    Activation URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={recoveryResult.activationUrl}
                      className="flex-1 rounded-lg border border-[var(--color-line)] bg-slate-50 px-3 py-2 font-mono text-[11px] text-[var(--color-ink)] select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <Copy size={13} aria-hidden />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-[var(--color-ink-secondary)]">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--color-ink)]">
                <ShieldCheck size={14} className="text-blue-600" aria-hidden />
                Recovery Process Overview
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-[var(--color-muted)]">
                <li>
                  Generates an authoritative, single-use activation token for{' '}
                  {staffName}.
                </li>
                <li>
                  Clears device limit blockers once the new phone completes its
                  first successful scan.
                </li>
                <li>Preserves historical scan events for auditing.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-line)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]"
          >
            {recoveryResult ? 'Done' : 'Cancel'}
          </button>
          {!recoveryResult && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGenerate}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" aria-hidden />
                  Generating Token…
                </>
              ) : (
                <>
                  <Smartphone size={14} aria-hidden />
                  Generate Recovery Link
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
