import React, { useEffect, useMemo, useState } from 'react';
import type {
  StaffBlockedTime,
  StaffMember,
  StaffScheduleAdjustmentInput,
} from '../../../types/staff';
import { adjustStaffSchedule } from '../../../lib/staff-service';

interface StaffScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  branchId: string;
  initialDate?: string;
  existingBlocks?: StaffBlockedTime[];
  onScheduleAdjusted: () => void;
}

type AdjustmentType =
  | 'working_hours'
  | 'day_off'
  | 'blocked_time'
  | 'remove_override'
  | 'remove_block';

export const StaffScheduleModal: React.FC<StaffScheduleModalProps> = ({
  isOpen,
  onClose,
  staff,
  branchId,
  initialDate,
  existingBlocks = [],
  onScheduleAdjusted,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(initialDate || todayStr);
  const [adjustmentType, setAdjustmentType] =
    useState<AdjustmentType>('working_hours');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('');
  const [blockId, setBlockId] = useState(
    existingBlocks.length > 0 ? existingBlocks[0].id : '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = `${staff?.id || ''}_${initialDate || ''}_${isOpen}`;
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setDate(initialDate || todayStr);
    setError(null);
    setReason('');
    if (existingBlocks.length > 0) {
      setBlockId(existingBlocks[0].id);
    }
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

  if (!isOpen || !staff) return null;

  const requiresTimes =
    adjustmentType === 'working_hours' || adjustmentType === 'blocked_time';
  const isRemoveBlock = adjustmentType === 'remove_block';
  const isRemoveOverride = adjustmentType === 'remove_override';

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const input: StaffScheduleAdjustmentInput = {
      staffId: staff.id,
      branchId,
      date,
      adjustmentType,
      ...(requiresTimes && { startTime, endTime }),
      ...(isRemoveBlock && { blockId }),
      ...(reason.trim() && { reason: reason.trim() }),
    };

    const result = await adjustStaffSchedule(input);
    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onScheduleAdjusted();
    onClose();
  };

  return (
    <div
      className="bookings-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
      data-testid="staff-schedule-modal"
      onClick={onClose}
    >
      <div
        className="bookings-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '92vw',
          width: '560px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="bookings-modal-header border-b border-[var(--cs-border)] pb-3">
          <div>
            <h3
              id="schedule-modal-title"
              className="bookings-modal-title text-base"
            >
              Adjust Schedule
            </h3>
            <p className="text-xs text-[var(--cs-text-muted)]">
              Override operational schedule for{' '}
              <strong className="text-[var(--cs-text)]">
                {staff.full_name}
              </strong>
            </p>
          </div>
          <button
            type="button"
            className="bookings-modal-close-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close schedule adjustment"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Adjustment Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1.5">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`text-xs py-2 px-3 rounded-lg border text-left font-medium transition-colors ${
                  adjustmentType === 'working_hours'
                    ? 'border-[var(--cs-brand-green)] bg-[var(--cs-sand-mist)] text-[var(--cs-text)]'
                    : 'border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-hover)]'
                }`}
                onClick={() => setAdjustmentType('working_hours')}
              >
                Custom Hours
              </button>
              <button
                type="button"
                className={`text-xs py-2 px-3 rounded-lg border text-left font-medium transition-colors ${
                  adjustmentType === 'day_off'
                    ? 'border-[var(--cs-brand-green)] bg-[var(--cs-sand-mist)] text-[var(--cs-text)]'
                    : 'border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-hover)]'
                }`}
                onClick={() => setAdjustmentType('day_off')}
              >
                Day Off
              </button>
              <button
                type="button"
                className={`text-xs py-2 px-3 rounded-lg border text-left font-medium transition-colors ${
                  adjustmentType === 'blocked_time'
                    ? 'border-[var(--cs-brand-green)] bg-[var(--cs-sand-mist)] text-[var(--cs-text)]'
                    : 'border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-hover)]'
                }`}
                onClick={() => setAdjustmentType('blocked_time')}
              >
                Block Time Window
              </button>
              <button
                type="button"
                className={`text-xs py-2 px-3 rounded-lg border text-left font-medium transition-colors ${
                  adjustmentType === 'remove_override'
                    ? 'border-[var(--cs-brand-green)] bg-[var(--cs-sand-mist)] text-[var(--cs-text)]'
                    : 'border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-hover)]'
                }`}
                onClick={() => setAdjustmentType('remove_override')}
              >
                Clear Override
              </button>
            </div>
            {existingBlocks.length > 0 && (
              <button
                type="button"
                className={`w-full mt-2 text-xs py-2 px-3 rounded-lg border text-left font-medium transition-colors ${
                  adjustmentType === 'remove_block'
                    ? 'border-[var(--cs-brand-green)] bg-[var(--cs-sand-mist)] text-[var(--cs-text)]'
                    : 'border-[var(--cs-border)] bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface-hover)]'
                }`}
                onClick={() => setAdjustmentType('remove_block')}
              >
                Remove Blocked Time
              </button>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label
              htmlFor="schedule-date"
              className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1"
            >
              Date
            </label>
            <input
              id="schedule-date"
              type="date"
              className="bookings-search-input text-xs w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time Fields */}
          {requiresTimes && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="schedule-start-time"
                  className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1"
                >
                  Start Time
                </label>
                <input
                  id="schedule-start-time"
                  type="time"
                  className="bookings-search-input text-xs w-full"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="schedule-end-time"
                  className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1"
                >
                  End Time
                </label>
                <input
                  id="schedule-end-time"
                  type="time"
                  className="bookings-search-input text-xs w-full"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Block Selection Dropdown */}
          {isRemoveBlock && (
            <div>
              <label
                htmlFor="schedule-block-select"
                className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1"
              >
                Select Block to Remove
              </label>
              <select
                id="schedule-block-select"
                className="bookings-select-filter text-xs w-full"
                value={blockId}
                onChange={(e) => setBlockId(e.target.value)}
              >
                {existingBlocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.start_time} - {b.end_time} ({b.reason})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reason / Note */}
          {!isRemoveBlock && !isRemoveOverride && (
            <div>
              <label
                htmlFor="schedule-reason"
                className="block text-xs font-semibold text-[var(--cs-text-muted)] mb-1"
              >
                Reason (Optional)
              </label>
              <input
                id="schedule-reason"
                type="text"
                placeholder="e.g. Doctor appointment, Training, Personal leave..."
                className="bookings-search-input text-xs w-full"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
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
        <div className="bookings-modal-footer">
          <button
            type="button"
            className="btn-secondary-compact text-xs"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bookings-header-primary-btn text-xs py-1.5 px-4"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving Adjustment...' : 'Save Adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
};
