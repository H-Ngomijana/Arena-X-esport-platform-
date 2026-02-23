import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, Clock, XCircle, Trophy, Zap, Star } from "lucide-react";
import { Link } from "react-router-dom";
import RankBadge from "@/components/RankBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGames } from "@/context/GamesContext";
import { useSubmissions } from "@/context/SubmissionsContext";
import { toast } from "sonner";
import { users } from "@/lib/mock-data";
import { uploadMediaFile } from "@/lib/media-upload";

const UserProfile = () => {
  const currentUser = users[0]; // Mock current user
  const { games } = useGames();
  const { addSubmission, getPlayerSubmissions } = useSubmissions();

  const [selectedGame, setSelectedGame] = useState<string>("");
  const [screenshot, setScreenshot] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const soloGames = games.filter((g) => g.game_modes?.includes("solo"));
  const submissions = getPlayerSubmissions(currentUser.id);
  const pendingSubmissions = submissions.filter((s) => s.status === "pending");
  const approvedSubmissions = submissions.filter((s) => s.status === "approved");

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadMediaFile(file, "submissions");
      setScreenshot(url);
      toast.success("Screenshot uploaded");
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedGame || !screenshot || !comment.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    const game = games.find((g) => g.id === selectedGame);

    try {
      addSubmission({
        player_id: currentUser.id,
        player_name: currentUser.name,
        game_id: selectedGame,
        game_name: game?.name || "",
        screenshot_url: screenshot,
        comment: comment.trim(),
        status: "pending",
      });

      toast.success("Proof submitted! Admin will review soon");
      setSelectedGame("");
      setScreenshot("");
      setComment("");
    } catch (error) {
      toast.error("Failed to submit proof");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Profile Section */}
      <section className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="relative h-full flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 border-4 border-white/10">
            <span className="text-3xl font-bold">{currentUser.name[0]}</span>
          </div>
          <h1 className="text-4xl font-display font-bold mb-2">{currentUser.name}</h1>
          <p className="text-muted-foreground">Solo Player & Team Member</p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="container -mt-8 relative z-10 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-white/10 text-center">
            <Trophy size={20} className="mx-auto text-amber-400 mb-2" />
            <div className="text-2xl font-bold">{currentUser.solo_rating || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Solo Rating</div>
          </Card>
          <Card className="p-4 border-white/10 text-center">
            <Zap size={20} className="mx-auto text-blue-400 mb-2" />
            <div className="text-2xl font-bold">{approvedSubmissions.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Approved Proofs</div>
          </Card>
          <Card className="p-4 border-white/10 text-center">
            <Clock size={20} className="mx-auto text-yellow-400 mb-2" />
            <div className="text-2xl font-bold">{pendingSubmissions.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Pending Review</div>
          </Card>
          <Card className="p-4 border-white/10 text-center">
            <Star size={20} className="mx-auto text-purple-400 mb-2" />
            <div className="text-2xl font-bold">{submissions.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Submissions</div>
          </Card>
        </div>
      </section>

      {/* Ranks Section */}
      <section className="container mb-12">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Team Rank */}
          <Card className="p-6 border-white/10">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-amber-400" />
              Team Rank
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{currentUser.rating}</div>
                <div className="text-muted-foreground text-sm">Rating Points</div>
              </div>
              <RankBadge tier={currentUser.rank_tier} />
            </div>
            <Button className="w-full mt-4" variant="outline" asChild>
              <Link to="/rankings">View Team Rankings</Link>
            </Button>
          </Card>

          {/* Solo Rank */}
          <Card className="p-6 border-white/10">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <Star size={20} className="text-purple-400" />
              Solo Rank
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{currentUser.solo_rating || 0}</div>
                <div className="text-muted-foreground text-sm">Solo Rating Points</div>
              </div>
              <RankBadge tier={currentUser.solo_tier || "Bronze"} />
            </div>
            <Button className="w-full mt-4" variant="outline" asChild>
              <Link to="/rankings?type=solo">View Solo Rankings</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Tabs */}
      <section className="container mb-12">
        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
            <TabsTrigger value="submit">Submit Proof</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingSubmissions.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedSubmissions.length})</TabsTrigger>
          </TabsList>

          {/* Submit Tab */}
          <TabsContent value="submit" className="mt-6">
            <Card className="p-6 border-white/10">
              <h3 className="text-lg font-display font-bold mb-6">Submit Solo Game Proof</h3>

              <div className="space-y-6">
                {/* Game Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">Select Solo Game</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {soloGames.map((game) => (
                      <motion.button
                        key={game.id}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setSelectedGame(game.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedGame === game.id
                            ? "border-indigo-500 bg-indigo-500/20"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        {game.logo_url && (
                          <img
                            src={game.logo_url}
                            alt={game.name}
                            className="w-full h-12 object-cover rounded mb-2"
                          />
                        )}
                        <div className="text-xs font-medium">{game.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-sm font-medium mb-3">Game Screenshot</label>
                  {screenshot ? (
                    <div className="relative rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={screenshot}
                        alt="Screenshot preview"
                        className="w-full h-64 object-cover"
                      />
                      <button
                        onClick={() => setScreenshot("")}
                        className="absolute top-2 right-2 p-2 bg-rose-600 hover:bg-rose-700 rounded-full transition-colors"
                      >
                        <XCircle size={16} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg hover:border-indigo-500/50 transition-colors cursor-pointer bg-white/[0.02]">
                      <div className="text-center">
                        <Upload size={24} className="mx-auto text-white/40 mb-2" />
                        <span className="text-sm text-white/40">Click to upload screenshot</span>
                        <span className="text-xs text-white/30 block mt-1">or from phone gallery</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium mb-3">Match Details / Comment</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe your solo match result, opponent, score, etc..."
                    className="bg-white/5 border-white/10 text-white min-h-32"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitProof}
                  disabled={isSubmitting || !selectedGame || !screenshot || !comment.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? "Submitting..." : "Submit Proof for Review"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {pendingSubmissions.length > 0 ? (
                pendingSubmissions.map((submission) => (
                  <Card key={submission.id} className="p-4 border-yellow-500/20 bg-yellow-500/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={16} className="text-yellow-400" />
                          <span className="font-medium">{submission.game_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{submission.comment}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                        Pending Review
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 border-white/10 text-center">
                  <Clock size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No pending submissions</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved" className="mt-6">
            <div className="space-y-4">
              {approvedSubmissions.length > 0 ? (
                approvedSubmissions.map((submission) => (
                  <Card key={submission.id} className="p-4 border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span className="font-medium">{submission.game_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(submission.reviewed_at || "").toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{submission.comment}</p>
                        {submission.points_gained && (
                          <div className="mt-2 flex gap-4 text-xs">
                            <span className="text-emerald-400">
                              +{submission.points_gained} points
                            </span>
                            {submission.rank_after && (
                              <span className="text-blue-400">Rank: {submission.rank_after}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                        Approved
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 border-white/10 text-center">
                  <CheckCircle2 size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No approved submissions yet</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default UserProfile;
