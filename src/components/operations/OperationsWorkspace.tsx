import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import type { AuthContext, NavModuleId } from '../../types/auth';
import type {
  OperationsCenterData,
  OperationsIssue,
  OperationsScan,
  OperationsTab,
  OperationsFilters,
} from '../../types/operations';
import {
  fetchOperationsCenterData,
  filterOperationsIssues,
  filterOperationsScans,
} from '../../lib/operations-service';
import {
  ModuleWorkspace,
  ModuleHeader,
  ModuleSummaryCard,
  ModuleKpiGrid,
  ModuleKpiCell,
  ModuleMainGrid,
  ModulePrimaryColumn,
  ModulePrimaryCard,
  ModuleTabs,
  ModuleToolbar,
  ModuleDataGridFrame,
  ModuleTable,
  ModuleInspectorColumn,
  ModuleLoadingState,
  ModuleErrorBanner,
  ModuleSuccessBanner,
  type ModuleTabItem,
} from '../workspace';
import { useWorkspaceModuleLifecycle } from '../workspace/useWorkspaceLifecycle';
import { OperationsInspectorCard } from './OperationsInspectorCard';
import { ServiceProviderModal } from './modals/ServiceProviderModal';
import { AttendanceExceptionModal } from './modals/AttendanceExceptionModal';
import { DeviceRecoveryModal } from './modals/DeviceRecoveryModal';
import { StaffDuplicateModal } from './modals/StaffDuplicateModal';
import './operations.css';

export interface OperationsWorkspaceProps {
  authContext: AuthContext;
  onNavigate?: (module: NavModuleId) => void;
}

const OPERATIONS_TABS: Array<ModuleTabItem<OperationsTab>> = [
  { id: 'all', label: 'All Issues' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'service', label: 'Service Readiness' },
  { id: 'staff', label: 'Staff & Accounts' },
  { id: 'scans', label: 'Unsuccessful Scans' },
];

