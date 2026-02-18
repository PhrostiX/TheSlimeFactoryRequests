"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import TabNav from "../components/TabNav";
import Pagination from "../components/Pagination";
import Image from "next/image";

/* =====================
   TYPES
   ===================== */
type Review = {
  type: number; // your status code
  date: number; // ms timestamp
  note?: string | null; // used as "total sends" (max numeric across reviews)
  messageUrl?: string | null;
};

type SendEntry = {
  name: string;
  type: string; // send | feature | epic | legendary | mythic
  comment?: string | null;
  link?: string | null;
  by?: string | null;
  date: number;
};

type RejectionEntry = {
  name: string;
  reason?: string | null;
  link?: string | null;
  by?: string | null;
  date: number;
};

type MongoRequest = {
  _id?: any; // submission order id (mongo id)
  state?: number;
  userId?: string; // confidential (never shown/searched)
  guildId?: string;
  levelId?: number | string;
  videoUrl?: string | null;
  levelInfo?: {
    name?: string | null;
    description?: string | null;
    // difficulties[0] holds your "count" bucket:
    // - platformer=false: star count / difficulty bucket
    // - platformer=true: moon count / difficulty bucket
    // Demon tiers are 10..14 (10 easy demon ... 14 extreme demon)
    difficulties?: number[] | null;
    demon?: boolean; // optional legacy; we won't rely on it
    platformer?: boolean;
    uploader?: {
      name?: string | null;
      id?: number | string | null;
    } | null;
    note?: string | null;
    extraQuestion?: string | null;
  } | null;
  reviews?: Record<string, Review> | null;

  // New bot fields (preferred)
  status?: "pending" | "sending" | "rated" | "rejected" | "stolen" | "dne";
  sendCount?: number;
  sendNames?: string[];
  sends?: SendEntry[];
  rejections?: RejectionEntry[];
  gdps?: boolean;
  checkFilter?: boolean; // involved-only
  createdAt?: string; // Requested on
  updatedAt?: string;
};

type TagKey = "pending" | "sending" | "rated" | "rejected" | "stolen" | "dne";
type SortKey =
  | "requested_desc"
  | "requested_asc"
  | "lastsend_desc"
  | "lastsend_asc"
  | "sends_desc"
  | "sends_asc"
  | "levelid_desc"
  | "levelid_asc"
  | "name_asc"
  | "name_desc"
  | "uploader_asc"
  | "uploader_desc"
  | "stars_desc"
  | "stars_asc";

type DifficultyKey =
  | "auto"
  | "easy"
  | "normal"
  | "hard"
  | "harder"
  | "insane"
  | "demon_easy"
  | "demon_medium"
  | "demon_hard"
  | "demon_insane"
  | "demon_extreme"
  | "na";

type Tri = "any" | "yes" | "no";

/* =====================
   CONSTANTS (ASSETS)
   ===================== */
const ASSET_BASE = "/level cards/unratedfaces";
const ICON_STARS = `${ASSET_BASE}/stars.png`;
const ICON_MOONS = `${ASSET_BASE}/moons.png`;

/* faces */
const FACE_AUTO = `${ASSET_BASE}/Autoface.png`;
const FACE_EASY = `${ASSET_BASE}/Easyface.png`;
const FACE_NORMAL = `${ASSET_BASE}/Normalface.png`;
const FACE_HARD = `${ASSET_BASE}/HardFace.png`;
const FACE_HARDER = `${ASSET_BASE}/Harderface.png`;
const FACE_INSANE = `${ASSET_BASE}/InsaneFace.png`;
const FACE_NA = `${ASSET_BASE}/NAface.png`;
const FACE_DEMON_EASY = `${ASSET_BASE}/EasyDemonface.png`;
const FACE_DEMON_MED = `${ASSET_BASE}/MediumDemonface.png`;
const FACE_DEMON_HARD = `${ASSET_BASE}/HardDemonface.png`;
const FACE_DEMON_INSANE = `${ASSET_BASE}/InsaneDemonface.png`;
const FACE_DEMON_EXTREME = `${ASSET_BASE}/ExtremeDemonface.png`;

/* Random banner texts */
const BANNER_TEXTS = [
  "BANGER DETECTED",
  "ABSOLUTE FIRE",
  "LEGENDARY LEVEL",
  "MASTERPIECE ALERT",
  "CHEF'S KISS",
  "PURE GOLD",
  "INSTANT CLASSIC",
  "HALL OF FAME",
  "CERTIFIED GOOPY",
  "PEAK GAMEPLAY",
];

/* =====================
   HELPERS
   ===================== */
function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function toInt(v: any) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function toMaybeInt(v: any): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isInvolvedMongo(r: MongoRequest) {
  return r.checkFilter === true;
}

