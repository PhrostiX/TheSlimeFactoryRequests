"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  name: string;
  href: string;
  external?: boolean;
  isDiscord?: boolean;
};

export default function TabNav() {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { name: "Home", href: "/" },
    { name: "Search", href: "/search" },
    { name: "About", href: "/about" },
    { name: "Contributors", href: "/contributors" },
    {
      name: "Discord",
      href: "https://discord.gg/3Sctyn3ekP",
      external: true,
      isDiscord: true,
    },
  ];

  return (
    <header className="tabNav" role="banner">
      <div className="tabNavInner">
        <Link href="/" className="brand">
          Level Requests Database
        </Link>

        <nav className="navLinks" aria-label="Primary">
          {tabs.map((t) => {
            const isActive = !t.external && pathname === t.href;

            if (t.external) {
              return (
                <a
                  key={t.href}
                  href={t.href}
                  target="_blank"
                  rel="noreferrer"
                  className={t.isDiscord ? "navDiscord" : "navLink"}
                >
                  {t.name}
                </a>
              );
            }

            return (
              <Link
                key={t.href}
                href={t.href}
                className={`navLink ${isActive ? "active" : ""}`}
              >
                {t.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* IMPORTANT: global makes the animation actually apply */}
      <style jsx global>{`
        .tabNav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(8, 10, 20, 0.72);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
        }

        .tabNavInner {
          width: min(1200px, 100%);
          margin: 0 auto;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .brand {
          font-weight: 900;
          letter-spacing: 0.2px;
          text-decoration: none;
          color: rgba(210, 230, 255, 0.95);
          transition: transform 180ms ease, filter 180ms ease;
          will-change: transform;
        }

        .brand:hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        /* NEW ANIMATION */
        .navLink {
          position: relative;
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 999px;
          color: rgba(255, 255, 255, 0.86);
          font-weight: 850;
          font-size: 13px;
          border: 1px solid transparent;

          transform: translateY(0) scale(1);
          transition: transform 180ms ease, background 180ms ease,
            border-color 180ms ease, color 180ms ease, filter 180ms ease,
            box-shadow 180ms ease;
          will-change: transform;
        }

        /* underline sweep */
        .navLink::after {
          content: "";
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 6px;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(99, 102, 241, 0),
            rgba(99, 102, 241, 0.95),
            rgba(59, 130, 246, 0.95),
            rgba(59, 130, 246, 0)
          );
          opacity: 0;
          transform: translateY(8px) scaleX(0.3);
          transition: opacity 220ms ease, transform 240ms ease;
          pointer-events: none;
        }

        .navLink:hover {
          transform: translateY(-3px) scale(1.03);
          color: rgba(255, 255, 255, 0.98);
          border-color: rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
        }

        .navLink:hover::after {
          opacity: 1;
          transform: translateY(0px) scaleX(1);
        }

        /* click press */
        .navLink:active {
          transform: translateY(-1px) scale(0.98);
        }

        /* active tab pop animation */
        .navLink.active {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.16);
          color: rgba(255, 255, 255, 0.99);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
          animation: tabPop 40ms ease-out;
        }

        .navLink.active::after {
          opacity: 1;
          transform: translateY(0px) scaleX(1);
        }

        @keyframes tabPop {
          0% {
            transform: translateY(0) scale(0.98);
          }
          60% {
            transform: translateY(-2px) scale(1.04);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }

        /* Discord button */
        .navDiscord {
          text-decoration: none;
          padding: 9px 14px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.96);
          background: linear-gradient(
            135deg,
            rgba(99, 102, 241, 0.88),
            rgba(59, 130, 246, 0.78)
          );
          border: 1px solid rgba(255, 255, 255, 0.16);

          transform: translateY(0) scale(1);
          transition: transform 180ms ease, filter 180ms ease,
            box-shadow 180ms ease;
          will-change: transform;
        }

        .navDiscord:hover {
          transform: translateY(-3px) scale(1.03);
          filter: brightness(1.06);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28);
        }

        .navDiscord:active {
          transform: translateY(-1px) scale(0.99);
        }

        .navLink:focus-visible,
        .navDiscord:focus-visible,
        .brand:focus-visible {
          outline: 2px solid rgba(99, 102, 241, 0.7);
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .navLink,
          .navDiscord,
          .brand,
          .navLink::after {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </header>
  );
}
