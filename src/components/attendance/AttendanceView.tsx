import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LogOut,
  Search,
  ScanLine,
  UserCheck,
  Users,
} from 'lucide-react';
import type { AuthContext } from '../../types/auth';
import type {
  AttendanceDayStaffState,
  AttendanceRecord,
  AttendanceStatusFilter,
} from '../../types/attendance';
import {
  updateAttendanceRules,
  fetchAttendanceHistory,
  fetchAttendanceWorkspace,
  mutateAttendanceException,
} from '../../lib/attendance-service';
import {
  ModuleDataGridFrame,
  ModuleErrorBanner,
  ModuleHeader,
  ModuleInspectorColumn,
  ModuleInspectorEmptyState,
  ModuleInspectorFrame,
  ModuleKpiCell,
  ModuleKpiGrid,
  ModuleLoadingState,
  ModuleMainGrid,
  ModulePagination,
  ModulePrimaryCard,
  ModulePrimaryColumn,
  ModuleSummaryCard,
  ModuleTable,
  ModuleTabs,
  ModuleToolbar,
  ModuleWorkspace,
} from '../workspace';

interface AttendanceViewProps {
  authContext: AuthContext;
}

type AttendanceTabId = 'today' | 'review' | 'history' | 'setup';

interface AttendanceRowModel {
  state: AttendanceDayStaffState;
  record: AttendanceRecord | null;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

function formatStaffType(value: string | null): string {
  if (!value) return 'Staff';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value: string | null, timezone: string): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  try {
    return new Intl.DateTimeFormat('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }
}

function formatScheduleClock(value: string): string {
  const [hourText = '0', minuteText = '0'] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 || 12;

  return `${String(twelveHour).padStart(2, '0')}:${String(minute).padStart(
    2,
    '0',
  )} ${period}`;
}

function formatWorkedMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;

  if (hours === 0) return `${remaining}m`;
  return `${hours}h ${remaining}m`;
}

function statusTone(state: AttendanceDayStaffState): string {
  switch (state.currentAttendanceState) {
    case 'clocked_in':
    case 'available':
      return 'green';
    case 'in_service':
      return 'blue';
    case 'on_break':
      return 'gold';
    case 'late_not_arrived':
      return 'amber';
    case 'needs_review':
    case 'forgotten_clock_out':
    case 'absent':
      return 'red';
    case 'clocked_out':
      return 'slate';
    default:
      return state.actionRequired ? 'red' : 'slate';
  }
}

function isWorking(state: AttendanceDayStaffState): boolean {
  return (
    state.currentAttendanceState === 'clocked_in' ||
    state.currentAttendanceState === 'available' ||
    state.currentAttendanceState === 'in_service' ||
    state.currentAttendanceState === 'on_break'
  );
}

function isLate(state: AttendanceDayStaffState): boolean {
  return (
    state.currentAttendanceState === 'late_not_arrived' || state.lateMinutes > 0
  );
}

function isNotScannedIn(state: AttendanceDayStaffState): boolean {
  return (
    state.currentAttendanceState === 'not_arrived' ||
    state.currentAttendanceState === 'late_not_arrived'
  );
}

function matchesStatus(
  state: AttendanceDayStaffState,
  filter: AttendanceStatusFilter,
): boolean {
  switch (filter) {
    case 'working':
      return isWorking(state);
    case 'late':
      return isLate(state);
    case 'review':
      return state.actionRequired || state.exceptionState === 'open';
    case 'not_scanned_in':
      return isNotScannedIn(state);
    case 'checked_out':
      return state.currentAttendanceState === 'clocked_out';
    case 'all':
    default:
      return true;
  }
}

function AttendanceInspector({
  row,
  branchName,
  timezone,
}: {
  row: AttendanceRowModel | null;
  branchName: string;
  timezone: string;
}) {
  if (!row) {
    return (
      <ModuleInspectorFrame
        isEmpty
        ariaLabel="Selected Attendance Staff"
        testId="attendance-inspector"
      >
        <ModuleInspectorEmptyState
          title="Select a staff member"
          description="Choose a row to inspect today's attendance state, schedule and scan details."
          icon={<UserCheck size={26} aria-hidden="true" />}
        />
      </ModuleInspectorFrame>
    );
  }

  const { state, record } = row;
  const source = record?.source_label || 'No scan recorded';

  return (
    <ModuleInspectorFrame
      ariaLabel={`Attendance details for ${state.staffName}`}
      testId="attendance-inspector"
      className="attendance-inspector"
    >
      <div className="attendance-inspector-header">
        <div className="attendance-inspector-avatar" aria-hidden="true">
          {initials(state.staffName)}
        </div>

        <div className="attendance-inspector-identity">
          <div className="attendance-inspector-name-row">
            <h2>{state.staffName}</h2>
            <span
              className={`attendance-state-badge attendance-tone-${statusTone(
                state,
              )}`}
            >
              {state.displayLabel}
            </span>
          </div>

          <p>{formatStaffType(state.staffType)}</p>
          <span>{branchName}</span>
        </div>
      </div>

      <div className="attendance-inspector-stat-grid">
        <div>
          <span className="attendance-inspector-stat-label">Arrival</span>
          <strong>{formatTime(state.clockInAt, timezone)}</strong>
        </div>

        <div>
          <span className="attendance-inspector-stat-label">Late</span>
          <strong>
            {state.lateMinutes > 0 ? `${state.lateMinutes} min` : '—'}
          </strong>
        </div>

        <div>
          <span className="attendance-inspector-stat-label">Source</span>
          <strong title={source}>{source}</strong>
        </div>
      </div>

      <section className="attendance-inspector-section">
        <div className="attendance-inspector-section-heading">
          <h3>Today's Schedule</h3>
          <span>{state.businessDate}</span>
        </div>

        {state.shiftWindows.length > 0 ? (
          <div className="attendance-schedule-list">
            {state.shiftWindows.map((window, index) => (
              <div
                key={`${window.id ?? 'window'}-${index}`}
                className="attendance-schedule-item"
              >
                <div>
                  <strong>
                    {formatScheduleClock(window.startTime)}
                    {' – '}
                    {formatScheduleClock(window.endTime)}
                  </strong>
                  <span>
                    {window.shiftType
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (value) => value.toUpperCase())}
                  </span>
                </div>

                {state.currentShiftWindow?.scheduledStartAt ===
                  window.scheduledStartAt && (
                  <span className="attendance-schedule-current">Current</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="attendance-inspector-muted">
            No resolved schedule window for this business date.
          </p>
        )}
      </section>

      <section className="attendance-inspector-section">
        <h3>Attendance Summary</h3>

        <dl className="attendance-inspector-definition-list">
          <div>
            <dt>Worked</dt>
            <dd>{formatWorkedMinutes(state.workedMinutes)}</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>
              {state.availabilityState
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (value) => value.toUpperCase())}
            </dd>
          </div>
          <div>
            <dt>Schedule source</dt>
            <dd>
              {state.scheduleSource
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (value) => value.toUpperCase())}
            </dd>
          </div>
          <div>
            <dt>Exceptions</dt>
            <dd>{state.currentExceptionIds.length}</dd>
          </div>
        </dl>
      </section>

      {(state.actionRequired || state.issueCodes.length > 0) && (
        <section className="attendance-inspector-section attendance-inspector-issues">
          <h3>Needs Attention</h3>

          {state.issueCodes.length > 0 ? (
            <ul>
              {state.issueCodes.map((code) => (
                <li key={code}>
                  {code
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (value) => value.toUpperCase())}
                </li>
              ))}
            </ul>
          ) : (
            <p>This attendance state has an open issue requiring review.</p>
          )}
        </section>
      )}
    </ModuleInspectorFrame>
  );
}

type AttendanceReviewException = Awaited<
  ReturnType<typeof fetchAttendanceWorkspace>
>['data']['exceptions'][number];

function formatReviewText(value: string | null | undefined): string {
  if (!value) return 'Not specified';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatReviewDateTime(
  value: string | null | undefined,
  timezone: string,
): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-PH', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function reviewSeverityTone(value: string): string {
  const normalized = value.toLowerCase();

  if (
    normalized.includes('critical') ||
    normalized.includes('high') ||
    normalized.includes('error')
  ) {
    return 'red';
  }

  if (normalized.includes('warning') || normalized.includes('medium')) {
    return 'amber';
  }

  if (normalized.includes('info') || normalized.includes('low')) {
    return 'blue';
  }

  return 'slate';
}

function AttendanceReviewView({
  exceptions,
  branchName,
  timezone,
  onRefresh,
}: {
  exceptions: AttendanceReviewException[];
  branchName: string;
  timezone: string;
  onRefresh: () => Promise<void>;
}) {
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewSeverity, setReviewSeverity] = useState('all');
  const [reviewType, setReviewType] = useState('all');
  const [reviewPageSize, setReviewPageSize] = useState(10);
  const [reviewPage, setReviewPage] = useState(1);
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(
    exceptions[0]?.id ?? null,
  );
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionPending, setActionPending] = useState<
    'review_exception' | 'resolve_exception' | null
  >(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const severityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          exceptions.map((exception) => exception.severity).filter(Boolean),
        ),
      ).sort(),
    [exceptions],
  );

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          exceptions
            .map((exception) => exception.exception_type)
            .filter(Boolean),
        ),
      ).sort(),
    [exceptions],
  );

  const filteredExceptions = useMemo(() => {
    const query = reviewSearch.trim().toLowerCase();

    return exceptions.filter((exception) => {
      if (reviewSeverity !== 'all' && exception.severity !== reviewSeverity) {
        return false;
      }

      if (reviewType !== 'all' && exception.exception_type !== reviewType) {
        return false;
      }

      if (!query) return true;

      return [
        exception.staff_name ?? '',
        exception.exception_type,
        exception.severity,
        exception.message,
        exception.category ?? '',
        exception.priority ?? '',
        exception.recommended_action ?? '',
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [exceptions, reviewSearch, reviewSeverity, reviewType]);

  const reviewTotalPages = Math.max(
    1,
    Math.ceil(filteredExceptions.length / reviewPageSize),
  );

  const safeReviewPage = Math.min(reviewPage, reviewTotalPages);

  const reviewStartIndex = (safeReviewPage - 1) * reviewPageSize;

  const reviewPageExceptions = filteredExceptions.slice(
    reviewStartIndex,
    reviewStartIndex + reviewPageSize,
  );

  const reviewStartRecord =
    filteredExceptions.length === 0 ? 0 : reviewStartIndex + 1;

  const reviewEndRecord = Math.min(
    reviewStartIndex + reviewPageSize,
    filteredExceptions.length,
  );

  const selectedException =
    reviewPageExceptions.find(
      (exception) => exception.id === selectedExceptionId,
    ) ??
    reviewPageExceptions[0] ??
    null;

  const runMutation = async (
    action: 'review_exception' | 'resolve_exception',
  ) => {
    if (!selectedException) return;

    setActionPending(action);
    setActionMessage(null);
    setActionError(null);

    try {
      const result = await mutateAttendanceException({
        action,
        exceptionId: selectedException.id,
        resolutionNote:
          action === 'resolve_exception' ? resolutionNote : undefined,
      });

      setActionMessage(result.message);

      if (action === 'resolve_exception') {
        setResolutionNote('');
      }

      await onRefresh();
    } catch (caught: unknown) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Attendance issue action could not be completed.',
      );
    } finally {
      setActionPending(null);
    }
  };

  return (
    <ModuleMainGrid
      className="attendance-main-grid attendance-review-main-grid"
      testId="attendance-review-main-grid"
    >
      <ModulePrimaryColumn>
        <ModulePrimaryCard
          ariaLabel="Attendance Review Queue"
          className="attendance-review-card"
          testId="attendance-review-card"
        >
          <ModuleToolbar
            ariaLabel="Attendance Review filters"
            className="attendance-toolbar attendance-review-toolbar"
            testId="attendance-review-toolbar"
          >
            <div className="bookings-search-wrapper">
              <input
                className="bookings-search-input"
                type="search"
                value={reviewSearch}
                onChange={(event) => {
                  setReviewSearch(event.target.value);
                  setReviewPage(1);
                }}
                placeholder="Search staff or issue..."
                aria-label="Search Attendance issues"
              />
            </div>

            <div className="bookings-filters-group">
              <select
                className="bookings-select-filter"
                value={reviewSeverity}
                onChange={(event) => {
                  setReviewSeverity(event.target.value);
                  setReviewPage(1);
                }}
                aria-label="Attendance issue severity filter"
              >
                <option value="all">All Severities</option>

                {severityOptions.map((severity) => (
                  <option key={severity} value={severity}>
                    {formatReviewText(severity)}
                  </option>
                ))}
              </select>

              <select
                className="bookings-select-filter"
                value={reviewType}
                onChange={(event) => {
                  setReviewType(event.target.value);
                  setReviewPage(1);
                }}
                aria-label="Attendance issue type filter"
              >
                <option value="all">All Issue Types</option>

                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {formatReviewText(type)}
                  </option>
                ))}
              </select>
            </div>

            <span className="attendance-review-count">
              {filteredExceptions.length} open
            </span>
          </ModuleToolbar>

          <ModuleDataGridFrame testId="attendance-review-grid">
            {filteredExceptions.length === 0 ? (
              <div className="attendance-review-empty">
                <CheckCircle2 size={22} aria-hidden="true" />
                <strong>No matching open issues</strong>
                <span>
                  Attendance exceptions requiring review will appear here.
                </span>
              </div>
            ) : (
              <ModuleTable aria-label="Attendance Review Queue">
                <thead>
                  <tr>
                    <th scope="col">Detected</th>
                    <th scope="col">Staff Member</th>
                    <th scope="col">Issue</th>
                    <th scope="col">Severity</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {reviewPageExceptions.map((exception) => {
                    const selected = selectedException?.id === exception.id;

                    const staffName =
                      exception.staff_name || 'Unassigned staff';

                    return (
                      <tr
                        key={exception.id}
                        className={
                          'booking-row ' + (selected ? 'selected' : '')
                        }
                        onClick={() => setSelectedExceptionId(exception.id)}
                      >
                        <td>
                          <div className="time-primary">
                            {formatReviewDateTime(
                              exception.detected_at,
                              timezone,
                            )}
                          </div>

                          {exception.occurrence_count &&
                            exception.occurrence_count > 1 && (
                              <div className="time-secondary">
                                {exception.occurrence_count} occurrences
                              </div>
                            )}
                        </td>

                        <td>
                          <div className="attendance-review-staff">
                            <strong>{staffName}</strong>

                            {exception.category && (
                              <span>
                                {formatReviewText(exception.category)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="attendance-review-issue-cell">
                            <strong>
                              {formatReviewText(exception.exception_type)}
                            </strong>
                            <span>{exception.message}</span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              'attendance-state-badge attendance-tone-' +
                              reviewSeverityTone(exception.severity)
                            }
                          >
                            {formatReviewText(exception.severity)}
                          </span>
                        </td>

                        <td>
                          <span className="attendance-review-open-status">
                            {exception.resolution_status === 'reviewed'
                              ? 'Reviewed · Open'
                              : 'Open'}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              'action-inspect-btn ' + (selected ? 'active' : '')
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedExceptionId(exception.id);
                            }}
                            aria-label={'Inspect ' + staffName + ' issue'}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </ModuleTable>
            )}
          </ModuleDataGridFrame>

          {filteredExceptions.length > 0 && (
            <ModulePagination
              startRecord={reviewStartRecord}
              endRecord={reviewEndRecord}
              totalItems={filteredExceptions.length}
              entityLabel="issues"
              pageSize={reviewPageSize}
              pageSizeOptions={[10, 25, 50]}
              currentPage={safeReviewPage}
              totalPages={reviewTotalPages}
              onPageChange={setReviewPage}
              onPageSizeChange={setReviewPageSize}
              prevPageAriaLabel="Previous Attendance Review page"
              nextPageAriaLabel="Next Attendance Review page"
              testId="attendance-review-pagination"
            />
          )}
        </ModulePrimaryCard>
      </ModulePrimaryColumn>

      <ModuleInspectorColumn>
        {!selectedException ? (
          <ModuleInspectorFrame
            isEmpty
            ariaLabel="Attendance Issue Details"
            testId="attendance-review-inspector"
          >
            <ModuleInspectorEmptyState
              title="Select an issue"
              description="Choose an open Attendance exception to inspect and resolve."
              icon={<AlertTriangle size={26} aria-hidden="true" />}
            />
          </ModuleInspectorFrame>
        ) : (
          <ModuleInspectorFrame
            ariaLabel="Attendance Issue Details"
            testId="attendance-review-inspector"
          >
            <div className="attendance-review-inspector-header">
              <div className="attendance-inspector-avatar">
                {initials(selectedException.staff_name || 'Attendance issue')}
              </div>

              <div className="attendance-review-inspector-title">
                <div className="attendance-review-inspector-title-row">
                  <h2>{selectedException.staff_name || 'Unassigned staff'}</h2>

                  <span
                    className={
                      'attendance-state-badge attendance-tone-' +
                      reviewSeverityTone(selectedException.severity)
                    }
                  >
                    {formatReviewText(selectedException.severity)}
                  </span>
                </div>

                <p>{formatReviewText(selectedException.exception_type)}</p>

                <span>{branchName}</span>
              </div>
            </div>

            <section className="attendance-inspector-section">
              <div className="attendance-inspector-section-heading">
                <h3>Issue Details</h3>
                <span>
                  {selectedException.resolution_status === 'reviewed'
                    ? 'Reviewed · still open'
                    : 'Open'}
                </span>
              </div>

              <p className="attendance-review-message">
                {selectedException.message}
              </p>

              <dl className="attendance-inspector-definition-list">
                <div>
                  <dt>Detected</dt>
                  <dd>
                    {formatReviewDateTime(
                      selectedException.detected_at,
                      timezone,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Last seen</dt>
                  <dd>
                    {formatReviewDateTime(
                      selectedException.last_detected_at ??
                        selectedException.detected_at,
                      timezone,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Category</dt>
                  <dd>{formatReviewText(selectedException.category)}</dd>
                </div>

                <div>
                  <dt>Priority</dt>
                  <dd>
                    {formatReviewText(
                      selectedException.priority ?? selectedException.severity,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Occurrences</dt>
                  <dd>{selectedException.occurrence_count ?? 1}</dd>
                </div>

                <div>
                  <dt>Staff response</dt>
                  <dd>
                    {selectedException.staff_response_required
                      ? 'Required'
                      : 'Not required'}
                  </dd>
                </div>
              </dl>
            </section>

            {selectedException.recommended_action && (
              <section className="attendance-inspector-section attendance-review-recommendation">
                <h3>Recommended Action</h3>
                <p>{selectedException.recommended_action}</p>
              </section>
            )}

            <section className="attendance-inspector-section attendance-review-resolution">
              <div className="attendance-inspector-section-heading">
                <h3>Resolution</h3>
                <span>Server validated</span>
              </div>

              <label
                className="attendance-review-note-label"
                htmlFor="attendance-resolution-note"
              >
                Resolution note
              </label>

              <textarea
                id="attendance-resolution-note"
                className="attendance-review-note"
                rows={3}
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                placeholder="Optional note explaining the resolution..."
              />

              {actionError && (
                <p className="attendance-review-action-error" role="alert">
                  {actionError}
                </p>
              )}

              {actionMessage && (
                <p className="attendance-review-action-success" role="status">
                  {actionMessage}
                </p>
              )}

              <div className="attendance-review-actions">
                <button
                  type="button"
                  className="attendance-review-secondary-action"
                  disabled={
                    Boolean(actionPending) ||
                    selectedException.resolution_status === 'reviewed'
                  }
                  onClick={() => void runMutation('review_exception')}
                >
                  {selectedException.resolution_status === 'reviewed'
                    ? 'Reviewed · Open'
                    : actionPending === 'review_exception'
                      ? 'Reviewing...'
                      : 'Review & Keep Open'}
                </button>

                <button
                  type="button"
                  className="attendance-review-primary-action"
                  disabled={Boolean(actionPending)}
                  onClick={() => void runMutation('resolve_exception')}
                >
                  {actionPending === 'resolve_exception'
                    ? 'Resolving...'
                    : 'Resolve Issue'}
                </button>
              </div>
            </section>
          </ModuleInspectorFrame>
        )}
      </ModuleInspectorColumn>
    </ModuleMainGrid>
  );
}

function shiftAttendanceHistoryDate(value: string, days: number): string {
  const date = new Date(value + 'T00:00:00.000Z');

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function getAttendanceHistoryDates(fromDate: string, toDate: string): string[] {
  const dates: string[] = [];
  let cursor = fromDate;

  while (cursor <= toDate && dates.length < 7) {
    dates.push(cursor);
    cursor = shiftAttendanceHistoryDate(cursor, 1);
  }

  return dates;
}

function formatAttendanceHistoryDate(value: string): string {
  const date = new Date(value + 'T00:00:00.000Z');

  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatAttendanceHistoryMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const remaining = safe % 60;

  if (hours === 0) return remaining + 'm';
  if (remaining === 0) return hours + 'h';

  return hours + 'h ' + remaining + 'm';
}

function AttendanceHistoryView({
  branchId,
  branchName,
  timezone,
  businessDate,
}: {
  branchId: string;
  branchName: string;
  timezone: string;
  businessDate: string;
}) {
  const [weekEnd, setWeekEnd] = useState(businessDate);
  const [historyResponse, setHistoryResponse] = useState<Awaited<
    ReturnType<typeof fetchAttendanceHistory>
  > | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedHistoryStaffId, setSelectedHistoryStaffId] = useState<
    string | null
  >(null);

  const weekStart = shiftAttendanceHistoryDate(weekEnd, -6);

  useEffect(() => {
    let cancelled = false;

    void fetchAttendanceHistory(weekStart, weekEnd)
      .then((response) => {
        if (cancelled) return;

        if (response.branchId !== branchId) {
          throw new Error(
            'Attendance history returned data for a different branch.',
          );
        }

        setHistoryResponse(response);
        setHistoryError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;

        setHistoryError(
          caught instanceof Error
            ? caught.message
            : 'Attendance history could not be loaded.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [branchId, weekEnd, weekStart]);

  const retryHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await fetchAttendanceHistory(weekStart, weekEnd);

      if (response.branchId !== branchId) {
        throw new Error(
          'Attendance history returned data for a different branch.',
        );
      }

      setHistoryResponse(response);
    } catch (caught: unknown) {
      setHistoryError(
        caught instanceof Error
          ? caught.message
          : 'Attendance history could not be loaded.',
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const moveWeek = (days: number) => {
    const requestedEnd = shiftAttendanceHistoryDate(weekEnd, days);

    const nextEnd = requestedEnd > businessDate ? businessDate : requestedEnd;

    setHistoryResponse(null);
    setHistoryError(null);
    setHistoryLoading(true);
    setHistoryPage(1);
    setSelectedHistoryStaffId(null);
    setWeekEnd(nextEnd);
  };

  const records = useMemo(
    () => historyResponse?.data.records ?? [],
    [historyResponse],
  );

  const corrections = useMemo(
    () => historyResponse?.data.corrections ?? [],
    [historyResponse],
  );

  const dates = useMemo(
    () => getAttendanceHistoryDates(weekStart, weekEnd),
    [weekEnd, weekStart],
  );

  const summary = useMemo(
    () => ({
      records: records.length,
      present: records.filter(
        (record) => record.attendance_status === 'present',
      ).length,
      late: records.filter((record) => record.late_minutes > 0).length,
      earlyLeave: records.filter((record) => record.early_leave_minutes > 0)
        .length,
      overtime: records.filter((record) => record.overtime_minutes > 0).length,
      corrections: corrections.length,
    }),
    [corrections, records],
  );

  const staffRows = useMemo(() => {
    const staff = new Map<
      string,
      {
        staffId: string;
        staffName: string;
        records: typeof records;
        corrections: typeof corrections;
      }
    >();

    for (const record of records) {
      const current = staff.get(record.staff_id) ?? {
        staffId: record.staff_id,
        staffName: record.staff_name || 'Staff member',
        records: [],
        corrections: [],
      };

      current.records.push(record);

      staff.set(record.staff_id, current);
    }

    for (const correction of corrections) {
      if (!correction.staff_id) continue;

      const current = staff.get(correction.staff_id) ?? {
        staffId: correction.staff_id,
        staffName: correction.staff_name || 'Staff member',
        records: [],
        corrections: [],
      };

      current.corrections.push(correction);

      staff.set(correction.staff_id, current);
    }

    return Array.from(staff.values()).sort((a, b) =>
      a.staffName.localeCompare(b.staffName),
    );
  }, [corrections, records]);

  const filteredStaffRows = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    if (!query) return staffRows;

    return staffRows.filter((staff) =>
      staff.staffName.toLowerCase().includes(query),
    );
  }, [historySearch, staffRows]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStaffRows.length / historyPageSize),
  );

  const safePage = Math.min(historyPage, totalPages);

  const startIndex = (safePage - 1) * historyPageSize;

  const pageRows = filteredStaffRows.slice(
    startIndex,
    startIndex + historyPageSize,
  );

  const startRecord = filteredStaffRows.length === 0 ? 0 : startIndex + 1;

  const endRecord = Math.min(
    startIndex + historyPageSize,
    filteredStaffRows.length,
  );

  const selectedStaff =
    pageRows.find((staff) => staff.staffId === selectedHistoryStaffId) ??
    pageRows[0] ??
    null;

  const selectedWorkedMinutes =
    selectedStaff?.records.reduce(
      (total, record) => total + record.worked_minutes,
      0,
    ) ?? 0;

  const selectedLateRecords =
    selectedStaff?.records.filter((record) => record.late_minutes > 0).length ??
    0;

  const selectedOvertimeMinutes =
    selectedStaff?.records.reduce(
      (total, record) => total + record.overtime_minutes,
      0,
    ) ?? 0;

  const selectedEarlyLeaveRecords =
    selectedStaff?.records.filter((record) => record.early_leave_minutes > 0)
      .length ?? 0;

  if (historyLoading && !historyResponse) {
    return (
      <ModuleLoadingState
        ariaLabel="Loading Attendance History"
        className="attendance-loading-state"
        testId="attendance-history-loading"
      />
    );
  }

  if (historyError && !historyResponse) {
    return (
      <ModuleErrorBanner
        message={historyError}
        onRetry={() => void retryHistory()}
        testId="attendance-history-error"
      />
    );
  }

  return (
    <>
      <ModuleSummaryCard
        ariaLabel="Attendance History Summary"
        className="attendance-kpi-summary"
      >
        <ModuleKpiGrid className="attendance-history-kpi-grid">
          <ModuleKpiCell
            label="Records"
            count={summary.records}
            subtext="Attendance records"
            icon={<Clock3 size={14} aria-hidden="true" />}
            testId="attendance-history-kpi-records"
          />

          <ModuleKpiCell
            label="Present"
            count={summary.present}
            subtext="Present records"
            icon={<UserCheck size={14} aria-hidden="true" />}
            accentClass="kpi-accent-emerald"
            testId="attendance-history-kpi-present"
          />

          <ModuleKpiCell
            label="Late"
            count={summary.late}
            subtext="Late records"
            icon={<Clock3 size={14} aria-hidden="true" />}
            accentClass="kpi-accent-amber"
            testId="attendance-history-kpi-late"
          />

          <ModuleKpiCell
            label="Early Leave"
            count={summary.earlyLeave}
            subtext="Early-leave records"
            icon={<AlertTriangle size={14} aria-hidden="true" />}
            accentClass="kpi-accent-gold"
            testId="attendance-history-kpi-early"
          />

          <ModuleKpiCell
            label="Overtime"
            count={summary.overtime}
            subtext="Overtime records"
            icon={<Clock3 size={14} aria-hidden="true" />}
            accentClass="kpi-accent-blue"
            testId="attendance-history-kpi-overtime"
          />

          <ModuleKpiCell
            label="Corrections"
            count={summary.corrections}
            subtext="Recorded corrections"
            icon={<AlertTriangle size={14} aria-hidden="true" />}
            accentClass="kpi-accent-red"
            testId="attendance-history-kpi-corrections"
          />
        </ModuleKpiGrid>
      </ModuleSummaryCard>

      <ModuleMainGrid
        className="attendance-main-grid attendance-history-main-grid"
        testId="attendance-history-main-grid"
      >
        <ModulePrimaryColumn>
          <ModulePrimaryCard
            ariaLabel="Attendance History"
            className="attendance-history-card"
          >
            <ModuleToolbar
              ariaLabel="Attendance History controls"
              className="attendance-toolbar attendance-history-toolbar"
            >
              <div className="bookings-search-wrapper">
                <input
                  className="bookings-search-input"
                  type="search"
                  value={historySearch}
                  onChange={(event) => {
                    setHistorySearch(event.target.value);
                    setHistoryPage(1);
                  }}
                  placeholder="Search staff..."
                  aria-label="Search Attendance history staff"
                />
              </div>

              <div className="attendance-history-week-controls">
                <button
                  type="button"
                  className="attendance-history-week-button"
                  onClick={() => moveWeek(-7)}
                  aria-label="Previous Attendance week"
                >
                  ← Previous
                </button>

                <span className="attendance-history-range">
                  {weekStart} — {weekEnd}
                </span>

                <button
                  type="button"
                  className="attendance-history-week-button"
                  onClick={() => moveWeek(7)}
                  disabled={weekEnd >= businessDate}
                  aria-label="Next Attendance week"
                >
                  Next →
                </button>
              </div>
            </ModuleToolbar>

            <ModuleDataGridFrame testId="attendance-history-grid">
              {pageRows.length === 0 ? (
                <div className="attendance-history-empty">
                  <Clock3 size={22} aria-hidden="true" />
                  <strong>No attendance history</strong>
                  <span>
                    No attendance records or corrections were returned for this
                    week.
                  </span>
                </div>
              ) : (
                <ModuleTable aria-label="Attendance weekly history">
                  <thead>
                    <tr>
                      <th scope="col">Staff Member</th>

                      {dates.map((date) => (
                        <th scope="col" key={date}>
                          {formatAttendanceHistoryDate(date)}
                        </th>
                      ))}

                      <th scope="col">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageRows.map((staff) => {
                      const selected = selectedStaff?.staffId === staff.staffId;

                      return (
                        <tr
                          key={staff.staffId}
                          className={
                            'booking-row ' + (selected ? 'selected' : '')
                          }
                          onClick={() =>
                            setSelectedHistoryStaffId(staff.staffId)
                          }
                        >
                          <td>
                            <div className="attendance-review-staff">
                              <strong>{staff.staffName}</strong>
                              <span>
                                {staff.records.length} record
                                {staff.records.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </td>

                          {dates.map((date) => {
                            const dayRecords = staff.records.filter(
                              (record) => record.shift_date === date,
                            );

                            if (dayRecords.length === 0) {
                              return (
                                <td key={date}>
                                  <span className="attendance-history-no-record">
                                    No record
                                  </span>
                                </td>
                              );
                            }

                            const lateMinutes = dayRecords.reduce(
                              (total, record) => total + record.late_minutes,
                              0,
                            );

                            const checkedIn = dayRecords.some(
                              (record) =>
                                record.status === 'checked_in' &&
                                !record.checked_out_at,
                            );

                            const present = dayRecords.some(
                              (record) =>
                                record.attendance_status === 'present',
                            );

                            const label =
                              lateMinutes > 0
                                ? 'Late ' + lateMinutes + 'm'
                                : checkedIn
                                  ? 'Checked in'
                                  : present
                                    ? 'Present'
                                    : formatReviewText(
                                        dayRecords[0].attendance_status ||
                                          dayRecords[0].status,
                                      );

                            const tone =
                              lateMinutes > 0
                                ? 'amber'
                                : checkedIn
                                  ? 'blue'
                                  : 'green';

                            return (
                              <td key={date}>
                                <span
                                  className={
                                    'attendance-state-badge attendance-tone-' +
                                    tone
                                  }
                                >
                                  {label}
                                </span>
                              </td>
                            );
                          })}

                          <td>
                            <strong className="attendance-history-total">
                              {formatAttendanceHistoryMinutes(
                                staff.records.reduce(
                                  (total, record) =>
                                    total + record.worked_minutes,
                                  0,
                                ),
                              )}
                            </strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </ModuleTable>
              )}
            </ModuleDataGridFrame>

            {filteredStaffRows.length > 0 && (
              <ModulePagination
                startRecord={startRecord}
                endRecord={endRecord}
                totalItems={filteredStaffRows.length}
                entityLabel="staff"
                pageSize={historyPageSize}
                pageSizeOptions={[10, 25, 50]}
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setHistoryPage}
                onPageSizeChange={setHistoryPageSize}
                prevPageAriaLabel="Previous Attendance History page"
                nextPageAriaLabel="Next Attendance History page"
                testId="attendance-history-pagination"
              />
            )}
          </ModulePrimaryCard>
        </ModulePrimaryColumn>

        <ModuleInspectorColumn>
          {!selectedStaff ? (
            <ModuleInspectorFrame
              isEmpty
              ariaLabel="Attendance Staff History Summary"
              testId="attendance-history-inspector"
            >
              <ModuleInspectorEmptyState
                title="Select a staff member"
                description="Choose a staff row to inspect this week's recorded attendance."
                icon={<UserCheck size={26} aria-hidden="true" />}
              />
            </ModuleInspectorFrame>
          ) : (
            <ModuleInspectorFrame
              ariaLabel="Attendance Staff History Summary"
              testId="attendance-history-inspector"
            >
              <div className="attendance-inspector-header">
                <div className="attendance-inspector-avatar">
                  {initials(selectedStaff.staffName)}
                </div>

                <div className="attendance-inspector-identity">
                  <div className="attendance-inspector-name-row">
                    <h2>{selectedStaff.staffName}</h2>
                  </div>

                  <p>Attendance History</p>
                  <span>{branchName}</span>
                </div>
              </div>

              <div className="attendance-inspector-stat-grid">
                <div>
                  <span className="attendance-inspector-stat-label">
                    Records
                  </span>
                  <strong>{selectedStaff.records.length}</strong>
                </div>

                <div>
                  <span className="attendance-inspector-stat-label">Late</span>
                  <strong>{selectedLateRecords}</strong>
                </div>

                <div>
                  <span className="attendance-inspector-stat-label">
                    Corrections
                  </span>
                  <strong>{selectedStaff.corrections.length}</strong>
                </div>
              </div>

              <section className="attendance-inspector-section">
                <div className="attendance-inspector-section-heading">
                  <h3>Week Summary</h3>
                  <span>
                    {weekStart} — {weekEnd}
                  </span>
                </div>

                <dl className="attendance-inspector-definition-list">
                  <div>
                    <dt>Worked</dt>
                    <dd>
                      {formatAttendanceHistoryMinutes(selectedWorkedMinutes)}
                    </dd>
                  </div>

                  <div>
                    <dt>Overtime</dt>
                    <dd>
                      {formatAttendanceHistoryMinutes(selectedOvertimeMinutes)}
                    </dd>
                  </div>

                  <div>
                    <dt>Early leave</dt>
                    <dd>{selectedEarlyLeaveRecords}</dd>
                  </div>

                  <div>
                    <dt>Timezone</dt>
                    <dd>{timezone}</dd>
                  </div>
                </dl>
              </section>

              <section className="attendance-inspector-section">
                <div className="attendance-inspector-section-heading">
                  <h3>Recorded Days</h3>
                  <span>{selectedStaff.records.length}</span>
                </div>

                <div className="attendance-history-detail-list">
                  {selectedStaff.records.length === 0 ? (
                    <p className="attendance-inspector-muted">
                      No recorded attendance in this week.
                    </p>
                  ) : (
                    selectedStaff.records.map((record) => (
                      <div
                        key={record.id}
                        className="attendance-history-detail"
                      >
                        <div>
                          <strong>
                            {formatAttendanceHistoryDate(record.shift_date)}
                          </strong>

                          <span>
                            {formatReviewText(
                              record.attendance_status || record.status,
                            )}
                          </span>
                        </div>

                        <span>
                          {formatAttendanceHistoryMinutes(
                            record.worked_minutes,
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </ModuleInspectorFrame>
          )}
        </ModuleInspectorColumn>
      </ModuleMainGrid>
    </>
  );
}

function attendanceSetupNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : fallback;
}

function AttendanceSetupView({
  branchName,
  timezone,
  settings,
  activeDevices,
  qrConfiguration,
  qrPoints,
  deviceRegistry,
  onRefresh,
}: {
  branchName: string;
  timezone: string;
  settings: {
    late_grace_minutes?: number;
    clock_in_window_before_shift_minutes?: number;
    duplicate_scan_debounce_minutes?: number;
  };
  activeDevices: number;
  qrConfiguration:
    | {
        isConfigured: boolean;
        error?: string | null;
      }
    | undefined;
  qrPoints:
    | Array<{
        id: string;
        point_type: string;
        label: string;
        is_active: boolean;
      }>
    | undefined;
  deviceRegistry:
    | {
        entries: Array<{
          status?: string;
        }>;
        pendingRecoveryLinks: unknown[];
        registrationRequests: unknown[];
      }
    | undefined;
  onRefresh: () => Promise<void>;
}) {
  const initialLateGrace = attendanceSetupNumber(
    settings.late_grace_minutes,
    0,
  );

  const initialClockInWindow = attendanceSetupNumber(
    settings.clock_in_window_before_shift_minutes,
    0,
  );

  const initialDebounce = attendanceSetupNumber(
    settings.duplicate_scan_debounce_minutes,
    0,
  );

  const [lateGrace, setLateGrace] = useState(String(initialLateGrace));

  const [clockInWindow, setClockInWindow] = useState(
    String(initialClockInWindow),
  );

  const [duplicateDebounce, setDuplicateDebounce] = useState(
    String(initialDebounce),
  );

  const [changeNote, setChangeNote] = useState('');
  const [savingRules, setSavingRules] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const lateGraceNumber = Number(lateGrace);
  const clockInWindowNumber = Number(clockInWindow);
  const duplicateDebounceNumber = Number(duplicateDebounce);

  const rulesAreValid =
    Number.isInteger(lateGraceNumber) &&
    lateGraceNumber >= 0 &&
    Number.isInteger(clockInWindowNumber) &&
    clockInWindowNumber >= 0 &&
    Number.isInteger(duplicateDebounceNumber) &&
    duplicateDebounceNumber >= 0;

  const hasRuleChanges =
    rulesAreValid &&
    (lateGraceNumber !== initialLateGrace ||
      clockInWindowNumber !== initialClockInWindow ||
      duplicateDebounceNumber !== initialDebounce);

  const activeQrPoints = qrPoints?.filter((point) => point.is_active) ?? [];

  const attendanceQr =
    activeQrPoints.find((point) => point.point_type === 'attendance') ?? null;

  const connectedDeviceRows =
    deviceRegistry?.entries.filter((entry) => entry.status === 'active')
      .length ?? null;

  const registrationRequests =
    deviceRegistry?.registrationRequests.length ?? null;

  const pendingRecoveryLinks =
    deviceRegistry?.pendingRecoveryLinks.length ?? null;

  const saveRules = async () => {
    if (!rulesAreValid || !hasRuleChanges || savingRules) {
      return;
    }

    setSavingRules(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const result = await updateAttendanceRules({
        settings: {
          late_grace_minutes: lateGraceNumber,
          clock_in_window_before_shift_minutes: clockInWindowNumber,
          duplicate_scan_debounce_minutes: duplicateDebounceNumber,
        },
        reason: changeNote.trim() || undefined,
      });

      setLateGrace(
        String(
          attendanceSetupNumber(
            result.settings.late_grace_minutes,
            lateGraceNumber,
          ),
        ),
      );

      setClockInWindow(
        String(
          attendanceSetupNumber(
            result.settings.clock_in_window_before_shift_minutes,
            clockInWindowNumber,
          ),
        ),
      );

      setDuplicateDebounce(
        String(
          attendanceSetupNumber(
            result.settings.duplicate_scan_debounce_minutes,
            duplicateDebounceNumber,
          ),
        ),
      );

      setChangeNote('');
      setSaveMessage(result.message);

      await onRefresh();
    } catch (caught: unknown) {
      setSaveError(
        caught instanceof Error
          ? caught.message
          : 'Attendance rules could not be saved.',
      );
    } finally {
      setSavingRules(false);
    }
  };

  return (
    <div className="attendance-setup-layout" data-testid="attendance-setup">
      <aside
        className="attendance-setup-navigation"
        aria-label="Attendance Setup sections"
      >
        <div className="attendance-setup-nav-heading">Attendance Setup</div>

        <button
          type="button"
          className="attendance-setup-nav-item active"
          aria-current="page"
        >
          Rules
        </button>

        <div className="attendance-setup-nav-item readonly">QR & Devices</div>

        <p className="attendance-setup-nav-note">
          Only Desktop-authorized Attendance rules are editable here.
        </p>
      </aside>

      <ModulePrimaryCard
        className="attendance-setup-card"
        ariaLabel="Attendance Rules"
      >
        <div className="attendance-setup-card-header">
          <div>
            <h2>Attendance Rules</h2>
            <p>Operational scan rules for {branchName}.</p>
          </div>

          <span className="attendance-setup-rule-count">3 editable rules</span>
        </div>

        {saveError && (
          <div
            className="attendance-setup-feedback error"
            role="alert"
            data-testid="attendance-setup-error"
          >
            {saveError}
          </div>
        )}

        {saveMessage && (
          <div
            className="attendance-setup-feedback success"
            role="status"
            data-testid="attendance-setup-success"
          >
            {saveMessage}
          </div>
        )}

        <div className="attendance-setup-fields">
          <label className="attendance-setup-field">
            <span>
              Late grace
              <small>
                Minutes after scheduled start before a late arrival is recorded.
              </small>
            </span>

            <div className="attendance-setup-number-control">
              <input
                type="number"
                min="0"
                step="1"
                value={lateGrace}
                onChange={(event) => {
                  setLateGrace(event.target.value);
                  setSaveMessage(null);
                }}
                aria-label="Late grace minutes"
              />

              <span>min</span>
            </div>
          </label>

          <label className="attendance-setup-field">
            <span>
              Clock-in window before shift
              <small>How early staff may use the normal clock-in flow.</small>
            </span>

            <div className="attendance-setup-number-control">
              <input
                type="number"
                min="0"
                step="1"
                value={clockInWindow}
                onChange={(event) => {
                  setClockInWindow(event.target.value);
                  setSaveMessage(null);
                }}
                aria-label="Clock-in window before shift minutes"
              />

              <span>min</span>
            </div>
          </label>

          <label className="attendance-setup-field">
            <span>
              Duplicate scan debounce
              <small>
                Minimum minutes used to protect against repeated scans.
              </small>
            </span>

            <div className="attendance-setup-number-control">
              <input
                type="number"
                min="0"
                step="1"
                value={duplicateDebounce}
                onChange={(event) => {
                  setDuplicateDebounce(event.target.value);
                  setSaveMessage(null);
                }}
                aria-label="Duplicate scan debounce minutes"
              />

              <span>min</span>
            </div>
          </label>
        </div>

        <label className="attendance-setup-note-field">
          <span>Change note</span>

          <textarea
            value={changeNote}
            onChange={(event) => setChangeNote(event.target.value)}
            placeholder="Optional reason for this rule change..."
            rows={3}
            aria-label="Attendance rule change note"
          />
        </label>

        {!rulesAreValid && (
          <p className="attendance-setup-validation" role="alert">
            Rule values must be whole numbers of zero or more.
          </p>
        )}

        <div className="attendance-setup-actions">
          <div>
            <strong>Server validated</strong>
            <span>
              Changes are applied through the hosted Attendance service.
            </span>
          </div>

          <button
            type="button"
            className="attendance-setup-save"
            onClick={() => void saveRules()}
            disabled={!rulesAreValid || !hasRuleChanges || savingRules}
          >
            {savingRules ? 'Saving…' : 'Save Attendance Rules'}
          </button>
        </div>
      </ModulePrimaryCard>

      <ModuleInspectorFrame
        ariaLabel="Attendance Setup Context"
        className="attendance-setup-context"
        testId="attendance-setup-context"
      >
        <div className="attendance-setup-context-header">
          <h2>Operational Context</h2>
          <p>{branchName}</p>
        </div>

        <section className="attendance-setup-context-section">
          <h3>Branch</h3>

          <dl className="attendance-inspector-definition-list">
            <div>
              <dt>Branch</dt>
              <dd>{branchName}</dd>
            </div>

            <div>
              <dt>Timezone</dt>
              <dd>{timezone}</dd>
            </div>

            <div>
              <dt>Authority</dt>
              <dd>Signed-in staff branch</dd>
            </div>
          </dl>
        </section>

        <section className="attendance-setup-context-section">
          <div className="attendance-setup-context-title-row">
            <h3>QR Readiness</h3>

            <span
              className={
                'attendance-setup-context-badge ' +
                (qrConfiguration?.isConfigured ? 'ready' : 'attention')
              }
            >
              {qrConfiguration
                ? qrConfiguration.isConfigured
                  ? 'Configured'
                  : 'Needs attention'
                : 'Not reported'}
            </span>
          </div>

          <dl className="attendance-inspector-definition-list">
            <div>
              <dt>Active QR points</dt>
              <dd>{qrPoints ? activeQrPoints.length : 'Not reported'}</dd>
            </div>

            <div>
              <dt>Attendance QR</dt>
              <dd>
                {qrPoints
                  ? (attendanceQr?.label ?? 'Not ready')
                  : 'Not reported'}
              </dd>
            </div>
          </dl>

          {qrConfiguration?.error && (
            <p className="attendance-setup-context-warning">
              {qrConfiguration.error}
            </p>
          )}
        </section>

        <section className="attendance-setup-context-section">
          <h3>Phones & Devices</h3>

          <dl className="attendance-inspector-definition-list">
            <div>
              <dt>Active devices</dt>
              <dd>{activeDevices}</dd>
            </div>

            <div>
              <dt>Registry active</dt>
              <dd>{connectedDeviceRows ?? 'Not reported'}</dd>
            </div>

            <div>
              <dt>Registration requests</dt>
              <dd>{registrationRequests ?? 'Not reported'}</dd>
            </div>

            <div>
              <dt>Recovery links</dt>
              <dd>{pendingRecoveryLinks ?? 'Not reported'}</dd>
            </div>
          </dl>
        </section>

        <div className="attendance-setup-managed-note">
          Additional Attendance policy remains managed by the hosted system and
          is intentionally not editable from this Desktop Setup screen.
        </div>
      </ModuleInspectorFrame>
    </div>
  );
}

export function AttendanceView({ authContext }: AttendanceViewProps) {
  const [workspace, setWorkspace] = useState<Awaited<
    ReturnType<typeof fetchAttendanceWorkspace>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AttendanceTabId>('today');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<AttendanceStatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const applyWorkspaceResponse = useCallback(
    (response: Awaited<ReturnType<typeof fetchAttendanceWorkspace>>) => {
      if (
        response.branchId !== authContext.branchId ||
        response.data.branchId !== authContext.branchId
      ) {
        throw new Error(
          'Attendance returned data for a different branch. Refresh your session before continuing.',
        );
      }

      setWorkspace(response);

      setSelectedStaffId((current) => {
        if (
          current &&
          response.data.dailyStaffStates.some(
            (state) => state.staffId === current,
          )
        ) {
          return current;
        }

        return response.data.dailyStaffStates[0]?.staffId ?? null;
      });
    },
    [authContext.branchId],
  );

  const refreshWorkspace = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetchAttendanceWorkspace();
      applyWorkspaceResponse(response);
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Attendance could not be loaded.',
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [applyWorkspaceResponse]);

  useEffect(() => {
    let cancelled = false;

    void fetchAttendanceWorkspace()
      .then((response) => {
        if (cancelled) return;

        applyWorkspaceResponse(response);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;

        setError(
          caught instanceof Error
            ? caught.message
            : 'Attendance could not be loaded.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyWorkspaceResponse]);

  const data = workspace?.data ?? null;

  const recordById = useMemo(() => {
    return new Map((data?.records ?? []).map((record) => [record.id, record]));
  }, [data?.records]);

  const rows = useMemo<AttendanceRowModel[]>(() => {
    if (!data) return [];

    return data.dailyStaffStates.map((state) => ({
      state,
      record: state.attendanceRecordId
        ? (recordById.get(state.attendanceRecordId) ?? null)
        : null,
    }));
  }, [data, recordById]);

  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.state.staffType)
            .filter(
              (value): value is string =>
                typeof value === 'string' && value.trim().length > 0,
            ),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const sourceOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.record?.source_label || 'No scan recorded')
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const { state, record } = row;
      const source = record?.source_label || 'No scan recorded';

      if (!matchesStatus(state, statusFilter)) {
        return false;
      }

      if (roleFilter !== 'all' && state.staffType !== roleFilter) {
        return false;
      }

      if (sourceFilter !== 'all' && source !== sourceFilter) {
        return false;
      }

      if (!query) return true;

      return [
        state.staffName,
        state.staffType ?? '',
        state.displayLabel,
        source,
        ...state.issueCodes,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [rows, search, statusFilter, roleFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const selectedRow =
    rows.find((row) => row.state.staffId === selectedStaffId) ?? null;

  const lateCount = rows.filter((row) => isLate(row.state)).length;

  const notScannedCount = rows.filter((row) =>
    isNotScannedIn(row.state),
  ).length;

  const checkedOutCount = rows.filter(
    (row) => row.state.currentAttendanceState === 'clocked_out',
  ).length;

  const hasFilters =
    search.trim().length > 0 ||
    statusFilter !== 'all' ||
    roleFilter !== 'all' ||
    sourceFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('all');
    setSourceFilter('all');
    setCurrentPage(1);
  };

  const tabs = useMemo(
    () => [
      {
        id: 'today' as const,
        label: 'Today',
      },
      {
        id: 'review' as const,
        label: 'Review',
        count:
          data && data.summary.openExceptions > 0
            ? data.summary.openExceptions
            : undefined,
      },
      {
        id: 'history' as const,
        label: 'History',
      },
      {
        id: 'setup' as const,
        label: 'Setup',
      },
    ],
    [data],
  );

  return (
    <ModuleWorkspace
      ariaLabel="Attendance workspace"
      testId="attendance-workspace"
      className="attendance-workspace"
    >
      <ModuleHeader
        title="Attendance"
        subtitle={`Live staff presence, scan status and attendance exceptions for ${authContext.branchName}.`}
        onRefresh={() => void refreshWorkspace()}
        isRefreshing={isRefreshing}
        refreshAriaLabel="Refresh Attendance"
        testId="attendance-header"
      />

      <ModuleTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ariaLabel="Attendance views"
        containerClassName="attendance-page-tabs"
        className="attendance-page-tab"
        tabTestIdPrefix="attendance-tab"
      />

      {error && (
        <ModuleErrorBanner
          message={error}
          onRetry={() => void refreshWorkspace()}
          testId="attendance-error"
        />
      )}

      {isLoading && !data ? (
        <ModuleLoadingState
          ariaLabel="Loading Attendance"
          className="attendance-loading-state"
          testId="attendance-loading"
        />
      ) : !data ? null : activeTab === 'review' ? (
        <AttendanceReviewView
          exceptions={data.exceptions}
          branchName={data.branchName}
          timezone={data.timezone}
          onRefresh={refreshWorkspace}
        />
      ) : activeTab === 'history' ? (
        <AttendanceHistoryView
          branchId={data.branchId}
          branchName={data.branchName}
          timezone={data.timezone}
          businessDate={data.businessDate}
        />
      ) : activeTab === 'setup' ? (
        <AttendanceSetupView
          key={[
            data.settings.late_grace_minutes,
            data.settings.clock_in_window_before_shift_minutes,
            data.settings.duplicate_scan_debounce_minutes,
          ].join(':')}
          branchName={data.branchName}
          timezone={data.timezone}
          settings={data.settings}
          activeDevices={data.summary.activeDevices}
          qrConfiguration={data.qrConfiguration}
          qrPoints={data.qrPoints}
          deviceRegistry={data.deviceRegistry}
          onRefresh={refreshWorkspace}
        />
      ) : activeTab !== 'today' ? null : (
        <>
          <ModuleSummaryCard
            ariaLabel="Today's Attendance Summary"
            className="attendance-kpi-summary"
          >
            <ModuleKpiGrid className="attendance-kpi-grid">
              <ModuleKpiCell
                label="Working"
                count={data.summary.checkedInNow}
                subtext="Currently checked in"
                icon={<UserCheck size={14} aria-hidden="true" />}
                accentClass="kpi-accent-emerald"
                testId="attendance-kpi-working"
              />

              <ModuleKpiCell
                label="Late"
                count={lateCount}
                subtext="Past attendance grace"
                icon={<Clock3 size={14} aria-hidden="true" />}
                accentClass="kpi-accent-amber"
                testId="attendance-kpi-late"
              />

              <ModuleKpiCell
                label="Needs Review"
                count={data.summary.openExceptions}
                subtext="Open attendance issues"
                icon={<AlertTriangle size={14} aria-hidden="true" />}
                accentClass="kpi-accent-red"
                testId="attendance-kpi-review"
              />

              <ModuleKpiCell
                label="Not Scanned In"
                count={notScannedCount}
                subtext="Expected but not arrived"
                icon={<ScanLine size={14} aria-hidden="true" />}
                accentClass="kpi-accent-gold"
                testId="attendance-kpi-not-scanned"
              />

              <ModuleKpiCell
                label="Checked Out"
                count={checkedOutCount}
                subtext="Attendance completed"
                icon={<LogOut size={14} aria-hidden="true" />}
                accentClass="kpi-accent-blue"
                testId="attendance-kpi-checked-out"
              />
            </ModuleKpiGrid>
          </ModuleSummaryCard>

          <ModuleMainGrid
            className="attendance-main-grid"
            testId="attendance-main-grid"
          >
            <ModulePrimaryColumn>
              <ModulePrimaryCard
                ariaLabel="Today's staff attendance"
                testId="attendance-today-card"
              >
                <ModuleToolbar
                  ariaLabel="Attendance filters"
                  className="attendance-toolbar"
                >
                  <div className="bookings-search-wrapper">
                    <Search
                      size={14}
                      className="bookings-search-icon"
                      aria-hidden="true"
                    />

                    <input
                      type="search"
                      className="bookings-search-input"
                      placeholder="Search staff or scan source..."
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setCurrentPage(1);
                      }}
                      aria-label="Search Attendance staff"
                    />
                  </div>

                  <div className="bookings-filters-group">
                    <select
                      className="bookings-select-filter"
                      value={statusFilter}
                      onChange={(event) => {
                        setStatusFilter(
                          event.target.value as AttendanceStatusFilter,
                        );
                        setCurrentPage(1);
                      }}
                      aria-label="Attendance status filter"
                    >
                      <option value="all">All Statuses</option>
                      <option value="working">Working</option>
                      <option value="late">Late</option>
                      <option value="review">Needs Review</option>
                      <option value="not_scanned_in">Not Scanned In</option>
                      <option value="checked_out">Checked Out</option>
                    </select>

                    <select
                      className="bookings-select-filter"
                      value={roleFilter}
                      onChange={(event) => {
                        setRoleFilter(event.target.value);
                        setCurrentPage(1);
                      }}
                      aria-label="Attendance role filter"
                    >
                      <option value="all">All Roles</option>
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {formatStaffType(role)}
                        </option>
                      ))}
                    </select>

                    <select
                      className="bookings-select-filter"
                      value={sourceFilter}
                      onChange={(event) => {
                        setSourceFilter(event.target.value);
                        setCurrentPage(1);
                      }}
                      aria-label="Attendance source filter"
                    >
                      <option value="all">All Sources</option>
                      {sourceOptions.map((source) => (
                        <option key={source} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>

                    {hasFilters && (
                      <button
                        type="button"
                        className="bookings-reset-filters-btn"
                        onClick={resetFilters}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </ModuleToolbar>

                <ModuleDataGridFrame testId="attendance-grid">
                  {filteredRows.length === 0 ? (
                    <div className="bookings-table-empty-state">
                      <div
                        className="bookings-empty-icon-circle"
                        aria-hidden="true"
                      >
                        <Users size={20} />
                      </div>

                      <h2 className="bookings-empty-heading">
                        {hasFilters
                          ? 'No matching staff'
                          : 'No Attendance states'}
                      </h2>

                      <p className="bookings-empty-text">
                        {hasFilters
                          ? 'No staff match the current Attendance filters.'
                          : `No staff Attendance states are available for ${data.businessDate}.`}
                      </p>

                      {hasFilters && (
                        <button
                          type="button"
                          className="bookings-empty-reset-btn"
                          onClick={resetFilters}
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <ModuleTable aria-label="Today's Attendance">
                      <thead>
                        <tr>
                          <th scope="col">Time</th>
                          <th scope="col">Staff Member</th>
                          <th scope="col">Status</th>
                          <th scope="col">Schedule</th>
                          <th scope="col">Source</th>
                          <th scope="col">Branch</th>
                          <th scope="col">Notes / Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {pageRows.map(({ state, record }) => {
                          const selected = selectedStaffId === state.staffId;

                          const displayedTime =
                            state.clockInAt ?? state.scheduledStart;

                          const source =
                            record?.source_label || 'No scan recorded';

                          const scheduleWindow =
                            state.currentShiftWindow ??
                            state.nextShiftWindow ??
                            state.shiftWindows[0] ??
                            null;

                          return (
                            <tr
                              key={state.staffId}
                              className={`booking-row ${
                                selected ? 'selected' : ''
                              }`}
                              onClick={() => setSelectedStaffId(state.staffId)}
                            >
                              <td className="td-time">
                                <div className="time-primary">
                                  {formatTime(displayedTime, data.timezone)}
                                </div>
                                <div className="time-secondary">
                                  {state.clockInAt
                                    ? 'Clocked in'
                                    : state.scheduledStart
                                      ? 'Scheduled'
                                      : 'No time'}
                                </div>
                              </td>

                              <td>
                                <div className="customer-cell">
                                  <span
                                    className="customer-avatar-pill"
                                    aria-hidden="true"
                                  >
                                    {initials(state.staffName)}
                                  </span>

                                  <div className="customer-info">
                                    <div className="customer-name">
                                      {state.staffName}
                                    </div>
                                    <div className="customer-subtext">
                                      {formatStaffType(state.staffType)}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <span
                                  className={`attendance-state-badge attendance-tone-${statusTone(
                                    state,
                                  )}`}
                                >
                                  {state.displayLabel}
                                </span>

                                {state.lateMinutes > 0 && (
                                  <div className="attendance-state-subtext">
                                    {state.lateMinutes} min late
                                  </div>
                                )}
                              </td>

                              <td>
                                {scheduleWindow ? (
                                  <div className="attendance-table-schedule">
                                    <strong>
                                      {formatScheduleClock(
                                        scheduleWindow.startTime,
                                      )}
                                      {' – '}
                                      {formatScheduleClock(
                                        scheduleWindow.endTime,
                                      )}
                                    </strong>

                                    <span>
                                      {scheduleWindow.shiftType
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, (value) =>
                                          value.toUpperCase(),
                                        )}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="attendance-muted-cell">
                                    No schedule
                                  </span>
                                )}
                              </td>

                              <td>
                                <span
                                  className="booking-source-badge"
                                  title={source}
                                >
                                  {source}
                                </span>
                              </td>

                              <td>
                                <span className="attendance-branch-cell">
                                  {data.branchName}
                                </span>
                              </td>

                              <td>
                                <div className="attendance-action-cell">
                                  {state.actionRequired && (
                                    <span className="attendance-action-warning">
                                      Review required
                                    </span>
                                  )}

                                  {!state.actionRequired &&
                                    state.exceptionState === 'clear' && (
                                      <span className="attendance-action-clear">
                                        <CheckCircle2
                                          size={12}
                                          aria-hidden="true"
                                        />
                                        Clear
                                      </span>
                                    )}

                                  <button
                                    type="button"
                                    className={`action-inspect-btn ${
                                      selected ? 'active' : ''
                                    }`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedStaffId(state.staffId);
                                    }}
                                    aria-label={`View ${state.staffName}`}
                                  >
                                    View
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </ModuleTable>
                  )}
                </ModuleDataGridFrame>

                {filteredRows.length > 0 && (
                  <ModulePagination
                    startRecord={startIndex + 1}
                    endRecord={Math.min(
                      startIndex + pageRows.length,
                      filteredRows.length,
                    )}
                    totalItems={filteredRows.length}
                    entityLabel="staff"
                    pageSize={pageSize}
                    pageSizeOptions={[10, 25, 50]}
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    prevPageAriaLabel="Previous Attendance page"
                    nextPageAriaLabel="Next Attendance page"
                    testId="attendance-pagination"
                  />
                )}
              </ModulePrimaryCard>
            </ModulePrimaryColumn>

            <ModuleInspectorColumn>
              <AttendanceInspector
                row={selectedRow}
                branchName={data.branchName}
                timezone={data.timezone}
              />
            </ModuleInspectorColumn>
          </ModuleMainGrid>
        </>
      )}
    </ModuleWorkspace>
  );
}
