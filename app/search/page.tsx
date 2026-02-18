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
  last_sent_at?: string; // ✅ this will work once getRows() includes column K
  status?: string;
  reviewed?: string;
  notes_given?: string;
};

type SearchMode = "level_id" | "in_game_name";

function formatSubmitted(v?: string) {
  if (!v) return "—";
  const trimmed = String(v).trim();
  if (!trimmed) return "—";

  // Google Sheets serial date like "46059.82665"
  const n = Number(trimmed);
  if (!Number.isNaN(n) && Number.isFinite(n)) {
    const ms = Date.UTC(1899, 11, 30) + n * 86400000;
    return new Date(ms).toLocaleString();
  }

  // "2/7/2026 23:03:13"
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2}:\d{2})$/);
  if (m) {
    const [, mm, dd, yyyy, time] = m;
    const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${time}`;
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
    return {
      text: "Pending Review",
      style: styles.statusPending,
    };
  }

  if (low.includes("rated")) {
    return {
      text: "★ Rated",
      style: styles.statusRated,
    };
  }

  if (low.includes("sending")) {
    return {
      text: "Sending",
      style: styles.statusSending,
    };
  }

  if (low.includes("reject")) {
    return {
      text: "Rejected",
      style: styles.statusRejected,
    };
  }

  // fallback
  return {
    text: s,
    style: styles.statusNeutral,
  };
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

// Link area + (invalid link) shows Details + Notes
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
              Link must be from YouTube. Please contact <strong>@phrostix</strong> on Discord if you think this was a mistake.
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

export default function SearchPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [mode, setMode] = useState<SearchMode>("level_id");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Only show involved rows
  const involvedRows = useMemo(() => rows.filter((r) => isInvolved(r.involved_confirm)), [rows]);

  const total = involvedRows.length;
  const limit = 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageSafe = Math.min(Math.max(1, currentPage), totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * limit;
    const end = start + limit;
    return involvedRows.slice(start, end);
  }, [involvedRows, pageSafe]);

  const hasSearched = query.trim().length > 0;

  useEffect(() => {
  }, [mode, query]);

  return (
    <>
      <TabNav />
      <main style={styles.page}>
        <div style={styles.container} className="frosted-glass-strong">
          <h1 style={styles.title}>Search Database</h1>

          <div style={styles.disclaimer} className="frosted-glass animate-fade-in">
            <strong>⚠️ Safety Notice</strong>
            <p style={{ margin: "8px 0 0 0", fontSize: 14, opacity: 0.85 }}>
              Be cautious when clicking on video links. Only click links you trust or that belong to you. External links may lead to unexpected or potentially harmful content.
            </p>
          </div>

          {/* SIMPLE SEARCH BAR + FILTER TOGGLE */}
          <div style={styles.searchBarRow} className="frosted-glass">
            <div style={styles.searchLeft}>
              <Label>Search (ID / level name / uploader)</Label>
              <MiniInput
                value={filters.text}
                onChange={(e) => setFilters((p) => ({ ...p, text: e.target.value }))}
                placeholder="Try: 87284332, Epilogue, baberich..."
              />
            </div>

          {loading && <div style={styles.loadingState}>Loading results...</div>}

          {!loading && hasSearched && total > 0 && (
            <p style={styles.stats}>
              Found <strong>{total}</strong> {total === 1 ? "result" : "results"}
            </p>
          )}

          <div style={styles.results}>
            {!loading && hasSearched && total === 0 && <div style={styles.noResults}>No matches found.</div>}

            {pageRows.map((r, i) => {
              const name = r.in_game_name || r.discord_username || "—";
              const submitted = formatSubmitted(r.submission_date);

              const sent = hasBeenSent(r);

              // ✅ robust last_sent read
              const lastSentRaw = String(r.last_sent_at ?? "").trim();
              const lastSent = sent && lastSentRaw ? formatSubmitted(lastSentRaw) : "";

              const badge = statusBadge(r.status);

              return (
                <div
                  key={`${r.level_id}-${i}`}
                  style={{ ...styles.card, animationDelay: `${i * 0.05}s` }}
                  className="frosted-glass result-card animate-slide-in-up"
                >
                  <div style={styles.cardInner}>
                    {/* Status bottom-right */}
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

                      {/* ✅ ONLY show send_count if sent */}
                      {sent ? (
                        <div style={styles.cardItem}>
                          <strong>Send Count:</strong> {toSendCount(r.send_count)}
                        </div>
                      ) : null}
                    </div>

                    <LinkArea safeUrl={r.safe_url} notes={r.notes_given} />
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && hasSearched && total > 0 && totalPages > 1 && (
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
  disclaimer: {
    padding: "16px 20px",
    borderRadius: 12,
    marginBottom: 24,
    textAlign: "center",
    color: "var(--foreground)",
    borderLeft: "4px solid #f59e0b",
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
    marginTop: 12,
    marginBottom: 16,
    fontSize: 14,
    color: "var(--foreground)",
    textAlign: "center",
  },
  searchForm: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 28,
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  labelText: {
    fontWeight: 600,
    fontSize: 14,
    color: "var(--foreground)",
  },
  select: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    color: "var(--foreground)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 200ms ease",
  },
  input: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    width: "min(400px, 100%)",
    fontSize: 14,
    color: "var(--foreground)",
    transition: "all 200ms ease",
  },
  results: {
    display: "grid",
    gap: 16,
  },
  noResults: {
    opacity: 0.7,
    textAlign: "center",
    padding: 32,
    color: "var(--foreground)",
  },

  card: {
    borderRadius: 16,
    padding: 15,
    paddingBottom: 12,
    transition: "all 200ms ease",
  },
  cardInner: {
    position: "relative",
    minHeight: 140, // gives breathing room
    paddingBottom: 18, // extra spacing so stuff sits lower
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
    bottom: 14, // ✅ makes it sit LOWER
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.3,
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
    userSelect: "none",
  },


  // ✅ status variants
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
    marginBottom: 8, // ✅ pushes it closer to bottom
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
