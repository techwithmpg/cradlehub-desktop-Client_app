import { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  Clock,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type {
  PayableOrderOption,
  MaskedAccountOption,
  RecordPaymentPayload,
} from '../../../types/cashier';
import {
  postRecordPayment,
  CashierApiError,
} from '../../../lib/cashier-service';

type FinancialSubmissionState =
  | 'idle'
  | 'submitting'
  | 'ambiguous_failure'
  | 'definitive_failure'
  | 'confirmed_refresh_failed';

interface PaymentSnapshot {
  payload: RecordPaymentPayload;
  idempotencyKey: string;
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  order: PayableOrderOption | null;
  accounts: MaskedAccountOption[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function RecordPaymentModal({
  isOpen,
  order,
  accounts,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [customAccountId, setCustomAccountId] = useState<string | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>(
    order ? String(order.remainingBalance) : '',
  );
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    crypto.randomUUID(),
  );
  const [submissionState, setSubmissionState] =
    useState<FinancialSubmissionState>('idle');
  const [submissionSnapshot, setSubmissionSnapshot] =
    useState<PaymentSnapshot | null>(null);
  const [isPostingConfirmed, setIsPostingConfirmed] = useState<boolean>(false);

  const [prevOrderId, setPrevOrderId] = useState<string | null>(
    order?.id ?? null,
  );
  if (order && order.id !== prevOrderId) {
    setPrevOrderId(order.id);
    setIdempotencyKey(crypto.randomUUID());
    setErrorMessage(null);
    setAmountReceived(String(order.remainingBalance));
    setSubmissionState('idle');
    setSubmissionSnapshot(null);
    setIsPostingConfirmed(false);
  }

  // Filter accounts compatible with selected payment method
  const compatibleAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      switch (paymentMethod) {
        case 'cash':
          return acc.accountType === 'cash_drawer';
        case 'gcash':
          return acc.accountType === 'gcash';
        case 'maya':
          return acc.accountType === 'maya';
        case 'card':
          return acc.accountType === 'card_terminal';
        case 'bank_transfer':
          return acc.accountType === 'bank_transfer';
        default:
          return false;
      }
    });
  }, [accounts, paymentMethod]);

  const effectiveAccountId =
    customAccountId && compatibleAccounts.some((a) => a.id === customAccountId)
      ? customAccountId
      : (compatibleAccounts[0]?.id ?? '');

  if (!isOpen || !order) return null;

  const handleFieldChange = <T,>(setter: (val: T) => void, val: T) => {
    setter(val);
    // Rule 5: Never retry a changed payload using the old key
    if (submissionState === 'definitive_failure') {
      setIdempotencyKey(crypto.randomUUID());
      setSubmissionSnapshot(null);
      setSubmissionState('idle');
      setErrorMessage(null);
    }
  };

  const handleQuickAdd = (addAmount: number) => {
    const current = parseFloat(amountReceived) || 0;
    handleFieldChange(setAmountReceived, String(current + addAmount));
  };

  const handleSetExact = (exactAmount: number) => {
    handleFieldChange(setAmountReceived, String(exactAmount));
  };

  const isFormLocked =
    isSubmitting ||
    submissionState === 'ambiguous_failure' ||
    isPostingConfirmed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Rule 7: If posting succeeded but UI refresh failed, do not invite another payment.
    if (isPostingConfirmed) {
      onClose();
      return;
    }

    let payloadToSubmit: RecordPaymentPayload;

    if (submissionState === 'ambiguous_failure' && submissionSnapshot) {
      // Rule 4: On ambiguous failure, retry the exact original request payload with the same key
      payloadToSubmit = submissionSnapshot.payload;
    } else {
      const amount = parseFloat(amountReceived);
      if (!amount || isNaN(amount) || amount <= 0) {
        setErrorMessage(
          'Please enter a valid payment amount greater than zero.',
        );
        return;
      }

      if (amount > order.remainingBalance) {
        setErrorMessage(
          `Amount received (₱${amount.toLocaleString()}) cannot exceed the remaining balance of ₱${order.remainingBalance.toLocaleString()}.`,
        );
        return;
      }

      if (!effectiveAccountId) {
        setErrorMessage(
          'Please select an eligible financial account for this payment method.',
        );
        return;
      }

      // Rule 1: Create and preserve an immutable snapshot of the request payload and idempotency key
      payloadToSubmit = {
        orderId: order.id,
        idempotencyKey,
        payments: [
          {
            amount,
            paymentMethod,
            financialAccountId: effectiveAccountId,
          },
        ],
        notes: notes.trim() || null,
      };

      setSubmissionSnapshot({
        payload: payloadToSubmit,
        idempotencyKey,
      });
    }

    setIsSubmitting(true);
    setSubmissionState('submitting');

    try {
      await postRecordPayment(payloadToSubmit);
      setIsPostingConfirmed(true);
    } catch (err: unknown) {
      const isAmbiguous =
        err instanceof CashierApiError ? err.isAmbiguous : true;
      const msg =
        err instanceof Error ? err.message : 'Failed to record payment.';
      setErrorMessage(msg);
      if (isAmbiguous) {
        setSubmissionState('ambiguous_failure');
      } else {
        setSubmissionState('definitive_failure');
      }
      setIsSubmitting(false);
      return;
    }

    // Financial transaction confirmed by server! Now perform workspace refresh.
    try {
      await onSuccess();
      setIdempotencyKey(crypto.randomUUID());
      setSubmissionSnapshot(null);
      setSubmissionState('idle');
      setIsSubmitting(false);
      onClose();
    } catch {
      // Rule 7: If posting succeeded but UI refresh failed, do not invite another payment
      setIsSubmitting(false);
      setSubmissionState('confirmed_refresh_failed');
      setErrorMessage(
        'Payment was successfully posted to the ledger, but updating the local view failed. Do NOT record payment again. Please close this dialog and reload the workspace.',
      );
    }
  };

  const initials = order.customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderOrderLifecycle = () => {
    switch (order.bookingStatus?.toLowerCase()) {
      case 'completed':
        return 'Service Completed';
      case 'in_service':
        return 'In Service';
      case 'waiting':
        return 'Waiting';
      case 'scheduled':
        return 'Scheduled';
      default:
        return order.bookingStatus ?? 'In Progress';
    }
  };

  return (
    <div
      className="cashier-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-payment-title"
    >
      <div className="cashier-modal-card">
        {/* Header */}
        <div className="cashier-modal-header">
          <div className="flex items-center gap-3">
            <div className="cashier-brand-icon">
              <CreditCard size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="record-payment-title" className="cashier-modal-title">
                Record Payment
              </h2>
              <p className="cashier-modal-subtitle">
                Apply payment to a booking and close it.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="cashier-modal-body">
            {/* Error / Ambiguous / Confirmation Banner */}
            {errorMessage && (
              <div
                className={`cashier-notice-banner ${
                  submissionState === 'confirmed_refresh_failed'
                    ? 'success'
                    : 'warning'
                }`}
                role="alert"
              >
                <AlertCircle size={16} className="text-amber-700 shrink-0" />
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="font-medium">{errorMessage}</span>
                  {submissionState === 'ambiguous_failure' && (
                    <span className="text-[11px] text-amber-800">
                      Form inputs are locked to preserve financial idempotency.
                      You may retry the exact submission or close to verify with
                      the supervisor.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Order Overview Summary Card */}
            <div className="cashier-order-box">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="cashier-order-num">
                      {order.orderNumber}
                    </span>
                    <span className="badge-service-completed">
                      {renderOrderLifecycle()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <Calendar size={12} />
                    <span>{order.bookingDate}</span>
                    {order.serviceTime && (
                      <>
                        <span>•</span>
                        <Clock size={12} />
                        <span>{order.serviceTime}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div className="cashier-customer-avatar">{initials}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {order.customerName}
                    </div>
                    {order.customerPhone && (
                      <div className="text-xs text-slate-500">
                        {order.customerPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200 mt-1">
                <div className="font-medium text-slate-900">
                  {order.serviceDescription}
                </div>
                <div className="text-slate-500 mt-0.5">
                  Branch: {order.branchName ?? 'Active Branch'}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="cashier-order-row">
                  <span className="text-slate-500">Total Amount</span>
                  <span className="font-semibold text-slate-900">
                    ₱{order.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="cashier-order-row">
                  <span className="text-slate-500">Amount Paid</span>
                  <span className="text-emerald-700 font-medium">
                    ₱{order.amountPaid.toLocaleString()}
                  </span>
                </div>
                <div className="cashier-order-row total">
                  <span className="font-bold text-slate-900">Amount Due</span>
                  <span className="cashier-due-text">
                    ₱{order.remainingBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method & Account Row */}
            <div className="cashier-form-row">
              <div className="cashier-form-group">
                <label
                  htmlFor="payment-method-select"
                  className="cashier-label"
                >
                  Payment Method <span className="req">*</span>
                </label>
                <select
                  id="payment-method-select"
                  className="cashier-select"
                  value={paymentMethod}
                  onChange={(e) =>
                    handleFieldChange(setPaymentMethod, e.target.value)
                  }
                  disabled={isFormLocked}
                >
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="card">Card (Visa/Mastercard)</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="cashier-form-group">
                <label htmlFor="account-select" className="cashier-label">
                  Account <span className="req">*</span>
                </label>
                <select
                  id="account-select"
                  className="cashier-select"
                  value={effectiveAccountId}
                  onChange={(e) =>
                    handleFieldChange(setCustomAccountId, e.target.value)
                  }
                  disabled={isFormLocked || compatibleAccounts.length === 0}
                >
                  {compatibleAccounts.length === 0 ? (
                    <option value="">No compatible account</option>
                  ) : (
                    compatibleAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}{' '}
                        {acc.identifierMask ? `(${acc.identifierMask})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Amount Received Input & Quick Chips */}
            <div className="cashier-form-group">
              <label htmlFor="amount-received-input" className="cashier-label">
                Amount Received <span className="req">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="amount-received-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="cashier-input"
                  value={amountReceived}
                  onChange={(e) =>
                    handleFieldChange(setAmountReceived, e.target.value)
                  }
                  placeholder="0.00"
                  disabled={isFormLocked}
                  required
                />
                <div className="cashier-amount-chips">
                  <button
                    type="button"
                    className="cashier-amount-chip"
                    onClick={() => handleSetExact(order.remainingBalance)}
                    disabled={isFormLocked}
                  >
                    Exact
                  </button>
                  <button
                    type="button"
                    className="cashier-amount-chip"
                    onClick={() => handleQuickAdd(500)}
                    disabled={isFormLocked}
                  >
                    +₱500
                  </button>
                  <button
                    type="button"
                    className="cashier-amount-chip"
                    onClick={() => handleQuickAdd(1000)}
                    disabled={isFormLocked}
                  >
                    +₱1,000
                  </button>
                </div>
              </div>
              {parseFloat(amountReceived) > 0 &&
                parseFloat(amountReceived) < order.remainingBalance && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                    Partial payment: ₱
                    {(
                      order.remainingBalance - parseFloat(amountReceived)
                    ).toLocaleString()}{' '}
                    will remain in the pending payment queue.
                  </div>
                )}
            </div>

            {/* Notes */}
            <div className="cashier-form-group">
              <label htmlFor="payment-notes-input" className="cashier-label">
                Notes (Optional)
              </label>
              <textarea
                id="payment-notes-input"
                className="cashier-textarea"
                rows={2}
                value={notes}
                onChange={(e) => handleFieldChange(setNotes, e.target.value)}
                placeholder="e.g. customer paid in cash, promo code applied, etc."
                disabled={isFormLocked}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="cashier-modal-footer">
            {isPostingConfirmed ? (
              <button
                type="button"
                className="btn-primary-compact"
                onClick={onClose}
              >
                Close (Payment Confirmed)
              </button>
            ) : (
              <>
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
                  disabled={
                    isSubmitting ||
                    (submissionState !== 'ambiguous_failure' &&
                      compatibleAccounts.length === 0)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>
                        {submissionState === 'ambiguous_failure'
                          ? 'Retrying Submission...'
                          : 'Recording...'}
                      </span>
                    </>
                  ) : submissionState === 'ambiguous_failure' ? (
                    <>
                      <Check size={14} />
                      <span>Retry Original Submission</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Record Payment</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
