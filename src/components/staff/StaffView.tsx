import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthContext } from '../../types/auth';
import type {
  StaffKpiSummary as StaffKpiSummaryType,
  StaffMember,
  StaffStatusFilter,
} from '../../types/staff';
import { fetchBranchStaff } from '../../lib/staff-service';
import { StaffHeader } from './StaffHeader';
import { StaffKpiSummary } from './StaffKpiSummary';
import { StaffListCard } from './StaffListCard';
import { StaffInspectorCard } from './StaffInspectorCard';

interface StaffViewProps {
  authContext: AuthContext;
}

const INITIAL_KPIS: StaffKpiSummaryType = {
  totalStaff: 0,
  activeStaff: 0,
  awaitingStaff: 0,
  invitedStaff: 0,
};

export const StaffView: React.FC<StaffViewProps> = ({ authContext }) => {
  const [activeFilter, setActiveFilter] = useState<StaffStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [kpis, setKpis] = useState<StaffKpiSummaryType>(INITIAL_KPIS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersionRef = useRef(0);

  const loadRoster = useCallback(
    async (isRefresh = false) => {
      fetchVersionRef.current += 1;
      const currentVersion = fetchVersionRef.current;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await fetchBranchStaff(authContext.branchId);

        if (currentVersion !== fetchVersionRef.current) return;

        if (!res.ok) {
          setError(res.message);
          setStaffList([]);
          setSelectedStaff(null);
          setKpis(INITIAL_KPIS);
          return;
        }

        const data = res.data;
        setStaffList(data);
        setKpis(res.kpis);

        // Maintain selection or select first
        setSelectedStaff((prev) => {
          if (prev) {
            const found = data.find((item) => item.id === prev.id);
            return found || (data.length > 0 ? data[0] : null);
          }
          return data.length > 0 ? data[0] : null;
        });
      } catch (err: unknown) {
        if (currentVersion !== fetchVersionRef.current) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to load staff roster. Please check your connection and try again.';
        setError(msg);
        setStaffList([]);
        setSelectedStaff(null);
        setKpis(INITIAL_KPIS);
      } finally {
        if (currentVersion === fetchVersionRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [authContext.branchId],
  );

  useEffect(() => {
    let isMounted = true;
    fetchVersionRef.current += 1;
    const currentVersion = fetchVersionRef.current;

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetchBranchStaff(authContext.branchId);
        if (!isMounted || currentVersion !== fetchVersionRef.current) return;

        if (!res.ok) {
          setError(res.message);
          setStaffList([]);
          setSelectedStaff(null);
          setKpis(INITIAL_KPIS);
          return;
        }

        const data = res.data;
        setStaffList(data);
        setKpis(res.kpis);

        setSelectedStaff((prev) => {
          if (prev) {
            const found = data.find((item) => item.id === prev.id);
            return found || (data.length > 0 ? data[0] : null);
          }
          return data.length > 0 ? data[0] : null;
        });
      } catch (err: unknown) {
        if (!isMounted || currentVersion !== fetchVersionRef.current) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to load staff roster. Please check your connection and try again.';
        setError(msg);
        setStaffList([]);
        setSelectedStaff(null);
        setKpis(INITIAL_KPIS);
      } finally {
        if (isMounted && currentVersion === fetchVersionRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [authContext.branchId]);

  const handleSelectStaff = (member: StaffMember) => {
    setSelectedStaff(member);
  };

  const handleCloseInspector = () => {
    setSelectedStaff(null);
  };

  return (
    <div
      className="bookings-view-container staff-view-container"
      data-testid="staff-view"
    >
      {/* 1. Header */}
      <StaffHeader
        onRefresh={() => void loadRoster(true)}
        isRefreshing={isRefreshing}
      />

      {/* 2. Error State */}
      {error ? (
        <div
          className="workspace-placeholder staff-unavailable-card"
          role="alert"
          aria-live="assertive"
          data-testid="staff-error-state"
        >
          <div className="placeholder-icon-wrapper placeholder-error-icon-wrapper">
            <svg
              className="placeholder-icon placeholder-error-icon"
              viewBox="0 0 24 24"
              width="24"
              height="24"
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
          </div>
          <h3 className="placeholder-title">Staff Service Unavailable</h3>
          <p className="placeholder-desc">{error}</p>
          <button
            type="button"
            className="bookings-empty-reset-btn"
            style={{ marginTop: '16px' }}
            onClick={() => void loadRoster(true)}
            data-testid="staff-retry-btn"
          >
            Retry Request
          </button>
        </div>
      ) : isLoading ? (
        /* 3. Skeleton Loading State */
        <div
          className="bookings-loading-state"
          aria-busy="true"
          aria-label="Loading staff roster"
          data-testid="staff-skeleton"
        >
          <div className="bookings-skeleton-kpi" />
          <div className="bookings-skeleton-body-grid">
            <div className="bookings-skeleton-list" />
            <div className="bookings-skeleton-inspector" />
          </div>
        </div>
      ) : (
        <>
          {/* 4. KPI Summary Strip */}
          <StaffKpiSummary
            kpis={kpis}
            activeFilter={activeFilter}
            onKpiClick={(filter) => setActiveFilter(filter)}
          />

          {/* 5. Main Two-Column Roster Grid */}
          <div className="bookings-main-grid staff-main-grid">
            <div className="bookings-list-column">
              <StaffListCard
                staff={staffList}
                activeFilter={activeFilter}
                onFilterChange={(filter) => setActiveFilter(filter)}
                searchQuery={searchQuery}
                onSearchChange={(q) => setSearchQuery(q)}
                onResetSearch={() => setSearchQuery('')}
                selectedId={selectedStaff ? selectedStaff.id : null}
                onSelectStaff={handleSelectStaff}
              />
            </div>

            <div className="bookings-inspector-column">
              <StaffInspectorCard
                selectedStaff={selectedStaff}
                branchName={authContext.branchName}
                onClose={handleCloseInspector}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
