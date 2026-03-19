"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ADMIN_PROFILES, getAdminProfileDef } from "@/lib/adminProfiles";

type AdminState = {
  isAdmin: boolean;
  profile: string | null;
};

export default function AdminButton() {
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState<AdminState>({ isAdmin: false, profile: null });
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<string>(ADMIN_PROFILES[0]?.name || "Reviewer");
  const [error, setError] = useState<string | null>(null);

  function badgeFor(name: string) {
    const def = getAdminProfileDef(name);
    if (!def) return "/modbadge.png";
    if (def.badge === "owner") return "/devbadge.png";
    return "/modbadge.png";
  }

  async function refresh() {
    const res = await fetch("/api/admin/me", { cache: "no-store" });
    const data = (await res.json()) as AdminState;
    setAdmin(data);
  }

  useEffect(() => {
    refresh();
  }, []);

  // Portal targets (document.body) aren't guaranteed during the very first render.
  useEffect(() => {
    setMounted(true);
  }, []);

  const label = useMemo(() => {
    if (!admin.isAdmin) return "Admin Login";
    if (!admin.profile) return "Select Profile";
    return `Admin: ${admin.profile}`;
  }, [admin.isAdmin, admin.profile]);

  // Used in JSX below; define here to avoid runtime ReferenceError.
  const badgeSrc = admin.profile ? badgeFor(admin.profile) : "/modbadge.png";

  async function doLogin() {
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError("Wrong password.");
      return;
    }

    setPassword("");
    await refresh();
  }

  async function setProfile() {
    setError(null);
    const res = await fetch("/api/admin/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: selectedProfile }),
    });

    if (!res.ok) {
      setError("Could not set profile.");
      return;
    }

    await refresh();
    setOpen(false);

    // The search page reads admin state on mount; a hard reload ensures the
    // correct admin buttons/permissions render immediately after switching.
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    await refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`adminPillBtn ${admin.isAdmin ? "isAdmin" : ""}`}
        aria-label="Admin login"
        type="button"
      >
        {label}
      </button>

      {open && mounted && typeof document !== "undefined" && document.body &&
        createPortal(
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              // Keep it above anything that creates stacking contexts (iOS Safari especially)
              zIndex: 2147483647,
              background: "rgba(0,0,0,0.6)",
              display: "grid",
              placeItems: "center",
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(520px, 100%)",
                borderRadius: 18,
                padding: 18,
                background:
                  "radial-gradient(1200px 600px at 20% 0%, rgba(96,165,250,0.18), transparent 45%), rgba(14,14,14,0.92)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
              }}
            >
            {/* Mini header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                paddingBottom: 12,
                borderBottom: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <span aria-hidden style={{ fontSize: 18 }}>🛡️</span>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.1 }}>
                    Admin Access
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.78, marginTop: 2 }}>
                    Secure moderator tools
                  </div>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "white",
                  opacity: 0.9,
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {!admin.isAdmin ? (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void doLogin();
                  }}
                >
                  <p style={{ opacity: 0.82, marginTop: 14, marginBottom: 10 }}>
                    Enter the secure admin password.
                  </p>

                  <input
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Admin password"
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      color: "white",
                      outline: "none",
                    }}
                  />

                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 14,
                        fontWeight: 900,
                        background: "rgba(96,165,250,0.20)",
                        border: "1px solid rgba(96,165,250,0.35)",
                        color: "white",
                      }}
                    >
                      Log in
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        fontWeight: 900,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "white",
                        opacity: 0.95,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p style={{ opacity: 0.82, marginTop: 14, marginBottom: 10 }}>
                  Select your profile. Actions you take on the site will be tied to this username.
                </p>

                {(() => {
                  const devs = ADMIN_PROFILES.filter((p) => p.role !== "mod");
                  const mods = ADMIN_PROFILES.filter((p) => p.role === "mod");

                  const Section = ({
                    title,
                    items,
                  }: {
                    title: string;
                    items: typeof ADMIN_PROFILES;
                  }) => (
                    <div style={{ marginTop: 10 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 950,
                          opacity: 0.78,
                          marginBottom: 8,
                          paddingLeft: 2,
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: 10,
                        }}
                      >
                        {items.map((p) => {
                          const selected = selectedProfile === p.name;
                          return (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => setSelectedProfile(p.name)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: 12,
                                borderRadius: 16,
                                background: selected
                                  ? "rgba(96,165,250,0.18)"
                                  : "rgba(255,255,255,0.06)",
                                border: selected
                                  ? "1px solid rgba(96,165,250,0.42)"
                                  : "1px solid rgba(255,255,255,0.12)",
                                boxShadow: selected
                                  ? "0 0 0 3px rgba(96,165,250,0.14)"
                                  : "none",
                                color: "white",
                                textAlign: "left",
                              }}
                            >
                              <img
                                src={badgeFor(p.name)}
                                alt="Profile badge"
                                style={{ width: 30, height: 30, objectFit: "contain" }}
                              />
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 950, fontSize: 14, lineHeight: 1.1 }}>
                                  {p.name}
                                </span>
                                <span style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                                  {p.role === "dev"
                                    ? "Owner / Dev"
                                    : p.role === "reviewer"
                                      ? "Reviewer"
                                      : "Moderator"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );

                  return (
                    <>
                      <Section title="Developers" items={devs as any} />
                      <Section title="Moderators" items={mods as any} />
                    </>
                  );
                })()}

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button
                    onClick={setProfile}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 14,
                      fontWeight: 900,
                      background: "rgba(96,165,250,0.20)",
                      border: "1px solid rgba(96,165,250,0.35)",
                      color: "white",
                    }}
                  >
                    Save Profile
                  </button>
                  <button
                    onClick={logout}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      fontWeight: 900,
                      opacity: 0.9,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      color: "white",
                    }}
                  >
                    Log out
                  </button>
                </div>

                {admin.profile ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <img
                      src={badgeSrc}
                      alt="Moderator badge"
                      style={{ width: 28, height: 28, objectFit: "contain" }}
                    />
                    <div>
                      <div style={{ fontWeight: 950, fontSize: 13, lineHeight: 1.1 }}>
                        Active profile
                      </div>
                      <div style={{ opacity: 0.8, fontSize: 13, marginTop: 2 }}>{admin.profile}</div>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {error && <p style={{ color: "tomato", marginTop: 10 }}>{error}</p>}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
