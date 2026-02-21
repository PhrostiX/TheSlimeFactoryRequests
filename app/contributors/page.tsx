"use client";

import React from "react";
import TabNav from "../components/TabNav";
import Image from "next/image";
import { MOD_PROFILES } from "@/lib/adminProfiles";

type Person = {
  name: string;
  title: string;
  badge: "dev" | "mod";
};

const DEV_BADGE = "/devbadge.png";
const MOD_BADGE = "/modbadge.png";

export default function ContributorsPage() {
  const coreTeam: Person[] = [
    { name: "PhrostiX", title: "Owner / Dev", badge: "dev" },
    { name: "Koishi", title: "UI / Dev", badge: "dev" },
  ];

  const owners: Person[] = [{ name: "dkirinor", title: "Server Owner", badge: "dev" }];

  const mods: Person[] = MOD_PROFILES.map((name) => ({
    name,
    title: "Moderator",
    badge: "mod",
  }));

  return (
    <>
      <TabNav />

      <main style={styles.page}>
        <section style={styles.container} className="frosted-glass-strong">
          <div style={styles.hero}>
            <Image
              src="/contributors.png"
              alt="Contributors"
              width={1200}
              height={300}
              priority
              style={styles.heroImg as any}
            />
          </div>

          {/* Layout */}
          <div style={styles.layout}>
            {/* LEFT: Core + Owners */}
            <div style={styles.leftCol}>
              <SectionHeader title="Core Team" hint="Builds the site, bot, and automation" />

              <div style={styles.grid2}>
                {coreTeam.map((p) => (
                  <RoleCard key={p.name} person={p} />
                ))}
              </div>

              <div style={{ height: 18 }} />

              <SectionHeader title="Operations" hint="Runs and maintains the Discord server" />

              <div style={styles.grid1}>
                {owners.map((p) => (
                  <RoleCard key={p.name} person={p} />
                ))}
              </div>
            </div>

            {/* RIGHT: Mods */}
            <div style={styles.rightCol}>
              <SectionHeader title="Moderation" hint="Review, send, and keep things moving" />

              <div style={styles.modsCard} className="frosted-glass">
                <div style={styles.modsTop}>
                  <div style={styles.modsTitle}>Mods</div>
                  <div style={styles.modsSub}>Review / Sends</div>
                </div>

                <div style={styles.modsList}>
                  {mods.map((m, idx) => (
                    <div key={m.name}>
                      <div style={styles.modRow}>
                        <img src={MOD_BADGE} alt="" style={styles.badgeMod} draggable={false} />
                        <div style={styles.modName}>{m.name}</div>
                        <div style={styles.modRole}>{m.title}</div>
                      </div>

                      {idx !== mods.length - 1 ? <div style={styles.divider} /> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.note}>Please message @phrostix on discord to be added.</div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <div style={styles.sectionHeader}>
      <div style={styles.sectionTitle}>{title}</div>
      <div style={styles.sectionHint}>{hint}</div>
    </div>
  );
}

function RoleCard({ person }: { person: Person }) {
  const badgeSrc = person.badge === "dev" ? DEV_BADGE : MOD_BADGE;

  return (
    <div style={styles.card} className="frosted-glass">
      <div style={styles.cardLeft}>
        <img
          src={badgeSrc}
          alt=""
          style={person.badge === "dev" ? styles.badgeDev : styles.badgeMod}
          draggable={false}
        />
        <div style={styles.cardName}>{person.name}</div>
      </div>

      <div style={styles.cardRole}>{person.title}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    paddingTop: "clamp(110px, 18vw, 160px)",
    paddingLeft: "clamp(14px, 4vw, 24px)",
    paddingRight: "clamp(14px, 4vw, 24px)",
    paddingBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },

  container: {
    width: "min(1200px, 100%)",
    borderRadius: 24,
    padding: "clamp(18px, 4vw, 26px) clamp(14px, 4vw, 26px) clamp(20px, 4vw, 28px)",
  },
  
  hero: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 18,
    marginBottom: 6,
  },

  heroImg: {
    width: "min(900px, 92%)",
    height: "auto",
    display: "block",
    filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.35))",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18,
    alignItems: "start",
    marginTop: 12,
  },

  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    minWidth: 0,
  },

  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minWidth: 0,
  },

  sectionHeader: {
    marginBottom: 12,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },

  sectionTitle: {
    fontWeight: 950,
    fontSize: 15,
    letterSpacing: 0.3,
  },

  sectionHint: {
    marginTop: 4,
    fontWeight: 800,
    fontSize: 12,
    opacity: 0.75,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  grid1: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },

  card: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.26)",
    padding: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },

  cardLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  badgeDev: {
    width: 34,
    height: 34,
    objectFit: "contain",
    filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.35))",
  },

  badgeMod: {
    width: 34,
    height: 34,
    objectFit: "contain",
    filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.35))",
  },

  cardName: {
    fontWeight: 950,
    fontSize: 18,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  cardRole: {
    fontWeight: 900,
    opacity: 0.75,
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  modsCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.30)",
    overflow: "hidden",
  },

  modsTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    background: "rgba(0,0,0,0.18)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },

  modsTitle: {
    fontWeight: 950,
    fontSize: 16,
    letterSpacing: 0.2,
  },

  modsSub: {
    fontWeight: 900,
    opacity: 0.7,
    fontSize: 13,
    whiteSpace: "nowrap",
  },

  modsList: {
    padding: 0,
  },

  modRow: {
    display: "grid",
    gridTemplateColumns: "42px 1fr auto",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
  },

  modName: {
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: 0.2,
  },

  modRole: {
    fontWeight: 900,
    opacity: 0.7,
    fontSize: 12,
    whiteSpace: "nowrap",
  },

  divider: {
    height: 1,
    background: "rgba(255,255,255,0.18)",
    marginLeft: 16,
    marginRight: 16,
  },

  note: {
    opacity: 0.7,
    fontWeight: 800,
    fontSize: 12,
    textAlign: "center",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.14)",
  },

  // responsive
  ["@media (max-width: 920px)" as any]: {
    layout: { gridTemplateColumns: "1fr" },
    grid2: { gridTemplateColumns: "1fr" },
  } as any,
};
