export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "../../../../../server-dns";
import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { getMongoClient } from "@/lib/mongo";
import { getAdminProfileDef } from "@/lib/adminProfiles";

type Rating = "rate" | "feature" | "epic" | "legendary" | "mythic";

/**
 * IMPORTANT:
 * Your Mongo documents use numeric _id (example: _id: 64)
 * So we explicitly type the collection correctly.
 */
type RequestDoc = {
  _id: number;
  sendCount?: number;
  reviews?: { sendCount?: number };
  sends?: any[];
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

function normalizeRating(raw: unknown): Rating | null {
  const v = String(raw ?? "").toLowerCase().trim();
  if (v === "send" || v === "send-only") return "rate";
  if (v === "rate") return "rate";
  if (v === "feature") return "feature";
  if (v === "epic") return "epic";
  if (v === "legendary") return "legendary";
  if (v === "mythic") return "mythic";
  return null;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    // ✅ Your Mongo _id is numeric
    const _id = Number(id);
    if (!Number.isFinite(_id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid id" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rating = normalizeRating((body as any)?.rating);
    if (!rating) {
      return NextResponse.json(
        { ok: false, error: "Invalid rating" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { ok: false, error: "Not authorized" },
        { status: 401 }
      );
    }

    const profile = store.get("admin_profile")?.value ?? null;
    const pdef = getAdminProfileDef(profile);
    if (!profile || !pdef) {
      return NextResponse.json(
        { ok: false, error: "Missing admin profile" },
        { status: 400 }
      );
    }
    if (!pdef.permissions.canSend) {
      return NextResponse.json(
        { ok: false, error: "This profile cannot log sends." },
        { status: 403 }
      );
    }

    const sendId = crypto.randomUUID();
    const now = Date.now();

    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB);
    const col = db.collection<RequestDoc>("requests");

    const update = {
      $inc: {
        sendCount: 1,
        "reviews.sendCount": 1,
      },
      $push: {
        sends: {
          id: sendId,
          type: rating,
          by: profile,
          source: "website",
          date: now,
          comment: comment,
        },
      },
      $set: {
        "sync.pending": true,
        "sync.reason": "send",
        "sync.sendId": sendId,
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

    return NextResponse.json({ ok: true, sendId });
  } catch (e: any) {
    console.error("POST /api/requests/[id]/send error:", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}