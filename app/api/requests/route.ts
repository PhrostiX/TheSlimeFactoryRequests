export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "../../../server-dns";
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const limit = Math.min(Number(searchParams.get("limit") ?? 25), 100);
    const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
    const skip = (page - 1) * limit;

    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB);
    const col = db.collection("requests");

    const [items, total] = await Promise.all([
      col.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      col.countDocuments({}),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e: any) {
    console.error("API /requests error:", e);
    return NextResponse.json(
      { error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
