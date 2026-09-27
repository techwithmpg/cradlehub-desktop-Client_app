import React, { useRef, useState } from 'react';

import type { StaffMember } from '../../../types/staff';

import { getAssignableStaffRoles } from '../../../lib/roles';

import { updateStaffSystemRole } from '../../../lib/staff-service';

import { useModalFocus } from '../../../lib/use-modal-focus';

interface StaffRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;

  actorRole: string;
  actorStaffId?: string;

  onRoleUpdated: (staffId: string, newRole: string) => void;
}

function RoleDialog({
  staff,
  actorRole,
  actorStaffId,
  onClose,
  onRoleUpdated,
}: Omit<StaffRoleModalProps, 'isOpen' | 'staff'> & { staff: StaffMember }) {
  const roles = getAssignableStaffRoles(actorRole);

  const [selectedRole, setSelectedRole] = useState(staff.system_role);

  const [pending, setPending] = useState(false);

  const busy = useRef(false);

  const [error, setError] = useState<string | null>(null);

  const self = staff.id === actorStaffId;

  const dialogRef = useModalFocus(true, pending, onClose);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      busy.current ||
      self ||
      selectedRole === staff.system_role ||
      !roles.some((role) => role.value === selectedRole)
    )
      return;

    busy.current = true;
    setPending(true);
    setError(null);

    try {
      const result = await updateStaffSystemRole(staff.id, selectedRole);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onRoleUpdated(staff.id, selectedRole);
      onClose();
    } catch {
      setError('Role changes require a connection. Please try again.');
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      aria-busy={pending}
      data-testid="staff-role-modal"
    >
      <div className="modal-container-card" style={{ maxWidth: 500 }}>
        <div className="modal-header-row">
          <div>
            <h2 id="role-modal-title" className="modal-title-text">
              Manage System Access Role
            </h2>
            <p className="modal-subtitle-text">{staff.full_name}</p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            disabled={pending}
            onClick={onClose}
            aria-label="Close role editor"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={submit}
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <div className="modal-body-content space-y-3">
            <p className="text-xs">Current Role: {staff.system_role}</p>
            {self && (
              <p role="alert">You cannot change your own system role.</p>
            )}

            <fieldset disabled={pending || self}>
              <legend className="text-xs">Available System Roles</legend>
              <div
                role="radiogroup"
                aria-label="Available System Roles"
                className="space-y-2"
              >
                {roles.map((role) => (
                  <label key={role.value} className="flex gap-2 text-xs">
                    <input
                      type="radio"
                      name="systemRole"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={() => setSelectedRole(role.value)}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {error && (
              <p role="alert" className="text-xs text-red-700">
                {error}
              </p>
            )}
          </div>
          <div className="modal-footer-row">
            <button
              type="button"
              className="btn-secondary text-xs"
              data-testid="cancel-role-modal"
              disabled={pending}
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              data-testid="save-role-modal"
              disabled={
                pending ||
                self ||
                selectedRole === staff.system_role ||
                !roles.some((role) => role.value === selectedRole)
              }
            >
              {pending ? 'Saving…' : 'Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StaffRoleModal(props: StaffRoleModalProps) {
  return props.isOpen && props.staff ? (
    <RoleDialog key={props.staff.id} {...props} staff={props.staff} />
  ) : null;
}
