import {
  Lock,
  Unlock,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  CheckCircle2,
  Info,
  Clock,
  User,
  Banknote,
  Coins,
} from 'lucide-react';
import type {
  CashSessionSummary,
  MaskedAccountOption,
} from '../../../types/cashier';

interface CashDrawerTabProps {
  activeSession: CashSessionSummary | null;
  availableDrawers: MaskedAccountOption[];
  onOpenSessionModal: () => void;
  onOpenHandoverModal: () => void;
  onOpenCloseModal: () => void;
  onOpenAdjustmentModal: (type: 'cash_addition' | 'cash_removal') => void;
}

export function CashDrawerTab({
  activeSession,
  availableDrawers,
  onOpenSessionModal,
  onOpenHandoverModal,
  onOpenCloseModal,
  onOpenAdjustmentModal,
}: CashDrawerTabProps) {
  const isOpen = activeSession?.status === 'open';

  return (
    <div className="space-y-5">
      {/* Active Session Hero Card */}
      <div className="cashier-card">
        <div className="cashier-card-header">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isOpen ? <Unlock size={22} /> : <Lock size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="cashier-card-title">
                  {activeSession?.cashDrawerName ?? 'Main Cash Drawer'}
                </h3>
                <span className={isOpen ? 'badge-paid' : 'badge-voided'}>
                  {isOpen ? 'Session Open' : 'Session Closed'}
                </span>
              </div>
              <p className="cashier-card-subtitle">
                Physical drawer currency and custody tracking for active shift.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOpen ? (
              <button
                type="button"
                className="btn-primary-compact flex items-center gap-1.5"
                onClick={onOpenSessionModal}
                disabled={availableDrawers.length === 0}
              >
                <Unlock size={14} />
                <span>Open Drawer</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-secondary-compact flex items-center gap-1 text-xs"
                  onClick={() => onOpenAdjustmentModal('cash_addition')}
                >
                  <PlusCircle size={13} className="text-emerald-700" />
                  <span>Add Cash</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary-compact flex items-center gap-1 text-xs"
                  onClick={() => onOpenAdjustmentModal('cash_removal')}
                >
                  <MinusCircle size={13} className="text-rose-700" />
                  <span>Remove Cash</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary-compact flex items-center gap-1 text-xs"
                  onClick={onOpenHandoverModal}
                >
                  <ArrowRightLeft size={13} />
                  <span>Handover</span>
                </button>
                <button
                  type="button"
                  className="btn-primary-compact flex items-center gap-1.5 text-xs bg-rose-800 hover:bg-rose-900"
                  onClick={onOpenCloseModal}
                >
                  <CheckCircle2 size={13} />
                  <span>Close Session</span>
                </button>
              </>
            )}
          </div>
        </div>

        {isOpen && activeSession && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-200">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-2xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Coins size={12} /> Opening Float
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                ₱{activeSession.openingFloat.toLocaleString()}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block truncate">
                {activeSession.openingNote || 'Initial shift float'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-2xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <User size={12} /> Current Custodian
              </span>
              <div className="text-base font-bold text-slate-900 mt-1 truncate">
                {activeSession.currentCustodianName ||
                  activeSession.openedByName ||
                  'Front Desk Staff'}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block flex items-center gap-1">
                <Clock size={11} /> {new Date(activeSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-2xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Banknote size={12} /> Expected Physical Cash
              </span>
              <div className="text-xl font-bold text-emerald-800 mt-1">
                ₱{activeSession.expectedCash.toLocaleString()}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Float + physical movements
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-2xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Info size={12} /> Session Date
              </span>
              <div className="text-base font-bold text-slate-900 mt-1">
                {activeSession.businessDate}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Branch business date
              </span>
            </div>
          </div>
        )}

        {/* Informational Callout regarding digital separation */}
        <div className="p-4 bg-emerald-50/50 border-t border-emerald-100 flex items-start gap-3 text-xs text-emerald-900">
          <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">
              Physical Cash vs. Digital Inflows Isolation:
            </span>{' '}
            Only cash payments and cash drawer adjustments alter physical drawer
            currency. GCash, Maya, card terminals, and bank transfers are credited
            directly to their respective institutional accounts and never inflate
            physical cash counts.
          </div>
        </div>
      </div>
    </div>
  );
}
