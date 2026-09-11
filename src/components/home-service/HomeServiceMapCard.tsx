import { useMemo, useState } from 'react';
import { LocateFixed, MapPin, Minus, Plus, Truck, X } from 'lucide-react';
import type {
  HomeServiceDriver,
  HomeServiceQueueItem,
} from '../../types/home-service';

interface HomeServiceMapSummary {
  totalToday: number;
  awaitingDispatch: number;
  activeTrips: number;
  completedToday: number;
  cancelledToday: number;
}

interface HomeServiceMapCardProps {
  items: HomeServiceQueueItem[];
  drivers: HomeServiceDriver[];
  selectedItem: HomeServiceQueueItem | null;
  summary: HomeServiceMapSummary;
  locationSemantics: string;
}

interface DriverMapRow {
  driver: HomeServiceDriver;
  assignedCount: number;
  activeDispatches: number;
  etaMinutes: number | null;
}

function formatCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
): string {
  if (lat == null || lng == null) return 'Unavailable';

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function HomeServiceMapCard({
  items,
  drivers,
  selectedItem,
  summary,
  locationSemantics,
}: HomeServiceMapCardProps) {
  const [showDrivers, setShowDrivers] = useState(true);

  const activeStaffDrivers = useMemo(
    () => drivers.filter((driver) => driver.isActive),
    [drivers],
  );

  const activeBookings = useMemo(
    () =>
      items.filter(
        (item) => !['completed', 'cancelled'].includes(item.dispatchStatus),
      ).length,
    [items],
  );

  const driverRows = useMemo<DriverMapRow[]>(
    () =>
      activeStaffDrivers.map((driver) => {
        const assigned = items.filter((item) => item.driverId === driver.id);

        const activeAssigned = assigned.filter(
          (item) => !['completed', 'cancelled'].includes(item.dispatchStatus),
        );

        const etaMinutes =
          activeAssigned
            .map((item) => item.eta?.minutes)
            .filter((value): value is number => typeof value === 'number')
            .sort((a, b) => a - b)[0] ?? null;

        return {
          driver,
          assignedCount: assigned.length,
          activeDispatches: activeAssigned.length,
          etaMinutes,
        };
      }),
    [activeStaffDrivers, items],
  );

  return (
    <div
      className="home-service-map-card"
      aria-label="Home Service location map area"
    >
      <div
        className="home-service-map-canvas"
        aria-label="Map layer unavailable"
      >
        <div className="home-service-map-grid" aria-hidden="true" />

        <div className="home-service-map-center-message">
          <span className="home-service-map-center-icon">
            <MapPin size={23} aria-hidden="true" />
          </span>

          <strong>Location map</strong>

          <span>Interactive map tiles are not connected yet.</span>

          <small>
            Real customer coordinates and recorded driver locations remain
            available.
          </small>
        </div>

        <div className="home-service-map-legend">
          <div className="home-service-map-overlay-heading">
            <strong>Map Status</strong>
          </div>

          <div className="home-service-map-legend-row">
            <span className="home-service-map-dot home-service-map-dot-blue" />
            <span>Active staff drivers</span>
            <strong>{activeStaffDrivers.length}</strong>
          </div>

          <div className="home-service-map-legend-row">
            <span className="home-service-map-dot home-service-map-dot-indigo" />
            <span>Active bookings</span>
            <strong>{activeBookings}</strong>
          </div>

          <div className="home-service-map-legend-row">
            <span className="home-service-map-dot home-service-map-dot-amber" />
            <span>Pending dispatch</span>
            <strong>{summary.awaitingDispatch}</strong>
          </div>

          <div className="home-service-map-legend-row">
            <span className="home-service-map-dot home-service-map-dot-green" />
            <span>Completed today</span>
            <strong>{summary.completedToday}</strong>
          </div>
        </div>

        <div
          className="home-service-map-controls"
          aria-label="Map controls unavailable"
        >
          <button
            type="button"
            disabled
            title="Zoom controls become available when the interactive map layer is connected."
            aria-label="Zoom in unavailable"
          >
            <Plus size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            disabled
            title="Zoom controls become available when the interactive map layer is connected."
            aria-label="Zoom out unavailable"
          >
            <Minus size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            disabled
            title="Map positioning becomes available when the interactive map layer is connected."
            aria-label="Map positioning unavailable"
          >
            <LocateFixed size={15} aria-hidden="true" />
          </button>
        </div>

        {showDrivers ? (
          <div className="home-service-map-drivers">
            <div className="home-service-map-overlay-heading">
              <strong>
                Drivers ({activeStaffDrivers.length}/{drivers.length} active
                staff)
              </strong>

              <button
                type="button"
                onClick={() => setShowDrivers(false)}
                aria-label="Hide driver card"
              >
                <X size={13} aria-hidden="true" />
              </button>
            </div>

            <div className="home-service-map-driver-list">
              {driverRows.length === 0 ? (
                <div className="home-service-map-driver-empty">
                  No active driver staff records.
                </div>
              ) : (
                driverRows.slice(0, 4).map((row) => (
                  <div
                    key={row.driver.id}
                    className="home-service-map-driver-row"
                  >
                    <span
                      className="home-service-map-driver-avatar"
                      aria-hidden="true"
                    >
                      {row.driver.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>

                    <div className="home-service-map-driver-meta">
                      <strong>{row.driver.name}</strong>

                      <span>
                        Active staff
                        {row.activeDispatches > 0
                          ? ` · ${row.activeDispatches} active ${
                              row.activeDispatches === 1
                                ? 'dispatch'
                                : 'dispatches'
                            }`
                          : ' · no active dispatch'}
                      </span>
                    </div>

                    <div className="home-service-map-driver-eta">
                      <span>ETA</span>

                      <strong>
                        {row.etaMinutes != null ? `${row.etaMinutes} min` : '—'}
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="home-service-map-show-drivers"
            onClick={() => setShowDrivers(true)}
          >
            <Truck size={13} aria-hidden="true" />
            Show drivers
          </button>
        )}

        {selectedItem && (
          <div className="home-service-map-selected">
            <span className="home-service-map-selected-label">
              Selected booking
            </span>

            <strong>{selectedItem.customerName}</strong>

            <span>
              {selectedItem.area ||
                selectedItem.formattedAddress ||
                'Address unavailable'}
            </span>

            <small>
              Customer: {formatCoordinates(selectedItem.lat, selectedItem.lng)}
            </small>

            {selectedItem.latestDriverLocation && (
              <small>
                Driver:{' '}
                {formatCoordinates(
                  selectedItem.latestDriverLocation.lat,
                  selectedItem.latestDriverLocation.lng,
                )}
              </small>
            )}

            {selectedItem.eta && (
              <span className="home-service-map-selected-eta">
                ETA {selectedItem.eta.minutes} min
              </span>
            )}
          </div>
        )}

        <div className="home-service-map-truth">
          <LocateFixed size={12} aria-hidden="true" />
          <span>{locationSemantics}</span>
        </div>
      </div>
    </div>
  );
}
