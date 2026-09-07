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
  const [viewFilter, setViewFilter] = useState<'all' | 'selected'>('all');
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
    let list = branchServices;
    if (viewFilter === 'selected') {
      list = list.filter((s) => selectedIds.has(s.id));
    }
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((s) => s.name.toLowerCase().includes(query));
  }, [branchServices, viewFilter, selectedIds, search]);

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
      className="bookings-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="capability-modal-title"
      data-testid="staff-capability-modal"
      onClick={onClose}
    >
      <div
        className="bookings-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '92vw',
          width: '720px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="bookings-modal-header border-b border-[var(--cs-border)] pb-3">
          <div>
            <h3
              id="capability-modal-title"
              className="bookings-modal-title text-base"
            >
              Edit Service Capabilities
            </h3>
            <p className="text-xs text-[var(--cs-text-muted)]">
              {staff.full_name} ({staff.staff_type.replace(/_/g, ' ')}) &bull;{' '}
              <span className="font-semibold text-[var(--cs-brand-green)]">
                {selectedIds.size} of {branchServices.length}
              </span>{' '}
              services assigned
            </p>
          </div>
          <button
            type="button"
            className="bookings-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isSaving}
          >
            &times;
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Search & Scope Switcher */}
        <div className="p-3 border-b border-[var(--cs-border)] bg-[var(--cs-surface-warm)] flex items-center justify-between gap-3 flex-wrap">
          <div className="bookings-search-wrapper flex-1 min-w-[200px]">
            <svg
              className="bookings-search-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="bookings-search-input text-xs"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search available services"
            />
            {search && (
              <button
                type="button"
                className="bookings-search-clear-btn"
                onClick={() => setSearch('')}
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={`px-2.5 py-1 text-xs rounded border font-medium ${
                viewFilter === 'all'
                  ? 'bg-[var(--cs-surface)] border-[var(--cs-brand-green)] text-[var(--cs-text)] shadow-sm'
                  : 'border-[var(--cs-border)] text-[var(--cs-text-muted)] bg-[var(--cs-surface)]'
              }`}
              onClick={() => setViewFilter('all')}
            >
              All Services ({branchServices.length})
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 text-xs rounded border font-medium ${
                viewFilter === 'selected'
                  ? 'bg-[var(--cs-surface)] border-[var(--cs-brand-green)] text-[var(--cs-text)] shadow-sm'
                  : 'border-[var(--cs-border)] text-[var(--cs-text-muted)] bg-[var(--cs-surface)]'
              }`}
              onClick={() => setViewFilter('selected')}
            >
              Selected ({selectedIds.size})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary-compact text-[11px]"
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn-secondary-compact text-[11px]"
              onClick={handleClearAll}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Service Checklist Grid */}
        <div className="p-4 overflow-y-auto flex-1 max-h-[420px]">
          {filteredServices.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--cs-text-muted)] italic">
              No services match your search or filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredServices.map((service) => {
                const isChecked = selectedIds.has(service.id);
                return (
                  <label
                    key={service.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                      isChecked
                        ? 'bg-[var(--cs-sand-mist)] border-[var(--cs-brand-green)] text-[var(--cs-text)]'
                        : 'bg-[var(--cs-surface)] border-[var(--cs-border)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-hover)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleService(service.id)}
                      className="mt-0.5 rounded text-[var(--cs-brand-green)]"
                    />
                    <div className="flex-1">
                      <span className="font-semibold block">
                        {service.name}
                      </span>
                      <span className="text-[10px] text-[var(--cs-text-muted)] font-mono">
                        ID: {service.id.slice(0, 8)}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bookings-modal-footer">
          <button
            type="button"
            className="btn-secondary-compact text-xs"
            onClick={onClose}
            disabled={isSaving}
            data-testid="cancel-capability-modal"
          >
            Cancel
          </button>
          <button
            type="button"
            className="bookings-header-primary-btn text-xs py-1.5 px-4"
            onClick={handleSave}
            disabled={isSaving}
            data-testid="save-capability-modal"
          >
            {isSaving ? 'Saving...' : `Save ${selectedIds.size} Services`}
          </button>
        </div>
      </div>
    </div>
  );
};
