import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Info,
  Lock,
  ShieldAlert,
  Smartphone,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import type {
  OperationsIssue,
  OperationsScan,
  OperationsIssueSeverity,
  OperationsIssueArea,
} from '../../types/operations';
import { ModuleInspectorFrame, ModuleInspectorEmptyState } from '../workspace';

export interface OperationsInspectorCardProps {
  selectedIssue: OperationsIssue | null;
  selectedScan: OperationsScan | null;
  canPerformMutations: boolean;
  operatorRole: string;
  onClearSelection: () => void;
  onOpenServiceProviderModal: (issue: OperationsIssue) => void;
  onOpenAttendanceExceptionModal: (issue: OperationsIssue) => void;
  onOpenDeviceRecoveryModal: (
    staffId: string,
    staffName?: string,
    reasonCode?: string,
    message?: string,
  ) => void;
  onOpenStaffDuplicateModal: () => void;
}

function getSeverityBadge(severity: OperationsIssueSeverity) {
  switch (severity) {
    case 'critical':
      return (
        <span className="ops-badge ops-badge-critical">
          <ShieldAlert size={12} className="inline mr-1" />
          Critical
        </span>
      );
    case 'warning':
      return (
        <span className="ops-badge ops-badge-warning">
          <AlertTriangle size={12} className="inline mr-1" />
          Warning
        </span>
      );
    case 'info':
    default:
      return (
        <span className="ops-badge ops-badge-info">
          <Info size={12} className="inline mr-1" />
          Info
        </span>
      );
  }
}

function getAreaLabel(area: OperationsIssueArea) {
  switch (area) {
    case 'attendance':
      return 'Attendance & Scans';
    case 'configuration':
      return 'Service Readiness';
    case 'staff_identity':
      return 'Staff & Accounts';
    default:
      return area;
  }
}

export const OperationsInspectorCard: React.FC<
  OperationsInspectorCardProps
