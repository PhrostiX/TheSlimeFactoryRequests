"use client";

import React from "react";
import TabNav from "../components/TabNav";

const VERSION = "v1.8";

const items = [
  {
    version: VERSION,
    date: "Request Tools, Permissions, and Website Update",
    notes: [
      "Expanded request management through improved browsing, controlled editing, ownership transfer, and clearer editing limits after submission.",
      "Added update pings outside the server, including DM support and clearer ping preference tools.",
      "Added Mass Embed Refresh to repair broken or outdated request embeds.",
      "Added Mass Rejection support for marking all requests from a user ID as Not Accepted when necessary.",
      "Added website send details so the top section of a level card can show more detailed send information.",
      "Added a dedicated Changelog page to the website for future updates.",
      "Added VIP and Level Request Stream support with their own status tags and website filters.",
      "Fixed send counting so duplicate sends no longer inflate totals on level cards.",
      "Increased the maximum review length by five times.",
      "Added request transferring so ownership can be reassigned and claimed through the request tools.",
      "Added public commands for follow tools, bot status, and help.",
      "Removed the level requirement for requesting, fixed cooldown bypasses, added separate Moderator / Reviewer / Trial Reviewer / Sender permissions, and improved Extra Actions tools like VIP refresh, cooldown viewing, ping preference editing, database removal, semi-operational issue display, pending sends, and silent rates."
    ],
  },
  {
    version: "v1.7",
    date: "Editing Tools and Information Update",
    notes: [
      "Added direct request editing through the Edit Submission flow.",
      "Added re-review requests for Not Accepted levels, including a reason shown to reviewers.",
      "Introduced the bot status panel with Operational, Semi-Operational, Maintenance, Offline, and Closed states.",
      "Added support tickets as the main bug-reporting path.",
      "Replaced rules in submit-requests with info and FAQ buttons.",
      "Moved emojis fully external and updated requester role requirements and VIP acceptance standards."
    ],
  },
  {
    version: "v1.6",
    date: "New Watcher Upgrade",
    notes: [
      "Rebuilt watcher announcements so send, reject, and status pings confirm delivery before finishing.",
      "Cleaned up Accepted / Not Accepted, sends, and rejects ping formatting.",
      "Reworked and condensed the search filter UI.",
      "Added a sends leaderboard and fixed duplicate-send stat counting.",
      "Improved reviewer UI, including editing reviews and suggested ratings without pinging again."
    ],
  },
  {
    version: "v1.5",
    date: "Minor UI Update",
    notes: [
      "Mods can now reject levels and view extra stats like which mods have seen a level through the website.",
      "Mobile UI was improved again for smaller devices."
    ],
  },
  {
    version: "v1.41",
    date: "Participation",
    notes: [
      "Updated participation guidance for requesters.",
      "Renamed a few roles and added a new website logo."
    ],
  },
  {
    version: "v1.4",
    date: "Major System Update",
    notes: [
      "Renamed Sending to Accepted and reviewer Rejected to Not Accepted for clarity.",
      "Moderators can now send levels directly from the website and trigger bot updates automatically.",
      "Added optional comments to sends and accepted requests.",
      "Introduced Suggested Rating on requests and a matching website filter.",
      "Added mobile support for the website and upgraded legacy request metadata."
    ],
  },
  {
    version: "v1.3",
    date: "Launch follow-up",
    notes: [
      "Increased the request cooldown from 30 minutes to 1 day.",
      "Raised the minimum acceptance requirement to feature, while boosters stayed at the lower standard.",
      "Added contributors-page UI updates and introduced Perox8 to the team."
    ],
  },
  { version: "v1.2", date: "Various bug fixes", notes: [] as string[] },
  { version: "v1.1", date: "Various bug fixes", notes: [] as string[] },
  { version: "v1.0", date: "The introduction", notes: [] as string[] },
];

export default function ChangelogPage() {
  return (
    <>
      <TabNav />
      <main style={styles.page}>
        <section style={styles.container} className="frosted-glass-strong">
          <div style={styles.header}>
            <div><h1 style={styles.title}>Changelog</h1></div>
          </div>
          <div style={styles.list}>
            {items.map((item, i) => (
              <section key={item.version + i} style={styles.entry} className="frosted-glass">
                <div style={styles.entryTop}>
                  <div>
                    <div style={styles.entryDate}>{item.date}</div>
                    <div style={styles.entryVersion}>{item.version}</div>
                  </div>
                  {i === 0 ? <div style={styles.liveBadge}>Current version</div> : null}
                </div>
                {item.notes.length ? (
                  <div style={styles.notes}>
                    {item.notes.map((note, idx) => (
                      <div key={idx} style={styles.noteRow}>
                        <div style={styles.noteDot} />
                        <div style={styles.noteText}>{note}</div>
                      </div>
                    ))}
                  </div>
                ) : i === 0 ? (
                  <div style={styles.emptyState}>Notes for this version will be added here.</div>
                ) : null}
              </section>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", paddingTop: "clamp(110px, 18vw, 160px)", paddingLeft: "clamp(14px, 4vw, 24px)", paddingRight: "clamp(14px, 4vw, 24px)", paddingBottom: 24, display: "flex", justifyContent: "center", alignItems: "flex-start" },
  container: { width: "min(1100px, 100%)", borderRadius: 24, padding: "clamp(18px, 4vw, 26px)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 18 },
  title: { margin: "8px 0 6px", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.02 },
  list: { display: "grid", gap: 16 },
  entry: { borderRadius: 22, padding: 20 },
  entryTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 },
  entryDate: { fontSize: 12, opacity: 0.68, letterSpacing: 1.4, textTransform: "uppercase" },
  entryVersion: { fontSize: 28, fontWeight: 900, marginTop: 2 },
  liveBadge: { padding: "8px 14px", borderRadius: 999, background: "rgba(236,72,153,0.18)", border: "1px solid rgba(244,114,182,0.35)", color: "#ffd1ea", fontWeight: 800, minWidth: 150, textAlign: "center" },
  notes: { display: "grid", gap: 10 },
  noteRow: { display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,.04)" },
  noteDot: { width: 10, height: 10, borderRadius: "50%", marginTop: 7, background: "#7c8cff", boxShadow: "0 0 16px rgba(124,140,255,.9)", flex: "0 0 auto" },
  noteText: { opacity: 0.95, lineHeight: 1.6 },
  emptyState: { padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,.04)", opacity: 0.78 }
};
