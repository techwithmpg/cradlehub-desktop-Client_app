import React from 'react';
import {
  CalendarDays,
  CalendarRange,
  CreditCard,
  Fingerprint,
  Truck,
  Users,
} from 'lucide-react';
import type { NavModuleId } from '../../types/auth';

interface TodayQuickActionsCardProps {
  onNavigate?: (module: NavModuleId) => void;
}

export const TodayQuickActionsCard: React.FC<TodayQuickActionsCardProps> = ({
  onNavigate,
}) => {
  return (
    <div
      className="today-right-card today-quick-actions-card"
      data-testid="today-quick-actions-card"
    >
      <div className="today-right-card-header">
        <h3 className="today-right-card-title">Quick Actions</h3>
      </div>

      <div className="today-quick-actions-grid">
        {/* 1. View Bookings */}
        <button
          type="button"
          className="today-qa-tile"
          onClick={() => onNavigate?.('bookings')}
          data-testid="quick-action-bookings"
        >
          <div className="today-qa-icon-box bg-blue-50 text-blue-600">
            <CalendarDays size={18} aria-hidden="true" />
          </div>
          <div className="today-qa-text">
            <strong className="today-qa-label">View Bookings</strong>
            <span className="today-qa-desc">Search and manage</span>
          </div>
        </button>

        {/* 2. View Customers */}
        <button
          type="button"
          className="today-qa-tile"
          onClick={() => onNavigate?.('customers')}
          data-testid="quick-action-customers"
        >
          <div className="today-qa-icon-box bg-amber-50 text-amber-600">
            <Users size={18} aria-hidden="true" />
          </div>
          <div className="today-qa-text">
            <strong className="today-qa-label">View Customers</strong>
            <span className="today-qa-desc">Customer records</span>
          </div>
        </button>

        {/* 3. Check Schedule */}
        <button
          type="button"
          className="today-qa-tile"
          onClick={() => onNavigate?.('schedule')}
          data-testid="quick-action-schedule"
        >
          <div className="today-qa-icon-box bg-emerald-50 text-emerald-600">
            <CalendarRange size={18} aria-hidden="true" />
          </div>
          <div className="today-qa-text">
            <strong className="today-qa-label">Check Schedule</strong>
            <span className="today-qa-desc">Staff and rooms</span>
          </div>
        </button>

        {/* 4. View Attendance */}
        <button
          type="button"
          className="today-qa-tile"
          onClick={() => onNavigate?.('attendance')}
          data-testid="quick-action-attendance"
        >
          <div className="today-qa-icon-box bg-teal-50 text-teal-600">
            <Fingerprint size={18} aria-hidden="true" />
          </div>
          <div className="today-qa-text">
            <strong className="today-qa-label">View Attendance</strong>
            <span className="today-qa-desc">Staff presence</span>
          </div>
        </button>

        {/* 5. Open Cashier */}
        <button
          type="button"
          className="today-qa-tile"
          onClick={() => onNavigate?.('cashier')}
          data-testid="quick-action-cashier"
        >
          <div className="today-qa-icon-box bg-orange-50 text-orange-600">
            <CreditCard size={18} aria-hidden="true" />
          </div>
          <div className="today-qa-text">
            <strong className="today-qa-label">Open Cashier</strong>
            <span className="today-qa-desc">Payments and expenses</span>
          </div>
        </button>

        {/* 6. Home Service */}
        <button
          type="button"
          className="today-qa-tile"
          onClick={() => onNavigate?.('home-service')}
          data-testid="quick-action-home-service"
        >
          <div className="today-qa-icon-box bg-blue-50 text-blue-600">
            <Truck size={18} aria-hidden="true" />
          </div>
          <div className="today-qa-text">
            <strong className="today-qa-label">Home Service</strong>
            <span className="today-qa-desc">Dispatch workspace</span>
          </div>
        </button>
      </div>
    </div>
  );
};
