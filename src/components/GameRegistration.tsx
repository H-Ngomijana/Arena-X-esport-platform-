import { useState } from "react";
import { motion } from "framer-motion";
import { User, Users, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useRegistrations } from "@/context/RegistrationsContext";
import { toast } from "sonner";
import { users, teams } from "@/lib/mock-data";

interface GameRegistrationProps {
  gameId: string;
  gameName: string;
  hasSoloMode: boolean;
  hasTeamMode: boolean;
}

const GameRegistration = ({
  gameId,
  gameName,
  hasSoloMode,
  hasTeamMode,
}: GameRegistrationProps) => {
  const {
    registerSolo,
    registerTeam,
    getPlayerSoloRegistration,
    getGameSoloRegistrations,
    getGameTeamRegistrations,
  } = useRegistrations();

  const currentUser = users[0]; // Mock current user
  const availableTeams = teams.filter((t) => t.captain_id === currentUser.id);

  const [soloDialogOpen, setSoloDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  const soloRegistration = getPlayerSoloRegistration(currentUser.id, gameId);
  const soloRegistrations = getGameSoloRegistrations(gameId);
  const teamRegistrations = getGameTeamRegistrations(gameId);

  const handleRegisterSolo = () => {
    if (soloRegistration) {
      toast.error("Already registered as solo player");
      return;
    }

    registerSolo({
      player_id: currentUser.id,
      player_name: currentUser.name,
      game_id: gameId,
      game_name: gameName,
      rank_tier: currentUser.rank_tier,
      current_rating: currentUser.rating,
      status: "active",
    });

    toast.success("Solo registration confirmed!");
    setSoloDialogOpen(false);
  };

  const handleRegisterTeam = () => {
    if (!selectedTeam) {
      toast.error("Please select a team");
      return;
    }

    const team = teams.find((t) => t.id === selectedTeam);
    if (!team) return;

    registerTeam({
      team_id: team.id,
      team_name: team.name,
      game_id: gameId,
      game_name: gameName,
      captain_id: team.captain_id,
      member_count: team.members?.length || 0,
      team_rating: team.rating || 0,
      status: "active",
    });

    toast.success(`Team "${team.name}" registered successfully!`);
    setTeamDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Registration</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Solo Registration */}
        {hasSoloMode && (
          <Card className="p-6 border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <User size={20} className="text-purple-400" />
                </div>
                <h3 className="text-lg font-display font-bold">Solo Registration</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Play individually and climb the solo rankings
              </p>

              {soloRegistration ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-sm text-emerald-300">Registered as solo player</span>
                </div>
              ) : (
                <Button
                  onClick={() => setSoloDialogOpen(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Register Solo
                </Button>
              )}

              {soloRegistrations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-muted-foreground mb-2">
                    Solo players registered: {soloRegistrations.length}
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {soloRegistrations.slice(0, 3).map((reg) => (
                      <div key={reg.id} className="text-xs flex items-center justify-between">
                        <span className="text-white/70">{reg.player_name}</span>
                        <span className="text-purple-400 font-mono">{reg.current_rating}</span>
                      </div>
                    ))}
                    {soloRegistrations.length > 3 && (
                      <div className="text-xs text-muted-foreground italic">
                        +{soloRegistrations.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Team Registration */}
        {hasTeamMode && (
          <Card className="p-6 border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users size={20} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-display font-bold">Team Registration</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Register your team to compete in tournaments
              </p>

              {availableTeams.length > 0 ? (
                <Button
                  onClick={() => setTeamDialogOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Register Team
                </Button>
              ) : (
                <Button disabled className="w-full" variant="outline">
                  No teams available
                </Button>
              )}

              {teamRegistrations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-muted-foreground mb-2">
                    Teams registered: {teamRegistrations.length}
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {teamRegistrations.slice(0, 3).map((reg) => (
                      <div key={reg.id} className="text-xs flex items-center justify-between">
                        <span className="text-white/70">{reg.team_name}</span>
                        <span className="text-blue-400 font-mono">{reg.team_rating}</span>
                      </div>
                    ))}
                    {teamRegistrations.length > 3 && (
                      <div className="text-xs text-muted-foreground italic">
                        +{teamRegistrations.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Solo Registration Dialog */}
      <Dialog open={soloDialogOpen} onOpenChange={setSoloDialogOpen}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20 font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">Solo Registration</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">
                Player Name
              </label>
              <Input
                value={currentUser.name}
                disabled
                className="bg-white/5 border-white/10 text-white font-mono"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">
                Current Rating
              </label>
              <Input
                value={currentUser.rating}
                disabled
                className="bg-white/5 border-white/10 text-white font-mono"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">
                Rank Tier
              </label>
              <Input
                value={currentUser.rank_tier}
                disabled
                className="bg-white/5 border-white/10 text-white font-mono"
              />
            </div>

            <p className="text-xs text-muted-foreground italic">
              By registering as a solo player, you agree to compete individually in {gameName}{" "}
              1v1 matches and submit proofs of your victories to climb the rankings.
            </p>

            <Button
              onClick={handleRegisterSolo}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              Confirm Solo Registration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Registration Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20 font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">Team Registration</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">
                Select Team
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableTeams.map((team) => (
                  <motion.button
                    key={team.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedTeam(team.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedTeam === team.id
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="font-medium text-sm">{team.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {team.members?.length || 0} members • Rating: {team.rating || 0}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              By registering your team, all members agree to compete in {gameName} tournaments and
              matches as a unified team.
            </p>

            <Button
              onClick={handleRegisterTeam}
              disabled={!selectedTeam}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Confirm Team Registration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameRegistration;
