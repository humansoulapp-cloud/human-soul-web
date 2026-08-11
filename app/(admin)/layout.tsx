import React from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <AdminThemeProvider>
      <AdminSidebar userEmail={user.email ?? ""} />
      <main className="flex-1 min-w-0 p-8 overflow-auto" style={{ background: "var(--admin-bg)" }}>
        {children}
      </main>
    </AdminThemeProvider>
  );
}
