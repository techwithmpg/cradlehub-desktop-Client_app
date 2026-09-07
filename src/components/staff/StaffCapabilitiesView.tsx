import React, { useMemo, useState } from 'react';
import type { StaffMember } from '../../types/staff';

interface StaffCapabilitiesViewProps {
  staffList: StaffMember[];
  onOpenCapabilityModal: (staff: StaffMember) => void;
}

export const StaffCapabilitiesView: React.FC<StaffCapabilitiesViewProps> = ({
  staffList,
  onOpenCapabilityModal,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState<
    'all' | 'assigned' | 'unassigned'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const staffTypes = useMemo(() => {
    const s = new Set<string>();
    staffList.forEach((m) => s.add(m.staff_type));
    return Array.from(s).sort();
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((m) => {
      if (filterType !== 'all' && m.staff_type !== filterType) return false;
      if (assignmentFilter === 'assigned' && m.services.length === 0)
        return false;
      if (assignmentFilter === 'unassigned' && m.services.length > 0)
        return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = m.full_name.toLowerCase().includes(q);
        const matchType = m.staff_type.toLowerCase().includes(q);
        const matchService = m.services.some((s) =>
          s.service_name.toLowerCase().includes(q),
        );
        if (!matchName && !matchType && !matchService) return false;
      }

      return true;
    });
  }, [staffList, filterType, assignmentFilter, search]);

  const totalItems = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + pageSize);

  const startRecord = totalItems === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + pageSize, totalItems);

  return (
    <div
      className="bookings-list-card staff-capabilities-view-card"
      data-testid="staff-capabilities-view"
    >
      {/* Header & Filters */}
      <div className="bookings-filter-toolbar">
        <div className="filter-search-group">
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search provider or service name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search provider or capability"
          />
          {search && (
            <button
              type="button"
              className="filter-search-clear"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
            >
              &times;
            </button>
          )}
        </div>

        <div className="filter-select-group">
          <select
            className="filter-select-control"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by staff type"
          >
            <option value="all">All Staff Types</option>
            {staffTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            className="filter-select-control"
            value={assignmentFilter}
            onChange={(e) => {
              setAssignmentFilter(
                e.target.value as 'all' | 'assigned' | 'unassigned',
              );
              setCurrentPage(1);
            }}
            aria-label="Filter by assignment status"
          >
            <option value="all">All Capability States</option>
            <option value="assigned">Assigned (1+)</option>
            <option value="unassigned">Unassigned (0)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bookings-table-wrapper">
        {totalItems === 0 ? (
          <div className="bookings-empty-state">
            <h3 className="empty-title">No capability records match filters</h3>
            <p className="empty-subtitle">
              Try adjusting your search criteria or resetting filters.
            </p>
          </div>
        ) : (
          <table
            className="bookings-datagrid"
            aria-label="Staff Capabilities Matrix"
          >
            <thead>
              <tr>
                <th scope="col" className="w-56">
                  Staff Member
                </th>
                <th scope="col" className="w-36">
                  Staff Type
                </th>
                <th scope="col">Assigned Services</th>
                <th scope="col" className="w-28 text-center">
                  Count
                </th>
                <th scope="col" className="w-24">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedStaff.map((member) => (
                <tr key={member.id} className="booking-row">
                  <td>
                    <div className="font-semibold text-xs text-[var(--cs-text)]">
                      {member.full_name}
                    </div>
                    {member.nickname && (
                      <div className="text-[11px] text-[var(--cs-text-muted)] italic">
                        &ldquo;{member.nickname}&rdquo;
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-[var(--cs-text)] capitalize">
                      {member.staff_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    {member.services.length === 0 ? (
                      <span className="text-xs text-[var(--cs-text-muted)] italic">
                        No services assigned
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {member.services.map((s) => (
                          <span
                            key={s.service_id}
                            className="text-[11px] px-2 py-0.5 rounded bg-[var(--cs-surface-hover)] border border-[var(--cs-border)] text-[var(--cs-text)]"
                          >
                            {s.service_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="text-center font-semibold text-xs text-[var(--cs-text)]">
                    {member.services.length}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary-compact text-xs"
                      onClick={() => onOpenCapabilityModal(member)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="bookings-table-footer">
        <div className="footer-count-text">
          Showing <span className="count-highlight">{startRecord}</span>–
          <span className="count-highlight">{endRecord}</span> of{' '}
          <span className="count-highlight">{totalItems}</span> staff
        </div>

        <div className="footer-pagination-controls">
          <div className="page-size-selector-wrapper">
            <span className="page-size-label">Rows per page:</span>
            <select
              className="page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="pagination-buttons">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              aria-label="Previous Page"
            >
              &larr; Prev
            </button>

            <span className="pagination-page-indicator">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              aria-label="Next Page"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
