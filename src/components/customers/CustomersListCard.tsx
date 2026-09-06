import React from 'react';
import type {
  CustomerListItem,
  CustomerPagination,
  CustomerTabType,
  WaitlistFollowupItem,
} from '../../types/customers';

interface CustomersListCardProps {
  activeTab: CustomerTabType;
  onTabChange: (tab: CustomerTabType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetSearch: () => void;
  customers: CustomerListItem[];
  waitlistItems: WaitlistFollowupItem[];
  selectedId: string | null;
  onSelectCustomer: (customer: CustomerListItem) => void;
  onSelectWaitlistItem: (item: WaitlistFollowupItem) => void;
  pagination: CustomerPagination;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading: boolean;
}

const CUSTOMER_TABS: Array<{ id: CustomerTabType; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'repeat', label: 'Repeat' },
  { id: 'lapsed', label: 'Lapsed' },
  { id: 'followup', label: 'Follow-up' },
];

function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '—';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${ampm}`;
}

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '—';
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

function renderWaitlistStatusBadge(status?: string | null) {
  const normalized = (status || 'pending').toLowerCase();
  switch (normalized) {
    case 'accepted':
    case 'confirmed':
      return <span className="booking-badge badge-confirmed">Accepted</span>;
    case 'contacted':
      return <span className="booking-badge badge-checked-in">Contacted</span>;
    case 'cancelled':
    case 'rejected':
      return <span className="booking-badge badge-cancelled">Cancelled</span>;
    case 'pending':
    default:
      return <span className="booking-badge badge-pending">Pending</span>;
  }
}

export const CustomersListCard: React.FC<CustomersListCardProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onResetSearch,
  customers,
  waitlistItems,
  selectedId,
  onSelectCustomer,
  onSelectWaitlistItem,
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading,
}) => {
  const isFollowupTab = activeTab === 'followup';
  const totalItems = pagination.totalCount;
  const pageSize = pagination.pageSize;
  const currentPage = pagination.page;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className="bookings-list-card customers-list-card"
      role="region"
      aria-label="Customers List"
    >
      {/* 1. Tabs */}
      <div
        className="bookings-scope-tabs-container"
        role="tablist"
        aria-label="Customer Segments"
      >
        {CUSTOMER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              className={`bookings-scope-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. Toolbar */}
      <div className="bookings-toolbar-container customers-toolbar-container">
        <div className="bookings-search-wrapper">
          <svg
            className="bookings-search-icon"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="customers-search-input"
            type="text"
            className="bookings-search-input"
            placeholder={
              isFollowupTab
                ? 'Search follow-up waitlist by name, phone, or service...'
                : 'Search customers by name, phone, or email...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={
              isFollowupTab ? 'Search follow-up waitlist' : 'Search customers'
            }
          />
          {searchQuery && (
            <button
              type="button"
              className="bookings-search-clear-btn"
              onClick={onResetSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        {searchQuery.trim() !== '' && (
          <button
            type="button"
            className="bookings-reset-filters-btn"
            onClick={onResetSearch}
            title="Reset search"
          >
            Reset Search
          </button>
        )}
      </div>

      {/* 3. Data Table */}
      <div className="bookings-table-container">
        {isLoading ? (
          <div className="bookings-loading-state" aria-live="polite">
            <div className="bookings-loading-spinner" />
            <span>
              Loading {isFollowupTab ? 'follow-up requests' : 'customers'}...
            </span>
          </div>
        ) : isFollowupTab ? (
          /* Follow-up waitlist table */
          waitlistItems.length === 0 ? (
            <div className="bookings-empty-state" role="status">
              <p className="empty-state-title">
                {searchQuery
                  ? 'No matching follow-up requests.'
                  : 'No follow-up requests.'}
              </p>
              <p className="empty-state-subtext">
                {searchQuery
                  ? 'Try modifying your search keywords.'
                  : 'Waitlist entries for this branch will appear here.'}
              </p>
            </div>
          ) : (
            <table className="bookings-table" role="grid">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '22%' }}>
                    Customer
                  </th>
                  <th scope="col" style={{ width: '16%' }}>
                    Phone
                  </th>
                  <th scope="col" style={{ width: '18%' }}>
                    Service
                  </th>
                  <th scope="col" style={{ width: '14%' }}>
                    Preferred Date
                  </th>
                  <th scope="col" style={{ width: '12%' }}>
                    Time
                  </th>
                  <th scope="col" style={{ width: '10%' }}>
                    Type
                  </th>
                  <th scope="col" style={{ width: '8%' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {waitlistItems.map((item) => {
                  const isSelected = selectedId === item.id;
                  const initials = getInitials(item.customerName);
                  return (
                    <tr
                      key={item.id}
                      className={`booking-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => onSelectWaitlistItem(item)}
                      role="row"
                      aria-selected={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectWaitlistItem(item);
                        }
                      }}
                    >
                      <td>
                        <div className="customer-cell">
                          <span className="customer-avatar" aria-hidden="true">
                            {initials}
                          </span>
                          <span className="customer-name">
                            {item.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="cell-muted">
                        {item.customerPhone || '—'}
                      </td>
                      <td className="cell-strong">{item.serviceName || '—'}</td>
                      <td>{formatDateDisplay(item.preferredDate)}</td>
                      <td>{formatTime(item.preferredTime)}</td>
                      <td>
                        <span className="booking-source-badge source-default">
                          {item.visitType || 'Standard'}
                        </span>
                      </td>
                      <td>{renderWaitlistStatusBadge(item.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : /* Normal Customer table (all / repeat / lapsed) */
        customers.length === 0 ? (
          <div className="bookings-empty-state" role="status">
            <p className="empty-state-title">
              {searchQuery
                ? 'No matching customers found.'
                : 'No customers in this segment.'}
            </p>
            <p className="empty-state-subtext">
              {searchQuery
                ? 'Try modifying your search keywords.'
                : 'Customer records for this branch will appear here.'}
            </p>
          </div>
        ) : (
          <table className="bookings-table" role="grid">
            <thead>
              <tr>
                <th scope="col" style={{ width: '28%' }}>
                  Customer
                </th>
                <th scope="col" style={{ width: '16%' }}>
                  Phone
                </th>
                <th scope="col" style={{ width: '20%' }}>
                  Email
                </th>
                <th scope="col" style={{ width: '10%' }}>
                  Visits
                </th>
                <th scope="col" style={{ width: '13%' }}>
                  Last Visit
                </th>
                <th scope="col" style={{ width: '13%' }}>
                  Preferred Staff
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const isSelected = selectedId === c.id;
                const initials = getInitials(c.fullName);
                return (
                  <tr
                    key={c.id}
                    className={`booking-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectCustomer(c)}
                    role="row"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectCustomer(c);
                      }
                    }}
                  >
                    <td>
                      <div className="customer-cell">
                        <span className="customer-avatar" aria-hidden="true">
                          {initials}
                        </span>
                        <span className="customer-name">{c.fullName}</span>
                      </div>
                    </td>
                    <td className="cell-muted">{c.phone || '—'}</td>
                    <td className="cell-muted">{c.email || '—'}</td>
                    <td>
                      <span className="visits-count-pill">
                        {c.totalBookings}{' '}
                        {c.totalBookings === 1 ? 'visit' : 'visits'}
                      </span>
                    </td>
                    <td>{formatDateDisplay(c.lastBookingDate)}</td>
                    <td className="cell-muted">
                      {c.preferredStaffName || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Pagination */}
      <div className="bookings-pagination-container">
        <div className="pagination-info">
          Showing {startRecord} to {endRecord} of {totalItems}{' '}
          {isFollowupTab ? 'requests' : 'customers'}
        </div>

        <div className="pagination-controls">
          <div className="page-size-selector">
            <label htmlFor="customer-page-size" className="page-size-label">
              Rows per page:
            </label>
            <select
              id="customer-page-size"
              className="page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="page-nav-buttons">
            <button
              type="button"
              className="page-nav-btn"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Previous Page"
            >
              &lsaquo; Prev
            </button>
            <span className="page-current-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="page-nav-btn"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Next Page"
            >
              Next &rsaquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
