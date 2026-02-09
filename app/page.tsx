"use client";

import { useEffect, useMemo, useState } from "react";
import TabNav from "./components/TabNav";

type StatsRow = {
  involved_confirm?: string;
  send_count?: string;
  status?: string;
};

function isInvolved(v?: string) {
  return (v || "").toLowerCase().includes("i was involved");
}

function toSendCount(v?: any) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function statusIncludes(status: any, needle: string) {
  return String(status ?? "").toLowerCase().includes(needle);
}

export default function HomePage() {
  const [rows, setRows] = useState<StatsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("—");

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams({
      page: "1",
      limit: "10000",
      sortBy: "latest",
    });

    fetch(`/api/requests?${params}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : []);
        setLastUpdated(new Date().toLocaleString());
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLastUpdated(new Date().toLocaleString());
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const involved = rows.filter((r) => isInvolved(r.involved_confirm));

    const totalRequests = involved.length;
    const pendingReview = involved.filter((r) => statusIncludes(r.status, "pending")).length;
    const sent = involved.filter((r) => toSendCount(r.send_count) > 0).length;
    const rated = involved.filter((r) => statusIncludes(r.status, "rated")).length;
    const rejected = involved.filter((r) => statusIncludes(r.status, "reject")).length;

    return { totalRequests, pendingReview, sent, rated, rejected };
  }, [rows]);

  return (
    <>
      <TabNav />

      <main style={styles.page}>
        {/* Logo */}
        <div style={styles.logoWrap} className="animate-float-slow">
          <img
            src="/slimefactory-requests.png"
            alt="The Slime Factory Requests"
            style={styles.logo}
            onError={(e) => {
              (e.currentTarget.style.display as any) = "none";
            }}
          />
        </div>

        {/* Plain subtitle (NOT a pill/button) */}
        <div style={styles.subtitle}>
          Geometry Dash Level Request Tracker
        </div>

        {/* Top section: stats + actions (no stretching / no empty space) */}
        <section style={styles.heroGrid}>
          {/* Stats (new creative layout) */}
          <div style={styles.statsCard} className="frosted-glass-strong">
            <div style={styles.statsHeader}>
              <h2 style={styles.statsTitle}>Global Stats</h2>
              <div style={styles.statsMeta}>
                <span style={{ opacity: 0.85 }}>*Involved-only</span>
                <span style={{ opacity: 0.55 }}>•</span>
                <span style={{ opacity: 0.85 }}>
                  {loading ? "Updating…" : `Last updated: ${lastUpdated}`}
                </span>
              </div>
            </div>

            {loading ? (
              <div style={styles.loading}>Loading…</div>
            ) : (
              <div style={styles.statGrid}>
                <StatTile label="Total" value={stats.totalRequests} tone="total" />
                <StatTile label="Pending" value={stats.pendingReview} tone="pending" />
                <StatTile label="Sent" value={stats.sent} tone="sent" />
                <StatTile label="Rated" value={stats.rated} tone="rated" />
                <StatTile label="Rejected" value={stats.rejected} tone="rejected" />
              </div>
            )}
          </div>

          {/* Actions (auto height, compact, no dead space) */}
          <div style={styles.actionsCard} className="frosted-glass-strong">
            <h2 style={styles.actionsTitle}>Quick Actions</h2>

            <div style={styles.actions}>
              <a href="/search" style={{ ...styles.actionBtn, ...styles.btnSearch }} className="premium-btn">
                Search
              </a>

              <a href="/latest-sends" style={{ ...styles.actionBtn, ...styles.btnSends }} className="premium-btn">
                Latest Sends
              </a>

              <a href="/latest-submissions" style={{ ...styles.actionBtn, ...styles.btnSubs }} className="premium-btn">
                Latest Submissions
              </a>
            <p style={styles.actionsSubtext}>
              Browse requests, search submissions, and view recent sends.
            </p>
          </div>
              <a
                href="https://forms.gle/"
                target="_blank"
                rel="noreferrer"
                style={styles.feedbackBtn}
                className="premium-btn"
              >
                Send Feedback
              </a>
            </div>
        </section>

        {/* About */}
        <section style={styles.about} className="frosted-glass-strong">
          <h2 style={styles.aboutTitle}>About This Database</h2>

          <p style={styles.aboutText}>
            This website is a Geometry Dash request dashboard designed to make level submissions easier to browse, search, and track.
            Requests are submitted through a Google Form and automatically stored in a Google Spreadsheet, which this site pulls from.
          </p>

          <h3 style={styles.aboutSubTitle}>How it works</h3>
          <p style={styles.aboutText}>
            Users submit a request with a level ID and a video link. Mods can review, send, and update statuses in the sheet—your website reflects
            those updates.
          </p>
        </section>
      </main>

      <style jsx>{`
        /* Small hover polish */
        a.premium-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 42px rgba(0,0,0,0.32);
        }
        a.premium-btn:active {
          transform: translateY(0px);
          opacity: 0.96;
        }
      `}</style>
    </>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "total" | "pending" | "sent" | "rated" | "rejected";
}) {
  const toneStyle =
    tone === "pending"
      ? styles.tonePending
      : tone === "sent"
        ? styles.toneSent
        : tone === "rated"
          ? styles.toneRated
          : tone === "rejected"
            ? styles.toneRejected
            : styles.toneTotal;

  return (
    <div style={{ ...styles.statTile, ...toneStyle }}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    paddingTop: 92,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 56,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
  },

  logoWrap: {
    width: "min(1040px, 100%)",
    display: "flex",
    justifyContent: "center",
    marginTop: 6,
  },
  logo: {
    width: "min(560px, 100%)",
    height: "auto",
    borderRadius: 18,
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
  },

  subtitle: {
    marginTop: 2,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 800,
    color: "rgba(255,255,255,0.92)",
    textShadow: "0 10px 26px rgba(0,0,0,0.35)",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  // key: align cards to the top and let them be their natural heighta
  heroGrid: {
    width: "min(1040px, 100%)",
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: 18,
    alignItems: "start",
  },

  statsCard: {
    padding: 20,
    borderRadius: 22,
  },
  statsHeader: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 14,
  },
  statsTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 950,
    color: "var(--foreground)",
  },
  statsMeta: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    fontSize: 12,
    color: "var(--foreground)",
  },

  loading: {
    padding: 18,
    opacity: 0.75,
    fontSize: 14,
    color: "var(--foreground)",
  },

  // New “creative” stats layout: compact grid tiles
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  statTile: {
    borderRadius: 18,
    padding: "14px 14px",
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 24px rgba(0,0,0,0.22)",
    minHeight: 86,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.88,
    color: "var(--foreground)",
    letterSpacing: 0.2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 950,
    color: "var(--foreground)",
    letterSpacing: 0.2,
  },

  // Neon-ish borders per tile
  toneTotal: {
    border: "1px solid rgba(59,130,246,0.28)",
    boxShadow: "0 0 0 1px rgba(59,130,246,0.12), 0 12px 24px rgba(0,0,0,0.22)",
  },
  tonePending: {
    border: "1px solid rgba(245,158,11,0.30)",
    boxShadow: "0 0 0 1px rgba(245,158,11,0.12), 0 12px 24px rgba(0,0,0,0.22)",
  },
  toneSent: {
    border: "1px solid rgba(16,185,129,0.30)",
    boxShadow: "0 0 0 1px rgba(16,185,129,0.12), 0 12px 24px rgba(0,0,0,0.22)",
  },
  toneRated: {
    border: "1px solid rgba(168,85,247,0.30)",
    boxShadow: "0 0 0 1px rgba(168,85,247,0.12), 0 12px 24px rgba(0,0,0,0.22)",
  },
  toneRejected: {
    border: "1px solid rgba(236,72,153,0.30)",
    boxShadow: "0 0 0 1px rgba(236,72,153,0.12), 0 12px 24px rgba(0,0,0,0.22)",
  },

  actionsCard: {
    flex: "1 1 520px",
    minWidth: 340,
    padding: 22,
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    height: "100%", // ✅ makes it match the left card height
  },
  actionsTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 950,
    color: "var(--foreground)",
  },
  actions: {
    display: "grid",
    gap: 12,
    marginTop: 12,
    flexGrow: 1, // ✅ fills the card so it stretches downward
  },

  // Buttons: compact + non-grey, no dead space
  actionBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 16px",
    borderRadius: 14,
    textDecoration: "none",
    fontWeight: 950,
    fontSize: 15,
    color: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
    transition: "all 220ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
  btnSearch: {
    background: "linear-gradient(135deg, rgba(59,130,246,0.30), rgba(37,99,235,0.16))",
  },
  btnSends: {
    background: "linear-gradient(135deg, rgba(16,185,129,0.30), rgba(34,197,94,0.16))",
  },
  btnSubs: {
    background: "linear-gradient(135deg, rgba(168,85,247,0.30), rgba(236,72,153,0.16))",
  },
  btnFeedback: {
    color: "#111827",
    background: "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(251,191,36,0.85))",
  },

  feedbackBtn: {
    width: "fit-content",
    minWidth: "unset",
    justifySelf: "center",
    alignSelf: "center",

    marginTop: 16,
    padding: "10px 18px",
    borderRadius: 14,
    fontWeight: 950,
    fontSize: 14,
    textDecoration: "none",
    color: "#111827",
    border: "1px solid rgba(255,255,255,0.18)",
    background:
      "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(251,191,36,0.85))",
    boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
    transition: "all 220ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  actionsSubtext: {
    margin: 0,
    textAlign: "center",
    fontSize: 13,
    opacity: 0.8,
    color: "var(--foreground)",
  },

  about: {
    width: "min(1040px, 100%)",
    padding: "26px 26px",
    borderRadius: 22,
    marginTop: 8,
  },
  aboutTitle: {
    margin: 0,
    marginBottom: 12,
    fontSize: 28,
    fontWeight: 950,
    color: "var(--foreground)",
  },
  aboutSubTitle: {
    margin: "14px 0 8px 0",
    fontSize: 16,
    fontWeight: 950,
    color: "var(--foreground)",
  },
  aboutText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    opacity: 0.9,
    color: "var(--foreground)",
  },
};

// Simple responsive fallback for small screens
// (Next/React inline styles can’t do media queries; this grid still wraps okay,
// but if you want perfect mobile we can move heroGrid to CSS)
