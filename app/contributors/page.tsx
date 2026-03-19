"use client";

import React from "react";
import TabNav from "../components/TabNav";
import Image from "next/image";
import { CONTRIBUTOR_GROUPS } from "@/lib/contributorDirectory";

type BadgeKind = "owner" | "mod" | "reviewer" | "sender" | "staff";
type Section = { title: string; subtitle: string; names: string[]; badge: BadgeKind };

const BADGES: Record<BadgeKind, string> = {
  owner: "/owner.png",
  mod: "/modbadge.png",
  reviewer: "/reviewer.png",
  sender: "/senders.png",
  staff: "/staff.png",
};

export default function ContributorsPage() {
  const allSections: Section[] = [
    { title: "Developers & Owners", subtitle: "Builds and maintains the bot, website, and automation", names: CONTRIBUTOR_GROUPS.developersAndOwners, badge: "owner" },
    { title: "Moderators", subtitle: "Full review, send, and management access", names: CONTRIBUTOR_GROUPS.moderators, badge: "mod" },
    { title: "Reviewers", subtitle: "Reviews and helps process requests", names: CONTRIBUTOR_GROUPS.reviewers, badge: "reviewer" },
    { title: "Trial Reviewers", subtitle: "Training and assisting with reviews", names: CONTRIBUTOR_GROUPS.trialReviewers, badge: "reviewer" },
    { title: "Senders", subtitle: "Can add sends and reject notes", names: CONTRIBUTOR_GROUPS.senders, badge: "sender" },
    { title: "Staff", subtitle: "Community and server support", names: CONTRIBUTOR_GROUPS.staffMembers, badge: "staff" },
    { title: "Trial Staff", subtitle: "Assisting with staff duties", names: CONTRIBUTOR_GROUPS.trialStaff, badge: "staff" },
  ].filter((section) => section.names.length > 0);

  const heroRow = allSections.filter((s) => ["Developers & Owners", "Moderators", "Reviewers"].includes(s.title));
  const supportRow = allSections.filter((s) => !["Developers & Owners", "Moderators", "Reviewers"].includes(s.title));

  return (
    <>
      <TabNav />
      <main style={styles.page} className="contributorsPage">
        <section style={styles.container} className="frosted-glass-strong">
          <div style={styles.hero}>
            <Image src="/contributors.png" alt="Contributors" width={1200} height={300} priority style={styles.heroImg as any} />
          </div>

          {heroRow.length ? (
            <>
              <div style={styles.rowHeader}>Core roles</div>
              <div style={styles.gridPrimary} className="contributorsGridPrimary">
                {heroRow.map((section) => (
                  <SectionCard key={section.title} section={section} />
                ))}
              </div>
            </>
          ) : null}

          {supportRow.length ? (
            <>
              <div style={{ ...styles.rowHeader, marginTop: 18 }}>Supporting roles</div>
              <div style={styles.gridSecondary} className="contributorsGridSecondary">
                {supportRow.map((section) => (
                  <SectionCard key={section.title} section={section} />
                ))}
              </div>
            </>
          ) : null}
        </section>
      </main>
    </>
  );
}

function SectionCard({ section }: { section: Section }) {
  return (
    <section style={styles.section} className="frosted-glass">
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitle}>{section.title}</div>
        <div style={styles.sectionSubtitle}>{section.subtitle}</div>
      </div>
      <div style={styles.list}>
        {section.names.map((name) => (
          <div key={`${section.title}-${name}`} style={styles.card} className="roleCard">
            <div style={styles.personLeft}>
              <img src={BADGES[section.badge]} alt="" style={styles.badge} draggable={false} />
              <div style={styles.name} className="roleCardName">{name}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", paddingTop: "clamp(110px, 18vw, 160px)", paddingLeft: "clamp(14px, 4vw, 24px)", paddingRight: "clamp(14px, 4vw, 24px)", paddingBottom: 24, display: "flex", justifyContent: "center" },
  container: { width: "min(1200px, 100%)", borderRadius: 24, padding: "clamp(18px, 4vw, 26px)" },
  hero: { display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 14 },
  heroImg: { width: "min(900px, 92%)", height: "auto", display: "block", filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.35))" },
  rowHeader: { fontWeight: 900, fontSize: 14, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.72, margin: "6px 0 12px" },
  gridPrimary: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, alignItems: "start" },
  gridSecondary: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, alignItems: "start" },
  section: { borderRadius: 18, padding: 16, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.22)" },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontWeight: 950, fontSize: 18 },
  sectionSubtitle: { marginTop: 4, opacity: 0.72, fontWeight: 700, fontSize: 12, lineHeight: 1.35 },
  list: { display: "grid", gap: 10 },
  card: { borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)" },
  personLeft: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
  badge: { width: 28, height: 28, flex: "0 0 28px", objectFit: "contain" },
  name: { fontWeight: 900, fontSize: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
};
