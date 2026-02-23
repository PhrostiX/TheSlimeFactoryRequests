export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "../../../../../server-dns";
import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { getMongoClient } from "@/lib/mongo";
import { getAdminProfileDef } from "@/lib/adminProfiles";

type RequestDoc = {
  _id: number;
  seenBy?: string[];
  sync?: any;
};

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

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const _id = Number(id);
    if (!Number.isFinite(_id)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const SESSION_SECRET = process.env.SESSION_SECRET;
    if (!SESSION_SECRET) {
      return NextResponse.json({ ok: false, error: "Missing SESSION_SECRET" }, { status: 500 });
    }

    const store = await cookies();
    const token = store.get("admin_session")?.value;
    if (!isValidSession(token, SESSION_SECRET)) {
      return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
    }

    const profile = store.get("admin_profile")?.value ?? null;
    const pdef = getAdminProfileDef(profile);
    if (!profile || !pdef) {
      return NextResponse.json({ ok: false, error: "Missing admin profile" }, { status: 400 });
    }
    if (!pdef.permissions.canSeen) {
      return NextResponse.json({ ok: false, error: "This profile cannot mark seen." }, { status: 403 });
    }

    // Body is optional. If omitted, defaults to "see".
    let action: "see" | "unsee" = "see";
    try {
      const body = await req.json();
      const raw = String(body?.action ?? body?.mode ?? body?.type ?? "").toLowerCase().trim();
      if (raw === "unsee" || raw === "remove" || raw === "unset") action = "unsee";
      if (raw === "see" || raw === "mark" || raw === "set") action = "see";
      // backward compat: { unsee: true }
      if (body?.unsee === true) action = "unsee";
    } catch {
      // ignore
    }

    const now = Date.now();

    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB);
    const col = db.collection<RequestDoc>("requests");

    const update =
      action === "unsee"
        ? {
            $pull: { seenBy: profile },
            $set: {
              "sync.pending": true,
              "sync.reason": "unsee",
              "sync.updatedAt": now,
            },
          }
        : {
            $addToSet: { seenBy: profile },
            $set: {
              "sync.pending": true,
              "sync.reason": "seen",
              "sync.updatedAt": now,
            },
          };

    const result = await col.updateOne({ _id }, update as any);
    if (!result.matchedCount) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
