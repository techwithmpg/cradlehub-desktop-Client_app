import React, { useMemo, useState } from 'react';
import type { StaffMember } from '../../types/staff';

interface StaffRolesViewProps {
  staffList: StaffMember[];
  onOpenRoleModal: (staff: StaffMember) => void;
}

export const StaffRolesView: React.FC<StaffRolesViewProps> = ({
  staffList,
  onOpenRoleModal,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const systemRoles = useMemo(() => {
    const s = new Set<string>();
    staffList.forEach((m) => s.add(m.system_role));
    return Array.from(s).sort();
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((m) => {
      if (roleFilter !== 'all' && m.system_role !== roleFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = m.full_name.toLowerCase().includes(q);
        const matchRole = m.system_role.toLowerCase().includes(q);
        const matchType = m.staff_type.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchType) return false;
      }

      return true;
    });
  }, [staffList, roleFilter, search]);

  const totalItems = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + pageSize);

  const startRecord = totalItems === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + pageSize, totalItems);

  return (
    <div
      className="bookings-list-card staff-roles-view-card"
      data-testid="staff-roles-view"
    >
      {/* Header & Filters */}
      <div className="bookings-filter-toolbar">
        <div className="filter-search-group">
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search staff by name or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search staff or role"
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
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by system role"
          >
            <option value="all">All System Roles</option>
            {systemRoles.map((r) => (
              <option key={r} value={r}>
                {r.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bookings-table-wrapper">
        {totalItems === 0 ? (
          <div className="bookings-empty-state">
            <h3 className="empty-title">
              No staff members match active filters
            </h3>
            <p className="empty-subtitle">
              Try adjusting your search criteria or resetting filters.
            </p>
          </div>
        ) : (
          <table
            className="bookings-datagrid"
            aria-label="Staff Roles &amp; Permissions"
          >
            <thead>
              <tr>
                <th scope="col">Staff Member</th>
                <th scope="col">System Role</th>
                <th scope="col">Operational Function</th>
                <th scope="col">Account Linkage</th>
                <th scope="col">Supervisor</th>
                <th scope="col">Action</th>
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
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-[var(--cs-surface-hover)] border border-[var(--cs-border)] text-[var(--cs-text)]">
                      {member.system_role}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-[var(--cs-text)] capitalize">
                      {member.staff_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-[var(--cs-text-muted)]">
                      {member.auth_user_id ? 'Linked' : 'Not linked'}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-[var(--cs-text-muted)]">
                      {member.is_head ? (
                        <span className="font-semibold text-[var(--cs-sand)]">
                          Department Head
                        </span>
                      ) : (
                        '—'
                      )}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary-compact text-xs"
                      onClick={() => onOpenRoleModal(member)}
                    >
                      Manage Role
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
