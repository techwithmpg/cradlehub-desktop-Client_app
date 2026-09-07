import React, { useMemo, useState } from 'react';
import type { StaffMember, StaffStatusFilter } from '../../types/staff';
import { canonicalizeRole, formatRoleLabel } from '../../lib/roles';

interface StaffListCardProps {
  staff: StaffMember[];
  activeFilter: StaffStatusFilter;
  onFilterChange: (filter: StaffStatusFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onResetSearch: () => void;
  selectedId: string | null;
  onSelectStaff: (member: StaffMember) => void;
}

type SortField = 'name' | 'role' | 'type' | 'tier' | 'status';
type SortOrder = 'asc' | 'desc';

function formatStaffType(type: string): string {
  if (!type) return 'Therapist';
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatTier(tier: string): string {
  if (!tier) return 'Mid';
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

function getInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const StaffListCard: React.FC<StaffListCardProps> = ({
  staff,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onResetSearch,
  selectedId,
  onSelectStaff,
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let active = 0;
    let awaiting = 0;
    let invited = 0;
    for (const s of staff) {
      if (s.status === 'active') active++;
      else if (s.status === 'awaiting') awaiting++;
      else if (s.status === 'invited') invited++;
    }
    return {
      all: staff.length,
      active,
      awaiting,
      invited,
    };
  }, [staff]);

  // Filtered staff by tab and search
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      // 1. Status Filter
      if (activeFilter !== 'all' && member.status !== activeFilter) {
        return false;
      }

      // 2. Search Query (full_name, nickname, phone, system_role, staff_type)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = member.full_name.toLowerCase().includes(q);
        const matchesNickname = Boolean(
          member.nickname && member.nickname.toLowerCase().includes(q),
        );
        const matchesPhone = Boolean(
          member.phone && member.phone.toLowerCase().includes(q),
        );
        const matchesRole = member.system_role.toLowerCase().includes(q);
        const matchesType = member.staff_type.toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesNickname &&
          !matchesPhone &&
          !matchesRole &&
          !matchesType
        ) {
          return false;
        }
      }

