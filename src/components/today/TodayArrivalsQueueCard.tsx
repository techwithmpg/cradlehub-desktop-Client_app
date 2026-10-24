import React from 'react';
import { ChevronRight, Play, UserCheck } from 'lucide-react';
import type {
  DesktopTodayQueueItem,
  TodayMutationAction,
} from '../../types/today';

interface TodayArrivalsQueueCardProps {
  queue: DesktopTodayQueueItem[];
  onSelectBooking: (bookingId: string) => void;
  onViewAll: () => void;
  onMutateAction?: (action: TodayMutationAction, bookingId: string) => void;
  mutatingBookingId?: string | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatClock(value: string | null | undefined): string {
  if (!value) return '—';
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

export const TodayArrivalsQueueCard: React.FC<TodayArrivalsQueueCardProps> = ({
  queue,
  onSelectBooking,
  onViewAll,
  onMutateAction,
  mutatingBookingId,
}) => {
  // Filter for waiting / arrived / checked-in guests
  const arrivalsQueue = queue.filter(
    (item) =>
      item.stage === 'waiting' ||
      item.status === 'confirmed' ||
      item.bookingProgressStatus === 'checked_in' ||
      item.status === 'arrived',
  );

  return (
    <div
      className="today-right-card today-arrivals-queue-card"
      data-testid="today-arrivals-queue-card"
    >
      {/* Header */}
      <div className="today-right-card-header">
        <h3 className="today-right-card-title">
          Arrivals & Waiting Queue ({arrivalsQueue.length})
        </h3>
        <button
          type="button"
          className="today-card-view-all"
          onClick={onViewAll}
          data-testid="arrivals-queue-view-all"
        >
          <span>View All</span>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Queue Items */}
      <div className="today-arrivals-list">
        {arrivalsQueue.length === 0 ? (
          <div className="today-arrivals-empty">
            <UserCheck
              size={20}
              className="text-slate-400"
              aria-hidden="true"
            />
            <p>No guests currently waiting or arriving.</p>
          </div>
        ) : (
          arrivalsQueue.slice(0, 3).map((item) => {
            const initials = getInitials(item.customerName);
            const isMutating = mutatingBookingId === item.id;
            const isCheckedIn = item.bookingProgressStatus === 'checked_in';

            return (
              <div
                key={item.id}
                className="today-arrival-item"
                data-testid={`arrival-item-${item.id}`}
              >
                {/* Left: Avatar */}
                <div
                  className="today-arrival-avatar"
                  onClick={() => onSelectBooking(item.id)}
                  title={`View details for ${item.customerName || 'customer'}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectBooking(item.id);
                    }
                  }}
                >
                  {initials}
                </div>

                {/* Middle: Details */}
                <div
                  className="today-arrival-info"
                  onClick={() => onSelectBooking(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectBooking(item.id);
                    }
                  }}
                >
                  <div className="today-arrival-name-row">
                    <strong className="today-arrival-name">
                      {item.customerName || 'Walk-in Guest'}
                    </strong>
                  </div>
                  {item.customerPhone && (
                    <span className="today-arrival-phone">
                      {item.customerPhone}
                    </span>
                  )}
                  <span className="today-arrival-service">
                    {item.serviceName || 'Service'}{' '}
                    {item.serviceDuration
                      ? `· ${item.serviceDuration} min`
                      : ''}
                  </span>
                </div>

                {/* Right: Status Pill, Time, & Action Button */}
                <div className="today-arrival-actions">
                  <div className="today-arrival-status-row">
                    <span
                      className={`today-badge ${
                        isCheckedIn
                          ? 'badge-in-service'
                          : item.status === 'confirmed'
                            ? 'badge-waiting'
                            : 'badge-waiting'
                      }`}
                    >
                      {isCheckedIn ? 'Arrived' : 'Waiting'}
                    </span>
                    <span className="today-arrival-time">
                      {formatClock(item.startTime)}
                    </span>
                  </div>

                  {onMutateAction && !item.isHomeService && (
                    <button
                      type="button"
                      className="today-arrival-btn"
                      disabled={isMutating}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCheckedIn) {
                          onMutateAction('start_service', item.id);
                        } else {
                          onMutateAction('mark_arrived', item.id);
                        }
                      }}
                      data-testid={`arrival-action-${item.id}`}
                    >
                      <Play size={11} fill="currentColor" aria-hidden="true" />
                      <span>
                        {isMutating
                          ? '...'
                          : isCheckedIn
                            ? 'Start Service'
                            : 'Check In'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
