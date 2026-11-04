import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/email/templates";

/* Search engines see the landing and the legal pages; everything behind sign-in stays out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms", "/sign-up"],
        disallow: ["/admin", "/api", "/auth", "/dashboard", "/journal", "/journeys", "/favorites", "/profile", "/subscription", "/feedback", "/onboarding"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
