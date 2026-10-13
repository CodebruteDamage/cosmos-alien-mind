import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedDomains = [
  "learn.microsoft.com",
  "support.microsoft.com",
  "nist.gov",
  "cisa.gov",
  "owasp.org",
] as const;

const requestSchema = z.object({
  query: z.string().trim().min(3).max(500),
  domains: z.array(z.enum(allowedDomains)).max(allowedDomains.length).optional(),
});

type ExaResult = {
  title?: unknown;
  url?: unknown;
  publishedDate?: unknown;
  author?: unknown;
  text?: unknown;
  highlights?: unknown;
};

function safeResult(result: ExaResult) {
  if (typeof result.url !== "string" || typeof result.title !== "string") return null;
  try {
    const url = new URL(result.url);
    if (url.protocol !== "https:") return null;
    const excerpt = Array.isArray(result.highlights)
      ? result.highlights.find((item): item is string => typeof item === "string")
      : typeof result.text === "string" ? result.text : "";
    return {
      title: result.title.slice(0, 300),
      url: url.toString(),
      publishedDate: typeof result.publishedDate === "string" ? result.publishedDate : null,
      author: typeof result.author === "string" ? result.author.slice(0, 160) : null,
      excerpt: typeof excerpt === "string" ? excerpt.slice(0, 900) : "",
      verification: "candidate_source",
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Reference search is not configured. Set EXA_API_KEY on the server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a question of 3–500 characters and select valid source filters." },
      { status: 400 },
    );
  }

  const domains = parsed.data.domains?.length ? parsed.data.domains : undefined;

  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: parsed.data.query,
        type: "auto",
        numResults: 5,
        contents: { text: { maxCharacters: 1200 } },
        ...(domains ? { includeDomains: domains } : {}),
      }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: response.status === 429
          ? "Reference provider rate limit reached. Try again later."
          : "Reference provider could not complete the search." },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const payload: unknown = await response.json();
    const results = typeof payload === "object" && payload !== null && "results" in payload
      && Array.isArray((payload as { results?: unknown }).results)
      ? ((payload as { results: ExaResult[] }).results).map(safeResult).filter(Boolean)
      : [];

    return NextResponse.json({
      query: parsed.data.query,
      results,
      note: "Search results are candidate sources, not verified conclusions. Check source authority, date, and relevance before relying on them.",
    });
  } catch {
    return NextResponse.json(
      { error: "Reference search timed out or the provider is unreachable." },
      { status: 502 },
    );
  }
}
