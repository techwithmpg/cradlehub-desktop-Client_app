import {
  Calendar,
  Coins,
  CreditCard,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { HistoryTabSummary } from '../../../types/cashier';

interface CashierHistoryTabProps {
  historyData: HistoryTabSummary | null;
}

export function CashierHistoryTab({ historyData }: CashierHistoryTabProps) {
  const data = historyData ?? {
    closedDaysThisMonth: 0,
    totalInflowThisMonth: 0,
    totalOutflowThisMonth: 0,
    reviewExceptions: 0,
    records: [],
    auditTrail: [],
  };

  return (
    <div className="space-y-5">
      {/* Monthly History KPIs */}
      <div className="cashier-kpi-grid">
        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box gold">
            <Calendar size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Closed Days (This Month)</span>
            <span className="cashier-kpi-value">
              {data.closedDaysThisMonth}
            </span>
            <span className="cashier-kpi-subtext text-slate-500">
              Reconciled sessions
            </span>
          </div>
        </div>

        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box emerald">
            <Coins size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Total Monthly Inflows</span>
            <span className="cashier-kpi-value">
              ₱{data.totalInflowThisMonth.toLocaleString()}
            </span>
            <span className="cashier-kpi-subtext text-emerald-700 font-medium">
              Verified deposits
            </span>
          </div>
        </div>

        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box rose">
            <CreditCard size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Total Monthly Outflows</span>
            <span className="cashier-kpi-value">
              ₱{data.totalOutflowThisMonth.toLocaleString()}
            </span>
            <span className="cashier-kpi-subtext text-rose-700 font-medium">
              Verified disbursements
            </span>
          </div>
        </div>

        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box blue">
            <AlertCircle size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Review Exceptions</span>
            <span className="cashier-kpi-value">{data.reviewExceptions}</span>
            <span className="cashier-kpi-subtext text-slate-500">
              Unresolved variances
            </span>
          </div>
        </div>
      </div>

      {/* Historical Sessions Table Card */}
      <div className="cashier-card">
        <div className="cashier-card-header">
          <div className="flex items-center gap-3">
            <div className="cashier-brand-icon">
              <History size={20} />
            </div>
            <div>
              <h3 className="cashier-card-title">Session & Day Close History</h3>
              <p className="cashier-card-subtitle">
                Authoritative historical cash drawer and reconciliation logs.
              </p>
            </div>
          </div>
        </div>

        <div className="cashier-table-wrapper">
          <table className="cashier-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Branch</th>
                <th>Inflow</th>
                <th>Outflow</th>
                <th>Net</th>
                <th>Status</th>
                <th>Reviewed By</th>
              </tr>
            </thead>
            <tbody>
              {data.records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No historical reconciliation records available for this
                    period.
                  </td>
                </tr>
              ) : (
                data.records.map((rec) => (
                  <tr key={rec.id}>
                    <td className="font-medium text-slate-800">{rec.date}</td>
                    <td className="text-slate-600">{rec.branchName}</td>
                    <td className="font-bold text-emerald-800">
                      ₱{rec.inflow.toLocaleString()}
                    </td>
                    <td className="font-bold text-rose-800">
                      ₱{rec.outflow.toLocaleString()}
                    </td>
                    <td className="font-bold text-slate-900">
                      ₱{rec.net.toLocaleString()}
                    </td>
                    <td>
                      <span className="badge-paid flex items-center gap-1 w-max">
                        <CheckCircle2 size={12} />
                        <span className="capitalize">{rec.status}</span>
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs">
                      {rec.reviewedBy ?? 'System'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
