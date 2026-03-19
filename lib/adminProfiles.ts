import { CONTRIBUTOR_GROUPS } from "@/lib/contributorDirectory";

export type AdminRole = "dev" | "mod" | "reviewer" | "trial_reviewer" | "sender" | "staff" | "trial_staff";

export type AdminPermissions = {
  canSend: boolean;
  canReject: boolean;
  canSeen: boolean;
  canViewDetails: boolean;
};

export type AdminProfileDef = {
  name: string;
  role: AdminRole;
  badge: "owner" | "mod" | "reviewer" | "sender" | "staff";
  permissions: AdminPermissions;
};

const mk = (name: string, role: AdminRole, badge: AdminProfileDef["badge"], permissions: AdminPermissions): AdminProfileDef => ({ name, role, badge, permissions });

const PHROSTIX_NAME = CONTRIBUTOR_GROUPS.developersAndOwners.find((name) => name.toLowerCase() === "phrostix") ?? "PhrostiX";

export const ADMIN_PROFILES: readonly AdminProfileDef[] = [
  mk(PHROSTIX_NAME, "dev", "owner", { canSend: true, canReject: true, canSeen: true, canViewDetails: true }),
  ...CONTRIBUTOR_GROUPS.moderators.map((name) => mk(name, "mod", "mod", { canSend: true, canReject: true, canSeen: true, canViewDetails: true })),
] as const;

export const ADMIN_PROFILE_NAMES = ADMIN_PROFILES.map((p) => p.name) as readonly string[];

export function getAdminProfileDef(name: string | null | undefined): AdminProfileDef | null {
  const n = String(name ?? "").trim();
  if (!n) return null;
  return (ADMIN_PROFILES as readonly AdminProfileDef[]).find((p) => p.name === n) ?? null;
}

export const MOD_PROFILES = ADMIN_PROFILES.filter((p) => p.role === "mod").map((p) => p.name) as readonly string[];
export type ModProfile = (typeof MOD_PROFILES)[number];
