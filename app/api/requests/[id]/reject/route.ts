export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "../../../../../server-dns";
import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { getMongoClient } from "@/lib/mongo";
import { MOD_PROFILES } from "@/app/lib/adminProfiles";

/**
 * IMPORTANT:
 * Your Mongo documents use numeric _id (example: _id: 64)
 */
type RequestDoc = {
  _id: number;
  rejections?: any[];
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

    const body = await req.json().catch(() => ({}));
    const commentRaw = (body as any)?.comment;
    const comment =
      typeof commentRaw === "string" && commentRaw.trim().length
        ? commentRaw.trim().slice(0, 500)
        : null;

    const SESSION_SECRET = process.env.SESSION_SECRET;
    if (!SESSION_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Missing SESSION_SECRET" },
        { status: 500 }
      );
    }

    const store = await cookies();
    const token = store.get("admin_session")?.value;
    if (!isValidSession(token, SESSION_SECRET)) {
      return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
    }

    const profile = store.get("admin_profile")?.value ?? null;
    if (!profile || !MOD_PROFILES.includes(profile as any)) {
      return NextResponse.json(
        { ok: false, error: "Missing admin profile" },
        { status: 400 }
      );
    }

    const rejectId = crypto.randomUUID();
    const now = Date.now();

    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB);
    const col = db.collection<RequestDoc>("requests");

    // Only append a rejection entry + mark sync pending.
    const update = {
      $push: {
        rejections: {
          id: rejectId,
          name: profile, // profile name automatically
          reason: comment,
          link: null,
          by: null,
          date: now,
        },
      },
      $set: {
        "sync.pending": true,
        "sync.reason": "reject",
        "sync.rejectId": rejectId,
        "sync.updatedAt": now,
      },
    };

    const result = await col.updateOne({ _id }, update as any);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, rejectId });
  } catch (e: any) {
    console.error("POST /api/requests/[id]/reject error:", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
