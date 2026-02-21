export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "../../../server-dns";
import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongo";
import type { Sort } from "mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // ----- LIMIT -----
    const rawLimit = Number(searchParams.get("limit") ?? 25);
    const limit = Math.min(
      Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 25,
      10000 // allow large fetch so older sends show
    );

    // ----- PAGE -----
    const rawPage = Number(searchParams.get("page") ?? 1);
    const page = Math.max(Number.isFinite(rawPage) ? rawPage : 1, 1);
    const skip = (page - 1) * limit;

    // ----- SORTING -----
    // sortBy=latest (default): updatedAt desc, then createdAt desc
    // sortBy=created: createdAt desc only
    const sortBy = (searchParams.get("sortBy") || "latest").toLowerCase();

    const sort: Sort =
      sortBy === "created"
        ? { createdAt: -1 }
        : { updatedAt: -1, createdAt: -1 };

    // ----- DB -----
    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB);
    const col = db.collection("requests");

    const [items, total] = await Promise.all([
      col
        .find({})
        .sort(sort)
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