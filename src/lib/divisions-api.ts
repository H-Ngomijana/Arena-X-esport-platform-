import { apiGet, apiPost } from "@/lib/api";

export interface DivisionSummary {
  id: string;
  name: string;
  slug: string;
  bannerUrl?: string | null;
  theme?: {
    primary?: string;
    accent?: string;
    background?: string;
  };
  tierLevel: number;
  maxPlayers: number;
  promotionSlots: number;
  relegationSlots: number;
  _count?: {
    players?: number;
    seasons?: number;
  };
}

export interface StandingRow {
  rank: number;
  playerId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: Array<"W" | "D" | "L">;
  rankDelta?: number;
  previousPosition?: number | null;
  player?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    inGameName?: string | null;
    divisionId?: string | null;
  } | null;
}

export interface DivisionFixture {
  id: string;
  round: number;
  position: number;
  scheduledAt?: string | null;
  status: "PENDING" | "PLAYED" | "DISPUTED" | "FORFEIT";
  home?: { id: string; username: string; avatarUrl?: string | null } | null;
  away?: { id: string; username: string; avatarUrl?: string | null } | null;
  homeId?: string | null;
  awayId?: string | null;
  result?: {
    homeScore: number;
    awayScore: number;
    proofImageUrl?: string;
  } | null;
}

export interface CurrentSeasonSummary {
  id: string;
  competitionType: "LEAGUE" | "KNOCKOUT";
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate?: string | null;
  currentRound: number;
  daysRemaining?: number | null;
}

export const fallbackDivisions: DivisionSummary[] = [
  {
    id: "division-1",
    name: "Division 1",
    slug: "division-1",
    bannerUrl: "/placeholder.svg",
    theme: { primary: "#22d3ee", accent: "#a78bfa" },
    tierLevel: 1,
    maxPlayers: 20,
    promotionSlots: 0,
    relegationSlots: 3,
  },
  {
    id: "division-2",
    name: "Division 2",
    slug: "division-2",
    bannerUrl: "/placeholder.svg",
    theme: { primary: "#34d399", accent: "#22d3ee" },
    tierLevel: 2,
    maxPlayers: 20,
    promotionSlots: 3,
    relegationSlots: 3,
  },
  {
    id: "division-3",
    name: "Division 3",
    slug: "division-3",
    bannerUrl: "/placeholder.svg",
    theme: { primary: "#f59e0b", accent: "#fb7185" },
    tierLevel: 3,
    maxPlayers: 20,
    promotionSlots: 3,
    relegationSlots: 3,
  },
];

function withFallbackSlug(slug?: string) {
  return fallbackDivisions.find((division) => division.slug === slug) || fallbackDivisions[0];
}

export async function fetchDivisions(): Promise<DivisionSummary[]> {
  try {
    const payload = await apiGet<{ divisions: DivisionSummary[] }>("/api/divisions");
    return payload.divisions?.length ? payload.divisions : fallbackDivisions;
  } catch {
    return fallbackDivisions;
  }
}

export async function fetchDivision(slug?: string): Promise<DivisionSummary> {
  if (!slug) return withFallbackSlug(slug);
  try {
    const payload = await apiGet<{ division: DivisionSummary }>(`/api/divisions/${slug}`);
    return payload.division || withFallbackSlug(slug);
  } catch {
    return withFallbackSlug(slug);
  }
}

export async function fetchCurrentSeason(slug?: string): Promise<CurrentSeasonSummary | null> {
  if (!slug) return null;
  try {
    const payload = await apiGet<{ season: CurrentSeasonSummary }>(`/api/divisions/${slug}/current-season`);
    return payload.season || null;
  } catch {
    return null;
  }
}

export async function fetchDivisionTable(slug?: string): Promise<StandingRow[]> {
  if (!slug) return [];
  try {
    const payload = await apiGet<{ table?: StandingRow[]; leaderboard?: StandingRow[] }>(`/api/divisions/${slug}/table`);
    return payload.table || payload.leaderboard || [];
  } catch {
    return [];
  }
}

export async function fetchDivisionFixtures(slug?: string, round?: number): Promise<DivisionFixture[]> {
  if (!slug) return [];
  try {
    const suffix = round ? `?round=${round}` : "";
    const payload = await apiGet<{ fixtures: DivisionFixture[] }>(`/api/divisions/${slug}/fixtures${suffix}`);
    return payload.fixtures || [];
  } catch {
    return [];
  }
}

export async function fetchDivisionLeaderboard(slug?: string): Promise<StandingRow[]> {
  if (!slug) return [];
  try {
    const payload = await apiGet<{ leaderboard: StandingRow[] }>(`/api/rankings/${slug}`);
    return payload.leaderboard || [];
  } catch {
    return [];
  }
}

export async function fetchGlobalElite(): Promise<StandingRow[]> {
  try {
    const payload = await apiGet<{ leaderboard: StandingRow[] }>("/api/rankings/global-elite");
    return payload.leaderboard || [];
  } catch {
    return [];
  }
}

export async function createDivisionAccessRequest(payload: {
  divisionSlug: string;
  userId: string;
  currentDivisionProofUrl: string;
  inGameName?: string;
  inGameId?: string;
  note?: string;
}) {
  const { divisionSlug, ...body } = payload;
  return apiPost(`/api/divisions/${divisionSlug}/access-requests`, body);
}
