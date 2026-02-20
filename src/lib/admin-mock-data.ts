export const adminUser = {
  email: "admin@arenax.gg",
  role: "admin",
  name: "Admin",
};

export const adminMatches = [
  { id: "m1", tournament_id: "1", tournament_name: "ArenaX Championship Series", game_id: "1", round: 1, match_number: 1, team_a: { team_id: "1", name: "Phantom Esports", logo_url: "", score: 13, confirmed: true }, team_b: { team_id: "2", name: "Nexus Gaming", logo_url: "", score: 9, confirmed: true }, scheduled_time: "2026-03-15T18:00:00Z", status: "completed", winner_team_id: "1", screenshots: [], admin_override: false },
  { id: "m2", tournament_id: "1", tournament_name: "ArenaX Championship Series", game_id: "1", round: 1, match_number: 2, team_a: { team_id: "3", name: "Storm Brigade", logo_url: "", score: 0, confirmed: false }, team_b: { team_id: "4", name: "Volt Racing", logo_url: "", score: 0, confirmed: false }, scheduled_time: "2026-03-15T20:00:00Z", status: "scheduled", winner_team_id: null, screenshots: [], admin_override: false },
  { id: "m3", tournament_id: "2", tournament_name: "Winter Clash Invitational", game_id: "2", round: 2, match_number: 1, team_a: { team_id: "1", name: "Phantom Esports", logo_url: "", score: 2, confirmed: true }, team_b: { team_id: "5", name: "Apex Predators", logo_url: "", score: 1, confirmed: false }, scheduled_time: "2026-02-20T19:00:00Z", status: "live", winner_team_id: null, screenshots: [], admin_override: false },
  { id: "m4", tournament_id: "2", tournament_name: "Winter Clash Invitational", game_id: "2", round: 1, match_number: 3, team_a: { team_id: "6", name: "Shadow Collective", logo_url: "", score: 1, confirmed: true }, team_b: { team_id: "3", name: "Storm Brigade", logo_url: "", score: 1, confirmed: true }, scheduled_time: "2026-02-20T17:00:00Z", status: "awaiting_results", winner_team_id: null, screenshots: [], admin_override: false },
  { id: "m5", tournament_id: "1", tournament_name: "ArenaX Championship Series", game_id: "1", round: 1, match_number: 3, team_a: { team_id: "5", name: "Apex Predators", logo_url: "", score: 7, confirmed: true }, team_b: { team_id: "6", name: "Shadow Collective", logo_url: "", score: 13, confirmed: true }, scheduled_time: "2026-03-15T16:00:00Z", status: "completed", winner_team_id: "6", screenshots: [], admin_override: false },
  { id: "m6", tournament_id: "3", tournament_name: "Pro League Season 4", game_id: "3", round: 1, match_number: 1, team_a: { team_id: "2", name: "Nexus Gaming", logo_url: "", score: 0, confirmed: false }, team_b: { team_id: "4", name: "Volt Racing", logo_url: "", score: 0, confirmed: false }, scheduled_time: "2026-04-01T18:00:00Z", status: "check_in", winner_team_id: null, screenshots: [], admin_override: false },
  { id: "m7", tournament_id: "2", tournament_name: "Winter Clash Invitational", game_id: "2", round: 1, match_number: 4, team_a: { team_id: "1", name: "Phantom Esports", logo_url: "", score: 3, confirmed: true }, team_b: { team_id: "2", name: "Nexus Gaming", logo_url: "", score: 0, confirmed: false }, scheduled_time: "2026-02-20T15:00:00Z", status: "disputed", winner_team_id: null, screenshots: [], admin_override: false },
  { id: "m8", tournament_id: "1", tournament_name: "ArenaX Championship Series", game_id: "1", round: 2, match_number: 1, team_a: { team_id: "1", name: "Phantom Esports", logo_url: "", score: 0, confirmed: false }, team_b: { team_id: "6", name: "Shadow Collective", logo_url: "", score: 0, confirmed: false }, scheduled_time: "2026-03-16T18:00:00Z", status: "scheduled", winner_team_id: null, screenshots: [], admin_override: false },
];

