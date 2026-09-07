import React from 'react';

export const StaffPerformanceView: React.FC = () => {
  return (
    <div
      className="bookings-list-card staff-performance-view-card p-8 text-center"
      data-testid="staff-performance-view"
    >
      <div className="max-w-md mx-auto space-y-3 py-6">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--cs-surface-warm)] border border-[var(--cs-border)] flex items-center justify-center text-xl">
          📊
        </div>
        <h3 className="text-sm font-bold text-[var(--cs-text)]">
          Staff Performance Metrics
        </h3>
        <p className="text-xs text-[var(--cs-text-muted)] leading-relaxed">
          Performance metrics are not available in the current Staff data
          contract.
        </p>
        <div className="p-3 rounded bg-[var(--cs-surface-warm)] border border-[var(--cs-border-soft)] text-[11px] text-[var(--cs-text-secondary)] text-left">
          <strong>Note:</strong> Performance metrics such as service throughput,
          attendance compliance, and booking ratings require dedicated aggregate
          data contracts that are currently under review.
        </div>
      </div>
    </div>
  );
};