      return true;
    });
  }, [staff, activeFilter, searchQuery]);

  // Sorted staff
  const sortedStaff = useMemo(() => {
    const list = [...filteredStaff];
    list.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'name') {
        valA = a.full_name.toLowerCase();
        valB = b.full_name.toLowerCase();
      } else if (sortField === 'role') {
        valA = a.system_role.toLowerCase();
        valB = b.system_role.toLowerCase();
      } else if (sortField === 'type') {
        valA = a.staff_type.toLowerCase();
        valB = b.staff_type.toLowerCase();
      } else if (sortField === 'tier') {
        valA = a.tier.toLowerCase();
        valB = b.tier.toLowerCase();
      } else if (sortField === 'status') {
        valA = a.status;
        valB = b.status;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredStaff, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const tabs: Array<{ key: StaffStatusFilter; label: string; count: number }> =
    [
      { key: 'all', label: 'All Staff', count: tabCounts.all },
      { key: 'active', label: 'Active', count: tabCounts.active },
      {
        key: 'awaiting',
        label: 'Awaiting Approval',
        count: tabCounts.awaiting,
      },
      { key: 'invited', label: 'Invites Sent', count: tabCounts.invited },
    ];

  return (
    <div
      className="bookings-list-card staff-list-card"
      data-testid="staff-list-card"
    >
      {/* 1. Header with Tabs and Search */}
      <div className="bookings-list-card-header">
        {/* Filter Tabs */}
        <div
          className="bookings-tabs-nav staff-tabs-nav"
          role="tablist"
          aria-label="Staff status filters"
        >
          {tabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="staff-table-panel"
                className={`bookings-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => onFilterChange(tab.key)}
                data-testid={`staff-tab-${tab.key}`}
              >
                <span>{tab.label}</span>
                <span className="bookings-tab-count">{tab.count}</span>
              </button>
            );
          })}
        </div>

        {/* Search Toolbar */}
        <div className="bookings-toolbar-row">
          <div className="bookings-search-wrapper">
            <svg
              className="bookings-search-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className="bookings-search-input"
              placeholder="Search staff by name, nickname, phone..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search staff"
              data-testid="staff-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="bookings-search-clear-btn"
                onClick={onResetSearch}
                aria-label="Clear search"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className="bookings-results-counter" aria-live="polite">
            <span>
              Showing {sortedStaff.length} of {staff.length} staff
            </span>
          </div>
        </div>
      </div>

      {/* 2. DataGrid Table */}
      <div
        id="staff-table-panel"
        className="bookings-table-wrapper staff-table-wrapper"
        role="region"
        aria-label="Staff roster table"
      >
        {sortedStaff.length === 0 ? (
          <div
            className="bookings-empty-state staff-empty-state"
            data-testid="staff-empty-state"
          >
            <div className="bookings-empty-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            {staff.length === 0 ? (
              <>
                <h3 className="bookings-empty-title">
                  No staff members assigned
                </h3>
                <p className="bookings-empty-desc">
                  No staff members are assigned to this branch.
                </p>
              </>
            ) : (
              <>
                <h3 className="bookings-empty-title">
                  No matching staff found
                </h3>
                <p className="bookings-empty-desc">
                  No staff match your current search query or active status
                  filter.
                </p>
                <button
                  type="button"
                  className="bookings-empty-reset-btn"
                  onClick={() => {
                    onResetSearch();
                    onFilterChange('all');
                  }}
                  data-testid="reset-staff-search-filter-btn"
                >
                  Reset Search & Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <table
            className="bookings-table staff-table"
            data-testid="staff-table"
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sortable-th"
                  aria-sort={
                    sortField === 'name'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    className="th-sort-btn"
                    onClick={() => handleSort('name')}
                    data-testid="sort-staff-name-btn"
                  >
                    <div className="th-content">
                      <span>Staff Member</span>
                      {sortField === 'name' && (
                        <span className="sort-arrow">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </button>
                </th>
                <th
                  scope="col"
                  className="sortable-th"
                  aria-sort={
                    sortField === 'role'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    className="th-sort-btn"
                    onClick={() => handleSort('role')}
                    data-testid="sort-staff-role-btn"
                  >
                    <div className="th-content">
                      <span>Role</span>
                      {sortField === 'role' && (
                        <span className="sort-arrow">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </button>
                </th>
                <th
                  scope="col"
                  className="sortable-th"
                  aria-sort={
                    sortField === 'type'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    className="th-sort-btn"
                    onClick={() => handleSort('type')}
                    data-testid="sort-staff-type-btn"
                  >
                    <div className="th-content">
                      <span>Staff Type</span>
                      {sortField === 'type' && (
                        <span className="sort-arrow">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </button>
                </th>
                <th
                  scope="col"
                  className="sortable-th"
                  aria-sort={
                    sortField === 'tier'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    className="th-sort-btn"
                    onClick={() => handleSort('tier')}
                    data-testid="sort-staff-tier-btn"
                  >
                    <div className="th-content">
                      <span>Skill Tier</span>
                      {sortField === 'tier' && (
                        <span className="sort-arrow">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </button>
                </th>
                <th scope="col">Phone</th>
                <th
                  scope="col"
                  className="sortable-th"
                  aria-sort={
                    sortField === 'status'
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    type="button"
                    className="th-sort-btn"
                    onClick={() => handleSort('status')}
                    data-testid="sort-staff-status-btn"
                  >
                    <div className="th-content">
                      <span>Status</span>
                      {sortField === 'status' && (
                        <span className="sort-arrow">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStaff.map((member) => {
                const isSelected = member.id === selectedId;
                const initials = getInitials(member.full_name);

                return (
                  <tr
                    key={member.id}
                    className={`staff-row ${isSelected ? 'selected-row' : ''}`}
                    onClick={() => onSelectStaff(member)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`Staff member ${member.full_name}, ${formatRoleLabel(canonicalizeRole(member.system_role), member.system_role)}, status ${member.status}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectStaff(member);
                      }
                    }}
                    data-testid={`staff-row-${member.id}`}
                  >
                    {/* Staff Member Column */}
                    <td>
                      <div className="staff-identity-cell">
                        <div className="staff-avatar-circle" aria-hidden="true">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt=""
                              className="staff-avatar-img"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div className="staff-identity-meta">
                          <span className="staff-full-name">
                            {member.full_name}
                            {member.is_head && (
                              <span
                                className="staff-head-badge"
                                title="Department Lead / Head Therapist"
                              >
                                Head
                              </span>
                            )}
                          </span>
                          {member.nickname && (
                            <span className="staff-nickname">
                              &ldquo;{member.nickname}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* System Role Column */}
                    <td>
                      <span className="staff-role-badge">
                        {formatRoleLabel(
                          canonicalizeRole(member.system_role),
                          member.system_role,
                        )}
                      </span>
                    </td>

                    {/* Staff Type Column */}
                    <td>
                      <span className="staff-type-text">
                        {formatStaffType(member.staff_type)}
                      </span>
                    </td>

                    {/* Skill Tier Column */}
                    <td>
                      <span
                        className={`staff-tier-badge staff-tier-${member.tier.toLowerCase()}`}
                      >
                        {formatTier(member.tier)}
                      </span>
                    </td>

                    {/* Phone Column */}
                    <td>
                      <span className="staff-phone-text">
                        {member.phone || '—'}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td>
                      <span
                        className={`staff-status-badge staff-status-${member.status}`}
                      >
                        {member.status === 'active'
                          ? 'Active'
                          : member.status === 'awaiting'
                            ? 'Awaiting Approval'
                            : 'Invite Sent'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
