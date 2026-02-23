"use client";

import React, { useEffect, useRef, useState } from "react";

type ToastDetail = string | { message?: string };

export default function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    function onToast(ev: Event) {
      const ce = ev as CustomEvent<ToastDetail>;
      const message =
        typeof ce.detail === "string" ? ce.detail : String(ce.detail?.message ?? "");
      if (!message) return;

      setMsg(message);
      setVisible(true);

      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setVisible(false);
      }, 2200);
    }

    window.addEventListener("toast", onToast as any);
    return () => {
      window.removeEventListener("toast", onToast as any);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!msg) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "-10px"})`,
        zIndex: 20000,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 140ms ease, transform 140ms ease",
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        style={{
          background: "rgba(34, 197, 94, 0.92)", // green
          color: "#fff",
          borderRadius: 14,
          padding: "10px 14px",
          fontWeight: 800,
          boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.18)",
          maxWidth: "min(560px, calc(100vw - 24px))",
          textAlign: "center",
        }}
      >
        {msg}
      </div>
    </div>
  );
}
