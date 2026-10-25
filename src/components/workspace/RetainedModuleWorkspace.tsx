import { Fragment, memo, type ReactNode } from 'react';
import { Settings } from 'lucide-react';
import type { AuthContext, NavModuleId } from '../../types/auth';
import { AUTHORIZED_NAV_ITEMS } from '../../lib/navigation';
import { WorkspaceModulePresence } from './WorkspaceLifecycle';
import { useWorkspaceModuleLifecycle } from './useWorkspaceLifecycle';
import { TodayView } from '../today/TodayView';
import { BookingsView } from '../bookings/BookingsView';
import { AttendanceView } from '../attendance/AttendanceView';
import { CustomersView } from '../customers/CustomersView';
import { ScheduleView } from '../schedule/ScheduleView';
import { HomeServiceView } from '../home-service/HomeServiceView';
import { StaffView } from '../staff/StaffView';
import { CashierWorkspace } from '../cashier/CashierWorkspace';
import { OperationsWorkspace } from '../operations/OperationsWorkspace';

interface RetainedModuleWorkspaceProps {
  authContext: AuthContext;
  activeModule: NavModuleId;
  visitedModules: ReadonlySet<NavModuleId>;
  onNavigate: (module: NavModuleId) => void;
}

interface RetainedModuleFrameProps {
  moduleId: NavModuleId;
  active: boolean;
  authContext: AuthContext;
  onNavigate: (module: NavModuleId) => void;
}

/**
 * Today and Bookings implement the full workspace lifecycle and reconcile
 * authoritative data without losing their local UI state.
 *
 * Other modules are retained normally, but use their invalidation generation
 * as a remount boundary. Because hidden modules do not subscribe to lifecycle
 * changes, an invalidated legacy module remounts only when it is activated
 * again. Normal navigation therefore preserves its UI state and avoids a
 * network reload.
 */
const LIFECYCLE_AWARE_MODULES: ReadonlySet<NavModuleId> = new Set([
  'today',
  'bookings',
  'cashier',
  'operations',
]);

function GenerationAwareRetainedContent({ children }: { children: ReactNode }) {
  const { invalidationGeneration } = useWorkspaceModuleLifecycle();

  return <Fragment key={invalidationGeneration}>{children}</Fragment>;
}

const RetainedModuleFrame = memo(function RetainedModuleFrame({
  moduleId,
  active,
  authContext,
  onNavigate,
}: RetainedModuleFrameProps) {
  let content: ReactNode;

  switch (moduleId) {
    case 'today':
      content = <TodayView authContext={authContext} onNavigate={onNavigate} />;
      break;

    case 'bookings':
      content = <BookingsView authContext={authContext} />;
      break;

    case 'attendance':
      content = <AttendanceView authContext={authContext} />;
      break;

    case 'customers':
      content = <CustomersView authContext={authContext} />;
      break;

    case 'schedule':
      content = <ScheduleView authContext={authContext} />;
      break;

    case 'home-service':
      content = <HomeServiceView authContext={authContext} />;
      break;

    case 'staff':
      content = <StaffView authContext={authContext} />;
      break;

    case 'cashier':
      content = <CashierWorkspace authContext={authContext} />;
      break;

    case 'operations':
      content = (
        <OperationsWorkspace
          authContext={authContext}
          onNavigate={onNavigate}
        />
      );
      break;

    case 'settings':
      content = (
        <>
          <div className="workspace-page-header">
            <h1 className="workspace-page-title">Settings</h1>
          </div>

          <div
            className="workspace-placeholder"
            data-testid="module-unavailable-panel"
          >
            <div className="placeholder-icon-wrapper" aria-hidden="true">
              <Settings size={24} className="placeholder-icon" />
            </div>

            <h2 className="placeholder-title">Settings</h2>

            <p className="placeholder-desc">
              This module is not yet available in the desktop client.
            </p>
          </div>
        </>
      );
      break;
  }

  const renderedContent = LIFECYCLE_AWARE_MODULES.has(moduleId) ? (
    content
  ) : (
    <GenerationAwareRetainedContent>{content}</GenerationAwareRetainedContent>
  );

  return (
    <WorkspaceModulePresence moduleId={moduleId} isActive={active}>
      <div
        data-testid={`retained-module-${moduleId}`}
        data-module-id={moduleId}
        hidden={!active}
        aria-hidden={!active}
      >
        {renderedContent}
      </div>
    </WorkspaceModulePresence>
  );
});

export function RetainedModuleWorkspace({
  authContext,
  activeModule,
  visitedModules,
  onNavigate,
}: RetainedModuleWorkspaceProps) {
  return (
    <>
      {AUTHORIZED_NAV_ITEMS.filter((item) => visitedModules.has(item.id)).map(
        (item) => (
          <RetainedModuleFrame
            key={item.id}
            moduleId={item.id}
            active={item.id === activeModule}
            authContext={authContext}
            onNavigate={onNavigate}
          />
        ),
      )}
    </>
  );
}
