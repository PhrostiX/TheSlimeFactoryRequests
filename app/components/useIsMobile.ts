"use client";

import { useEffect, useState } from "react";

/**
 * Simple viewport breakpoint hook (client-side).
 * Avoids user-agent sniffing; just responds to screen width.
 */
export default function useIsMobile(breakpointPx: number = 720) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= breakpointPx);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, [breakpointPx]);

  return isMobile;
}
