import React, { useRef, useState } from 'react';

import type {
  BranchServiceOption,
  StaffOnboardingRequest,
} from '../../../types/staff';

import { STAFF_TIERS } from '../../../types/staff';

import { getAssignableStaffRoles } from '../../../lib/roles';

import { reviewOnboardingRequest } from '../../../lib/staff-service';

import { useModalFocus } from '../../../lib/use-modal-focus';

interface StaffApplicationApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: StaffOnboardingRequest | null;

  branchId: string;
  branchName: string;
  branchServices: BranchServiceOption[];
  branchServicesReady?: boolean;
  branchServicesLoading?: boolean;
  branchServicesError?: string | null;
  onRetryServices?: () => void;

  actorRole: string;
  onApproved: () => void;
}

function ApprovalDialog({
  onClose,
  request,
  branchId,
  branchName,
  branchServices,
  branchServicesReady = false,
  branchServicesLoading = false,
  branchServicesError,
  onRetryServices,
  actorRole,
  onApproved,
}: Omit<StaffApplicationApprovalModalProps, 'isOpen' | 'request'> & {
  request: StaffOnboardingRequest;
}) {
  const roles = getAssignableStaffRoles(actorRole);

  const [systemRole, setSystemRole] = useState<string>(
    roles.some((role) => role.value === 'staff')
      ? 'staff'
      : (roles[0]?.value ?? ''),
  );

  const [tier, setTier] = useState('junior');

  const [serviceIds, setServiceIds] = useState<string[]>([]);

  const [pending, setPending] = useState(false);

  const busy = useRef(false);

  const [error, setError] = useState<string | null>(null);

  const dialogRef = useModalFocus(true, pending, onClose);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      busy.current ||
      !branchServicesReady ||
      !roles.some((role) => role.value === systemRole) ||
      serviceIds.some(
        (id) => !branchServices.some((service) => service.id === id),
      )
    )
      return;

    busy.current = true;
    setPending(true);
    setError(null);

    try {
      const result = await reviewOnboardingRequest({
        requestId: request.id,
        action: 'approve',
        branchId,
        systemRole,
        tier,
        serviceIds: [...new Set(serviceIds)],
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onApproved();
      onClose();
    } catch {
      setError('Approval requires a connection. Please try again.');
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
      aria-labelledby="approval-modal-title"
      aria-busy={pending}
      data-testid="staff-application-approval-modal"
    >
      <div className="modal-container-card" style={{ maxWidth: 520 }}>
        <div className="modal-header-row">
          <div>
            <h2 id="approval-modal-title" className="modal-title-text">
              Approve &amp; Configure Staff
            </h2>
            <p className="modal-subtitle-text">{request.full_name}</p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            disabled={pending}
            onClick={onClose}
            aria-label="Close approval modal"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={submit}
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <div className="modal-body-content space-y-3">
            <p className="text-xs">Assigned Branch: {branchName}</p>

            <p className="text-xs">
              Preferred role / function: {request.preferred_role}
            </p>

            <fieldset
              disabled={pending || !branchServicesReady}
              className="space-y-3"
            >
              <div>
                <label htmlFor="approval-system-role">System Role</label>
                <select
                  id="approval-system-role"
                  className="form-input-control text-xs w-full"
                  value={systemRole}
                  onChange={(event) => setSystemRole(event.target.value)}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="approval-tier">Skill Tier</label>
                <select
                  id="approval-tier"
                  className="form-input-control text-xs w-full"
                  value={tier}
                  onChange={(event) => setTier(event.target.value)}
                >
                  {STAFF_TIERS.map((value) => (
                    <option key={value} value={value}>
                      {value === 'n/a'
                        ? 'N/A'
                        : value[0].toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {branchServices.length > 0 && (
                <div
                  role="group"
                  aria-label="Service choices"
                  className="border border-[var(--cs-border)] rounded-md max-h-36 overflow-y-auto p-2 space-y-1"
                >
                  {branchServices.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={serviceIds.includes(service.id)}
                        onChange={(event) =>
                          setServiceIds((ids) =>
                            event.target.checked
                              ? [...ids, service.id]
                              : ids.filter((id) => id !== service.id),
                          )
                        }
                      />
                      {service.name}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            {!branchServicesReady && (
              <div
                role={branchServicesLoading ? 'status' : 'alert'}
                className="text-xs"
              >
                <p>
                  {branchServicesLoading
                    ? 'Verifying service assignments for this branch…'
                    : branchServicesError ||
                      'Service assignments could not be verified for this branch. Reload the Staff workspace before approving this application.'}
                </p>
                {onRetryServices && !branchServicesLoading && (
                  <button
                    type="button"
                    className="bookings-retry-btn"
                    disabled={pending}
                    onClick={onRetryServices}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
            {branchServicesReady && branchServices.length === 0 && (
              <p className="text-xs">
                No assignable services are available for this branch.
              </p>
            )}
            {roles.length === 0 && (
              <p role="alert">
                No assignable roles are available for your account.
              </p>
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
              data-testid="cancel-approval-modal-btn"
              disabled={pending}
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              data-testid="approve-application-submit-btn"
              disabled={pending || !systemRole || !branchServicesReady}
            >
              {pending ? 'Approving…' : 'Approve Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StaffApplicationApprovalModal(
  props: StaffApplicationApprovalModalProps,
) {
  return props.isOpen && props.request ? (
    <ApprovalDialog key={props.request.id} {...props} request={props.request} />
  ) : null;
}
