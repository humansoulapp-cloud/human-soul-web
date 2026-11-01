import type { Metadata } from "next";
import { getBetaOverview } from "@/lib/actions/beta";
import AdminBetaBrowser from "@/components/admin/AdminBetaBrowser";

export const metadata: Metadata = { title: "Beta · Admin" };

export default async function AdminBetaPage() {
  const overview = await getBetaOverview();

  if (!overview.ready) {
    return (
      <>
        <div className="hsa-head">
          <div className="hsa-head-t">
            <h1 className="text-h1" style={{ margin: 0 }}>
              Beta
            </h1>
          </div>
        </div>
        <div className="hsa-banner err" role="alert" style={{ marginTop: 16 }}>
          The beta tables aren&apos;t in the database yet. In Supabase → SQL Editor, run
          scripts/migration-2026-11-beta-access.sql from the repository, then reload this page.
        </div>
      </>
    );
  }

  return <AdminBetaBrowser settings={overview.settings} invites={overview.invites} waitlist={overview.waitlist} />;
}
