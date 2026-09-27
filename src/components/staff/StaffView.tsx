import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AuthContext } from '../../types/auth';
import type {
  BranchServiceOption,
  StaffBlockedTime,
  StaffFilters,
  StaffMember,
  StaffOnboardingRequest,
  StaffPrimaryTab,
  StaffScheduleOverride,
  StaffStatusFilter,
} from '../../types/staff';
import {
  fetchBranchAssignableServices,
  fetchBranchOnboardingRequests,
  fetchBranchScheduleWeek,
  fetchBranchStaff,
  filterStaff,
} from '../../lib/staff-service';
import { StaffHeader } from './StaffHeader';
import { StaffSummaryCard } from './StaffKpiSummary';
import { StaffListCard } from './StaffListCard';
import { StaffContextInspector } from './StaffInspectorCard';
import { StaffScheduleContent } from './StaffScheduleView';
import { StaffApplicationsContent } from './StaffApplicationsView';
import { StaffCapabilitiesContent } from './StaffCapabilitiesView';
import { StaffRolesContent } from './StaffRolesView';
import { StaffPerformanceContent } from './StaffPerformanceView';
import { StaffCapabilityModal } from './modals/StaffCapabilityModal';
import { StaffScheduleModal } from './modals/StaffScheduleModal';
import { StaffFullScheduleModal } from './modals/StaffFullScheduleModal';
import { StaffRoleModal } from './modals/StaffRoleModal';
import { StaffApplicationApprovalModal } from './modals/StaffApplicationApprovalModal';
import { StaffAddGuidanceModal } from './modals/StaffAddGuidanceModal';
import { StaffOffboardingNoticeModal } from './modals/StaffOffboardingNoticeModal';
import {
  ModuleWorkspace,
  ModuleErrorBanner,
  ModuleLoadingState,
  ModuleMainGrid,
  ModulePrimaryColumn,
  ModulePrimaryCard,
  ModuleTabs,
  ModuleInspectorColumn,
} from '../workspace';

interface StaffViewProps {
  authContext: AuthContext;
}

const STAFF_TABS: Array<{ id: StaffPrimaryTab; label: string }> = [
  { id: 'roster', label: 'Staff Roster' },
  { id: 'schedule', label: 'Schedule View' },
  { id: 'applications', label: 'Applications' },
  { id: 'performance', label: 'Performance' },
  { id: 'capabilities', label: 'Capabilities & Services' },
  { id: 'roles', label: 'Roles & Permissions' },
];

