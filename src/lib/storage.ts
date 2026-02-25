import { tournaments as mockTournaments, teams as mockTeams, users, matches as mockMatches } from "@/lib/mock-data";
import { markKeyDirty } from "@/lib/remote-sync";

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  created_at: string;
  created_by: string;
}

export interface PlatformMediaItem {
  id: string;
  name: string;
  kind: "image" | "video";
  url: string;
  mime_type: string;
  created_at: string;
  created_by: string;
}

const KEYS = {
  tournaments: "tournaments",
  announcements: "announcements",
  mediaFeed: "media_feed",
  pageBackgrounds: "page_backgrounds",
  teams: "teams",
  matches: "matches",
  joinRequests: "join_requests",
  soloProfiles: "solo_profiles",
  disputeReports: "dispute_reports",
  notifications: "user_notifications",
  currentUser: "arenax_current_user",
  systemSettings: "arenax_system_settings",
} as const;

const syncApiConfigured = Boolean((import.meta.env.VITE_SYNC_API_BASE_URL || "").trim());

export interface PageBackgrounds {
  games_page?: string;
  game_page_default?: string;
  teams_page?: string;
  team_page_default?: string;
  tournaments_page?: string;
  tournament_page_default?: string;
}

export interface TournamentAnnouncement {
  title: string;
  message: string;
  created_at: string;
  type: "info" | "warning" | "match" | "winner";
}

export interface TournamentPrizes {
  first: string;
  second: string;
  third: string;
}

export interface TournamentNextMatch {
  id: string;
  label: string;
  participant_a: string;
  participant_b: string;
  scheduled_time: string;
  court?: string;
}

export interface JoinRequest {
  id: string;
  created_at: string;
  tournament_id: string;
  tournament_name: string;
  user_email: string;
  user_name: string;
  profile_type: "team" | "solo";
  team_id?: string;
  team_name?: string;
  solo_profile_id?: string;
  payment_status: "pending" | "paid" | "failed" | "refunded" | "free" | "manual_pending";
  payment_method?: "mtn_momo" | "manual" | "free";
  payment_reference: string;
  sender_name: string;
  sender_number: string;
  amount_paid: number;
  manual_note?: string;
  approval_status: "awaiting_payment" | "awaiting_approval" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
}

export interface SoloProfile {
  id: string;
  created_at: string;
  user_email: string;
  user_name: string;
  game_id: string;
  game_name: string;
  avatar_url?: string;
  bio?: string;
  in_game_name: string;
  country?: string;
  rating: number;
  rank_tier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Champion";
  stats: {
    matches_played: number;
    wins: number;
    losses: number;
  };
}

export interface DisputeReport {
  id: string;
  created_at: string;
  tournament_id: string;
  match_id?: string;
  reported_by_email: string;
  reported_by_name: string;
  reason: string;
  description: string;
  evidence_urls: string[];
  status: "open" | "reviewing" | "resolved" | "dismissed";
  admin_response?: string;
}

export interface UserNotification {
  id: string;
  created_at: string;
  user_email: string;
  type: "tournament_update" | "system" | "announcement";
  title: string;
  message: string;
  link?: string;
  read: boolean;
}

export interface MatchParticipant {
  profile_id: string;
  profile_type: "team" | "solo";
  name: string;
  email: string;
  ready_status: boolean;
  ready_at?: string;
}

export interface MatchEvidenceSubmission {
  submitted_by_email: string;
  submitted_by_name: string;
  screenshot_urls: string[];
  score_claimed: number;
  notes?: string;
  submitted_at: string;
  is_public: boolean;
}

export interface MatchAdminResult {
  winner_name: string;
  winner_id: string;
  score_a: number;
  score_b: number;
  declared_at: string;
  declared_by: string;
}

export interface SystemSettings {
  maintenance_mode: boolean;
  maintenance_message?: string;
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  markKeyDirty(key);
  window.dispatchEvent(
    new CustomEvent("arenax:data-changed", {
      detail: { key, at: new Date().toISOString() },
    })
  );
}

function readSharedCollection<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return syncApiConfigured ? [] : fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as T[]) : syncApiConfigured ? [] : fallback;
  } catch {
    return syncApiConfigured ? [] : fallback;
  }
}

