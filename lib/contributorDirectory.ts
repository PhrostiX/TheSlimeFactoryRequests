export const DEVELOPERS_AND_OWNERS = "PhrostiX, dkirinor";
export const MODERATORS = "YraX, Perox8, Incidius, Waffl3X, Gusearth, Infra, GirlyAle2";
export const REVIEWERS = "TechnoIH, Cyclone, Buzzli, Jorge_Mercurio, NormanRus";
export const TRIAL_REVIEWERS = "";
export const SENDERS = "Snowball, Delik";
export const STAFF_MEMBERS = "Lorenzollg, Rui, Wiyn, Orange, Domino, iam6tangent, Jude, Bombcraft, Oshiin";
export const TRIAL_STAFF = "Daaniv";

export function parseNames(csv: string): string[] {
  return String(csv || "").split(",").map((v) => v.trim()).filter(Boolean);
}

function uniqueWithout(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map((v) => v.toLowerCase()));
  const out: string[] = [];
  for (const name of incoming) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    if (out.some((v) => v.toLowerCase() === key)) continue;
    out.push(name);
  }
  return out;
}

const developersAndOwners = parseNames(DEVELOPERS_AND_OWNERS);
const moderators = uniqueWithout(developersAndOwners, parseNames(MODERATORS));
const reviewers = uniqueWithout([...developersAndOwners, ...moderators], parseNames(REVIEWERS));
const trialReviewers = uniqueWithout([...developersAndOwners, ...moderators, ...reviewers], parseNames(TRIAL_REVIEWERS));
const senders = uniqueWithout([...developersAndOwners, ...moderators, ...reviewers, ...trialReviewers], parseNames(SENDERS));
const staffMembers = uniqueWithout([...developersAndOwners, ...moderators, ...reviewers, ...trialReviewers, ...senders], parseNames(STAFF_MEMBERS));
const trialStaff = uniqueWithout([...developersAndOwners, ...moderators, ...reviewers, ...trialReviewers, ...senders, ...staffMembers], parseNames(TRIAL_STAFF));

export const CONTRIBUTOR_GROUPS = {
  developersAndOwners,
  moderators,
  reviewers,
  trialReviewers,
  senders,
  staffMembers,
  trialStaff,
};
