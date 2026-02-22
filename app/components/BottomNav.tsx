"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminButton from "./AdminButton";

type Item = { label: string; href: string; external?: boolean };

export default function BottomNav() {
  const pathname = usePathname();

  const items: Item[] = [
    { label: "Home", href: "/" },
    { label: "Search", href: "/search" },
    { label: "Sends", href: "/search?preset=sends" },
    { label: "Subs", href: "/search?preset=submissions" },
  ];

  return (
    <div className="bottomNavShell" aria-label="Bottom navigation">
      <div className="bottomNav">
        {items.map((it) => {
          const active = !it.external && (pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href.split("?")[0])));
          const cls = `bottomNavItem ${active ? "active" : ""}`;

          if (it.external) {
            return (
              <a key={it.href} className={cls} href={it.href} target="_blank" rel="noreferrer">
                {it.label}
              </a>
            );
          }

          return (
            <Link key={it.href} className={cls} href={it.href}>
              {it.label}
            </Link>
          );
        })}

        <div className="bottomNavAdmin">
          <AdminButton />
        </div>
      </div>
    </div>
  );
}
