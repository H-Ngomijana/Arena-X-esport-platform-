import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addMatchChatMessage, getCurrentUser, getMatchChatMessages, getMatches, getTeams, getUserTeam } from "@/lib/storage";
import { toast } from "sonner";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";

const MatchRoom = () => {
  useRealtimeRefresh({
    keys: ["matches", "teams", "arenax_match_chat_messages"],
    intervalMs: 2000,
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const id = searchParams.get("id") || "";
  const allMatches = getMatches();
  const allTeams = getTeams();
  const match = allMatches.find((item) => item.id === id);
  const teamA = allTeams.find((team) => team.id === match?.team_a_id);
  const teamB = allTeams.find((team) => team.id === match?.team_b_id);

  const myTeam = currentUser.is_guest ? null : getUserTeam(currentUser.email);
  const userTeamId = myTeam?.id || "";

  const participantEmails = useMemo(() => {
    if (!match) return [];
    const byParticipants = Array.isArray(match.participants)
      ? match.participants.map((participant: any) => String(participant.email || "").toLowerCase()).filter(Boolean)
      : [];
    if (byParticipants.length) return byParticipants;
    const fromTeams = [
      ...(teamA?.members || []),
      ...(teamB?.members || []),
    ].map((item: string) => item.toLowerCase());
    return Array.from(new Set(fromTeams));
  }, [match, teamA?.members, teamB?.members]);

  const canAccess = Boolean(!currentUser.is_guest && participantEmails.includes(currentUser.email.toLowerCase()));
  const [messageInput, setMessageInput] = useState("");
  const [activeChatTab, setActiveChatTab] = useState<"team" | "global">("team");

  const allMessages = useMemo(() => getMatchChatMessages(id), [id]);
  const visibleMessages = useMemo(
    () =>
      allMessages.filter((message) => {
        if (message.scope === "global" || message.scope === "admin") return true;
        return message.scope === "team" && message.team_id === userTeamId;
      }),
    [allMessages, userTeamId]
  );

  const handleSendMessage = () => {
    if (!match || !canAccess || !messageInput.trim()) return;
    try {
      addMatchChatMessage({
        match_id: match.id,
        sender_email: currentUser.email,
        sender_name: currentUser.name,
        message: messageInput,
        scope: activeChatTab === "global" ? "global" : "team",
        team_id: activeChatTab === "team" ? userTeamId : undefined,
      });
      setMessageInput("");
    } catch (error: any) {
      toast.error(error?.message || "Could not send message.");
    }
  };

  if (!match || !teamA || !teamB) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }

  if (currentUser.is_guest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 border-white/10 max-w-md w-full">
          <h2 className="text-xl font-black">Login Required</h2>
          <p className="text-sm text-white/60 mt-2">You must sign in to access match room chat.</p>
          <Button className="mt-4 w-full" onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}>
            Login / Sign Up
          </Button>
        </Card>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 border-white/10 max-w-md w-full">
          <h2 className="text-xl font-black">Restricted Match Room</h2>
          <p className="text-sm text-white/60 mt-2">
            This chat room is only available to participants assigned to this match.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
      <section className="container mb-6">
        <Card className="p-6 border-white/10">
          <h1 className="text-3xl font-black">{teamA.name} vs {teamB.name}</h1>
          <p className="text-sm text-white/60 mt-1">
            Status: {String(match.status || "").toUpperCase()} • Scheduled: {match.scheduled_time || match.scheduled_at || "TBD"}
          </p>
        </Card>
      </section>

      <section className="container grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 border-white/10 min-h-[420px]">
            <h2 className="text-lg font-bold mb-4">Match Room Chat</h2>
            <Tabs value={activeChatTab} onValueChange={(value) => setActiveChatTab(value as "team" | "global")}>
              <TabsList className="grid grid-cols-2 w-full bg-white/5 border border-white/10 mb-4">
                <TabsTrigger value="team">Team Channel</TabsTrigger>
                <TabsTrigger value="global">Global Channel</TabsTrigger>
              </TabsList>
              <TabsContent value="team" />
              <TabsContent value="global" />
            </Tabs>

            <div className="space-y-2 h-72 overflow-auto pr-1">
              {visibleMessages.length > 0 ? (
                visibleMessages.map((message) => (
                  <div key={message.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{message.sender_name}</span>
                      <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm mt-1">{message.message}</p>
                    <p className="text-[10px] mt-1 uppercase tracking-wider text-cyan-300">
                      {message.scope === "team" ? "Team only" : message.scope}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/60">No messages yet.</p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                placeholder={activeChatTab === "team" ? "Message your team..." : "Message all participants..."}
                className="bg-slate-900 border-white/10"
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSendMessage();
                }}
              />
              <Button onClick={handleSendMessage}>Send</Button>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6 border-white/10">
            <h3 className="font-bold mb-4">Participants</h3>
            <div className="space-y-2">
              {participantEmails.map((email) => (
                <div key={email} className="rounded border border-white/10 p-2 text-sm text-white/70">
                  {email}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default MatchRoom;
