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
  accounts: "arenax_user_accounts",
  passwordResets: "arenax_password_reset_requests",
  directMessages: "arenax_direct_messages",
  teamInvites: "arenax_team_invites",
  matchChatMessages: "arenax_match_chat_messages",
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
  flw_transaction_id?: string;
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

export interface PlayerAccount {
  id: string;
  created_at: string;
  full_name: string;
  handle?: string;
  email: string;
  password: string;
  avatar_url?: string;
  email_verified: boolean;
  user_identifier: string;
  provider: "email" | "google";
}

export interface CurrentUserSession {
  id: string;
  name: string;
  email: string;
  handle?: string;
  avatar_url?: string;
  is_guest: boolean;
}

export interface TeamInvite {
  id: string;
  created_at: string;
  updated_at?: string;
  team_id: string;
  team_name: string;
  invited_email: string;
  invited_name: string;
  invited_by_email: string;
  invited_by_name: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

export interface PasswordResetRequest {
  id: string;
  created_at: string;
  email: string;
  token: string;
  expires_at: string;
  used: boolean;
}

export interface DirectMessage {
  id: string;
  created_at: string;
  sender_email: string;
  sender_name: string;
  receiver_email: string;
  message: string;
}

export interface MatchChatMessage {
  id: string;
  created_at: string;
  match_id: string;
  sender_email: string;
  sender_name: string;
  message: string;
  scope: "team" | "global" | "admin";
  team_id?: string;
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
  const byId = new Map(users.map((u) => [u.id, u]));
  return readSharedCollection<any>(KEYS.teams, mockTeams).map((team) => {
    const rawMembers = Array.isArray(team.members) ? team.members : [];
    const members = rawMembers
      .map((member) => {
        if (typeof member !== "string") return "";
        if (member.includes("@")) return member.toLowerCase();
        const mapped = byId.get(member);
        return mapped?.email?.toLowerCase() || member.toLowerCase();
      })
      .filter(Boolean);

    const captainFromId = team.captain_id ? byId.get(team.captain_id)?.email : "";
    const captainEmail = (team.captain_email || captainFromId || members[0] || "").toLowerCase();

    return {
      ...team,
      captain_email: captainEmail,
      members: Array.from(new Set(members)),
    };
  });
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
  if (entry.avatar_url) {
    const updatedAccounts = getAccounts().map((account) =>
      account.email.toLowerCase() === entry.user_email.toLowerCase()
        ? { ...account, avatar_url: entry.avatar_url }
        : account
    );
    saveAccounts(updatedAccounts);
    const current = safeRead<CurrentUserSession | null>(KEYS.currentUser, null);
    if (current?.email?.toLowerCase() === entry.user_email.toLowerCase()) {
      setCurrentUserSession({ ...current, avatar_url: entry.avatar_url });
    }
  }
  return entry;
}

export function getJoinRequests() {
  return safeRead<JoinRequest[]>(KEYS.joinRequests, []);
}

export function getMyJoinRequests(userEmail: string) {
  return getJoinRequests().filter((item) => item.user_email === userEmail);
}

export function getMyTournamentJoinRequest(tournamentId: string, userEmail: string) {
  return getJoinRequests()
    .filter((item) => item.tournament_id === tournamentId && item.user_email === userEmail)
    .sort(
      (a, b) =>
        new Date(b.approved_at || b.created_at).getTime() -
        new Date(a.approved_at || a.created_at).getTime()
    )[0];
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

export function upsertMyTournamentJoinRequest(
  tournamentId: string,
  userEmail: string,
  payload: Omit<JoinRequest, "id" | "created_at" | "tournament_id" | "user_email">
) {
  const all = getJoinRequests();
  const existing = all.find(
    (item) => item.tournament_id === tournamentId && item.user_email === userEmail
  );
  if (existing) {
    const next = all.map((item) =>
      item.id === existing.id
        ? {
            ...item,
            ...payload,
            tournament_id: tournamentId,
            user_email: userEmail,
          }
        : item
    );
    safeWrite(KEYS.joinRequests, next);
    return next.find((item) => item.id === existing.id);
  }
  return createJoinRequest({
    tournament_id: tournamentId,
    user_email: userEmail,
    ...payload,
  } as JoinRequest);
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
  safeWrite(KEYS.notifications, all.filter((item) => item.id !== id));
}

export function markAllNotificationsAsRead(userEmail: string) {
  const all = getNotifications();
  safeWrite(KEYS.notifications, all.filter((item) => item.user_email !== userEmail));
}

export function getUnreadNotificationCount(userEmail: string) {
  return getUserNotifications(userEmail).filter((item) => !item.read).length;
}

export function getUnreadMessageNotificationCount(userEmail: string) {
  const normalized = userEmail.trim().toLowerCase();
  return getNotifications().filter((item) => {
    if (item.user_email.toLowerCase() !== normalized) return false;
    if (item.read) return false;
    return (item.link || "").startsWith("/messages?with=");
  }).length;
}

export function clearMessageNotificationsForConversation(userEmail: string, otherEmail: string) {
  const normalizedUser = userEmail.trim().toLowerCase();
  const normalizedOther = otherEmail.trim().toLowerCase();
  const targetLink = `/messages?with=${encodeURIComponent(normalizedOther)}`;
  const all = getNotifications();
  safeWrite(
    KEYS.notifications,
    all.filter((item) => {
      if (item.user_email.toLowerCase() !== normalizedUser) return true;
      return (item.link || "") !== targetLink;
    })
  );
}

export function getUserTeam(userEmail: string) {
  const normalized = userEmail.trim().toLowerCase();
  return getTeams().find((team) => {
    const members = Array.isArray(team.members) ? team.members.map((item: string) => item.toLowerCase()) : [];
    return team.captain_email?.toLowerCase() === normalized || members.includes(normalized);
  });
}

export function getTeamInvites() {
  return safeRead<TeamInvite[]>(KEYS.teamInvites, []);
}

export function saveTeamInvites(invites: TeamInvite[]) {
  safeWrite(KEYS.teamInvites, invites);
}

export function getUserTeamInvites(userEmail: string) {
  const normalized = userEmail.trim().toLowerCase();
  return getTeamInvites()
    .filter((invite) => invite.invited_email.toLowerCase() === normalized)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getTeamInvitesByTeam(teamId: string) {
  return getTeamInvites()
    .filter((invite) => invite.team_id === teamId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function searchInvitablePlayers(query: string, teamId: string) {
  const keyword = query.trim().toLowerCase();
  const team = getTeams().find((item) => item.id === teamId);
  const teamMembers = new Set((team?.members || []).map((item: string) => item.toLowerCase()));
  const pendingInviteTargets = new Set(
    getTeamInvites()
      .filter((invite) => invite.status === "pending")
      .map((invite) => invite.invited_email.toLowerCase())
  );

  return getAccounts()
    .filter((account) => account.email_verified)
    .filter((account) => {
      if (teamMembers.has(account.email.toLowerCase())) return false;
      if (getUserTeam(account.email)) return false;
      if (pendingInviteTargets.has(account.email.toLowerCase())) return false;
      if (!keyword) return true;
      const name = account.full_name.toLowerCase();
      const handle = (account.handle || "").toLowerCase();
      const email = account.email.toLowerCase();
      return name.includes(keyword) || handle.includes(keyword) || email.includes(keyword);
    })
    .slice(0, 8);
}

export function createTeamInvite(payload: {
  team_id: string;
  invited_email: string;
  invited_by_email: string;
}) {
  const invitedEmail = payload.invited_email.trim().toLowerCase();
  const inviterEmail = payload.invited_by_email.trim().toLowerCase();
  const team = getTeams().find((item) => item.id === payload.team_id);
  if (!team) throw new Error("Team not found.");
  if ((team.captain_email || "").toLowerCase() !== inviterEmail) {
    throw new Error("Only the team captain can invite players.");
  }
  if (!invitedEmail || invitedEmail === inviterEmail) {
    throw new Error("Invalid player selection.");
  }
  if (getUserTeam(invitedEmail)) {
    throw new Error("Player is already in a team.");
  }
  const pendingForPlayer = getTeamInvites().find(
    (invite) => invite.invited_email.toLowerCase() === invitedEmail && invite.status === "pending"
  );
  if (pendingForPlayer) {
    throw new Error("Player already has a pending invite.");
  }

  const account = getAccountByEmail(invitedEmail);
  if (!account) throw new Error("Player account not found.");
  const captain = getAccountByEmail(inviterEmail);
  const invite: TeamInvite = {
    id: `inv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    created_at: new Date().toISOString(),
    team_id: team.id,
    team_name: team.name,
    invited_email: invitedEmail,
    invited_name: account.full_name,
    invited_by_email: inviterEmail,
    invited_by_name: captain?.full_name || inviterEmail,
    status: "pending",
  };
  saveTeamInvites([invite, ...getTeamInvites()]);
  addUserNotification({
    user_email: invitedEmail,
    type: "system",
    title: "Team Invitation",
    message: `${team.name} invited you to join the team.`,
    link: `/team?id=${team.id}`,
  });
  return invite;
}

export function respondToTeamInvite(inviteId: string, invitedEmail: string, action: "accept" | "decline") {
  const normalizedEmail = invitedEmail.trim().toLowerCase();
  const invites = getTeamInvites();
  const invite = invites.find((item) => item.id === inviteId);
  if (!invite || invite.invited_email.toLowerCase() !== normalizedEmail) {
    throw new Error("Invite not found.");
  }
  if (invite.status !== "pending") {
    throw new Error("Invite already handled.");
  }

  if (action === "accept") {
    if (getUserTeam(normalizedEmail)) {
      throw new Error("You must leave your current team first.");
    }
    const teams = getTeams();
    const nextTeams = teams.map((team) => {
      if (team.id !== invite.team_id) return team;
      const members = Array.isArray(team.members) ? team.members.map((item: string) => item.toLowerCase()) : [];
      return {
        ...team,
        members: Array.from(new Set([...members, normalizedEmail])),
      };
    });
    saveTeams(nextTeams);
  }

  const nextInvites = invites.map((item) => {
    if (item.id === inviteId) {
      return {
        ...item,
        status: action === "accept" ? "accepted" : "declined",
        updated_at: new Date().toISOString(),
      };
    }
    if (action === "accept" && item.invited_email.toLowerCase() === normalizedEmail && item.status === "pending") {
      return {
        ...item,
        status: "cancelled",
        updated_at: new Date().toISOString(),
      };
    }
    return item;
  });
  saveTeamInvites(nextInvites);

  const inviteOwner = getAccountByEmail(invite.invited_by_email);
  addUserNotification({
    user_email: invite.invited_by_email,
    type: "system",
    title: action === "accept" ? "Invite Accepted" : "Invite Declined",
    message: `${invite.invited_name} ${action === "accept" ? "accepted" : "declined"} your invite to ${invite.team_name}.`,
    link: `/team?id=${invite.team_id}`,
  });
  if (inviteOwner && action === "accept") {
    addUserNotification({
      user_email: normalizedEmail,
      type: "system",
      title: "Joined Team",
      message: `You joined ${invite.team_name}.`,
      link: `/team?id=${invite.team_id}`,
    });
  }
  return nextInvites.find((item) => item.id === inviteId);
}

export function leaveTeam(teamId: string, userEmail: string) {
  const normalized = userEmail.trim().toLowerCase();
  const nextTeams = getTeams().map((team) => {
    if (team.id !== teamId) return team;
    const members = (team.members || [])
      .map((item: string) => item.toLowerCase())
      .filter((item: string) => item !== normalized);
    return {
      ...team,
      members,
      captain_email:
        (team.captain_email || "").toLowerCase() === normalized ? members[0] || "" : team.captain_email,
    };
  });
  saveTeams(nextTeams);
}

export function getMatchChatMessages(matchId: string) {
  return safeRead<MatchChatMessage[]>(KEYS.matchChatMessages, [])
    .filter((message) => message.match_id === matchId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function addMatchChatMessage(payload: Omit<MatchChatMessage, "id" | "created_at">) {
  if (!payload.message.trim()) throw new Error("Message cannot be empty.");
  const entry: MatchChatMessage = {
    id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    created_at: new Date().toISOString(),
    ...payload,
    message: payload.message.trim(),
  };
  safeWrite(KEYS.matchChatMessages, [...safeRead<MatchChatMessage[]>(KEYS.matchChatMessages, []), entry]);
  return entry;
}

function createGuestSession(): CurrentUserSession {
  return {
    id: "guest",
    name: "Guest",
    email: "guest@guest.local",
    is_guest: true,
  };
}

function createUserIdentifier() {
  return `ARX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function normalizeSessionFromAccount(account: PlayerAccount): CurrentUserSession {
  return {
    id: account.id,
    name: account.full_name,
    email: account.email.toLowerCase(),
    handle: account.handle,
    avatar_url: account.avatar_url,
    is_guest: false,
  };
}

export function getAccounts() {
  return safeRead<PlayerAccount[]>(KEYS.accounts, []);
}

export function saveAccounts(accounts: PlayerAccount[]) {
  safeWrite(KEYS.accounts, accounts);
}

export function updateAccountProfile(
  email: string,
  updates: { full_name?: string; handle?: string; avatar_url?: string }
) {
  const normalized = email.trim().toLowerCase();
  const current = getAccounts();
  const handleCandidate = updates.handle?.trim();
  if (handleCandidate) {
    const conflict = current.find(
      (acc) =>
        acc.email.toLowerCase() !== normalized &&
        (acc.handle || "").toLowerCase() === handleCandidate.toLowerCase()
    );
    if (conflict) throw new Error("Nickname already in use.");
  }

  const next = current.map((acc) => {
    if (acc.email.toLowerCase() !== normalized) return acc;
    return {
      ...acc,
      full_name: updates.full_name?.trim() || acc.full_name,
      handle: typeof updates.handle !== "undefined" ? (handleCandidate || undefined) : acc.handle,
      avatar_url: typeof updates.avatar_url !== "undefined" ? updates.avatar_url : acc.avatar_url,
    };
  });
  saveAccounts(next);
  const updated = next.find((acc) => acc.email.toLowerCase() === normalized);
  if (!updated) throw new Error("Account not found.");
  setCurrentUserSession(normalizeSessionFromAccount(updated));
  return updated;
}

export function searchAccounts(query: string, excludeEmail?: string) {
  const keyword = query.trim().toLowerCase();
  const excluded = (excludeEmail || "").toLowerCase();
  return getAccounts()
    .filter((acc) => acc.email_verified)
    .filter((acc) => acc.email.toLowerCase() !== excluded)
    .filter((acc) => {
      if (!keyword) return true;
      const name = acc.full_name.toLowerCase();
      const handle = (acc.handle || "").toLowerCase();
      const email = acc.email.toLowerCase();
      return name.includes(keyword) || handle.includes(keyword) || email.includes(keyword);
    })
    .slice(0, 20);
}

export function getAccountByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return getAccounts().find((item) => item.email.toLowerCase() === normalized);
}

export function getCurrentUser(): CurrentUserSession {
  const stored = safeRead<CurrentUserSession | null>(KEYS.currentUser, null);
  if (!stored?.email) return createGuestSession();
  const normalizedEmail = stored.email.toLowerCase();
  const account = getAccountByEmail(normalizedEmail);
  const fallbackSoloAvatar = getSoloProfiles()
    .filter((item) => item.user_email.toLowerCase() === normalizedEmail && item.avatar_url)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.avatar_url;

  return {
    id: account?.id || stored.id || "guest",
    name: account?.full_name || stored.name || "Guest",
    email: normalizedEmail,
    handle: account?.handle || stored.handle,
    avatar_url: account?.avatar_url || stored.avatar_url || fallbackSoloAvatar,
    is_guest: Boolean(stored.is_guest),
  };
}

export function setCurrentUserSession(session: CurrentUserSession) {
  safeWrite(KEYS.currentUser, session);
}

export function isAuthenticatedUser() {
  return !getCurrentUser().is_guest;
}

export function getAuthenticatedUser() {
  const session = getCurrentUser();
  if (session.is_guest) return null;
  return session;
}

export function signOutUser() {
  safeWrite(KEYS.currentUser, createGuestSession());
}

export function signUpWithEmail(payload: {
  full_name: string;
  email: string;
  password: string;
  handle?: string;
  avatar_url?: string;
}) {
  const normalizedEmail = payload.email.trim().toLowerCase();
  if (!normalizedEmail || !payload.password.trim() || !payload.full_name.trim()) {
    throw new Error("Missing required signup fields.");
  }
  if (getAccountByEmail(normalizedEmail)) {
    throw new Error("An account already exists with this email.");
  }

  const normalizedHandle = payload.handle?.trim();
  if (normalizedHandle) {
    const existingHandle = getAccounts().find(
      (account) => (account.handle || "").toLowerCase() === normalizedHandle.toLowerCase()
    );
    if (existingHandle) {
      throw new Error("This nickname is already in use.");
    }
  }

  const account: PlayerAccount = {
    id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    created_at: new Date().toISOString(),
    full_name: payload.full_name.trim(),
    handle: normalizedHandle || undefined,
    email: normalizedEmail,
    password: payload.password,
    avatar_url: payload.avatar_url,
    email_verified: false,
    user_identifier: createUserIdentifier(),
    provider: "email",
  };
  saveAccounts([account, ...getAccounts()]);
  const session = normalizeSessionFromAccount(account);
  setCurrentUserSession(session);
  return account;
}

export function markEmailVerified(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getAccounts();
  const updated = accounts.map((account) =>
    account.email.toLowerCase() === normalizedEmail ? { ...account, email_verified: true } : account
  );
  saveAccounts(updated);
  const account = updated.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!account) return null;
  const current = getCurrentUser();
  if (current.email.toLowerCase() === normalizedEmail) {
    setCurrentUserSession(normalizeSessionFromAccount(account));
  }
  return account;
}

export function signInWithEmail(email: string, password: string) {
  const account = getAccountByEmail(email);
  if (!account || account.password !== password) {
    throw new Error("Invalid email or password.");
  }
  if (!account.email_verified) {
    throw new Error("Please verify your email before signing in.");
  }
  const session = normalizeSessionFromAccount(account);
  setCurrentUserSession(session);
  return session;
}

export function signInWithGoogle(payload: {
  email: string;
  full_name: string;
  avatar_url?: string;
}) {
  const normalizedEmail = payload.email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Google email is required.");
  const existing = getAccountByEmail(normalizedEmail);
  if (existing) {
    const upgraded: PlayerAccount = {
      ...existing,
      provider: "google",
      email_verified: true,
      full_name: payload.full_name?.trim() || existing.full_name,
      avatar_url: payload.avatar_url || existing.avatar_url,
    };
    saveAccounts(getAccounts().map((item) => (item.id === upgraded.id ? upgraded : item)));
    const session = normalizeSessionFromAccount(upgraded);
    setCurrentUserSession(session);
    return session;
  }

  const account: PlayerAccount = {
    id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    created_at: new Date().toISOString(),
    full_name: payload.full_name?.trim() || normalizedEmail.split("@")[0],
    handle: undefined,
    email: normalizedEmail,
    password: "",
    avatar_url: payload.avatar_url,
    email_verified: true,
    user_identifier: createUserIdentifier(),
    provider: "google",
  };
  saveAccounts([account, ...getAccounts()]);
  const session = normalizeSessionFromAccount(account);
  setCurrentUserSession(session);
  return session;
}

export function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("Email is required.");
  const account = getAccountByEmail(normalized);
  // Keep generic response for security and UX parity.
  if (!account) return { ok: true, sent: false };

  const token = `${Math.random().toString(36).slice(2, 8).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
  const request: PasswordResetRequest = {
    id: `pw_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    created_at: new Date().toISOString(),
    email: normalized,
    token,
    expires_at: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    used: false,
  };
  const all = safeRead<PasswordResetRequest[]>(KEYS.passwordResets, []);
  safeWrite(KEYS.passwordResets, [request, ...all]);
  const base =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  const resetLink = `${base}/auth?mode=reset&email=${encodeURIComponent(normalized)}&token=${encodeURIComponent(
    token
  )}`;

  addUserNotification({
    user_email: normalized,
    type: "system",
    title: "Verify Password Reset",
    message: "Open this verification link to set a new password. Link expires in 30 minutes.",
    link: resetLink,
  });
  return { ok: true, sent: true, reset_link: resetLink };
}

export function resetPasswordWithToken(email: string, token: string, newPassword: string) {
  const normalized = email.trim().toLowerCase();
  const normalizedToken = token.trim().toUpperCase();
  if (!normalized || !normalizedToken || !newPassword.trim()) {
    throw new Error("Email, token, and new password are required.");
  }

  const resets = safeRead<PasswordResetRequest[]>(KEYS.passwordResets, []);
  const match = resets.find(
    (item) =>
      item.email === normalized &&
      item.token === normalizedToken &&
      !item.used &&
      new Date(item.expires_at).getTime() > Date.now()
  );
  if (!match) throw new Error("Invalid or expired reset token.");

  const updatedAccounts = getAccounts().map((account) =>
    account.email === normalized ? { ...account, password: newPassword, email_verified: true } : account
  );
  saveAccounts(updatedAccounts);

  const updatedResets = resets.map((item) =>
    item.id === match.id ? { ...item, used: true } : item
  );
  safeWrite(KEYS.passwordResets, updatedResets);
  return true;
}

export function getDirectMessages() {
  return safeRead<DirectMessage[]>(KEYS.directMessages, []);
}

export function getConversation(userAEmail: string, userBEmail: string) {
  const a = userAEmail.trim().toLowerCase();
  const b = userBEmail.trim().toLowerCase();
  return getDirectMessages()
    .filter(
      (item) =>
        (item.sender_email.toLowerCase() === a && item.receiver_email.toLowerCase() === b) ||
        (item.sender_email.toLowerCase() === b && item.receiver_email.toLowerCase() === a)
    )
    .sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());
}

export function sendDirectMessage(payload: {
  sender_email: string;
  sender_name: string;
  receiver_email: string;
  message: string;
}) {
  const content = payload.message.trim();
  if (!content) throw new Error("Message cannot be empty.");
  const entry: DirectMessage = {
    id: `dm_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
    sender_email: payload.sender_email.trim().toLowerCase(),
    sender_name: payload.sender_name,
    receiver_email: payload.receiver_email.trim().toLowerCase(),
    message: content,
  };
  safeWrite(KEYS.directMessages, [...getDirectMessages(), entry]);
  addUserNotification({
    user_email: entry.receiver_email,
    type: "system",
    title: `New message from ${entry.sender_name}`,
    message: entry.message.length > 64 ? `${entry.message.slice(0, 64)}...` : entry.message,
    link: `/messages?with=${encodeURIComponent(entry.sender_email)}`,
  });
  return entry;
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
