import { useState, useEffect, useCallback } from 'react';
import { Banknote, Calendar, User, Loader2 } from 'lucide-react';
import type { AuthContext } from '../../types/auth';
import type {
  CashierTab,
  CashierOverviewData,
  PayableOrdersResponseData,
  CashierLedgerResponseData,
  CashierDrawersResponseData,
  DayCloseSummaryData,
  HistoryTabSummary,
  PayableOrderOption,
} from '../../types/cashier';
import {
  fetchCashierOverview,
  fetchPayableOrders,
  fetchCashierLedger,
  fetchCashierDrawers,
  fetchDayClose,
  fetchCashierHistory,
} from '../../lib/cashier-service';
import {
  ModuleWorkspace,
  ModuleHeader,
  ModuleTabs,
  ModuleErrorBanner,
  type ModuleTabItem,
} from '../workspace';
import { useWorkspaceModuleLifecycle } from '../workspace/useWorkspaceLifecycle';
import { CashierTodayTab } from './tabs/CashierTodayTab';
import { FinancialLedgerTab } from './tabs/FinancialLedgerTab';
import { CashDrawerTab } from './tabs/CashDrawerTab';
import { DayCloseTab } from './tabs/DayCloseTab';
import { CashierHistoryTab } from './tabs/CashierHistoryTab';
import { RecordPaymentModal } from './modals/RecordPaymentModal';
import { RecordExpenseModal } from './modals/RecordExpenseModal';
import {
  OpenSessionModal,
  HandoverSessionModal,
  CloseSessionModal,
  CashAdjustmentModal,
} from './modals/CashSessionModals';
import './cashier.css';

const CASHIER_TABS: Array<ModuleTabItem<CashierTab>> = [
  { id: 'today', label: 'Today' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'drawers', label: 'Cash Drawer' },
  { id: 'day-close', label: 'Day Close' },
  { id: 'history', label: 'History' },
];

interface CashierWorkspaceProps {
  authContext: AuthContext;
}