export const adminDisputes = [
  { id: "d1", match_id: "m7", tournament_id: "2", filed_by_email: "captain@nexusgaming.gg", filed_by_team_id: "2", reason: "Opponent used unauthorized third-party overlay during match. Evidence shows clear advantage gained.", evidence_urls: ["https://example.com/screenshot1.png", "https://example.com/screenshot2.png"], status: "open" as const, resolution: "", resolved_by: "", resolved_at: "", admin_notes: "" },
  { id: "d2", match_id: "m1", tournament_id: "1", filed_by_email: "captain@nexusgaming.gg", filed_by_team_id: "2", reason: "Server lag caused disconnection during crucial round. Match should be replayed.", evidence_urls: ["https://example.com/lag-proof.png"], status: "under_review" as const, resolution: "", resolved_by: "", resolved_at: "", admin_notes: "Reviewing server logs" },
  { id: "d3", match_id: "m5", tournament_id: "1", filed_by_email: "captain@apexpredators.gg", filed_by_team_id: "5", reason: "Score was incorrectly reported. We won 13-7 not the other way around.", evidence_urls: [], status: "resolved" as const, resolution: "Score verified correct. No change needed.", resolved_by: "admin@arenax.gg", resolved_at: "2026-02-19T14:00:00Z", admin_notes: "" },
  { id: "d4", match_id: "m3", tournament_id: "2", filed_by_email: "player@voltrace.gg", filed_by_team_id: "4", reason: "Toxic behavior and harassment from opposing team during live match chat.", evidence_urls: ["https://example.com/chat-log.png"], status: "dismissed" as const, resolution: "Insufficient evidence provided.", resolved_by: "admin@arenax.gg", resolved_at: "2026-02-18T10:00:00Z", admin_notes: "" },
];

export const adminPlayerRatings = [
  { id: "pr1", user_email: "phantomx@mail.com", user_name: "PhantomX", game_id: "1", game_name: "Valorant", rating: 2847, rank_tier: "Champion" as const, stats: { matches_played: 390, wins: 342, losses: 48, draws: 0, win_rate: 87.7, current_streak: 12, best_streak: 18 } },
  { id: "pr2", user_email: "nexusgod@mail.com", user_name: "NexusGod", game_id: "2", game_name: "League of Legends", rating: 2791, rank_tier: "Champion" as const, stats: { matches_played: 611, wins: 520, losses: 91, draws: 0, win_rate: 85.1, current_streak: 8, best_streak: 14 } },
  { id: "pr3", user_email: "blitz@mail.com", user_name: "BlitzKrieg", game_id: "3", game_name: "Counter-Strike 2", rating: 2688, rank_tier: "Diamond" as const, stats: { matches_played: 342, wins: 280, losses: 62, draws: 0, win_rate: 81.9, current_streak: 5, best_streak: 11 } },
  { id: "pr4", user_email: "vortex@mail.com", user_name: "VortexQ", game_id: "1", game_name: "Valorant", rating: 2634, rank_tier: "Diamond" as const, stats: { matches_played: 270, wins: 215, losses: 55, draws: 0, win_rate: 79.6, current_streak: 15, best_streak: 15 } },
  { id: "pr5", user_email: "shadow@mail.com", user_name: "ShadowByte", game_id: "5", game_name: "Apex Legends", rating: 2590, rank_tier: "Diamond" as const, stats: { matches_played: 265, wins: 198, losses: 67, draws: 0, win_rate: 74.7, current_streak: 3, best_streak: 9 } },
  { id: "pr6", user_email: "ace@mail.com", user_name: "AceRunner", game_id: "4", game_name: "Rocket League", rating: 2512, rank_tier: "Platinum" as const, stats: { matches_played: 412, wins: 310, losses: 102, draws: 0, win_rate: 75.2, current_streak: 7, best_streak: 12 } },
  { id: "pr7", user_email: "zero@mail.com", user_name: "ZeroGravity", game_id: "6", game_name: "Fortnite", rating: 2488, rank_tier: "Platinum" as const, stats: { matches_played: 233, wins: 175, losses: 58, draws: 0, win_rate: 75.1, current_streak: 4, best_streak: 8 } },
  { id: "pr8", user_email: "cyber@mail.com", user_name: "CyberWolf", game_id: "1", game_name: "Valorant", rating: 2445, rank_tier: "Platinum" as const, stats: { matches_played: 400, wins: 290, losses: 110, draws: 0, win_rate: 72.5, current_streak: 6, best_streak: 10 } },
  { id: "pr9", user_email: "storm@mail.com", user_name: "StormChaser", game_id: "2", game_name: "League of Legends", rating: 2401, rank_tier: "Gold" as const, stats: { matches_played: 265, wins: 180, losses: 85, draws: 0, win_rate: 67.9, current_streak: 2, best_streak: 7 } },
  { id: "pr10", user_email: "iron@mail.com", user_name: "IronPulse", game_id: "3", game_name: "Counter-Strike 2", rating: 2367, rank_tier: "Gold" as const, stats: { matches_played: 318, wins: 220, losses: 98, draws: 0, win_rate: 69.2, current_streak: 9, best_streak: 13 } },
];

