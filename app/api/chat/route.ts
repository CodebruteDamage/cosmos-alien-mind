import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(8000),
});

export async function POST(request: NextRequest) {
  // Fail closed until a server-side credential is configured.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini is not configured yet. Add GEMINI_API_KEY to the Vercel project environment." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a message between 1 and 8,000 characters." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are COSMOS, a careful AI assistant. Be useful and direct. Distinguish verified facts from assumptions. You may suggest plans, but never claim to have executed tools, changed systems, or verified outcomes unless that actually happened. Never imply that a suggestion authorizes an action.",
            }],
          },
          contents: [{ role: "user", parts: [{ text: parsed.data.message }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
        }),
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (!upstream.ok) {
      // Do not return upstream bodies; they may contain provider diagnostics.
      const status = upstream.status === 429 ? 429 : upstream.status === 401 || upstream.status === 403 ? 502 : 502;
      return NextResponse.json(
        { error: upstream.status === 429
          ? "Gemini rate limit reached. Try again shortly."
          : "Gemini could not complete the request. Check the server-side key, model access, and provider status." },
        { status },
      );
    }

    const data: unknown = await upstream.json();
    const responseSchema = z.object({
      candidates: z.array(z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string().optional() })).optional(),
        }).optional(),
      })).optional(),
    });
    const response = responseSchema.safeParse(data);
    const answer = response.success
      ? response.data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim()
      : "";

    if (!answer) {
      return NextResponse.json({ error: "Gemini returned no text response." }, { status: 502 });
    }

    return NextResponse.json({ answer, provider: "Google Gemini", verified: true });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { error: timedOut ? "Gemini timed out. Please try again." : "Could not reach Gemini. Please try again." },
      { status: timedOut ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
