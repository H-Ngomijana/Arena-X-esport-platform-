import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getConversation, getCurrentUser, searchAccounts, sendDirectMessage } from "@/lib/storage";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";
import { toast } from "sonner";

const Messages = () => {
  useRealtimeRefresh({ keys: ["arenax_direct_messages", "arenax_user_accounts"], intervalMs: 2000 });
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEmail = searchParams.get("with") || "";
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const users = useMemo(() => searchAccounts(search, currentUser.email), [search, currentUser.email]);
  const selectedUser = users.find((u) => u.email === selectedEmail) || searchAccounts("", currentUser.email).find((u) => u.email === selectedEmail);
  const conversation = selectedEmail ? getConversation(currentUser.email, selectedEmail) : [];

  if (currentUser.is_guest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 border-white/10 max-w-md w-full text-center">
          <p className="text-white/70">Login required to use messages.</p>
        </Card>
      </div>
    );
  }

  const onSend = () => {
    if (!selectedEmail) {
      toast.error("Select a user first.");
      return;
    }
    try {
      sendDirectMessage({
        sender_email: currentUser.email,
        sender_name: currentUser.name,
        receiver_email: selectedEmail,
        message,
      });
      setMessage("");
    } catch (error: any) {
      toast.error(error?.message || "Could not send message.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-20 pb-10">
      <div className="container grid lg:grid-cols-3 gap-5">
        <Card className="p-4 border-white/10 bg-[#0a0a12]">
          <h2 className="font-bold mb-3">Find Users</h2>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username or email"
            className="bg-slate-900 border-white/10"
          />
          <div className="mt-3 space-y-2 max-h-[60vh] overflow-auto">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSearchParams({ with: user.email })}
                className={`w-full text-left p-3 rounded-lg border ${selectedEmail === user.email ? "border-fuchsia-400/50 bg-fuchsia-500/10" : "border-white/10 bg-white/[0.02]"}`}
              >
                <p className="font-semibold">{user.full_name}</p>
                <p className="text-xs text-white/60">{user.handle ? `@${user.handle} • ` : ""}{user.email}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-4 border-white/10 bg-[#0a0a12]">
          <h2 className="font-bold mb-3">
            {selectedUser ? `Chat with ${selectedUser.full_name}` : "Select a user to start chatting"}
          </h2>
          <div className="h-[55vh] overflow-auto space-y-2 border border-white/10 rounded-lg p-3 bg-black/20">
            {conversation.map((item) => {
              const mine = item.sender_email.toLowerCase() === currentUser.email.toLowerCase();
              return (
                <div key={item.id} className={`max-w-[80%] rounded-lg px-3 py-2 ${mine ? "ml-auto bg-fuchsia-500/20 border border-fuchsia-400/30" : "bg-white/5 border border-white/10"}`}>
                  <p className="text-sm">{item.message}</p>
                  <p className="text-[10px] text-white/50 mt-1">{new Date(item.created_at).toLocaleTimeString()}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="bg-slate-900 border-white/10"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSend();
              }}
            />
            <Button onClick={onSend}>Send</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
