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
  createBranchBooking,
  computeBookingEndTime,
  getTodayDateString,
  formatCurrency,
} from '../../lib/bookings-service';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  onBookingCreated: () => void;
}

const MODES: Array<{
  value: QuickBookingMode;
  label: string;
  description: string;
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
    description: 'Therapist goes to customer.',
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

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  branchId,
  branchName,
  onBookingCreated,
}) => {
  const [mode, setMode] = useState<QuickBookingMode>('walkin');
  const [services, setServices] = useState<QuickBookingOptionService[]>([]);
  const [staffList, setStaffList] = useState<QuickBookingOptionStaff[]>([]);
  const [resourceList, setResourceList] = useState<
    QuickBookingOptionResource[]
  >([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

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
  const [date, setDate] = useState(() => getTodayDateString());
  const [startTime, setStartTime] = useState(() => getCurrentQuarterTime());
  const [notes, setNotes] = useState('');

  // Home Service fields
  const [homeServiceAddress, setHomeServiceAddress] = useState('');
  const [homeServiceBarangay, setHomeServiceBarangay] = useState('');
  const [homeServiceCity, setHomeServiceCity] = useState('');

  // Payment fields
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Submission & Validation State
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const searchDebounceRef = useRef<number | null>(null);

  // Reset form to canonical defaults
  const resetForm = () => {
    setMode('walkin');
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    setIsSearchingCustomers(false);
    setFullName('');
    setPhone('');
    setEmail('');
    setStaffId('');
    setResourceId('');
    setDate(getTodayDateString());
    setStartTime(getCurrentQuarterTime());
    setNotes('');
    setHomeServiceAddress('');
    setHomeServiceBarangay('');
    setHomeServiceCity('');
    setPaymentReceived(true);
    setPaymentMethod('cash');
    setErrorMessage(null);
    setShowDiscardConfirm(false);
    if (services.length > 0) {
      setSelectedServiceIds([services[0].id]);
    } else {
      setSelectedServiceIds([]);
    }
  };

  // Load branch options when modal opens
  useEffect(() => {
    if (!isOpen || !branchId) return;

    let isMounted = true;
    fetchBranchBookingOptions(branchId)
      .then((opts) => {
        if (!isMounted) return;
        setServices(opts.services);
        setStaffList(opts.staff);
        setResourceList(opts.resources);
        if (opts.services.length > 0) {
          setSelectedServiceIds((prev) =>
            prev.length === 0 ? [opts.services[0].id] : prev,
          );
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setErrorMessage(`Failed to load booking options: ${msg}`);
      })
      .finally(() => {
        if (isMounted) setIsLoadingOptions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, branchId]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Debounced customer search triggered on input change
  const handleCustomerSearchChange = (query: string) => {
    setCustomerSearchQuery(query);
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    if (
      !query.trim() ||
      query.trim().length < 2 ||
      selectedCustomer?.full_name === query
    ) {
      setCustomerSearchResults([]);
      setIsSearchingCustomers(false);
      return;
    }

    setIsSearchingCustomers(true);
    searchDebounceRef.current = window.setTimeout(() => {
      searchBranchCustomers(query)
        .then((results) => {
          setCustomerSearchResults(results);
        })
        .catch(() => {
          setCustomerSearchResults([]);
        })
        .finally(() => {
          setIsSearchingCustomers(false);
        });
    }, 250);
  };

  // Handle Mode Change
  const handleModeChange = (newMode: QuickBookingMode) => {
    setMode(newMode);
    if (newMode === 'walkin') {
      setDate(getTodayDateString());
      setStartTime(getCurrentQuarterTime());
      setPaymentReceived(true);
      setPaymentMethod('cash');
    } else if (newMode === 'home_service') {
      setResourceId('');
      setPaymentReceived(false);
      setPaymentMethod('');
    } else {
      setPaymentReceived(false);
      setPaymentMethod('');
    }
  };

  // Toggle service selection
  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== serviceId);
      }
      if (prev.length >= 5) return prev; // Max 5 services
      return [...prev, serviceId];
    });
  };

  // Customer selection
  const handleSelectCustomer = (customer: BookingCustomer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery(customer.full_name);
    setFullName(customer.full_name);
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setCustomerSearchResults([]);
  };

  const handleClearCustomer = () => {
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
    if (!startTime) return '--:--';
    return computeBookingEndTime(startTime, totalDurationMinutes || 60).slice(
      0,
      5,
    );
  }, [startTime, totalDurationMinutes]);

  // Is form dirty?
  const isDirty = useMemo(() => {
    const isServiceChanged =
      selectedServiceIds.length > 1 ||
      (services.length > 0 && selectedServiceIds[0] !== services[0]?.id);
    return (
      fullName.trim() !== '' ||
      phone.trim() !== '' ||
      email.trim() !== '' ||
      notes.trim() !== '' ||
      homeServiceAddress.trim() !== '' ||
      selectedCustomer !== null ||
      staffId !== '' ||
      resourceId !== '' ||
      isServiceChanged
    );
  }, [
    fullName,
    phone,
    email,
    notes,
    homeServiceAddress,
    selectedCustomer,
    staffId,
    resourceId,
    selectedServiceIds,
    services,
  ]);

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      resetForm();
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    resetForm();
    onClose();
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate
    if (!fullName.trim()) {
      setErrorMessage("Please enter the customer's full name.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setErrorMessage('Please enter a valid phone number (at least 7 digits).');
      return;
    }
    if (selectedServiceIds.length === 0) {
      setErrorMessage('Please select at least one service.');
      return;
    }
    if (!date) {
      setErrorMessage('Please select a booking date.');
      return;
    }
    if (!startTime) {
      setErrorMessage('Please select a start time.');
      return;
    }
    if (mode === 'home_service' && !homeServiceAddress.trim()) {
      setErrorMessage('Please enter the home-service destination address.');
      return;
    }
    if (paymentReceived && !paymentMethod) {
      setErrorMessage('Please select a payment method.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await createBranchBooking({
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
        endTime: calculatedEndTime,
        totalDurationMinutes,
        totalPrice,
        mode,
        paymentReceived,
        paymentMethod: paymentReceived ? paymentMethod : undefined,
        notes: notes.trim() || undefined,
        homeServiceAddress:
          mode === 'home_service' ? homeServiceAddress.trim() : undefined,
        homeServiceBarangay:
          mode === 'home_service'
            ? homeServiceBarangay.trim() || undefined
            : undefined,
        homeServiceCity:
          mode === 'home_service'
            ? homeServiceCity.trim() || undefined
            : undefined,
      });

      if (!res.ok) {
        setErrorMessage(res.error || 'Failed to create booking.');
        return;
      }

      // Success
      onBookingCreated();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

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
              Schedule or record a walk-in, phone, or home-service booking.
            </p>
          </div>
          <button
            type="button"
            className="new-booking-close-btn"
            onClick={handleRequestClose}
            aria-label="Close modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {/* Mode Selector Tabs */}
        <div className="new-booking-mode-tabs" role="tablist">
          {MODES.map((m) => {
            const isActive = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`new-booking-mode-tab ${isActive ? 'active' : ''}`}
                onClick={() => handleModeChange(m.value)}
              >
                <span className="mode-tab-label">{m.label}</span>
                <span className="mode-tab-desc">{m.description}</span>
              </button>
            );
          })}
        </div>

        {/* Write Boundary Notice */}
        <div
          className="new-booking-write-boundary-notice"
          role="note"
          data-testid="write-boundary-notice"
        >
          <div className="notice-badge">Hosted Write Boundary Required</div>
          <p className="notice-text">
            Desktop booking creation is currently disabled pending owner
            authorization of a hosted API endpoint. Real branch service catalog,
            staff provider capabilities, and pricing are previewed
            authoritatively.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="new-booking-error-banner"
            role="alert"
            data-testid="new-booking-error"
          >
            <AlertCircle size={16} className="error-icon" aria-hidden="true" />
            <div className="error-message">{errorMessage}</div>
            <button
              type="button"
              className="error-dismiss-btn"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
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
              ) : (
                <div className="services-selection-grid">
                  {services.map((srv) => {
                    const isSelected = selectedServiceIds.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        className={`service-option-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleService(srv.id)}
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
                    onChange={(e) => setStaffId(e.target.value)}
                  >
                    <option value="">Any Available Therapist</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.nickname ? `(${st.nickname})` : ''}
                      </option>
                    ))}
                  </select>
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
                      onChange={(e) => setResourceId(e.target.value)}
                    >
                      <option value="">First Available Room</option>
                      {resourceList.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.name} {res.type ? `· ${res.type}` : ''}
                        </option>
                      ))}
                    </select>
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
                      Payment Method
                    </label>
                    <select
                      id="payment-method-select"
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
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
                    'Any Available'}
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
                      'First Available'}
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
                {paymentReceived ? (
                  <span className="status-tag paid">
                    ✓ Paid ({paymentMethod.toUpperCase()})
                  </span>
                ) : (
                  <span className="status-tag pending">⏳ Payment Pending</span>
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
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="new-booking-submit-btn"
            onClick={handleSubmit}
            disabled={isSaving || isLoadingOptions}
          >
            {isSaving ? (
              <>
                <span className="spinner" />
                <span>Saving Booking...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>
                  {mode === 'walkin'
                    ? 'Save Walk-in'
                    : mode === 'home_service'
                      ? 'Create Home Service'
                      : 'Schedule Booking'}
                </span>
              </>
            )}
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
