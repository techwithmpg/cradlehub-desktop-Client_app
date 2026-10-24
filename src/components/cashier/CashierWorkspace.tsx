import { useState, useEffect, useCallback } from 'react';
import {
  Banknote,
  CalendarCheck,
  BookOpen,
  Archive,
  ClipboardCheck,
  History,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
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

  const loadTodayData = useCallback(async () => {
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
            const result = await fetchCashierHistory();
            setHistoryData(result);
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
    await Promise.all([loadTodayData(), loadTabData(activeTab)]);
  };

  const userInitials = authContext.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
    <div className="cashier-container" data-testid="cashier-workspace">
      {/* Header */}
      <header className="cashier-header">
        <div className="cashier-title-bar">
          <div className="cashier-title-group">
            <div className="cashier-brand-icon">
              <Banknote size={22} aria-hidden="true" />
            </div>
            <div>
              <h1 className="cashier-title">Cashier</h1>
              <p className="cashier-subtitle">
                {authContext.branchName} • Payments, expenses and cash
                management
              </p>
            </div>
          </div>

          <div className="cashier-header-badges">
            <button
              type="button"
              className="btn-secondary-compact flex items-center gap-1.5 text-xs"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              title="Refresh authoritative Cashier data"
            >
              <RefreshCw
                size={13}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              <span>Refresh</span>
            </button>

            <div className="cashier-pill-badge">
              <Building2 size={14} className="text-emerald-800" />
              <span>{authContext.branchName}</span>
            </div>

            <div className="cashier-pill-badge">
              <Calendar size={14} className="text-emerald-800" />
              <span>{businessDate}</span>
            </div>

            <div className="cashier-pill-badge">
              <div className="cashier-user-avatar">{userInitials}</div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-xs leading-none">
                  {authContext.fullName}
                </span>
                <span className="text-2xs text-slate-500 capitalize leading-none mt-0.5">
                  Front Desk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <nav
          className="cashier-tabs-strip"
          role="tablist"
          aria-label="Cashier workspace tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'today'}
            className={`cashier-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => handleTabChange('today')}
          >
            <CalendarCheck size={16} />
            <span>Today</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ledger'}
            className={`cashier-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => handleTabChange('ledger')}
          >
            <BookOpen size={16} />
            <span>Ledger</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'drawers'}
            className={`cashier-tab-btn ${activeTab === 'drawers' ? 'active' : ''}`}
            onClick={() => handleTabChange('drawers')}
          >
            <Archive size={16} />
            <span>Cash Drawer</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'day-close'}
            className={`cashier-tab-btn ${activeTab === 'day-close' ? 'active' : ''}`}
            onClick={() => handleTabChange('day-close')}
          >
            <ClipboardCheck size={16} />
            <span>Day Close</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            className={`cashier-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <History size={16} />
            <span>History</span>
          </button>
        </nav>
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div className="cashier-notice-banner warning" role="alert">
          <AlertCircle size={16} className="text-amber-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
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
              <CashierHistoryTab historyData={historyData} />
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
    </div>
  );
}
