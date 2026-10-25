import { useMemo, useState } from 'react';
import {
  X,
  Users,
  ShieldAlert,
  Calendar,
  Phone,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import type { OperationalStaffMember } from '../../../types/operations';

interface StaffDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStaffId?: string | null;
  branchStaff: OperationalStaffMember[];
}

interface DuplicateGroup {
  key: string;
  reason: string;
  profiles: OperationalStaffMember[];
}

export function StaffDuplicateModal({
  isOpen,
  onClose,
  preselectedStaffId,
  branchStaff,
}: StaffDuplicateModalProps) {
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

  // Group staff by potential duplicate indicators (normalized phone or exact lowercase name)
  const duplicateGroups = useMemo(() => {
    const byPhone = new Map<string, OperationalStaffMember[]>();
    const byName = new Map<string, OperationalStaffMember[]>();

    for (const staff of branchStaff) {
      if (staff.phone) {
        const cleanPhone = staff.phone.replace(/\D/g, '').slice(-10);
        if (cleanPhone.length >= 7) {
          const list = byPhone.get(cleanPhone) ?? [];
          list.push(staff);
          byPhone.set(cleanPhone, list);
        }
      }

      const cleanName = staff.full_name.trim().toLowerCase();
      if (cleanName.length > 2) {
        const list = byName.get(cleanName) ?? [];
        list.push(staff);
        byName.set(cleanName, list);
      }
    }

    const groups: DuplicateGroup[] = [];
    const seenStaffPairs = new Set<string>();

    for (const [phone, profiles] of byPhone.entries()) {
      if (profiles.length > 1) {
        const pairKey = profiles
          .map((p) => p.id)
          .sort()
          .join(':');
        seenStaffPairs.add(pairKey);
        groups.push({
          key: `phone:${phone}`,
          reason: `Matching phone number (${profiles[0]?.phone ?? phone})`,
          profiles,
        });
      }
    }

    for (const [name, profiles] of byName.entries()) {
      if (profiles.length > 1) {
        const pairKey = profiles
          .map((p) => p.id)
          .sort()
          .join(':');
        if (!seenStaffPairs.has(pairKey)) {
          groups.push({
            key: `name:${name}`,
            reason: `Identical full name (${profiles[0]?.full_name ?? name})`,
            profiles,
          });
        }
      }
    }

    return groups;
  }, [branchStaff]);

  const activeGroup = useMemo(() => {
    if (selectedGroupKey) {
      return (
        duplicateGroups.find((g) => g.key === selectedGroupKey) ??
        duplicateGroups[0] ??
        null
      );
    }
    if (preselectedStaffId) {
      const match = duplicateGroups.find((g) =>
        g.profiles.some((p) => p.id === preselectedStaffId),
      );
      if (match) return match;
    }
    return duplicateGroups[0] ?? null;
  }, [duplicateGroups, selectedGroupKey, preselectedStaffId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-modal-title"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Users size={18} aria-hidden />
            </div>
            <div>
              <h2
                id="duplicate-modal-title"
                className="text-base font-bold text-[var(--color-ink)]"
              >
                Staff Identity Discrepancy Comparison
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Side-by-side unverified evidence inspection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-950">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <ShieldAlert size={14} aria-hidden />
            Manual Review Evidence — Automatic Merges Disabled
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
            These records share contact or name details and are presented as
            unverified evidence. Automatic account merging and profile deletion
            remain disabled to safeguard historical bookings, shift logs, and
            device activations.
          </p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {duplicateGroups.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-hover)] p-8 text-center">
              <CheckCircle2
                size={32}
                className="mx-auto text-emerald-600"
                aria-hidden
              />
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
                No Duplicate Identity Candidates Found
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                All staff members in this branch have distinct names and phone
                numbers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group Selector if multiple duplicate clusters exist */}
              {duplicateGroups.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-muted)]">
                    Detected Clusters:
                  </span>
                  {duplicateGroups.map((group, index) => (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => setSelectedGroupKey(group.key)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                        activeGroup?.key === group.key
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                          : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      Cluster {index + 1}: {group.reason}
                    </button>
                  ))}
                </div>
              )}

              {activeGroup && (
                <div>
                  <div className="mb-3 text-xs font-semibold text-[var(--color-ink)]">
                    Comparison Reason: {activeGroup.reason}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {activeGroup.profiles.map((profile, i) => (
                      <div
                        key={profile.id}
                        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-xs"
                      >
                        <div className="flex items-start justify-between border-b border-[var(--color-line)] pb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                              Record #{i + 1}
                            </span>
                            <h3 className="text-sm font-bold text-[var(--color-ink)]">
                              {profile.full_name}
                            </h3>
                            {profile.nickname && (
                              <p className="text-xs text-[var(--color-muted)]">
                                Nickname: {profile.nickname}
                              </p>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              profile.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {profile.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="space-y-2 py-3 text-xs">
                          <div className="flex items-center justify-between text-[var(--color-ink)]">
                            <span className="text-[var(--color-muted)]">
                              System Role:
                            </span>
                            <span className="font-semibold">
                              {profile.system_role}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[var(--color-ink)]">
                            <span className="text-[var(--color-muted)]">
                              Staff Type:
                            </span>
                            <span className="font-semibold">
                              {profile.staff_type}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[var(--color-ink)]">
                            <span className="flex items-center gap-1 text-[var(--color-muted)]">
                              <Phone size={12} aria-hidden /> Phone:
                            </span>
                            <span className="font-mono">
                              {profile.phone || 'None recorded'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[var(--color-ink)]">
                            <span className="text-[var(--color-muted)]">
                              Login Account:
                            </span>
                            <span
                              className={`font-semibold ${
                                profile.hasLoginAccount
                                  ? 'text-emerald-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {profile.hasLoginAccount
                                ? 'Present'
                                : 'No account'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[var(--color-ink)]">
                            <span className="text-[var(--color-muted)]">
                              Identity Verified:
                            </span>
                            <span
                              className={`font-semibold ${
                                profile.isIdentityVerified
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {profile.isIdentityVerified
                                ? 'Verified'
                                : 'Unverified'}
                            </span>
                          </div>

                          {profile.created_at && (
                            <div className="flex items-center justify-between text-[var(--color-ink)]">
                              <span className="flex items-center gap-1 text-[var(--color-muted)]">
                                <Calendar size={12} aria-hidden /> Enrolled:
                              </span>
                              <span className="text-[var(--color-muted)]">
                                {new Date(
                                  profile.created_at,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-line)] p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
            <Lock size={12} aria-hidden />
            <span>
              Account merging and deletion are disabled by governance policy.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-line)] px-4 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
