import { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  ShoppingCart,
  Zap,
  Car,
  Wallet,
  MoreHorizontal,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type {
  ExpenseCategoryOption,
  MaskedAccountOption,
} from '../../../types/cashier';
import { postRecordExpense } from '../../../lib/cashier-service';

interface RecordExpenseModalProps {
  isOpen: boolean;
  categories: ExpenseCategoryOption[];
  accounts: MaskedAccountOption[];
  businessDate: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function RecordExpenseModal({
  isOpen,
  categories,
  accounts,
  businessDate,
  onClose,
  onSuccess,
}: RecordExpenseModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const activeCategoryId = selectedCategoryId || (categories[0]?.id ?? '');
  const [payeeOrDescription, setPayeeOrDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [customAccountId, setCustomAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    crypto.randomUUID(),
  );

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const expenseAmount = parseFloat(amount);
    if (!expenseAmount || isNaN(expenseAmount) || expenseAmount <= 0) {
      setErrorMessage('Please enter a valid expense amount greater than zero.');
      return;
    }

    if (!activeCategoryId) {
      setErrorMessage('Please select an authorized expense category.');
      return;
    }

    if (!payeeOrDescription.trim()) {
      setErrorMessage('Please enter a payee or description for the expense.');
      return;
    }

    if (!effectiveAccountId) {
      setErrorMessage('Please select a payment account.');
      return;
    }

    setIsSubmitting(true);
    try {
      await postRecordExpense({
        categoryId: activeCategoryId,
        financialAccountId: effectiveAccountId,
        amount: expenseAmount,
        payee: payeeOrDescription.trim(),
        description: payeeOrDescription.trim(),
        businessDate,
        notes: notes.trim() || null,
        idempotencyKey,
      });

      await onSuccess();
      setIdempotencyKey(crypto.randomUUID());
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to record expense.';
      setErrorMessage(msg);
      // NOTE: idempotencyKey is preserved on submission failure so retry will resubmit with same key
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (code: string) => {
    switch (code) {
      case 'supplies':
        return <ShoppingCart size={15} />;
      case 'utilities':
        return <Zap size={15} />;
      case 'transportation':
        return <Car size={15} />;
      case 'petty_cash':
        return <Wallet size={15} />;
      default:
        return <MoreHorizontal size={15} />;
    }
  };

  return (
    <div
      className="cashier-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-expense-title"
    >
      <div className="cashier-modal-card">
        {/* Header */}
        <div className="cashier-modal-header">
          <div className="flex items-center gap-3">
            <div className="cashier-brand-icon">
              <FileSpreadsheet size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="record-expense-title" className="cashier-modal-title">
                Record Expense
              </h2>
              <p className="cashier-modal-subtitle">Record a new expense.</p>
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

            {/* Category Chips Selector */}
            <div className="cashier-form-group">
              <label className="cashier-label">
                Expense Category <span className="req">*</span>
              </label>
              <div className="cashier-chips-group">
                {categories.map((cat) => {
                  const isSelected = activeCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cashier-chip-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      disabled={isSubmitting}
                    >
                      {getCategoryIcon(cat.code)}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payee / Description */}
            <div className="cashier-form-group">
              <label htmlFor="expense-payee-input" className="cashier-label">
                Payee or Description <span className="req">*</span>
              </label>
              <input
                id="expense-payee-input"
                type="text"
                className="cashier-input"
                placeholder="e.g. Nail products, electricity load, store snacks"
                value={payeeOrDescription}
                onChange={(e) => setPayeeOrDescription(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Payment Method & Account Row */}
            <div className="cashier-form-row">
              <div className="cashier-form-group">
                <label
                  htmlFor="expense-method-select"
                  className="cashier-label"
                >
                  Payment Method <span className="req">*</span>
                </label>
                <select
                  id="expense-method-select"
                  className="cashier-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="card">Card (Corporate)</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="cashier-form-group">
                <label
                  htmlFor="expense-account-select"
                  className="cashier-label"
                >
                  Account <span className="req">*</span>
                </label>
                <select
                  id="expense-account-select"
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

            {/* Amount and Date */}
            <div className="cashier-form-row">
              <div className="cashier-form-group">
                <label htmlFor="expense-amount-input" className="cashier-label">
                  Amount <span className="req">*</span>
                </label>
                <input
                  id="expense-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="cashier-input"
                  placeholder="₱0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="cashier-form-group">
                <label htmlFor="expense-date-input" className="cashier-label">
                  Business Date
                </label>
                <input
                  id="expense-date-input"
                  type="text"
                  className="cashier-input bg-slate-50 text-slate-600"
                  value={businessDate}
                  readOnly
                  disabled
                />
              </div>
            </div>

            {/* Notes */}
            <div className="cashier-form-group">
              <label htmlFor="expense-notes-input" className="cashier-label">
                Notes (Optional)
              </label>
              <textarea
                id="expense-notes-input"
                className="cashier-textarea"
                rows={2}
                placeholder="e.g. nail polish, towels, cleaning supplies"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Record Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
