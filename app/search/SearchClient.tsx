"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import TabNav from "../components/TabNav";
import Pagination from "../components/Pagination";
import Image from "next/image";
// import page from "./page";

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
  id?: string;
  name?: string; // legacy
  type: string; // rate | feature | epic | legendary | mythic
  comment?: string | null;
  link?: string | null;
  by?: string | null;
  source?: string | null;
  date: number;
};

type RejectionEntry = {
  name: string;
  reason?: string | null;
  link?: string | null;
  by?: string | null;
  date: number;
};

type AdminState = { isAdmin: boolean; profile: string | null };

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
    // difficulties[0] holds "count" bucket:
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
    extraQuestion?: string | null; // legacy
    videoUrl?: string | null;
  } | null;

  // New bot field (preferred)
  extraQuestion?: {
    question?: string | null;
    answer?: string | null;
  } | null;
  reviews?: Record<string, Review> | null;

  // New bot fields (preferred)
  status?: "pending" | "sending" | "rated" | "rejected" | "stolen" | "dne";
  sendCount?: number;
  sendNames?: string[];
  helperReview?: {
    rating?: string | null;
    comment?: string | null;
    link?: string | null;
    date?: number | null;
  } | null;
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
const FACE_HARD = `${ASSET_BASE}/Hardface.png`;
const FACE_HARDER = `${ASSET_BASE}/Harderface.png`;
const FACE_INSANE = `${ASSET_BASE}/Insaneface.png`;
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

  // ✅ Explicit status always wins (do NOT override rejected just because it has sends)
  if (s === "pending") return { key: "pending", text: "Pending Review" };
  if (s === "sending") return { key: "sending", text: "Accepted" };
  if (s === "rated") return { key: "rated", text: "★ Rated" };
  if (s === "rejected") return { key: "rejected", text: "Not Accepted" };
  if (s === "stolen") return { key: "stolen", text: "Stolen" };
  if (s === "dne") return { key: "dne", text: "Does not exist" };

  // ✅ Fallback for legacy data (ONLY when status is missing)
  const rev = latestReview(r);
  if (!rev) return { key: "pending", text: "Pending Review" };

  const t = Number(rev.type);
  if (t > 0) return { key: "sending", text: "Accepted" };
  if (t === -1) return { key: "rejected", text: "Not Accepted" };
  if (t === -2) return { key: "sending", text: "Accepted" };
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
  // ✅ Always return last send if one exists — regardless of status
  if (Array.isArray(r.sends) && r.sends.length) {
    const sorted = [...r.sends].sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
    return sorted[0]?.date ?? null;
  }

  // Legacy review fallback (positive or -2 types mean "send")
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
  helperRating:
  | "any"
  | "rate"
  | "feature"
  | "epic"
  | "legendary"
  | "mythic"
  | "unassigned";
  myVisibility: "all" | "hide_sent" | "hide_rejected" | "hide_both";
  sort: SortKey;
};

const DEFAULT_FILTERS: Filters = {
  text: "",
  tags: [],
  difficulty: [],
  hasVideo: "any",
  platformer: "any",
  helperRating: "any",
  myVisibility: "all",
  sort: "requested_desc",
};

