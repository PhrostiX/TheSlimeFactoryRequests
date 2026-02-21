import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function isValidSession(token: string | undefined, secret: string) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;
  const expected = sign(payload, secret);

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET() {
  const store = await cookies();
  const token = store.get("admin_session")?.value;
  const profile = store.get("admin_profile")?.value ?? null;

  const secret = process.env.SESSION_SECRET ?? "";
  const isAdmin = secret ? isValidSession(token, secret) : false;

  return NextResponse.json({
    isAdmin,
    profile: isAdmin ? profile : null,
  });
}
