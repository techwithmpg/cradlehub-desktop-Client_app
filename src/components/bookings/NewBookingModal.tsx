import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  User,
  CreditCard,
  AlertCircle,
  Sparkles,
  Building2,
  Calendar,
  Check,
} from 'lucide-react';
import type {
  QuickBookingMode,
  QuickBookingOptionService,
  QuickBookingOptionStaff,
  QuickBookingOptionResource,
  BookingCustomer,
} from '../../types/bookings';
import {
  fetchBranchBookingOptions,
  searchBranchCustomers,
  getCustomerLookupUnavailableReason,
  CustomerLookupUnavailableError,
  computeBookingEndTime,
  getTodayDateString,
  formatCurrency,
  createBranchBooking,
} from '../../lib/bookings-service';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  onBookingCreated: (result: { bookingId: string; warning?: string }) => void;
}

const MODES: Array<{
  value: QuickBookingMode;
  label: string;
  description: string;
  disabled?: boolean;
  disabledReason?: string;
}> = [
  {
    value: 'walkin',
    label: 'Walk-in',
    description: 'Customer is at the branch.',
  },
  {
    value: 'phone',
    label: 'Phone',
    description: 'Booked by call or message.',
  },
  {
    value: 'standard_future',
    label: 'Future',
    description: 'Scheduled in-spa booking.',
  },
  {
    value: 'home_service',
    label: 'Home Service',
    description: 'Precise location support required',
    disabled: true,
    disabledReason:
      'Home Service booking will be enabled after precise address/location support is connected.',
  },
];