export const OperationsWorkspace: React.FC<OperationsWorkspaceProps> = ({
  authContext,
}) => {
  const [data, setData] = useState<OperationsCenterData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<OperationsTab>('all');
  const [filters, setFilters] = useState<OperationsFilters>({
    search: '',
    severity: 'all',
    area: 'all',
    resolutionState: 'all',
  });

  // Selected item for inspector
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  // Modals state
  const [serviceProviderModal, setServiceProviderModal] = useState<{
    isOpen: boolean;
    issue: OperationsIssue | null;
  }>({ isOpen: false, issue: null });

  const [attendanceExceptionModal, setAttendanceExceptionModal] = useState<{
    isOpen: boolean;
    issue: OperationsIssue | null;
  }>({ isOpen: false, issue: null });

  const [deviceRecoveryModal, setDeviceRecoveryModal] = useState<{
    isOpen: boolean;
    staffId: string;
    staffName: string;
    reasonCode: string;
    message: string;
  } | null>(null);

  const [staffDuplicateModalOpen, setStaffDuplicateModalOpen] =
    useState<boolean>(false);

  // Workspace lifecycle integration
  const { invalidationGeneration } = useWorkspaceModuleLifecycle();

  const loadData = useCallback(async (options?: { isRefresh?: boolean }) => {
    if (options?.isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const result = await fetchOperationsCenterData();
      setData(result);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to load Operations Center diagnostic data.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and invalidation re-fetch
  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (!isMounted) return;
      void loadData();
    });
    return () => {
      isMounted = false;
    };
  }, [loadData, invalidationGeneration]);

  // Derived filtered items
  const filteredIssues = useMemo(() => {
    if (!data) return [];
    return filterOperationsIssues(data.issues, activeTab, filters);
  }, [data, activeTab, filters]);

  const filteredScans = useMemo(() => {
    if (!data) return [];
    return filterOperationsScans(data.scans, filters);
  }, [data, filters]);

  // Derived selected objects
  const selectedIssue = useMemo(() => {
    if (!data || !selectedIssueId) return null;
    return data.issues.find((i) => i.id === selectedIssueId) ?? null;
  }, [data, selectedIssueId]);

  const selectedScan = useMemo(() => {
    if (!data || !selectedScanId) return null;
    return data.scans.find((s) => s.id === selectedScanId) ?? null;
  }, [data, selectedScanId]);

  const clearSelection = useCallback(() => {
    setSelectedIssueId(null);
    setSelectedScanId(null);
  }, []);

  const handleTabChange = (tabId: OperationsTab) => {
    setActiveTab(tabId);
    clearSelection();
  };

  const handleIssueClick = (issue: OperationsIssue) => {
    setSelectedScanId(null);
    setSelectedIssueId((prev) => (prev === issue.id ? null : issue.id));
  };

  const handleScanClick = (scan: OperationsScan) => {
    setSelectedIssueId(null);
    setSelectedScanId((prev) => (prev === scan.id ? null : scan.id));
  };

  const handleModalRepairSuccess = (msg: string) => {
    setSuccessMessage(msg);
    void loadData({ isRefresh: true });
    clearSelection();
  };

  if (isLoading && !data) {
    return (
      <ModuleWorkspace
        ariaLabel="Operations Center Workspace"
        testId="operations-workspace-loading"
      >
        <ModuleLoadingState ariaLabel="Connecting to authoritative operations telemetry..." />
      </ModuleWorkspace>
    );
  }

  const counts = data?.counts ?? {
    critical: 0,
    warning: 0,
    info: 0,
    attendance: 0,
    staff: 0,
    configuration: 0,
    unresolvedScans: 0,
    totalIssues: 0,
  };

  const operatorRole = data?.operatorRole ?? authContext.canonicalRole;
  const canPerformMutations = data?.canPerformMutations ?? false;

  return (
    <ModuleWorkspace
      ariaLabel="Operations Center Workspace"
      className="ops-workspace-container"
      testId="operations-workspace"
    >
      {/* 1. Header */}
      <ModuleHeader
        title="Operations Center"
        subtitle={
          data
            ? `${data.branchName} — Authoritative health diagnostics, attendance exception management, and guided operational repair.`
            : 'Authoritative health diagnostics, attendance exception management, and guided operational repair.'
        }
        brandIcon={<Wrench className="w-5 h-5 text-emerald-600" />}
        testId="ops-header"
      >
        <div className="flex items-center gap-3">
          {data && (
            <div className="flex items-center gap-2">
              <span
                className={`ops-readiness-pill ${
                  counts.critical === 0
                    ? 'ops-readiness-ready'
                    : 'ops-readiness-attention'
                }`}
                title="Branch readiness classification"
              >
                {counts.critical === 0 ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <AlertTriangle size={13} />
                )}
                <span>{data.readyLabel}</span>
              </span>
              <span className="text-xs text-slate-500 font-mono hidden md:inline">
                Role: {operatorRole}
              </span>
            </div>
          )}

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
            onClick={() => void loadData({ isRefresh: true })}
            disabled={isRefreshing}
            data-testid="ops-refresh-btn"
          >
            <RefreshCw
              size={13}
              className={isRefreshing ? 'animate-spin' : ''}
            />
            <span>{isRefreshing ? 'Checking...' : 'Check Health'}</span>
          </button>
        </div>
      </ModuleHeader>

      {/* Notifications */}
      {errorMessage && (
        <ModuleErrorBanner
          message={errorMessage}
          testId="ops-error-banner"
          onRetry={() => void loadData()}
        />
      )}

      {successMessage && (
        <ModuleSuccessBanner
          message={successMessage}
          testId="ops-success-banner"
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {/* 2. Operational Overview KPI Cards */}
      <ModuleSummaryCard
        ariaLabel="Operational Overview Metrics"
        testId="ops-summary-card"
      >
        <ModuleKpiGrid>
          <ModuleKpiCell
            label="Critical Issues"
            count={counts.critical}
            subtext="Immediate fix required"
            accentClass={
              counts.critical > 0 ? 'text-rose-600' : 'text-slate-700'
            }
            icon={
              <ShieldAlert
                size={18}
                className={
                  counts.critical > 0 ? 'text-rose-600' : 'text-slate-400'
                }
              />
            }
            onClick={() => {
              setActiveTab('all');
              setFilters((f) => ({ ...f, severity: 'critical' }));
            }}
            testId="kpi-critical"
          />
          <ModuleKpiCell
            label="Warnings"
            count={counts.warning}
            subtext="Degradations detected"
            accentClass={
              counts.warning > 0 ? 'text-amber-600' : 'text-slate-700'
            }
            icon={
              <AlertTriangle
                size={18}
                className={
                  counts.warning > 0 ? 'text-amber-500' : 'text-slate-400'
                }
              />
            }
            onClick={() => {
              setActiveTab('all');
              setFilters((f) => ({ ...f, severity: 'warning' }));
            }}
            testId="kpi-warning"
          />
          <ModuleKpiCell
            label="Attendance Issues"
            count={counts.attendance}
            subtext="Scan failures & limits"
            accentClass="text-slate-800"
            icon={<Clock size={18} className="text-blue-500" />}
            onClick={() => {
              setActiveTab('attendance');
              setFilters((f) => ({ ...f, severity: 'all' }));
            }}
            testId="kpi-attendance"
          />
          <ModuleKpiCell
            label="Service Readiness"
            count={counts.configuration}
            subtext="Missing providers"
            accentClass="text-slate-800"
            icon={<Wrench size={18} className="text-emerald-600" />}
            onClick={() => {
              setActiveTab('service');
              setFilters((f) => ({ ...f, severity: 'all' }));
            }}
            testId="kpi-configuration"
          />
          <ModuleKpiCell
            label="Staff & Identity"
            count={counts.staff}
            subtext="Duplicate checks"
            accentClass="text-slate-800"
            icon={<Users size={18} className="text-indigo-500" />}
            onClick={() => {
              setActiveTab('staff');
              setFilters((f) => ({ ...f, severity: 'all' }));
            }}
            testId="kpi-staff"
          />
          <ModuleKpiCell
            label="Failed Scans Today"
            count={counts.unresolvedScans}
            subtext="Phone/kiosk rejections"
            accentClass={
              counts.unresolvedScans > 0 ? 'text-rose-600' : 'text-slate-700'
            }
            icon={
              <Smartphone
                size={18}
                className={
                  counts.unresolvedScans > 0
                    ? 'text-rose-500'
                    : 'text-slate-400'
                }
              />
            }
            onClick={() => {
              setActiveTab('scans');
            }}
            testId="kpi-scans"
          />
        </ModuleKpiGrid>
      </ModuleSummaryCard>

      {/* Domain Availability Banners if backend reports offline/unavailable */}
      {data && !data.attendanceAvailable && (
        <div className="ops-unavailable-banner">
          <Info size={16} className="text-amber-600 flex-shrink-0" />
          <span>
            Attendance and scan diagnostics service is currently unavailable for
            this branch. Showing last known state.
          </span>
        </div>
      )}

      {data && !data.configurationAvailable && (
        <div className="ops-unavailable-banner">
          <Info size={16} className="text-amber-600 flex-shrink-0" />
          <span>
            Service catalog readiness telemetry is currently unavailable.
          </span>
        </div>
      )}

      {data && !data.staffAvailable && (
        <div className="ops-unavailable-banner">
          <Info size={16} className="text-amber-600 flex-shrink-0" />
          <span>
            Staff identity and account verification service is currently
            unavailable.
          </span>
        </div>
      )}

      {/* 3. Main Workspace Grid */}
      <ModuleMainGrid testId="ops-main-grid">
        {/* Left Primary Column: Tabs + Toolbar + DataGrid */}
        <ModulePrimaryColumn testId="ops-primary-column">
          <ModulePrimaryCard
            ariaLabel="Operational Issues Inbox"
            testId="ops-primary-card"
          >
            {/* Tabs */}
            <ModuleTabs
              tabs={OPERATIONS_TABS}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              testId="ops-tabs"
            />

            {/* Toolbar */}
            <ModuleToolbar
              ariaLabel="Issue Search and Filters"
              testId="ops-toolbar"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by title, description, staff, service..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, search: e.target.value }))
                    }
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    data-testid="ops-search-input"
                  />
                </div>

                {/* Filter Selects (only for issue tabs) */}
                {activeTab !== 'scans' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={filters.severity}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, severity: e.target.value }))
                      }
                      className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      data-testid="ops-severity-select"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                    </select>

                    <select
                      value={filters.resolutionState}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          resolutionState: e.target.value,
                        }))
                      }
                      className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      data-testid="ops-state-select"
                    >
                      <option value="all">All States</option>
                      <option value="detected">Detected</option>
                      <option value="under_review">Under Review</option>
                      <option value="pending_action">Pending Action</option>
                    </select>
                  </div>
                )}

                {/* Counter */}
                <span className="text-xs font-semibold text-slate-500 ml-auto whitespace-nowrap">
                  {activeTab === 'scans'
                    ? `${filteredScans.length} logged scans`
                    : `${filteredIssues.length} issues requiring action`}
                </span>
              </div>
            </ModuleToolbar>

            {/* Table / DataGrid */}
            <ModuleDataGridFrame testId="ops-datagrid-frame">
              {activeTab === 'scans' ? (
                /* Unsuccessful Scans Table */
                <ModuleTable>
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '180px' }}>Staff Member</th>
                      <th>Failure Reason & Message</th>
                      <th style={{ width: '130px' }}>Occurred At</th>
                      <th style={{ width: '90px' }}>Suffix</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScans.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-sm text-slate-500"
                        >
                          No scan failures recorded for this branch today.
                        </td>
                      </tr>
                    ) : (
                      filteredScans.map((scan) => {
                        const isSelected = selectedScanId === scan.id;
                        return (
                          <tr
                            key={scan.id}
                            className={`ops-clickable-row ${
                              isSelected ? 'ops-row-selected' : ''
                            }`}
                            onClick={() => handleScanClick(scan)}
                            data-testid={`ops-scan-row-${scan.id}`}
                          >
                            <td>
                              <span
                                className={`ops-badge ${
                                  scan.isUnresolvedFailure
                                    ? 'ops-badge-critical'
                                    : 'ops-badge-state'
                                }`}
                              >
                                {scan.isUnresolvedFailure
                                  ? 'Unresolved'
                                  : 'Logged'}
                              </span>
                            </td>
                            <td className="font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <User size={13} className="text-slate-400" />
                                <span>{scan.staffName}</span>
                              </div>
                            </td>
                            <td>
                              <div className="font-mono text-xs font-medium text-rose-700">
                                {scan.reasonCode}
                              </div>
                              <div className="text-xs text-slate-600 truncate max-w-md">
                                {scan.message}
                              </div>
                            </td>
                            <td className="text-xs text-slate-600 whitespace-nowrap">
                              {new Date(scan.occurredAt).toLocaleTimeString(
                                [],
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                },
                              )}
                            </td>
                            <td className="font-mono text-xs text-slate-500">
                              #{scan.scanIdSuffix}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleScanClick(scan);
                                }}
                              >
                                <span>Inspect</span>
                                <ArrowRight size={11} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </ModuleTable>
              ) : (
                /* Operations Issues Table */
                <ModuleTable>
                  <thead>
                    <tr>
                      <th style={{ width: '90px' }}>Severity</th>
                      <th style={{ minWidth: '220px' }}>Operational Problem</th>
                      <th style={{ width: '130px' }}>Area</th>
                      <th style={{ width: '110px' }}>State</th>
                      <th style={{ width: '160px' }}>Impacted Entity</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>
                        Resolution
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-sm text-slate-500"
                        >
                          {data?.issues.length === 0
                            ? 'All operational checks passed. No issues detected for this branch.'
                            : 'No operational issues match the active filter criteria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map((issue) => {
                        const isSelected = selectedIssueId === issue.id;
                        return (
                          <tr
                            key={issue.id}
                            className={`ops-clickable-row ${
                              isSelected ? 'ops-row-selected' : ''
                            }`}
                            onClick={() => handleIssueClick(issue)}
                            data-testid={`ops-issue-row-${issue.id}`}
                          >
                            <td>
                              {issue.severity === 'critical' && (
                                <span className="ops-badge ops-badge-critical">
                                  Critical
                                </span>
                              )}
                              {issue.severity === 'warning' && (
                                <span className="ops-badge ops-badge-warning">
                                  Warning
                                </span>
                              )}
                              {issue.severity === 'info' && (
                                <span className="ops-badge ops-badge-info">
                                  Info
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="font-semibold text-slate-900 leading-snug">
                                {issue.title}
                              </div>
                              <div className="text-xs text-slate-500 truncate max-w-sm mt-0.5">
                                {issue.description}
                              </div>
                            </td>
                            <td>
                              <span className="ops-badge ops-badge-domain">
                                {issue.area === 'attendance' && 'Attendance'}
                                {issue.area === 'configuration' && 'Readiness'}
                                {issue.area === 'staff_identity' && 'Staff'}
                              </span>
                            </td>
                            <td>
                              <span className="ops-badge ops-badge-state">
                                {issue.resolutionState.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              {issue.serviceName && (
                                <div className="text-xs font-medium text-slate-800 truncate">
                                  Service: {issue.serviceName}
                                </div>
                              )}
                              {issue.staffName && (
                                <div className="text-xs font-medium text-slate-800 truncate">
                                  Staff: {issue.staffName}
                                </div>
                              )}
                              {!issue.serviceName && !issue.staffName && (
                                <span className="text-xs text-slate-400">
                                  Branch Wide
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIssueClick(issue);
                                }}
                              >
                                <span>Inspect</span>
                                <ArrowRight size={11} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </ModuleTable>
              )}
            </ModuleDataGridFrame>
          </ModulePrimaryCard>
        </ModulePrimaryColumn>

        {/* Right Inspector Column */}
        <ModuleInspectorColumn testId="ops-inspector-column">
          <OperationsInspectorCard
            selectedIssue={selectedIssue}
            selectedScan={selectedScan}
            canPerformMutations={canPerformMutations}
            operatorRole={operatorRole}
            onClearSelection={clearSelection}
            onOpenServiceProviderModal={(issue) =>
              setServiceProviderModal({ isOpen: true, issue })
            }
            onOpenAttendanceExceptionModal={(issue) =>
              setAttendanceExceptionModal({ isOpen: true, issue })
            }
            onOpenDeviceRecoveryModal={(
              staffId,
              staffName,
              reasonCode,
              message,
            ) =>
              setDeviceRecoveryModal({
                isOpen: true,
                staffId,
                staffName: staffName ?? 'Staff Member',
                reasonCode: reasonCode ?? 'DEVICE_RECOVERY',
                message: message ?? 'Device recovery requested.',
              })
            }
            onOpenStaffDuplicateModal={() => setStaffDuplicateModalOpen(true)}
          />
        </ModuleInspectorColumn>
      </ModuleMainGrid>

      {/* 4. Guided Repair Modals */}
      {serviceProviderModal.isOpen && serviceProviderModal.issue && (
        <ServiceProviderModal
          isOpen={serviceProviderModal.isOpen}
          serviceId={
            serviceProviderModal.issue.serviceId ??
            serviceProviderModal.issue.id
          }
          serviceName={
            serviceProviderModal.issue.serviceName ??
            serviceProviderModal.issue.title
          }
          branchName={data?.branchName ?? authContext.branchName}
          branchStaff={data?.branchStaff ?? []}
          onClose={() =>
            setServiceProviderModal({ isOpen: false, issue: null })
          }
          onAssigned={() =>
            handleModalRepairSuccess(
              'Service provider assigned and readiness re-verified.',
            )
          }
        />
      )}

      {attendanceExceptionModal.isOpen && attendanceExceptionModal.issue && (
        <AttendanceExceptionModal
          isOpen={attendanceExceptionModal.isOpen}
          exceptionId={attendanceExceptionModal.issue.id}
          title={attendanceExceptionModal.issue.title}
          code={attendanceExceptionModal.issue.code}
          description={attendanceExceptionModal.issue.description}
          guidance={attendanceExceptionModal.issue.guidance}
          staffName={attendanceExceptionModal.issue.staffName}
          detectedAt={attendanceExceptionModal.issue.detectedAt}
          onClose={() =>
            setAttendanceExceptionModal({ isOpen: false, issue: null })
          }
          onResolved={() =>
            handleModalRepairSuccess(
              'Attendance exception successfully marked as resolved.',
            )
          }
        />
      )}

      {deviceRecoveryModal?.isOpen && (
        <DeviceRecoveryModal
          isOpen={deviceRecoveryModal.isOpen}
          staffId={deviceRecoveryModal.staffId}
          staffName={deviceRecoveryModal.staffName}
          reasonCode={deviceRecoveryModal.reasonCode}
          message={deviceRecoveryModal.message}
          onClose={() => setDeviceRecoveryModal(null)}
          onGenerated={() =>
            handleModalRepairSuccess(
              'Device recovery activation link generated successfully.',
            )
          }
        />
      )}

      {staffDuplicateModalOpen && (
        <StaffDuplicateModal
          isOpen={staffDuplicateModalOpen}
          branchStaff={data?.branchStaff ?? []}
          onClose={() => setStaffDuplicateModalOpen(false)}
        />
      )}
    </ModuleWorkspace>
  );
};
