import React, { useEffect, useState } from 'react';
import type { StaffMember } from '../../../types/staff';
import { updateStaffSystemRole } from '../../../lib/staff-service';

interface StaffRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  actorRole: string;
  onRoleUpdated: (staffId: string, newRole: string) => void;
}

const AVAILABLE_ROLES = [
  {
    role: 'staff',
    label: 'Standard Staff / Provider',
    description:
      'Operational provider access. Can view assigned bookings and personal schedule.',
    requiresOwner: false,
  },
  {
    role: 'service_staff',
    label: 'Service Staff',
    description:
      'Operational service delivery staff with basic schedule visibility.',
    requiresOwner: false,
  },
  {
    role: 'crm',
    label: 'Front Desk / CSR',
    description:
      'Customer service and booking management access for branch operations.',
    requiresOwner: false,
  },
  {
    role: 'manager',
    label: 'Branch Manager',
    description:
      'Elevated branch authority. Manages roster, schedules, and operations for this branch.',
    requiresOwner: true,
  },
  {
    role: 'owner',
    label: 'Organization Owner',
    description:
      'Highest security role. Full organization authority across all branches.',
    requiresOwner: true,
  },
];

export const StaffRoleModal: React.FC<StaffRoleModalProps> = ({
  isOpen,
  onClose,
  staff,
  actorRole,
  onRoleUpdated,
}) => {
  const [selectedRole, setSelectedRole] = useState(staff?.system_role || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevStaffId, setPrevStaffId] = useState<string | null>(
    staff?.id || null,
  );
  if (staff && staff.id !== prevStaffId) {
    setPrevStaffId(staff.id);
    setSelectedRole(staff.system_role);
    setError(null);
  }

  const isOwner = actorRole.toLowerCase() === 'owner';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !staff) return null;

  const handleSave = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    setError(null);

    const targetOption = AVAILABLE_ROLES.find((r) => r.role === selectedRole);
    if (targetOption?.requiresOwner && !isOwner) {
      setError('Assigning management or owner roles requires owner authority.');
      setIsSaving(false);
      return;
    }

    const result = await updateStaffSystemRole(staff.id, selectedRole);
    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onRoleUpdated(staff.id, selectedRole);
    onClose();
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      data-testid="staff-role-modal"
    >
      <div className="modal-container-card" style={{ maxWidth: 500 }}>
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <h2 id="role-modal-title" className="modal-title-text">
              Manage System Access Role
            </h2>
            <p className="modal-subtitle-text">
              Security authority for{' '}
              <strong className="text-[var(--cs-text)]">
                {staff.full_name}
              </strong>
            </p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close role editor"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="modal-body-content space-y-3">
          <div className="text-xs text-[var(--cs-text-muted)]">
            Select a system access role. Roles determine permissions for
            dashboard navigation, customer data access, and administrative
            actions.
          </div>

          <div
            className="space-y-2 border border-[var(--cs-border)] rounded-md p-2 bg-[var(--cs-surface)]"
            role="radiogroup"
            aria-label="Available System Roles"
          >
            {AVAILABLE_ROLES.map((r) => {
              const checked = selectedRole === r.role;
              const disabled = r.requiresOwner && !isOwner;

              return (
                <label
                  key={r.role}
                  className={`block p-3 rounded border transition-colors cursor-pointer ${
                    checked
                      ? 'border-[var(--cs-sand)] bg-[var(--cs-sand-mist)]'
                      : disabled
                        ? 'border-[var(--cs-border)] opacity-60 cursor-not-allowed bg-[var(--cs-surface)]'
                        : 'border-[var(--cs-border)] hover:bg-[var(--cs-surface-hover)] bg-[var(--cs-surface)]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="systemRole"
                      value={r.role}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => setSelectedRole(r.role)}
                      className="mt-0.5 text-[var(--cs-sand)] focus:ring-[var(--cs-sand)]"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--cs-text)]">
                          {r.label}
                        </span>
                        {r.requiresOwner && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                            Owner Only
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--cs-text-muted)] leading-tight">
                        {r.description}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

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
            data-testid="cancel-role-modal"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary text-xs"
            data-testid="save-role-modal"
            onClick={handleSave}
            disabled={isSaving || selectedRole === staff.system_role}
          >
            {isSaving ? 'Updating Role...' : 'Save Role'}
          </button>
        </div>
      </div>
    </div>
  );
};
