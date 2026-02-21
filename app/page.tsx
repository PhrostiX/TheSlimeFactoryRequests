"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TabNav from "./components/TabNav";
import AdminButton from "./components/AdminButton";

type Review = {
  type: number;
  date: number;
  note?: string | null;
};

type MongoRequest = {
  _id?: any;
  checkFilter?: boolean;
  createdAt?: string;
  levelInfo?: {
    difficulties?: number[] | null;
  } | null;
  reviews?: Record<string, Review> | null;
  status?: "pending" | "sending" | "rated" | "rejected" | "stolen" | "dne";
  sendCount?: number;
  sends?: any[];
};

type TagKey = "pending" | "sending" | "rated" | "rejected" | "stolen" | "dne";

function isInvolvedMongo(r: MongoRequest) {
  return r.checkFilter === true;
}

function latestReview(r: MongoRequest): Review | null {
  const obj = r.reviews || null;
  if (!obj) return null;
  const list = Object.values(obj).filter(Boolean);
  if (!list.length) return null;
  list.sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
  return list[0] ?? null;
}

function statusFromRequest(r: MongoRequest): TagKey {
  const s = (r.status || "").toLowerCase();
  if (s === "sending") return "sending";
  if (s === "rated") return "rated";
  if (s === "rejected") return "rejected";
  if (s === "stolen") return "stolen";
  if (s === "dne") return "dne";
  if (s === "pending") return "pending";

  if (typeof r.sendCount === "number" && r.sendCount > 0) return "sending";
  if (Array.isArray(r.sends) && r.sends.length > 0) return "sending";

  const rev = latestReview(r);
  if (!rev) return "pending";
  const t = Number(rev.type);
  if (t > 0) return "sending";
  if (t === -2) return "sending";
  if (t === -3) return "rated";
  if (t === -1) return "rejected";
  if (t === -4) return "stolen";
  if (t === -5) return "dne";
  return "pending";
}

function isAccepted(r: MongoRequest): boolean {
  // "Accepted" = has been sent at least once
  if (typeof r.sendCount === "number" && r.sendCount > 0) return true;
  if (Array.isArray(r.sends) && r.sends.length > 0) return true;

  // fallback: some schemas mark "sending" via review types
  const rev = latestReview(r);
  if (!rev) return false;
  const t = Number(rev.type);
  if (t > 0) return true;
  if (t === -2) return true;
  return false;
}

