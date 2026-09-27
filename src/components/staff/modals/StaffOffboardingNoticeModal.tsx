import React, { useRef, useState } from 'react';

import type { StaffMember } from '../../../types/staff';

import { deactivateStaff } from '../../../lib/staff-service';

import { useModalFocus } from '../../../lib/use-modal-focus';

interface StaffOffboardingNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;

  actorStaffId?: string;
  onDeactivated?: () => void;
}

function DeactivateDialog({
  staff,
  actorStaffId,
  onClose,
  onDeactivated,
}: Omit<StaffOffboardingNoticeModalProps, 'isOpen' | 'staff'> & {
  staff: StaffMember;
}) {
  const [pending, setPending] = useState(false);

  const busy = useRef(false);

  const [error, setError] = useState<string | null>(null);

  const self = staff.id === actorStaffId;

  const dialogRef = useModalFocus(true, pending, onClose);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || self) return;

    busy.current = true;
    setPending(true);
    setError(null);

    try {
      const result = await deactivateStaff(staff.id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onDeactivated?.();
      onClose();
    } catch {
      setError('Deactivation requires a connection. Please try again.');
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
      aria-labelledby="offboarding-modal-title"
      aria-busy={pending}
      data-testid="staff-offboarding-modal"
    >
      <div className="modal-container-card" style={{ maxWidth: 480 }}>
        <div className="modal-header-row">
          <div>
            <h2 id="offboarding-modal-title" className="modal-title-text">
              Deactivate Staff Access
            </h2>
            <p className="modal-subtitle-text">{staff.full_name}</p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            disabled={pending}
            onClick={onClose}
            aria-label="Close deactivation modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body-content space-y-3">
            <p className="text-xs">
              This disables the staff account while retaining the staff record.
            </p>
            {self && (
              <p role="alert">You cannot deactivate your own staff access.</p>
            )}
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
              data-testid="close-offboarding-modal"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={pending || self}
            >
              {pending ? 'Deactivating…' : 'Deactivate Staff Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StaffOffboardingNoticeModal(
  props: StaffOffboardingNoticeModalProps,
) {
  return props.isOpen && props.staff ? (
    <DeactivateDialog key={props.staff.id} {...props} staff={props.staff} />
  ) : null;
}
