import { useState } from 'react';
import {
  Coins,
  CreditCard,
  ArrowRightLeft,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  RotateCcw,
  MoreHorizontal,
} from 'lucide-react';
import type { CashierLedgerResponseData } from '../../../types/cashier';
import { fetchCashierLedger } from '../../../lib/cashier-service';
import {
  ModuleSummaryCard,
  ModuleKpiGrid,
  ModuleKpiCell,
  ModuleDataGridFrame,
  ModuleTable,
  ModulePagination,
} from '../../workspace';

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
  const [loadError, setLoadError] = useState<string | null>(null);

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
      setLoadError(null);
      setPage(targetPage);
    } catch (error) {
      setLedgerData(null);
      setLoadError(
        error instanceof Error ? error.message : 'Ledger is unavailable.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = () => {
    loadLedger(1);
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

  if (!ledgerData) {
    return (
      <div className="cashier-card p-8 text-sm text-slate-600" role="status">
        <p>{loadError ?? 'Ledger data is unavailable.'}</p>
        <button
          type="button"
          className="cashier-btn-secondary mt-3"
          onClick={() => void loadLedger(1)}
          disabled={isLoading}
        >
          {isLoading ? 'Checking...' : 'Retry ledger'}
        </button>
      </div>
    );
  }

  const kpis = ledgerData.kpis;

  return (
    <div className="space-y-5">
      {/* 4 Summary Cards */}
      <ModuleSummaryCard
        ariaLabel="Financial Ledger Summary"
        className="cashier-kpi-summary"
      >
        <ModuleKpiGrid className="cashier-kpi-grid grid-cols-2 lg:grid-cols-4">
          <ModuleKpiCell
            label="Inflows Today"
            count={`₱${kpis.inflow.toLocaleString()}`}
            subtext="Verified Receipts"
            icon={<Coins size={15} aria-hidden="true" />}
            accentClass="kpi-accent-gold"
            testId="cashier-kpi-ledger-inflow"
          />
          <ModuleKpiCell
            label="Expenses Today"
            count={`₱${kpis.outflow.toLocaleString()}`}
            subtext="Verified Outflows"
            icon={<CreditCard size={15} aria-hidden="true" />}
            accentClass="kpi-accent-rose"
            testId="cashier-kpi-ledger-outflow"
          />
          <ModuleKpiCell
            label="Net Cash Movement"
            count={`₱${kpis.netFlow.toLocaleString()}`}
            subtext="Net balance change"
            icon={<ArrowRightLeft size={15} aria-hidden="true" />}
            accentClass="kpi-accent-emerald"
            testId="cashier-kpi-ledger-net"
          />
          <ModuleKpiCell
            label="Posted Transactions"
            count={totalRecords}
            subtext="Authoritative Records"
            icon={<FileSpreadsheet size={15} aria-hidden="true" />}
            accentClass="kpi-accent-blue"
            testId="cashier-kpi-ledger-count"
          />
        </ModuleKpiGrid>
      </ModuleSummaryCard>

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
        <ModuleDataGridFrame naturalHeight>
          {records.length === 0 ? (
            <div className="bookings-table-empty-state py-12">
              <FileSpreadsheet size={36} className="text-slate-300" />
              <p className="font-medium text-slate-600 mt-2 text-sm">
                No financial ledger transactions found for this date
              </p>
              <p className="text-2xs text-slate-400 mt-0.5">
                Authoritative transaction records will appear here.
              </p>
            </div>
          ) : (
            <ModuleTable>
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Date &amp; Time</th>
                  <th style={{ width: '130px' }}>Reference</th>
                  <th style={{ width: '100px' }}>Type</th>
                  <th>Customer / Payee</th>
                  <th>Description</th>
                  <th style={{ width: '120px' }}>Payment Method</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '50px', textAlign: 'center' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => {
                  const isPositive =
                    row.inflow !== null &&
                    (row.outflow === null || row.outflow === 0);
                  const amount = row.inflow ?? row.outflow ?? 0;

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="whitespace-nowrap text-slate-600 font-medium text-xs">
                        {row.dateTime}
                      </td>
                      <td className="font-mono text-xs font-bold text-slate-800">
                        {row.reference}
                      </td>
                      <td>{getTypeBadge(row.category, row.inflow)}</td>
                      <td className="font-semibold text-slate-900 text-xs">
                        {row.customerSource}
                      </td>
                      <td className="max-w-xs truncate text-slate-700 text-xs">
                        {row.category}
                      </td>
                      <td className="text-slate-600 font-medium text-xs">
                        {row.method}
                      </td>
                      <td
                        className={`font-bold whitespace-nowrap text-xs text-right ${
                          isPositive ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isPositive ? '+' : '-'}₱
                        {Math.abs(amount).toLocaleString()}
                      </td>
                      <td className="text-center">
                        {getStatusBadge(row.status)}
                      </td>
                      <td className="text-center">
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
                })}
              </tbody>
            </ModuleTable>
          )}

          {totalRecords > 0 && (
            <ModulePagination
              startRecord={totalRecords === 0 ? 0 : (page - 1) * pageSize + 1}
              endRecord={Math.min(page * pageSize, totalRecords)}
              totalItems={totalRecords}
              entityLabel="transactions"
              pageSize={pageSize}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => loadLedger(p)}
              showPageSizeSelector={false}
              testId="cashier-ledger-pagination"
            />
          )}
        </ModuleDataGridFrame>
      </div>
    </div>
  );
}