export function CashierWorkspace({ authContext }: CashierWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<CashierTab>('today');
  const [overview, setOverview] = useState<CashierOverviewData | null>(null);
  const [payableData, setPayableData] =
    useState<PayableOrdersResponseData | null>(null);
  const [ledgerData, setLedgerData] =
    useState<CashierLedgerResponseData | null>(null);
  const [drawersData, setDrawersData] =
    useState<CashierDrawersResponseData | null>(null);
  const [dayCloseData, setDayCloseData] = useState<DayCloseSummaryData | null>(
    null,
  );
  const [historyData, setHistoryData] = useState<HistoryTabSummary | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Modals state
  const [orderToPay, setOrderToPay] = useState<PayableOrderOption | null>(null);
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] =
    useState<boolean>(false);
  const [isOpenSessionOpen, setIsOpenSessionOpen] = useState<boolean>(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState<boolean>(false);
  const [isCloseSessionOpen, setIsCloseSessionOpen] = useState<boolean>(false);
  const [adjustmentState, setAdjustmentState] = useState<{
    isOpen: boolean;
    type: 'cash_addition' | 'cash_removal';
  }>({ isOpen: false, type: 'cash_addition' });

  // Workspace lifecycle integration
  const { invalidationGeneration } = useWorkspaceModuleLifecycle();

  const loadTodayData = useCallback(async (options?: { rethrow?: boolean }) => {
    try {
      const [overviewRes, payableRes, drawersRes] = await Promise.all([
        fetchCashierOverview(),
        fetchPayableOrders(),
        fetchCashierDrawers(),
      ]);
      setOverview(overviewRes);
      setPayableData(payableRes);
      setDrawersData(drawersRes);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to load Cashier workspace.';
      setErrorMessage(msg);
      if (options?.rethrow) {
        throw err;
      }
    }
  }, []);

  const loadTabData = useCallback(
    async (tab: CashierTab) => {
      try {
        switch (tab) {
          case 'today':
            await loadTodayData();
            break;
          case 'ledger': {
            const result = await fetchCashierLedger();
            setLedgerData(result);
            break;
          }
          case 'drawers': {
            const result = await fetchCashierDrawers();
            setDrawersData(result);
            break;
          }
          case 'day-close': {
            const result = await fetchDayClose();
            setDayCloseData(result);
            break;
          }
          case 'history': {
            setHistoryError(null);
            try {
              const result = await fetchCashierHistory();
              setHistoryData(result);
            } catch (err: unknown) {
              const msg =
                err instanceof Error
                  ? err.message
                  : 'Failed to load historical records.';
              setHistoryError(msg);
              setHistoryData(null);
              setErrorMessage(msg);
            }
            break;
          }
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Failed to load tab data.';
        setErrorMessage(msg);
      }
    },
    [loadTodayData],
  );

  // Initial load
  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (!isMounted) return;
      void loadTodayData().finally(() => {
        if (isMounted) setIsLoading(false);
      });
    });
    return () => {
      isMounted = false;
    };
  }, [loadTodayData, invalidationGeneration]);

  // Load tab data on switch
  const handleTabChange = (nextTab: CashierTab) => {
    setActiveTab(nextTab);
    void loadTabData(nextTab);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadTodayData(), loadTabData(activeTab)]);
    setIsRefreshing(false);
  };

  const handleTransactionSuccess = async () => {
    // Refresh today's queue and KPIs, plus current active tab
    await Promise.all([
      loadTodayData({ rethrow: true }),
      activeTab !== 'today' ? loadTabData(activeTab) : Promise.resolve(),
    ]);
  };

  const businessDate =
    overview?.businessDate ?? new Date().toISOString().split('T')[0];
  const activeSession =
    drawersData?.activeSessions?.[0] ?? overview?.activeDrawerSession ?? null;
  const availableDrawers =
    drawersData?.availableDrawers ??
    payableData?.accounts.filter((a) => a.accountType === 'cash_drawer') ??
    [];
  const staffOptions = drawersData?.staffOptions ?? [];

  return (
    <ModuleWorkspace
      ariaLabel="Cashier workspace"
      testId="cashier-workspace"
      className="cashier-container"
    >
      <ModuleHeader
        title="Cashier"
        subtitle={`Payments, expenses and cash management for ${authContext.branchName}.`}
        brandIcon={<Banknote size={20} />}
        metaBadges={
          <>
            <div
              className="bookings-header-meta-badge"
              title="Authoritative Business Date"
            >
              <Calendar size={13} className="text-emerald-800" />
              <span>{businessDate}</span>
            </div>
            <div
              className="bookings-header-meta-badge"
              title="Cashier Operator"
            >
              <User size={13} className="text-emerald-800" />
              <span>{authContext.fullName}</span>
            </div>
          </>
        }
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        refreshTitle="Refresh authoritative Cashier data"
        refreshAriaLabel="Refresh authoritative Cashier data"
        testId="cashier-header"
      />

      <ModuleTabs<CashierTab>
        tabs={CASHIER_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        ariaLabel="Cashier workspace tabs"
        tabTestIdPrefix="cashier-tab"
      />

      {errorMessage && (
        <ModuleErrorBanner
          message={errorMessage}
          onRetry={handleRefresh}
          testId="cashier-error-banner"
        />
      )}

      {/* Main Tab Content */}
      <main id="cashier-tab-content">
        {isLoading ? (
          <div className="cashier-card p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="text-emerald-700 animate-spin" />
            <span className="text-sm font-medium text-slate-600">
              Loading authoritative financial workspace...
            </span>
          </div>
        ) : (
          <>
            {activeTab === 'today' && (
              <CashierTodayTab
                overview={overview}
                payableData={payableData}
                onSelectOrderToPay={(order) => setOrderToPay(order)}
                onOpenRecordExpense={() => setIsRecordExpenseOpen(true)}
                onOpenDrawerSession={() => setIsOpenSessionOpen(true)}
                onNavigateToTab={(tab) => handleTabChange(tab)}
              />
            )}

            {activeTab === 'ledger' && (
              <FinancialLedgerTab
                branchName={authContext.branchName}
                initialLedger={ledgerData}
              />
            )}

            {activeTab === 'drawers' && (
              <CashDrawerTab
                activeSession={activeSession}
                availableDrawers={availableDrawers}
                onOpenSessionModal={() => setIsOpenSessionOpen(true)}
                onOpenHandoverModal={() => setIsHandoverOpen(true)}
                onOpenCloseModal={() => setIsCloseSessionOpen(true)}
                onOpenAdjustmentModal={(type) =>
                  setAdjustmentState({ isOpen: true, type })
                }
              />
            )}

            {activeTab === 'day-close' && (
              <DayCloseTab
                dayCloseData={dayCloseData}
                onNavigateToDrawers={() => handleTabChange('drawers')}
              />
            )}

            {activeTab === 'history' && (
              <CashierHistoryTab
                historyData={historyData}
                loadError={historyError}
                onRetry={() => handleTabChange('history')}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {orderToPay && (
        <RecordPaymentModal
          key={orderToPay.id}
          isOpen={true}
          order={orderToPay}
          accounts={payableData?.accounts ?? []}
          onClose={() => setOrderToPay(null)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {isRecordExpenseOpen && (
        <RecordExpenseModal
          isOpen={true}
          categories={drawersData?.expenseCategories ?? []}
          accounts={payableData?.accounts ?? []}
          businessDate={businessDate}
          onClose={() => setIsRecordExpenseOpen(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {isOpenSessionOpen && (
        <OpenSessionModal
          isOpen={true}
          availableDrawers={availableDrawers}
          onClose={() => setIsOpenSessionOpen(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {isHandoverOpen && (
        <HandoverSessionModal
          isOpen={true}
          session={activeSession}
          staffOptions={staffOptions}
          onClose={() => setIsHandoverOpen(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {isCloseSessionOpen && (
        <CloseSessionModal
          isOpen={true}
          session={activeSession}
          onClose={() => setIsCloseSessionOpen(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {adjustmentState.isOpen && (
        <CashAdjustmentModal
          isOpen={true}
          session={activeSession}
          entryType={adjustmentState.type}
          onClose={() =>
            setAdjustmentState({ isOpen: false, type: 'cash_addition' })
          }
          onSuccess={handleTransactionSuccess}
        />
      )}
    </ModuleWorkspace>
  );
}
