import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isInspectorClosed, setIsInspectorClosed] = useState(false);

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [kpis, setKpis] = useState<StaffKpiSummaryType>(INITIAL_KPIS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersionRef = useRef(0);

  // Filtered staff by tab and search
  const filteredStaff = useMemo(() => {
    return staffList.filter((member) => {
      // 1. Status Filter
      if (activeFilter !== 'all' && member.status !== activeFilter) {
        return false;
      }

      // 2. Search Query (full_name, nickname, phone, system_role, staff_type)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = member.full_name.toLowerCase().includes(q);
        const matchesNickname = Boolean(
          member.nickname && member.nickname.toLowerCase().includes(q),
        );
        const matchesPhone = Boolean(
          member.phone && member.phone.toLowerCase().includes(q),
        );
        const matchesRole = member.system_role.toLowerCase().includes(q);
        const matchesType = member.staff_type.toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesNickname &&
          !matchesPhone &&
          !matchesRole &&
          !matchesType
        ) {
          return false;
        }
      }

      return true;
    });
  }, [staffList, activeFilter, searchQuery]);

  // Derive coherent selection: preserve selected if visible, fallback to first visible, or null on 0 matches
  const effectiveSelectedStaff = useMemo(() => {
    if (isInspectorClosed || filteredStaff.length === 0) return null;
    if (selectedStaffId) {
      const found = filteredStaff.find((item) => item.id === selectedStaffId);
      if (found) return found;
    }
    return filteredStaff[0];
  }, [filteredStaff, selectedStaffId, isInspectorClosed]);

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
          setKpis(INITIAL_KPIS);
          return;
        }

        setStaffList(res.data);
        setKpis(res.kpis);
      } catch (err: unknown) {
        if (currentVersion !== fetchVersionRef.current) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to load staff roster. Please check your connection and try again.';
        setError(msg);
        setStaffList([]);
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
          setKpis(INITIAL_KPIS);
          return;
        }

        setStaffList(res.data);
        setKpis(res.kpis);
      } catch (err: unknown) {
        if (!isMounted || currentVersion !== fetchVersionRef.current) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to load staff roster. Please check your connection and try again.';
        setError(msg);
        setStaffList([]);
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
    setSelectedStaffId(member.id);
    setIsInspectorClosed(false);
  };

  const handleCloseInspector = () => {
    setIsInspectorClosed(true);
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
                selectedId={
                  effectiveSelectedStaff ? effectiveSelectedStaff.id : null
                }
                onSelectStaff={handleSelectStaff}
              />
            </div>

            <div className="bookings-inspector-column">
              <StaffInspectorCard
                selectedStaff={effectiveSelectedStaff}
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