export const StaffView: React.FC<StaffViewProps> = ({ authContext }) => {
  const [inspectorMutationPending, setInspectorMutationPending] =
    useState(false);
  const [activeTab, setActiveTab] = useState<StaffPrimaryTab>('roster');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [branchServices, setBranchServices] = useState<BranchServiceOption[]>(
    [],
  );
  const [onboardingRequests, setOnboardingRequests] = useState<
    StaffOnboardingRequest[]
  >([]);
  const [branchServicesReady, setBranchServicesReady] = useState(false);
  const [branchServicesLoading, setBranchServicesLoading] = useState(true);
  const [branchServicesError, setBranchServicesError] = useState<string | null>(
    null,
  );
  const [applicationsReady, setApplicationsReady] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(
    null,
  );
  const workspaceRead = useRef(0);
  const [scheduleOverrides, setScheduleOverrides] = useState<
    StaffScheduleOverride[]
  >([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<StaffBlockedTime[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
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

  // Selections: Persistent Staff ID for staff-centric tabs, separate Application ID for Applications tab
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  // Modal States
  const [isAddGuidanceOpen, setIsAddGuidanceOpen] = useState(false);
  const [capabilityModalStaff, setCapabilityModalStaff] =
    useState<StaffMember | null>(null);
  const [scheduleModalData, setScheduleModalData] = useState<{
    staff: StaffMember;
    date?: string;
    existingBlocks?: StaffBlockedTime[];
  } | null>(null);
  const [fullScheduleStaff, setFullScheduleStaff] =
    useState<StaffMember | null>(null);
  const [roleModalStaff, setRoleModalStaff] = useState<StaffMember | null>(
    null,
  );
  const [approvalModalRequest, setApprovalModalRequest] =
    useState<StaffOnboardingRequest | null>(null);
  const [offboardingModalStaff, setOffboardingModalStaff] =
    useState<StaffMember | null>(null);

  const currentMonday = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().slice(0, 10);
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Load all initial workspace data
  const loadWorkspaceData = useCallback(async () => {
    const readId = ++workspaceRead.current;
    setError(null);
    setScheduleError(null);
    setBranchServicesReady(false);
    setBranchServicesLoading(true);
    setBranchServicesError(null);
    setBranchServices([]);
    setApplicationsReady(false);
    setApplicationsLoading(true);
    setApplicationsError(null);
    setOnboardingRequests([]);
    const [staffRead, servicesRead, applicationsRead, scheduleRead] =
      await Promise.allSettled([
        fetchBranchStaff(authContext.branchId),
        fetchBranchAssignableServices(authContext.branchId),
        fetchBranchOnboardingRequests(authContext.branchId),
        fetchBranchScheduleWeek(authContext.branchId, currentMonday),
      ]);
    if (workspaceRead.current !== readId) return;
    if (staffRead.status === 'fulfilled') {
      if (staffRead.value.ok) setStaffList(staffRead.value.data);
      else setError(staffRead.value.message);
    } else setError('Failed to load staff workspace. Please try again.');

    setBranchServicesLoading(false);
    if (servicesRead.status === 'fulfilled' && servicesRead.value.ok) {
      setBranchServices(servicesRead.value.data);
      setBranchServicesReady(true);
    } else {
      setBranchServicesError(
        servicesRead.status === 'fulfilled' && !servicesRead.value.ok
          ? servicesRead.value.message
          : 'Service assignments could not be verified for this branch. Reload the Staff workspace.',
      );
    }
    setApplicationsLoading(false);
    if (applicationsRead.status === 'fulfilled' && applicationsRead.value.ok) {
      setOnboardingRequests(applicationsRead.value.data);
      setApplicationsReady(true);
    } else {
      setApprovalModalRequest(null);
      setApplicationsError(
        applicationsRead.status === 'fulfilled' && !applicationsRead.value.ok
          ? applicationsRead.value.message
          : 'Applications could not be loaded for this branch. Reload the Staff workspace.',
      );
    }
    if (scheduleRead.status === 'fulfilled') {
      setScheduleOverrides(scheduleRead.value.overrides);
      setScheduleBlocks(scheduleRead.value.blockedTimes);
    } else
      setScheduleError('Failed to load branch schedule. Please try again.');
  }, [authContext.branchId, currentMonday]);

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
    setScheduleLoading(true);
    await loadWorkspaceData();
    setIsRefreshing(false);
    setScheduleLoading(false);
  }, [loadWorkspaceData]);

  // Derived Filtered Staff List for Roster
  const filteredStaffList = useMemo(() => {
    return filterStaff(staffList, filters);
  }, [staffList, filters]);

  // Selection Coherence for Staff (Shared across staff-centric tabs)
  const selectedStaff = useMemo(() => {
    if (staffList.length === 0) return null;
    if (selectedStaffId === '') return null;
    if (activeTab === 'roster') {
      if (filteredStaffList.length === 0) return null;
      if (selectedStaffId === null) return filteredStaffList[0];
      const foundInFiltered = filteredStaffList.find(
        (m) => m.id === selectedStaffId,
      );
      return foundInFiltered || filteredStaffList[0];
    }
    if (selectedStaffId === null) return staffList[0];
    const foundInAll = staffList.find((m) => m.id === selectedStaffId);
    return foundInAll || staffList[0];
  }, [staffList, filteredStaffList, selectedStaffId, activeTab]);

  // Selection Coherence for Applications (Isolated to Applications tab)
  const selectedApplication = useMemo(() => {
    if (!applicationsReady || onboardingRequests.length === 0) return null;
    if (selectedApplicationId === '') return null;
    if (selectedApplicationId === null) return onboardingRequests[0];
    const found = onboardingRequests.find(
      (r) => r.id === selectedApplicationId,
    );
    return found || onboardingRequests[0];
  }, [applicationsReady, onboardingRequests, selectedApplicationId]);

  // Handle KPI Strip clicks (sets status filter)
  const handleKpiClick = useCallback(
    (targetFilter: StaffStatusFilter) => {
      if (inspectorMutationPending) return;
      setFilters((prev) => ({ ...prev, status: targetFilter }));
      setCurrentPage(1);
      setActiveTab('roster');
    },
    [inspectorMutationPending],
  );

  const handleResetFilters = useCallback(() => {
    if (inspectorMutationPending) return;
    setFilters({
      search: '',
      status: 'all',
      staffType: 'all',
      systemRole: 'all',
      capabilityId: 'all',
    });
    setCurrentPage(1);
  }, [inspectorMutationPending]);

  const handleStaffUpdated = useCallback(() => {
    setSuccessNotice('Staff profile updated successfully.');
    void handleRefresh();
  }, [handleRefresh]);

  const openCapabilityEditor = useCallback(
    (staff: StaffMember) => {
      if (branchServicesReady) setCapabilityModalStaff(staff);
    },
    [branchServicesReady],
  );

  const handleCapabilitiesSaved = useCallback(() => {
    setSuccessNotice('Service capabilities updated successfully.');
    void handleRefresh();
  }, [handleRefresh]);

  const handleRoleUpdated = useCallback(() => {
    setSuccessNotice('System role updated successfully.');
    void handleRefresh();
  }, [handleRefresh]);
  const handleRejectApplication = useCallback(() => {
    setSuccessNotice('Application rejected.');
    void handleRefresh();
  }, [handleRefresh]);

  // KPI calculations for Roster
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

  const staffTabItems = useMemo(() => {
    const pendingCount = onboardingRequests.filter(
      (r) => r.status === 'submitted',
    ).length;

    return STAFF_TABS.map((tab) => {
      let countBadge: React.ReactNode = null;
      if (tab.id === 'roster') {
        countBadge = <span className="tab-pill-badge">{staffList.length}</span>;
      } else if (tab.id === 'applications' && pendingCount > 0) {
        countBadge = <span className="tab-pill-badge">{pendingCount}</span>;
      }
      return {
        id: tab.id,
        label: tab.label,
        badge: countBadge,
      };
    });
  }, [onboardingRequests, staffList.length]);

  return (
    <ModuleWorkspace className="staff-view-container" testId="staff-view">
      {/* 1. Module Header */}
      <StaffHeader
        onRefresh={() => {
          if (!inspectorMutationPending) void handleRefresh();
        }}
        isRefreshing={isRefreshing}
        onOpenAddStaff={() => {
          if (!inspectorMutationPending) setIsAddGuidanceOpen(true);
        }}
      />

      {/* Success Notification Banner */}
      {successNotice && (
        <div
          className="p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between"
          role="status"
        >
          <span>{successNotice}</span>
          <button
            type="button"
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
            onClick={() => setSuccessNotice(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Error State with Retry */}
      {error && (
        <div
          className="bookings-error-card"
          role="alert"
          data-testid="staff-error-banner"
        >
          <div className="bookings-error-icon-circle">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="bookings-error-title">Unable to Load Staff</h3>
          <p className="bookings-error-message">{error}</p>
          <button
            type="button"
            onClick={loadWorkspaceData}
            className="bookings-retry-btn"
            data-testid="staff-retry-btn"
          >
            Retry
          </button>
        </div>
      )}

      {branchServicesError && (
        <ModuleErrorBanner
          message={branchServicesError}
          onRetry={() => void handleRefresh()}
          testId="staff-services-error"
        />
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <ModuleLoadingState
          ariaLabel="Loading staff roster"
          testId="staff-skeleton"
        />
      ) : (
        <div className="space-y-4">
          {/* 2. Persistent KPI / Summary Card (Mounted for all 6 tabs) */}
          <StaffSummaryCard
            activeTab={activeTab}
            staffList={staffList}
            onboardingRequests={onboardingRequests}
            scheduleOverrides={scheduleOverrides}
            scheduleBlocks={scheduleBlocks}
            scheduleLoading={scheduleLoading}
            scheduleError={scheduleError}
            branchServices={branchServices}
            kpis={kpis}
            activeFilter={filters.status}
            onRosterKpiClick={handleKpiClick}
          />

          {/* 3. Persistent 2-Column Grid */}
          <ModuleMainGrid className="staff-main-grid">
            {/* Left Column: Staff Management Card */}
            <ModulePrimaryColumn>
              <ModulePrimaryCard
                className="staff-management-card"
                testId="staff-workspace-card"
              >
                {/* In-Card Primary Function Tabs (Mirroring Bookings Scope Tabs) */}
                <ModuleTabs<StaffPrimaryTab>
                  tabs={staffTabItems}
                  activeTab={activeTab}
                  onTabChange={(tab) => {
                    if (!inspectorMutationPending) setActiveTab(tab);
                  }}
                  ariaLabel="Staff Management Views"
                  getTabTestId={(id) => `staff-primary-tab-${id}`}
                />

                {/* TAB 1: Staff Roster Content */}
                {activeTab === 'roster' && (
                  <StaffListCard
                    staffList={filteredStaffList}
                    totalStaffCount={staffList.length}
                    selectedStaffId={selectedStaff?.id || null}
                    onSelectStaff={(m) => {
                      if (!inspectorMutationPending) setSelectedStaffId(m.id);
                    }}
                    filters={filters}
                    onFiltersChange={(next) => {
                      if (!inspectorMutationPending) setFilters(next);
                    }}
                    onResetFilters={handleResetFilters}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                )}

                {/* TAB 2: Schedule View Content */}
                {activeTab === 'schedule' && (
                  <StaffScheduleContent
                    branchName={authContext.branchName}
                    staffList={staffList}
                    selectedStaffId={selectedStaff?.id || null}
                    onSelectStaff={(m) => {
                      if (!inspectorMutationPending) setSelectedStaffId(m.id);
                    }}
                    overrides={scheduleOverrides}
                    blockedTimes={scheduleBlocks}
                    isLoading={scheduleLoading}
                    scheduleError={scheduleError}
                  />
                )}

                {/* TAB 3: Applications Content */}
                {activeTab === 'applications' && applicationsReady && (
                  <StaffApplicationsContent
                    requests={onboardingRequests}
                    selectedRequestId={selectedApplication?.id || null}
                    onSelectRequest={(req) => {
                      if (!inspectorMutationPending)
                        setSelectedApplicationId(req.id);
                    }}
                  />
                )}

                {activeTab === 'applications' &&
                  !applicationsReady &&
                  (applicationsLoading ? (
                    <ModuleLoadingState
                      ariaLabel="Loading applications"
                      testId="staff-applications-loading"
                    />
                  ) : (
                    <ModuleErrorBanner
                      message={
                        applicationsError ||
                        'Applications could not be verified. Reload the Staff workspace.'
                      }
                      onRetry={() => void handleRefresh()}
                      testId="staff-applications-error"
                    />
                  ))}

                {/* TAB 4: Performance Content */}
                {activeTab === 'performance' && <StaffPerformanceContent />}

                {/* TAB 5: Capabilities & Services Content */}
                {activeTab === 'capabilities' && (
                  <StaffCapabilitiesContent
                    staffList={staffList}
                    branchServices={branchServices}
                    branchServicesReady={branchServicesReady}
                    branchServicesLoading={branchServicesLoading}
                    branchServicesError={branchServicesError}
                    onRetryServices={() => void handleRefresh()}
                    selectedStaffId={selectedStaff?.id || null}
                    onSelectStaff={(m) => {
                      if (!inspectorMutationPending) setSelectedStaffId(m.id);
                    }}
                    onOpenCapabilityModal={openCapabilityEditor}
                  />
                )}

                {/* TAB 6: Roles & Permissions Content */}
                {activeTab === 'roles' && (
                  <StaffRolesContent
                    staffList={staffList}
                    selectedStaffId={selectedStaff?.id || null}
                    onSelectStaff={(m) => {
                      if (!inspectorMutationPending) setSelectedStaffId(m.id);
                    }}
                    onOpenRoleModal={(m) => setRoleModalStaff(m)}
                  />
                )}
              </ModulePrimaryCard>
            </ModulePrimaryColumn>

            {/* Right Column: Persistent Context Inspector Shell */}
            <ModuleInspectorColumn>
              <StaffContextInspector
                activeTab={activeTab}
                staff={selectedStaff}
                selectedStaffId={selectedStaffId}
                application={selectedApplication}
                selectedApplicationId={selectedApplicationId}
                branchName={authContext.branchName}
                branchServices={branchServices}
                branchServicesReady={branchServicesReady}
                branchServicesLoading={branchServicesLoading}
                branchServicesError={branchServicesError}
                onRetryServices={() => void handleRefresh()}
                scheduleOverrides={scheduleOverrides}
                scheduleBlocks={scheduleBlocks}
                todayStr={todayStr}
                onCloseStaffSelection={() => setSelectedStaffId('')}
                onCloseApplicationSelection={() => setSelectedApplicationId('')}
                onOpenScheduleModal={(m, date, existingBlocks) =>
                  setScheduleModalData({ staff: m, date, existingBlocks })
                }
                onOpenFullScheduleModal={(m) => setFullScheduleStaff(m)}
                onOpenCapabilityModal={openCapabilityEditor}
                onOpenRoleModal={(m) => setRoleModalStaff(m)}
                onOpenOffboardingModal={(m) => setOffboardingModalStaff(m)}
                onStaffUpdated={handleStaffUpdated}
                onMutationPendingChange={setInspectorMutationPending}
                onOpenApprovalModal={(req) => {
                  if (applicationsReady) setApprovalModalRequest(req);
                }}
                onRejectApplication={handleRejectApplication}
                onOpenProfileEdit={(m) => {
                  setSelectedStaffId(m.id);
                  setActiveTab('roster');
                }}
              />
            </ModuleInspectorColumn>
          </ModuleMainGrid>
        </div>
      )}

      {/* Canonical Modals */}
      <StaffAddGuidanceModal
        isOpen={isAddGuidanceOpen}
        onClose={() => setIsAddGuidanceOpen(false)}
        onSwitchToApplications={() => {
          setIsAddGuidanceOpen(false);
          setActiveTab('applications');
        }}
      />

      <StaffCapabilityModal
        isOpen={Boolean(capabilityModalStaff)}
        onClose={() => setCapabilityModalStaff(null)}
        staff={capabilityModalStaff}
        branchServices={branchServices}
        branchServicesReady={branchServicesReady}
        branchServicesLoading={branchServicesLoading}
        branchServicesError={branchServicesError}
        onRetryServices={() => void handleRefresh()}
        onCapabilitiesSaved={handleCapabilitiesSaved}
      />

      <StaffScheduleModal
        isOpen={Boolean(scheduleModalData)}
        onClose={() => setScheduleModalData(null)}
        staff={scheduleModalData?.staff || null}
        branchId={authContext.branchId}
        initialDate={scheduleModalData?.date}
        existingBlocks={scheduleModalData?.existingBlocks}
        existingOverrides={scheduleOverrides}
        onScheduleAdjusted={handleRefresh}
      />

      <StaffFullScheduleModal
        isOpen={Boolean(fullScheduleStaff)}
        onClose={() => setFullScheduleStaff(null)}
        staff={fullScheduleStaff}
        branchName={authContext.branchName}
        overrides={scheduleOverrides}
        blockedTimes={scheduleBlocks}
        onOpenAdjustSchedule={(staff, date) => {
          setFullScheduleStaff(null);
          setScheduleModalData({ staff, date });
        }}
      />

      <StaffRoleModal
        isOpen={Boolean(roleModalStaff)}
        onClose={() => setRoleModalStaff(null)}
        staff={roleModalStaff}
        actorRole={authContext.canonicalRole}
        actorStaffId={authContext.staffId}
        onRoleUpdated={handleRoleUpdated}
      />

      <StaffApplicationApprovalModal
        isOpen={Boolean(approvalModalRequest) && applicationsReady}
        onClose={() => setApprovalModalRequest(null)}
        request={
          applicationsReady
            ? (onboardingRequests.find(
                (request) =>
                  request.id === approvalModalRequest?.id &&
                  request.status === 'submitted',
              ) ?? null)
            : null
        }
        branchId={authContext.branchId}
        branchName={authContext.branchName}
        branchServices={branchServices}
        branchServicesReady={branchServicesReady}
        branchServicesLoading={branchServicesLoading}
        branchServicesError={branchServicesError}
        onRetryServices={() => void handleRefresh()}
        actorRole={authContext.canonicalRole}
        onApproved={() => {
          setSuccessNotice('Application approved successfully.');
          void handleRefresh();
        }}
      />

      <StaffOffboardingNoticeModal
        isOpen={Boolean(offboardingModalStaff)}
        onClose={() => setOffboardingModalStaff(null)}
        staff={offboardingModalStaff}
        actorStaffId={authContext.staffId}
        onDeactivated={() => {
          setSuccessNotice(
            'Staff access deactivated. The staff record is retained.',
          );
          void handleRefresh();
        }}
      />
    </ModuleWorkspace>
  );
};
