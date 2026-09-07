import React, { useEffect } from 'react';
import type { StaffMember } from '../../../types/staff';

interface StaffOffboardingNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
}

export const StaffOffboardingNoticeModal: React.FC<
  StaffOffboardingNoticeModalProps
> = ({ isOpen, onClose, staff }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !staff) return null;

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offboarding-modal-title"
      data-testid="staff-offboarding-modal"
    >
      <div className="modal-container-card" style={{ maxWidth: 480 }}>
        <div className="modal-header-row">
          <div>
            <h2 id="offboarding-modal-title" className="modal-title-text">
              End Employment / Offboarding
            </h2>
            <p className="modal-subtitle-text">
              Employment lifecycle status for{' '}
              <strong className="text-[var(--cs-text)]">
                {staff.full_name}
              </strong>
            </p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            aria-label="Close offboarding modal"
          >
            &times;
          </button>
        </div>

        <div className="modal-body-content space-y-3">
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
            <div className="font-semibold text-sm flex items-center gap-1.5">
              <span>⚠️</span> OFFBOARDING CONTRACT REQUIRED
            </div>
            <p className="leading-relaxed">
              Permanent offboarding / employee termination requires an
              authoritative server contract. In the current schema, toggling
              active status to false is reserved for pending onboarding and
              invitation states.
            </p>
          </div>

          <div className="text-xs text-[var(--cs-text-muted)] space-y-1.5">
            <p>
              To protect database integrity and prevent terminated staff from
              appearing as pending applicants, offboarding mutations are blocked
              pending backend contract deployment.
            </p>
          </div>
        </div>

        <div className="modal-footer-row">
          <button
            type="button"
            className="btn-primary text-xs"
            data-testid="close-offboarding-modal"
            onClick={onClose}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
