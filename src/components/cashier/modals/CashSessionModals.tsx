import { useState } from 'react';
import {
  X,
  Lock,
  ArrowRightLeft,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type {
  CashSessionSummary,
  MaskedAccountOption,
  StaffOption,
} from '../../../types/cashier';
import { postDrawerSessionAction } from '../../../lib/cashier-service';

// ── Open Session Modal ────────────────────────────────────────────────────────

interface OpenSessionModalProps {
  isOpen: boolean;
  availableDrawers: MaskedAccountOption[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function OpenSessionModal({
  isOpen,
  availableDrawers,
  onClose,
  onSuccess,
}: OpenSessionModalProps) {
  const [customDrawerId, setCustomDrawerId] = useState<string | null>(null);
  const effectiveDrawerId =
    customDrawerId && availableDrawers.some((d) => d.id === customDrawerId)
      ? customDrawerId
      : (availableDrawers[0]?.id ?? '');
  const [openingFloat, setOpeningFloat] = useState<string>('2000');
  const [openingNote, setOpeningNote] = useState<string>('Morning cash float');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    crypto.randomUUID(),
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const floatVal = parseFloat(openingFloat);
    if (isNaN(floatVal) || floatVal < 0) {
      setErrorMessage('Please enter a non-negative opening float amount.');
      return;
    }

    if (!effectiveDrawerId) {
      setErrorMessage('Please select a cash drawer account.');
      return;
    }

    setIsSubmitting(true);
    try {
      await postDrawerSessionAction({
        action: 'open',
        cashDrawerAccountId: effectiveDrawerId,
        openingFloat: floatVal,
        openingNote: openingNote.trim() || null,
        idempotencyKey,
      });

      await onSuccess();
      setIdempotencyKey(crypto.randomUUID());
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to open cash drawer session.';
      setErrorMessage(msg);
      // NOTE: idempotencyKey is preserved on submission failure so retry will resubmit with same key
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cashier-modal-overlay" role="dialog" aria-modal="true">
      <div className="cashier-modal-card">
        <div className="cashier-modal-header">
          <div className="flex items-center gap-3">
            <div className="cashier-brand-icon">
              <Lock size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="cashier-modal-title">Open Cash Drawer</h2>
              <p className="cashier-modal-subtitle">
                Initialize float and begin cash session.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cashier-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cashier-modal-body">
            {errorMessage && (
              <div className="cashier-notice-banner warning" role="alert">
                <AlertCircle size={16} className="text-amber-700 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="cashier-form-group">
              <label htmlFor="open-drawer-select" className="cashier-label">
                Cash Drawer Account <span className="req">*</span>
              </label>
              <select
                id="open-drawer-select"
                className="cashier-select"
                value={effectiveDrawerId}
                onChange={(e) => setCustomDrawerId(e.target.value)}
                disabled={isSubmitting || availableDrawers.length === 0}
              >
                {availableDrawers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.identifierMask ? `(${d.identifierMask})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="cashier-form-group">
              <label htmlFor="opening-float-input" className="cashier-label">
                Opening Float (₱) <span className="req">*</span>
              </label>
              <input
                id="opening-float-input"
                type="number"
                step="0.01"
                min="0"
                className="cashier-input"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="cashier-form-group">
              <label htmlFor="opening-notes-input" className="cashier-label">
                Opening Note (Optional)
              </label>
              <input
                id="opening-notes-input"
                type="text"
                className="cashier-input"
                value={openingNote}
                onChange={(e) => setOpeningNote(e.target.value)}
                placeholder="e.g. verified denominations"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="cashier-modal-footer">
            <button
              type="button"
              className="btn-secondary-compact"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-compact flex items-center gap-1.5"
              disabled={isSubmitting || availableDrawers.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Opening...</span>
                </>
              ) : (
                <span>Open Drawer Session</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Handover Session Modal ───────────────────────────────────────────────────

interface HandoverSessionModalProps {
  isOpen: boolean;
  session: CashSessionSummary | null;
  staffOptions: StaffOption[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function HandoverSessionModal({
  isOpen,
  session,
  staffOptions,
  onClose,
  onSuccess,
}: HandoverSessionModalProps) {
  const [customIncomingCustodianId, setCustomIncomingCustodianId] = useState<
    string | null
  >(null);
  const effectiveIncomingCustodianId =
    customIncomingCustodianId &&
    staffOptions.some((s) => s.id === customIncomingCustodianId)
      ? customIncomingCustodianId
      : (staffOptions[0]?.id ?? '');
  const [countedCash, setCountedCash] = useState<string>(
    session ? String(session.expectedCash) : '',
  );
  const [notes, setNotes] = useState<string>('Shift handover');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    crypto.randomUUID(),
  );

  if (!isOpen || !session) return null;

  const counted = parseFloat(countedCash) || 0;
  const variance = counted - session.expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!effectiveIncomingCustodianId) {
      setErrorMessage('Please select the incoming staff custodian.');
      return;
    }

    if (isNaN(counted) || counted < 0) {
      setErrorMessage('Please enter a valid counted physical cash amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await postDrawerSessionAction({
        action: 'handover',
        sessionId: session.id,
        incomingCustodianId: effectiveIncomingCustodianId,
        countedCash: counted,
        notes: notes.trim() || null,
        idempotencyKey,
      });

      await onSuccess();
      setIdempotencyKey(crypto.randomUUID());
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to handover cash session.';
      setErrorMessage(msg);
      // NOTE: idempotencyKey is preserved on submission failure so retry will resubmit with same key
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cashier-modal-overlay" role="dialog" aria-modal="true">
      <div className="cashier-modal-card">
        <div className="cashier-modal-header">
          <div className="flex items-center gap-3">
            <div className="cashier-brand-icon">
              <ArrowRightLeft size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="cashier-modal-title">Hand Over Cash Drawer</h2>
              <p className="cashier-modal-subtitle">
                Transfer custody to incoming staff shift.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cashier-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cashier-modal-body">
            {errorMessage && (
              <div className="cashier-notice-banner warning" role="alert">
                <AlertCircle size={16} className="text-amber-700 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="cashier-order-box">
              <div className="cashier-order-row">
                <span className="text-slate-500">Current Custodian</span>
                <span className="font-semibold text-slate-900">
                  {session.currentCustodianName ||
                    session.openedByName ||
                    'Staff'}
                </span>
              </div>
              <div className="cashier-order-row">
                <span className="text-slate-500">Expected Physical Cash</span>
                <span className="font-bold text-slate-900">
                  ₱{session.expectedCash.toLocaleString()}
                </span>
              </div>
              {variance !== 0 && (
                <div className="cashier-order-row">
                  <span className="text-slate-500">Counted Variance</span>
                  <span
                    className={
                      variance > 0
                        ? 'text-emerald-700 font-bold'
                        : 'text-red-700 font-bold'
                    }
                  >
                    {variance > 0 ? '+' : ''}₱{variance.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="cashier-form-group">
              <label
                htmlFor="incoming-custodian-select"
                className="cashier-label"
              >
                Incoming Custodian <span className="req">*</span>
              </label>
              <select
                id="incoming-custodian-select"
                className="cashier-select"
                value={effectiveIncomingCustodianId}
                onChange={(e) => setCustomIncomingCustodianId(e.target.value)}
                disabled={isSubmitting}
              >
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="cashier-form-group">
              <label htmlFor="counted-cash-input" className="cashier-label">
                Counted Physical Cash (₱) <span className="req">*</span>
              </label>
              <input
                id="counted-cash-input"
                type="number"
                step="0.01"
                min="0"
                className="cashier-input"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="cashier-form-group">
              <label htmlFor="handover-notes-input" className="cashier-label">
                Handover Notes (Optional)
              </label>
              <input
                id="handover-notes-input"
                type="text"
                className="cashier-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. shift count verified"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="cashier-modal-footer">
            <button
              type="button"
              className="btn-secondary-compact"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-compact flex items-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <span>Confirm Handover</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Close Session Modal ──────────────────────────────────────────────────────

interface CloseSessionModalProps {
  isOpen: boolean;
  session: CashSessionSummary | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function CloseSessionModal({
  isOpen,
  session,
  onClose,
  onSuccess,
}: CloseSessionModalProps) {
  const [countedCash, setCountedCash] = useState<string>(
    session ? String(session.expectedCash) : '',
  );
  const [closingNote, setClosingNote] = useState<string>(
    'Drawer balanced and locked',
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    crypto.randomUUID(),
  );

  if (!isOpen || !session) return null;

  const counted = parseFloat(countedCash) || 0;
  const variance = counted - session.expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isNaN(counted) || counted < 0) {
      setErrorMessage('Please enter a valid counted physical cash amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await postDrawerSessionAction({
        action: 'close',
        sessionId: session.id,
        countedCash: counted,
        closingNote: closingNote.trim() || null,
        idempotencyKey,
      });

      await onSuccess();
      setIdempotencyKey(crypto.randomUUID());
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to close cash session.';
      setErrorMessage(msg);
      // NOTE: idempotencyKey is preserved on submission failure so retry will resubmit with same key
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cashier-modal-overlay" role="dialog" aria-modal="true">
      <div className="cashier-modal-card">
        <div className="cashier-modal-header">
          <div className="flex items-center gap-3">
            <div className="cashier-brand-icon">
              <CheckCircle2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="cashier-modal-title">Close Cash Session</h2>
              <p className="cashier-modal-subtitle">
                Reconcile physical cash and close drawer session.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cashier-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cashier-modal-body">
            {errorMessage && (
              <div className="cashier-notice-banner warning" role="alert">
                <AlertCircle size={16} className="text-amber-700 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="cashier-order-box">
              <div className="cashier-order-row">
                <span className="text-slate-500">Drawer Account</span>
                <span className="font-semibold text-slate-900">
                  {session.cashDrawerName}
                </span>
              </div>
              <div className="cashier-order-row">
                <span className="text-slate-500">Opening Float</span>
                <span className="font-medium text-slate-900">
                  ₱{session.openingFloat.toLocaleString()}
                </span>
              </div>
              <div className="cashier-order-row">
                <span className="text-slate-500">Expected Physical Cash</span>
                <span className="font-bold text-slate-900">
                  ₱{session.expectedCash.toLocaleString()}
                </span>
              </div>
              {variance !== 0 && (
                <div className="cashier-order-row">
                  <span className="text-slate-500">Variance</span>
                  <span
                    className={
                      variance > 0
                        ? 'text-emerald-700 font-bold'
                        : 'text-red-700 font-bold'
                    }
                  >
                    {variance > 0 ? '+' : ''}₱{variance.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="cashier-form-group">
              <label htmlFor="close-counted-input" className="cashier-label">
                Final Counted Physical Cash (₱) <span className="req">*</span>
              </label>
              <input
                id="close-counted-input"
                type="number"
                step="0.01"
                min="0"
                className="cashier-input"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="cashier-form-group">
              <label htmlFor="close-note-input" className="cashier-label">
                Closing Note (Optional)
              </label>
              <input
                id="close-note-input"
                type="text"
                className="cashier-input"
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
                placeholder="e.g. deposited in safe"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="cashier-modal-footer">
            <button
              type="button"
              className="btn-secondary-compact"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-compact flex items-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Closing...</span>
                </>
              ) : (
                <span>Close Cash Session</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Cash Adjustment Modal ────────────────────────────────────────────────────

interface CashAdjustmentModalProps {
  isOpen: boolean;
  session: CashSessionSummary | null;
  entryType: 'cash_addition' | 'cash_removal';
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function CashAdjustmentModal({
  isOpen,
  session,
  entryType,
  onClose,
  onSuccess,
}: CashAdjustmentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    crypto.randomUUID(),
  );

  if (!isOpen || !session) return null;

  const isAddition = entryType === 'cash_addition';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const adjAmount = parseFloat(amount);
    if (isNaN(adjAmount) || adjAmount <= 0) {
      setErrorMessage('Please enter an amount greater than zero.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Please provide a reason for this cash movement.');
      return;
    }

    setIsSubmitting(true);
    try {
      await postDrawerSessionAction({
        action: 'adjustment',
        cashDrawerId: session.cashDrawerAccountId,
        entryType,
        amount: adjAmount,
        adjustmentReason: reason.trim(),
        notes: notes.trim() || null,
        idempotencyKey,
      });

      await onSuccess();
      setIdempotencyKey(crypto.randomUUID());
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to record cash movement.';
      setErrorMessage(msg);
      // NOTE: idempotencyKey is preserved on submission failure so retry will resubmit with same key
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cashier-modal-overlay" role="dialog" aria-modal="true">
      <div className="cashier-modal-card">
        <div className="cashier-modal-header">
          <div className="flex items-center gap-3">
            <div className="cashier-brand-icon">
              {isAddition ? (
                <PlusCircle size={20} className="text-emerald-700" />
              ) : (
                <MinusCircle size={20} className="text-rose-700" />
              )}
            </div>
            <div>
              <h2 className="cashier-modal-title">
                {isAddition ? 'Add Cash to Drawer' : 'Remove Cash from Drawer'}
              </h2>
              <p className="cashier-modal-subtitle">
                {isAddition
                  ? 'Add physical float currency into active session'
                  : 'Withdraw physical cash from active session'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="cashier-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cashier-modal-body">
            {errorMessage && (
              <div className="cashier-notice-banner warning" role="alert">
                <AlertCircle size={16} className="text-amber-700 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="cashier-form-group">
              <label htmlFor="adj-amount-input" className="cashier-label">
                Amount (₱) <span className="req">*</span>
              </label>
              <input
                id="adj-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                className="cashier-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="cashier-form-group">
              <label htmlFor="adj-reason-input" className="cashier-label">
                Reason <span className="req">*</span>
              </label>
              <input
                id="adj-reason-input"
                type="text"
                className="cashier-input"
                placeholder={
                  isAddition ? 'e.g. Additional change float' : 'e.g. Safe drop'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="cashier-form-group">
              <label htmlFor="adj-notes-input" className="cashier-label">
                Notes (Optional)
              </label>
              <input
                id="adj-notes-input"
                type="text"
                className="cashier-input"
                placeholder="Additional audit details"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="cashier-modal-footer">
            <button
              type="button"
              className="btn-secondary-compact"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-compact flex items-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isAddition ? 'Add Cash' : 'Remove Cash'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