function normalizeHelperRating(raw: any): Filters["helperRating"] {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "unassigned";
  if (s === "send" || s === "send-only" || s === "rate") return "rate";
  if (s === "feature") return "feature";
  if (s === "epic") return "epic";
  if (s === "legendary") return "legendary";
  if (s === "mythic") return "mythic";
  return "unassigned";
}

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
    sending: { text: "Accepted", style: styles.tagSending },
    rated: { text: "★ Rated", style: styles.tagRated },
    rejected: { text: "Not Accepted", style: styles.tagRejected },
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
function RequestCard({
  r,
  showAdminActions,
  onLogSend,
  onLogReject,
  onViewLog,
}: {
  r: MongoRequest;
  showAdminActions: boolean;
  onLogSend: (requestId: string) => void;
  onLogReject: (requestId: string) => void;
  onViewLog: (r: MongoRequest) => void;
}) {
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

  // Always use videoUrl (prefer the bot's levelInfo.videoUrl, then fall back to top-level videoUrl)
  const yt = safeStr(r.levelInfo?.videoUrl ?? r.videoUrl);
  const ytId = parseYouTubeId(yt);
  const hasVideo = !!ytId;

  const lastMs = lastSendMs(r);
  const lastRelative = lastMs ? formatRelative(lastMs) : "—";
  const sends = totalSends(r);

  const descRaw = safeStr(r.levelInfo?.description);
  const desc = descRaw && descRaw !== "—" ? descRaw : "";

  const bannerText = getRandomBannerText(id);

  const showSendsInfo = totalSends(r) > 0 || tag === "rated";

  return (
    <div style={styles.cardMega} className="requestCard">
      <div style={styles.topStrip} className="card-top-strip">
        <div style={styles.topStripLeft}>
          <span style={styles.topStripStar}>★</span>
          <span style={styles.topStripTitle}>{bannerText}</span>
        </div>

        {showSendsInfo ? (
          <div style={styles.topStripMid} className="card-top-strip-mid">
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

        <div style={styles.topStripRight} className="card-top-strip-right">
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

      <div style={styles.mainRow} className="card-main-row">
        <div style={styles.leftCol}>
          <div style={styles.topInfoRow} className="card-top-info-row">
            <div
              style={styles.faceStack}
              className={`card-face-stack faceStack ${isDemon ? "faceStack--demon" : "faceStack--nondemon"}`}
            >
              <img
                src={faceIconPath(r)}
                alt=""
                style={styles.faceIcon}
                className="card-face-icon"
              />

              {/* DEMON: normal placement. NON-DEMON: move up a bit more */}
              <div
                style={isDemon ? styles.countRow : styles.countRowNonDemon}
                className={
                  isDemon
                    ? "card-count-row card-count-row-demon"
                    : "card-count-row card-count-row-nondemon"
                }
              >
                <span
                  style={{ ...styles.countNumber, color: countColor }}
                  className="countText"
                >
                  {countText}
                </span>
                <img
                  src={countIcon}
                  alt=""
                  style={styles.countIcon}
                  className="countIcon"
                />
              </div>
            </div>

            <div
              style={styles.nameCreatorCol}
              className="card-name-creator-col"
            >
              <div style={styles.nameTopRow} className="card-name-top-row">
                <div
                  style={styles.levelName}
                  title={name}
                  className="card-level-name levelNameText"
                >
                  {name.toUpperCase()}
                </div>
                <div
                  style={styles.tagInlineWrap}
                  className="card-tag-inline-wrap statusTagWrap"
                >
                  <StatusChip tag={tag} />
                </div>
              </div>

              <div style={styles.byLine} className="card-by-line">
                <span style={styles.byLabel}>By:</span>{" "}
                <span
                  style={styles.byValue}
                  title={uploader}
                  className="uploaderText"
                >
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
          {/* Standalone YouTube link ABOVE the video */}
          {hasVideo && (
            <div style={styles.videoLinkRow} className="videoLinkRow">
              <a
                href={yt}
                target="_blank"
                rel="noreferrer"
                style={styles.openYouTubeLink}
                title="Open this video in YouTube"
              >
                Open in YouTube
              </a>
            </div>
          )}

          {/* Video container */}
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

          {/* Admin buttons */}
          {showAdminActions ? (
            <div style={styles.sendBtnRow}>
              <button
                onClick={() => onLogSend(subId)}
                style={styles.addSendPill}
                title="Log a send from the website"
              >
                Add Send
              </button>
              <button
                onClick={() => onLogReject(subId)}
                style={styles.addRejectPill}
                title="Log a reject from the website"
              >
                Add Reject
              </button>
              <button
                onClick={() => onViewLog(r)}
                style={styles.viewLogPill}
                title="View send/reject log and extra question"
              >
                View Log
              </button>
            </div>
          ) : null}
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

  const [admin, setAdmin] = useState<AdminState>({
    isAdmin: false,
    profile: null,
  });

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: AdminState) => setAdmin(d))
      .catch(() => { });
  }, []);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const RATINGS = ["send-only", "feature", "epic", "legendary", "mythic"] as const;
  type Rating = (typeof RATINGS)[number];

  function ratingLabel(r: Rating): string {
    if (r === "send-only") return "Rate";
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendRating, setSendRating] = useState<Rating>("send-only");
  const [sendTargetId, setSendTargetId] = useState<string | null>(null);
  const [sendComment, setSendComment] = useState<string>("");
  const [sendSubmitting, setSendSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState<string>("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<MongoRequest | null>(null);

  function openSendModal(requestId: string) {
    setSendTargetId(requestId);
    setSendRating("send-only");
    setSendComment("");
    setSendError(null);
    setSendModalOpen(true);
  }

  function openRejectModal(requestId: string) {
    setRejectTargetId(requestId);
    setRejectComment("");
    setRejectError(null);
    setRejectModalOpen(true);
  }

  function openLogModal(r: MongoRequest) {
    setLogTarget(r);
    setLogModalOpen(true);
  }

  async function submitSend() {
    if (!sendTargetId) return;
    setSendSubmitting(true);
    setSendError(null);
    try {
      const res = await fetch(
        `/api/requests/${encodeURIComponent(sendTargetId)}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: sendRating, comment: sendComment }),
        }
      );

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.ok === false) {
        setSendError(data?.error || "Failed to log send.");
        return;
      }

      setSendModalOpen(false);
      await fetchRows();
    } catch (e: any) {
      setSendError(String(e?.message ?? e));
    } finally {
      setSendSubmitting(false);
    }
  }

  async function submitReject() {
    if (!rejectTargetId) return;
    setRejectSubmitting(true);
    setRejectError(null);
    try {
      const res = await fetch(
        `/api/requests/${encodeURIComponent(rejectTargetId)}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: rejectComment }),
        }
      );

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.ok === false) {
        setRejectError(data?.error || "Failed to log reject.");
        return;
      }

      setRejectModalOpen(false);
      await fetchRows();
    } catch (e: any) {
      setRejectError(String(e?.message ?? e));
    } finally {
      setRejectSubmitting(false);
    }
  }

  const [showFilters, setShowFilters] = useState(false);

  // Preset shortcuts (used by the Home page buttons and legacy routes)
  const searchParams = useSearchParams();
  const preset = (searchParams.get("preset") || "").toLowerCase();

  useEffect(() => {
    if (!preset) return;

    if (preset === "sends") {
      // ✅ Do NOT filter by status.
      // Show anything that has a send.
      setFilters({
        ...DEFAULT_FILTERS,
        sort: "lastsend_desc",
      });
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

  async function fetchRows() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "10000",
        sortBy: "latest",
      });
      const res = await fetch(`/api/requests?${params}`);
      const response = await res.json().catch(() => ({} as any));
      setRows(response.items || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // ✅ Search page should search ALL rows, not only "involved" ones
  // (Filtering by checkFilter was causing legit requests to never appear in search)
  const computed = useMemo(() => {
    return rows.map((r) => {
      const id = safeStr(r.levelId);
      const subId = safeStr(r._id); // ✅ request id (mongo)
      const levelName = safeStr(r.levelInfo?.name);
      const uploaderName = safeStr(r.levelInfo?.uploader?.name);

      // ✅ include more searchable fields
      const desc = safeStr(r.levelInfo?.description);
      const note = safeStr(r.levelInfo?.note);
      const extraQ =
        safeStr(r.extraQuestion?.question) || safeStr(r.levelInfo?.extraQuestion);
      const extraA = safeStr(r.extraQuestion?.answer);

      // ✅ one combined blob for fast search (lowercased once)
      const searchBlob = [id, subId, levelName, uploaderName, desc, note, extraQ, extraA]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const requestedMs = toTimeMs(r.createdAt);
      const tag = statusFromRequest(r).key;
      const sends = totalSends(r);
      const lastMs = lastSendMs(r);
      const count = getCount(r);
      const diffKey = getDifficultyKey(r);
      const platformer = !!r.levelInfo?.platformer;
      const hasVideo = !!youtubeThumb(safeStr(r.levelInfo?.videoUrl ?? r.videoUrl));
      const helperRating = normalizeHelperRating(r.helperReview?.rating);

      return {
        r,
        id,
        subId,
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
        helperRating,
        searchBlob,
      };
    });
  }, [rows]);

  const filtered = useMemo(() => {
    const text = filters.text.trim().toLowerCase();
    const tags = new Set(filters.tags);
    const diffs = new Set(filters.difficulty);

    let list = computed.filter((x) => {
      // Admin-only: hide levels the current mod has already sent/rejected
      if (admin.isAdmin && admin.profile && filters.myVisibility !== "all") {
        const p = admin.profile;
        const mySent =
          Array.isArray(x.r.sends) && x.r.sends.some((s) => safeStr((s as any)?.by) === p);
        const myRej =
          Array.isArray(x.r.rejections) &&
          x.r.rejections.some((rr) => safeStr((rr as any)?.name) === p);

        if (filters.myVisibility === "hide_sent" && mySent) return false;
        if (filters.myVisibility === "hide_rejected" && myRej) return false;
        if (filters.myVisibility === "hide_both" && (mySent || myRej)) return false;
      }

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

      if (filters.helperRating !== "any") {
        if (x.helperRating !== filters.helperRating) return false;
      }

      return true;
    });

    const sort = filters.sort;
    const cmpStr = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });

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
  }, [computed, filters, admin.isAdmin, admin.profile]);

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
              Be cautious when clicking on video links. Only click links you trust or that belong to
              you. External links may lead to unexpected or potentially harmful content.
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

              <button type="button" onClick={clearAll} style={styles.clearBtn} className="clearBtn">
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
                    <Chip
                      active={filters.tags.includes("pending")}
                      label="Pending Review"
                      onClick={() => toggleTag("pending")}
                    />
                    <Chip
                      active={filters.tags.includes("sending")}
                      label="Accepted"
                      onClick={() => toggleTag("sending")}
                    />
                    <Chip
                      active={filters.tags.includes("rated")}
                      label="Rated"
                      onClick={() => toggleTag("rated")}
                    />
                    <Chip
                      active={filters.tags.includes("rejected")}
                      label="Not Accepted"
                      onClick={() => toggleTag("rejected")}
                    />
                    <Chip
                      active={filters.tags.includes("stolen")}
                      label="Stolen"
                      onClick={() => toggleTag("stolen")}
                    />
                    <Chip active={filters.tags.includes("dne")} label="DNE" onClick={() => toggleTag("dne")} />
                  </div>
                </div>

                <div style={{ width: 280, minWidth: 240 }}>
                  <SectionTitle>Suggested Rating</SectionTitle>
                  <MiniSelect
                    value={filters.helperRating}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        helperRating: e.target.value as any,
                      }))
                    }
                  >
                    <option value="any">Any</option>
                    <option value="rate">Rate</option>
                    <option value="feature">Feature</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                    <option value="mythic">Mythic</option>
                    <option value="unassigned">Unassigned (legacy)</option>
                  </MiniSelect>

                  <SectionTitle>Video?</SectionTitle>
                  <button type="button" onClick={() => cycleTri("hasVideo")} style={styles.triBtn} className="triBtn">
                    {triLabel(filters.hasVideo)}
                  </button>

                  <SectionTitle style={{ marginTop: 12 }}>Platformer?</SectionTitle>
                  <button
                    type="button"
                    onClick={() => cycleTri("platformer")}
                    style={styles.triBtn}
                    className="triBtn"
                  >
                    {triLabel(filters.platformer)}
                  </button>

                  {admin.isAdmin && admin.profile ? (
                    <>
                      <SectionTitle style={{ marginTop: 12 }}>My checked filter</SectionTitle>
                      <MiniSelect
                        value={filters.myVisibility}
                        onChange={(e) =>
                          setFilters((p) => ({
                            ...p,
                            myVisibility: e.target.value as any,
                          }))
                        }
                        title="Hide entries where your moderator profile appears in sends/rejections"
                      >
                        <option value="all">Show all</option>
                        <option value="hide_sent">Hide my sent</option>
                        <option value="hide_rejected">Hide my rejected</option>
                        <option value="hide_both">Hide both</option>
                      </MiniSelect>
                    </>
                  ) : null}
                </div>
              </FieldRow>

              <FieldRow>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <SectionTitle>Difficulty</SectionTitle>
                  <div style={styles.chipRow}>
                    <Chip active={filters.difficulty.includes("auto")} label="Auto" onClick={() => toggleDiff("auto")} />
                    <Chip active={filters.difficulty.includes("easy")} label="Easy" onClick={() => toggleDiff("easy")} />
                    <Chip
                      active={filters.difficulty.includes("normal")}
                      label="Normal"
                      onClick={() => toggleDiff("normal")}
                    />
                    <Chip active={filters.difficulty.includes("hard")} label="Hard" onClick={() => toggleDiff("hard")} />
                    <Chip
                      active={filters.difficulty.includes("harder")}
                      label="Harder"
                      onClick={() => toggleDiff("harder")}
                    />
                    <Chip
                      active={filters.difficulty.includes("insane")}
                      label="Insane"
                      onClick={() => toggleDiff("insane")}
                    />
                    <Chip
                      active={filters.difficulty.includes("demon_easy")}
                      label="Easy Demon"
                      onClick={() => toggleDiff("demon_easy")}
                    />
                    <Chip
                      active={filters.difficulty.includes("demon_medium")}
                      label="Medium Demon"
                      onClick={() => toggleDiff("demon_medium")}
                    />
                    <Chip
                      active={filters.difficulty.includes("demon_hard")}
                      label="Hard Demon"
                      onClick={() => toggleDiff("demon_hard")}
                    />
                    <Chip
                      active={filters.difficulty.includes("demon_insane")}
                      label="Insane Demon"
                      onClick={() => toggleDiff("demon_insane")}
                    />
                    <Chip
                      active={filters.difficulty.includes("demon_extreme")}
                      label="Extreme Demon"
                      onClick={() => toggleDiff("demon_extreme")}
                    />
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
                <div key={key} style={{ animationDelay: `${i * 0.05}s` }} className="animate-slide-in-up">
                  <RequestCard
                    r={r}
                    showAdminActions={admin.isAdmin && !!admin.profile}
                    onLogSend={openSendModal}
                    onLogReject={openRejectModal}
                    onViewLog={openLogModal}
                  />
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

        {sendModalOpen && (
          <div
            onClick={() => setSendModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0,0,0,0.6)",
              display: "grid",
              placeItems: "center",
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(520px, 100%)",
                borderRadius: 16,
                padding: 16,
                background: "rgba(20,20,20,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Log Send</h3>
                <button onClick={() => setSendModalOpen(false)} style={{ opacity: 0.8 }}>
                  ✕
                </button>
              </div>

              <p style={{ opacity: 0.8, marginTop: 10 }}>
                Moderator: <b>{admin.profile ?? "—"}</b>
              </p>

              <label style={{ display: "block", marginTop: 10, opacity: 0.85 }}>Select rating</label>
              <select
                value={sendRating}
                onChange={(e) => setSendRating(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  marginTop: 8,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "white",
                  outline: "none",
                }}
              >
                {RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {ratingLabel(r)}
                  </option>
                ))}
              </select>

              <label style={{ display: "block", marginTop: 12, opacity: 0.85 }}>
                Send comment (optional)
              </label>
              <textarea
                value={sendComment}
                onChange={(e) => setSendComment(e.target.value)}
                placeholder="Add a short note to include in the #sends message (optional)"
                rows={3}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  marginTop: 8,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "white",
                  outline: "none",
                  resize: "vertical",
                }}
              />

              <button
                onClick={submitSend}
                disabled={sendSubmitting}
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  fontWeight: 900,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "white",
                  cursor: "pointer",
                  opacity: sendSubmitting ? 0.7 : 1,
                }}
              >
                {sendSubmitting ? "Submitting…" : "Submit"}
              </button>

              {sendError && <p style={{ marginTop: 10, color: "tomato", fontWeight: 700 }}>{sendError}</p>}
            </div>
          </div>
        )}

        {rejectModalOpen && (
          <div
            onClick={() => setRejectModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0,0,0,0.6)",
              display: "grid",
              placeItems: "center",
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(520px, 100%)",
                borderRadius: 16,
                padding: 16,
                background: "rgba(20,20,20,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Log Reject</h3>
                <button onClick={() => setRejectModalOpen(false)} style={{ opacity: 0.8 }}>
                  ✕
                </button>
              </div>

              <p style={{ opacity: 0.8, marginTop: 10 }}>
                Moderator: <b>{admin.profile ?? "—"}</b>
              </p>

              <label style={{ display: "block", marginTop: 12, opacity: 0.85 }}>
                Reject comment (optional)
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Add a short note to include in the #rejects message (optional)"
                rows={3}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  marginTop: 8,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "white",
                  outline: "none",
                  resize: "vertical",
                }}
              />

              <button
                onClick={submitReject}
                disabled={rejectSubmitting}
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  fontWeight: 900,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "white",
                  cursor: "pointer",
                  opacity: rejectSubmitting ? 0.7 : 1,
                }}
              >
                {rejectSubmitting ? "Submitting…" : "Submit"}
              </button>

              {rejectError && <p style={{ marginTop: 10, color: "tomato", fontWeight: 700 }}>{rejectError}</p>}
            </div>
          </div>
        )}

        {logModalOpen && logTarget && (
          <div
            onClick={() => setLogModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0,0,0,0.6)",
              display: "grid",
              placeItems: "center",
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(700px, 100%)",
                maxHeight: "min(82vh, 900px)",
                overflow: "auto",
                borderRadius: 16,
                padding: 16,
                background: "rgba(20,20,20,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Request Log</h3>
                <button onClick={() => setLogModalOpen(false)} style={{ opacity: 0.8 }}>
                  ✕
                </button>
              </div>

              <p style={{ opacity: 0.85, marginTop: 10, marginBottom: 12 }}>
                <b>{safeStr(logTarget.levelInfo?.name) || "—"}</b> &nbsp;•&nbsp; Request ID:{" "}
                <b>{safeStr(logTarget._id) || "—"}</b>
              </p>

              <div style={{ display: "grid", gap: 12 }}>
                <div
                  style={{
                    borderRadius: 14,
                    padding: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Sends</div>
                  {Array.isArray(logTarget.sends) && logTarget.sends.length ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      {logTarget.sends
                        .slice()
                        .sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
                        .map((s, idx) => (
                          <div key={String((s as any)?.id ?? idx)} style={{ opacity: 0.9 }}>
                            • {safeStr((s as any)?.by) || "—"}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div style={{ opacity: 0.75 }}>—</div>
                  )}
                </div>

                <div
                  style={{
                    borderRadius: 14,
                    padding: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Rejections</div>
                  {Array.isArray(logTarget.rejections) && logTarget.rejections.length ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      {logTarget.rejections
                        .slice()
                        .sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
                        .map((rr, idx) => (
                          <div key={String((rr as any)?.id ?? idx)} style={{ opacity: 0.9 }}>
                            • {safeStr((rr as any)?.name) || "—"}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div style={{ opacity: 0.75 }}>—</div>
                  )}
                </div>

                <div
                  style={{
                    borderRadius: 14,
                    padding: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Extra Question</div>
                  <div style={{ opacity: 0.85 }}>
                    <div>
                      <span style={{ opacity: 0.8 }}>Question:</span>{" "}
                      {safeStr(logTarget.extraQuestion?.question) || ""}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ opacity: 0.8 }}>Answer:</span>{" "}
                      {safeStr(logTarget.extraQuestion?.answer) || ""}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 14,
                    padding: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Helper Suggested Rating</div>
                  <div style={{ opacity: 0.85 }}>
                    {(() => {
                      const hr = normalizeHelperRating(logTarget.helperReview?.rating);
                      if (hr === "unassigned") return "—";
                      if (hr === "rate") return "Rate";
                      return hr.charAt(0).toUpperCase() + hr.slice(1);
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        /* Desktop / wide screens: default truncation (matches previous inline styles) */
        .card-level-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .uploaderText {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

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

        /* ===========================
           MOBILE-ONLY CARD REDESIGN
           (max-width: 820px)
           Desktop styles are untouched.
           =========================== */
        @media (max-width: 820px) {

          /* --- Mobile-only: move the "Open in YouTube" link to the top-left of the whole card --- */
          .requestCard {
            position: relative;
          }

          .videoLinkRow {
            position: absolute;
            top: 10px;
            left: 12px;
            margin: 0 !important;
            z-index: 5;
            justify-content: flex-start !important;
          }

          /* --- Top strip: stack into a single column --- */
          .card-top-strip {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
            padding: 10px 12px !important;
          }
          .card-top-strip-mid {
            text-align: left !important;
          }
          .card-top-strip-right {
            text-align: left !important;
          }

          /* --- Main row: single column, tight padding --- */
          .card-main-row {
            grid-template-columns: 1fr !important;
            padding: 14px 12px 12px !important;
            gap: 14px !important;
          }

          /* --- Header area: text left, face stack right (like your mock) --- */
          .card-top-info-row {
            gap: 12px !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
          }

          .card-name-creator-col {
            order: 1 !important;
            margin-left: 0px !important;
            min-width: 0 !important;
            position: relative !important;
            padding-bottom: 54px !important; /* room for the status pill */
          }

          .card-face-stack {
            order: 2 !important;
            align-items: flex-end !important;
            min-width: 110px !important;
          }

          /* --- Face icon: smaller + clean alignment --- */
          .card-face-icon {
            width: 92px !important;
            height: 92px !important;
            transform: translateY(-10px) !important;
            margin-left: 0px !important;
          }

          /* --- Count row: keep under the face. IMPORTANT: don't move the container,
               so your .countIcon and .countText can be adjusted independently via globals.css vars. --- */
          .card-count-row-demon {
            margin-top: -18px !important;
            transform: none !important;
            justify-content: flex-end !important;
          }
          .card-count-row-nondemon {
            margin-top: -20px !important;
            transform: none !important;
            justify-content: flex-end !important;
          }

          /* --- Name area: big + wraps nicely --- */
          .card-name-top-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
            min-width: 0 !important;
          }

          .card-level-name {
            font-size: 34px !important;
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            line-height: 1.05 !important;
            width: 100% !important;
          }

          /* Mobile: allow uploader to fully show as well */
          .uploaderText {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
          }

          .card-by-line {
            font-size: 16px !important;
          }

          /* --- Status tag: pin to bottom of the name block (sits near the ID pill area) --- */
          .card-tag-inline-wrap {
            position: absolute !important;
            left: 0 !important;
            bottom: 0 !important;
            width: auto !important;
            align-self: flex-start !important;
          }
        }
      `}</style>
    </>
  );
}

/* =====================
   STYLES
   ===================== */
const styles: Record<string, React.CSSProperties> = {
  videoLinkRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 6,
  },

  openYouTubeLink: {
    color: "#3b82f6",
    textDecoration: "underline",
    fontWeight: 500,
    fontSize: 14,
  },
  page: {
    minHeight: "100vh",
    // Extra top padding so content clears the fixed navbar on desktop + mobile
    paddingTop: "clamp(125px, 20vw, 170px)",
    paddingLeft: "clamp(14px, 4vw, 24px)",
    paddingRight: "clamp(14px, 4vw, 24px)",
    paddingBottom: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  container: {
    width: "min(1200px, 100%)",
    padding: "clamp(18px, 4vw, 34px) clamp(14px, 4vw, 28px)",
    borderRadius: 24,
  },
  title: {
    fontSize: "clamp(28px, 4vw, 36px)",
    fontWeight: 800,
    textAlign: "center",
    margin: 0,
    marginBottom: 18,
    background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)",
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
  searchLeft: { flex: 1, minWidth: 220 },
  searchRight: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    minWidth: 220,
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
    padding: "14px 14px",
    border: "1px solid rgba(255,255,255,0.10)",
    marginBottom: 18,
  },
  fieldRow: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 },
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
  chipRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "var(--foreground)",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
    transition: "all 180ms ease",
    userSelect: "none",
  },
  chipActive: {
    background: "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(168,85,247,0.16))",
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
    // Auto-stacks on narrower viewports without needing media queries
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
    minWidth: 0,
  },
  topMiniLine: { fontSize: 12, lineHeight: 1.4, opacity: 0.95 },
  topMiniLabel: { fontWeight: 900, opacity: 0.75 },
  topMiniValue: { fontWeight: 900, opacity: 0.98 },
  topStripRight: { textAlign: "right", fontSize: 12, opacity: 0.95 },

  stripDivider: { height: 1, background: "rgba(255,255,255,0.10)" },

  mainRow: {
    display: "grid",
    // Two columns when there is room, one column on mobile.
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
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
    width: "clamp(96px, 22vw, 176px)",
    height: "clamp(96px, 22vw, 176px)",
    objectFit: "contain",
    imageRendering: "auto",
    filter: "drop-shadow(0 12px 20px rgba(0,0,0,0.4))",
    transform: "translateY(clamp(-26px, -3vw, -25px))",
    marginLeft: "clamp(-30px, -3vw, -28px)",
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
    marginTop: -62,
  },

  // Uses CSS vars so we can shrink on mobile without rewriting the card
  countIcon: {
    width: "var(--count-icon, 28px)",
    height: "var(--count-icon, 28px)",
    opacity: 0.95,
    objectFit: "contain",
  },

  countNumber: {
    fontSize: "var(--count-font, 31px)",
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
  },

  tagInlineWrap: { flexShrink: 0, display: "flex", alignItems: "center" },

  byLine: { fontSize: 18, opacity: 0.95 },
  byLabel: { fontWeight: 900, opacity: 0.75 },
  byValue: {
    fontWeight: 900,
    opacity: 0.98,
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

  sendBtnRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  },
  addSendPill: {
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 13,
    cursor: "pointer",
    border: "1px solid rgba(34,197,94,0.35)",
    background: "rgba(34,197,94,0.18)",
    color: "white",
    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
    transition: "transform 120ms ease, filter 120ms ease",
  },

  addRejectPill: {
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 13,
    cursor: "pointer",
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.16)",
    color: "white",
    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
    transition: "transform 120ms ease, filter 120ms ease",
  },

  viewLogPill: {
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 13,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.20)",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
    transition: "transform 120ms ease, filter 120ms ease",
  },

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
    background: "linear-gradient(135deg, rgba(250,204,21,0.24), rgba(245,158,11,0.10))",
  },
  tagSending: {
    background: "linear-gradient(135deg, rgba(16,185,129,0.24), rgba(34,197,94,0.10))",
  },
  tagRated: {
    background: "linear-gradient(135deg, rgba(168,85,247,0.24), rgba(236,72,153,0.10))",
  },
  tagRejected: {
    background: "linear-gradient(135deg, rgba(236,72,153,0.24), rgba(168,85,247,0.10))",
  },
  tagStolen: {
    background: "linear-gradient(135deg, rgba(239,68,68,0.24), rgba(245,158,11,0.10))",
  },
  tagDNE: {
    background: "linear-gradient(135deg, rgba(148,163,184,0.22), rgba(100,116,139,0.10))",
  },
};