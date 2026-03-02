import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getMatches, getMyJoinRequests, getSoloProfiles, getTeams, getTournaments } from "@/lib/storage";

const UserProfile = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  if (currentUser.is_guest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 border-white/10 max-w-md w-full">
          <h2 className="text-xl font-black">Profile Access</h2>
          <p className="text-sm text-white/60 mt-2">Sign in to view your player profile and tournament history.</p>
          <Button className="mt-4 w-full" onClick={() => navigate(`/auth?redirect=${encodeURIComponent("/profile")}`)}>
            Login / Sign Up
          </Button>
        </Card>
      </div>
    );
  }

  const teams = getTeams();
  const matches = getMatches();
  const tournaments = getTournaments();
  const joinRequests = getMyJoinRequests(currentUser.email);
  const soloProfiles = getSoloProfiles().filter((profile) => profile.user_email === currentUser.email);

  const myTeam = teams.find((team) => (team.members || []).includes(currentUser.email));
  const approvedJoins = joinRequests.filter((item) => item.approval_status === "approved");
  const myMatchCount = matches.filter((match) =>
    (match.participants || []).some((participant: any) => participant.email === currentUser.email)
  ).length;
  const myTournamentHistory = tournaments.filter((tournament) =>
    approvedJoins.some((request) => request.tournament_id === tournament.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
      <section className="container mb-8">
        <Card className="p-6 border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-black">
              {currentUser.name?.[0] || "A"}
            </div>
            <div>
              <h1 className="text-3xl font-black">{currentUser.name}</h1>
              <p className="text-sm text-white/60">{currentUser.email}</p>
              {currentUser.handle ? <p className="text-sm text-cyan-300">@{currentUser.handle}</p> : null}
            </div>
          </div>
        </Card>
      </section>

      <section className="container mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-white/10">
          <p className="text-xs text-white/60">Matches Played</p>
          <p className="text-2xl font-black">{myMatchCount}</p>
        </Card>
        <Card className="p-4 border-white/10">
          <p className="text-xs text-white/60">Approved Tournaments</p>
          <p className="text-2xl font-black">{approvedJoins.length}</p>
        </Card>
        <Card className="p-4 border-white/10">
          <p className="text-xs text-white/60">Solo Profiles</p>
          <p className="text-2xl font-black">{soloProfiles.length}</p>
        </Card>
        <Card className="p-4 border-white/10">
          <p className="text-xs text-white/60">Team Membership</p>
          <p className="text-lg font-black">{myTeam?.name || "No Team"}</p>
        </Card>
      </section>

      <section className="container grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border-white/10">
          <h2 className="text-lg font-bold mb-3">Tournament History</h2>
          <div className="space-y-2 max-h-72 overflow-auto">
            {myTournamentHistory.length > 0 ? (
              myTournamentHistory.map((tournament) => (
                <div key={tournament.id} className="rounded border border-white/10 p-3">
                  <p className="font-semibold">{tournament.name}</p>
                  <p className="text-xs text-white/60">{tournament.game_name} • {tournament.status}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/60">No tournaments joined yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6 border-white/10">
          <h2 className="text-lg font-bold mb-3">Solo Profiles</h2>
          <div className="space-y-2 max-h-72 overflow-auto">
            {soloProfiles.length > 0 ? (
              soloProfiles.map((profile) => (
                <div key={profile.id} className="rounded border border-white/10 p-3">
                  <p className="font-semibold">{profile.game_name}</p>
                  <p className="text-xs text-white/60">IGN: {profile.in_game_name}</p>
                  <p className="text-xs text-white/60">Rating: {profile.rating} • {profile.rank_tier}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/60">No solo profiles created yet.</p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default UserProfile;