function formatRequested(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";

  const timeStr = d.toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateStr = d.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `${timeStr} | ${dateStr}`;
}

function toTimeMs(iso?: string) {
  if (!iso) return 0;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function latestReview(r: MongoRequest): Review | null {
  const obj = r.reviews || null;
  if (!obj) return null;
  const list = Object.values(obj).filter(Boolean);
  if (!list.length) return null;
  list.sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
  return list[0] ?? null;
}

function allReviews(r: MongoRequest): Review[] {
  const obj = r.reviews || null;
  if (!obj) return [];
  return Object.values(obj).filter(Boolean);
}

function statusFromRequest(r: MongoRequest): { key: TagKey; text: string } {
  const s = (r.status || "").toLowerCase();
  if (s === "sending") return { key: "sending", text: "Sending" };
  if (s === "rated") return { key: "rated", text: "★ Rated" };
  if (s === "rejected") return { key: "rejected", text: "Rejected" };
  if (s === "stolen") return { key: "stolen", text: "Stolen" };
  if (s === "dne") return { key: "dne", text: "Does not exist" };
  if (s === "pending") return { key: "pending", text: "Pending Review" };

  if (typeof r.sendCount === "number" && r.sendCount > 0)
    return { key: "sending", text: "Sending" };
  if (Array.isArray(r.sends) && r.sends.length > 0)
    return { key: "sending", text: "Sending" };

  const rev = latestReview(r);
  if (!rev) return { key: "pending", text: "Pending Review" };
  const t = Number(rev.type);
  if (t > 0) return { key: "sending", text: "Sending" };
  if (t === -1) return { key: "rejected", text: "Rejected" };
  if (t === -2) return { key: "sending", text: "Sending" };
  if (t === -3) return { key: "rated", text: "★ Rated" };
  if (t === -4) return { key: "stolen", text: "Stolen" };
  if (t === -5) return { key: "dne", text: "Does not exist" };
  return { key: "pending", text: "Pending Review" };
}

function totalSends(r: MongoRequest) {
  if (typeof r.sendCount === "number") return r.sendCount;
  if (Array.isArray(r.sends)) return r.sends.length;

  const revs = allReviews(r);
  let max = 0;
  for (const rv of revs) {
    const n = toInt(rv.note);
    if (n > max) max = n;
  }
  return max;
}

function lastSendMs(r: MongoRequest): number | null {
  const st = statusFromRequest(r);
  if (st.key !== "sending") return null;

  if (Array.isArray(r.sends) && r.sends.length) {
    const sorted = [...r.sends].sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
    return sorted[0]?.date ?? null;
  }

  const revs = allReviews(r).filter((rv) => {
    const t = Number(rv.type);
    return t > 0 || t === -2;
  });
  if (!revs.length) return null;
  revs.sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
  return revs[0]?.date ?? null;
}

function formatRelative(ms?: number | null) {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const sec = Math.max(0, Math.floor(diff / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}d ago`;
  if (hr > 0) return `${hr}h ago`;
  if (min > 0) return `${min}m ago`;
  return `just now`;
}

/* --- YouTube parsing + thumbnails --- */
function parseYouTubeId(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  const m1 = u.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (m1) return m1[1];
  const m2 = u.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (m2) return m2[1];
  const m3 = u.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (m3) return m3[1];
  const m4 = u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (m4) return m4[1];
  return null;
}

function youtubeThumb(url?: string | null) {
  const id = parseYouTubeId(String(url ?? ""));
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

function getCount(r: MongoRequest): number | null {
  const n = r.levelInfo?.difficulties?.[0];
  const x = toMaybeInt(n);
  return x;
}

function getDifficultyKey(r: MongoRequest): DifficultyKey {
  const n = getCount(r);
  if (n == null) return "na";
  if (n === 10) return "demon_easy";
  if (n === 11) return "demon_medium";
  if (n === 12) return "demon_hard";
  if (n === 13) return "demon_insane";
  if (n === 14) return "demon_extreme";
  if (n <= 1) return "auto";
  if (n === 2) return "easy";
  if (n === 3) return "normal";
  if (n === 4 || n === 5) return "hard";
  if (n === 6 || n === 7) return "harder";
  if (n === 8 || n === 9) return "insane";
  return "na";
}

function difficultyLabel(k: DifficultyKey) {
  switch (k) {
    case "auto":
      return "Auto";
    case "easy":
      return "Easy";
    case "normal":
      return "Normal";
    case "hard":
      return "Hard";
    case "harder":
      return "Harder";
    case "insane":
      return "Insane";
    case "demon_easy":
      return "Easy Demon";
    case "demon_medium":
      return "Medium Demon";
    case "demon_hard":
      return "Hard Demon";
    case "demon_insane":
      return "Insane Demon";
    case "demon_extreme":
      return "Extreme Demon";
    default:
      return "—";
  }
}

function faceIconPath(r: MongoRequest): string {
  const dk = getDifficultyKey(r);
  const n = getCount(r);
  switch (dk) {
    case "demon_easy":
      return FACE_DEMON_EASY;
    case "demon_medium":
      return FACE_DEMON_MED;
    case "demon_hard":
      return FACE_DEMON_HARD;
    case "demon_insane":
      return FACE_DEMON_INSANE;
    case "demon_extreme":
      return FACE_DEMON_EXTREME;
  }
  if (n == null) return FACE_NA;
  if (n <= 1) return FACE_AUTO;
  if (n === 2) return FACE_EASY;
  if (n === 3) return FACE_NORMAL;
  if (n === 4 || n === 5) return FACE_HARD;
  if (n === 6 || n === 7) return FACE_HARDER;
  if (n === 8 || n === 9) return FACE_INSANE;
  return FACE_NA;
}

function triLabel(t: Tri) {
  if (t === "any") return "Any";
  if (t === "yes") return "Yes";
  return "No";
}

function getRandomBannerText(levelId: string | number): string {
  const idStr = String(levelId);
  const lastTwo = idStr.slice(-2);
  const seed = parseInt(lastTwo, 10) || 0;
  const index = seed % BANNER_TEXTS.length;
  return BANNER_TEXTS[index];
}

/* =====================
   FILTERS
   ===================== */
type Filters = {
  text: string; // ID / level name / uploader
  tags: TagKey[];
  difficulty: DifficultyKey[];
  hasVideo: Tri;
  platformer: Tri;
  sort: SortKey;
};

const DEFAULT_FILTERS: Filters = {
  text: "",
  tags: [],
  difficulty: [],
  hasVideo: "any",
  platformer: "any",
  sort: "requested_desc",
};

/* =====================
   SMALL UI HELPERS
   ===================== */
function FieldRow({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div style={{ ...styles.fieldRow, ...(style || {}) }} className={className}>
      {children}
    </div>
  );
}

function Label({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div style={{ ...styles.fieldLabel, ...(style || {}) }} className={className}>
      {children}
    </div>
  );
}

function SectionTitle({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      style={{ ...styles.sectionTitle, ...(style || {}) }}
      className={className}
    >
      {children}
    </div>
  );
}

function MiniInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{ ...styles.miniInput, ...(style || {}) }}
      className="frosted-glass"
    />
  );
}

function MiniSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { style, ...rest } = props;
  return (
    <select
      {...rest}
      style={{ ...styles.miniSelect, ...(style || {}) }}
      className="frosted-glass"
    />
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
      className="chip"
    >
      {label}
    </button>
  );
}

/* =====================
   STATUS CHIP
   ===================== */
function StatusChip({ tag }: { tag: TagKey }) {
  const cfg = {
    pending: { text: "Pending Review", style: styles.tagPending },
    sending: { text: "Sending", style: styles.tagSending },
    rated: { text: "★ Rated", style: styles.tagRated },
    rejected: { text: "Rejected", style: styles.tagRejected },
    stolen: { text: "Stolen", style: styles.tagStolen },
    dne: { text: "Does not exist", style: styles.tagDNE },
  }[tag];

  return (
    <div style={{ ...styles.tag, ...cfg.style }}>
      <span style={styles.tagText}>{cfg.text}</span>
    </div>
  );
}

/* =====================
   CARD
   ===================== */
function RequestCard({ r }: { r: MongoRequest }) {
  const id = safeStr(r.levelId) || "—";
  const subId = safeStr(r._id) || "—";
  const name = safeStr(r.levelInfo?.name) || "—";
  const uploader = safeStr(r.levelInfo?.uploader?.name) || "—";
  const requested = formatRequested(r.createdAt);

  const tagObj = statusFromRequest(r);
  const tag = tagObj.key;

  const isPlatformer = !!r.levelInfo?.platformer;
  const count = getCount(r);
  const countText = count == null ? "—" : String(Math.min(count, 10));
  const countIcon = isPlatformer ? ICON_MOONS : ICON_STARS;
  const countColor = isPlatformer
    ? "rgba(150,190,255,0.95)"
    : "rgba(250,204,21,0.95)";

  const diffKey = getDifficultyKey(r);
  const isDemon = diffKey.startsWith("demon_");

  const yt = safeStr(r.videoUrl);
  const ytId = parseYouTubeId(yt);
  const hasVideo = !!ytId;

  const lastMs = lastSendMs(r);
  const lastRelative = lastMs ? formatRelative(lastMs) : "—";
  const sends = totalSends(r);

  const descRaw = safeStr(r.levelInfo?.description);
  const desc = descRaw && descRaw !== "—" ? descRaw : "";

  const bannerText = getRandomBannerText(id);

  const showSendsInfo = tag === "sending" || tag === "rated";

  return (
    <div style={styles.cardMega} className="requestCard">
      <div style={styles.topStrip}>
        <div style={styles.topStripLeft}>
          <span style={styles.topStripStar}>★</span>
          <span style={styles.topStripTitle}>{bannerText}</span>
        </div>

        {showSendsInfo ? (
          <div style={styles.topStripMid}>
            <div style={styles.topMiniLine}>
              <span style={styles.topMiniLabel}>Last send:</span>{" "}
              <span style={styles.topMiniValue}>{lastRelative}</span>
            </div>
            <div style={styles.topMiniLine}>
              <span style={styles.topMiniLabel}>Total sends:</span>{" "}
              <span style={styles.topMiniValue}>{sends}</span>
            </div>
          </div>
        ) : (
          <div />
        )}

        <div style={styles.topStripRight}>
          <div style={styles.topMiniLine}>
            <span style={styles.topMiniLabel}>Requested on:</span>{" "}
            <span style={styles.topMiniValue}>{requested}</span>
          </div>
          <div style={styles.topMiniLine}>
            <span style={styles.topMiniLabel}>Request ID:</span>{" "}
            <span style={styles.topMiniValue}>{subId}</span>
          </div>
        </div>
      </div>

      <div style={styles.stripDivider} />

      <div style={styles.mainRow}>
        <div style={styles.leftCol}>
          <div style={styles.topInfoRow}>
            <div style={styles.faceStack}>
              <img src={faceIconPath(r)} alt="" style={styles.faceIcon} />

              {/* DEMON: normal placement. NON-DEMON: move up a bit more */}
              <div style={isDemon ? styles.countRow : styles.countRowNonDemon}>
                <span style={{ ...styles.countNumber, color: countColor }}>
                  {countText}
                </span>
                <img src={countIcon} alt="" style={styles.countIcon} />
              </div>
            </div>

            <div style={styles.nameCreatorCol}>
              <div style={styles.nameTopRow}>
                <div style={styles.levelName} title={name}>
                  {name.toUpperCase()}
                </div>
                <div style={styles.tagInlineWrap}>
                  <StatusChip tag={tag} />
                </div>
              </div>

              <div style={styles.byLine}>
                <span style={styles.byLabel}>By:</span>{" "}
                <span style={styles.byValue} title={uploader}>
                  {uploader}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.bottomInfo}>
            <div style={styles.idRow}>
              <div style={styles.idPill}>
                <span style={styles.idLabel}>ID:</span>
                <span style={styles.idValue}>{id}</span>
              </div>
            </div>

            {desc ? (
              <div style={styles.descBlock}>
                <div style={styles.descLabel}>Description</div>
                <div style={styles.descText}>{desc}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div style={styles.rightCol}>
          <div style={styles.thumbWrap} className={hasVideo ? "thumbGlow" : ""}>
            {hasVideo ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${ytId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={styles.iframe}
              />
            ) : (
              <div style={styles.noThumb}>
                <div style={styles.noThumbText}>No video</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================
   PAGE
   ===================== */
export default function SearchPage() {
  const [rows, setRows] = useState<MongoRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  // Preset shortcuts (used by the Home page buttons and legacy routes)
  const searchParams = useSearchParams();
  const preset = (searchParams.get("preset") || "").toLowerCase();

  useEffect(() => {
    if (!preset) return;

    if (preset === "sends") {
      setFilters({ ...DEFAULT_FILTERS, tags: ["sending"], sort: "lastsend_desc" });
      setShowFilters(false);
      return;
    }

    if (preset === "submissions") {
      setFilters({ ...DEFAULT_FILTERS, sort: "requested_desc" });
      setShowFilters(false);
      return;
    }
  }, [preset]);


  const [currentPage, setCurrentPage] = useState(1);
  const limit = 6;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: "1",
      limit: "10000",
      sortBy: "latest",
    });
    fetch(`/api/requests?${params}`)
      .then((r) => r.json())
      .then((response) => {
        setRows(response.items || []);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const involvedRows = useMemo(() => rows.filter(isInvolvedMongo), [rows]);

  const computed = useMemo(() => {
    return involvedRows.map((r) => {
      const id = safeStr(r.levelId);
      const levelName = safeStr(r.levelInfo?.name);
      const uploaderName = safeStr(r.levelInfo?.uploader?.name);
      const requestedMs = toTimeMs(r.createdAt);
      const tag = statusFromRequest(r).key;
      const sends = totalSends(r);
      const lastMs = lastSendMs(r);
      const count = getCount(r);
      const diffKey = getDifficultyKey(r);
      const platformer = !!r.levelInfo?.platformer;
      const hasVideo = !!youtubeThumb(safeStr(r.videoUrl));

      return {
        r,
        id,
        levelName,
        uploaderName,
        requestedMs,
        tag,
        sends,
        lastMs: lastMs ?? 0,
        lastMsNull: lastMs,
        count: count ?? -1,
        diffKey,
        platformer,
        hasVideo,
      };
    });
  }, [involvedRows]);

  const filtered = useMemo(() => {
    const text = filters.text.trim().toLowerCase();
    const tags = new Set(filters.tags);
    const diffs = new Set(filters.difficulty);

    let list = computed.filter((x) => {
      if (text) {
        const hit =
          x.id.toLowerCase().includes(text) ||
          x.levelName.toLowerCase().includes(text) ||
          x.uploaderName.toLowerCase().includes(text);
        if (!hit) return false;
      }
      if (tags.size > 0 && !tags.has(x.tag)) return false;
      if (diffs.size > 0 && !diffs.has(x.diffKey)) return false;

      if (filters.hasVideo !== "any") {
        if (filters.hasVideo === "yes" && !x.hasVideo) return false;
        if (filters.hasVideo === "no" && x.hasVideo) return false;
      }

      if (filters.platformer !== "any") {
        if (filters.platformer === "yes" && !x.platformer) return false;
        if (filters.platformer === "no" && x.platformer) return false;
      }

      return true;
    });

    const sort = filters.sort;
    const cmpStr = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });

    list.sort((A, B) => {
      switch (sort) {
        case "requested_desc":
          return (B.requestedMs ?? 0) - (A.requestedMs ?? 0);
        case "requested_asc":
          return (A.requestedMs ?? 0) - (B.requestedMs ?? 0);
        case "lastsend_desc":
          return (B.lastMs ?? 0) - (A.lastMs ?? 0);
        case "lastsend_asc":
          return (A.lastMs ?? 0) - (B.lastMs ?? 0);
        case "sends_desc":
          return (B.sends ?? 0) - (A.sends ?? 0);
        case "sends_asc":
          return (A.sends ?? 0) - (B.sends ?? 0);
        case "levelid_desc":
          return toInt(B.id) - toInt(A.id);
        case "levelid_asc":
          return toInt(A.id) - toInt(B.id);
        case "name_asc":
          return cmpStr(A.levelName, B.levelName);
        case "name_desc":
          return cmpStr(B.levelName, A.levelName);
        case "uploader_asc":
          return cmpStr(A.uploaderName, B.uploaderName);
        case "uploader_desc":
          return cmpStr(B.uploaderName, A.uploaderName);
        case "stars_desc":
          return (B.count ?? -1) - (A.count ?? -1);
        case "stars_asc":
          return (A.count ?? -1) - (B.count ?? -1);
        default:
          return (B.requestedMs ?? 0) - (A.requestedMs ?? 0);
      }
    });

    return list;
  }, [computed, filters]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageSafe = clamp(currentPage, 1, totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * limit;
    const end = start + limit;
    return filtered.slice(start, end);
  }, [filtered, pageSafe]);

  function toggleTag(t: TagKey) {
    setFilters((p) => {
      const set = new Set(p.tags);
      if (set.has(t)) set.delete(t);
      else set.add(t);
      return { ...p, tags: Array.from(set) };
    });
  }

  function toggleDiff(d: DifficultyKey) {
    setFilters((p) => {
      const set = new Set(p.difficulty);
      if (set.has(d)) set.delete(d);
      else set.add(d);
      return { ...p, difficulty: Array.from(set) };
    });
  }

  function cycleTri(key: "hasVideo" | "platformer") {
    setFilters((p) => {
      const cur = p[key];
      const next: Tri = cur === "any" ? "yes" : cur === "yes" ? "no" : "any";
      return { ...p, [key]: next };
    });
  }

  function clearAll() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <>
      <TabNav />
      <main style={styles.page}>
        <div style={styles.container} className="frosted-glass-strong">
          <Image
            src="/slimesearch.png"
            alt="Search Database"
            width={700}
            height={140}
            style={{
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              marginBottom: "25px",
            }}
          />
          <div style={styles.disclaimer} className="frosted-glass animate-fade-in">
            <strong>⚠️ Safety Notice</strong>
            <p style={{ margin: "8px 0 0 0", fontSize: 14, opacity: 0.85 }}>
              Be cautious when clicking on video links. Only click links you trust or that belong to you.
              External links may lead to unexpected or potentially harmful content.
            </p>
          </div>

          <div style={styles.searchBarRow} className="frosted-glass">
            <div style={styles.searchLeft}>
              <Label>Search (ID / level name / uploader)</Label>
              <MiniInput
                value={filters.text}
                onChange={(e) => setFilters((p) => ({ ...p, text: e.target.value }))}
                placeholder="Try: 87284332, Epilogue, baberich..."
              />
            </div>
            <div style={styles.searchRight}>
              <Label>Sort</Label>
              <MiniSelect
                value={filters.sort}
                onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value as SortKey }))}
              >
                <option value="requested_desc">Requested (Newest → Oldest)</option>
                <option value="requested_asc">Requested (Oldest → Newest)</option>
                <option value="lastsend_desc">Last send (Newest → Oldest)</option>
                <option value="lastsend_asc">Last send (Oldest → Newest)</option>
                <option value="sends_desc">Total sends (High → Low)</option>
                <option value="sends_asc">Total sends (Low → High)</option>
                <option value="levelid_desc">Level ID (High → Low)</option>
                <option value="levelid_asc">Level ID (Low → High)</option>
                <option value="name_asc">Level name (A → Z)</option>
                <option value="name_desc">Level name (Z → A)</option>
                <option value="uploader_asc">Uploader (A → Z)</option>
                <option value="uploader_desc">Uploader (Z → A)</option>
                <option value="stars_desc">Stars/Moons (High → Low)</option>
                <option value="stars_asc">Stars/Moons (Low → High)</option>
              </MiniSelect>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                style={styles.filterToggle}
                className="filterToggle"
              >
                {showFilters ? "Hide filters" : "Show filters"}
              </button>
              <button
                type="button"
                onClick={clearAll}
                style={styles.clearBtn}
                className="clearBtn"
              >
                Clear
              </button>
            </div>
          </div>

          {showFilters ? (
            <div style={styles.filterPanel} className="frosted-glass">
              <FieldRow>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <SectionTitle>Tags</SectionTitle>
                  <div style={styles.chipRow}>
                    <Chip active={filters.tags.includes("pending")} label="Pending Review" onClick={() => toggleTag("pending")} />
                    <Chip active={filters.tags.includes("sending")} label="Sending" onClick={() => toggleTag("sending")} />
                    <Chip active={filters.tags.includes("rated")} label="Rated" onClick={() => toggleTag("rated")} />
                    <Chip active={filters.tags.includes("rejected")} label="Rejected" onClick={() => toggleTag("rejected")} />
                    <Chip active={filters.tags.includes("stolen")} label="Stolen" onClick={() => toggleTag("stolen")} />
                    <Chip active={filters.tags.includes("dne")} label="DNE" onClick={() => toggleTag("dne")} />
                  </div>
                </div>
                <div style={{ width: 280, minWidth: 240 }}>
                  <SectionTitle>Video?</SectionTitle>
                  <button type="button" onClick={() => cycleTri("hasVideo")} style={styles.triBtn} className="triBtn">
                    {triLabel(filters.hasVideo)}
                  </button>
                  <SectionTitle style={{ marginTop: 12 }}>Platformer?</SectionTitle>
                  <button type="button" onClick={() => cycleTri("platformer")} style={styles.triBtn} className="triBtn">
                    {triLabel(filters.platformer)}
                  </button>
                </div>
              </FieldRow>

              <FieldRow>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <SectionTitle>Difficulty</SectionTitle>
                  <div style={styles.chipRow}>
                    <Chip active={filters.difficulty.includes("auto")} label="Auto" onClick={() => toggleDiff("auto")} />
                    <Chip active={filters.difficulty.includes("easy")} label="Easy" onClick={() => toggleDiff("easy")} />
                    <Chip active={filters.difficulty.includes("normal")} label="Normal" onClick={() => toggleDiff("normal")} />
                    <Chip active={filters.difficulty.includes("hard")} label="Hard" onClick={() => toggleDiff("hard")} />
                    <Chip active={filters.difficulty.includes("harder")} label="Harder" onClick={() => toggleDiff("harder")} />
                    <Chip active={filters.difficulty.includes("insane")} label="Insane" onClick={() => toggleDiff("insane")} />
                    <Chip active={filters.difficulty.includes("demon_easy")} label="Easy Demon" onClick={() => toggleDiff("demon_easy")} />
                    <Chip active={filters.difficulty.includes("demon_medium")} label="Medium Demon" onClick={() => toggleDiff("demon_medium")} />
                    <Chip active={filters.difficulty.includes("demon_hard")} label="Hard Demon" onClick={() => toggleDiff("demon_hard")} />
                    <Chip active={filters.difficulty.includes("demon_insane")} label="Insane Demon" onClick={() => toggleDiff("demon_insane")} />
                    <Chip active={filters.difficulty.includes("demon_extreme")} label="Extreme Demon" onClick={() => toggleDiff("demon_extreme")} />
                  </div>
                </div>
              </FieldRow>
            </div>
          ) : null}

          <div style={styles.statsRow}>
            <div style={styles.statsText}>
              {loading ? "Loading..." : `Showing ${total} result${total === 1 ? "" : "s"}`}
            </div>
          </div>

          {loading ? <div style={styles.loadingState}>Loading results...</div> : null}
          {!loading && total === 0 ? <div style={styles.noResults}>No matches found.</div> : null}

          <div style={styles.resultsMega}>
            {pageRows.map((x, i) => {
              const r = x.r;
              const key = String(r._id ?? r.levelId ?? `${i}`);
              return (
                <div
                  key={key}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  className="animate-slide-in-up"
                >
                  <RequestCard r={r} />
                </div>
              );
            })}
          </div>

          {!loading && total > 0 && totalPages > 1 && (
            <div style={{ marginTop: 18 }}>
              <Pagination currentPage={pageSafe} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .requestCard {
          transform: translateY(0px);
          transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .requestCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
        }
        .thumbGlow {
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08),
            0 14px 34px rgba(0, 0, 0, 0.38);
        }
        .chip:hover,
        .triBtn:hover,
        .clearBtn:hover,
        .filterToggle:hover {
          transform: translateY(-1px);
          opacity: 0.96;
        }
      `}</style>
    </>
  );
}

