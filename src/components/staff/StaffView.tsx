import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthContext } from '../../types/auth';
import type {
  BranchServiceOption,
  StaffBlockedTime,
  StaffFilters,
  StaffMember,
  StaffOnboardingRequest,
  StaffPrimaryTab,
  StaffStatusFilter,
} from '../../types/staff';
import {
  fetchBranchAssignableServices,
  fetchBranchOnboardingRequests,
  fetchBranchStaff,
  filterStaff,
  reviewOnboardingRequest,
} from '../../lib/staff-service';
import { StaffHeader } from './StaffHeader';
import { StaffPrimaryTabs } from './StaffPrimaryTabs';
import { StaffKpiSummary } from './StaffKpiSummary';
import { StaffListCard } from './StaffListCard';
import { StaffInspectorCard } from './StaffInspectorCard';
import { StaffScheduleView } from './StaffScheduleView';
import { StaffApplicationsView } from './StaffApplicationsView';
import { StaffCapabilitiesView } from './StaffCapabilitiesView';
import { StaffRolesView } from './StaffRolesView';
import { StaffPerformanceView } from './StaffPerformanceView';
import { StaffCapabilityModal } from './modals/StaffCapabilityModal';
import { StaffScheduleModal } from './modals/StaffScheduleModal';
import { StaffRoleModal } from './modals/StaffRoleModal';
import { StaffApplicationApprovalModal } from './modals/StaffApplicationApprovalModal';
import { StaffAddGuidanceModal } from './modals/StaffAddGuidanceModal';
import { StaffOffboardingNoticeModal } from './modals/StaffOffboardingNoticeModal';

interface StaffViewProps {
  authContext: AuthContext;
}