export default function HomePage() {
  const [rows, setRows] = useState<MongoRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: "1", limit: "10000", sortBy: "latest" });
    fetch(`/api/requests?${params}`)
      .then((r) => r.json())
      .then((response) => {
        const items: MongoRequest[] = response.items || [];
        setRows(items);
        setUpdatedAt(new Date().toLocaleString());
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setUpdatedAt(new Date().toLocaleString());
        setLoading(false);
      });
  }, []);

  const involved = useMemo(() => rows.filter(isInvolvedMongo), [rows]);

  const stats = useMemo(() => {
    let total = involved.length;
    let pending = 0;
    let accepted = 0;
    let sends = 0;
    let rated = 0;
    let rejected = 0;

    for (const r of involved) {
      const st = statusFromRequest(r);

      if (st === "pending") pending++;
      if (st === "sending") sends++;
      if (st === "rated") rated++;
      if (st === "rejected") rejected++;

      if (isAccepted(r)) accepted++;
    }

    return { total, pending, accepted, sends, rated, rejected };
  }, [involved]);

  return (
    <>
      <TabNav />
      <AdminButton />
      <main style={styles.page}>
        <div style={styles.container}>
          {/* Logo (no card, matches the reference) */}
          <div style={styles.logoWrap}>
            <img
              src="/slimefactory-requests.png"
              alt="The Slime Factory Requests"
              style={styles.logo}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div style={styles.subtitle}>Geometry Dash Level Request Tracker</div>

          {/* Global Stats bar */}
          <section style={styles.statsPanel} className="frosted-glass-strong slimePanel">
            <div style={styles.panelTopRow}>
              <div>
                <div style={styles.panelHeader}>Global Stats</div>
                <div style={styles.panelMeta}>
                  <span style={styles.metaAsterisk}>All requested levels</span>
                  <span style={styles.metaDot}>•</span>
                  <span>Last updated: {updatedAt || "—"}</span>
                </div>
              </div>
            </div>

            <div className="homePillRow" style={styles.pillRowSix}>
              <StatPill title="Total" value={loading ? "…" : stats.total} tone="total" icon="user" />
              <StatPill title="Pending" value={loading ? "…" : stats.pending} tone="pending" icon="clock" />
              <StatPill title="Accepted" value={loading ? "…" : stats.sends} tone="accepted" icon="check" />
              <StatPill title="Sends" value={loading ? "…" : stats.accepted} tone="sent" icon="rocket" />
              <StatPill title="Rated" value={loading ? "…" : stats.rated} tone="rated" icon="sad" />
              <StatPill title="Rejected" value={loading ? "…" : stats.rejected} tone="rejected" icon="x" />
            </div>
          </section>

          {/* Quick Actions row */}
          <section style={styles.quickPanel}>
            <div style={styles.quickHeader}>Quick Actions</div>
            <div className="homeQuickRow" style={styles.quickRow}>
              <ActionBtn href="/search" label="Search" tone="blue" icon="search" />
              <ActionBtn href="/search?preset=sends" label="Latest Sends" tone="green" icon="rocket" />
              <ActionBtn href="/search?preset=submissions" label="Latest Submissions" tone="purple" icon="clock" />
              <ActionBtn href="https://discord.gg/3Sctyn3ekP" label="Send feedback" tone="orange" icon="mail" />
            </div>
          </section>

          {/* About */}
          <section style={styles.about} className="frosted-glass-strong">
            <h2 style={styles.aboutTitle}>How do I submit a level?</h2>
            <p style={styles.aboutText}>
              Please join our discord and use the slime requester bot. You may request your level any time — the
              requests do not close — but be aware that the bot is in beta and might have issues.
            </p>
            <div style={styles.aboutSubTitle}>How it works</div>
            <p style={styles.aboutText}>
              Request with your level ID and a video link (if required). We will ping you when we work with your level,
              including sends, rejects, and status changes.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

function StatPill({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  tone: "total" | "pending" | "accepted" | "sent" | "rated" | "rejected";
  icon: IconName;
}) {
  return (
    <div style={{ ...styles.pill, ...(toneStyles[tone] || {}) }}>
      <div style={styles.pillLeft}>
        <div style={styles.pillTitle}>{title}</div>
        <div style={styles.pillValue}>{value}</div>
      </div>
      <div style={styles.pillIconWrap} aria-hidden="true">
        <Icon name={icon} />
      </div>
    </div>
  );
}

type IconName = "user" | "clock" | "send" | "sad" | "x" | "search" | "rocket" | "mail" | "check";

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  } as const;

  if (name === "user") {
    return (
      <svg {...common}>
        <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...common}>
        <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 6v6l4 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "send") {
    return (
      <svg {...common}>
        <path
          d="M22 2 11 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 2 15 22l-4-9-9-4 20-7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "sad") {
    return (
      <svg {...common}>
        <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="currentColor" strokeWidth="2" />
        <path d="M8.5 9.5h.01M15.5 9.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M16 16a4.5 4.5 0 0 0-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "x") {
    return (
      <svg {...common}>
        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg {...common}>
        <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "rocket") {
    return (
      <svg {...common}>
        <path
          d="M14 4c3 0 6 3 6 6-1.2 3.6-4.9 7.3-8.5 8.5-1.2.4-2.6.1-3.4-.7l-2.4-2.4c-.8-.8-1.1-2.2-.7-3.4C6.7 8.9 10.4 5.2 14 4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M10 14 8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M13 7h0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path
          d="M6.5 19.5 4 20l.5-2.5L7 15l2 2-2.5 2.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg {...common}>
        <path
          d="M20 6 9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // mail
  return (
    <svg {...common}>
      <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="m4 8 8 6 8-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActionBtn({
  href,
  label,
  tone,
  icon,
}: {
  href: string;
  label: string;
  tone: "blue" | "green" | "purple" | "orange";
  icon: IconName;
}) {
  const toneStyle =
    tone === "blue"
      ? styles.btnBlue
      : tone === "green"
        ? styles.btnGreen
        : tone === "purple"
          ? styles.btnPurple
          : styles.btnOrange;

  return (
    <Link href={href} className="homeQuickBtn" style={{ ...styles.quickBtn, ...toneStyle }}>
      <span style={styles.quickBtnIcon} aria-hidden="true">
        <Icon name={icon} />
      </span>
      <span>{label}</span>
    </Link>
  );
}

const toneStyles: Record<string, React.CSSProperties> = {
  total: {
    background: "linear-gradient(135deg, rgba(147, 255, 68, 0.95), rgba(26, 200, 92, 0.60))",
    boxShadow: "0 10px 24px rgba(34,197,94,0.18), inset 0 0 0 1px rgba(0,0,0,0.18)",
  },
  pending: {
    background: "linear-gradient(135deg, rgba(255, 208, 64, 0.95), rgba(235, 176, 36, 0.62))",
    boxShadow: "0 10px 24px rgba(245,158,11,0.18), inset 0 0 0 1px rgba(0,0,0,0.18)",
  },
  accepted: {
    background: "linear-gradient(135deg, rgba(34,197,94,0.92), rgba(16,185,129,0.60))",
    boxShadow: "0 10px 24px rgba(16,185,129,0.18), inset 0 0 0 1px rgba(0,0,0,0.18)",
  },
  sent: {
    background: "linear-gradient(135deg, rgba(55, 230, 255, 0.95), rgba(56, 189, 248, 0.60))",
    boxShadow: "0 10px 24px rgba(56,189,248,0.18), inset 0 0 0 1px rgba(0,0,0,0.18)",
  },
  rated: {
    background: "linear-gradient(135deg, rgba(255, 90, 220, 0.95), rgba(217, 70, 239, 0.58))",
    boxShadow: "0 10px 24px rgba(217,70,239,0.18), inset 0 0 0 1px rgba(0,0,0,0.18)",
  },
  rejected: {
    background: "linear-gradient(135deg, rgba(255, 85, 85, 0.92), rgba(239, 68, 68, 0.55))",
    boxShadow: "0 10px 24px rgba(239,68,68,0.18), inset 0 0 0 1px rgba(0,0,0,0.18)",
  },
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    // Extra top padding so content clears the fixed navbar on desktop + mobile
    paddingTop: "clamp(110px, 18vw, 150px)",
    paddingLeft: "clamp(14px, 4vw, 22px)",
    paddingRight: "clamp(14px, 4vw, 22px)",
    paddingBottom: 28,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  container: {
    width: "min(1100px, 100%)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  logoWrap: {
    display: "flex",
    justifyContent: "center",
    paddingTop: 10,
  },
  logo: {
    width: "min(560px, 95%)",
    height: "auto",
    filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.45))",
  },
  subtitle: {
    textAlign: "center",
    fontWeight: 850,
    opacity: 0.85,
    marginTop: -4,
  },

  statsPanel: {
    borderRadius: 18,
    padding: "16px 18px 18px 18px",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  panelTopRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  panelHeader: {
    fontWeight: 950,
    fontSize: 16,
    marginBottom: 6,
  },
  panelMeta: {
    fontSize: 12,
    opacity: 0.8,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  metaAsterisk: {
    fontWeight: 900,
  },
  metaDot: {
    opacity: 0.55,
  },

  pillRowSix: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 12,
  },
  pill: {
    borderRadius: 14,
    minHeight: 76,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    border: "1px solid rgba(0,0,0,0.20)",
    color: "rgba(10, 12, 20, 0.92)",
    overflow: "hidden",
    position: "relative",
  },
  pillLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  pillTitle: {
    fontWeight: 950,
    fontSize: 12,
    opacity: 0.85,
  },
  pillValue: {
    fontWeight: 950,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  pillIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "rgba(0,0,0,0.10)",
    color: "rgba(10, 12, 20, 0.65)",
    flex: "0 0 auto",
  },

  quickPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 2,
  },
  quickHeader: {
    fontWeight: 950,
    fontSize: 16,
    paddingLeft: 2,
  },
  quickRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
  quickBtn: {
    height: 62,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontWeight: 950,
    color: "rgba(255,255,255,0.96)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
    transition: "transform 160ms ease, filter 160ms ease",
  },
  quickBtnIcon: {
    display: "grid",
    placeItems: "center",
    opacity: 0.95,
  },
  btnBlue: {
    background: "linear-gradient(135deg, rgba(59,130,246,0.65), rgba(15,23,42,0.35))",
  },
  btnGreen: {
    background: "linear-gradient(135deg, rgba(16,185,129,0.55), rgba(15,23,42,0.35))",
  },
  btnPurple: {
    background: "linear-gradient(135deg, rgba(168,85,247,0.55), rgba(15,23,42,0.35))",
  },
  btnOrange: {
    background: "linear-gradient(135deg, rgba(245,158,11,0.65), rgba(15,23,42,0.35))",
  },

  about: {
    borderRadius: 22,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    marginTop: 4,
  },
  aboutTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 950,
  },
  aboutSubTitle: {
    marginTop: 12,
    fontWeight: 950,
    opacity: 0.95,
  },
  aboutText: {
    marginTop: 10,
    marginBottom: 0,
    opacity: 0.82,
    lineHeight: 1.6,
  },
};