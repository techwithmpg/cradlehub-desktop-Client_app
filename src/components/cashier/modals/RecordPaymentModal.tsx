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
} from '../../../types/cashier';
import { postRecordPayment } from '../../../lib/cashier-service';

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

  const [prevOrderId, setPrevOrderId] = useState<string | null>(
    order?.id ?? null,
  );
  if (order && order.id !== prevOrderId) {
    setPrevOrderId(order.id);
    setIdempotencyKey(crypto.randomUUID());
    setErrorMessage(null);
    setAmountReceived(String(order.remainingBalance));
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

  const handleQuickAdd = (addAmount: number) => {
    const current = parseFloat(amountReceived) || 0;
    setAmountReceived(String(current + addAmount));
  };

  const handleSetExact = (exactAmount: number) => {
    setAmountReceived(String(exactAmount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amount = parseFloat(amountReceived);
    if (!amount || isNaN(amount) || amount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than zero.');
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

    setIsSubmitting(true);
    try {
      await postRecordPayment({
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
      });

      await onSuccess();
      setIdempotencyKey(crypto.randomUUID());
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to record payment.';
      setErrorMessage(msg);
      // NOTE: idempotencyKey is preserved on submission failure so retry will resubmit with same key
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = order.customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
            {/* Error Banner */}
            {errorMessage && (
              <div className="cashier-notice-banner warning" role="alert">
                <AlertCircle size={16} className="text-amber-700 shrink-0" />
                <span>{errorMessage}</span>
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
                      {order.bookingStatus === 'completed'
                        ? 'Service Completed'
                        : 'In Progress'}
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
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={isSubmitting}
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
                  onChange={(e) => setCustomAccountId(e.target.value)}
                  disabled={isSubmitting || compatibleAccounts.length === 0}
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
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                  disabled={isSubmitting}
                  required
                />
                <div className="cashier-amount-chips">
                  <button
                    type="button"
                    className="cashier-amount-chip"
                    onClick={() => handleSetExact(order.remainingBalance)}
                    disabled={isSubmitting}
                  >
                    Exact
                  </button>
                  <button
                    type="button"
                    className="cashier-amount-chip"
                    onClick={() => handleQuickAdd(500)}
                    disabled={isSubmitting}
                  >
                    +₱500
                  </button>
                  <button
                    type="button"
                    className="cashier-amount-chip"
                    onClick={() => handleQuickAdd(1000)}
                    disabled={isSubmitting}
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
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. customer paid in cash, promo code applied, etc."
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              disabled={isSubmitting || compatibleAccounts.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