/* =====================
   STYLES
   ===================== */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    paddingTop: 130,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  container: {
    width: "min(1200px, 100%)",
    padding: "34px 28px",
    borderRadius: 24,
  },
  title: {
    fontSize: "clamp(28px, 4vw, 36px)",
    fontWeight: 800,
    textAlign: "center",
    margin: 0,
    marginBottom: 18,
    background:
      "linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  disclaimer: {
    padding: "14px 18px",
    borderRadius: 14,
    marginBottom: 18,
    textAlign: "center",
    color: "var(--foreground)",
    borderLeft: "4px solid rgba(245,158,11,0.9)",
  },

  searchBarRow: {
    borderRadius: 18,
    padding: "16px 16px",
    border: "1px solid rgba(255,255,255,0.10)",
    marginBottom: 12,
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  searchLeft: { flex: 1, minWidth: 280 },
  searchRight: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    minWidth: 260,
  },
  filterToggle: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "var(--foreground)",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
    transition: "all 180ms ease",
  },
  clearBtn: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "var(--foreground)",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
    transition: "all 180ms ease",
  },
  filterPanel: {
    borderRadius: 18,
    padding: "16px 16px",
    border: "1px solid rgba(255,255,255,0.10)",
    marginBottom: 18,
  },
  fieldRow: { display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 },
  fieldLabel: { fontSize: 12, fontWeight: 900, opacity: 0.85, marginBottom: 6 },
  sectionTitle: { fontSize: 12, fontWeight: 900, opacity: 0.85, marginBottom: 8 },
  miniInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    color: "var(--foreground)",
    outline: "none",
  },
  miniSelect: {
    width: "min(320px, 100%)",
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    color: "var(--foreground)",
    outline: "none",
    cursor: "pointer",
  },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "var(--foreground)",
    borderRadius: 999,
    padding: "10px 16px",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 180ms ease",
    userSelect: "none",
  },
  chipActive: {
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(168,85,247,0.16))",
    border: "1px solid rgba(255,255,255,0.20)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
  },
  triBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "var(--foreground)",
    fontWeight: 900,
    cursor: "pointer",
    transition: "all 180ms ease",
  },

  statsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  statsText: { opacity: 0.85, fontWeight: 900 },
  loadingState: {
    textAlign: "center",
    padding: 18,
    opacity: 0.75,
    fontSize: 15,
    color: "var(--foreground)",
  },
  noResults: { opacity: 0.75, textAlign: "center", padding: 30, color: "var(--foreground)" },
  resultsMega: { display: "grid", gap: 14 },

  cardMega: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    padding: 0,
    backgroundColor: "rgba(0,0,0,0.26)",
    overflow: "hidden",
  },
  topStrip: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 10,
    alignItems: "center",
    padding: "10px 14px",
    background: "rgba(0,0,0,0.28)",
  },
  topStripLeft: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
  topStripStar: {
    fontWeight: 950,
    fontSize: 18,
    color: "rgba(250,204,21,0.95)",
    textShadow: "0 0 14px rgba(250,204,21,0.25)",
  },
  topStripTitle: {
    fontWeight: 950,
    letterSpacing: 0.4,
    opacity: 0.95,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  topStripMid: {
    textAlign: "center",
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.20)",
    minWidth: 200,
  },
  topMiniLine: { fontSize: 12, lineHeight: 1.4, opacity: 0.95 },
  topMiniLabel: { fontWeight: 900, opacity: 0.75 },
  topMiniValue: { fontWeight: 900, opacity: 0.98 },
  topStripRight: { textAlign: "right", fontSize: 12, opacity: 0.95 },

  stripDivider: { height: 1, background: "rgba(255,255,255,0.10)" },

  mainRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    alignItems: "stretch",
    padding: "24px 14px 14px",
  },

  leftCol: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flex: 1,
  },

  topInfoRow: { display: "flex", alignItems: "flex-start", gap: 18 },

  faceStack: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
  },

  faceIcon: {
    width: 176,
    height: 176,
    objectFit: "contain",
    imageRendering: "auto",
    filter: "drop-shadow(0 12px 20px rgba(0,0,0,0.4))",
    transform: "translateY(-25px)",
    marginLeft: -28,
  },

  bottomInfo: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  diffLabel: {
    fontSize: 18,
    fontWeight: 950,
    opacity: 0.92,
    whiteSpace: "nowrap",
    marginTop: 2,
  },

  countRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 0,
    borderRadius: 0,
    border: "none",
    background: "transparent",
    marginTop: -47,
    transform: "translateX(-13px)",
  },

  // NON-DEMONS: push the star/moon row a bit higher
  countRowNonDemon: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 0,
    borderRadius: 0,
    border: "none",
    background: "transparent",
    marginTop: -62, // <-- higher than demon version
    transform: "translateX(-13px)",
  },

  countIcon: { width: 28, height: 28, opacity: 0.95, objectFit: "contain" },

  countNumber: {
    fontSize: 31,
    fontWeight: 950,
    textShadow: "0 0 12px rgba(255,255,255,0.10)",
  },

  nameCreatorCol: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 1,
    paddingTop: 0,
    marginLeft: -35,
  },

  nameTopRow: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },

  levelName: {
    flex: 1,
    minWidth: 0,
    fontSize: 36,
    fontWeight: 950,
    letterSpacing: 0.8,
    textShadow: "0 14px 30px rgba(0,0,0,0.35)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  tagInlineWrap: { flexShrink: 0, display: "flex", alignItems: "center" },

  byLine: { fontSize: 18, opacity: 0.95 },
  byLabel: { fontWeight: 900, opacity: 0.75 },
  byValue: {
    fontWeight: 900,
    opacity: 0.98,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "inline-block",
    maxWidth: "100%",
    verticalAlign: "bottom",
  },

  idRow: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 4 },

  idPill: {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    fontSize: 12,
    display: "inline-flex",
    gap: 8,
    alignItems: "baseline",
  },
  idLabel: { fontWeight: 900, opacity: 0.75, textTransform: "uppercase", fontSize: 11 },
  idValue: { fontWeight: 950, opacity: 0.98 },

  descBlock: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  descLabel: {
    fontWeight: 950,
    fontSize: 11,
    opacity: 0.8,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  descText: {
    fontSize: 13,
    lineHeight: 1.5,
    opacity: 0.95,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    alignItems: "stretch",
    justifyContent: "flex-start",
    minWidth: 0,
  },

  thumbWrap: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.24)",
    aspectRatio: "16 / 9",
    width: "100%",
  },
  iframe: { width: "100%", height: "100%", border: "none", display: "block" },
  noThumb: { height: "100%", display: "grid", placeItems: "center", opacity: 0.85 },
  noThumbText: { fontWeight: 900, fontSize: 14, opacity: 0.85 },

  tag: {
    padding: "11px 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    fontWeight: 950,
    fontSize: 13,
    letterSpacing: 0.25,
    userSelect: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(0,0,0,0.18)",
  },
  tagText: { opacity: 0.98 },
  tagPending: {
    background:
      "linear-gradient(135deg, rgba(250,204,21,0.24), rgba(245,158,11,0.10))",
  },
  tagSending: {
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.24), rgba(34,197,94,0.10))",
  },
  tagRated: {
    background:
      "linear-gradient(135deg, rgba(168,85,247,0.24), rgba(236,72,153,0.10))",
  },
  tagRejected: {
    background:
      "linear-gradient(135deg, rgba(236,72,153,0.24), rgba(168,85,247,0.10))",
  },
  tagStolen: {
    background:
      "linear-gradient(135deg, rgba(239,68,68,0.24), rgba(245,158,11,0.10))",
  },
  tagDNE: {
    background:
      "linear-gradient(135deg, rgba(148,163,184,0.22), rgba(100,116,139,0.10))",
  },
};
