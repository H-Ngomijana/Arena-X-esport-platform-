import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createTeamInvite,
  getAccountByEmail,
  getCurrentUser,
  getMatches,
  getPageBackgrounds,
  getTeamInvitesByTeam,
  getTeams,
  getTournaments,
  getUserTeam,
  getUserTeamInvites,
  leaveTeam,
  respondToTeamInvite,
  searchInvitablePlayers,
} from "@/lib/storage";
import { toast } from "sonner";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";

const Team = () => {
  useRealtimeRefresh({
    keys: ["teams", "arenax_team_invites", "user_notifications", "matches", "tournaments", "arenax_user_accounts"],
    intervalMs: 2500,
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const id = searchParams.get("id");

  const allTeams = getTeams();
  const team = allTeams.find((item) => item.id === id);
  const pageBackgrounds = getPageBackgrounds();
  const teamPageBackground = team?.banner_url || pageBackgrounds.team_page_default;

  const [search, setSearch] = useState("");

  const tournaments = getTournaments();
  const matches = getMatches();
  const teamMatches = matches.filter((match) => match.team_a_id === id || match.team_b_id === id);
  const teamTournaments = tournaments.filter((tournament) => tournament.registered_teams?.includes(id));

  const teamMembers = useMemo(() => {
    if (!team) return [];
    return (team.members || []).map((email: string) => {
      const account = getAccountByEmail(email);
      return {
        email,
        name: account?.full_name || email,
        handle: account?.handle || "",
        avatar: account?.avatar_url || "",
      };
    });
  }, [team]);

  const myTeam = currentUser.is_guest ? null : getUserTeam(currentUser.email);
  const isCaptain = Boolean(
    team && !currentUser.is_guest && (team.captain_email || "").toLowerCase() === currentUser.email.toLowerCase()
  );

  const inviteCandidates = useMemo(() => {
    if (!team || !isCaptain) return [];
    return searchInvitablePlayers(search, team.id);
  }, [team, isCaptain, search]);

  const incomingInvites = currentUser.is_guest ? [] : getUserTeamInvites(currentUser.email).filter((item) => item.status === "pending");
  const sentInvites = team ? getTeamInvitesByTeam(team.id) : [];

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Team not found</p>
      </div>
    );
  }

  const wins = teamMatches.filter(
    (m) =>
      (m.team_a_id === id && Number(m.team_a_score) > Number(m.team_b_score)) ||
      (m.team_b_id === id && Number(m.team_b_score) > Number(m.team_a_score))
  ).length;
  const losses = teamMatches.filter(
    (m) =>
      (m.team_a_id === id && Number(m.team_a_score) < Number(m.team_b_score)) ||
      (m.team_b_id === id && Number(m.team_b_score) < Number(m.team_a_score))
  ).length;

  const handleInvite = (email: string) => {
    try {
      createTeamInvite({
        team_id: team.id,
        invited_email: email,
        invited_by_email: currentUser.email,
      });
      toast.success("Invite sent.");
      setSearch("");
    } catch (error: any) {
      toast.error(error?.message || "Invite failed.");
    }
  };

  const handleInviteDecision = (inviteId: string, decision: "accept" | "decline") => {
    try {
      respondToTeamInvite(inviteId, currentUser.email, decision);
      toast.success(decision === "accept" ? "Invite accepted." : "Invite declined.");
    } catch (error: any) {
      toast.error(error?.message || "Could not update invite.");
    }
  };

  const handleLeaveTeam = () => {
    if (currentUser.is_guest) return;
    leaveTeam(team.id, currentUser.email);
    toast.success("You left the team.");
    navigate("/teams");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <section className="relative h-80 overflow-hidden">
        {teamPageBackground ? (
          <img src={teamPageBackground} alt={team.name} className="absolute inset-0 w-full h-full object-cover opacity-35" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="relative h-full flex flex-col items-center justify-end p-6 pb-12">
          {team.logo_url ? <img src={team.logo_url} alt={team.name} className="w-24 h-24 rounded-2xl mb-4 object-cover" /> : null}
          <h1 className="text-4xl font-black mb-2">{team.name}</h1>
          <p className="text-muted-foreground">{team.tag} • {teamMembers.length} members</p>
        </div>
      </section>

      <section className="container -mt-6 relative z-10 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-white/10">
            <p className="text-xs text-white/60">Wins</p>
            <p className="text-2xl font-black">{wins}</p>
          </Card>
          <Card className="p-4 border-white/10">
            <p className="text-xs text-white/60">Losses</p>
            <p className="text-2xl font-black">{losses}</p>
          </Card>
          <Card className="p-4 border-white/10">
            <p className="text-xs text-white/60">Tournaments</p>
            <p className="text-2xl font-black">{teamTournaments.length}</p>
          </Card>
          <Card className="p-4 border-white/10">
            <p className="text-xs text-white/60">Rating</p>
            <p className="text-2xl font-black">{Number(team.rating || 0)}</p>
          </Card>
        </div>
      </section>

      <section className="container mb-12 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-white/10">
            <h3 className="font-bold text-lg mb-4">Roster</h3>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.email} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-xs text-white/60">{member.handle ? `@${member.handle} • ` : ""}{member.email}</p>
                  </div>
                  {(team.captain_email || "").toLowerCase() === member.email.toLowerCase() ? (
                    <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300">Captain</span>
                  ) : null}
                </div>
              ))}
            </div>
            {!currentUser.is_guest && myTeam?.id === team.id ? (
              <Button className="mt-4" variant="outline" onClick={handleLeaveTeam}>
                Leave Team
              </Button>
            ) : null}
          </Card>

          {isCaptain ? (
            <Card className="p-6 border-white/10">
              <h3 className="font-bold text-lg mb-4">Invite Players</h3>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, handle, or email"
                className="bg-slate-900 border-white/10"
              />
              <div className="mt-3 space-y-2">
                {inviteCandidates.length > 0 ? (
                  inviteCandidates.map((player) => (
                    <div key={player.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                      <div>
                        <p className="font-semibold">{player.full_name}</p>
                        <p className="text-xs text-white/60">
                          {player.handle ? `@${player.handle} • ` : ""}
                          {player.email}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => handleInvite(player.email)}>
                        Invite
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/60 mt-2">No invitable players found.</p>
                )}
              </div>
            </Card>
          ) : null}

          <Card className="p-6 border-white/10">
            <h3 className="font-bold text-lg mb-4">Team Invite Status</h3>
            <div className="space-y-2 max-h-72 overflow-auto">
              {sentInvites.length ? (
                sentInvites.map((invite) => (
                  <div key={invite.id} className="rounded-lg border border-white/10 p-3">
                    <p className="text-sm font-semibold">{invite.invited_name}</p>
                    <p className="text-xs text-white/60">{invite.invited_email}</p>
                    <p className="text-xs mt-1 uppercase tracking-wide text-cyan-300">{invite.status}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/60">No invites yet.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-white/10">
            <h3 className="font-bold text-lg mb-4">My Pending Invites</h3>
            {currentUser.is_guest ? (
              <Button onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}>
                Login to view invites
              </Button>
            ) : incomingInvites.length > 0 ? (
              <div className="space-y-3">
                {incomingInvites.map((invite) => (
                  <div key={invite.id} className="rounded-lg border border-white/10 p-3">
                    <p className="font-semibold">{invite.team_name}</p>
                    <p className="text-xs text-white/60">Invited by {invite.invited_by_name}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-black" onClick={() => handleInviteDecision(invite.id, "accept")}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleInviteDecision(invite.id, "decline")}>
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/60">No pending invites.</p>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Team;