export function getTournaments() {
  const all = readSharedCollection<any>(KEYS.tournaments, mockTournaments);
  return all.map((item) => {
    const startAt = item.match_start_time || (item.start_date ? `${item.start_date}T18:00:00.000Z` : new Date().toISOString());
    return {
      ...item,
      entry_fee_amount: Number(item.entry_fee_amount ?? item.entry_fee ?? 0),
      entry_fee_currency: item.entry_fee_currency || "RWF",
      payment_recipient_name: item.payment_recipient_name || "Uwase Kevine",
      payment_recipient_number: item.payment_recipient_number || "0794417555",
      payment_description: item.payment_description || "ArenaX Tournament Entry Fee",
      match_start_time: startAt,
      announcements: Array.isArray(item.announcements) ? item.announcements : [],
      prizes: item.prizes || {
        first: item.prize_pool ? `${item.prize_pool} RWF` : "500,000 RWF",
        second: "200,000 RWF",
        third: "100,000 RWF",
      },
      tournament_rules: item.tournament_rules || item.rules || "",
      featured: Boolean(item.featured),
      registered_solos: Array.isArray(item.registered_solos) ? item.registered_solos : [],
      registered_teams: Array.isArray(item.registered_teams) ? item.registered_teams : [],
      current_match_id: item.current_match_id || "",
      rounds_data: Array.isArray(item.rounds_data) ? item.rounds_data : [],
      top_players_override: Array.isArray(item.top_players_override) ? item.top_players_override : [],
      top_teams_override: Array.isArray(item.top_teams_override) ? item.top_teams_override : [],
      results_log: Array.isArray(item.results_log) ? item.results_log : [],
      next_matches_override: Array.isArray(item.next_matches_override) ? item.next_matches_override : [],
      public_bracket: Array.isArray(item.public_bracket) ? item.public_bracket : [],
    };
  });
}

export function saveTournaments(tournaments: any[]) {
  safeWrite(KEYS.tournaments, tournaments);
}

export function getTeams() {
  return readSharedCollection<any>(KEYS.teams, mockTeams);
}

export function saveTeams(teams: any[]) {
  safeWrite(KEYS.teams, teams);
}

export function getMatches() {
  const list = readSharedCollection<any>(KEYS.matches, mockMatches);
  return list.map((item) => ({
    ...item,
    participants: Array.isArray(item.participants) ? item.participants : [],
    evidence_submissions: Array.isArray(item.evidence_submissions) ? item.evidence_submissions : [],
    admin_result: item.admin_result || null,
    is_current_match: Boolean(item.is_current_match),
    round_label: item.round_label || `Round ${item.round || 1}`,
    scheduled_time: item.scheduled_time || item.scheduled_at || "",
  }));
}

export function saveMatches(matches: any[]) {
  safeWrite(KEYS.matches, matches);
}

export function updateMatch(id: string, updates: Record<string, any>) {
  const list = getMatches();
  const next = list.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveMatches(next);
  return next.find((item) => item.id === id);
}

export function createMatch(payload: any) {
  const nextItem = {
    id: Date.now().toString(),
    ...payload,
  };
  const list = getMatches();
  saveMatches([nextItem, ...list]);
  return nextItem;
}

export function getAnnouncements() {
  return safeRead<PlatformAnnouncement[]>(KEYS.announcements, []);
}

export function saveAnnouncements(items: PlatformAnnouncement[]) {
  safeWrite(KEYS.announcements, items);
}

export function addAnnouncement(item: Omit<PlatformAnnouncement, "id" | "created_at">) {
  const nextItem: PlatformAnnouncement = {
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    ...item,
  };
  const all = getAnnouncements();
  saveAnnouncements([nextItem, ...all]);
  return nextItem;
}

export function getMediaFeed() {
  return safeRead<PlatformMediaItem[]>(KEYS.mediaFeed, []);
}

export function saveMediaFeed(items: PlatformMediaItem[]) {
  safeWrite(KEYS.mediaFeed, items);
}

export function addMediaItem(item: Omit<PlatformMediaItem, "id" | "created_at">) {
  const nextItem: PlatformMediaItem = {
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    ...item,
  };
  const all = getMediaFeed();
  saveMediaFeed([nextItem, ...all]);
  return nextItem;
}

export function removeMediaItem(id: string) {
  const all = getMediaFeed();
  saveMediaFeed(all.filter((item) => item.id !== id));
}

