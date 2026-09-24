import { NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/actions/journeys";
import {
  parseDocxBuffer,
  parseHtmlToText,
  parseRawTextToJourney,
  extractGoogleDocId,
  fetchGoogleDocPublicText,
} from "@/lib/doc-parser";

export const maxDuration = 30; // Vercel timeout max

export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 401 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // Handle Multipart Form Data (File Upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const googleDocUrl = (formData.get("googleDocUrl") as string) || "";
      const pastedText = (formData.get("text") as string) || "";

      if (googleDocUrl) {
        const docId = extractGoogleDocId(googleDocUrl);
        if (!docId) {
          return NextResponse.json(
            { error: "Invalid Google Doc URL format. Please check the URL and try again." },
            { status: 400 }
          );
        }
        const fetchRes = await fetchGoogleDocPublicText(docId);
        if (fetchRes.error || !fetchRes.text) {
          return NextResponse.json(
            { error: fetchRes.error || "Failed to retrieve Google Doc." },
            { status: 400 }
          );
        }
        const parsed = parseRawTextToJourney(fetchRes.text);
        return NextResponse.json({ success: true, ...parsed });
      }

      if (file) {
        const fileName = file.name.toLowerCase();
        let extractedText = "";

        if (fileName.endsWith(".docx")) {
          const arrayBuffer = await file.arrayBuffer();
          extractedText = await parseDocxBuffer(arrayBuffer);
        } else if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
          const rawHtml = await file.text();
          extractedText = parseHtmlToText(rawHtml);
        } else {
          // .txt, .md, etc.
          extractedText = await file.text();
        }

        if (!extractedText.trim()) {
          return NextResponse.json(
            { error: "The uploaded file could not be read or is empty." },
            { status: 400 }
          );
        }

        const parsed = parseRawTextToJourney(extractedText);
        return NextResponse.json({ success: true, ...parsed });
      }

      if (pastedText.trim()) {
        const parsed = parseRawTextToJourney(pastedText);
        return NextResponse.json({ success: true, ...parsed });
      }

      return NextResponse.json(
        { error: "No file, Google Doc URL, or text provided." },
        { status: 400 }
      );
    }

    // Handle JSON Request
    const body = await request.json();
    const { googleDocUrl, text, html } = body;

    if (googleDocUrl) {
      const docId = extractGoogleDocId(googleDocUrl);
      if (!docId) {
        return NextResponse.json(
          { error: "Invalid Google Doc link. Please provide a valid docs.google.com link." },
          { status: 400 }
        );
      }
      const fetchRes = await fetchGoogleDocPublicText(docId);
      if (fetchRes.error || !fetchRes.text) {
        return NextResponse.json(
          { error: fetchRes.error || "Could not read Google Doc." },
          { status: 400 }
        );
      }
      const parsed = parseRawTextToJourney(fetchRes.text);
      return NextResponse.json({ success: true, ...parsed });
    }

    if (html) {
      const convertedText = parseHtmlToText(html);
      const parsed = parseRawTextToJourney(convertedText);
      return NextResponse.json({ success: true, ...parsed });
    }

    if (text) {
      const parsed = parseRawTextToJourney(text);
      return NextResponse.json({ success: true, ...parsed });
    }

    return NextResponse.json(
      { error: "Please provide a document file, Google Doc URL, or text content." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Doc parse error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred while parsing the document." },
      { status: 500 }
    );
  }
}
