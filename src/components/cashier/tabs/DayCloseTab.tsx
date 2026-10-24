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
import { ModuleDataGridFrame, ModuleTable } from '../../workspace';

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
            Tender Mix &amp; Reconciliation
          </h4>
          <ModuleDataGridFrame naturalHeight>
            {data.paymentBreakdown.length === 0 ? (
              <div className="bookings-table-empty-state py-8">
                <CheckCircle2 size={32} className="text-slate-300" />
                <p className="font-medium text-slate-600 mt-2 text-sm">
                  No payments posted for this business day
                </p>
                <p className="text-2xs text-slate-400 mt-0.5">
                  Tenders processed will appear here for reconciliation.
                </p>
              </div>
            ) : (
              <ModuleTable>
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>
                      Recorded Amount
                    </th>
                    <th style={{ width: '110px', textAlign: 'center' }}>
                      Transactions
                    </th>
                    <th style={{ width: '90px', textAlign: 'center' }}>
                      Share
                    </th>
                    <th style={{ width: '100px', textAlign: 'center' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.paymentBreakdown.map((item) => (
                    <tr
                      key={item.method}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="font-semibold text-slate-900 capitalize text-xs">
                        {item.label}
                      </td>
                      <td className="font-bold text-slate-900 text-xs text-right">
                        ₱{item.amount.toLocaleString()}
                      </td>
                      <td className="text-slate-600 font-medium text-xs text-center">
                        {item.transactionCount}
                      </td>
                      <td className="text-slate-500 text-xs text-center">
                        {item.percentage}%
                      </td>
                      <td className="text-center">
                        <span className="badge-paid flex items-center justify-center gap-1 mx-auto w-max">
                          <CheckCircle2 size={12} />
                          <span>Audited</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ModuleTable>
            )}
          </ModuleDataGridFrame>
        </div>
      </div>
    </div>
  );
}