> = ({
  selectedIssue,
  selectedScan,
  canPerformMutations,
  operatorRole,
  onClearSelection,
  onOpenServiceProviderModal,
  onOpenAttendanceExceptionModal,
  onOpenDeviceRecoveryModal,
  onOpenStaffDuplicateModal,
}) => {
  if (!selectedIssue && !selectedScan) {
    return (
      <ModuleInspectorFrame
        isEmpty
        ariaLabel="Operations Context Inspector"
        className="ops-inspector-card"
        testId="ops-inspector-empty"
        emptyState={
          <ModuleInspectorEmptyState
            title="No Problem Selected"
            description="Select an operational problem or attendance exception from the inbox to inspect diagnostics and guided repair actions."
            icon={<Wrench size={32} className="text-slate-400" />}
          />
        }
      />
    );
  }

  if (selectedScan) {
    return (
      <ModuleInspectorFrame
        ariaLabel="Unsuccessful Scan Details"
        className="ops-inspector-card"
        testId="ops-scan-inspector"
      >
        <div className="ops-inspector-header">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="ops-inspector-back-btn"
              onClick={onClearSelection}
              data-testid="ops-scan-back-btn"
              title="Return to inbox"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back</span>
            </button>
            <h3 className="ops-inspector-title">Scan Failure Diagnostic</h3>
          </div>
          <span className="ops-badge ops-badge-critical">
            {selectedScan.isUnresolvedFailure ? 'Unresolved' : 'Logged Event'}
          </span>
        </div>

        <div className="ops-inspector-body">
          <div className="ops-inspector-section">
            <div className="ops-inspector-section-label">Staff Member</div>
            <div className="ops-inspector-value-large flex items-center gap-2">
              <User size={16} className="text-slate-500" />
              <span>{selectedScan.staffName}</span>
            </div>
            {selectedScan.staffId && (
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                ID: {selectedScan.staffId.slice(0, 8)}...
              </div>
            )}
          </div>

          <div className="ops-inspector-section">
            <div className="ops-inspector-section-label">Failure Reason</div>
            <div className="ops-code-badge font-mono text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded inline-block">
              {selectedScan.reasonCode}
            </div>
            <div className="ops-inspector-description mt-2 text-sm text-slate-700">
              {selectedScan.message}
            </div>
          </div>

          <div className="ops-inspector-section">
            <div className="ops-inspector-section-label">Audit Record</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
              <div>
                <span className="text-slate-400 block">Scan Suffix:</span>
                <span className="font-mono font-medium">
                  #{selectedScan.scanIdSuffix}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Occurred At:</span>
                <span className="font-medium">
                  {new Date(selectedScan.occurredAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="ops-inspector-actions mt-4">
            {selectedScan.staffId ? (
              <button
                type="button"
                className="ops-action-btn ops-action-primary w-full"
                onClick={() =>
                  onOpenDeviceRecoveryModal(
                    selectedScan.staffId!,
                    selectedScan.staffName,
                    selectedScan.reasonCode,
                    selectedScan.message,
                  )
                }
                data-testid="ops-scan-recover-device-btn"
              >
                <Smartphone size={15} />
                <span>Issue Replacement Device Link</span>
              </button>
            ) : (
              <div className="text-xs text-slate-500 italic p-2 bg-slate-50 border border-slate-200 rounded text-center">
                Device recovery is unavailable because this scan is not linked
                to a registered staff record.
              </div>
            )}
          </div>
        </div>
      </ModuleInspectorFrame>
    );
  }

  if (!selectedIssue) return null;

  return (
    <ModuleInspectorFrame
      ariaLabel="Operational Issue Details"
      className="ops-inspector-card"
      testId="ops-issue-inspector"
    >
      <div className="ops-inspector-header">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ops-inspector-back-btn"
            onClick={onClearSelection}
            data-testid="ops-issue-back-btn"
            title="Return to inbox"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Back</span>
          </button>
          <h3 className="ops-inspector-title">Issue Diagnostic</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {getSeverityBadge(selectedIssue.severity)}
        </div>
      </div>

      <div className="ops-inspector-body">
        <div className="ops-inspector-section">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {getAreaLabel(selectedIssue.area)}
            </span>
            <span className="ops-badge ops-badge-state">
              {selectedIssue.resolutionState.replace('_', ' ')}
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 mt-1 leading-snug">
            {selectedIssue.title}
          </h4>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            {selectedIssue.description}
          </p>
        </div>

        {/* Impacted Entity Block */}
        {(selectedIssue.staffName || selectedIssue.serviceName) && (
          <div className="ops-inspector-section ops-entity-box">
            <div className="ops-inspector-section-label">
              Impacted Operational Entity
            </div>
            {selectedIssue.staffName && (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <User size={15} className="text-slate-500" />
                <span>Staff: {selectedIssue.staffName}</span>
              </div>
            )}
            {selectedIssue.serviceName && (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mt-1">
                <Wrench size={15} className="text-slate-500" />
                <span>Service: {selectedIssue.serviceName}</span>
              </div>
            )}
          </div>
        )}

        {/* Guided Resolution Box */}
        <div className="ops-inspector-section ops-guidance-box">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
            <HelpCircle size={14} className="text-amber-700" />
            <span>Recommended Resolution</span>
          </div>
          <p className="text-xs text-amber-950 leading-relaxed">
            {selectedIssue.guidance}
          </p>
        </div>

        {/* Diagnostic Metadata */}
        <div className="ops-inspector-section">
          <div className="ops-inspector-section-label">
            Diagnostic Telemetry
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            {selectedIssue.code && (
              <div className="flex justify-between">
                <span className="text-slate-400">Diagnosis Code:</span>
                <span className="font-mono font-medium text-slate-800">
                  {selectedIssue.code}
                </span>
              </div>
            )}
            {selectedIssue.scanIdSuffix && (
              <div className="flex justify-between">
                <span className="text-slate-400">Scan Audit Suffix:</span>
                <span className="font-mono font-medium text-slate-800">
                  #{selectedIssue.scanIdSuffix}
                </span>
              </div>
            )}
            {selectedIssue.detectedAt && (
              <div className="flex justify-between">
                <span className="text-slate-400">Detected:</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedIssue.detectedAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Authorized Guided Actions */}
        <div className="ops-inspector-actions mt-4 space-y-2">
          {canPerformMutations ? (
            <>
              {selectedIssue.resolutionKind === 'provider_assignment' && (
                <button
                  type="button"
                  className="ops-action-btn ops-action-primary w-full"
                  onClick={() => onOpenServiceProviderModal(selectedIssue)}
                  data-testid="ops-assign-provider-action-btn"
                >
                  <Wrench size={15} />
                  <span>Assign Qualified Provider</span>
                </button>
              )}

              {selectedIssue.resolutionKind === 'attendance_router' && (
                <button
                  type="button"
                  className="ops-action-btn ops-action-primary w-full"
                  onClick={() => onOpenAttendanceExceptionModal(selectedIssue)}
                  data-testid="ops-resolve-attendance-action-btn"
                >
                  <CheckCircle2 size={15} />
                  <span>Resolve Attendance Exception</span>
                </button>
              )}

              {selectedIssue.resolutionKind === 'device_recovery' && (
                <button
                  type="button"
                  className="ops-action-btn ops-action-primary w-full"
                  onClick={() =>
                    onOpenDeviceRecoveryModal(
                      selectedIssue.staffId ?? '',
                      selectedIssue.staffName ?? 'Staff Member',
                      selectedIssue.code ?? 'DEVICE_EXCEPTION',
                      selectedIssue.description,
                    )
                  }
                  data-testid="ops-device-recovery-action-btn"
                >
                  <Smartphone size={15} />
                  <span>Issue Phone Activation Link</span>
                </button>
              )}

              {selectedIssue.resolutionKind === 'staff_duplicate' && (
                <button
                  type="button"
                  className="ops-action-btn ops-action-primary w-full"
                  onClick={onOpenStaffDuplicateModal}
                  data-testid="ops-inspect-duplicates-action-btn"
                >
                  <Users size={15} />
                  <span>Inspect Potential Duplicates</span>
                </button>
              )}

              {selectedIssue.resolutionKind === 'guidance' && (
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2.5 text-center">
                  <div className="font-medium text-slate-800 mb-0.5">
                    Administrative Guidance Only
                  </div>
                  Please complete the recommended resolution steps in branch
                  administration. No direct automated mutation is supported for
                  this configuration item.
                </div>
              )}
            </>
          ) : (
            <div className="ops-read-only-notice p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Lock size={14} />
                <span>Read-Only Access ({operatorRole})</span>
              </div>
              <span>
                Your operator role does not have authoritative mutation
                privileges. Contact a branch manager or owner to perform guided
                repairs.
              </span>
            </div>
          )}
        </div>
      </div>
    </ModuleInspectorFrame>
  );
};
