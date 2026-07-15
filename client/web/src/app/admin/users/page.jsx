// src/app/admin/users/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  RefreshCw,
  Shield,
  UserPlus,
  X,
  Building2,
  Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import { USER_ROLES } from "@/lib/constants";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Badge, { RoleBadge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { notify } from "@/lib/toast";
import { confirmAction } from "@/lib/confirmAction";

const roleOptions = Object.entries(USER_ROLES).map(([value, label]) => ({
  value,
  label,
}));

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "deleted", label: "Deleted" },
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [assignmentsByUser, setAssignmentsByUser] = useState({});
  const [assignmentsModalOpen, setAssignmentsModalOpen] = useState(false);
  const [assignmentsUser, setAssignmentsUser] = useState(null);
  const [userAssignments, setUserAssignments] = useState([]);

  // ── Fetch users ─────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, assignmentsRes] = await Promise.all([
        api.get("/users?limit=100"),
        api.get("/admin/venue-admin-assignments?isActive=true"),
      ]);
      setUsers(usersRes.data || []);

      const grouped = {};
      (assignmentsRes.data || []).forEach((a) => {
        if (!grouped[a.userId]) grouped[a.userId] = [];
        grouped[a.userId].push(a);
      });
      setAssignmentsByUser(grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Filter locally ──────────────────────────────────────
  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  // ── Open role modal ─────────────────────────────────────
  function openRoleModal(user) {
    setSelectedUser(user);
    setSelectedRole("");
    setError("");
    setRoleModalOpen(true);
  }

  function openAssignmentsModal(user) {
    setAssignmentsUser(user);
    setUserAssignments(assignmentsByUser[user.id] || []);
    setAssignmentsModalOpen(true);
  }

  // ── Assign role ─────────────────────────────────────────
  async function handleAssignRole() {
    if (!selectedRole) {
      setError("Please select a role.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post(`/admin/users/${selectedUser.id}/roles`, {
        roleName: selectedRole,
      });
      setRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to assign role.");
    } finally {
      setSaving(false);
    }
  }

  // ── Remove role ──────────────────────────────────────
  async function handleRemoveRole(user, roleName) {
    if (roleName === "registered_user") return;

    const roleLabel = USER_ROLES[roleName] || roleName;

    const cleanupMessage =
      roleName === "mosque_admin"
        ? "This will also deactivate the user's active mosque admin venue assignments."
        : roleName === "trusted_volunteer"
          ? "This will also deactivate the user's active volunteer assignments."
          : "The user will keep basic registered user access.";

    const { confirmed } = await confirmAction({
      title: "Remove role access?",
      text: `Remove ${roleLabel} access from ${user.name || "this user"}? ${cleanupMessage}`,
      confirmButtonText: "Remove role",
      cancelButtonText: "Keep role",
      action: () => api.delete(`/admin/users/${user.id}/roles/${roleName}`),
    });

    if (!confirmed) return;

    notify.success(`${roleLabel} role removed successfully`);
    fetchUsers();
  }

  // ── Get user roles ──────────────────────────────────────
  function getUserRoles(user) {
    const roles = user.userRoles || user.roles || [];
    return roles.map((r) => r.role?.name || r.roleName || r).filter(Boolean);
  }

  function getPrimaryRole(user) {
    const priority = [
      "super_admin",
      "mosque_admin",
      "trusted_volunteer",
      "registered_user",
    ];
    const roles = getUserRoles(user);
    return priority.find((r) => roles.includes(r)) || "registered_user";
  }

  async function handleDeactivateUser(user) {
    const { confirmed } = await confirmAction({
      title: "Delete user?",
      text: `Deactivate ${user.name}? This will soft-delete the user — they will lose access but data will remain in the system.`,
      confirmButtonText: "Delete user",
      cancelButtonText: "Cancel",
      action: () => api.delete(`/users/${user.id}`),
    });

    if (!confirmed) return;

    notify.success("User deleted successfully");
    fetchUsers();
  }

  async function handleDeleteUser(user) {
    const { confirmed } = await confirmAction({
      title: "Permanently delete user?",
      text: `This will permanently delete ${user.name}. This cannot be undone — all user data will be removed.`,
      confirmButtonText: "Delete permanently",
      cancelButtonText: "Cancel",
      action: () => api.delete(`/users/${user.id}/permanent`),
    });

    if (!confirmed) return;

    notify.success("User permanently deleted");
    fetchUsers();
  }

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        subtitle="Manage registered users and assign roles across the platform."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Users & Roles" },
        ]}
      />

      {/* ── Filters ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search by name, email or phone..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          size="md"
          icon={RefreshCw}
          onClick={fetchUsers}
          className="px-3 py-3"
        />
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">All Users</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {filtered.length} {filtered.length === 1 ? "user" : "users"} found
            </p>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="No users match your search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "User",
                    "Contact",
                    "Roles",
                    "Status",
                    "Joined",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => {
                  const roles = getUserRoles(user);
                  const primaryRole = getPrimaryRole(user);
                  const displayRoles = roles.filter(
                    (r) => r !== "registered_user",
                  );
                  if (displayRoles.length === 0)
                    displayRoles.push("registered_user");

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">
                          {user.email || "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {user.phone || "—"}
                        </p>
                      </td>

                      {/* Roles */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {displayRoles.map((role, index) => (
                            <div
                              key={`${user.id}-${role}`}
                              className="flex items-center gap-1"
                            >
                              <RoleBadge role={role} size="sm" />

                              {role === "mosque_admin" && (
                                <button
                                  onClick={() => openAssignmentsModal(user)}
                                  title="View assigned venues"
                                  className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full px-1.5 py-0.5 transition-colors whitespace-nowrap"
                                >
                                  {(assignmentsByUser[user.id] || []).length}{" "}
                                  venue
                                  {(assignmentsByUser[user.id] || []).length ===
                                  1
                                    ? ""
                                    : "s"}
                                </button>
                              )}

                              {role !== "registered_user" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveRole(user, role)}
                                  className="!w-6 !h-6 !p-0 !rounded-full !text-gray-400 hover:!text-red-600 hover:!bg-red-50"
                                >
                                  <X size={12} />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            user.accountStatus === "active"
                              ? "success"
                              : user.accountStatus === "suspended"
                                ? "warning"
                                : "danger"
                          }
                          size="sm"
                          dot
                        >
                          {user.accountStatus}
                        </Badge>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <Button
                          variant="success"
                          size="sm"
                          icon={Shield}
                          onClick={() => openRoleModal(user)}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          Assign Role
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Assign Role Modal ───────────────────────────── */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Assign Role"
        subtitle={`Assign a new role to ${selectedUser?.name || "this user"}.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleAssignRole} icon={Shield}>
              Assign Role
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {error && (
            <div className="px-3.5 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
              ⚠ {error}
            </div>
          )}

          {/* Current user info */}
          {selectedUser && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">
                  {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {selectedUser.name}
                </p>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {getUserRoles(selectedUser)
                    .filter((r) => r !== "registered_user")
                    .map((role) => (
                      <RoleBadge key={role} role={role} size="sm" />
                    ))}
                </div>
              </div>
            </div>
          )}

          <Select
            label="New Role"
            name="role"
            required
            placeholder="Select role to assign"
            options={roleOptions}
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setError("");
            }}
          />

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Note:</strong> Assigning a role adds it to the user — it
              does not replace existing roles. Every user keeps their
              registered_user access regardless of additional roles.
            </p>
          </div>
        </div>
      </Modal>
      {/* ── View Assignments Modal ──────────────────────── */}
      <Modal
        isOpen={assignmentsModalOpen}
        onClose={() => setAssignmentsModalOpen(false)}
        title="Venue Assignments"
        subtitle={`Mosques assigned to ${assignmentsUser?.name || "this user"}.`}
        footer={
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setAssignmentsModalOpen(false)}
            >
              Close
            </Button>
          </div>
        }
      >
        {userAssignments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No venues assigned"
            description={`${assignmentsUser?.name || "This user"} is not currently assigned to manage any venue.`}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {userAssignments.map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-xl border border-gray-200 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {a.venue?.name || "Unnamed venue"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[a.venue?.area?.name, a.venue?.city?.name]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {a.canEditVenueProfile && (
                      <Badge variant="neutral" size="sm">
                        Profile
                      </Badge>
                    )}
                    {a.canEditDailyTimings && (
                      <Badge variant="neutral" size="sm">
                        Daily Timings
                      </Badge>
                    )}
                    {a.canEditJumuahTimings && (
                      <Badge variant="neutral" size="sm">
                        Jumu'ah Timings
                      </Badge>
                    )}
                    {a.canReviewReports && (
                      <Badge variant="neutral" size="sm">
                        Reports
                      </Badge>
                    )}
                    {a.canMarkVerified && (
                      <Badge variant="success" size="sm">
                        Can Verify
                      </Badge>
                    )}
                  </div>
                </div>
                <Link href={`/admin/venues/${a.venueId}`}>
                  <Button variant="ghost" size="sm" icon={Eye} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
