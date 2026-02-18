"use client";

import React, { useMemo, useState } from "react";
import TabNav from "../components/TabNav";
import Image from "next/image";

type FAQItem = {
  q: string;
  a: React.ReactNode;
};

export default function AboutPage() {
  const faqs: FAQItem[] = useMemo(
    () => [
      {
        q: "What is this website?",
        a: (
          <>
            This is a Geometry Dash request dashboard for our server. It helps us
            track submissions in one place so we can review levels, log sends,
            and keep progress organized.
          </>
        ),
      },
      {
        q: "How do submissions get into the database?",
        a: (
          <>
            Submissions are created through our request bot and then stored in our
            database. The site pulls from that database to power search, filters,
            and status tracking.
          </>
        ),
      },
      {
        q: "Does submitting guarantee my level will be sent or reviewed?",
        a: (
          <>
            No. Submitting is just a way to get in the queue. We try our best, but
            we can’t promise review speed, sends, or ratings.
          </>
        ),
      },
      {
        q: "What do the statuses mean?",
        a: (
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>
              <strong>Pending Review</strong>: In queue, not decided yet.
            </li>
            <li>
              <strong>Sending</strong>: We’re actively sending it to mods / channels.
            </li>
            <li>
              <strong>★ Rated</strong>: The level got rated.
            </li>
            <li>
              <strong>Rejected</strong>: Not a fit for sends (usually quality / criteria).
            </li>
            <li>
              <strong>Stolen</strong>: Reupload/copy issue detected.
            </li>
            <li>
              <strong>Does not exist</strong>: We cannot find your level via ID.
            </li>
          </ul>
        ),
      },
      {
        q: "Why do some results say “No video”?",
        a: (
          <>
            If there’s no valid YouTube link attached, the card won’t embed a video.
            You can add a showcase link when submitting if you want.
          </>
        ),
      },
      {
        q: "Can I update my submission after sending it?",
        a: (
          <>
            Usually yes (for things like updated video links). Message us on Discord with the level ID
            and what you want changed.
          </>
        ),
      },
      {
        q: "Do you store private info?",
        a: (
          <>
            We store only what’s needed to manage requests (like level ID, name,
            uploader, and any links provided). We don't store anything personal.
          </>
        ),
      },
      {
        q: "How can I get added as a contributor/mod?",
        a: (
          <>
            Message us on Discord and we can discuss.
          </>
        ),
      },
    ],
    []
  );

  return (
    <>
      <TabNav />

      <main style={styles.page}>
        <section style={styles.container} className="frosted-glass-strong">
          {/* Title image */}
          <div style={styles.hero}>
            <Image
              src="/about.png"
              alt="About"
              width={820}
              height={180}
              priority
              style={styles.heroImg as any}
            />

            <p style={styles.heroSub}>
              A transparant way to track your level requests,
              review progress, sends, and outcomes.
            </p>
          </div>

          {/* Content grid */}
          <div style={styles.grid}>
            <div style={styles.leftCol}>
              <Panel title="What this is">
                <p style={styles.p}>
                  This site exists to keep our request workflow simple and transparent.
                  Instead of digging through messages or scattered links, everything can
                  be searched, filtered, and tracked in one place.
                </p>
              </Panel>

              <Panel title="How it works">
                <ol style={styles.ol}>
                  <li>Creators submit a level request (ID + optional showcase link).</li>
                  <li>It appears in the database and becomes searchable instantly.</li>
                  <li>Reviewers decide whether it should be sent or rejected.</li>
                  <li>If it’s being pushed, it moves into <strong>Sending</strong>.</li>
                  <li>If it gets rated, it moves to <strong>★ Rated</strong>.</li>
                </ol>
              </Panel>

              <Panel title="Guidelines / notes">
                <ul style={styles.ul}>
                  <li>
                    Please only submit levels you have permission to share/send.
                  </li>
                  <li>
                    If you include video links, only use links you trust (YouTube preferred).
                  </li>
                  <li>
                    Not every level is a send candidate — quality and criteria matter.
                  </li>
                </ul>
              </Panel>
            </div>

            <div style={styles.rightCol}>
              <div style={styles.faqHeader}>
                <div style={styles.faqTitle}>FAQ</div>
                <div style={styles.faqHint}>
                  Quick answers to common questions.
                </div>
              </div>

              <div style={styles.faqCard} className="frosted-glass">
                {faqs.map((item, idx) => (
                  <FAQRow key={item.q} item={item} isLast={idx === faqs.length - 1} />
                ))}
              </div>

              <div style={styles.note} className="frosted-glass">
                Need help? Join the Discord and message @phrostix with your level ID.
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.panel} className="frosted-glass">
      <div style={styles.panelTitle}>{title}</div>
      <div style={styles.panelBody}>{children}</div>
    </div>
  );
}

