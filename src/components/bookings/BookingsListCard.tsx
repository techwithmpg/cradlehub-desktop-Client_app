import React, { useMemo } from 'react';
import type {
  Booking,
  BookingFilters,
  BookingScopeTab,
  BookingStatus,
} from '../../types/bookings';

interface BookingsListCardProps {
  bookings: Booking[];
  selectedBookingId: string | null;
  onSelectBooking: (booking: Booking) => void;
  activeScope: BookingScopeTab;
  onScopeChange: (scope: BookingScopeTab) => void;
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
  onResetFilters: () => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  servicesList: Array<{ id: string; name: string }>;
  staffList: Array<{ id: string; full_name: string }>;
}

const SCOPE_TABS: Array<{ id: BookingScopeTab; label: string }> = [
  { id: 'all', label: 'All Bookings' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function formatTime(timeStr: string): string {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${ampm}`;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthName = months[parseInt(month, 10) - 1] || month;
  return `${monthName} ${parseInt(day, 10)}, ${year}`;
}

function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'CU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCurrency(amount: number | null | undefined): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'confirmed':
      return <span className="booking-badge badge-confirmed">Confirmed</span>;
    case 'checked_in':
    case 'in_progress':
      return <span className="booking-badge badge-checked-in">Checked In</span>;
    case 'completed':
      return <span className="booking-badge badge-completed">Completed</span>;
    case 'no_show':
      return <span className="booking-badge badge-no-show">No Show</span>;
    case 'cancelled':
      return <span className="booking-badge badge-cancelled">Cancelled</span>;
    case 'pending':
    case 'pending_payment':
    case 'pending_crm_confirmation':
    default:
      return <span className="booking-badge badge-pending">Pending</span>;
  }
}

function renderSourceBadge(type: string, deliveryType: string | null) {
  if (deliveryType === 'home_service' || type === 'home_service') {
    return (
      <span className="booking-source-badge source-home">Home Service</span>
    );
  }
  if (type === 'walkin' || type === 'in_house') {
    return <span className="booking-source-badge source-walkin">Walk-in</span>;
  }
  if (type === 'phone') {
    return <span className="booking-source-badge source-phone">Phone</span>;
  }
  if (type === 'online') {
    return <span className="booking-source-badge source-online">Online</span>;
  }
  return (
    <span className="booking-source-badge source-default">
      {type || 'Direct'}
    </span>
  );
}

export const BookingsListCard: React.FC<BookingsListCardProps> = ({
  bookings,
  selectedBookingId,
  onSelectBooking,
  activeScope,
  onScopeChange,
  filters,
  onFiltersChange,
  onResetFilters,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  servicesList,
  staffList,
}) => {
  // Pagination calculation
  const totalItems = bookings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedBookings = useMemo(() => {
    const startIdx = (validCurrentPage - 1) * pageSize;
    return bookings.slice(startIdx, startIdx + pageSize);
  }, [bookings, validCurrentPage, pageSize]);

  const startRecord =
    totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(validCurrentPage * pageSize, totalItems);

  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.status && filters.status !== 'all') ||
    filters.date ||
    (filters.serviceId && filters.serviceId !== 'all') ||
    (filters.staffId && filters.staffId !== 'all'),
  );

  return (
    <div
      className="bookings-list-card"
      role="region"
      aria-label="Bookings List"
    >
      {/* 1. Scope Tabs */}
      <div
        className="bookings-scope-tabs-container"
        role="tablist"
        aria-label="Booking Scopes"
      >
        {SCOPE_TABS.map((tab) => {
          const isActive = activeScope === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              className={`bookings-scope-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                onScopeChange(tab.id);
                onPageChange(1);
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. Filter Toolbar */}
      <div className="bookings-toolbar-container">
        <div className="bookings-search-wrapper">
          <svg
            className="bookings-search-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="bookings-search-input"
            placeholder="Search by customer, phone, service, therapist..."
            value={filters.search || ''}
            onChange={(e) => {
              onFiltersChange({ ...filters, search: e.target.value });
              onPageChange(1);
            }}
            aria-label="Search Bookings"
          />
          {filters.search && (
            <button
              type="button"
              className="bookings-search-clear-btn"
              onClick={() => {
                onFiltersChange({ ...filters, search: '' });
                onPageChange(1);
              }}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        <div className="bookings-filters-group">
          {/* Status Filter */}
          <select
            className="bookings-select-filter"
            value={filters.status || 'all'}
            onChange={(e) => {
              onFiltersChange({ ...filters, status: e.target.value });
              onPageChange(1);
            }}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="no_show">No Show</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            className="bookings-date-filter"
            value={filters.date || ''}
            onChange={(e) => {
              onFiltersChange({ ...filters, date: e.target.value });
              onPageChange(1);
            }}
            aria-label="Filter by date"
          />

          {/* Service Filter */}
          <select
            className="bookings-select-filter"
            value={filters.serviceId || 'all'}
            onChange={(e) => {
              onFiltersChange({ ...filters, serviceId: e.target.value });
              onPageChange(1);
            }}
            aria-label="Filter by service"
          >
            <option value="all">All Services</option>
            {servicesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Therapist Filter */}
          <select
            className="bookings-select-filter"
            value={filters.staffId || 'all'}
            onChange={(e) => {
              onFiltersChange({ ...filters, staffId: e.target.value });
              onPageChange(1);
            }}
            aria-label="Filter by therapist"
          >
            <option value="all">All Therapists</option>
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.full_name}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="bookings-reset-filters-btn"
              onClick={onResetFilters}
              aria-label="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. DataGrid / Table */}
      <div
        className="bookings-datagrid-wrapper"
        role="region"
        aria-label="Bookings DataGrid"
      >
        {paginatedBookings.length === 0 ? (
          <div className="bookings-table-empty-state">
            <div className="bookings-empty-icon-circle">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h4 className="bookings-empty-heading">No bookings found</h4>
            <p className="bookings-empty-text">
              {hasActiveFilters
                ? 'No bookings match your current filter criteria. Try clearing or adjusting filters.'
                : 'There are no bookings recorded in this scope for the active branch.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="bookings-empty-reset-btn"
                onClick={onResetFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className="bookings-table" aria-label="Bookings Table">
            <thead>
              <tr>
                <th scope="col" className="th-time">
                  Time
                </th>
                <th scope="col" className="th-customer">
                  Customer
                </th>
                <th scope="col" className="th-service">
                  Service / Summary
                </th>
                <th scope="col" className="th-status">
                  Status
                </th>
                <th scope="col" className="th-assignee">
                  Assignee
                </th>
                <th scope="col" className="th-source">
                  Source
                </th>
                <th scope="col" className="th-amount">
                  Amount
                </th>
                <th scope="col" className="th-actions">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.map((booking) => {
                const isSelected = booking.id === selectedBookingId;
                const customerInitials = getInitials(
                  booking.customer?.full_name,
                );
                const staffInitials = getInitials(booking.staff?.full_name);
                const resourceName =
                  booking.resource?.name ||
                  (booking.delivery_type === 'home_service'
                    ? 'Home Service'
                    : null);

                return (
                  <tr
                    key={booking.id}
                    className={`booking-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectBooking(booking)}
                    tabIndex={0}
                    role="row"
                    aria-selected={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectBooking(booking);
                      }
                    }}
                  >
                    {/* Time Column */}
                    <td className="td-time">
                      <div className="time-primary">
                        {formatTime(booking.start_time)}
                      </div>
                      <div className="time-secondary">
                        {formatDateDisplay(booking.booking_date)}
                      </div>
                    </td>

                    {/* Customer Column */}
                    <td className="td-customer">
                      <div className="customer-cell">
                        <div
                          className="customer-avatar-pill"
                          aria-hidden="true"
                        >
                          {customerInitials}
                        </div>
                        <div className="customer-info">
                          <div className="customer-name">
                            {booking.customer?.full_name || 'Guest Customer'}
                          </div>
                          <div className="customer-subtext">
                            {booking.customer?.phone ||
                              booking.customer?.email ||
                              `#${booking.id.substring(0, 8)}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Service / Summary Column */}
                    <td className="td-service">
                      <div className="service-cell">
                        <div className="service-name-row">
                          <span className="service-name">
                            {booking.service?.name || 'Standard Spa Service'}
                          </span>
                          {booking.service?.duration_minutes && (
                            <span className="service-duration-badge">
                              {booking.service.duration_minutes}m
                            </span>
                          )}
                        </div>
                        {resourceName && (
                          <div className="service-resource-tag">
                            <svg
                              viewBox="0 0 24 24"
                              width="11"
                              height="11"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            </svg>
                            <span>{resourceName}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="td-status">
                      {renderStatusBadge(booking.status)}
                    </td>

                    {/* Assignee Column */}
                    <td className="td-assignee">
                      <div className="staff-cell">
                        <div className="staff-avatar-circle" aria-hidden="true">
                          {staffInitials}
                        </div>
                        <div className="staff-info">
                          <div className="staff-name">
                            {booking.staff?.nickname ||
                              booking.staff?.full_name ||
                              'Unassigned'}
                          </div>
                          {booking.staff?.tier && (
                            <div className="staff-tier-label">
                              {booking.staff.tier}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Source Column */}
                    <td className="td-source">
                      {renderSourceBadge(booking.type, booking.delivery_type)}
                    </td>

                    {/* Amount Column */}
                    <td className="td-amount">
                      <div className="amount-primary">
                        {formatCurrency(booking.amount_paid)}
                      </div>
                      <div
                        className={`amount-status status-${booking.payment_status || 'pending'}`}
                      >
                        {booking.payment_status === 'paid'
                          ? 'Paid'
                          : 'Pay on site'}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="td-actions">
                      <button
                        type="button"
                        className={`action-inspect-btn ${isSelected ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBooking(booking);
                        }}
                        aria-label={`Inspect booking ${booking.id}`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Pagination Footer */}
      <div className="bookings-table-footer">
        <div className="footer-count-text">
          Showing <span className="count-highlight">{startRecord}</span>–
          <span className="count-highlight">{endRecord}</span> of{' '}
          <span className="count-highlight">{totalItems}</span> bookings
        </div>

        <div className="footer-pagination-controls">
          <div className="page-size-selector-wrapper">
            <span className="page-size-label">Rows per page:</span>
            <select
              className="page-size-select"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="pagination-buttons">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => onPageChange(Math.max(1, validCurrentPage - 1))}
              disabled={validCurrentPage <= 1}
              aria-label="Previous Page"
            >
              &larr; Prev
            </button>

            <span className="pagination-page-indicator">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="pagination-btn"
              onClick={() =>
                onPageChange(Math.min(totalPages, validCurrentPage + 1))
              }
              disabled={validCurrentPage >= totalPages}
              aria-label="Next Page"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
