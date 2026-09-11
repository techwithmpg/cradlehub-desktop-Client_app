import React from 'react';
import {
  CalendarRange,
  ChevronRight,
  Truck,
  UserCheck,
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

      <div className="today-quick-actions-list">
        <button
          type="button"
          className="today-quick-action-item"
          onClick={() => onNavigate?.('customers')}
          data-testid="quick-action-customers"
        >
          <div className="today-quick-action-icon-box">
            <Users size={16} aria-hidden="true" />
          </div>
          <div className="today-quick-action-text">
            <strong className="today-quick-action-label">View Customers</strong>
            <span className="today-quick-action-desc">
              Customer records & follow-up
            </span>
          </div>
          <ChevronRight
            size={14}
            className="today-quick-action-chevron"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="today-quick-action-item"
          onClick={() => onNavigate?.('schedule')}
          data-testid="quick-action-schedule"
        >
          <div className="today-quick-action-icon-box">
            <CalendarRange size={16} aria-hidden="true" />
          </div>
          <div className="today-quick-action-text">
            <strong className="today-quick-action-label">Check Schedule</strong>
            <span className="today-quick-action-desc">
              Review staff and rooms
            </span>
          </div>
          <ChevronRight
            size={14}
            className="today-quick-action-chevron"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="today-quick-action-item"
          onClick={() => onNavigate?.('attendance')}
          data-testid="quick-action-attendance"
        >
          <div className="today-quick-action-icon-box">
            <UserCheck size={16} aria-hidden="true" />
          </div>
          <div className="today-quick-action-text">
            <strong className="today-quick-action-label">
              View Attendance
            </strong>
            <span className="today-quick-action-desc">
              Staff presence & scan review
            </span>
          </div>
          <ChevronRight
            size={14}
            className="today-quick-action-chevron"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="today-quick-action-item"
          onClick={() => onNavigate?.('home-service')}
          data-testid="quick-action-home-service"
        >
          <div className="today-quick-action-icon-box">
            <Truck size={16} aria-hidden="true" />
          </div>
          <div className="today-quick-action-text">
            <strong className="today-quick-action-label">Home Service</strong>
            <span className="today-quick-action-desc">
              Open dispatch workspace
            </span>
          </div>
          <ChevronRight
            size={14}
            className="today-quick-action-chevron"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
};
