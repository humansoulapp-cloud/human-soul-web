import React from "react";
import { Users, Shield, User } from "lucide-react";
import { getUsers } from "@/lib/actions/users";
import ChangeRoleButton from "@/components/admin/ChangeRoleButton";

export default async function AdminUsersPage() {
  const users = await getUsers();
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--admin-text)" }}>
            Users
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--admin-text-muted)" }}>
            {users.length} users · {adminCount} admin{adminCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Info note */}
      <div
        className="border rounded-xl px-4 py-3 text-xs leading-relaxed"
        style={{
          background: "var(--admin-surface-2)",
          borderColor: "var(--admin-border)",
          color: "var(--admin-text-secondary)",
        }}
      >
        <strong style={{ color: "var(--admin-text)" }}>Note:</strong> For security reasons, user emails are not exposed via the anon key.
        To see full user details (email, last login), visit the{" "}
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: "var(--admin-accent)" }}
        >
          Supabase Authentication Dashboard
        </a>
        .
      </div>

      {/* Table — Full width */}
      <div
        className="border rounded-2xl overflow-hidden"
        style={{
          background: "var(--admin-surface)",
          borderColor: "var(--admin-border)",
        }}
      >
        <div
          className="grid grid-cols-[1fr_120px_140px_120px] text-[10px] uppercase tracking-widest px-6 py-3 border-b"
          style={{
            color: "var(--admin-text-muted)",
            borderColor: "var(--admin-border)",
          }}
        >
          <span>User ID</span>
          <span className="text-center">Role</span>
          <span className="text-center">Joined</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y" style={{ borderColor: "var(--admin-border)" }}>
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[1fr_120px_140px_120px] items-center px-6 py-4 transition-colors"
              style={{ borderColor: "var(--admin-border)" }}
            >
              {/* ID */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--admin-surface-2)" }}
                >
                  {user.role === "admin" ? (
                    <Shield className="w-4 h-4" style={{ color: "var(--admin-accent)" }} />
                  ) : (
                    <User className="w-4 h-4" style={{ color: "var(--admin-text-muted)" }} />
                  )}
                </div>
                <p className="text-xs font-mono truncate" style={{ color: "var(--admin-text-secondary)" }}>
                  {user.id}
                </p>
              </div>

              {/* Role badge */}
              <div className="flex justify-center">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider"
                  style={
                    user.role === "admin"
                      ? {
                          background: "color-mix(in srgb, var(--admin-accent) 15%, transparent)",
                          color: "var(--admin-accent)",
                        }
                      : {
                          background: "var(--admin-surface-2)",
                          color: "var(--admin-text-muted)",
                        }
                  }
                >
                  {user.role === "admin" ? (
                    <Shield className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  {user.role}
                </span>
              </div>

              {/* Date */}
              <p className="text-xs text-center" style={{ color: "var(--admin-text-muted)" }}>
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>

              {/* Actions */}
              <div className="flex justify-end">
                <ChangeRoleButton
                  userId={user.id}
                  currentRole={user.role as "admin" | "user"}
                />
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Users className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: "var(--admin-text)" }} />
              <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                No users found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
