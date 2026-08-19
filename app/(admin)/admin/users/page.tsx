import React from "react";
import { getUsers } from "@/lib/actions/users";
import AdminUsersBrowser from "@/components/admin/AdminUsersBrowser";

export default async function AdminUsersPage() {
  const users = await getUsers();

  const plus = users.filter((u) => u.plan === "Plus").length;
  const dormant = users.filter(
    (u) => !u.lastActive || Date.now() - new Date(u.lastActive).getTime() >= 30 * 86_400_000
  ).length;

  return (
    <div className="w-full max-w-[1160px] mx-auto">
      <div className="flex items-end gap-5 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-[26px] md:text-[31px] font-semibold tracking-[-0.015em] m-0 mb-1.5 text-[var(--admin-text)]">
            Users
          </h1>
          <p className="text-[13.5px] text-[var(--admin-text-muted)] m-0">
            {users.length} accounts · {plus} on Plus · {dormant} inactive for a month
          </p>
        </div>
      </div>

      <AdminUsersBrowser users={users} />
    </div>
  );
}
