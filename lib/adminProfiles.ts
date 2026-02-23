export type AdminRole = "dev" | "mod" | "reviewer";

export type AdminPermissions = {
  canSend: boolean;
  canReject: boolean;
  canSeen: boolean;
  canViewDetails: boolean;
};

export type AdminProfileDef = {
  name: string;
  role: AdminRole;
  badge: "dev" | "mod" | "reviewer";
  permissions: AdminPermissions;
};

// Single source of truth for admin/mod/reviewer capabilities.
export const ADMIN_PROFILES: readonly AdminProfileDef[] = [
  // Dev
  {
    name: "PhrostiX",
    role: "dev",
    badge: "dev",
    permissions: { canSend: true, canReject: true, canSeen: true, canViewDetails: true },
  },

  // Mods
  {
    name: "YraX",
    role: "mod",
    badge: "mod",
    permissions: { canSend: true, canReject: true, canSeen: true, canViewDetails: true },
  },
  {
    name: "Perox8",
    role: "mod",
    badge: "mod",
    permissions: { canSend: true, canReject: true, canSeen: true, canViewDetails: true },
  },
  {
    name: "Incidius",
    role: "mod",
    badge: "mod",
    permissions: { canSend: true, canReject: true, canSeen: true, canViewDetails: true },
  },
  {
    name: "Waffl3X",
    role: "mod",
    badge: "mod",
    permissions: { canSend: true, canReject: true, canSeen: true, canViewDetails: true },
  },
  {
    name: "Gusearth",
    role: "mod",
    badge: "mod",
    permissions: { canSend: true, canReject: true, canSeen: true, canViewDetails: true },
  },

  // Generic reviewer (view-only)
  {
    name: "Reviewer",
    role: "reviewer",
    badge: "reviewer",
    permissions: { canSend: false, canReject: false, canSeen: false, canViewDetails: true },
  },
] as const;

export const ADMIN_PROFILE_NAMES = ADMIN_PROFILES.map((p) => p.name) as readonly string[];

export function getAdminProfileDef(name: string | null | undefined): AdminProfileDef | null {
  const n = String(name ?? "").trim();
  if (!n) return null;
  return (ADMIN_PROFILES as readonly AdminProfileDef[]).find((p) => p.name === n) ?? null;
}

// Back-compat: some server code historically used MOD_PROFILES.
export const MOD_PROFILES = ADMIN_PROFILES.filter((p) => p.role === "mod").map((p) => p.name) as readonly string[];
export type ModProfile = (typeof MOD_PROFILES)[number];
