import { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  UserCheck,
  Building2,
} from 'lucide-react';
import type { OperationalStaffMember } from '../../../types/operations';
import {
  assignServiceProvider,
  OperationsApiError,
} from '../../../lib/operations-service';

interface ServiceProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  branchName: string;
  branchStaff: OperationalStaffMember[];
  onAssigned: () => void;
}

const ELIGIBLE_STAFF_TYPES = new Set([
  'therapist',
  'nail_tech',
  'aesthetician',
  'salon_head',
]);

const HARD_EXCLUDED_ROLES = new Set(['driver', 'utility', 'digital_marketer']);

export function ServiceProviderModal({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  branchName,
  branchStaff,
  onAssigned,
}: ServiceProviderModalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedProviderCount, setVerifiedProviderCount] = useState<
    number | null
  >(null);

  const eligibleStaff = useMemo(() => {
    return branchStaff.filter((staff) => {
      if (!staff.is_active) return false;
      if (staff.archived_at || staff.merged_into_staff_id) return false;
      if (HARD_EXCLUDED_ROLES.has(staff.system_role.toLowerCase()))
        return false;
      return ELIGIBLE_STAFF_TYPES.has(staff.staff_type.toLowerCase());
    });
  }, [branchStaff]);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!selectedStaffId) {
      setErrorMessage('Please select a staff member to assign.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await assignServiceProvider({
        serviceId,
        staffId: selectedStaffId,
      });

      setVerifiedProviderCount(result.providerCount);
      onAssigned();
    } catch (err) {
      if (err instanceof OperationsApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to assign provider. Please try again.');
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
      aria-labelledby="provider-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              <Sparkles size={18} aria-hidden />
            </div>
            <div>
              <h2
                id="provider-modal-title"
                className="text-base font-bold text-[var(--color-ink)]"
              >
                Assign Service Provider
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Authoritative service coverage configuration
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
          {/* Service & Branch Context */}
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-hover)] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--color-ink)]">
                {serviceName}
              </span>
              <span className="flex items-center gap-1 text-[var(--color-muted)]">
                <Building2 size={13} aria-hidden />
                {branchName}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-muted)]">
              Assigning a qualified service provider satisfies the provider
              coverage prerequisite for this service.
            </p>
          </div>

          {verifiedProviderCount !== null ? (
            /* Authoritative Success Banner with Disclaimers */
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2
                  size={18}
                  className="text-emerald-700"
                  aria-hidden
                />
                Provider Coverage Confirmed & Authoritatively Verified
              </div>
              <p className="mt-2 text-xs leading-5">
                Authoritative readiness check confirmed:{' '}
                <strong>{verifiedProviderCount} qualified provider(s)</strong>{' '}
                assigned to {serviceName} at {branchName}. Provider readiness
                caches have been invalidated.
              </p>
              <p className="mt-1 text-[11px] text-emerald-800">
                (Full booking readiness also requires active branch schedules,
                resources, and catalog configuration.)
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

              {/* Provider Selection */}
              <div>
                <label
                  htmlFor="provider-select"
                  className="mb-1.5 block font-semibold text-[var(--color-ink)]"
                >
                  Select Qualified Branch Staff Member
                </label>
                {eligibleStaff.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    No eligible active service staff (therapists, nail
                    technicians, aestheticians) found in this branch. Please
                    onboard or transfer qualified providers in Staff first.
                  </div>
                ) : (
                  <select
                    id="provider-select"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-hidden"
                  >
                    <option value="">Choose an eligible staff member…</option>
                    {eligibleStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name}{' '}
                        {staff.nickname ? `(${staff.nickname})` : ''} ·{' '}
                        {staff.staff_type}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-[var(--color-muted)]">
                <span className="font-semibold text-[var(--color-ink)]">
                  Canonical Eligibility Rule:
                </span>{' '}
                Only active branch staff matching approved provider types
                (therapist, nail technician, aesthetician, salon head) can be
                assigned. Excluded roles (driver, utility, digital marketer) are
                rejected.
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-line)] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]"
          >
            {verifiedProviderCount !== null ? 'Done' : 'Cancel'}
          </button>
          {verifiedProviderCount === null && (
            <button
              type="button"
              disabled={isSubmitting || !selectedStaffId}
              onClick={handleAssign}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" aria-hidden />
                  Assigning & Verifying…
                </>
              ) : (
                <>
                  <UserCheck size={14} aria-hidden />
                  Assign & Verify Provider
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