export function getPageBackgrounds() {
  return safeRead<PageBackgrounds>(KEYS.pageBackgrounds, {});
}

export function savePageBackgrounds(items: PageBackgrounds) {
  safeWrite(KEYS.pageBackgrounds, items);
}

export function updatePageBackground(key: keyof PageBackgrounds, value: string) {
  const all = getPageBackgrounds();
  const next = { ...all, [key]: value };
  savePageBackgrounds(next);
  return next;
}

export function getSoloProfiles() {
  return safeRead<SoloProfile[]>(KEYS.soloProfiles, []);
}

export function createSoloProfile(payload: Omit<SoloProfile, "id" | "created_at" | "rating" | "rank_tier" | "stats"> & Partial<Pick<SoloProfile, "rating" | "rank_tier" | "stats">>) {
  const entry: SoloProfile = {
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    rating: payload.rating ?? 1000,
    rank_tier: payload.rank_tier ?? "Bronze",
    stats: payload.stats ?? { matches_played: 0, wins: 0, losses: 0 },
    ...payload,
  };
  const all = getSoloProfiles();
  safeWrite(KEYS.soloProfiles, [entry, ...all]);
  return entry;
}

export function getJoinRequests() {
  return safeRead<JoinRequest[]>(KEYS.joinRequests, []);
}

export function createJoinRequest(payload: Omit<JoinRequest, "id" | "created_at">) {
  const entry: JoinRequest = {
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    payment_method:
      payload.payment_method ||
      (payload.payment_status === "free" ? "free" : "mtn_momo"),
    ...payload,
  };
  const all = getJoinRequests();
  safeWrite(KEYS.joinRequests, [entry, ...all]);
  return entry;
}

export function updateJoinRequest(id: string, updates: Partial<JoinRequest>) {
  const all = getJoinRequests();
  const updated = all.map((item) => (item.id === id ? { ...item, ...updates } : item));
  safeWrite(KEYS.joinRequests, updated);
  return updated.find((item) => item.id === id);
}

export function getDisputeReports() {
  return safeRead<DisputeReport[]>(KEYS.disputeReports, []);
}

export function createDisputeReport(payload: Omit<DisputeReport, "id" | "created_at" | "status"> & Partial<Pick<DisputeReport, "status">>) {
  const entry: DisputeReport = {
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    status: payload.status || "open",
    ...payload,
  };
  const all = getDisputeReports();
  safeWrite(KEYS.disputeReports, [entry, ...all]);
  return entry;
}

export function getNotifications() {
  return safeRead<UserNotification[]>(KEYS.notifications, []);
}

export function getUserNotifications(userEmail: string) {
  return getNotifications().filter((item) => item.user_email === userEmail);
}

export function addUserNotification(payload: Omit<UserNotification, "id" | "created_at" | "read"> & Partial<Pick<UserNotification, "read">>) {
  const entry: UserNotification = {
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    read: false,
    ...payload,
  };
  const all = getNotifications();
  safeWrite(KEYS.notifications, [entry, ...all]);
  return entry;
}

export function markNotificationAsRead(id: string) {
  const all = getNotifications();
  safeWrite(
    KEYS.notifications,
    all.map((item) => (item.id === id ? { ...item, read: true } : item))
  );
}

export function markAllNotificationsAsRead(userEmail: string) {
  const all = getNotifications();
  safeWrite(
    KEYS.notifications,
    all.map((item) => (item.user_email === userEmail ? { ...item, read: true } : item))
  );
}

export function getUnreadNotificationCount(userEmail: string) {
  return getUserNotifications(userEmail).filter((item) => !item.read).length;
}

export function getCurrentUser() {
  const fallback = users[0];
  const stored = safeRead<{ id?: string; name?: string; email?: string } | null>(KEYS.currentUser, null);
  return {
    id: stored?.id || fallback.id,
    name: stored?.name || fallback.name,
    email: stored?.email || fallback.email,
  };
}

export function getSystemSettings() {
  return safeRead<SystemSettings>(KEYS.systemSettings, {
    maintenance_mode: false,
    maintenance_message: "",
  });
}

export function saveSystemSettings(settings: SystemSettings) {
  safeWrite(KEYS.systemSettings, settings);
}

export function updateSystemSettings(updates: Partial<SystemSettings>) {
  const current = getSystemSettings();
  const next = { ...current, ...updates };
  saveSystemSettings(next);
  return next;
}
