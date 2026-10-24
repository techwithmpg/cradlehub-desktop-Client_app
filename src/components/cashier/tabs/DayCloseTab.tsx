import {
  CalendarDays,
  AlertTriangle,
  Coins,
  CreditCard,
  ArrowRightLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type { DayCloseSummaryData } from '../../../types/cashier';

interface DayCloseTabProps {
  dayCloseData: DayCloseSummaryData | null;
  onNavigateToDrawers: () => void;
}

export function DayCloseTab({
  dayCloseData,
  onNavigateToDrawers,
}: DayCloseTabProps) {
  const data = dayCloseData ?? {
    businessDate: 'Today',
    isBalanced: true,
    readyForReview: false,
    lastUpdatedText: 'Not updated',
    reconciliationStatus: 'not_started' as const,
    expectedCash: 0,
    actualCash: null,
    cashVariance: null,
    channelVariance: null,
    recordedInflow: 0,
    recordedOutflow: 0,
    netPosition: 0,
    openIssuesCount: 0,
    paymentBreakdown: [],
    isFinalizationSupported: false,
  };

  return (
    <div className="space-y-5">
      {/* Critical Backend Limitation Guard Banner */}
      <div className="cashier-notice-banner warning flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
        <AlertTriangle size={20} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sm">
            Full Business Day Finalization Unsupported by Server Contract
          </div>
          <div className="text-xs text-amber-800 leading-relaxed">
            The hosted financial contract explicitly reports{' '}
            <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-semibold">
              isFinalizationSupported: false
            </code>
            . You can close individual cash drawer sessions and reconcile
            physical float on the Cash Drawer tab. However, complete day
            financial finalization is not operational on the server. The Close
            Day button remains disabled to prevent false accounting claims.
          </div>
        </div>
      </div>

      {/* Day Close Reconciliation Card */}
      <div className="cashier-card">
        <div className="cashier-card-header">
          <div className="flex items-center gap-3">
            <div className="cashier-brand-icon">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="cashier-card-title">Day Close & Reconciliation</h3>
              <p className="cashier-card-subtitle">
                Business date: {data.businessDate} • Reconciliation status:{' '}
                <span className="font-semibold text-slate-800 uppercase">
                  {data.reconciliationStatus}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary-compact text-xs"
              onClick={onNavigateToDrawers}
            >
              Manage Cash Drawer Sessions
            </button>
            <button
              type="button"
              className="btn-primary-compact text-xs opacity-50 cursor-not-allowed flex items-center gap-1.5"
              disabled
              title="Full day finalization is disabled because isFinalizationSupported is false on the server."
            >
              <Lock size={13} />
              <span>Close Day (Unavailable)</span>
            </button>
          </div>
        </div>

        {/* 3 Overview Figures */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-200">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-2xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Coins size={12} /> Total Recorded Inflow
            </span>
            <div className="text-2xl font-bold text-emerald-800 mt-1">
              ₱{data.recordedInflow.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              All settled customer tenders
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-2xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <CreditCard size={12} /> Total Recorded Outflow
            </span>
            <div className="text-2xl font-bold text-rose-800 mt-1">
              ₱{data.recordedOutflow.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              Posted expenses and cash drops
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-2xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <ArrowRightLeft size={12} /> Net Business Day Position
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₱{data.netPosition.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              Inflows minus outflows
            </span>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-3">
            Tender Mix & Reconciliation
          </h4>
          <div className="cashier-table-wrapper">
            <table className="cashier-table">
              <thead>
                <tr>
                  <th>Payment Method</th>
                  <th>Recorded Amount</th>
                  <th>Transactions</th>
                  <th>Share</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      No payments posted for this business day.
                    </td>
                  </tr>
                ) : (
                  data.paymentBreakdown.map((item) => (
                    <tr key={item.method}>
                      <td className="font-semibold text-slate-900 capitalize">
                        {item.label}
                      </td>
                      <td className="font-bold text-slate-900">
                        ₱{item.amount.toLocaleString()}
                      </td>
                      <td className="text-slate-600 font-medium">
                        {item.transactionCount}
                      </td>
                      <td className="text-slate-500">{item.percentage}%</td>
                      <td>
                        <span className="badge-paid flex items-center gap-1 w-max">
                          <CheckCircle2 size={12} />
                          <span>Audited</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
