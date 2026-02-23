import { NextResponse } from "next/server";
import { ADMIN_PROFILE_NAMES } from "@/lib/adminProfiles";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const profile = String((body as any)?.profile ?? "");

  if (!ADMIN_PROFILE_NAMES.includes(profile as any)) {
    return NextResponse.json({ ok: false, error: "Invalid profile" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set("admin_profile", profile, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return res;
}
