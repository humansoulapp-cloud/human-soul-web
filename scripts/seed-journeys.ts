/**
 * Seed script: migrates all Journeys from lib/content.ts to Supabase.
 * Run ONCE with: npx tsx scripts/seed-journeys.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * in .env.local (service role key bypasses RLS for the seed).
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { JOURNEYS } from "../lib/content";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

// Image URLs that were previously hardcoded in journeys/page.tsx
const JOURNEY_IMAGES: Record<string, string> = {
  "becoming-more-human":
    "https://images.unsplash.com/photo-1446071103084-c257b5f70672?auto=format&fit=crop&w=1200&q=80",
  "art-of-paying-attention":
    "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80",
  "meeting-yourself":
    "https://images.unsplash.com/photo-1508226068252-0f5ba68cfa36?auto=format&fit=crop&w=1200&q=80",
  "questions-that-matter":
    "https://images.unsplash.com/photo-1434458994784-eb5c7f8a7e0c?auto=format&fit=crop&w=1200&q=80",
  "beginning-again":
    "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80",
  "becoming-present":
    "https://images.unsplash.com/photo-1499244571948-7cc805844d18?auto=format&fit=crop&w=1200&q=80",
  "art-of-reflection":
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
  "everyday-wonder":
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
  "everyday-sacred":
    "https://images.unsplash.com/photo-1444464666168-49b626f11c0e?auto=format&fit=crop&w=1200&q=80",
  "living-with-curiosity":
    "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?auto=format&fit=crop&w=1200&q=80",
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function seed() {
  console.log(`🌱  Seeding ${JOURNEYS.length} journeys to Supabase…\n`);

  for (const journey of JOURNEYS) {
    // Upsert the journey row
    const { error: jErr } = await supabase.from("journeys").upsert(
      {
        id: journey.id,
        title: journey.title,
        category: journey.category ?? null,
        realm: journey.realm ?? null,
        tagline: journey.tagline ?? null,
        purpose: journey.purpose ?? null,
        intro: journey.intro ?? null,
        time_required: journey.timeRequired ?? null,
        image_url: JOURNEY_IMAGES[journey.id] ?? null,
        premium: journey.premium ?? false,
        featured: journey.featured ?? false,
        completion_message: journey.completionMessage ?? null,
      },
      { onConflict: "id" }
    );

    if (jErr) {
      console.error(`❌  Error upserting journey "${journey.id}":`, jErr.message);
      continue;
    }

    // Delete existing days first (clean slate on re-seed)
    await supabase.from("journey_days").delete().eq("journey_id", journey.id);

    // Insert all days
    const daysPayload = journey.days.map((d) => ({
      journey_id: journey.id,
      day: d.day,
      title: d.title,
      prompt: d.prompt,
      purpose: d.purpose,
      deeper: d.deeper ?? null,
    }));

    const { error: dErr } = await supabase.from("journey_days").insert(daysPayload);

    if (dErr) {
      console.error(`❌  Error inserting days for "${journey.id}":`, dErr.message);
    } else {
      console.log(`✅  ${journey.id}  (${journey.days.length} days)`);
    }
  }

  console.log("\n🎉  Seed complete!");
}

seed().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
