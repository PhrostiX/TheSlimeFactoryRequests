export type Row = {
  submission_date: string;
  discord_username: string;
  in_game_name: string;
  level_id: string;
  difficulty: string;
  safe_url: string;
  involved_confirm: string;
  send_count: string;
  last_sent_at: string; // ✅ NEW
  status: string;
  reviewed: string;
  notes_given: string;
};

function parseCSV(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (ch === '"' && next === '"') {
      cell += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }

  row.push(cell);
  if (row.some((v) => v.trim() !== "")) rows.push(row);

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  const data = rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
    return obj;
  });

  return data;
}

function pickRow(raw: Record<string, string>): Row {
  // Whitelist ONLY the columns you want to expose
  return {
    submission_date: raw["submission_date"] ?? "",
    discord_username: raw["discord_username"] ?? "",
    in_game_name: raw["in_game_name"] ?? "",
    level_id: raw["level_id"] ?? "",
    difficulty: raw["difficulty"] ?? "",
    safe_url: raw["safe_url"] ?? "",
    involved_confirm: raw["involved_confirm"] ?? "",
    send_count: raw["send_count"] ?? "",
    last_sent_at: raw["last_sent_at"] ?? "", // ✅ NEW
    status: raw["status"] ?? "",
    reviewed: raw["reviewed"] ?? "",
    notes_given: raw["notes_given"] ?? "",
  };
}

export async function getRows(): Promise<Row[]> {
  const url = process.env.PUBLIC_SHEET_CSV_URL;

  if (!url) {
    console.warn("PUBLIC_SHEET_CSV_URL not configured. Returning empty data.");
    return [];
  }

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "text/csv,text/plain,*/*",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const text = await res.text();

    if (!res.ok) {
      console.error(`Failed to fetch CSV: ${res.status}`);
      return [];
    }

    const trimmed = text.trim();

    if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
      console.error("Google returned HTML instead of CSV");
      return [];
    }

    const parsed = parseCSV(text);
    return parsed.map(pickRow);
  } catch (error) {
    console.error("Error fetching CSV data:", error);
    return [];
  }
}
