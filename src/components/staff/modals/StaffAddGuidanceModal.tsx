import React, { useEffect } from 'react';

interface StaffAddGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToApplications: () => void;
}

export const StaffAddGuidanceModal: React.FC<StaffAddGuidanceModalProps> = ({
  isOpen,
  onClose,
  onSwitchToApplications,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-staff-modal-title"
      data-testid="staff-add-guidance-modal"
    >
      <div className="modal-container-card" style={{ maxWidth: 480 }}>
        <div className="modal-header-row">
          <div>
            <h2 id="add-staff-modal-title" className="modal-title-text">
              Add New Staff Member
            </h2>
            <p className="modal-subtitle-text">
              Operational onboarding &amp; invitation workflow
            </p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            data-testid="close-add-guidance-modal"
            onClick={onClose}
            aria-label="Close add staff modal"
          >
            &times;
          </button>
        </div>

        <div className="modal-body-content space-y-3">
          <div className="p-3.5 rounded-lg bg-[var(--cs-surface-warm)] border border-[var(--cs-border-soft)] text-xs text-[var(--cs-text)] space-y-2">
            <div className="font-semibold text-sm text-[var(--cs-text)] flex items-center gap-1.5">
              <span>📋</span> Applications are the Primary Entry Workflow
            </div>
            <p className="text-[var(--cs-text-muted)] leading-relaxed">
              In CradleHub, new staff join by submitting an onboarding
              application or claiming an invitation link. Once submitted,
              applicants appear in the <strong>Applications</strong> tab where
              supervisors review credentials, configure skill tiers, and assign
              services.
            </p>
          </div>

          <div className="space-y-2 text-xs text-[var(--cs-text-muted)]">
            <p className="font-semibold text-[var(--cs-text)]">
              How to onboard a new provider:
            </p>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>
                Direct the applicant to complete the branch onboarding form.
              </li>
              <li>
                Navigate to the <strong>Applications</strong> tab in this
                workspace.
              </li>
              <li>
                Review their submitted application, choose their operational
                role and tier, and click{' '}
                <strong>Approve &amp; Configure Staff</strong>.
              </li>
            </ol>
          </div>
        </div>

        <div className="modal-footer-row">
          <button
            type="button"
            className="btn-secondary text-xs"
            data-testid="dismiss-add-guidance-modal"
            onClick={onClose}
          >
            Dismiss
          </button>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() => {
              onClose();
              onSwitchToApplications();
            }}
          >
            Go to Applications Tab
          </button>
        </div>
      </div>
    </div>
  );
};
