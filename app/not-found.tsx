export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "radial-gradient(1200px 600px at 50% 0%, rgba(120,90,255,0.35), transparent 60%), #0b0b12",
        color: "white",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <section
        style={{
          width: "min(920px, 100%)",
          borderRadius: 18,
          background: "rgba(20, 20, 35, 0.65)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Oops</div>
            <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.2 }}>
              We couldn&apos;t find that page :&#40;
            </h1>
          </div>

          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(120, 90, 255, 0.25)",
              border: "1px solid rgba(120, 90, 255, 0.35)",
              color: "white",
              textDecoration: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Return home
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr" }}>
          <div style={{ padding: 22 }}>
            <p style={{ marginTop: 0, opacity: 0.85, lineHeight: 1.6 }}>
              That URL doesn&apos;t exist. If you followed a broken link, try
              heading back to the homepage.
            </p>

            <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.85, lineHeight: 1.7 }}>
              <li>- Check the spelling in the address bar</li>
              <li>- Use the search page to find a level</li>
              <li>- Go back to the homepage and try again</li>
              <li>- Sequoia misses you..</li>
            </ul>
          </div>

          <div
            style={{
              padding: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.18)",
            }}
          >
            {/* No event handlers here — Server Component safe */}
            <img
              src="/sequoia.png"
              alt="Sequoia"
              style={{
                width: "100%",
                maxWidth: 320,
                height: "auto",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