function getCurrentQuarterTime(): string {
  const now = new Date();
  const mins = now.getMinutes();
  const roundedMins = Math.ceil(mins / 15) * 15;
  now.setMinutes(roundedMins, 0, 0);
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Unmount on close; key by branch so old options and async work cannot leak.
export const NewBookingModal: React.FC<NewBookingModalProps> = (props) =>
  props.isOpen ? <BookingPreview key={props.branchId} {...props} /> : null;

const BookingPreview: React.FC<NewBookingModalProps> = ({
  onClose,
  branchId,
  branchName,
  onBookingCreated,
}) => {
  const [defaults] = useState(() => ({
    date: getTodayDateString(),
    startTime: getCurrentQuarterTime(),
  }));
  const [defaultServiceIds, setDefaultServiceIds] = useState<string[]>([]);
  const [mode, setMode] = useState<QuickBookingMode>('walkin');
  const [services, setServices] = useState<QuickBookingOptionService[]>([]);
  const [staffList, setStaffList] = useState<QuickBookingOptionStaff[]>([]);
  const [resourceList, setResourceList] = useState<
    QuickBookingOptionResource[]
  >([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(!!branchId);

  // Form Fields
  const [selectedCustomer, setSelectedCustomer] =
    useState<BookingCustomer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<
    BookingCustomer[]
  >([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [date, setDate] = useState(defaults.date);
  const [startTime, setStartTime] = useState(defaults.startTime);
  const [notes, setNotes] = useState('');

  // Home Service fields
  const [homeServiceAddress, setHomeServiceAddress] = useState('');
  const [homeServiceBarangay, setHomeServiceBarangay] = useState('');
  const [homeServiceCity, setHomeServiceCity] = useState('');

  // Payment fields: canonical hosted defaults to payment NOT received
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{
    message: string;
    code?: string;
  } | null>(null);
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(
    branchId ? null : 'Booking options unavailable: no branch selected.',
  );
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const searchDebounceRef = useRef<number | null>(null);

  const searchVersion = useRef(0);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [lookupUnavailableError, setLookupUnavailableError] = useState<
    string | null
  >(null);
  const lookupUnavailableReason =
    lookupUnavailableError ?? getCustomerLookupUnavailableReason();

  // Load branch options when modal opens
  useEffect(() => {
    if (!branchId) return;

    let isMounted = true;
    fetchBranchBookingOptions(branchId)
      .then((opts) => {
        if (!isMounted) return;
        setServices(opts.services);
        setStaffList(opts.staff);
        setResourceList(opts.resources);
        const first = opts.services.find(
          (service) => service.availableInSpa === true,
        );
        const ids = first ? [first.id] : [];
        setSelectedServiceIds(ids);
        setDefaultServiceIds(ids);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setOptionsError(`Failed to load booking options: ${msg}`);
      })
      .finally(() => {
        if (isMounted) setIsLoadingOptions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      searchVersion.current += 1;
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const cancelCustomerSearch = () => {
    searchVersion.current += 1;
    if (searchDebounceRef.current)
      window.clearTimeout(searchDebounceRef.current);
    setCustomerSearchResults([]);
    setIsSearchingCustomers(false);
    setSearchError(null);
    setSearchCompleted(false);
  };

  const handleCustomerSearchChange = (query: string) => {
    if (lookupUnavailableReason) return;
    cancelCustomerSearch();
    setCustomerSearchQuery(query);
    if (selectedCustomer && query !== selectedCustomer.full_name)
      setSelectedCustomer(null);
    if (query.trim().length < 2 || selectedCustomer?.full_name === query)
      return;
    const version = searchVersion.current;
    setIsSearchingCustomers(true);
    searchDebounceRef.current = window.setTimeout(() => {
      searchBranchCustomers(branchId, query)
        .then((results) => {
          if (version !== searchVersion.current) return;
          setCustomerSearchResults(results);
          setSearchCompleted(true);
        })
        .catch((error: unknown) => {
          if (version !== searchVersion.current) return;
          if (error instanceof CustomerLookupUnavailableError) {
            setLookupUnavailableError(error.message);
            return;
          }
          setSearchError('Customer search unavailable. Please try again.');
        })
        .finally(() => {
          if (version === searchVersion.current) setIsSearchingCustomers(false);
        });
    }, 250);
  };

  const servicesForMode = (nextMode: QuickBookingMode) =>
    services.filter((service) =>
      nextMode === 'home_service'
        ? service.availableHomeService === true
        : service.availableInSpa === true,
    );
  const visibleServices = servicesForMode(mode);
  // Explicit capabilities for every service are a conservative subset of hosted
  // in-spa staff-type/category inference. This does not verify time availability.
  const providersForServices = (ids: string[]) =>
    ids.length === 0
      ? []
      : staffList.filter((staff) =>
          ids.every((id) => staff.serviceIds?.includes(id)),
        );
  const eligibleStaff = providersForServices(selectedServiceIds);
  const updateServiceSelection = (ids: string[]) => {
    setSelectedServiceIds(ids);
    if (!providersForServices(ids).some((staff) => staff.id === staffId))
      setStaffId('');
  };
  const handleModeChange = (newMode: QuickBookingMode) => {
    const allowed = servicesForMode(newMode);
    const kept = selectedServiceIds.filter((id) =>
      allowed.some((service) => service.id === id),
    );
    updateServiceSelection(
      kept.length ? kept : allowed.length ? [allowed[0].id] : [],
    );
    setMode(newMode);
    if (newMode === 'home_service') setResourceId('');
    setPaymentReceived(false);
    setPaymentMethod('');
  };
  const handleToggleService = (serviceId: string) => {
    if (!visibleServices.some((service) => service.id === serviceId)) return;
    if (selectedServiceIds.includes(serviceId)) {
      if (selectedServiceIds.length > 1)
        updateServiceSelection(
          selectedServiceIds.filter((id) => id !== serviceId),
        );
    } else if (selectedServiceIds.length < 5)
      updateServiceSelection([...selectedServiceIds, serviceId]);
  };

  // Customer selection
  const handleSelectCustomer = (customer: BookingCustomer) => {
    cancelCustomerSearch();
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.full_name);
    setFullName(customer.full_name);
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setCustomerSearchResults([]);
  };

  const handleClearCustomer = () => {
    cancelCustomerSearch();
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setFullName('');
    setPhone('');
    setEmail('');
    setCustomerSearchResults([]);
  };

  // Calculations
  const selectedServices = useMemo(() => {
    return selectedServiceIds
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is QuickBookingOptionService => Boolean(s));
  }, [selectedServiceIds, services]);

  const totalDurationMinutes = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const calculatedEndTime = useMemo(() => {
    if (!startTime || !totalDurationMinutes) return '--:--';
    return computeBookingEndTime(startTime, totalDurationMinutes).slice(0, 5);
  }, [startTime, totalDurationMinutes]);

  // Compare exact meaningful values with this opening's canonical defaults.
  const isDirty =
    mode !== 'walkin' ||
    selectedCustomer !== null ||
    customerSearchQuery !== '' ||
    fullName !== '' ||
    phone !== '' ||
    email !== '' ||
    notes !== '' ||
    homeServiceAddress !== '' ||
    homeServiceBarangay !== '' ||
    homeServiceCity !== '' ||
    staffId !== '' ||
    resourceId !== '' ||
    date !== defaults.date ||
    startTime !== defaults.startTime ||
    paymentReceived !== false ||
    paymentMethod !== '' ||
    JSON.stringify(selectedServiceIds) !== JSON.stringify(defaultServiceIds);
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      isSubmitting ||
      isLoadingOptions ||
      Boolean(optionsError) ||
      selectedServiceIds.length === 0 ||
      fullName.trim().length < 2 ||
      phone.trim().length < 7 ||
      (paymentReceived && !paymentMethod) ||
      (mode === 'home_service' && !homeServiceCity.trim())
    ) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitWarning(null);

    try {
      const result = await createBranchBooking({
        branchId,
        customerId: selectedCustomer?.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        serviceIds: selectedServiceIds,
        staffId: staffId || undefined,
        resourceId:
          mode === 'home_service' ? undefined : resourceId || undefined,
        date,
        startTime,
        totalDurationMinutes,
        totalPrice,
        mode,
        paymentReceived,
        paymentMethod: paymentReceived ? paymentMethod : undefined,
        notes: notes.trim() || undefined,
      });

      if (result.ok && result.bookingId) {
        onBookingCreated({
          bookingId: result.bookingId,
          warning: result.warning,
        });
        onClose();
      } else {
        setSubmitError({
          message: result.error || 'Failed to create booking.',
          code: result.code,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSubmitError({
        message: `Booking creation failed: ${msg}`,
        code: 'CLIENT_ERROR',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestClose = () => {
    if (isSubmitting) return;
    if (isDirty) setShowDiscardConfirm(true);
    else onClose();
  };
  const handleConfirmDiscard = () => onClose();

  return (
    <div
      className="new-booking-modal-overlay"
      data-testid="new-booking-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-booking-title"
    >
      <div className="new-booking-modal-card">
        {/* Modal Header */}
        <header className="new-booking-modal-header">
          <div className="new-booking-header-meta">
            <div className="new-booking-title-row">
              <h2 id="new-booking-title" className="new-booking-title">
                New Booking
              </h2>
              <span className="new-booking-branch-badge">
                <Building2 size={12} aria-hidden="true" />
                {branchName}
              </span>
            </div>
            <p className="new-booking-subtitle">
              Create a new booking for this branch.
            </p>
          </div>
          <button
            type="button"
            className="new-booking-close-btn"
            onClick={handleRequestClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {/* Mode Selector Tabs */}
        <div className="new-booking-mode-tabs" role="tablist">
          {MODES.map((m) => {
            const isActive = mode === m.value;
            const isDisabled = m.disabled || isLoadingOptions || isSubmitting;
            return (
              <button
                key={m.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-disabled={m.disabled ? 'true' : undefined}
                title={m.disabledReason}
                className={`new-booking-mode-tab ${isActive ? 'active' : ''} ${m.disabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (!m.disabled) handleModeChange(m.value);
                }}
                disabled={isDisabled}
              >
                <span className="mode-tab-label">{m.label}</span>
                <span className="mode-tab-desc">{m.description}</span>
              </button>
            );
          })}
        </div>

        {submitError && (
          <div
            className="new-booking-error-banner"
            role="alert"
            data-testid="booking-submit-error"
          >
            <AlertCircle size={16} className="error-icon" aria-hidden="true" />
            <div className="error-message">
              {submitError.code ? <strong>{submitError.code}: </strong> : null}
              {submitError.message}
            </div>
            <button
              type="button"
              className="error-dismiss-btn"
              onClick={() => setSubmitError(null)}
              aria-label="Dismiss error"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}
        {submitWarning && (
          <div
            className="new-booking-error-banner"
            role="status"
            data-testid="booking-submit-warning"
          >
            <AlertCircle size={16} aria-hidden="true" />
            <span className="error-message">{submitWarning}</span>
          </div>
        )}
        {optionsError && (
          <div
            className="new-booking-error-banner"
            role="alert"
            data-testid="booking-options-error"
          >
            <AlertCircle size={16} aria-hidden="true" />
            {optionsError}
          </div>
        )}

        {/* Modal Body: 2 Columns */}
        <form className="new-booking-body-grid" onSubmit={handleSubmit}>
          {/* Left Column: Form Controls */}
          <div className="new-booking-form-col">
            {/* 1. Customer Section */}
            <section className="booking-form-section">
              <div className="section-header">
                <User size={15} className="section-icon" aria-hidden="true" />
                <h3 className="section-title">Customer Information</h3>
              </div>

              {/* Customer Lookup Search */}
              <div className="form-group customer-lookup-group">
                <label className="form-label" htmlFor="customer-search-input">
                  Search Existing Customer (or enter new below)
                </label>
                <div className="customer-search-input-wrapper">
                  <Search
                    size={14}
                    className="search-icon"
                    aria-hidden="true"
                  />
                  <input
                    id="customer-search-input"
                    disabled={!!lookupUnavailableReason}
                    aria-describedby={
                      lookupUnavailableReason
                        ? 'customer-lookup-unavailable'
                        : undefined
                    }
                    type="text"
                    className="form-input search-input"
                    placeholder="Search by name or phone..."
                    value={customerSearchQuery}
                    onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  />
                  {isSearchingCustomers && (
                    <span className="search-loading-hint">Searching...</span>
                  )}
                  {selectedCustomer && (
                    <button
                      type="button"
                      className="clear-customer-btn"
                      onClick={handleClearCustomer}
                      title="Clear customer selection"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {lookupUnavailableReason && (
                  <p
                    id="customer-lookup-unavailable"
                    role="status"
                    className="summary-subtext"
                  >
                    {lookupUnavailableReason}
                  </p>
                )}
                {searchError && <p role="alert">{searchError}</p>}
                {searchCompleted &&
                  !isSearchingCustomers &&
                  !searchError &&
                  customerSearchResults.length === 0 && (
                    <p role="status">No matching customers.</p>
                  )}
                {/* Autocomplete Results Dropdown */}
                {customerSearchResults.length > 0 && (
                  <div className="customer-autocomplete-dropdown">
                    {customerSearchResults.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        className="customer-autocomplete-item"
                        onClick={() => handleSelectCustomer(cust)}
                      >
                        <span className="cust-name">{cust.full_name}</span>
                        <span className="cust-phone">
                          {cust.phone || 'No phone'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="customer-fullname">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="customer-fullname"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Maria Santos"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="customer-phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 09171234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="customer-email">
                  Email <span className="optional">(Optional)</span>
                </label>
                <input
                  id="customer-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. maria@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </section>

            {/* 2. Services Selection */}
            <section className="booking-form-section">
              <div className="section-header">
                <Sparkles
                  size={15}
                  className="section-icon"
                  aria-hidden="true"
                />
                <h3 className="section-title">
                  Select Services <span className="required">*</span>
                </h3>
              </div>

              {isLoadingOptions ? (
                <div className="options-loading-text">Loading services...</div>
              ) : optionsError ? (
                <p>Service options unavailable.</p>
              ) : visibleServices.length === 0 ? (
                <p>No eligible services for this branch and mode.</p>
              ) : (
                <div className="services-selection-grid">
                  {visibleServices.map((srv) => {
                    const isSelected = selectedServiceIds.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        className={`service-option-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleService(srv.id)}
                        aria-pressed={isSelected}
                      >
                        <div className="service-card-top">
                          <span className="service-name">{srv.name}</span>
                          <span className="service-check">
                            {isSelected && <Check size={14} />}
                          </span>
                        </div>
                        <div className="service-card-bottom">
                          <span className="service-duration">
                            {srv.durationMinutes} mins
                          </span>
                          <span className="service-price">
                            {formatCurrency(srv.price)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 3. Therapist & Resource / Location */}
            <section className="booking-form-section">
              <div className="section-header">
                <User size={15} className="section-icon" aria-hidden="true" />
                <h3 className="section-title">Therapist & Room</h3>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="staff-select">
                    Assigned Therapist
                  </label>
                  <select
                    id="staff-select"
                    className="form-select"
                    value={staffId}
                    disabled={
                      isLoadingOptions ||
                      !!optionsError ||
                      eligibleStaff.length === 0
                    }
                    onChange={(e) => setStaffId(e.target.value)}
                  >
                    <option value="">No provider selected</option>
                    {eligibleStaff.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.nickname ? `(${st.nickname})` : ''}
                      </option>
                    ))}
                  </select>
                  {!isLoadingOptions &&
                    (optionsError ? (
                      <p>Provider options unavailable.</p>
                    ) : eligibleStaff.length === 0 ? (
                      <p>No eligible providers for the selected services.</p>
                    ) : null)}
                </div>

                {mode !== 'home_service' ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="resource-select">
                      Room / Resource
                    </label>
                    <select
                      id="resource-select"
                      className="form-select"
                      value={resourceId}
                      disabled={
                        isLoadingOptions ||
                        !!optionsError ||
                        resourceList.length === 0
                      }
                      onChange={(e) => setResourceId(e.target.value)}
                    >
                      <option value="">No resource selected</option>
                      {resourceList.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.name} {res.type ? `· ${res.type}` : ''}
                        </option>
                      ))}
                    </select>
                    {!isLoadingOptions &&
                      (optionsError ? (
                        <p>Resource options unavailable.</p>
                      ) : resourceList.length === 0 ? (
                        <p>No active resources for this branch.</p>
                      ) : null)}
                  </div>
                ) : null}

                {mode === 'home_service' ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="hs-city">
                      City / Area <span className="required">*</span>
                    </label>
                    <input
                      id="hs-city"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Quezon City"
                      value={homeServiceCity}
                      onChange={(e) => setHomeServiceCity(e.target.value)}
                      required={mode === 'home_service'}
                    />
                  </div>
                ) : null}
              </div>

              {mode === 'home_service' && (
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="hs-address">
                      Destination Address <span className="required">*</span>
                    </label>
                    <input
                      id="hs-address"
                      type="text"
                      className="form-input"
                      placeholder="Unit / House No., Street, Subdivision"
                      value={homeServiceAddress}
                      onChange={(e) => setHomeServiceAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="hs-barangay">
                      Barangay / Landmark{' '}
                      <span className="optional">(Optional)</span>
                    </label>
                    <input
                      id="hs-barangay"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Brgy. San Antonio"
                      value={homeServiceBarangay}
                      onChange={(e) => setHomeServiceBarangay(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 4. Schedule (Date & Time) */}
            <section className="booking-form-section">
              <div className="section-header">
                <Calendar
                  size={15}
                  className="section-icon"
                  aria-hidden="true"
                />
                <h3 className="section-title">Date & Time</h3>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="booking-date">
                    Booking Date <span className="required">*</span>
                  </label>
                  <input
                    id="booking-date"
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="booking-start-time">
                    Start Time <span className="required">*</span>
                  </label>
                  <input
                    id="booking-start-time"
                    type="time"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            {/* 5. Payment & Notes */}
            <section className="booking-form-section">
              <div className="section-header">
                <CreditCard
                  size={15}
                  className="section-icon"
                  aria-hidden="true"
                />
                <h3 className="section-title">Payment & Notes</h3>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={paymentReceived}
                      onChange={(e) => setPaymentReceived(e.target.checked)}
                    />
                    <span>Payment Received in Advance</span>
                  </label>
                </div>

                {paymentReceived && (
                  <div className="form-group">
                    <label
                      className="form-label"
                      htmlFor="payment-method-select"
                    >
                      Payment Method <span className="required">*</span>
                    </label>
                    <select
                      id="payment-method-select"
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required={paymentReceived}
                    >
                      <option value="">Select payment method...</option>
                      <option value="cash">Cash</option>
                      <option value="gcash">GCash</option>
                      <option value="maya">Maya</option>
                      <option value="card">Debit/Credit Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="booking-notes">
                  Special Notes / Instructions
                </label>
                <textarea
                  id="booking-notes"
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Focus on neck/shoulders; customer prefers light pressure"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </section>
          </div>

          {/* Right Column: Live Booking Summary */}
          <aside className="new-booking-summary-col">
            <div className="summary-sticky-card">
              <h4 className="summary-card-title">Booking Summary</h4>

              <div className="summary-item-row">
                <span className="summary-label">Mode</span>
                <span className="summary-badge">{mode.toUpperCase()}</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-item-row">
                <span className="summary-label">Customer</span>
                <span className="summary-value font-medium">
                  {fullName || 'No name entered'}
                </span>
              </div>
              {phone && <div className="summary-subtext">{phone}</div>}

              <div className="summary-divider" />

              <div className="summary-section-label">SERVICES</div>
              {selectedServices.length > 0 ? (
                <div className="summary-services-list">
                  {selectedServices.map((s, idx) => (
                    <div key={s.id} className="summary-service-row">
                      <span className="service-row-name">
                        {idx + 1}. {s.name}
                      </span>
                      <span className="service-row-price">
                        {formatCurrency(s.price)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="summary-subtext">No services selected</div>
              )}

              <div className="summary-divider" />

              <div className="summary-item-row">
                <span className="summary-label">Total Duration</span>
                <span className="summary-value font-semibold">
                  {totalDurationMinutes} mins
                </span>
              </div>

              <div className="summary-item-row">
                <span className="summary-label">Estimated Schedule</span>
                <span className="summary-value">
                  {startTime} – {calculatedEndTime}
                </span>
              </div>

              <div className="summary-divider" />

              <div className="summary-item-row">
                <span className="summary-label">Therapist</span>
                <span className="summary-value">
                  {staffList.find((st) => st.id === staffId)?.name ||
                    'No provider selected'}
                </span>
              </div>

              <div className="summary-item-row">
                <span className="summary-label">
                  {mode === 'home_service' ? 'Destination' : 'Room'}
                </span>
                <span className="summary-value">
                  {mode === 'home_service'
                    ? homeServiceCity || 'Address required'
                    : resourceList.find((r) => r.id === resourceId)?.name ||
                      'No resource selected'}
                </span>
              </div>

              <div className="summary-divider" />

              <div className="summary-total-row">
                <span className="total-label">Total Amount</span>
                <span className="total-amount">
                  {formatCurrency(totalPrice)}
                </span>
              </div>

              <div className="summary-payment-status">
                {paymentReceived && paymentMethod ? (
                  <span className="status-tag paid">
                    Payment received ({paymentMethod.toUpperCase()})
                  </span>
                ) : paymentReceived ? (
                  <span className="status-tag pending">
                    Payment received (Method required)
                  </span>
                ) : (
                  <span className="status-tag pending">Payment pending</span>
                )}
              </div>
            </div>
          </aside>
        </form>

        {/* Modal Footer */}
        <footer className="new-booking-modal-footer">
          <button
            type="button"
            className="new-booking-cancel-btn"
            onClick={handleRequestClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="new-booking-submit-btn"
            disabled={
              isSubmitting ||
              isLoadingOptions ||
              Boolean(optionsError) ||
              selectedServiceIds.length === 0 ||
              fullName.trim().length < 2 ||
              phone.trim().length < 7 ||
              (paymentReceived && !paymentMethod) ||
              (mode === 'home_service' && !homeServiceCity.trim())
            }
            onClick={handleSubmit}
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>
              {isSubmitting ? 'Creating Booking...' : 'Create Booking'}
            </span>
          </button>
        </footer>
      </div>

      {/* Discard Confirmation Dialog */}
      {showDiscardConfirm && (
        <div className="discard-confirm-backdrop">
          <div className="discard-confirm-box">
            <h4 className="discard-title">Discard unfinished booking?</h4>
            <p className="discard-desc">
              You have unsaved booking details. Discarding will lose all entered
              information.
            </p>
            <div className="discard-actions">
              <button
                type="button"
                className="discard-keep-btn"
                onClick={() => setShowDiscardConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="discard-confirm-btn"
                onClick={handleConfirmDiscard}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
