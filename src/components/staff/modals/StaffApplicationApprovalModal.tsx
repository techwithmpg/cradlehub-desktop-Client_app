import React, { useEffect, useState } from 'react';
import type {
  BranchServiceOption,
  ReviewOnboardingInput,
  StaffOnboardingRequest,
} from '../../../types/staff';
import { reviewOnboardingRequest } from '../../../lib/staff-service';

interface StaffApplicationApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: StaffOnboardingRequest | null;
  branchId: string;
  branchName: string;
  branchServices: BranchServiceOption[];
  onApproved: () => void;
}

const STAFF_TYPE_OPTIONS = [
  { value: 'therapist', label: 'Therapist / Masseur' },
  { value: 'nail_tech', label: 'Nail Technician' },
  { value: 'aesthetician', label: 'Aesthetician' },
  { value: 'csr', label: 'Front Desk / CSR' },
  { value: 'driver', label: 'Driver' },
  { value: 'utility', label: 'Utility / Helper' },
  { value: 'managerial', label: 'Managerial' },
];

const TIER_OPTIONS = ['Junior', 'Senior', 'Master', 'Standard'];

export const StaffApplicationApprovalModal: React.FC<
  StaffApplicationApprovalModalProps
> = ({
  isOpen,
  onClose,
  request,
  branchId,
  branchName,
  branchServices,
  onApproved,
}) => {
  const getInitialRoleAndType = (req: StaffOnboardingRequest | null) => {
    if (!req) return { staffType: 'therapist', systemRole: 'staff' };
    const pref = req.preferred_role.toLowerCase();
    if (pref.includes('nail'))
      return { staffType: 'nail_tech', systemRole: 'staff' };
    if (pref.includes('aesthet'))
      return { staffType: 'aesthetician', systemRole: 'staff' };
    if (pref.includes('csr') || pref.includes('front'))
      return { staffType: 'csr', systemRole: 'crm' };
    if (pref.includes('driver'))
      return { staffType: 'driver', systemRole: 'staff' };
    if (pref.includes('util'))
      return { staffType: 'utility', systemRole: 'staff' };
    return { staffType: 'therapist', systemRole: 'staff' };
  };

  const initialValues = getInitialRoleAndType(request);
  const [staffType, setStaffType] = useState(initialValues.staffType);
  const [systemRole, setSystemRole] = useState(initialValues.systemRole);
  const [tier, setTier] = useState('Junior');
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevRequestId, setPrevRequestId] = useState<string | null>(
    request?.id || null,
  );
  if (request && request.id !== prevRequestId) {
    setPrevRequestId(request.id);
    const defaults = getInitialRoleAndType(request);
    setStaffType(defaults.staffType);
    setSystemRole(defaults.systemRole);
    setTier('Junior');
    setSelectedServiceIds(new Set());
    setError(null);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !request) return null;

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = async () => {
    setIsSaving(true);
    setError(null);

    const input: ReviewOnboardingInput = {
      requestId: request.id,
      staffId: request.staff_id || undefined,
      action: 'approve',
      branchId,
      systemRole,
      staffType,
      tier,
      serviceIds: Array.from(selectedServiceIds),
    };

    const result = await reviewOnboardingRequest(input);
    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onApproved();
    onClose();
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      data-testid="staff-application-approval-modal"
    >
      <div className="modal-container-card" style={{ maxWidth: 520 }}>
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <h2 id="approval-modal-title" className="modal-title-text">
              Approve &amp; Configure Staff
            </h2>
            <p className="modal-subtitle-text">
              Configure operational profile for{' '}
              <strong className="text-[var(--cs-text)]">
                {request.full_name}
              </strong>
            </p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close approval modal"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-content space-y-3">
          {/* Branch Target */}
          <div>
            <label className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1">
              Assigned Branch
            </label>
            <div className="form-input-control text-xs bg-[var(--cs-surface-hover)] text-[var(--cs-text)]">
              {branchName} ({branchId})
            </div>
          </div>

          {/* Staff Type and Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="approval-staff-type"
                className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1"
              >
                Staff Type / Function
              </label>
              <select
                id="approval-staff-type"
                className="form-input-control text-xs w-full"
                value={staffType}
                onChange={(e) => setStaffType(e.target.value)}
              >
                {STAFF_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="approval-system-role"
                className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1"
              >
                System Access Role
              </label>
              <select
                id="approval-system-role"
                className="form-input-control text-xs w-full"
                value={systemRole}
                onChange={(e) => setSystemRole(e.target.value)}
              >
                <option value="staff">Standard Staff</option>
                <option value="service_staff">Service Staff</option>
                <option value="crm">Front Desk / CSR</option>
              </select>
            </div>
          </div>

          {/* Skill Tier */}
          <div>
            <label
              htmlFor="approval-tier"
              className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1"
            >
              Skill Tier
            </label>
            <select
              id="approval-tier"
              className="form-input-control text-xs w-full"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              {TIER_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Initial Capabilities */}
          {branchServices.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1">
                Initial Service Capabilities ({selectedServiceIds.size}{' '}
                selected)
              </label>
              <div
                className="border border-[var(--cs-border)] rounded-md max-h-36 overflow-y-auto p-2 space-y-1 bg-[var(--cs-surface)]"
                role="group"
                aria-label="Service choices"
              >
                {branchServices.map((svc) => (
                  <label
                    key={svc.id}
                    className="flex items-center gap-2 p-1 rounded hover:bg-[var(--cs-surface-hover)] cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServiceIds.has(svc.id)}
                      onChange={() => toggleService(svc.id)}
                      className="rounded border-[var(--cs-border)] text-[var(--cs-sand)]"
                    />
                    <span>{svc.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer-row">
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={handleApprove}
            disabled={isSaving}
          >
            {isSaving ? 'Activating Staff...' : 'Confirm & Activate Staff'}
          </button>
        </div>
      </div>
    </div>
  );
};