function FAQRow({ item, isLast }: { item: FAQItem; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={styles.faqRowBtn}
        className="faqRowBtn"
        aria-expanded={open}
      >
        <span style={styles.faqQ}>{item.q}</span>
        <span style={{ ...styles.chev, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▾
        </span>
      </button>

      {open ? (
        <div style={styles.faqA}>
          <div style={styles.faqAText}>{item.a}</div>
        </div>
      ) : null}

      {!isLast ? <div style={styles.divider} /> : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    paddingTop: 110,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },

  container: {
    width: "min(1200px, 100%)",
    borderRadius: 24,
    padding: "26px 26px 28px",
  },

  hero: {
    textAlign: "center",
    marginBottom: 14,
  },

  heroImg: {
    display: "block",
    margin: "0 auto",
    width: "min(820px, 92%)",
    height: "auto",
    filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.35))",
  },

  heroSub: {
    margin: "10px auto 0",
    maxWidth: 760,
    opacity: 0.85,
    fontWeight: 800,
    fontSize: 14,
    lineHeight: 1.6,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: 18,
    alignItems: "start",
    marginTop: 14,
  },

  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minWidth: 0,
  },

  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minWidth: 0,
  },

  panel: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.22)",
    padding: 16,
  },

  panelTitle: {
    fontWeight: 950,
    fontSize: 15,
    letterSpacing: 0.2,
    marginBottom: 10,
  },

  panelBody: {
    opacity: 0.9,
  },

  p: {
    margin: 0,
    lineHeight: 1.75,
    fontSize: 14,
    fontWeight: 650,
    opacity: 0.9,
  },

  ol: {
    margin: 0,
    paddingLeft: 18,
    lineHeight: 1.75,
    fontSize: 14,
    fontWeight: 650,
    opacity: 0.9,
  },

  ul: {
    margin: 0,
    paddingLeft: 18,
    lineHeight: 1.75,
    fontSize: 14,
    fontWeight: 650,
    opacity: 0.9,
  },

  faqHeader: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },

  faqTitle: {
    fontWeight: 950,
    fontSize: 15,
    letterSpacing: 0.2,
  },

  faqHint: {
    marginTop: 4,
    fontWeight: 800,
    fontSize: 12,
    opacity: 0.75,
  },

  faqCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.26)",
    overflow: "hidden",
  },

  faqRowBtn: {
    width: "100%",
    textAlign: "left",
    padding: "14px 16px",
    background: "transparent",
    border: "none",
    color: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    cursor: "pointer",
  },

  faqQ: {
    fontWeight: 900,
    fontSize: 14,
    opacity: 0.95,
  },

  chev: {
    fontWeight: 950,
    opacity: 0.75,
    transition: "transform 160ms ease",
  },

  faqA: {
    padding: "0 16px 14px 16px",
  },

  faqAText: {
    opacity: 0.88,
    fontWeight: 650,
    fontSize: 13,
    lineHeight: 1.7,
  },

  divider: {
    height: 1,
    background: "rgba(255,255,255,0.14)",
    marginLeft: 16,
    marginRight: 16,
  },

  note: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    padding: "12px 14px",
    fontWeight: 800,
    fontSize: 12,
    opacity: 0.75,
    textAlign: "center",
  },

  // Responsive
  ["@media (max-width: 920px)" as any]: {
    grid: { gridTemplateColumns: "1fr" },
  } as any,
};
