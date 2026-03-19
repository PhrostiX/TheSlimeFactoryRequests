"use client";

import React, { useEffect, useMemo, useState } from "react";
import TabNav from "../components/TabNav";

type RequestRow = { sends?: any[]; rejections?: any[]; seenBy?: any[] };

function safe(v:any){ return String(v ?? "").trim(); }

export default function ReviewersPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ page: "1", limit: "10000", sortBy: "latest" });
    fetch(`/api/requests?${params}`).then(r => r.json()).then((data) => { setRows(data.items || []); setLoading(false); }).catch(() => { setRows([]); setLoading(false); });
  }, []);

  const stats = useMemo(() => {
    const map = new Map<string, { name: string; sends: number; rejects: number; seen: number }>();
    const touch = (name:string) => {
      const n = safe(name);
      if (!n) return null;
      if (!map.has(n)) map.set(n, { name: n, sends: 0, rejects: 0, seen: 0 });
      return map.get(n)!;
    };
    for (const row of rows) {
      for (const send of Array.isArray(row.sends) ? row.sends : []) {
        const entry = touch(send?.by ?? send?.name);
        if (entry) entry.sends += 1;
      }
      for (const reject of Array.isArray(row.rejections) ? row.rejections : []) {
        const entry = touch(reject?.by ?? reject?.name);
        if (entry) entry.rejects += 1;
      }
      for (const seen of Array.isArray(row.seenBy) ? row.seenBy : []) {
        const entry = touch(typeof seen === "string" ? seen : (seen?.name ?? seen?.by));
        if (entry) entry.seen += 1;
      }
    }
    return Array.from(map.values()).sort((a,b) => (b.sends - a.sends) || (b.rejects - a.rejects) || a.name.localeCompare(b.name));
  }, [rows]);

  return (
    <>
      <TabNav />
      <main style={{ minHeight: "100vh", paddingTop: 120, paddingInline: 20, paddingBottom: 30, display: "flex", justifyContent: "center" }}>
        <section className="frosted-glass-strong" style={{ width: "min(1000px, 100%)", borderRadius: 24, padding: 24 }}>
          <h1 style={{ marginTop: 0, fontSize: 34, fontWeight: 950 }}>Reviewer Performance</h1>
          <p style={{ opacity: 0.82 }}>This page summarizes visible send, reject, and seen activity stored in the request database.</p>
          {loading ? <div style={{ opacity: 0.8 }}>Loading…</div> : (
            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
              {stats.map((row, idx) => (
                <div key={row.name} style={{ display: "grid", gridTemplateColumns: "56px 1.2fr repeat(3, minmax(80px, 140px))", gap: 12, alignItems: "center", padding: 14, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontWeight: 950, opacity: 0.75 }}>#{idx + 1}</div>
                  <div style={{ fontWeight: 900 }}>{row.name}</div>
                  <div><div style={{ opacity: 0.7, fontSize: 12 }}>Sends</div><div style={{ fontWeight: 900 }}>{row.sends}</div></div>
                  <div><div style={{ opacity: 0.7, fontSize: 12 }}>Rejects</div><div style={{ fontWeight: 900 }}>{row.rejects}</div></div>
                  <div><div style={{ opacity: 0.7, fontSize: 12 }}>Seen</div><div style={{ fontWeight: 900 }}>{row.seen}</div></div>
                </div>
              ))}
              {!stats.length ? <div style={{ opacity: 0.75 }}>No reviewer activity found yet.</div> : null}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
