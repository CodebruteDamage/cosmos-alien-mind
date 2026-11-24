import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({ token: z.string().min(24).max(512) }).strict();
function hash(value: string) { return createHash("sha256").update(value).digest(); }
export async function POST(request: Request) {
  const expected = process.env.COSMOS_INSPECTOR_ACCESS_TOKEN;
  if (!expected || expected.length < 24) return NextResponse.json({ ok: false, error: "Inspector access is not configured." }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid access token." }, { status: 400 });
  const supplied = hash(parsed.data.token);
  const target = hash(expected);
  if (!timingSafeEqual(supplied, target)) return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("cosmos_inspector_session", target.toString("hex"), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", path: "/api/inspector", maxAge: 60 * 60 * 4
  });
  return response;
}
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("cosmos_inspector_session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/inspector", maxAge: 0 });
  return response;
}
