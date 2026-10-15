import { memo } from 'react';
import { Settings } from 'lucide-react';
import type { AuthContext, NavModuleId } from '../../types/auth';
import { AUTHORIZED_NAV_ITEMS } from '../../lib/navigation';
import { WorkspaceModulePresence } from './WorkspaceLifecycle';
import { TodayView } from '../today/TodayView';
import { BookingsView } from '../bookings/BookingsView';
import { AttendanceView } from '../attendance/AttendanceView';
import { CustomersView } from '../customers/CustomersView';
import { ScheduleView } from '../schedule/ScheduleView';
import { HomeServiceView } from '../home-service/HomeServiceView';
import { StaffView } from '../staff/StaffView';

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

const RetainedModuleFrame = memo(function RetainedModuleFrame({
  moduleId,
  active,
  authContext,
  onNavigate,
}: RetainedModuleFrameProps) {
  let content;

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

  return (
    <WorkspaceModulePresence moduleId={moduleId} isActive={active}>
      <div
        data-testid={`retained-module-${moduleId}`}
        data-module-id={moduleId}
        hidden={!active}
        aria-hidden={!active}
      >
        {content}
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
