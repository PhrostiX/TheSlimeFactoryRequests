import { NextResponse } from "next/server";

//this is a legacy function
export async function GET() {
  const url = process.env.PUBLIC_SHEET_CSV_URL;
  const isPlaceholder = url === "google sheets_URL";

  return NextResponse.json({
    configured: !!url && !isPlaceholder,
    hasUrl: !!url,
    isPlaceholder,
    urlStart: url && !isPlaceholder ? url.slice(0, 60) : null,
    urlEnd: url && !isPlaceholder ? url.slice(-30) : null,
    length: url?.length ?? 0,
  });
}
