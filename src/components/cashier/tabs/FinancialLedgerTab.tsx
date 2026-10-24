import { useState } from 'react';
import {
  Coins,
  CreditCard,
  ArrowRightLeft,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  RotateCcw,
  MoreHorizontal,
} from 'lucide-react';
import type { CashierLedgerResponseData } from '../../../types/cashier';
import { fetchCashierLedger } from '../../../lib/cashier-service';

interface FinancialLedgerTabProps {
  branchName: string;
  initialLedger: CashierLedgerResponseData | null;
}

export function FinancialLedgerTab({
  branchName,
  initialLedger,
}: FinancialLedgerTabProps) {
  const [ledgerData, setLedgerData] =
    useState<CashierLedgerResponseData | null>(initialLedger);
  const [prevInitialLedger, setPrevInitialLedger] =
    useState<CashierLedgerResponseData | null>(initialLedger);

  if (initialLedger !== prevInitialLedger) {
    setPrevInitialLedger(initialLedger);
    setLedgerData(initialLedger);
  }

  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadLedger = async (targetPage = page) => {
    setIsLoading(true);
    try {
      const result = await fetchCashierLedger({
        search: search.trim() || undefined,
        category: typeFilter || undefined,
        method: methodFilter || undefined,
        status: statusFilter || undefined,
        page: targetPage,
        pageSize,
      });
      setLedgerData(result);
      setPage(targetPage);
    } catch {
      // Retain existing state on failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = () => {
    loadLedger(1);
  };

  const kpis = ledgerData?.kpis ?? {
    inflow: 0,
    outflow: 0,
    netFlow: 0,
    unreconciledText: 'All reconciled',
  };

  const records = ledgerData?.records ?? [];
  const totalRecords = ledgerData?.totalRecords ?? 0;
  const totalPages = ledgerData?.totalPages ?? 1;

  const getTypeBadge = (type: string, inflow: number | null) => {
    const isOutflow = inflow === null || inflow === 0;
    const lower = type.toLowerCase();

    if (lower.includes('void')) {
      return (
        <span className="badge-voided flex items-center gap-1">
          <Ban size={12} />
          <span>Void</span>
        </span>
      );
    }
    if (lower.includes('refund')) {
      return (
        <span className="badge-service-completed flex items-center gap-1">
          <RotateCcw size={12} />
          <span>Refund</span>
        </span>
      );
    }
    if (isOutflow || lower.includes('expense')) {
      return (
        <span className="badge-unpaid flex items-center gap-1">
          <ArrowUpRight size={12} />
          <span>Expense</span>
        </span>
      );
    }
    return (
      <span className="badge-paid flex items-center gap-1">
        <ArrowDownLeft size={12} />
        <span>Payment</span>
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'posted':
        return <span className="badge-paid">Posted</span>;
      case 'partial':
        return <span className="badge-partial">Partial</span>;
      case 'voided':
        return <span className="badge-voided">Voided</span>;
      default:
        return <span className="badge-voided">{status}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* 4 Summary Cards */}
      <div className="cashier-kpi-grid">
        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box gold">
            <Coins size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Inflows Today</span>
            <span className="cashier-kpi-value">
              ₱{kpis.inflow.toLocaleString()}
            </span>
            <span className="cashier-kpi-subtext text-emerald-700 font-medium">
              Verified Receipts
            </span>
          </div>
        </div>

        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box rose">
            <CreditCard size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Expenses Today</span>
            <span className="cashier-kpi-value">
              ₱{kpis.outflow.toLocaleString()}
            </span>
            <span className="cashier-kpi-subtext text-rose-700 font-medium">
              Verified Outflows
            </span>
          </div>
        </div>

        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box emerald">
            <ArrowRightLeft size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Net Cash Movement</span>
            <span className="cashier-kpi-value">
              ₱{kpis.netFlow.toLocaleString()}
            </span>
            <span className="cashier-kpi-subtext text-slate-500">
              Net balance change
            </span>
          </div>
        </div>

        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box blue">
            <FileSpreadsheet size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Posted Transactions</span>
            <span className="cashier-kpi-value">{totalRecords}</span>
            <span className="cashier-kpi-subtext text-slate-500">
              Authoritative Records
            </span>
          </div>
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="cashier-card">
        {/* Filter Toolbar */}
        <div className="cashier-ledger-toolbar">
          <div className="cashier-form-group w-40">
            <label className="text-2xs font-semibold text-slate-500 uppercase">
              Location
            </label>
            <input
              type="text"
              className="cashier-input text-xs py-1.5"
              value={branchName}
              readOnly
              disabled
            />
          </div>

          <div className="cashier-form-group w-36">
            <label className="text-2xs font-semibold text-slate-500 uppercase">
              Type
            </label>
            <select
              className="cashier-select text-xs py-1.5"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="service">Payment</option>
              <option value="expense">Expense</option>
              <option value="refund">Refund</option>
            </select>
          </div>

          <div className="cashier-form-group w-36">
            <label className="text-2xs font-semibold text-slate-500 uppercase">
              Payment Method
            </label>
            <select
              className="cashier-select text-xs py-1.5"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="cashier-form-group w-32">
            <label className="text-2xs font-semibold text-slate-500 uppercase">
              Status
            </label>
            <select
              className="cashier-select text-xs py-1.5"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="posted">Posted</option>
              <option value="partial">Partial</option>
              <option value="voided">Voided</option>
            </select>
          </div>

          <div className="cashier-form-group flex-1 min-w-[220px]">
            <label className="text-2xs font-semibold text-slate-500 uppercase">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search reference, customer, payee, description..."
                className="cashier-input text-xs py-1.5 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center gap-2">
            <button
              type="button"
              className="btn-primary-compact flex items-center gap-1.5 text-xs py-2"
              onClick={handleApplyFilter}
              disabled={isLoading}
            >
              <Filter size={13} />
              <span>Filter</span>
            </button>
            <button
              type="button"
              className="btn-secondary-compact flex items-center gap-1.5 text-xs py-2 opacity-60 cursor-not-allowed"
              disabled
              title="Ledger export is pending server contract support."
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* DataGrid */}
        <div className="cashier-table-wrapper">
          <table className="cashier-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Reference</th>
                <th>Type</th>
                <th>Customer / Payee</th>
                <th>Description</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    No financial ledger transactions found for this date.
                  </td>
                </tr>
              ) : (
                records.map((row) => {
                  const isPositive =
                    row.inflow !== null &&
                    (row.outflow === null || row.outflow === 0);
                  const amount = row.inflow ?? row.outflow ?? 0;

                  return (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap text-slate-600 font-medium">
                        {row.dateTime}
                      </td>
                      <td className="font-mono text-xs font-bold text-slate-800">
                        {row.reference}
                      </td>
                      <td>{getTypeBadge(row.category, row.inflow)}</td>
                      <td className="font-semibold text-slate-900">
                        {row.customerSource}
                      </td>
                      <td className="max-w-xs truncate text-slate-700">
                        {row.category}
                      </td>
                      <td className="text-slate-600 font-medium">
                        {row.method}
                      </td>
                      <td
                        className={`font-bold whitespace-nowrap ${
                          isPositive ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isPositive ? '+' : '-'}₱
                        {Math.abs(amount).toLocaleString()}
                      </td>
                      <td>{getStatusBadge(row.status)}</td>
                      <td>
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          aria-label="Transaction actions"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="cashier-pagination">
          <span>
            Showing {records.length === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, totalRecords)} of {totalRecords}{' '}
            transactions
          </span>
          <div className="cashier-page-controls">
            <button
              type="button"
              className="cashier-page-btn"
              onClick={() => loadLedger(Math.max(1, page - 1))}
              disabled={page <= 1 || isLoading}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-medium text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="cashier-page-btn"
              onClick={() => loadLedger(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || isLoading}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
