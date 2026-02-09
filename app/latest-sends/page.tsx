"use client";

import { useEffect, useMemo, useState } from "react";
import TabNav from "../components/TabNav";
import Pagination from "../components/Pagination";

type Row = {
  submission_date: string;
  discord_username: string;
  in_game_name: string;
  level_id: string;
  difficulty: string;
  safe_url: string;
  involved_confirm: string;
  send_count: string;
  last_sent_at?: string;
  status?: string;
  reviewed?: string;
  notes_given?: string;
};

function sheetSerialToMs(serial: number): number {
  const epoch = Date.UTC(1899, 11, 30);
  return epoch + serial * 24 * 60 * 60 * 1000;
}

function normalizeDateToMs(v?: string): number {
  if (!v) return 0;
  const trimmed = String(v).trim();
  if (!trimmed) return 0;

  // Google Sheets serial number like "46059.82665"
  const n = Number(trimmed);
  if (!Number.isNaN(n) && Number.isFinite(n)) return sheetSerialToMs(n);

  // "2/7/2026 23:03:13"
  const m = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2}:\d{2})$/
  );
  if (m) {
    const [, mm, dd, yyyy, time] = m;
    // local parse (same behavior you used elsewhere)
    const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(
      2,
      "0"
    )}T${time}`;
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? 0 : ms;
  }

  const ms = Date.parse(trimmed);
  return Number.isNaN(ms) ? 0 : ms;
}

function formatSubmitted(v?: string) {
  if (!v) return "—";
  const trimmed = String(v).trim();
  if (!trimmed) return "—";

  const n = Number(trimmed);
  if (!Number.isNaN(n) && Number.isFinite(n)) {
    const ms = sheetSerialToMs(n);
    return new Date(ms).toLocaleString();
  }

  const m = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2}:\d{2})$/
  );
  if (m) {
    const [, mm, dd, yyyy, time] = m;
    const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(
      2,
      "0"
    )}T${time}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? trimmed : d.toLocaleString();
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? trimmed : d.toLocaleString();
}

function isInvolved(v?: string) {
  return (v || "").toLowerCase().includes("i was involved");
}

function toSendCount(v?: any) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function hasBeenSent(r: Row) {
  return toSendCount(r.send_count) > 0;
}

function statusBadge(status?: string) {
  const s = String(status ?? "").trim();
  const low = s.toLowerCase();

  if (!s) return { text: "", style: {} as React.CSSProperties };

  if (low.includes("pending")) {
    return { text: "Pending Review", style: styles.statusPending };
  }
  if (low.includes("rated")) {
    return { text: "★ Rated", style: styles.statusRated };
  }
  if (low.includes("sending")) {
    return { text: "Sending", style: styles.statusSending };
  }
  if (low.includes("reject")) {
    return { text: "Rejected", style: styles.statusRejected };
  }

  return { text: s, style: styles.statusNeutral };
}

function NotesButton({ notes }: { notes?: string }) {
  const text = (notes || "").trim();
  if (!text) return null;

  return (
    <details style={styles.notesDetails}>
      <summary style={styles.notesSummary}>
        <span style={styles.notesPill}>Notes</span>
        <span style={styles.notesSummaryText}>View</span>
      </summary>
      <div style={styles.notesBody}>{text}</div>
    </details>
  );
}

function LinkArea({ safeUrl, notes }: { safeUrl?: string; notes?: string }) {
  const url = (safeUrl || "").trim();
  if (!url) return null;

  const isInvalid = url.toLowerCase().includes("invalid");

  if (isInvalid) {
    return (
      <div style={styles.videoLink}>
        <div style={styles.linkRow}>
          <details style={styles.details}>
            <summary style={styles.summary}>
              <span style={styles.pillError}>Link issue</span>
              <span style={styles.summaryText}>Details</span>
            </summary>
            <div style={styles.detailsBody}>
              Link must be from YouTube. Please contact <strong>@phrostix</strong>{" "}
              on Discord if you think this was a mistake.
            </div>
          </details>

          <NotesButton notes={notes} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.videoLink}>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        style={{ ...styles.link, textDecoration: "underline" }}
      >
        Watch video
      </a>
    </div>
  );
}

export default function LatestSendsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Only show: involved + sent
  const sentRows = useMemo(() => {
    const filtered = rows
      .filter((r) => isInvolved(r.involved_confirm))
      .filter((r) => hasBeenSent(r));

    // ✅ Sort by last_sent_at (desc). Fallback to submission_date (desc).
    filtered.sort((a, b) => {
      const aMs = normalizeDateToMs(a.last_sent_at) || normalizeDateToMs(a.submission_date);
      const bMs = normalizeDateToMs(b.last_sent_at) || normalizeDateToMs(b.submission_date);
      return bMs - aMs;
    });

    return filtered;
  }, [rows]);

  const total = sentRows.length;
  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageSafe = Math.min(Math.max(1, currentPage), totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * limit;
    const end = start + limit;
    return sentRows.slice(start, end);
  }, [sentRows, pageSafe]);

  useEffect(() => {
    setLoading(true);

    // Fetch a big set once; we filter + paginate client-side so the tab feels identical to Search.
    const params = new URLSearchParams({
      page: "1",
      limit: "10000",
      sortBy: "latest",
      // NOTE: we do NOT rely on server-side filterSent or sortBy sent_latest,
      // because your API may not support those consistently. We handle it here.
    });

    fetch(`/api/requests?${params}`)
      .then((r) => r.json())
      .then((response) => {
        setRows(response.data || []);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [total]);

  return (
    <>
      <TabNav />
      <main style={styles.page}>
        <div style={styles.container} className="frosted-glass-strong">
          <h1 style={styles.title}>Latest Sends</h1>

          {loading && <div style={styles.loadingState}>Loading results...</div>}

          {!loading && total > 0 && (
            <p style={styles.stats}>
              Total sends: <strong>{total}</strong>
            </p>
          )}

          <div style={styles.results}>
            {!loading && total === 0 && (
              <div style={styles.noResults}>
                Nothing marked as sent yet. Increase <strong>send_count</strong> (and optionally <strong>last_sent_at</strong>) in your sheet and refresh.
              </div>
            )}

            {pageRows.map((r, i) => {
              const name = r.in_game_name || r.discord_username || "—";

              const submitted = formatSubmitted(r.submission_date);
              const sendCount = toSendCount(r.send_count);

              const lastSentRaw = String(r.last_sent_at ?? "").trim();
              const lastSent = lastSentRaw ? formatSubmitted(lastSentRaw) : "";

              const badge = statusBadge(r.status);

              return (
                <div
                  key={`${r.level_id}-${i}`}
                  style={{ ...styles.card, animationDelay: `${i * 0.05}s` }}
                  className="frosted-glass result-card animate-slide-in-up"
                >
                  <div style={styles.cardInner}>
                    {badge.text ? (
                      <div style={{ ...styles.statusBadge, ...badge.style }} title="Status">
                        {badge.text}
                      </div>
                    ) : null}

                    <div style={styles.cardHeader}>
                      <div style={styles.cardItem}>
                        <strong>ID:</strong> {r.level_id || "—"}
                      </div>

                      <div style={styles.cardItem}>
                        <strong>Username:</strong> {name}
                      </div>

                      <div style={styles.cardItem}>
                        <strong>Submitted:</strong> {submitted}
                        {lastSent ? (
                          <div style={styles.subLine}>
                            <span style={styles.subLabel}>Last sent:</span>{" "}
                            <span style={styles.subValue}>{lastSent}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div style={styles.cardDetails}>
                      <div style={styles.cardItem}>
                        <strong>Difficulty:</strong> {r.difficulty || "—"}
                      </div>

                      <div style={styles.cardItem}>
                        <strong>Send Count:</strong> {sendCount}
                      </div>
                    </div>

                    <LinkArea safeUrl={r.safe_url} notes={r.notes_given} />
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && total > 0 && totalPages > 1 && (
            <Pagination currentPage={pageSafe} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </div>
      </main>

      <style jsx>{`
        .result-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px var(--shadow-color);
        }
        .result-card {
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    paddingTop: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "min(900px, 100%)",
    padding: "40px 32px",
    borderRadius: 24,
  },
  title: {
    fontSize: "clamp(28px, 4vw, 36px)",
    fontWeight: 700,
    textAlign: "center",
    margin: 0,
    marginBottom: 24,
    background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  loadingState: {
    textAlign: "center",
    padding: 32,
    opacity: 0.7,
    fontSize: 16,
    color: "var(--foreground)",
  },
  stats: {
    opacity: 0.8,
    marginTop: 0,
    marginBottom: 16,
    fontSize: 14,
    color: "var(--foreground)",
    textAlign: "center",
  },
  results: {
    display: "grid",
    gap: 16,
  },
  noResults: {
    opacity: 0.7,
    textAlign: "center",
    padding: 28,
    color: "var(--foreground)",
    borderRadius: 16,
  },

  card: {
    borderRadius: 16,
    padding: 15,
    paddingBottom: 12,
    transition: "all 200ms ease",
  },
  cardInner: {
    position: "relative",
    minHeight: 140,
    paddingBottom: 18,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  cardDetails: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
  },
  cardItem: {
    fontSize: 14,
    color: "var(--foreground)",
  },

  subLine: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.9,
  },
  subLabel: {
    fontWeight: 800,
    opacity: 0.9,
  },
  subValue: {
    opacity: 0.95,
  },

  statusBadge: {
    position: "absolute",
    right: 18,
    bottom: 14,
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.3,
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
    userSelect: "none",
  },

  statusSending: {
    background: "linear-gradient(135deg, rgba(16,185,129,0.30), rgba(34,197,94,0.14))",
  },
  statusPending: {
    background: "linear-gradient(135deg, rgba(250,204,21,0.30), rgba(245,158,11,0.14))",
  },
  statusRated: {
    background: "linear-gradient(135deg, rgba(168,85,247,0.30), rgba(236,72,153,0.14))",
    textShadow: "0 0 10px rgba(236,72,153,0.22)",
  },
  statusRejected: {
    background: "linear-gradient(135deg, rgba(236,72,153,0.30), rgba(168,85,247,0.14))",
  },
  statusNeutral: {
    background: "rgba(255,255,255,0.10)",
  },

  videoLink: {
    marginTop: 24,
    paddingTop: 18,
    borderTop: "1px solid var(--glass-border)",
    marginBottom: 8,
  },
  link: {
    color: "var(--accent)",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 15,
    transition: "opacity 200ms ease",
  },

  linkRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },

  details: {
    width: "fit-content",
  },
  summary: {
    listStyle: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
  },
  summaryText: {
    opacity: 0.85,
    fontWeight: 700,
    fontSize: 13,
  },
  pillError: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.2,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(245, 158, 11, 0.12)",
  },
  detailsBody: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.35,
    opacity: 0.92,
    border: "1px solid var(--glass-border)",
    background: "rgba(0,0,0,0.18)",
    maxWidth: 520,
  },

  notesDetails: {
    width: "fit-content",
  },
  notesSummary: {
    listStyle: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
  },
  notesPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.2,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(59, 130, 246, 0.12)",
  },
  notesSummaryText: {
    opacity: 0.85,
    fontWeight: 700,
    fontSize: 13,
  },
  notesBody: {
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.35,
    opacity: 0.95,
    border: "1px solid var(--glass-border)",
    background: "rgba(0,0,0,0.18)",
    maxWidth: 520,
    whiteSpace: "pre-wrap",
  },
};
