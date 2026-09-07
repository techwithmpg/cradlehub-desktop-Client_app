import React, { useEffect, useMemo, useState } from 'react';
import type { BranchServiceOption, StaffMember } from '../../../types/staff';
import { updateStaffCapabilities } from '../../../lib/staff-service';

interface StaffCapabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  branchServices: BranchServiceOption[];
  onCapabilitiesSaved: (staffId: string, serviceIds: string[]) => void;
}

export const StaffCapabilityModal: React.FC<StaffCapabilityModalProps> = ({
  isOpen,
  onClose,
  staff,
  branchServices,
  onCapabilitiesSaved,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(staff?.services.map((s) => s.service_id) || []),
  );
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevStaffId, setPrevStaffId] = useState<string | null>(
    staff?.id || null,
  );
  if (staff && staff.id !== prevStaffId) {
    setPrevStaffId(staff.id);
    setSelectedIds(new Set(staff.services.map((s) => s.service_id)));
    setSearch('');
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

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return branchServices;
    return branchServices.filter((s) => s.name.toLowerCase().includes(query));
  }, [branchServices, search]);

  if (!isOpen || !staff) return null;

  const toggleService = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(branchServices.map((s) => s.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    const serviceIdsArray = Array.from(selectedIds);
    const result = await updateStaffCapabilities(staff.id, serviceIdsArray);

    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onCapabilitiesSaved(staff.id, serviceIdsArray);
    onClose();
  };

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="capability-modal-title"
      data-testid="staff-capability-modal"
    >
      <div className="modal-container-card" style={{ maxWidth: 540 }}>
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <h2 id="capability-modal-title" className="modal-title-text">
              Manage Capabilities
            </h2>
            <p className="modal-subtitle-text">
              Assign qualified services for{' '}
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
            aria-label="Close capability editor"
          >
            &times;
          </button>
        </div>

        {/* Toolbar */}
        <div className="modal-body-content space-y-3">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              className="form-input-control text-xs"
              placeholder="Search branch service catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search services"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                className="btn-secondary-compact text-xs"
                onClick={handleSelectAll}
              >
                Select All
              </button>
              <button
                type="button"
                className="btn-secondary-compact text-xs"
                onClick={handleClearAll}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="text-xs text-[var(--cs-text-muted)] font-medium">
            {selectedIds.size} of {branchServices.length} services assigned
          </div>

          {/* Service Checkbox List */}
          <div
            className="border border-[var(--cs-border)] rounded-md overflow-y-auto max-h-[300px] p-2 space-y-1.5 bg-[var(--cs-surface)]"
            role="group"
            aria-label="Service capability choices"
          >
            {filteredServices.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--cs-text-muted)]">
                {search
                  ? 'No matching services found.'
                  : 'No services available for this branch.'}
              </div>
            ) : (
              filteredServices.map((svc) => {
                const checked = selectedIds.has(svc.id);
                return (
                  <label
                    key={svc.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[var(--cs-sand-mist)] text-[var(--cs-sand)] font-medium'
                        : 'hover:bg-[var(--cs-surface-hover)] text-[var(--cs-text)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(svc.id)}
                        className="rounded border-[var(--cs-border)] text-[var(--cs-sand)] focus:ring-[var(--cs-sand)]"
                      />
                      <span className="text-xs">{svc.name}</span>
                    </div>
                    {svc.duration_minutes && (
                      <span className="text-[11px] text-[var(--cs-text-muted)]">
                        {svc.duration_minutes}m
                      </span>
                    )}
                  </label>
                );
              })
            )}
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
            data-testid="cancel-capability-modal"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary text-xs"
            data-testid="save-capability-modal"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving Capabilities...' : 'Save Capabilities'}
          </button>
        </div>
      </div>
    </div>
  );
};
