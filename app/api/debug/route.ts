import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.PUBLIC_SHEET_CSV_URL;
  const isPlaceholder = url === "your_google_sheets_csv_url_here";

  return NextResponse.json({
    configured: !!url && !isPlaceholder,
    hasUrl: !!url,
    isPlaceholder,
    urlStart: url && !isPlaceholder ? url.slice(0, 60) : null,
    urlEnd: url && !isPlaceholder ? url.slice(-30) : null,
    length: url?.length ?? 0,
  });
}
