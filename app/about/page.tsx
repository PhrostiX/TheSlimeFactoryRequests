"use client";

import TabNav from "../components/TabNav";

export default function AboutPage() {
  return (
    <>
      <TabNav />
      <main style={styles.page}>
      <div style={styles.container} className="frosted-glass-strong">
        <h1 style={styles.title} className="animate-fade-in">About</h1>

        <p style={{...styles.paragraph, animationDelay: "0.1s"}} className="animate-fade-in">
          This website is a Geometry Dash request dashboard designed to make level submissions easier to browse,
          search, and track. Requests are submitted through a Google Form and automatically stored in a Google
          Spreadsheet, which this site pulls from.
        </p>

        <h2 style={{...styles.subtitle, animationDelay: "0.2s"}} className="animate-slide-in-left">How it works</h2>
        <ul style={{...styles.list, animationDelay: "0.3s"}} className="animate-fade-in">
          <li><strong>Search</strong> allows you to find submissions by Level ID or Username.</li>
          <li><strong>Latest Submissions</strong> shows the newest requests.</li>
          <li><strong>Latest Sends</strong> shows levels marked as sent in the spreadsheet.</li>
        </ul>

        <h2 style={{...styles.subtitle, animationDelay: "0.4s"}} className="animate-slide-in-left">Disclaimer</h2>
        <p style={{...styles.paragraph, animationDelay: "0.5s"}} className="animate-fade-in">
          Submitting a request does not guarantee that the level will be sent or reviewed. This site is meant
          to keep the request process organized and transparent.
        </p>
      </div>
    </main>
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
    width: "min(800px, 100%)",
    padding: "48px 40px",
    borderRadius: 24,
  },
  title: {
    fontSize: "clamp(32px, 5vw, 42px)",
    fontWeight: 700,
    margin: 0,
    marginBottom: 28,
    background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  paragraph: {
    marginTop: 16,
    opacity: 0.9,
    maxWidth: 800,
    lineHeight: 1.7,
    fontSize: 16,
    color: "var(--foreground)",
  },
  subtitle: {
    marginTop: 32,
    fontSize: 22,
    fontWeight: 600,
    color: "var(--foreground)",
  },
  list: {
    marginTop: 14,
    paddingLeft: 24,
    opacity: 0.9,
    lineHeight: 1.8,
    fontSize: 15,
    color: "var(--foreground)",
  },
};
