import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Upload, Send, AlertTriangle, FileText, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import GlowButton from "@/components/GlowButton";
import { matches, teams, games } from "@/lib/mock-data";
import { useSubmissions } from "@/context/SubmissionsContext";
import { uploadMediaFile } from "@/lib/media-upload";

const MatchRoom = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ sender: string; message: string; timestamp: string }[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  const id = searchParams.get("id");
  const match = matches.find((m) => m.id === id);
  const teamA = teams.find((t) => t.id === match?.team_a_id);
  const teamB = teams.find((t) => t.id === match?.team_b_id);
  const game = games.find((g) => g.id === match?.game_id);

  const { addSubmission } = useSubmissions();

  const handleSubmitResult = (score: number) => {
    setSubmittedScore(score);
    // add a lightweight local submission record
    addSubmission({
      player_id: "system",
      player_name: "Match Submission",
      game_id: game?.id || "",
      game_name: game?.name || "",
      screenshot_url: screenshots[0] || "",
      comment: `Submitted score: ${score}`,
      status: "pending",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const urls = await Promise.all(Array.from(files).map((file) => uploadMediaFile(file, "match-room")));
      setScreenshots((prev) => [...prev, ...urls]);
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "You",
          message: messageInput,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setMessageInput("");
    }
  };

  if (!match || !teamA || !teamB) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
      {/* Header */}
      <section className="relative overflow-hidden mb-8">
        {game && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${game.theme_config?.gradient_from || "#6366f1"}, ${
                game.theme_config?.gradient_to || "#1e293b"
              })`,
            }}
          />
        )}
        <div className="relative container py-12 flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-8 mb-8">
            {teamA.logo_url && (
              <img src={teamA.logo_url} alt={teamA.name} className="w-20 h-20 rounded-xl" />
            )}
            <div>
              <div className="text-5xl font-black mb-2">
                {match.team_a_score ?? "0"} - {match.team_b_score ?? "0"}
              </div>
              <p className="text-muted-foreground">{teamA.name} vs {teamB.name}</p>
            </div>
            {teamB.logo_url && (
              <img src={teamB.logo_url} alt={teamB.name} className="w-20 h-20 rounded-xl" />
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                match.status === "live"
                  ? "bg-rose-500/20 text-rose-300 animate-pulse"
                  : match.status === "scheduled"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-amber-500/20 text-amber-300"
              }`}
            >
              {match.status?.toUpperCase()}
            </span>
            <span className="text-sm text-muted-foreground">{match.scheduled_at}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Result Submission */}
            {(match.status === "live" || match.status === "awaiting_results") && (
              <Card className="p-6 border-white/10">
                <h2 className="text-xl font-display font-bold mb-4">Submit Results</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <GlowButton className="w-full">Submit Results</GlowButton>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Match Results</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm mb-2 block">Your Team Score</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Enter score"
                          className="bg-slate-900 border-white/10"
                          onInput={(e) => setSubmittedScore(parseInt(e.currentTarget.value) || 0)}
                        />
                      </div>

                      <div>
                        <label className="text-sm mb-2 block">Screenshot Evidence</label>
                        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-white/20 rounded-lg hover:border-primary/50 transition-colors cursor-pointer bg-white/5">
                          <div className="text-center">
                            <Upload size={20} className="mx-auto text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground">Click to upload screenshots</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {screenshots.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {screenshots.map((shot, i) => (
                            <img
                              key={i}
                              src={shot}
                              alt={`Screenshot ${i}`}
                              className="w-full h-20 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}

                      <GlowButton
                        onClick={() => handleSubmitResult(submittedScore || 0)}
                        className="w-full"
                      >
                        Submit Result
                      </GlowButton>
                    </div>
                  </DialogContent>
                </Dialog>
              </Card>
            )}

            {/* Dispute Banner */}
            {match.status === "disputed" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 flex items-start gap-3"
              >
                <AlertTriangle size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-300 mb-1">Match Disputed</p>
                  <p className="text-xs text-rose-200 mb-3">Score mismatch between teams</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        File Dispute
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>File Dispute</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm mb-2 block">Reason</label>
                          <Textarea
                            placeholder="Explain the dispute..."
                            className="bg-slate-900 border-white/10"
                          />
                        </div>
                        <div>
                          <label className="text-sm mb-2 block">Evidence</label>
                          <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-primary/50">
                            <div className="text-center">
                              <Upload size={20} className="mx-auto text-muted-foreground mb-2" />
                              <p className="text-xs text-muted-foreground">Upload files</p>
                            </div>
                            <input type="file" multiple className="hidden" />
                          </label>
                        </div>
                        <GlowButton className="w-full">Submit Dispute</GlowButton>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>
            )}

            {/* Match Rules */}
            <Card className="p-6 border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <FileText size={20} className="text-primary" />
                <h2 className="text-xl font-display font-bold">Match Rules</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {game?.description || "Standard competitive rules apply"}
              </p>
            </Card>

            {/* Screenshot Gallery */}
            {screenshots.length > 0 && (
              <Card className="p-6 border-white/10">
                <h2 className="text-xl font-display font-bold mb-4">Screenshot Gallery</h2>
                <div className="grid grid-cols-3 gap-4">
                  {screenshots.map((shot, i) => (
                    <img
                      key={i}
                      src={shot}
                      alt={`Screenshot ${i}`}
                      className="w-full h-40 object-cover rounded-lg hover:opacity-80 transition-opacity"
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Sidebar (1/3) */}
          <div>
            {/* Chat Panel */}
            <Card className="p-4 border-white/10 flex flex-col h-96">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                <MessageCircle size={18} className="text-primary" />
                <h3 className="font-display font-bold">Match Chat</h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-hide">
                {messages.length > 0 ? (
                  messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-primary">{msg.sender}</span>
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{msg.message}</p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-xs text-muted-foreground mt-8">No messages yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="bg-slate-900 border-white/10 text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  className="px-2"
                >
                  <Send size={14} />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MatchRoom;
