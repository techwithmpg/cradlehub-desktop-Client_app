import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import type {
  DesktopTodayAttendance,
  DesktopTodayNotifications,
} from '../../types/today';
import type { NavModuleId } from '../../types/auth';

interface TodayActivityCardProps {
  attendance: DesktopTodayAttendance;
  notifications: DesktopTodayNotifications;
  onNavigate?: (module: NavModuleId) => void;
}

function formatClock(value: string | null | undefined): string {
  if (!value) return '—';
  // Check if it's an ISO timestamp or HH:MM(:SS)
  if (value.includes('T')) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }
  const [hoursStr, minutesStr] = value.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export const TodayActivityCard: React.FC<TodayActivityCardProps> = ({
  attendance,
  notifications,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'scans' | 'activity'>('scans');

  return (
    <div
      className="today-right-card today-activity-card"
      data-testid="today-activity-card"
    >
      {/* Card Header */}
      <div className="today-right-card-header">
        <h3 className="today-right-card-title">Activity</h3>
        <span
          className="today-snapshot-pill"
          data-testid="today-activity-snapshot-badge"
          title="Snapshot data as of last refresh"
        >
          <span className="today-snapshot-dot" aria-hidden="true" />
          Snapshot
        </span>
      </div>

      {/* Tabs */}
      <div
        className="today-activity-tabs"
        role="tablist"
        aria-label="Activity views"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'scans'}
          className={`today-activity-tab ${activeTab === 'scans' ? 'active' : ''}`}
          onClick={() => setActiveTab('scans')}
          data-testid="tab-recent-scans"
        >
          Recent Scans
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'activity'}
          className={`today-activity-tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
          data-testid="tab-recent-activity"
        >
          Recent Activity
        </button>
      </div>

      {/* Tab Body */}
      <div className="today-activity-body">
        {activeTab === 'scans' ? (
          <>
            {!attendance.available ? (
              <div
                className="today-activity-degraded"
                data-testid="attendance-degraded"
              >
                <AlertTriangle size={15} aria-hidden="true" />
                <span>
                  {attendance.error ||
                    'Recent attendance scans are unavailable.'}
                </span>
              </div>
            ) : attendance.items.length === 0 ? (
              <div
                className="today-activity-empty"
                data-testid="attendance-empty"
              >
                <Clock3 size={20} aria-hidden="true" />
                <span>No recent attendance scans.</span>
              </div>
            ) : (
              <div
                className="today-scans-list"
                data-testid="today-recent-scans-list"
              >
                {attendance.items.slice(0, 8).map((scan) => {
                  const initials =
                    scan.staffName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join('') || 'ST';

                  return (
                    <div
                      key={scan.eventId}
                      className="today-scan-row"
                      data-testid={`scan-row-${scan.eventId}`}
                    >
                      <span className="today-scan-time">
                        {formatClock(scan.occurredAt)}
                      </span>
                      <span className="today-avatar-sm" aria-hidden="true">
                        {initials}
                      </span>
                      <div className="today-scan-meta">
                        <strong className="today-scan-name">
                          {scan.staffName}
                        </strong>
                        <span className="today-scan-desc">
                          {scan.eventType.replace(/_/g, ' ')}
                          {scan.sourceLabel ? ` • ${scan.sourceLabel}` : ''}
                        </span>
                      </div>
                      <span className="today-scan-status-pill">
                        <span
                          className="today-status-dot-green"
                          aria-hidden="true"
                        />
                        {scan.outcome || 'Success'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer action */}
            <div className="today-activity-footer">
              <button
                type="button"
                className="today-activity-footer-btn"
                onClick={() => onNavigate?.('attendance')}
                data-testid="activity-view-attendance-btn"
              >
                <span>View Attendance</span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <>
            {!notifications.available ? (
              <div
                className="today-activity-degraded"
                data-testid="notifications-degraded"
              >
                <AlertCircle size={15} aria-hidden="true" />
                <span>
                  {notifications.error || 'Notification service timed out'}
                </span>
              </div>
            ) : notifications.items.length === 0 ? (
              <div
                className="today-activity-empty"
                data-testid="notifications-empty"
              >
                <CheckCircle2 size={20} aria-hidden="true" />
                <span>No action-required notifications.</span>
                <p className="today-activity-subtext">
                  Recent activity history is not available in the Desktop Today
                  contract yet.
                </p>
              </div>
            ) : (
              <div
                className="today-notifications-list"
                data-testid="notifications-list"
              >
                {notifications.items.map((notif) => (
                  <div
                    key={notif.id}
                    className="today-notif-row"
                    data-testid={`notification-item-${notif.id}`}
                  >
                    <div className="today-notif-header">
                      <strong className="today-notif-title">
                        {notif.title}
                      </strong>
                      <span
                        className={`today-notif-priority ${notif.priority}`}
                      >
                        {notif.priority}
                      </span>
                    </div>
                    {notif.body && (
                      <p className="today-notif-body">{notif.body}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
