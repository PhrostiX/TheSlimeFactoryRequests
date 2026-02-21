export const MOD_PROFILES = ["YraX", "Perox8", "Incidius"] as const;

export type ModProfile = (typeof MOD_PROFILES)[number];
