export const MOD_PROFILES = ["YraX", "Perox8", "Incidius", "Waffl3X", "Gusearth"] as const;

export type ModProfile = (typeof MOD_PROFILES)[number];