import type { NextConfig } from "next";

/* PostHog runs through our own domain (/ingest) so tracking blockers don't drop product analytics. */
const posthogRegion = process.env.NEXT_PUBLIC_POSTHOG_REGION === "us" ? "us" : "eu";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `https://${posthogRegion}-assets.i.posthog.com/static/:path*` },
      { source: "/ingest/array/:path*", destination: `https://${posthogRegion}-assets.i.posthog.com/array/:path*` },
      { source: "/ingest/:path*", destination: `https://${posthogRegion}.i.posthog.com/:path*` },
    ];
  },
  // PostHog's API paths end in a slash; don't redirect them away.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
