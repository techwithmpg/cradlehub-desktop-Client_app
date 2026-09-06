import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AuthContext } from '../../types/auth';
import type {
  CustomerDetail,
  CustomerKpis,
  CustomerListItem,
  CustomerPagination,
  CustomerTabType,
  WaitlistFollowupItem,
} from '../../types/customers';
import {
  fetchBranchCustomers,
  fetchCustomerDetail,
} from '../../lib/customers-service';
import { CustomersHeader } from './CustomersHeader';
import { CustomersKpiSummary } from './CustomersKpiSummary';
import { CustomersListCard } from './CustomersListCard';
import { CustomerInspectorCard } from './CustomerInspectorCard';

interface CustomersViewProps {
  authContext: AuthContext;
}

const INITIAL_KPIS: CustomerKpis = {
  totalCustomers: 0,
  repeatClients: 0,
  lapsedClients: 0,
  newThisMonth: 0,
  totalVisits: 0,
};

const INITIAL_PAGINATION: CustomerPagination = {
  page: 1,
  pageSize: 25,
  totalCount: 0,
  totalPages: 1,
};

export const CustomersView: React.FC<CustomersViewProps> = ({
  authContext,
}) => {
  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<CustomerTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection State
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerListItem | null>(null);
  const [selectedWaitlistItem, setSelectedWaitlistItem] =
    useState<WaitlistFollowupItem | null>(null);

  // List Data State
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [waitlistItems, setWaitlistItems] = useState<WaitlistFollowupItem[]>(
    [],
  );
  const [kpis, setKpis] = useState<CustomerKpis>(INITIAL_KPIS);
  const [pagination, setPagination] =
    useState<CustomerPagination>(INITIAL_PAGINATION);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Customer Detail State
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(
    null,
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Async Safety Refs
  const listVersionRef = useRef(0);
  const detailVersionRef = useRef(0);
  const searchDebounceRef = useRef<number | null>(null);

  // Debounce search input
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(1);
    }, 250);
  };

  const handleResetSearch = () => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    setSearchQuery('');
    setDebouncedQuery('');
    setCurrentPage(1);
  };

  const handleTabChange = (tab: CustomerTabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedCustomer(null);
    setSelectedWaitlistItem(null);
    setCustomerDetail(null);
  };

  const handleKpiClick = (tab: CustomerTabType) => {
    handleTabChange(tab);
  };

  // Fetch List Data
  const fetchList = useCallback(
    async (isRefresh = false) => {
      listVersionRef.current += 1;
      const currentVersion = listVersionRef.current;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingList(true);
      }
      setListError(null);

      try {
        const res = await fetchBranchCustomers({
          branchId: authContext.branchId,
          tab: activeTab,
          q: debouncedQuery,
          page: currentPage,
          pageSize,
        });

        if (currentVersion !== listVersionRef.current) return;

        if (!res.ok) {
          setListError(res.message);
          setCustomers([]);
          setWaitlistItems([]);
          setSelectedCustomer(null);
          setSelectedWaitlistItem(null);
          setCustomerDetail(null);
          setDetailError(null);
          setKpis(INITIAL_KPIS);
          setPagination(INITIAL_PAGINATION);
          return;
        }

        const customerList = res.data || [];
        const waitlistList = res.waitlist || [];
        setCustomers(customerList);
        setWaitlistItems(waitlistList);
        if (res.kpis) {
          setKpis(res.kpis);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }

        // Auto-select first item or maintain selection if present
        if (activeTab === 'followup') {
          setSelectedWaitlistItem((prev) => {
            if (prev) {
              const found = waitlistList.find((item) => item.id === prev.id);
              return (
                found || (waitlistList.length > 0 ? waitlistList[0] : null)
              );
            }
            return waitlistList.length > 0 ? waitlistList[0] : null;
          });
          setSelectedCustomer(null);
        } else {
          setSelectedCustomer((prev) => {
            if (prev) {
              const found = customerList.find((item) => item.id === prev.id);
              return (
                found || (customerList.length > 0 ? customerList[0] : null)
              );
            }
            return customerList.length > 0 ? customerList[0] : null;
          });
          setSelectedWaitlistItem(null);
        }
      } catch (err: unknown) {
        if (currentVersion !== listVersionRef.current) return;
        const msg =
          err instanceof Error ? err.message : 'Failed to load customers';
        setListError(msg);
        setCustomers([]);
        setWaitlistItems([]);
        setSelectedCustomer(null);
        setSelectedWaitlistItem(null);
        setCustomerDetail(null);
        setDetailError(null);
        setKpis(INITIAL_KPIS);
        setPagination(INITIAL_PAGINATION);
      } finally {
        if (currentVersion === listVersionRef.current) {
          setIsLoadingList(false);
          setIsRefreshing(false);
        }
      }
    },
    [authContext.branchId, activeTab, debouncedQuery, currentPage, pageSize],
  );

  // Trigger list fetch when branch, tab, query, or pagination changes
  useEffect(() => {
    let isMounted = true;
    listVersionRef.current += 1;
    const currentVersion = listVersionRef.current;

    void (async () => {
      try {
        const res = await fetchBranchCustomers({
          branchId: authContext.branchId,
          tab: activeTab,
          q: debouncedQuery,
          page: currentPage,
          pageSize,
        });

        if (!isMounted || currentVersion !== listVersionRef.current) return;

        if (!res.ok) {
          setListError(res.message);
          setCustomers([]);
          setWaitlistItems([]);
          setSelectedCustomer(null);
          setSelectedWaitlistItem(null);
          setCustomerDetail(null);
          setDetailError(null);
          setKpis(INITIAL_KPIS);
          setPagination(INITIAL_PAGINATION);
          return;
        }

        const customerList = res.data || [];
        const waitlistList = res.waitlist || [];
        setCustomers(customerList);
        setWaitlistItems(waitlistList);
        if (res.kpis) {
          setKpis(res.kpis);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }

        if (activeTab === 'followup') {
          setSelectedWaitlistItem((prev) => {
            if (prev) {
              const found = waitlistList.find((item) => item.id === prev.id);
              return (
                found || (waitlistList.length > 0 ? waitlistList[0] : null)
              );
            }
            return waitlistList.length > 0 ? waitlistList[0] : null;
          });
          setSelectedCustomer(null);
        } else {
          setSelectedCustomer((prev) => {
            if (prev) {
              const found = customerList.find((item) => item.id === prev.id);
              return (
                found || (customerList.length > 0 ? customerList[0] : null)
              );
            }
            return customerList.length > 0 ? customerList[0] : null;
          });
          setSelectedWaitlistItem(null);
        }
      } catch (err: unknown) {
        if (!isMounted || currentVersion !== listVersionRef.current) return;
        const msg =
          err instanceof Error ? err.message : 'Failed to load customers';
        setListError(msg);
        setCustomers([]);
        setWaitlistItems([]);
        setSelectedCustomer(null);
        setSelectedWaitlistItem(null);
        setCustomerDetail(null);
        setDetailError(null);
        setKpis(INITIAL_KPIS);
        setPagination(INITIAL_PAGINATION);
      } finally {
        if (isMounted && currentVersion === listVersionRef.current) {
          setIsLoadingList(false);
          setIsRefreshing(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [authContext.branchId, activeTab, debouncedQuery, currentPage, pageSize]);

  // Fetch Customer Detail when selectedCustomer changes
  useEffect(() => {
    if (!selectedCustomer) return;

    let isMounted = true;
    detailVersionRef.current += 1;
    const currentVersion = detailVersionRef.current;

    void (async () => {
      setIsLoadingDetail(true);
      setDetailError(null);
      setCustomerDetail(null);

      try {
        const res = await fetchCustomerDetail(
          selectedCustomer.id,
          authContext.branchId,
        );

        if (!isMounted || currentVersion !== detailVersionRef.current) return;

        if (!res.ok) {
          setDetailError(res.message);
          setCustomerDetail(null);
          return;
        }

        setCustomerDetail({
          ...res.customer,
          bookingHistory: res.bookingHistory || [],
        });
      } catch (err: unknown) {
        if (!isMounted || currentVersion !== detailVersionRef.current) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to load customer details';
        setDetailError(msg);
        setCustomerDetail(null);
      } finally {
        if (isMounted && currentVersion === detailVersionRef.current) {
          setIsLoadingDetail(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedCustomer, authContext.branchId]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const handleSelectCustomer = (customer: CustomerListItem) => {
    setSelectedCustomer(customer);
    setSelectedWaitlistItem(null);
    setCustomerDetail(null);
    setDetailError(null);
  };

  const handleSelectWaitlistItem = (item: WaitlistFollowupItem) => {
    setSelectedWaitlistItem(item);
    setSelectedCustomer(null);
    setCustomerDetail(null);
    setDetailError(null);
  };

  const handleCloseInspector = () => {
    setSelectedCustomer(null);
    setSelectedWaitlistItem(null);
    setCustomerDetail(null);
    setDetailError(null);
  };

  const selectedId = selectedWaitlistItem
    ? selectedWaitlistItem.id
    : selectedCustomer
      ? selectedCustomer.id
      : null;

  return (
    <div
      className="bookings-view-container customers-view-container"
      data-testid="customers-view"
    >
      {/* 1. Header */}
      <CustomersHeader
        onRefresh={() => void fetchList(true)}
        isRefreshing={isRefreshing}
      />

      {/* 2. Authoritative Error State */}
      {listError ? (
        <div
          className="workspace-placeholder customers-unavailable-card"
          role="alert"
          aria-live="assertive"
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
          <h3 className="placeholder-title">Customer Service Unavailable</h3>
          <p className="placeholder-desc">{listError}</p>
          <button
            type="button"
            className="bookings-empty-reset-btn"
            style={{ marginTop: '16px' }}
            onClick={() => void fetchList(true)}
          >
            Retry Request
          </button>
        </div>
      ) : isLoadingList ? (
        /* Loading Skeleton */
        <div
          className="bookings-loading-state"
          aria-busy="true"
          aria-label="Loading customers"
          data-testid="customers-skeleton"
        >
          <div className="bookings-skeleton-kpi" />
          <div className="bookings-skeleton-body-grid">
            <div className="bookings-skeleton-list" />
            <div className="bookings-skeleton-inspector" />
          </div>
        </div>
      ) : (
        <>
          {/* 3. KPI Summary Strip */}
          <CustomersKpiSummary
            kpis={kpis}
            activeTab={activeTab}
            onKpiClick={handleKpiClick}
          />

          {/* 4. Main Two-Column Layout */}
          <div className="bookings-main-grid">
            <div className="bookings-list-column">
              <CustomersListCard
                activeTab={activeTab}
                onTabChange={handleTabChange}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onResetSearch={handleResetSearch}
                customers={customers}
                waitlistItems={waitlistItems}
                selectedId={selectedId}
                onSelectCustomer={handleSelectCustomer}
                onSelectWaitlistItem={handleSelectWaitlistItem}
                pagination={pagination}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(ps) => {
                  setPageSize(ps);
                  setCurrentPage(1);
                }}
                isLoading={isLoadingList}
              />
            </div>

            <div className="bookings-inspector-column">
              <CustomerInspectorCard
                selectedCustomer={selectedCustomer}
                selectedWaitlistItem={selectedWaitlistItem}
                customerDetail={customerDetail}
                isLoadingDetail={isLoadingDetail}
                detailError={detailError}
                onClose={handleCloseInspector}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
