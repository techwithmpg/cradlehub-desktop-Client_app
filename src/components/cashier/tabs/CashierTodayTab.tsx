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
  CheckCircle2,
} from 'lucide-react';
import type {
  CashierOverviewData,
  PayableOrdersResponseData,
  PayableOrderOption,
} from '../../../types/cashier';
import {
  ModuleSummaryCard,
  ModuleKpiGrid,
  ModuleKpiCell,
  ModuleDataGridFrame,
  ModuleTable,
  ModulePagination,
} from '../../workspace';

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
      <ModuleSummaryCard
        ariaLabel="Today's Cashier Summary"
        className="cashier-kpi-summary"
      >
        <ModuleKpiGrid className="cashier-kpi-grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <ModuleKpiCell
            label="Total Collected Today"
            count={`₱${(kpis.totalCollected ?? 0).toLocaleString()}`}
            subtext={`${kpis.totalTransactions ?? 0} payments`}
            icon={<Coins size={15} aria-hidden="true" />}
            accentClass="kpi-accent-gold"
            testId="cashier-kpi-collected"
          />
          <ModuleKpiCell
            label="Pending Payments"
            count={`₱${(kpis.pendingAmount ?? 0).toLocaleString()}`}
            subtext={`${kpis.pendingBookingsCount ?? 0} bookings`}
            icon={<Clock size={15} aria-hidden="true" />}
            accentClass="kpi-accent-amber"
            testId="cashier-kpi-pending"
          />
          <ModuleKpiCell
            label="Cash Payments"
            count={`₱${(kpis.cashAmount ?? 0).toLocaleString()}`}
            subtext={`${kpis.cashCount ?? 0} payments`}
            icon={<Banknote size={15} aria-hidden="true" />}
            accentClass="kpi-accent-emerald"
            testId="cashier-kpi-cash"
          />
          <ModuleKpiCell
            label="Digital / Card"
            count={`₱${(kpis.digitalAmount ?? 0).toLocaleString()}`}
            subtext={`${kpis.digitalCount ?? 0} payments`}
            icon={<CreditCard size={15} aria-hidden="true" />}
            accentClass="kpi-accent-blue"
            testId="cashier-kpi-digital"
          />
          <ModuleKpiCell
            label="Expenses Today"
            count={`₱${(kpis.expenseAmount ?? 0).toLocaleString()}`}
            subtext={`${kpis.expenseCount ?? 0} expenses`}
            icon={<FileText size={15} aria-hidden="true" />}
            accentClass="kpi-accent-rose"
            testId="cashier-kpi-expenses"
          />
        </ModuleKpiGrid>
      </ModuleSummaryCard>

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

          {filteredQueue.length === 0 ? (
            <div className="bookings-table-empty-state py-8">
              <div className="bookings-empty-icon-circle">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <h4 className="bookings-empty-heading">Queue Clear</h4>
              <p className="bookings-empty-text">
                {searchQuery.trim()
                  ? 'No bookings matching your search query.'
                  : 'No bookings with outstanding payment in queue.'}
              </p>
            </div>
          ) : (
            <ModuleDataGridFrame naturalHeight>
              <ModuleTable>
                <thead>
                  <tr>
                    <th style={{ width: '65px' }}>Time</th>
                    <th>Customer & Service</th>
                    <th style={{ width: '95px' }}>Booking #</th>
                    <th style={{ width: '95px' }}>Amount Due</th>
                    <th style={{ width: '95px' }}>Status</th>
                    <th style={{ width: '85px' }}>Payment</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQueue.map((order) => {
                    const initials = order.customerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    const isEligible = order.paymentEligible !== false;
                    const isPartial =
                      order.amountPaid > 0 &&
                      order.remainingBalance < order.totalAmount;

                    const renderLifecycleBadge = (status?: string) => {
                      const norm = status?.toLowerCase() ?? 'scheduled';
                      switch (norm) {
                        case 'completed':
                          return (
                            <span className="booking-badge badge-completed">
                              Completed
                            </span>
                          );
                        case 'in_service':
                          return (
                            <span className="booking-badge badge-in-service">
                              In Service
                            </span>
                          );
                        case 'waiting':
                          return (
                            <span className="booking-badge badge-pending">
                              Waiting
                            </span>
                          );
                        case 'scheduled':
                          return (
                            <span className="booking-badge badge-confirmed">
                              Scheduled
                            </span>
                          );
                        case 'confirmed':
                          return (
                            <span className="booking-badge badge-checked-in">
                              Confirmed
                            </span>
                          );
                        case 'cancelled':
                          return (
                            <span className="booking-badge badge-cancelled">
                              Cancelled
                            </span>
                          );
                        default:
                          return (
                            <span className="booking-badge badge-pending capitalize">
                              {norm.replace(/_/g, ' ')}
                            </span>
                          );
                      }
                    };

                    return (
                      <tr key={order.id} className="booking-row">
                        <td className="whitespace-nowrap font-medium text-slate-600 text-xs">
                          {order.serviceTime ?? 'Today'}
                        </td>
                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar-pill">
                              {initials}
                            </div>
                            <div className="customer-info min-w-0">
                              <span className="customer-name block truncate">
                                {order.customerName}
                              </span>
                              <span className="customer-subtext block truncate text-slate-500 max-w-[160px]">
                                {order.serviceDescription}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-xs text-slate-600 font-semibold whitespace-nowrap">
                          {order.orderNumber}
                        </td>
                        <td className="font-bold text-slate-900 whitespace-nowrap text-xs">
                          ₱{order.remainingBalance.toLocaleString()}
                        </td>
                        <td>{renderLifecycleBadge(order.bookingStatus)}</td>
                        <td>
                          <span
                            className={`booking-badge ${
                              isPartial ? 'badge-partial' : 'badge-unpaid'
                            }`}
                          >
                            {isPartial
                              ? `Partial (₱${order.amountPaid.toLocaleString()})`
                              : 'Unpaid'}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              className={`btn-table-action ${
                                !isEligible
                                  ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200 border-slate-300'
                                  : ''
                              }`}
                              onClick={() =>
                                isEligible && onSelectOrderToPay(order)
                              }
                              disabled={!isEligible}
                              title={
                                !isEligible
                                  ? (order.ineligibilityReason ??
                                    'Order is not currently eligible for payment collection')
                                  : undefined
                              }
                            >
                              Record Payment
                            </button>
                            {!isEligible && (
                              <span className="text-[10px] text-amber-700 font-normal leading-tight max-w-[130px] text-right">
                                {order.ineligibilityReason ??
                                  'Not eligible for payment'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </ModuleTable>
            </ModuleDataGridFrame>
          )}

          {filteredQueue.length > 0 && (
            <ModulePagination
              startRecord={(queuePage - 1) * queuePageSize + 1}
              endRecord={Math.min(
                queuePage * queuePageSize,
                filteredQueue.length,
              )}
              totalItems={filteredQueue.length}
              entityLabel="pending payments"
              pageSize={queuePageSize}
              currentPage={queuePage}
              totalPages={totalQueuePages}
              onPageChange={setQueuePage}
              showPageSizeSelector={false}
              testId="cashier-queue-pagination"
            />
          )}
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
                  className="cashier-action-tile opacity-60 cursor-not-allowed"
                  disabled
                  title="Receipt printing is not supported by the backend server."
                >
                  <Printer size={18} className="text-slate-400" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-slate-500">Print Receipt</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Not supported
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Paid & Closed Today Table */}
          <div className="cashier-card">
            <div className="cashier-card-header">
              <div>
                <h4 className="cashier-card-title text-sm">
                  Paid &amp; Closed Today ({paidAndClosed.length})
                </h4>
                <p className="cashier-card-subtitle text-xs">
                  Completed services with full payment today.
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

            <ModuleDataGridFrame naturalHeight>
              {paidAndClosed.length === 0 ? (
                <div className="bookings-table-empty-state py-8">
                  <CheckCircle2 size={32} className="text-slate-300" />
                  <p className="font-medium text-slate-600 mt-2 text-sm">
                    No paid bookings closed yet today
                  </p>
                  <p className="text-2xs text-slate-400 mt-0.5">
                    Orders settled in full will appear here.
                  </p>
                </div>
              ) : (
                <ModuleTable>
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>Time</th>
                      <th>Customer</th>
                      <th style={{ width: '90px' }}>Booking #</th>
                      <th style={{ width: '85px', textAlign: 'right' }}>
                        Amount
                      </th>
                      <th style={{ width: '75px', textAlign: 'center' }}>
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClosed.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="text-slate-500 whitespace-nowrap text-xs">
                          {order.serviceTime ?? '09:00 AM'}
                        </td>
                        <td>
                          <div className="font-semibold text-slate-900 text-xs">
                            {order.customerName}
                          </div>
                          <div className="text-2xs text-slate-500 truncate max-w-[140px]">
                            {order.serviceDescription}
                          </div>
                        </td>
                        <td className="font-mono text-slate-500 text-2xs">
                          {order.orderNumber}
                        </td>
                        <td className="font-bold text-slate-900 text-xs text-right">
                          ₱{order.totalAmount.toLocaleString()}
                        </td>
                        <td className="text-center">
                          <span className="badge-paid">Paid</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </ModuleTable>
              )}

              {paidAndClosed.length > closedPageSize && (
                <ModulePagination
                  startRecord={(closedPage - 1) * closedPageSize + 1}
                  endRecord={Math.min(
                    closedPage * closedPageSize,
                    paidAndClosed.length,
                  )}
                  totalItems={paidAndClosed.length}
                  entityLabel="paid bookings"
                  pageSize={closedPageSize}
                  currentPage={closedPage}
                  totalPages={totalClosedPages}
                  onPageChange={setClosedPage}
                  showPageSizeSelector={false}
                  testId="cashier-closed-pagination"
                />
              )}
            </ModuleDataGridFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
