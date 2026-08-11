import React from "react";
import { Users, Shield, User } from "lucide-react";
import { getUsers } from "@/lib/actions/users";
import ChangeRoleButton from "@/components/admin/ChangeRoleButton";

export default async function AdminUsersPage() {
  const users = await getUsers();
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Users</h1>
          <p className="text-white/40 text-sm mt-1">
            {users.length} users · {adminCount} admin{adminCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-xl px-4 py-3 text-white/40 text-xs leading-relaxed">
        <strong className="text-white/60">Note:</strong> For security reasons, user emails are not exposed via the anon key.
        To see full user details (email, last login), visit the{" "}
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8BA58F] hover:underline"
        >
          Supabase Authentication Dashboard
        </a>
        .
      </div>

      {/* Table */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_140px_120px] text-[10px] uppercase tracking-widest text-white/25 px-6 py-3 border-b border-white/[0.06]">
          <span>User ID</span>
          <span className="text-center">Role</span>
          <span className="text-center">Joined</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[1fr_120px_140px_120px] items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
            >
              {/* ID */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  {user.role === "admin" ? (
                    <Shield className="w-4 h-4 text-[#8BA58F]" />
                  ) : (
                    <User className="w-4 h-4 text-white/30" />
                  )}
                </div>
                <p className="text-xs text-white/40 font-mono truncate">{user.id}</p>
              </div>

              {/* Role badge */}
              <div className="flex justify-center">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                    user.role === "admin"
                      ? "bg-[#8BA58F]/15 text-[#8BA58F]"
                      : "bg-white/[0.06] text-white/40"
                  }`}
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
              <p className="text-xs text-white/30 text-center">
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
              <Users className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">No users found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
