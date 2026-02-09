export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getRows } from "@/lib/requests";

// Google Sheets serial date (days since 1899-12-30)
function sheetSerialToMs(serial: number): number {
  const epoch = Date.UTC(1899, 11, 30);
  return epoch + serial * 24 * 60 * 60 * 1000;
}

function normalizeDate(s?: string) {
  if (!s) return 0;

  const trimmed = String(s).trim();
  if (!trimmed) return 0;

  // numeric serials like "46059.82665"
  const asNum = Number(trimmed);
  if (!Number.isNaN(asNum) && Number.isFinite(asNum)) {
    return sheetSerialToMs(asNum);
  }

  // "2/3/2026 19:27:10"
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2}:\d{2})$/);
  if (m) {
    const [, mm, dd, yyyy, time] = m;
    // local time parse (no Z) so it matches what you display in UI
    const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${time}`;
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? 0 : ms;
  }

  // fallback
  const ms = Date.parse(trimmed);
  return Number.isNaN(ms) ? 0 : ms;
}

function toSendCount(v: any): number {
  // blank -> 0, "3" -> 3, "  " -> 0, "abc" -> 0
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const searchMode = searchParams.get("searchMode") || "";
    const filterSent = searchParams.get("filterSent") === "true";
    const sortBy = searchParams.get("sortBy") || "latest"; // "latest" | "sent_latest"

    let rows: any[] = await getRows();

    // ✅ NEW: Filter by sent status = send_count > 0
    if (filterSent) {
      rows = rows.filter((r) => toSendCount(r.send_count) > 0);
    }

    // Filter by search
    if (search && searchMode) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => String(r?.[searchMode] ?? "").toLowerCase().includes(q));
    }

    // Sort
    if (sortBy === "sent_latest") {
      // ✅ Most recently sent
      rows.sort((a, b) => normalizeDate(b.last_sent_at) - normalizeDate(a.last_sent_at));
    } else if (sortBy === "latest") {
      // ✅ Most recently submitted
      rows.sort((a, b) => normalizeDate(b.submission_date) - normalizeDate(a.submission_date));
    }

    const total = rows.length;

    // allow limit=0 to return stats without paging
    if (limit === 0) {
      return NextResponse.json({
        data: [],
        total,
        page: 1,
        limit: 0,
        totalPages: 1,
      });
    }

    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    const data = rows.slice(start, end);

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (e: any) {
    console.error("Error in /api/requests:", e);

    return NextResponse.json({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  }
}
