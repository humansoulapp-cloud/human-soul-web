// Writes emails/supabase/*.html from SUPABASE_TEMPLATES in lib/email/templates.ts.
// Run: node --experimental-strip-types scripts/build-supabase-emails.mjs
// Then paste each file into Supabase → Authentication → Emails → Templates.
import { writeFileSync } from "node:fs";
import { SUPABASE_TEMPLATES } from "../lib/email/templates.ts";

for (const [name, t] of Object.entries(SUPABASE_TEMPLATES)) {
  writeFileSync(new URL(`../emails/supabase/${name}.html`, import.meta.url), t.html + "\n");
  console.log(`${name}.html · subject: ${t.subject}`);
}
