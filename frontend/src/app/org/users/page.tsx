"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, RefreshCw, UserCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { auth } from "@/lib/api";

interface PlatformUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "patient" | "doctor" | "admin" | "superadmin";
  phone: string;
  preferred_language: string;
  is_active: boolean;
  date_joined: string;
}

type RoleFilter = "all" | "patient" | "doctor" | "admin";

const ROLE_LABEL: Record<PlatformUser["role"], string> = {
  patient: "Patient",
  doctor: "Doctor",
  admin: "Clinic Admin",
  superadmin: "Super Admin",
};

const ROLE_VARIANT: Record<PlatformUser["role"], "primary" | "info" | "warning" | "danger"> = {
  patient: "info",
  doctor: "primary",
  admin: "warning",
  superadmin: "danger",
};

function initialsOf(user: PlatformUser): string {
  const f = (user.first_name || "").trim();
  const l = (user.last_name || "").trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f) return f[0].toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "?";
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function OrgUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const loadUsers = useCallback(async () => {
    // Build the request from the current UI filters, then let the backend
    // return the already-filtered list.
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (search.trim()) params.set("search", search.trim());
      const data = await auth.listUsers(params.toString() || undefined);
      const list: PlatformUser[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];
      setUsers(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const counts = useMemo(() => {
    // These counters are based on whatever is currently loaded into the page,
    // so the summary cards and table always stay in sync.
    const base: Record<RoleFilter, number> = {
      all: users.length,
      patient: 0,
      doctor: 0,
      admin: 0,
    };
    users.forEach((u) => {
      if (u.role === "patient") base.patient += 1;
      else if (u.role === "doctor") base.doctor += 1;
      else if (u.role === "admin" || u.role === "superadmin") base.admin += 1;
    });
    return base;
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Header plus a manual refresh in case admins want the latest data immediately. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-12 md:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted mt-1">
            All registered patients, doctors, and administrators on the platform
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* Quick breakdown cards that also double as role filters. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["all", "patient", "doctor", "admin"] as RoleFilter[]).map((r) => {
          const active = roleFilter === r;
          const label =
            r === "all"
              ? "All users"
              : r === "admin"
                ? "Admins"
                : r === "doctor"
                  ? "Doctors"
                  : "Patients";
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`text-left rounded-xl border p-4 transition-all ${
                active
                  ? "border-primary bg-teal-50 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {label}
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">{counts[r]}</p>
            </button>
          );
        })}
      </div>

      {/* Search and role filters control the backend query. */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="all">All roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Admins</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
        </div>
      </div>

      {/* Keep the error lightweight so the page still feels usable when a fetch fails. */}
      {error && (
        <Card className="border-red-100 bg-red-50">
          <CardContent className="text-sm text-red-700">
            Couldn&apos;t load users: {error}
          </CardContent>
        </Card>
      )}

      {/* Main user list. */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    User
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Role
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Phone
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-6 py-3">
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted text-sm">
                      Loading users…
                    </td>
                  </tr>
                )}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <UserCircle2 size={32} className="text-muted/40" />
                        No users found for the current filters.
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  users.map((user) => {
                    const fullName =
                      `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
                      user.username ||
                      user.email;
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-50 text-primary flex items-center justify-center text-sm font-semibold">
                              {initialsOf(user)}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground block">
                                {fullName}
                              </span>
                              <span className="text-xs text-muted">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={ROLE_VARIANT[user.role] ?? "default"} size="sm">
                            {ROLE_LABEL[user.role] ?? user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted">
                          {user.phone || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={user.is_active ? "success" : "default"}
                            size="sm"
                          >
                            {user.is_active ? "Active" : "Disabled"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted">
                          {formatDate(user.date_joined)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted text-right">
        Showing {users.length} user{users.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
