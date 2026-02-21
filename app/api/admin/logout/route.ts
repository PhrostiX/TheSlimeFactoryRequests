import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set("admin_session", "", { path: "/", maxAge: 0 });
  res.cookies.set("admin_profile", "", { path: "/", maxAge: 0 });

  return res;
}
