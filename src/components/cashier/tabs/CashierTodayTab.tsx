import { useState, useMemo } from 'react';
import {
  Coins,
  Clock,
  Banknote,
  CreditCard,
  FileText,
  Search,
  Filter,
  Plus,
  Archive,
  BookOpen,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type {
  CashierOverviewData,
  PayableOrdersResponseData,
  PayableOrderOption,
} from '../../../types/cashier';

interface CashierTodayTabProps {
  overview: CashierOverviewData | null;
  payableData: PayableOrdersResponseData | null;
  onSelectOrderToPay: (order: PayableOrderOption) => void;
  onOpenRecordExpense: () => void;
  onOpenDrawerSession: () => void;
  onNavigateToTab: (tab: 'ledger' | 'drawers') => void;
}

export function CashierTodayTab({
  overview,
  payableData,
  onSelectOrderToPay,
  onOpenRecordExpense,
  onOpenDrawerSession,
  onNavigateToTab,
}: CashierTodayTabProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [queuePage, setQueuePage] = useState<number>(1);
  const queuePageSize = 8;
  const [closedPage, setClosedPage] = useState<number>(1);
  const closedPageSize = 8;

  const kpis = overview?.kpis ?? {
    totalCollected: 0,
    totalTransactions: 0,
    pendingAmount: 0,
    pendingBookingsCount: 0,
    cashAmount: 0,
    cashCount: 0,
    digitalAmount: 0,
    digitalCount: 0,
    expenseAmount: 0,
    expenseCount: 0,
  };

  const pendingQueue = useMemo(
    () => payableData?.pendingQueue ?? [],
    [payableData?.pendingQueue],
  );
  const paidAndClosed = useMemo(
    () => payableData?.paidAndClosed ?? [],
    [payableData?.paidAndClosed],
  );

  // Filter pending queue by search query
  const filteredQueue = useMemo(() => {
    if (!searchQuery.trim()) return pendingQueue;
    const q = searchQuery.toLowerCase();
    return pendingQueue.filter(
      (order) =>
        order.customerName.toLowerCase().includes(q) ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.serviceDescription.toLowerCase().includes(q),
    );
  }, [pendingQueue, searchQuery]);

  // Paginate pending queue
  const totalQueuePages = Math.max(
    1,
    Math.ceil(filteredQueue.length / queuePageSize),
  );
  const paginatedQueue = useMemo(() => {
    const start = (queuePage - 1) * queuePageSize;
    return filteredQueue.slice(start, start + queuePageSize);
  }, [filteredQueue, queuePage]);

  // Paginate paid and closed
  const totalClosedPages = Math.max(
    1,
    Math.ceil(paidAndClosed.length / closedPageSize),
  );
  const paginatedClosed = useMemo(() => {
    const start = (closedPage - 1) * closedPageSize;
    return paidAndClosed.slice(start, start + closedPageSize);
  }, [paidAndClosed, closedPage]);

  return (
    <div className="space-y-5">
      {/* 5 Summary KPI Cards */}
      <div className="cashier-kpi-grid">
        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box gold">
            <Coins size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Total Collected Today</span>
            <span className="cashier-kpi-value">
              ₱{(kpis.totalCollected ?? 0).toLocaleString()}
            </span>
            <span className="cashier-kpi-subtext">
              {kpis.totalTransactions ?? 0} payments
            </span>
          </div>
        </div>

        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box amber">
            <Clock size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Pending Payments</span>
            <span className="cashier-kpi-value">
              ₱{(kpis.pendingAmount ?? 0).toLocaleString()}
            </span>
            <span className="cashier-kpi-subtext">
              {kpis.pendingBookingsCount ?? 0} bookings
            </span>
          </div>
        </div>

        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box emerald">
            <Banknote size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Cash Payments</span>
            <span className="cashier-kpi-value">
              ₱{(kpis.cashAmount ?? 0).toLocaleString()}
            </span>
            <span className="cashier-kpi-subtext">
              {kpis.cashCount ?? 0} payments
            </span>
          </div>
        </div>

        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box blue">
            <CreditCard size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Digital / Card Payments</span>
            <span className="cashier-kpi-value">
              ₱{(kpis.digitalAmount ?? 0).toLocaleString()}
            </span>
            <span className="cashier-kpi-subtext">
              {kpis.digitalCount ?? 0} payments
            </span>
          </div>
        </div>

        <div className="cashier-kpi-card">
          <div className="cashier-kpi-icon-box rose">
            <FileText size={20} />
          </div>
          <div className="cashier-kpi-content">
            <span className="cashier-kpi-label">Expenses Today</span>
            <span className="cashier-kpi-value">
              ₱{(kpis.expenseAmount ?? 0).toLocaleString()}
            </span>
            <span className="cashier-kpi-subtext">
              {kpis.expenseCount ?? 0} expenses
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workstation Layout */}
      <div className="cashier-today-layout">
        {/* Left Column: Pending Payment Queue */}
        <div className="cashier-card">
          <div className="cashier-card-header">
            <div>
              <h3 className="cashier-card-title">
                Pending Payment Queue ({filteredQueue.length})
              </h3>
              <p className="cashier-card-subtitle">
                Services completed or in progress with outstanding payment.
              </p>
            </div>
            <div className="cashier-card-actions">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customer, booking # or service..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setQueuePage(1);
                  }}
                  className="cashier-input text-xs py-1.5 pl-8 w-64"
                />
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
              <button
                type="button"
                className="btn-secondary-compact flex items-center gap-1 text-xs"
              >
                <Filter size={13} />
                <span>Filter</span>
              </button>
            </div>
          </div>

          <div className="cashier-table-wrapper">
            <table className="cashier-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Booking #</th>
                  <th>Service(s)</th>
                  <th>Amount Due</th>
                  <th>Service Status</th>
                  <th>Payment State</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQueue.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-10 text-slate-400"
                    >
                      No bookings with outstanding payment in queue.
                    </td>
                  </tr>
                ) : (
                  paginatedQueue.map((order) => {
                    const initials = order.customerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    const isCompleted = order.bookingStatus === 'completed';
                    const isPartial =
                      order.amountPaid > 0 &&
                      order.remainingBalance < order.totalAmount;

                    return (
                      <tr key={order.id}>
                        <td className="whitespace-nowrap font-medium text-slate-600">
                          {order.serviceTime ?? 'Today'}
                        </td>
                        <td>
                          <div className="cashier-customer-cell">
                            <div className="cashier-customer-avatar">
                              {initials}
                            </div>
                            <span className="font-semibold text-slate-900">
                              {order.customerName}
                            </span>
                          </div>
                        </td>
                        <td className="font-mono text-xs text-slate-500 font-semibold">
                          {order.orderNumber}
                        </td>
                        <td className="max-w-xs truncate text-slate-700">
                          {order.serviceDescription}
                        </td>
                        <td className="font-bold text-slate-900">
                          ₱{order.remainingBalance.toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={
                              isCompleted
                                ? 'badge-service-completed'
                                : 'badge-in-progress'
                            }
                          >
                            {isCompleted ? 'Service Completed' : 'In Progress'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              isPartial ? 'badge-partial' : 'badge-unpaid'
                            }
                          >
                            {isPartial
                              ? `Partial (₱${order.amountPaid.toLocaleString()})`
                              : 'Unpaid'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => onSelectOrderToPay(order)}
                          >
                            Record Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="cashier-pagination">
            <span>
              Showing{' '}
              {filteredQueue.length === 0
                ? 0
                : (queuePage - 1) * queuePageSize + 1}
              –{Math.min(queuePage * queuePageSize, filteredQueue.length)} of{' '}
              {filteredQueue.length} pending payments
            </span>
            <div className="cashier-page-controls">
              <button
                type="button"
                className="cashier-page-btn"
                onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
                disabled={queuePage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-medium text-slate-700">
                {queuePage} / {totalQueuePages}
              </span>
              <button
                type="button"
                className="cashier-page-btn"
                onClick={() =>
                  setQueuePage((p) => Math.min(totalQueuePages, p + 1))
                }
                disabled={queuePage >= totalQueuePages}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions + Paid & Closed Today */}
        <div className="space-y-5">
          {/* Quick Actions Panel */}
          <div className="cashier-card">
            <div className="cashier-card-header">
              <div>
                <h4 className="cashier-card-title text-sm">Quick Actions</h4>
                <p className="cashier-card-subtitle text-xs">
                  Common tasks for cashier.
                </p>
              </div>
            </div>
            <div className="cashier-quick-actions-panel">
              <button
                type="button"
                className="cashier-primary-action-btn"
                onClick={onOpenRecordExpense}
              >
                <Plus size={18} />
                <span>Record Expense</span>
              </button>

              <div className="cashier-action-tiles-grid">
                <button
                  type="button"
                  className="cashier-action-tile"
                  onClick={onOpenDrawerSession}
                >
                  <Archive size={18} className="text-emerald-800" />
                  <span>Open Cash Drawer</span>
                </button>
                <button
                  type="button"
                  className="cashier-action-tile"
                  onClick={() => onNavigateToTab('ledger')}
                >
                  <BookOpen size={18} className="text-emerald-800" />
                  <span>View Ledger</span>
                </button>
                <button
                  type="button"
                  className="cashier-action-tile"
                  onClick={() => window.print()}
                >
                  <Printer size={18} className="text-emerald-800" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>

          {/* Paid & Closed Today Table */}
          <div className="cashier-card">
            <div className="cashier-card-header">
              <div>
                <h4 className="cashier-card-title text-sm">
                  Paid & Closed Today ({paidAndClosed.length})
                </h4>
                <p className="cashier-card-subtitle text-xs">
                  Completed services with full payment. No action needed.
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-emerald-800 hover:underline"
                onClick={() => onNavigateToTab('ledger')}
              >
                View All &gt;
              </button>
            </div>

            <div className="cashier-table-wrapper">
              <table className="cashier-table text-xs">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Booking #</th>
                    <th>Service</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClosed.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-6 text-slate-400"
                      >
                        No paid bookings closed yet today.
                      </td>
                    </tr>
                  ) : (
                    paginatedClosed.map((order) => (
                      <tr key={order.id}>
                        <td className="text-slate-500 whitespace-nowrap">
                          {order.serviceTime ?? '09:00 AM'}
                        </td>
                        <td className="font-semibold text-slate-900">
                          {order.customerName}
                        </td>
                        <td className="font-mono text-slate-500 text-2xs">
                          {order.orderNumber}
                        </td>
                        <td className="text-slate-700 truncate max-w-[120px]">
                          {order.serviceDescription}
                        </td>
                        <td className="font-bold text-slate-900">
                          ₱{order.totalAmount.toLocaleString()}
                        </td>
                        <td>
                          <span className="badge-paid">Paid</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="cashier-pagination py-2 px-3 text-xs">
              <span>
                {paidAndClosed.length === 0
                  ? 0
                  : (closedPage - 1) * closedPageSize + 1}
                –{Math.min(closedPage * closedPageSize, paidAndClosed.length)}{' '}
                of {paidAndClosed.length}
              </span>
              <div className="cashier-page-controls">
                <button
                  type="button"
                  className="cashier-page-btn w-6 h-6 text-xs"
                  onClick={() => setClosedPage((p) => Math.max(1, p - 1))}
                  disabled={closedPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  className="cashier-page-btn w-6 h-6 text-xs"
                  onClick={() =>
                    setClosedPage((p) => Math.min(totalClosedPages, p + 1))
                  }
                  disabled={closedPage >= totalClosedPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
