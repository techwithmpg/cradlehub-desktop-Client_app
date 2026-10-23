import React, { useState, useEffect, useMemo, useRef } from 'react';
import cradlehubIcon from '../../assets/brand/cradlehub-icon.png';
import { useModalFocus } from '../../lib/use-modal-focus';
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
  Users,
  Plus,
  Trash2,
  Copy,
  Phone,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorClosed,
  Home,
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

export interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  onBookingCreated: (result: { bookingId: string; warning?: string }) => void;
  initialMode?: QuickBookingMode;
  showFinancialFields?: boolean;
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
    description: 'Now · In branch',
  },
  {
    value: 'phone',
    label: 'Phone',
    description: 'Call or schedule in advance',
  },
  {
    value: 'standard_future',
    label: 'Future',
    description: 'Scheduled in-spa booking',
  },
  {
    value: 'home_service',
    label: 'Home Service',
    description: 'We go to customer',
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

interface GuestDraft {
  id: string;
  name: string;
  serviceIds: string[];
}

export const NewBookingModal: React.FC<NewBookingModalProps> = (props) =>
  props.isOpen ? (
    <BookingPreview
      key={`${props.branchId}-${props.initialMode || 'default'}`}
      {...props}
    />
  ) : null;

const BookingPreview: React.FC<NewBookingModalProps> = ({
  onClose,
  branchId,
  branchName,
  onBookingCreated,
  initialMode,
  showFinancialFields = true,
}) => {
  const openingMode = initialMode || 'walkin';
  const [defaults] = useState(() => ({
    date: getTodayDateString(),
    startTime: getCurrentQuarterTime(),
  }));
  const [defaultServiceIds, setDefaultServiceIds] = useState<string[]>([]);
  const [mode, setMode] = useState<QuickBookingMode>(openingMode);
  const [services, setServices] = useState<QuickBookingOptionService[]>([]);
  const [staffList, setStaffList] = useState<QuickBookingOptionStaff[]>([]);
  const [resourceList, setResourceList] = useState<
    QuickBookingOptionResource[]
  >([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(!!branchId);

  // Customer Form Fields (1 compact card)
  const [selectedCustomer, setSelectedCustomer] =
    useState<BookingCustomer | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Customer Autocomplete Search
  const [customerSearchResults, setCustomerSearchResults] = useState<
    BookingCustomer[]
  >([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [lookupUnavailableError, setLookupUnavailableError] = useState<
    string | null
  >(null);
  const searchVersion = useRef(0);
  const searchDebounceRef = useRef<number | null>(null);

  const lookupUnavailableReason =
    lookupUnavailableError ?? getCustomerLookupUnavailableReason();

  // Guest & Service state
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategory, setServiceCategory] = useState<string>('all');
  const [additionalGuests, setAdditionalGuests] = useState<GuestDraft[]>([]);
  const [guestServiceSearches, setGuestServiceSearches] = useState<
    Record<string, string>
  >({});
  const [guestCategories, setGuestCategories] = useState<
    Record<string, string>
  >({});

  const guest1CarouselRef = useRef<HTMLDivElement>(null);
  const guestCarouselRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const organizerIdRef = useRef(crypto.randomUUID());
  const groupAttemptRef = useRef<{ fingerprint: string; key: string } | null>(
    null,
  );

  // Staff & Resource overrides
  const [staffId, setStaffId] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [date, setDate] = useState(defaults.date);
  const [startTime, setStartTime] = useState(defaults.startTime);

  // Home Service fields
  const [homeServiceAddress, setHomeServiceAddress] = useState('');
  const [homeServiceCity, setHomeServiceCity] = useState('');

  // Payment fields
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<{
    message: string;
    code?: string;
  } | null>(null);
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(
    branchId ? null : 'Booking options unavailable: no branch selected.',
  );
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

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
        const first = opts.services.find((s) => s.availableInSpa === true);
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

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (selectedCustomer && val !== selectedCustomer.full_name) {
      setSelectedCustomer(null);
    }
    if (lookupUnavailableReason) return;
    cancelCustomerSearch();
    if (val.trim().length < 2 || selectedCustomer?.full_name === val) {
      setCustomerSearchResults([]);
      return;
    }
    const version = searchVersion.current;
    setIsSearchingCustomers(true);
    searchDebounceRef.current = window.setTimeout(() => {
      searchBranchCustomers(branchId, val.trim())
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

  const handleSelectCustomer = (customer: BookingCustomer) => {
    cancelCustomerSearch();
    setSelectedCustomer(customer);
    setFullName(customer.full_name);
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setCustomerSearchResults([]);
  };

  const handleClearCustomer = () => {
    cancelCustomerSearch();
    setSelectedCustomer(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setCustomerSearchResults([]);
  };

  const servicesForMode = (nextMode: QuickBookingMode) =>
    services.filter((service) =>
      nextMode === 'home_service'
        ? service.availableHomeService === true
        : service.availableInSpa === true,
    );
  const visibleServices = servicesForMode(mode);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    visibleServices.forEach((s) => {
      if (s.category && s.category.trim()) cats.add(s.category.trim());
    });
    return Array.from(cats);
  }, [visibleServices]);

  const providersForServices = (ids: string[]) =>
    ids.length === 0
      ? []
      : staffList.filter((staff) =>
          ids.every((id) => staff.serviceIds?.includes(id)),
        );
  const eligibleStaff = providersForServices(selectedServiceIds);

  const updateServiceSelection = (ids: string[]) => {
    setSelectedServiceIds(ids);
    if (!providersForServices(ids).some((staff) => staff.id === staffId)) {
      setStaffId('');
    }
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
      if (selectedServiceIds.length > 1) {
        updateServiceSelection(
          selectedServiceIds.filter((id) => id !== serviceId),
        );
      }
    } else if (selectedServiceIds.length < 5) {
      updateServiceSelection([...selectedServiceIds, serviceId]);
    }
  };

  const addGuest = (copyServices = false) => {
    if (additionalGuests.length >= 3) return;
    setAdditionalGuests((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: '',
        serviceIds: copyServices ? [...selectedServiceIds] : [],
      },
    ]);
  };

  const clearAllGuestServices = () => {
    updateServiceSelection([]);
    setAdditionalGuests((current) =>
      current.map((guest) => ({ ...guest, serviceIds: [] })),
    );
  };

  const updateGuest = (id: string, change: Partial<GuestDraft>) => {
    setAdditionalGuests((current) =>
      current.map((guest) =>
        guest.id === id ? { ...guest, ...change } : guest,
      ),
    );
  };

  const toggleGuestService = (id: string, serviceId: string) => {
    if (!visibleServices.some((service) => service.id === serviceId)) return;
    setAdditionalGuests((current) =>
      current.map((guest) => {
        if (guest.id !== id) return guest;
        const serviceIds = guest.serviceIds.includes(serviceId)
          ? guest.serviceIds.filter((selectedId) => selectedId !== serviceId)
          : guest.serviceIds.length < 5
            ? [...guest.serviceIds, serviceId]
            : guest.serviceIds;
        return { ...guest, serviceIds };
      }),
    );
  };

  const scrollCarousel = (
    carouselRef: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right',
  ) => {
    if (carouselRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
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

  const guest1Service = useMemo(() => {
    return services.find((s) => s.id === selectedServiceIds[0]);
  }, [selectedServiceIds, services]);
  const guest1Duration = guest1Service?.durationMinutes ?? totalDurationMinutes;
  const guest1Price = guest1Service?.price ?? 0;

  const totalPrice = useMemo(() => {
    return [
      selectedServiceIds,
      ...additionalGuests.map((guest) => guest.serviceIds),
    ]
      .flat()
      .reduce(
        (sum, id) =>
          sum + (services.find((service) => service.id === id)?.price ?? 0),
        0,
      );
  }, [selectedServiceIds, additionalGuests, services]);

  const allGuests = [
    { id: 'organizer', name: fullName, serviceIds: selectedServiceIds },
    ...additionalGuests,
  ];

  const groupValid = additionalGuests.every(
    (guest) => guest.name.trim().length >= 2 && guest.serviceIds.length > 0,
  );

  const filteredServicesForGuest1 = useMemo(() => {
    return visibleServices.filter((service) => {
      const matchCat =
        serviceCategory === 'all' || service.category === serviceCategory;
      const matchSearch =
        !serviceSearch ||
        service.name.toLowerCase().includes(serviceSearch.trim().toLowerCase());
      return matchCat && matchSearch;
    });
  }, [visibleServices, serviceCategory, serviceSearch]);

  const getFilteredServicesForGuest = (guestId: string) => {
    const cat = guestCategories[guestId] || 'all';
    const query = guestServiceSearches[guestId] || '';
    return visibleServices.filter((service) => {
      const matchCat = cat === 'all' || service.category === cat;
      const matchSearch =
        !query ||
        service.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchCat && matchSearch;
    });
  };

  const getGuestService = (guest: GuestDraft) => {
    return services.find((s) => s.id === guest.serviceIds[0]);
  };
  const getGuestDuration = (guest: GuestDraft) => {
    const s = getGuestService(guest);
    return s?.durationMinutes ?? 0;
  };
  const getGuestEndTime = (guest: GuestDraft) => {
    const dur = getGuestDuration(guest);
    if (!startTime || !dur) return '--:--';
    return computeBookingEndTime(startTime, dur).slice(0, 5);
  };

  const getDurationOptions = (dur: number) => {
    const set = new Set([30, 60, 90, 120]);
    if (dur > 0) set.add(dur);
    return Array.from(set).sort((a, b) => a - b);
  };

  const calculatedEndTime = useMemo(() => {
    if (!startTime || !totalDurationMinutes) return '--:--';
    return computeBookingEndTime(startTime, totalDurationMinutes).slice(0, 5);
  }, [startTime, totalDurationMinutes]);

  const isDirty =
    mode !== openingMode ||
    selectedCustomer !== null ||
    fullName !== '' ||
    phone !== '' ||
    email !== '' ||
    notes !== '' ||
    homeServiceAddress !== '' ||
    homeServiceCity !== '' ||
    staffId !== '' ||
    resourceId !== '' ||
    date !== defaults.date ||
    startTime !== defaults.startTime ||
    additionalGuests.length > 0 ||
    (showFinancialFields &&
      (paymentReceived !== false || paymentMethod !== '')) ||
    JSON.stringify(selectedServiceIds) !== JSON.stringify(defaultServiceIds);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      submittingRef.current ||
      isSubmitting ||
      isLoadingOptions ||
      Boolean(optionsError) ||
      selectedServiceIds.length === 0 ||
      !groupValid ||
      fullName.trim().length < 2 ||
      phone.trim().length < 7 ||
      (showFinancialFields && paymentReceived && !paymentMethod) ||
      mode === 'home_service'
    ) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitWarning(null);

    try {
      const serviceIds = [
        ...new Set(allGuests.flatMap((guest) => guest.serviceIds)),
      ];
      const groupDetails =
        additionalGuests.length > 0
          ? {
              bookingFor: 'me_and_others' as const,
              attendees: allGuests.map((guest, index) => ({
                id: index === 0 ? organizerIdRef.current : guest.id,
                name: guest.name.trim(),
                isOrganizer: index === 0,
                serviceIds: guest.serviceIds,
              })),
            }
          : {};
      const fingerprint = JSON.stringify({
        branchId,
        customerId: selectedCustomer?.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        serviceIds,
        date,
        startTime,
        mode,
        notes: notes.trim(),
        groupDetails,
      });
      if (
        additionalGuests.length > 0 &&
        groupAttemptRef.current?.fingerprint !== fingerprint
      ) {
        groupAttemptRef.current = { fingerprint, key: crypto.randomUUID() };
      }
      const result = await createBranchBooking({
        branchId,
        customerId: selectedCustomer?.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        serviceIds,
        ...groupDetails,
        idempotencyKey:
          additionalGuests.length > 0
            ? groupAttemptRef.current?.key
            : undefined,
        staffId: additionalGuests.length > 0 ? undefined : staffId || undefined,
        resourceId:
          additionalGuests.length > 0 ? undefined : resourceId || undefined,
        date,
        startTime,
        totalDurationMinutes,
        totalPrice,
        mode,
        paymentReceived:
          additionalGuests.length > 0
            ? false
            : showFinancialFields
              ? paymentReceived
              : false,
        paymentMethod:
          additionalGuests.length === 0 &&
          showFinancialFields &&
          paymentReceived
            ? paymentMethod
            : undefined,
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
          message:
            result.code === 'NETWORK_ERROR' || result.code === 'SERVER_ERROR'
              ? `${result.error || 'Booking response unavailable.'} The request may have reached the server. Check the booking workspace before trying again${additionalGuests.length > 0 ? '; this draft will reuse its request key.' : '.'}`
              : result.error || 'Failed to create booking.',
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
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleRequestClose = () => {
    if (isSubmitting) return;
    if (isDirty) setShowDiscardConfirm(true);
    else onClose();
  };
  const handleConfirmDiscard = () => onClose();
  const dialogRef = useModalFocus(true, isSubmitting, () => {
    if (showDiscardConfirm) setShowDiscardConfirm(false);
    else handleRequestClose();
  });

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="new-booking-modal-overlay"
      data-testid="new-booking-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-booking-title"
    >
      <div className="new-booking-modal-card">
        {/* Compact Modal Header */}
        <header className="new-booking-modal-header">
          <img
            className="new-booking-brand-mark"
            src={cradlehubIcon}
            alt=""
            aria-hidden="true"
          />
          <div className="new-booking-header-meta">
            <div className="new-booking-title-row">
              <h2 id="new-booking-title" className="new-booking-title">
                New Booking –{' '}
                {mode === 'walkin'
                  ? 'Walk-in'
                  : mode === 'phone'
                    ? 'Phone'
                    : mode === 'standard_future'
                      ? 'Future'
                      : 'Home Service'}
              </h2>
              <span className="new-booking-branch-badge">
                <Building2 size={12} aria-hidden="true" />
                {branchName}
              </span>
            </div>
            <p className="new-booking-subtitle">
              Cradle Wellness Living • {branchName}
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

        {/* Compact Mode Selector */}
        <div className="new-booking-mode-tabs" role="tablist">
          {MODES.filter((item) => item.value !== 'standard_future').map((m) => {
            if (m.value === 'phone') {
              return (
                <div
                  className={`new-booking-mode-pair ${mode === 'phone' || mode === 'standard_future' ? 'active' : ''}`}
                  key="phone-future"
                >
                  <div className="new-booking-mode-pair-heading">
                    <Phone size={18} aria-hidden="true" />
                    <span>
                      <strong>Phone / Future</strong>
                      <small>Call or schedule in advance</small>
                    </span>
                  </div>
                  <div className="new-booking-mode-pair-actions">
                    {MODES.filter(
                      (item) =>
                        item.value === 'phone' ||
                        item.value === 'standard_future',
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={mode === option.value}
                        className={mode === option.value ? 'active' : ''}
                        disabled={isLoadingOptions || isSubmitting}
                        onClick={() => handleModeChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            const isActive = mode === m.value;
            const isDisabled =
              (m.disabled && mode !== m.value) ||
              isLoadingOptions ||
              isSubmitting;
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
                {m.value === 'walkin' ? (
                  <User size={18} aria-hidden="true" />
                ) : (
                  <Home size={18} aria-hidden="true" />
                )}
                <span className="mode-tab-label">{m.label}</span>
                <span className="mode-tab-desc">{m.description}</span>
              </button>
            );
          })}
        </div>

        {mode === 'home_service' && (
          <div
            className="new-booking-error-banner"
            role="alert"
            data-testid="home-service-disabled-notice"
          >
            <AlertCircle size={16} className="error-icon" aria-hidden="true" />
            <span className="error-message">
              Home Service booking will be enabled after precise
              address/location support is connected.
            </span>
          </div>
        )}

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

        {/* Modal Body: 2 Columns (70% Left Config / 30% Right Summary) */}
        <form className="new-booking-body-grid" onSubmit={handleSubmit}>
          {/* Left Column: Form Controls with Internal Scroll */}
          <div className="new-booking-form-col">
            {/* 1. Customer Information Card */}
            <section className="booking-form-section">
              <div className="section-header booking-customer-header">
                <span className="section-badge-number">1</span>
                <h3 className="section-title">Customer Information</h3>
                {selectedCustomer && (
                  <div className="selected-customer-pill">
                    <span>Existing Customer</span>
                  </div>
                )}
              </div>

              {/* Merged customer search and customer name */}
              <div className="form-group customer-combined-group">
                <label className="form-label" htmlFor="customer-fullname">
                  Customer Full Name <span className="required">*</span>
                </label>
                <div className="customer-search-input-wrapper">
                  <Search
                    size={14}
                    className="search-icon"
                    aria-hidden="true"
                  />
                  <input
                    id="customer-fullname"
                    data-testid="customer-search-input"
                    type="text"
                    className="form-input search-input"
                    placeholder="Search customer / enter customer name (e.g. Maria Santos)"
                    value={fullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    disabled={Boolean(lookupUnavailableReason)}
                    required
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
                  <label className="form-label" htmlFor="customer-phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 09171234567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (
                        selectedCustomer &&
                        e.target.value !== (selectedCustomer.phone || '')
                      ) {
                        setSelectedCustomer(null);
                      }
                    }}
                    required
                  />
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (
                        selectedCustomer &&
                        e.target.value !== (selectedCustomer.email || '')
                      ) {
                        setSelectedCustomer(null);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Customer / Booking Details or Notes inside Customer Information Card */}
              <div className="form-group">
                <label className="form-label" htmlFor="booking-notes">
                  Customer / Booking Details or Notes{' '}
                  <span className="optional">(Optional)</span>
                </label>
                <textarea
                  id="booking-notes"
                  className="form-textarea"
                  rows={2}
                  placeholder="Any special requests, health reminders, or instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Home Service Location when in Home Service */}
              {mode === 'home_service' && (
                <div className="home-service-location-card">
                  <label className="form-label">
                    Home Service Location <span className="required">*</span>
                  </label>
                  <div className="form-row-2">
                    <div className="form-group">
                      <input
                        id="hs-address"
                        type="text"
                        className="form-input"
                        placeholder="Destination Address"
                        value={homeServiceAddress}
                        onChange={(e) => setHomeServiceAddress(e.target.value)}
                        disabled
                      />
                    </div>
                    <div className="form-group">
                      <input
                        id="hs-city"
                        type="text"
                        className="form-input"
                        placeholder="City / Area"
                        value={homeServiceCity}
                        onChange={(e) => setHomeServiceCity(e.target.value)}
                        disabled
                      />
                    </div>
                  </div>
                  <p className="location-unavailable-hint">
                    Precise address and location verification is required for
                    Home Service and will be enabled once connected.
                  </p>
                </div>
              )}
            </section>

            {/* 2. Guests & Services Section — Self-Contained Guest Cards */}
            <section className="booking-form-section booking-guests-section">
              <div className="section-header booking-guests-header">
                <Users size={16} className="section-icon" aria-hidden="true" />
                <div className="booking-guests-title-wrap">
                  <h3 className="section-title">Guests &amp; Services</h3>
                  <p className="booking-section-hint">
                    Add guests, select services, assign therapists and set date
                    &amp; time.
                  </p>
                </div>
                <div className="booking-guests-actions">
                  <button
                    type="button"
                    className="booking-outline-action"
                    onClick={() => addGuest()}
                    disabled={additionalGuests.length >= 3 || isSubmitting}
                  >
                    <Plus size={14} aria-hidden="true" /> Add Guest
                  </button>
                  <button
                    type="button"
                    className="booking-outline-action"
                    onClick={() => addGuest(true)}
                    disabled={additionalGuests.length >= 3 || isSubmitting}
                  >
                    <Copy size={13} aria-hidden="true" /> Copy to Guest
                  </button>
                  <button
                    type="button"
                    className="booking-outline-action"
                    onClick={clearAllGuestServices}
                    disabled={isSubmitting}
                  >
                    <Trash2 size={13} aria-hidden="true" /> Clear All
                  </button>
                </div>
              </div>

              {/* Guest 1: Main Client */}
              <div className="booking-guest-card" key="guest-1">
                <div className="booking-guest-card-header">
                  <span className="booking-guest-number">1</span>
                  <strong>Guest 1</strong>
                  <span className="booking-guest-role">Main client</span>
                  <span className="booking-guest-name">
                    {fullName.trim() || 'Walk-in Guest'}
                  </span>
                </div>

                <div className="booking-guest-content">
                  {/* Service Search & Categories */}
                  <div className="booking-service-header-row">
                    <div className="booking-service-search-wrap">
                      <Search
                        size={14}
                        className="search-icon"
                        aria-hidden="true"
                      />
                      <input
                        id="booking-service-search"
                        className="form-input search-input"
                        type="search"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Search services (e.g. massage, facial, nail, body scrub...)"
                      />
                    </div>
                  </div>

                  {/* Service Categories */}
                  <div className="booking-category-pills">
                    <button
                      type="button"
                      className={`booking-category-pill ${serviceCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setServiceCategory('all')}
                    >
                      All Services
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`booking-category-pill ${serviceCategory === cat ? 'active' : ''}`}
                        onClick={() => setServiceCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Service Carousel */}
                  {isLoadingOptions ? (
                    <div className="options-loading-text">
                      Loading services...
                    </div>
                  ) : optionsError ? (
                    <p className="summary-subtext">
                      Service options unavailable.
                    </p>
                  ) : visibleServices.length === 0 ? (
                    <p className="summary-subtext">
                      No eligible services for this branch and mode.
                    </p>
                  ) : filteredServicesForGuest1.length === 0 ? (
                    <p className="summary-subtext">
                      No services match your search or filter.
                    </p>
                  ) : (
                    <div className="booking-service-carousel-wrapper">
                      <button
                        type="button"
                        className="booking-carousel-nav-btn"
                        onClick={() =>
                          scrollCarousel(guest1CarouselRef, 'left')
                        }
                        aria-label="Previous services"
                      >
                        <ChevronLeft size={16} aria-hidden="true" />
                      </button>
                      <div
                        className="booking-carousel-track"
                        ref={guest1CarouselRef}
                      >
                        {filteredServicesForGuest1.map((srv) => {
                          const isSelected = selectedServiceIds.includes(
                            srv.id,
                          );
                          return (
                            <button
                              key={srv.id}
                              type="button"
                              className={`service-option-card ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleToggleService(srv.id)}
                              aria-pressed={isSelected}
                            >
                              <div className="service-card-top">
                                <span className="booking-service-icon">
                                  {srv.imageUrl ? (
                                    <img
                                      src={srv.imageUrl}
                                      alt=""
                                      className="service-card-thumbnail"
                                    />
                                  ) : (
                                    <Sparkles size={15} aria-hidden="true" />
                                  )}
                                </span>
                                <span className="service-card-name">
                                  {srv.name}
                                </span>
                                {isSelected && (
                                  <span className="service-card-check">
                                    <Check size={12} aria-hidden="true" />
                                  </span>
                                )}
                              </div>
                              <div className="service-card-body">
                                <span className="service-card-desc">
                                  {srv.description ||
                                    srv.category ||
                                    'Professional spa service'}
                                </span>
                              </div>
                              <div className="service-card-bottom">
                                {showFinancialFields && (
                                  <span className="service-card-price">
                                    {formatCurrency(srv.price)}
                                  </span>
                                )}
                                <span className="service-card-duration">
                                  {srv.durationMinutes} min
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        className="booking-carousel-nav-btn"
                        onClick={() =>
                          scrollCarousel(guest1CarouselRef, 'right')
                        }
                        aria-label="Next services"
                      >
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  {/* Guest 1 Controls: Duration, Therapist, Room */}
                  <div className="guest-controls-grid">
                    {/* Duration */}
                    <div className="guest-control-col">
                      <label className="guest-control-label">
                        <Clock size={12} aria-hidden="true" /> Duration
                      </label>
                      <div className="duration-pills-row">
                        {getDurationOptions(guest1Duration).map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            className={`duration-pill-btn ${dur === guest1Duration ? 'active' : ''}`}
                            disabled={dur !== guest1Duration}
                            title={
                              dur === guest1Duration
                                ? `Authoritative duration: ${dur} min`
                                : 'Duration is fixed for this service'
                            }
                          >
                            {dur}m
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Therapist */}
                    <div className="guest-control-col">
                      <label
                        className="guest-control-label"
                        htmlFor="staff-select"
                      >
                        <User size={12} aria-hidden="true" /> Therapist
                      </label>
                      {additionalGuests.length > 0 ? (
                        <div className="guest-assigned-status">
                          Automatic — assigned on save
                        </div>
                      ) : (
                        <select
                          id="staff-select"
                          className="form-select guest-select"
                          value={staffId}
                          disabled={
                            isLoadingOptions ||
                            !!optionsError ||
                            eligibleStaff.length === 0
                          }
                          onChange={(e) => setStaffId(e.target.value)}
                        >
                          <option value="">Auto / Select therapist</option>
                          {eligibleStaff.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} {st.nickname ? `(${st.nickname})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      {!isLoadingOptions &&
                        (optionsError ? (
                          <p className="summary-subtext">
                            Provider options unavailable.
                          </p>
                        ) : eligibleStaff.length === 0 ? (
                          <p className="summary-subtext">
                            No eligible providers for the selected services.
                          </p>
                        ) : null)}
                    </div>

                    {/* Room */}
                    <div className="guest-control-col">
                      <label
                        className="guest-control-label"
                        htmlFor="resource-select"
                      >
                        <DoorClosed size={12} aria-hidden="true" /> Room
                      </label>
                      {mode === 'home_service' ? (
                        <div className="guest-assigned-status">
                          No room (Home Service)
                        </div>
                      ) : additionalGuests.length > 0 ? (
                        <div className="guest-assigned-status">
                          Automatic — assigned on save
                        </div>
                      ) : (
                        <select
                          id="resource-select"
                          className="form-select guest-select"
                          value={resourceId}
                          disabled={
                            isLoadingOptions ||
                            !!optionsError ||
                            resourceList.length === 0
                          }
                          onChange={(e) => setResourceId(e.target.value)}
                        >
                          <option value="">Auto / Select room</option>
                          {resourceList.map((res) => (
                            <option key={res.id} value={res.id}>
                              {res.name} {res.type ? `· ${res.type}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      {!isLoadingOptions &&
                        (optionsError ? (
                          <p className="summary-subtext">
                            Resource options unavailable.
                          </p>
                        ) : resourceList.length === 0 ? (
                          <p className="summary-subtext">
                            No active resources for this branch.
                          </p>
                        ) : null)}
                    </div>
                  </div>

                  {/* Row 2: Date, Start Time, Finish Time & Price */}
                  <div className="guest-controls-row2">
                    <div className="guest-schedule-fields">
                      <label
                        className="guest-control-label"
                        htmlFor="booking-date"
                      >
                        <Calendar size={12} aria-hidden="true" /> Date &amp;
                        Time
                      </label>
                      <div className="guest-datetime-inline">
                        <input
                          id="booking-date"
                          type="date"
                          className="form-input datetime-input"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          readOnly={mode === 'walkin'}
                          required
                        />
                        <input
                          id="booking-start-time"
                          type="time"
                          className="form-input datetime-input"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          readOnly={mode === 'walkin'}
                          required
                        />
                        <div className="guest-finish-calculated">
                          <span className="finish-label">Finish:</span>
                          <span className="finish-time">
                            {calculatedEndTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {showFinancialFields && (
                      <div className="guest-price-summary">
                        <span className="guest-price-amount">
                          {formatCurrency(guest1Price)}
                        </span>
                        <span className="guest-price-note">
                          Service price for {guest1Duration} minutes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Guests (Guest 2, 3, 4) */}
              {additionalGuests.map((guest, index) => {
                const guestDuration = getGuestDuration(guest);
                const guestPrice = getGuestService(guest)?.price ?? 0;
                const guestEndTime = getGuestEndTime(guest);
                const guestFiltered = getFilteredServicesForGuest(guest.id);

                return (
                  <div className="booking-guest-card" key={guest.id}>
                    <div className="booking-guest-card-header guest-card-secondary">
                      <span className="booking-guest-number guest-secondary">
                        {index + 2}
                      </span>
                      <strong>Guest {index + 2}</strong>
                      <span className="booking-guest-role guest-secondary">
                        Guest of main client
                      </span>
                      <button
                        type="button"
                        className="booking-guest-remove"
                        onClick={() =>
                          setAdditionalGuests((current) =>
                            current.filter((item) => item.id !== guest.id),
                          )
                        }
                        disabled={isSubmitting}
                        aria-label={`Remove Guest ${index + 2}`}
                      >
                        <Trash2 size={13} aria-hidden="true" /> Remove
                      </button>
                    </div>

                    <div className="booking-guest-content">
                      {/* Guest Name input */}
                      <div className="form-group guest-name-group">
                        <label
                          className="form-label"
                          htmlFor={`guest-name-${guest.id}`}
                        >
                          Guest Name <span className="required">*</span>
                        </label>
                        <input
                          id={`guest-name-${guest.id}`}
                          className="form-input"
                          value={guest.name}
                          onChange={(event) =>
                            updateGuest(guest.id, { name: event.target.value })
                          }
                          placeholder="Enter guest name"
                          maxLength={100}
                          required
                        />
                      </div>

                      {/* Service Search & Categories */}
                      <div className="booking-service-header-row">
                        <div className="booking-service-search-wrap">
                          <Search
                            size={14}
                            className="search-icon"
                            aria-hidden="true"
                          />
                          <input
                            type="search"
                            className="form-input search-input"
                            aria-label={`Search services for Guest ${index + 2}`}
                            placeholder="Search services (e.g. massage, facial, nail...)"
                            value={guestServiceSearches[guest.id] ?? ''}
                            onChange={(event) =>
                              setGuestServiceSearches((current) => ({
                                ...current,
                                [guest.id]: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <button
                          type="button"
                          className="booking-text-action"
                          onClick={() =>
                            updateGuest(guest.id, {
                              serviceIds: [...selectedServiceIds],
                            })
                          }
                          disabled={isSubmitting}
                        >
                          <Copy size={12} aria-hidden="true" /> Copy from Guest
                          1
                        </button>
                      </div>

                      {/* Categories */}
                      <div className="booking-category-pills">
                        <button
                          type="button"
                          className={`booking-category-pill ${!guestCategories[guest.id] || guestCategories[guest.id] === 'all' ? 'active' : ''}`}
                          onClick={() =>
                            setGuestCategories((current) => ({
                              ...current,
                              [guest.id]: 'all',
                            }))
                          }
                        >
                          All Services
                        </button>
                        {availableCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            className={`booking-category-pill ${guestCategories[guest.id] === cat ? 'active' : ''}`}
                            onClick={() =>
                              setGuestCategories((current) => ({
                                ...current,
                                [guest.id]: cat,
                              }))
                            }
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Carousel */}
                      <div className="booking-service-carousel-wrapper">
                        <button
                          type="button"
                          className="booking-carousel-nav-btn"
                          onClick={() => {
                            const el = guestCarouselRefs.current[guest.id];
                            if (el)
                              el.scrollBy({ left: -280, behavior: 'smooth' });
                          }}
                          aria-label={`Previous services for Guest ${index + 2}`}
                        >
                          <ChevronLeft size={16} aria-hidden="true" />
                        </button>
                        <div
                          className="booking-carousel-track"
                          ref={(el) => {
                            guestCarouselRefs.current[guest.id] = el;
                          }}
                        >
                          {guestFiltered.map((srv) => {
                            const selected = guest.serviceIds.includes(srv.id);
                            return (
                              <button
                                key={srv.id}
                                type="button"
                                className={`service-option-card ${selected ? 'selected' : ''}`}
                                aria-pressed={selected}
                                onClick={() =>
                                  toggleGuestService(guest.id, srv.id)
                                }
                              >
                                <div className="service-card-top">
                                  <span className="booking-service-icon">
                                    {srv.imageUrl ? (
                                      <img
                                        src={srv.imageUrl}
                                        alt=""
                                        className="service-card-thumbnail"
                                      />
                                    ) : (
                                      <Sparkles size={15} aria-hidden="true" />
                                    )}
                                  </span>
                                  <span className="service-card-name">
                                    {srv.name}
                                  </span>
                                  {selected && (
                                    <span className="service-card-check">
                                      <Check size={12} aria-hidden="true" />
                                    </span>
                                  )}
                                </div>
                                <div className="service-card-body">
                                  <span className="service-card-desc">
                                    {srv.description ||
                                      srv.category ||
                                      'Professional spa service'}
                                  </span>
                                </div>
                                <div className="service-card-bottom">
                                  {showFinancialFields && (
                                    <span className="service-card-price">
                                      {formatCurrency(srv.price)}
                                    </span>
                                  )}
                                  <span className="service-card-duration">
                                    {srv.durationMinutes} min
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          className="booking-carousel-nav-btn"
                          onClick={() => {
                            const el = guestCarouselRefs.current[guest.id];
                            if (el)
                              el.scrollBy({ left: 280, behavior: 'smooth' });
                          }}
                          aria-label={`Next services for Guest ${index + 2}`}
                        >
                          <ChevronRight size={16} aria-hidden="true" />
                        </button>
                      </div>

                      {/* Guest Controls: Duration, Therapist, Room */}
                      <div className="guest-controls-grid">
                        <div className="guest-control-col">
                          <label className="guest-control-label">
                            <Clock size={12} aria-hidden="true" /> Duration
                          </label>
                          <div className="duration-pills-row">
                            {getDurationOptions(guestDuration).map((dur) => (
                              <button
                                key={dur}
                                type="button"
                                className={`duration-pill-btn ${dur === guestDuration ? 'active' : ''}`}
                                disabled={dur !== guestDuration}
                                title={
                                  dur === guestDuration
                                    ? `Authoritative duration: ${dur} min`
                                    : 'Duration is fixed for this service'
                                }
                              >
                                {dur}m
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="guest-control-col">
                          <label className="guest-control-label">
                            <User size={12} aria-hidden="true" /> Therapist
                          </label>
                          <div className="guest-assigned-status">
                            Automatic — assigned on save
                          </div>
                        </div>

                        <div className="guest-control-col">
                          <label className="guest-control-label">
                            <DoorClosed size={12} aria-hidden="true" /> Room
                          </label>
                          <div className="guest-assigned-status">
                            {mode === 'home_service'
                              ? 'No room (Home Service)'
                              : 'Automatic — assigned on save'}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Schedule & Price */}
                      <div className="guest-controls-row2">
                        <div className="guest-schedule-fields">
                          <label className="guest-control-label">
                            <Calendar size={12} aria-hidden="true" /> Schedule
                          </label>
                          <div className="guest-datetime-inline">
                            <span className="synchronized-date-label">
                              {date} · {startTime}
                            </span>
                            <div className="guest-finish-calculated">
                              <span className="finish-label">Finish:</span>
                              <span className="finish-time">
                                {guestEndTime}
                              </span>
                            </div>
                          </div>
                        </div>

                        {showFinancialFields && (
                          <div className="guest-price-summary">
                            <span className="guest-price-amount">
                              {formatCurrency(guestPrice)}
                            </span>
                            <span className="guest-price-note">
                              Service price for {guestDuration} minutes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>

          {/* Right Column: Live Booking Summary & Action Bar */}
          <aside className="new-booking-summary-col">
            <div className="summary-content-scroll">
              <div className="summary-header-row">
                <Sparkles
                  size={16}
                  className="summary-header-icon"
                  aria-hidden="true"
                />
                <h4 className="summary-card-title">Booking Summary</h4>
              </div>

              {/* Mode & Branch Info */}
              <div className="summary-mode-banner">
                <Calendar
                  size={15}
                  className="summary-banner-icon"
                  aria-hidden="true"
                />
                <div className="summary-banner-details">
                  <div className="summary-banner-title">
                    <strong>
                      {mode === 'walkin'
                        ? 'Walk-in booking'
                        : mode === 'phone'
                          ? 'Phone booking'
                          : mode === 'standard_future'
                            ? 'Future booking'
                            : 'Home Service'}
                    </strong>
                    <span className="summary-branch-pill">{branchName}</span>
                  </div>
                  <div className="summary-banner-meta">
                    {date} • {allGuests.length} Guest
                    {allGuests.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="summary-divider" />

              {/* Customer Info */}
              <div className="summary-customer-box">
                <div className="summary-customer-top">
                  <div className="summary-customer-label">
                    <User size={13} aria-hidden="true" /> Customer
                  </div>
                  <button
                    type="button"
                    className="summary-edit-btn"
                    onClick={() =>
                      document.getElementById('customer-fullname')?.focus()
                    }
                  >
                    Edit
                  </button>
                </div>
                <div className="summary-customer-name">
                  {fullName.trim() || 'Walk-in Guest'}
                </div>
                {phone && <div className="summary-customer-sub">{phone}</div>}
              </div>

              <div className="summary-divider" />

              {/* Guests & Services List */}
              <div className="summary-section-label">
                Guests &amp; Services ({allGuests.length})
              </div>
              {allGuests.map((guest, index) => {
                const s = guest.serviceIds[0]
                  ? services.find((item) => item.id === guest.serviceIds[0])
                  : null;
                const dur =
                  s?.durationMinutes ??
                  (index === 0 ? totalDurationMinutes : 0);
                const guestEnd =
                  !startTime || !dur
                    ? '--:--'
                    : computeBookingEndTime(startTime, dur).slice(0, 5);
                const therapistName =
                  additionalGuests.length > 0
                    ? 'Auto on save'
                    : staffList.find((st) => st.id === staffId)?.name ||
                      'Auto on save';

                return (
                  <div className="booking-summary-guest-item" key={guest.id}>
                    <div className="summary-guest-item-top">
                      <span className="summary-guest-num">{index + 1}</span>
                      <div className="summary-guest-main">
                        <strong className="summary-guest-srv-name">
                          {s
                            ? `${index + 1}. ${s.name}`
                            : guest.serviceIds.length === 0
                              ? `${index + 1}. Choose a service`
                              : `${index + 1}. Multiple services`}
                        </strong>
                        <span className="summary-guest-details">
                          {dur > 0 ? `${dur} min` : '—'} • {therapistName}
                        </span>
                      </div>
                      {showFinancialFields && s && (
                        <div className="summary-guest-price">
                          {formatCurrency(s.price)}
                        </div>
                      )}
                    </div>
                    {startTime && dur > 0 && (
                      <div className="summary-guest-time-span">
                        {startTime} – {guestEnd}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Financial Subtotals & Totals (if single guest & financial enabled) */}
              {showFinancialFields && additionalGuests.length === 0 && (
                <>
                  <div className="summary-divider" />
                  <div className="summary-calc-row">
                    <span>Service Subtotal</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="summary-calc-row">
                    <span>Discount</span>
                    <span>₱0.00</span>
                  </div>
                  <div className="summary-total-amount-row">
                    <span className="total-label">Total Amount</span>
                    <span className="total-amount-number">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>

                  {/* Payment received toggle */}
                  <div className="summary-payment-wrap">
                    <div className="summary-payment-header">
                      <CreditCard size={14} aria-hidden="true" />
                      <span className="summary-payment-title">
                        Payment &amp; Notes
                      </span>
                      <span
                        className={`status-tag ${paymentReceived && paymentMethod ? 'paid' : 'pending'}`}
                      >
                        {paymentReceived && paymentMethod
                          ? `Payment received (${paymentMethod.toUpperCase()})`
                          : 'Payment pending'}
                      </span>
                    </div>

                    <label className="form-checkbox-label payment-checkbox-inline">
                      <input
                        type="checkbox"
                        checked={paymentReceived}
                        onChange={(e) => setPaymentReceived(e.target.checked)}
                      />
                      <span>Payment Received in Advance</span>
                    </label>

                    {paymentReceived && (
                      <div className="payment-method-select-wrap">
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
                </>
              )}

              {/* Notes in Summary (always rendered with heading when financial UI is suppressed) */}
              {!showFinancialFields ? (
                <>
                  <div className="summary-divider" />
                  <h4 className="summary-section-label">Notes</h4>
                  <p className="booking-summary-note">
                    {notes.trim() || 'No special instructions.'}
                  </p>
                </>
              ) : notes.trim() ? (
                <>
                  <div className="summary-divider" />
                  <div className="summary-section-label">Notes</div>
                  <p className="booking-summary-note">{notes.trim()}</p>
                </>
              ) : null}

              <p className="booking-assignment-hint">
                Draft details. The server verifies and assigns services,
                providers, rooms, and schedule when saved.
              </p>
            </div>

            {/* Pinned Action Buttons: Always visible without scrolling */}
            <div className="summary-footer-actions">
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
                aria-label="Create Booking"
                disabled={
                  isSubmitting ||
                  isLoadingOptions ||
                  Boolean(optionsError) ||
                  selectedServiceIds.length === 0 ||
                  !groupValid ||
                  fullName.trim().length < 2 ||
                  phone.trim().length < 7 ||
                  (showFinancialFields && paymentReceived && !paymentMethod) ||
                  mode === 'home_service'
                }
                onClick={handleSubmit}
              >
                <Check size={16} aria-hidden="true" />
                <span>
                  {isSubmitting ? 'Creating Booking...' : 'Save Booking'}
                </span>
              </button>
            </div>
          </aside>
        </form>
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
