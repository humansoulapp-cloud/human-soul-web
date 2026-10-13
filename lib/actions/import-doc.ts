"use server";

import { checkIsAdmin } from "@/lib/actions/journeys";
import { extractGoogleDocId, fetchGoogleDocPublicText } from "@/lib/doc-parser";

/** Reads a shared Google Doc as plain text on the server (the browser can't, CORS). */
export async function readGoogleDoc(url: string): Promise<{ text?: string; error?: string }> {
  if (!(await checkIsAdmin())) return { error: "Only admins can import." };
  const id = extractGoogleDocId(url);
  if (!id) return { error: "That doesn't look like a Google Docs link." };
  return fetchGoogleDocPublicText(id);
}
