import {
  Calendar,
  Coins,
  CreditCard,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { HistoryTabSummary } from '../../../types/cashier';
import {
  ModuleSummaryCard,
  ModuleKpiGrid,
  ModuleKpiCell,
  ModuleDataGridFrame,
  ModuleTable,
} from '../../workspace';

interface CashierHistoryTabProps {
  historyData: HistoryTabSummary | null;
  loadError?: string | null;
  onRetry?: () => void;
}

export function CashierHistoryTab({
  historyData,
  loadError,
  onRetry,
}: CashierHistoryTabProps) {
  const data = historyData;
  const isSupported =
    (data?.isHistoricalSummarySupported ?? false) && !loadError;

  const formatAmount = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '—';
    return `₱${val.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const norm = status.toLowerCase();
    if (norm === 'reviewed' || norm === 'approved' || norm === 'closed') {
      return (
        <span className="badge-paid flex items-center gap-1 w-max">
          <CheckCircle2 size={12} />
          <span className="capitalize">{status.replace(/_/g, ' ')}</span>
        </span>
      );
    }
    if (norm === 'needs_review' || norm === 'submitted') {
      return (
        <span className="badge-partial flex items-center gap-1 w-max">
          <AlertCircle size={12} />
          <span className="capitalize">{status.replace(/_/g, ' ')}</span>
        </span>
      );
    }
    return (
      <span className="badge-unpaid flex items-center gap-1 w-max">
        <span className="capitalize">{status.replace(/_/g, ' ')}</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Informational banner when backend contract does not support multi-day aggregates */}
      {!isSupported && !loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span>
            Historical monthly aggregates, finalization logs and multi-day
            closing audits are pending server contract support. Displaying
            verified session reconciliation records below.
          </span>
        </div>
      )}

      {/* Error banner if history failed to load */}
      {loadError && (
        <div
          className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-900 flex items-center justify-between gap-2"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>
              Failed to retrieve historical day-close data: {loadError}
            </span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn-secondary-compact text-xs shrink-0"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Monthly History KPIs */}
      <ModuleSummaryCard
        ariaLabel="Monthly History Summary"
        className="cashier-kpi-summary"
      >
        <ModuleKpiGrid className="cashier-kpi-grid grid-cols-2 lg:grid-cols-4">
          <ModuleKpiCell
            label="Closed Days (This Month)"
            count={
              isSupported ? (data?.closedDaysThisMonth ?? 0) : 'Unavailable'
            }
            subtext={
              loadError
                ? 'Failed to load'
                : isSupported
                  ? 'Reconciled sessions'
                  : 'Contract not supported'
            }
            icon={<Calendar size={15} aria-hidden="true" />}
            accentClass="kpi-accent-gold"
            testId="cashier-kpi-history-days"
          />
          <ModuleKpiCell
            label="Total Monthly Inflows"
            count={
              isSupported
                ? `₱${(data?.totalInflowThisMonth ?? 0).toLocaleString()}`
                : 'Unavailable'
            }
            subtext={
              loadError
                ? 'Failed to load'
                : isSupported
                  ? 'Verified deposits'
                  : 'Contract not supported'
            }
            icon={<Coins size={15} aria-hidden="true" />}
            accentClass="kpi-accent-emerald"
            testId="cashier-kpi-history-inflow"
          />
          <ModuleKpiCell
            label="Total Monthly Outflows"
            count={
              isSupported
                ? `₱${(data?.totalOutflowThisMonth ?? 0).toLocaleString()}`
                : 'Unavailable'
            }
            subtext={
              loadError
                ? 'Failed to load'
                : isSupported
                  ? 'Verified disbursements'
                  : 'Contract not supported'
            }
            icon={<CreditCard size={15} aria-hidden="true" />}
            accentClass="kpi-accent-rose"
            testId="cashier-kpi-history-outflow"
          />
          <ModuleKpiCell
            label="Review Exceptions"
            count={isSupported ? (data?.reviewExceptions ?? 0) : 'Unavailable'}
            subtext={
              loadError
                ? 'Failed to load'
                : isSupported
                  ? 'Unresolved variances'
                  : 'Contract not supported'
            }
            icon={<AlertCircle size={15} aria-hidden="true" />}
            accentClass="kpi-accent-blue"
            testId="cashier-kpi-history-exceptions"
          />
        </ModuleKpiGrid>
      </ModuleSummaryCard>

      {/* Historical Sessions Table Card */}
      <div className="cashier-card">
        <div className="cashier-card-header">
          <div className="flex items-center gap-3">
            <div className="cashier-brand-icon">
              <History size={20} />
            </div>
            <div>
              <h3 className="cashier-card-title">
                Session & Day Close History
              </h3>
              <p className="cashier-card-subtitle">
                Authoritative historical cash drawer and reconciliation logs.
              </p>
            </div>
          </div>
        </div>

        <ModuleDataGridFrame naturalHeight>
          {loadError ? (
            <div className="bookings-table-empty-state py-10 bg-rose-50/30">
              <div className="flex flex-col items-center justify-center gap-2 text-rose-700">
                <AlertCircle size={20} className="text-rose-600" />
                <span className="font-semibold text-sm">
                  Failed to load historical reconciliation records
                </span>
                <span className="text-xs text-rose-600 max-w-md">
                  {loadError}
                </span>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 btn-secondary-compact text-xs"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          ) : !data?.records || data.records.length === 0 ? (
            <div className="bookings-table-empty-state py-10">
              <History size={32} className="text-slate-300" />
              <p className="font-medium text-slate-600 mt-2 text-sm">
                No historical reconciliation records available for this branch
              </p>
              <p className="text-2xs text-slate-400 mt-0.5">
                Past session logs will be archived here.
              </p>
            </div>
          ) : (
            <ModuleTable>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Date</th>
                  <th>Branch</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Inflow</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>
                    Outflow
                  </th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Net</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>
                    Status
                  </th>
                  <th style={{ width: '130px' }}>Reviewed By</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="font-medium text-slate-800 text-xs">
                      {rec.date}
                    </td>
                    <td className="text-slate-600 text-xs">{rec.branchName}</td>
                    <td className="font-bold text-emerald-800 text-xs text-right">
                      {formatAmount(rec.inflow)}
                    </td>
                    <td className="font-bold text-rose-800 text-xs text-right">
                      {rec.outflow !== null &&
                      rec.outflow !== undefined &&
                      rec.outflow > 0
                        ? `₱${rec.outflow.toLocaleString()}`
                        : rec.outflow === 0
                          ? '₱0.00'
                          : '—'}
                    </td>
                    <td className="font-bold text-slate-900 text-xs text-right">
                      {formatAmount(rec.net)}
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(rec.status)}
                      </div>
                    </td>
                    <td className="text-slate-500 text-xs">
                      {rec.reviewedBy ?? 'Not recorded'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </ModuleTable>
          )}
        </ModuleDataGridFrame>
      </div>
    </div>
  );
}
