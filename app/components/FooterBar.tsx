"use client";

import React from "react";

export default function FooterBar() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="inner">
        <div className="left">© {new Date().getFullYear()} PhrostiX — Built with Next.js &amp; TypeScript.</div>
        <div className="right" aria-label="Footer links">
          {/* These are placeholders — Note to KOISHI: they are temporarily removed*/}
        </div>
      </div>

      <style jsx>{`
        .footer {
          margin-top: auto;
          /* Match the top navbar tone */
          background: rgba(8, 10, 20, 0.72);
          color: rgba(255, 255, 255, 0.85);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
        }
        .inner {
          width: min(1200px, 100%);
          margin: 0 auto;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .left {
          font-size: 13px;
          font-weight: 700;
        }
        .right {
          display: flex;
          gap: 14px;
          align-items: center;
        }
        .icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.10);
          transition: transform 160ms ease, background 160ms ease;
          user-select: none;
          color: rgba(255, 255, 255, 0.9);
        }
        .icon:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.09);
        }
      `}</style>
    </footer>
  );
}