export const StaffView: React.FC<StaffViewProps> = ({ authContext }) => {
  const [activeTab, setActiveTab] = useState<StaffPrimaryTab>('roster');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [branchServices, setBranchServices] = useState<BranchServiceOption[]>(
    [],
  );
  const [onboardingRequests, setOnboardingRequests] = useState<
    StaffOnboardingRequest[]
  >([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Roster Filters & Pagination
  const [filters, setFilters] = useState<StaffFilters>({
    search: '',
    status: 'all',
    staffType: 'all',
    systemRole: 'all',
    capabilityId: 'all',
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Modal States
  const [isAddGuidanceOpen, setIsAddGuidanceOpen] = useState(false);
  const [capabilityModalStaff, setCapabilityModalStaff] =
    useState<StaffMember | null>(null);
  const [scheduleModalData, setScheduleModalData] = useState<{
    staff: StaffMember;
    date?: string;
    existingBlocks?: StaffBlockedTime[];
  } | null>(null);
  const [roleModalStaff, setRoleModalStaff] = useState<StaffMember | null>(
    null,
  );
  const [approvalModalRequest, setApprovalModalRequest] =
    useState<StaffOnboardingRequest | null>(null);
  const [offboardingModalStaff, setOffboardingModalStaff] =
    useState<StaffMember | null>(null);

  // Load all initial workspace data
  const loadWorkspaceData = useCallback(async () => {
    setError(null);
    try {
      const [staffRes, servicesRes, onboardingRes] = await Promise.all([
        fetchBranchStaff(authContext.branchId),
        fetchBranchAssignableServices(authContext.branchId),
        fetchBranchOnboardingRequests(authContext.branchId),
      ]);

      if (!staffRes.ok) {
        setError(staffRes.message);
      } else {
        setStaffList(staffRes.data);
      }

      setBranchServices(servicesRes);
      setOnboardingRequests(onboardingRes);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load staff workspace.';
      setError(msg);
    }
  }, [authContext.branchId]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      setIsLoading(true);
      await loadWorkspaceData();
      if (isMounted) setIsLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [loadWorkspaceData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadWorkspaceData();
    setIsRefreshing(false);
  }, [loadWorkspaceData]);

  // Derived Filtered Staff List for Roster
  const filteredStaffList = useMemo(() => {
    return filterStaff(staffList, filters);
  }, [staffList, filters]);

  // Selection Coherence (Derived)
  const selectedStaff = useMemo(() => {
    if (filteredStaffList.length === 0) return null;
    if (selectedStaffId === '') return null; // explicitly closed
    if (selectedStaffId === null) return filteredStaffList[0];
    const found = filteredStaffList.find((m) => m.id === selectedStaffId);
    return found || filteredStaffList[0];
  }, [filteredStaffList, selectedStaffId]);

  // Handle KPI Strip clicks (sets secondary status filter)
  const handleKpiClick = useCallback((targetFilter: StaffStatusFilter) => {
    setFilters((prev) => ({ ...prev, status: targetFilter }));
    setCurrentPage(1);
    setActiveTab('roster');
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      staffType: 'all',
      systemRole: 'all',
      capabilityId: 'all',
    });
    setCurrentPage(1);
  }, []);

  // Update staff in local state after mutations
  const handleStaffUpdated = useCallback(
    (patch: Partial<StaffMember> & { id: string }) => {
      setStaffList((current) =>
        current.map((m) => (m.id === patch.id ? { ...m, ...patch } : m)),
      );
      setSuccessNotice('Staff profile updated successfully.');
    },
    [],
  );

  const handleCapabilitiesSaved = useCallback(
    (staffId: string, serviceIds: string[]) => {
      const assigned = branchServices
        .filter((s) => serviceIds.includes(s.id))
        .map((s) => ({ service_id: s.id, service_name: s.name }));

      setStaffList((current) =>
        current.map((m) =>
          m.id === staffId ? { ...m, services: assigned } : m,
        ),
      );
      setSuccessNotice('Service capabilities updated successfully.');
    },
    [branchServices],
  );

  const handleRoleUpdated = useCallback((staffId: string, newRole: string) => {
    setStaffList((current) =>
      current.map((m) =>
        m.id === staffId ? { ...m, system_role: newRole } : m,
      ),
    );
    setSuccessNotice(`Role updated to ${newRole}.`);
  }, []);

  const handleRejectApplication = useCallback(
    async (requestId: string, reason?: string) => {
      const result = await reviewOnboardingRequest({
        requestId,
        action: 'reject',
        rejectionReason: reason,
      });
      if (result.ok) {
        setOnboardingRequests((current) =>
          current.map((r) =>
            r.id === requestId
              ? { ...r, status: 'rejected', rejection_reason: reason || null }
              : r,
          ),
        );
        setSuccessNotice('Application rejected.');
      } else {
        setError(result.error);
      }
    },
    [],
  );

  // KPI calculations
  const kpis = useMemo(() => {
    let activeStaff = 0;
    let awaitingStaff = 0;
    let invitedStaff = 0;
    for (const m of staffList) {
      if (m.status === 'active') activeStaff++;
      else if (m.status === 'awaiting') awaitingStaff++;
      else if (m.status === 'invited') invitedStaff++;
    }
    return {
      totalStaff: staffList.length,
      activeStaff,
      awaitingStaff,
      invitedStaff,
    };
  }, [staffList]);

  const pendingOnboardingCount = useMemo(
    () => onboardingRequests.filter((r) => r.status === 'submitted').length,
    [onboardingRequests],
  );

  return (
    <div
      className="bookings-view-container staff-view-container"
      role="main"
      aria-label="Staff Management"
      data-testid="staff-view"
    >
      {/* 1. Module Header */}
      <StaffHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenAddStaff={() => setIsAddGuidanceOpen(true)}
      />

      {/* 2. Primary 6-Tab Row */}
      <StaffPrimaryTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rosterCount={staffList.length}
        applicationsCount={pendingOnboardingCount}
      />

      {/* 3. Success / Error Banners */}
      {successNotice && (
        <div
          className="bookings-success-banner"
          role="status"
          data-testid="staff-success-banner"
        >
          <div className="bookings-notice-content">
            <span className="bookings-notice-title">{successNotice}</span>
          </div>
          <button
            type="button"
            className="bookings-notice-dismiss"
            onClick={() => setSuccessNotice(null)}
            aria-label="Dismiss notice"
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div
          className="bookings-error-banner"
          role="alert"
          data-testid="staff-error-banner"
        >
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
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="bookings-retry-btn"
            data-testid="staff-retry-btn"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Loading Skeleton */}
      {isLoading ? (
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
          {/* TAB 1: Staff Roster (Default) */}
          {activeTab === 'roster' && (
            <div
              className="space-y-4"
              role="tabpanel"
              id="staff-primary-panel-roster"
            >
              {/* KPI Strip */}
              <StaffKpiSummary
                kpis={kpis}
                activeFilter={filters.status}
                onKpiClick={handleKpiClick}
              />

              {/* Main Two-Column Grid */}
              <div className="bookings-main-grid">
                <div className="bookings-list-column">
                  <StaffListCard
                    staffList={filteredStaffList}
                    totalStaffCount={staffList.length}
                    selectedStaffId={selectedStaff?.id || null}
                    onSelectStaff={(m) => setSelectedStaffId(m.id)}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onResetFilters={handleResetFilters}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    branchServices={branchServices}
                  />
                </div>

                <div className="bookings-inspector-column">
                  <StaffInspectorCard
                    staff={selectedStaff}
                    onClose={() => setSelectedStaffId('')}
                    onOpenScheduleModal={(m) =>
                      setScheduleModalData({ staff: m })
                    }
                    onOpenCapabilityModal={(m) => setCapabilityModalStaff(m)}
                    onOpenRoleModal={(m) => setRoleModalStaff(m)}
                    onOpenOffboardingModal={(m) => setOffboardingModalStaff(m)}
                    onStaffUpdated={handleStaffUpdated}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Schedule View */}
          {activeTab === 'schedule' && (
            <div role="tabpanel" id="staff-primary-panel-schedule">
              <StaffScheduleView
                branchId={authContext.branchId}
                staffList={staffList}
                onOpenScheduleModal={(staff, date, existingBlocks) =>
                  setScheduleModalData({ staff, date, existingBlocks })
                }
              />
            </div>
          )}

          {/* TAB 3: Applications */}
          {activeTab === 'applications' && (
            <div role="tabpanel" id="staff-primary-panel-applications">
              <StaffApplicationsView
                requests={onboardingRequests}
                onOpenApprovalModal={(req) => setApprovalModalRequest(req)}
                onRejectRequest={handleRejectApplication}
              />
            </div>
          )}

          {/* TAB 4: Performance */}
          {activeTab === 'performance' && (
            <div role="tabpanel" id="staff-primary-panel-performance">
              <StaffPerformanceView />
            </div>
          )}

          {/* TAB 5: Capabilities & Services */}
          {activeTab === 'capabilities' && (
            <div role="tabpanel" id="staff-primary-panel-capabilities">
              <StaffCapabilitiesView
                staffList={staffList}
                onOpenCapabilityModal={(m) => setCapabilityModalStaff(m)}
              />
            </div>
          )}

          {/* TAB 6: Roles & Permissions */}
          {activeTab === 'roles' && (
            <div role="tabpanel" id="staff-primary-panel-roles">
              <StaffRolesView
                staffList={staffList}
                onOpenRoleModal={(m) => setRoleModalStaff(m)}
              />
            </div>
          )}
        </>
      )}

      {/* 5. Modals */}
      <StaffCapabilityModal
        isOpen={Boolean(capabilityModalStaff)}
        onClose={() => setCapabilityModalStaff(null)}
        staff={capabilityModalStaff}
        branchServices={branchServices}
        onCapabilitiesSaved={handleCapabilitiesSaved}
      />

      <StaffScheduleModal
        isOpen={Boolean(scheduleModalData)}
        onClose={() => setScheduleModalData(null)}
        staff={scheduleModalData?.staff || null}
        branchId={authContext.branchId}
        initialDate={scheduleModalData?.date}
        existingBlocks={scheduleModalData?.existingBlocks}
        onScheduleAdjusted={handleRefresh}
      />

      <StaffRoleModal
        isOpen={Boolean(roleModalStaff)}
        onClose={() => setRoleModalStaff(null)}
        staff={roleModalStaff}
        actorRole={authContext.canonicalRole || 'manager'}
        onRoleUpdated={handleRoleUpdated}
      />

      <StaffApplicationApprovalModal
        isOpen={Boolean(approvalModalRequest)}
        onClose={() => setApprovalModalRequest(null)}
        request={approvalModalRequest}
        branchId={authContext.branchId}
        branchName={authContext.branchName}
        branchServices={branchServices}
        onApproved={handleRefresh}
      />

      <StaffAddGuidanceModal
        isOpen={isAddGuidanceOpen}
        onClose={() => setIsAddGuidanceOpen(false)}
        onSwitchToApplications={() => setActiveTab('applications')}
      />

      <StaffOffboardingNoticeModal
        isOpen={Boolean(offboardingModalStaff)}
        onClose={() => setOffboardingModalStaff(null)}
        staff={offboardingModalStaff}
      />
    </div>
  );
};
