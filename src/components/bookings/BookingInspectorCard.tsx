import React, { useState } from 'react';
import type {
  Booking,
  BookingStatus,
  InspectorTab,
} from '../../types/bookings';

interface BookingInspectorCardProps {
  booking: Booking | null;
  onClose: () => void;
}

const INSPECTOR_TABS: Array<{
  id: InspectorTab;
  label: string;
  badge?: string;
}> = [
  { id: 'overview', label: 'Overview' },
  { id: 'customer', label: 'Customer' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'payments', label: 'Payments', badge: 'Read-only' },
  { id: 'notes', label: 'Notes' },
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

export const BookingInspectorCard: React.FC<BookingInspectorCardProps> = ({
  booking,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('overview');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!booking) {
    return (
      <div
        className="booking-inspector-card empty"
        role="region"
        aria-label="Booking Inspector"
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h4 className="inspector-empty-heading">No Booking Selected</h4>
          <p className="inspector-empty-text">
            Select a booking from the list to view its complete operational
            overview, customer profile, and lifecycle details.
          </p>
        </div>
      </div>
    );
  }

  const customerInitials = getInitials(booking.customer?.full_name);
  const resourceName =
    booking.resource?.name ||
    (booking.delivery_type === 'home_service'
      ? 'Home Service Dispatch'
      : 'Room unassigned');

  return (
    <div
      className="booking-inspector-card active"
      role="region"
      aria-label="Booking Details Inspector"
    >
      {/* 1. Header */}
      <div className="inspector-header">
        <div className="inspector-header-top-row">
          <div className="inspector-status-wrapper">
            {renderStatusBadge(booking.status)}
            <span className="inspector-type-pill">
              {booking.type || 'Standard'}
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
            {customerInitials}
          </div>
          <div className="inspector-identity-details">
            <h3 className="inspector-customer-name">
              {booking.customer?.full_name || 'Guest Customer'}
            </h3>
            <div className="inspector-booking-id">
              Ref:{' '}
              <span className="id-code">{booking.id.substring(0, 13)}...</span>
            </div>
          </div>
        </div>

        <div className="inspector-service-summary-bar">
          <div className="summary-service-title">
            {booking.service?.name || 'Spa Service'}
          </div>
          <div className="summary-resource-label">
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
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
        </div>
      </div>

      {/* 2. Inspector Tabs */}
      <div
        className="inspector-tabs-nav"
        role="tablist"
        aria-label="Inspector Panels"
      >
        {INSPECTOR_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              className={`inspector-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.badge && <span className="tab-pill-badge">{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Body */}
      <div className="inspector-body-scrollable">
        {activeTab === 'overview' && (
          <div className="inspector-tab-pane overview-pane">
            {/* Details Section */}
            <div className="inspector-section">
              <h4 className="inspector-section-heading">Session Details</h4>
              <div className="inspector-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">
                    {formatDateDisplay(booking.booking_date)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Schedule Time</span>
                  <span className="detail-value">
                    {formatTime(booking.start_time)} –{' '}
                    {formatTime(booking.end_time)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service</span>
                  <span className="detail-value font-medium">
                    {booking.service?.name || 'Standard Service'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">
                    {booking.service?.duration_minutes
                      ? `${booking.service.duration_minutes} minutes`
                      : '60 minutes'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assigned Room</span>
                  <span className="detail-value">{resourceName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assigned Therapist</span>
                  <span className="detail-value font-medium">
                    {booking.staff?.full_name || 'Unassigned'}
                    {booking.staff?.tier && (
                      <span className="tier-tag">({booking.staff.tier})</span>
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Channel / Delivery</span>
                  <span className="detail-value capitalize">
                    {booking.delivery_type === 'home_service'
                      ? 'Home Service'
                      : 'In-Spa Walk-in'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Booking Amount</span>
                  <span className="detail-value amount-text">
                    {formatCurrency(booking.amount_paid)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="inspector-section">
              <h4 className="inspector-section-heading">
                Quick Operational Actions
              </h4>
              <div className="inspector-quick-actions-row">
                <button
                  type="button"
                  className="quick-action-btn primary"
                  onClick={() =>
                    setActionNotice(
                      'Reschedule workflow is authenticated and will be available in the authorized mutations pass.',
                    )
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <polyline points="23 20 23 14 17 14" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                  </svg>
                  <span>Reschedule</span>
                </button>

                <button
                  type="button"
                  className="quick-action-btn danger"
                  onClick={() =>
                    setActionNotice(
                      'Cancel Booking workflow requires manager/CRM authorization.',
                    )
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>Cancel</span>
                </button>

                <button
                  type="button"
                  className="quick-action-btn disabled"
                  disabled
                  title="Payment mutations are out of Stage 02 scope"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span>Add Payment</span>
                  <span className="dormant-tag">Dormant</span>
                </button>
              </div>

              {actionNotice && (
                <div className="inspector-action-notice" role="alert">
                  <span>{actionNotice}</span>
                  <button type="button" onClick={() => setActionNotice(null)}>
                    &times;
                  </button>
                </div>
              )}
            </div>

            {/* Customer Snapshot */}
            <div className="inspector-section">
              <h4 className="inspector-section-heading">
                Customer Profile Snapshot
              </h4>
              <div className="inspector-customer-card">
                <div className="customer-card-header">
                  <div className="customer-card-avatar">{customerInitials}</div>
                  <div className="customer-card-titles">
                    <div className="customer-card-name">
                      {booking.customer?.full_name || 'Guest'}
                    </div>
                    <div className="customer-card-loyalty">
                      Tier:{' '}
                      <span className="loyalty-badge">
                        {booking.customer?.loyalty_tier || 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="customer-card-body">
                  <div className="customer-info-row">
                    <span className="label">Phone:</span>
                    <span className="value">
                      {booking.customer?.phone || 'None provided'}
                    </span>
                  </div>
                  <div className="customer-info-row">
                    <span className="label">Email:</span>
                    <span className="value">
                      {booking.customer?.email || 'None provided'}
                    </span>
                  </div>
                  <div className="customer-info-row">
                    <span className="label">Total Visits:</span>
                    <span className="value font-medium">
                      {booking.customer?.total_bookings || 1}
                    </span>
                  </div>
                  {booking.customer?.first_booking_date && (
                    <div className="customer-info-row">
                      <span className="label">Member Since:</span>
                      <span className="value">
                        {booking.customer.first_booking_date}
                      </span>
                    </div>
                  )}
                  {booking.customer?.health_notes && (
                    <div className="customer-notes-block">
                      <span className="label">Health Notes:</span>
                      <p className="note-text">
                        {booking.customer.health_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="inspector-tab-pane customer-pane">
            <div className="inspector-section">
              <h4 className="inspector-section-heading">Customer Record</h4>
              <div className="customer-details-list">
                <div className="customer-info-row">
                  <span className="label">Full Name:</span>
                  <span className="value font-medium">
                    {booking.customer?.full_name || 'Guest'}
                  </span>
                </div>
                <div className="customer-info-row">
                  <span className="label">Contact Phone:</span>
                  <span className="value">
                    {booking.customer?.phone || 'N/A'}
                  </span>
                </div>
                <div className="customer-info-row">
                  <span className="label">Email Address:</span>
                  <span className="value">
                    {booking.customer?.email || 'N/A'}
                  </span>
                </div>
                <div className="customer-info-row">
                  <span className="label">Loyalty Classification:</span>
                  <span className="value">
                    {booking.customer?.loyalty_tier || 'standard'}
                  </span>
                </div>
                <div className="customer-info-row">
                  <span className="label">Historical Bookings:</span>
                  <span className="value">
                    {booking.customer?.total_bookings || 1}
                  </span>
                </div>
                <div className="customer-info-row">
                  <span className="label">First Recorded Visit:</span>
                  <span className="value">
                    {booking.customer?.first_booking_date || 'N/A'}
                  </span>
                </div>
                <div className="customer-info-row">
                  <span className="label">Last Recorded Visit:</span>
                  <span className="value">
                    {booking.customer?.last_booking_date || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="inspector-tab-pane timeline-pane">
            <div className="inspector-section">
              <h4 className="inspector-section-heading">Lifecycle Events</h4>
              <div className="inspector-timeline-list">
                <div className="timeline-item">
                  <div className="timeline-marker complete" />
                  <div className="timeline-content">
                    <div className="timeline-title">Booking Created</div>
                    <div className="timeline-time">
                      {new Date(booking.created_at).toLocaleString()}
                    </div>
                    <div className="timeline-detail">
                      Channel: {booking.type}
                    </div>
                  </div>
                </div>
                <div className="timeline-item">
                  <div
                    className={`timeline-marker ${booking.status !== 'pending' ? 'complete' : 'current'}`}
                  />
                  <div className="timeline-content">
                    <div className="timeline-title">
                      Status: {booking.status}
                    </div>
                    <div className="timeline-time">
                      Last updated:{' '}
                      {new Date(booking.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="inspector-tab-pane payments-pane">
            <div className="dormant-boundary-banner" role="note">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <strong>Dormant Scope Notice</strong>
                <p>
                  Payments mutation functionality is disabled in Stage 02.
                  Authoritative booking payment records are displayed below for
                  read-only tracking.
                </p>
              </div>
            </div>

            <div className="inspector-section">
              <h4 className="inspector-section-heading">Payment Metadata</h4>
              <div className="inspector-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Payment Status</span>
                  <span className="detail-value capitalize">
                    {booking.payment_status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Payment Method</span>
                  <span className="detail-value capitalize">
                    {booking.payment_method?.replace(/_/g, ' ') ||
                      'Pay on site'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Amount Recorded</span>
                  <span className="detail-value amount-text">
                    {formatCurrency(booking.amount_paid)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Reference ID</span>
                  <span className="detail-value">
                    {booking.payment_reference || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="inspector-tab-pane notes-pane">
            <div className="inspector-section">
              <h4 className="inspector-section-heading">
                Customer & Internal Notes
              </h4>
              <div className="notes-display-box">
                <span className="label">Customer Profile Notes:</span>
                <p className="notes-text">
                  {booking.customer?.notes ||
                    'No customer profile notes recorded.'}
                </p>
              </div>
              <div className="notes-display-box" style={{ marginTop: '12px' }}>
                <span className="label">Special Instructions:</span>
                <p className="notes-text">
                  {booking.customer?.health_notes ||
                    'No health considerations or special preferences recorded.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {actionNotice && (
        <div
          className="bookings-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspector-action-notice-title"
        >
          <div className="bookings-modal-content">
            <div className="bookings-modal-header">
              <h3 id="inspector-action-notice-title">Booking Action Notice</h3>
              <button
                type="button"
                className="bookings-modal-close-btn"
                onClick={() => setActionNotice(null)}
                aria-label="Close Notice"
              >
                &times;
              </button>
            </div>
            <div className="bookings-modal-body">
              <p>{actionNotice}</p>
            </div>
            <div className="bookings-modal-footer">
              <button
                type="button"
                className="bookings-modal-primary-btn"
                onClick={() => setActionNotice(null)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