export const teamMembers: Record<string, Array<{ email: string; role: string; joined_date: string }>> = {
  "1": [
    { email: "phantomx@mail.com", role: "Captain", joined_date: "2025-06-01" },
    { email: "vortex@mail.com", role: "Entry", joined_date: "2025-06-15" },
    { email: "cyber@mail.com", role: "Support", joined_date: "2025-07-01" },
    { email: "player4@mail.com", role: "Lurker", joined_date: "2025-07-10" },
    { email: "player5@mail.com", role: "AWP", joined_date: "2025-08-01" },
  ],
  "2": [
    { email: "nexusgod@mail.com", role: "Captain", joined_date: "2025-05-01" },
    { email: "storm@mail.com", role: "Mid", joined_date: "2025-05-15" },
    { email: "player6@mail.com", role: "ADC", joined_date: "2025-06-01" },
    { email: "player7@mail.com", role: "Support", joined_date: "2025-06-15" },
    { email: "player8@mail.com", role: "Jungle", joined_date: "2025-07-01" },
  ],
};

export function computeTier(rating: number): string {
  if (rating >= 2000) return "Champion";
  if (rating >= 1600) return "Diamond";
  if (rating >= 1300) return "Platinum";
  if (rating >= 1100) return "Gold";
  if (rating >= 1000) return "Silver";
  return "Bronze";
}

export const matchStatusOptions = ["scheduled", "check_in", "live", "awaiting_results", "disputed", "completed", "forfeit"] as const;

export const matchStatusColors: Record<string, { bg: string; text: string; dot?: string }> = {
  scheduled: { bg: "bg-slate-500/20", text: "text-slate-300" },
  check_in: { bg: "bg-cyan-500/20", text: "text-cyan-300", dot: "bg-cyan-400" },
  live: { bg: "bg-emerald-500/20", text: "text-emerald-300", dot: "bg-emerald-400" },
  awaiting_results: { bg: "bg-amber-500/20", text: "text-amber-300" },
  disputed: { bg: "bg-rose-500/20", text: "text-rose-300" },
  completed: { bg: "bg-purple-500/20", text: "text-purple-300" },
  forfeit: { bg: "bg-slate-500/20", text: "text-slate-400" },
};

export const disputeStatusColors: Record<string, { bg: string; text: string }> = {
  open: { bg: "bg-rose-500/20", text: "text-rose-300" },
  under_review: { bg: "bg-amber-500/20", text: "text-amber-300" },
  resolved: { bg: "bg-emerald-500/20", text: "text-emerald-300" },
  dismissed: { bg: "bg-slate-500/20", text: "text-slate-400" },
};

export const tierColors: Record<string, string> = {
  Champion: "text-purple-400",
  Diamond: "text-blue-400",
  Platinum: "text-cyan-400",
  Gold: "text-amber-400",
  Silver: "text-slate-400",
  Bronze: "text-amber-700",
};
