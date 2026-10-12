import React from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import AdminTopBar from "@/components/admin/AdminTopBar";

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

  /* Admin runs on the app's own tokens, in dark. `admin-panel` still carries the
     older --admin-* variables for the screens that haven't moved yet (Users). */
  return (
    <div className="dark admin-panel hsa hs">
      <AdminTopBar />
      <main className="hsa-page">
        <div className="hsa-wrap">{children}</div>
      </main>
    </div>
  );
}
