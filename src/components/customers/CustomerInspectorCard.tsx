import React, { useState } from 'react';
import type {
  CustomerDetail,
  CustomerListItem,
  WaitlistFollowupItem,
} from '../../types/customers';

interface CustomerInspectorCardProps {
  selectedCustomer: CustomerListItem | null;
  selectedWaitlistItem: WaitlistFollowupItem | null;
  customerDetail: CustomerDetail | null;
  isLoadingDetail: boolean;
  detailError: string | null;
  onClose: () => void;
}

type CustomerInspectorTab = 'overview' | 'history';

function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '--:--';
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
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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

function renderBookingStatusBadge(status?: string | null) {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
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

export const CustomerInspectorCard: React.FC<CustomerInspectorCardProps> = ({
  selectedCustomer,
  selectedWaitlistItem,
  customerDetail,
  isLoadingDetail,
  detailError,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<CustomerInspectorTab>('overview');

  // 1. Empty state
  if (!selectedCustomer && !selectedWaitlistItem) {
    return (
      <div
        className="booking-inspector-card empty customers-inspector-card"
        role="region"
        aria-label="Customer Inspector"
      >
        <div className="inspector-empty-container">
          <div className="inspector-empty-icon-circle">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h4 className="inspector-empty-heading">No Customer Selected</h4>
          <p className="inspector-empty-text">
            Select a customer or follow-up request from the list to view their
            branch profile, booking history, and operational preferences.
          </p>
        </div>
      </div>
    );
  }

  // 2. Follow-up / Waitlist Inspector
  if (selectedWaitlistItem) {
    const initials = getInitials(selectedWaitlistItem.customerName);
    return (
      <div
        className="booking-inspector-card active customers-inspector-card"
        role="region"
        aria-label="Follow-up Details Inspector"
      >
        <div className="inspector-header">
          <div className="inspector-header-top-row">
            <div className="inspector-status-wrapper">
              <span className="booking-badge badge-checked-in">
                Follow-up Request
              </span>
              <span className="inspector-type-pill">
                {selectedWaitlistItem.status || 'Pending'}
              </span>
            </div>
            <button
              type="button"
              className="inspector-close-btn"
              onClick={onClose}
              aria-label="Close Inspector"
            >
              &times;
            </button>
          </div>

          <div className="inspector-customer-identity">
            <div className="inspector-avatar-circle" aria-hidden="true">
              {initials}
            </div>
            <div className="inspector-identity-details">
              <h3 className="inspector-customer-name">
                {selectedWaitlistItem.customerName}
              </h3>
              <div className="inspector-booking-id">
                Phone:{' '}
                <span className="id-code">
                  {selectedWaitlistItem.customerPhone || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="inspector-body">
          <div className="inspector-section">
            <h4 className="inspector-section-heading">REQUEST DETAILS</h4>
            <div className="inspector-info-grid">
              <div className="info-item">
                <span className="info-label">Service</span>
                <span className="info-value">
                  {selectedWaitlistItem.serviceName || '—'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Visit Type</span>
                <span className="info-value">
                  {selectedWaitlistItem.visitType || 'Standard'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Preferred Date</span>
                <span className="info-value">
                  {formatDateDisplay(selectedWaitlistItem.preferredDate)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Preferred Time</span>
                <span className="info-value">
                  {formatTime(selectedWaitlistItem.preferredTime)}
                </span>
              </div>
              {selectedWaitlistItem.notes && (
                <div className="info-item full-width">
                  <span className="info-label">Customer Request Notes</span>
                  <p className="inspector-note-text">
                    {selectedWaitlistItem.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Normal Customer Inspector
  const customer = selectedCustomer!;
  const initials = getInitials(customer.fullName);

  return (
    <div
      className="booking-inspector-card active customers-inspector-card"
      role="region"
      aria-label="Customer Details Inspector"
    >
      {/* 1. Header */}
      <div className="inspector-header">
        <div className="inspector-header-top-row">
          <div className="inspector-status-wrapper">
            <span className="booking-badge badge-confirmed">
              {customer.totalBookings > 1 ? 'Repeat Customer' : 'Customer'}
            </span>
            {customerDetail?.loyaltyTier && (
              <span className="inspector-type-pill loyalty-tier-pill">
                {customerDetail.loyaltyTier}
              </span>
            )}
          </div>
          <button
            type="button"
            className="inspector-close-btn"
            onClick={onClose}
            aria-label="Close Inspector"
          >
            &times;
          </button>
        </div>

        <div className="inspector-customer-identity">
          <div className="inspector-avatar-circle" aria-hidden="true">
            {initials}
          </div>
          <div className="inspector-identity-details">
            <h3 className="inspector-customer-name">{customer.fullName}</h3>
            <div className="inspector-booking-id">
              Phone: <span className="id-code">{customer.phone || '—'}</span>
            </div>
            {customer.email && (
              <div className="inspector-booking-id">
                Email: <span className="id-code">{customer.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="inspector-service-summary-bar">
          <div className="summary-service-title">
            {customer.totalBookings} Completed{' '}
            {customer.totalBookings === 1 ? 'Visit' : 'Visits'}
          </div>
          <div className="summary-resource-label">
            <span>Staff: {customer.preferredStaffName || 'None assigned'}</span>
          </div>
        </div>
      </div>

      {/* 2. Internal Tabs */}
      <div
        className="inspector-tabs-bar"
        role="tablist"
        aria-label="Customer Detail Sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`inspector-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={`inspector-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
          {customerDetail?.bookingHistory && (
            <span className="inspector-tab-count">
              {customerDetail.bookingHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className="inspector-body">
        {isLoadingDetail ? (
          <div className="inspector-loading-state" aria-live="polite">
            <div className="bookings-loading-spinner" />
            <span>Loading customer profile...</span>
          </div>
        ) : detailError ? (
          <div className="inspector-error-banner" role="alert">
            <p className="error-title">Unable to load details</p>
            <p className="error-message">{detailError}</p>
          </div>
        ) : activeTab === 'overview' ? (
          <div className="inspector-tab-content">
            {/* Preferences & Profile */}
            <div className="inspector-section">
              <h4 className="inspector-section-heading">OPERATIONAL PROFILE</h4>
              <div className="inspector-info-grid">
                <div className="info-item">
                  <span className="info-label">Preferred Visit Type</span>
                  <span className="info-value">
                    {customerDetail?.preferredVisitType || 'None specified'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Pressure Preference</span>
                  <span className="info-value">
                    {customerDetail?.pressurePreference || 'None specified'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">First Visit</span>
                  <span className="info-value">
                    {formatDateDisplay(customer.firstBookingDate)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Visit</span>
                  <span className="info-value">
                    {formatDateDisplay(customer.lastBookingDate)}
                  </span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Birthday</span>
                  <span className="info-value">
                    {formatDateDisplay(customerDetail?.birthday)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="inspector-section">
              <h4 className="inspector-section-heading">OPERATIONAL NOTES</h4>
              <p className="inspector-note-text">
                {customerDetail?.notes || 'No operational notes on file.'}
              </p>
            </div>

            {/* Health Notes */}
            <div className="inspector-section">
              <h4 className="inspector-section-heading">
                HEALTH CONSIDERATIONS
              </h4>
              <p className="inspector-note-text health-notes">
                {customerDetail?.healthNotes ||
                  'No health considerations noted.'}
              </p>
            </div>
          </div>
        ) : (
          /* History tab */
          <div className="inspector-tab-content">
            <div className="inspector-section">
              <h4 className="inspector-section-heading">
                BRANCH BOOKING HISTORY
              </h4>
              {!customerDetail?.bookingHistory ||
              customerDetail.bookingHistory.length === 0 ? (
                <p className="empty-history-text">
                  No previous bookings recorded for this customer at this
                  branch.
                </p>
              ) : (
                <div className="customer-history-list">
                  {customerDetail.bookingHistory.map((item) => (
                    <div key={item.id} className="history-item-card">
                      <div className="history-item-top">
                        <span className="history-date">
                          {formatDateDisplay(item.bookingDate)} at{' '}
                          {formatTime(item.startTime)}
                        </span>
                        {renderBookingStatusBadge(item.status)}
                      </div>
                      <div className="history-item-details">
                        <div className="history-service-name">
                          {item.serviceName || 'Spa Service'}
                        </div>
                        <div className="history-meta-row">
                          <span className="history-staff">
                            Staff: {item.staffName || 'Unassigned'}
                          </span>
                          <span className="history-type-badge">
                            {item.type || 'In-Spa'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
