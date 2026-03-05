import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  clearMessageNotificationsForConversation,
  getChatTypingStates,
  getConversation,
  getConversationPage,
  getCurrentUser,
  getUserPresenceMap,
  markConversationRead,
  markUserOffline,
  markUserOnline,
  searchAccounts,
  searchConversationMessages,
  sendDirectMessage,
  setChatTypingState,
} from "@/lib/storage";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";
import { requestRemoteSyncNow } from "@/lib/remote-sync";
import { searchUsersRemote } from "@/lib/users-api";
import { toast } from "sonner";

const Messages = () => {
  useRealtimeRefresh({
    keys: ["arenax_direct_messages", "arenax_user_accounts", "arenax_user_presence", "arenax_chat_typing_state"],
    intervalMs: 250,
  });
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEmail = searchParams.get("with") || "";
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [page, setPage] = useState(1);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const typingStopTimer = useRef<number | null>(null);

  const localUsers = useMemo(() => searchAccounts(search, currentUser.email), [search, currentUser.email]);
  const users = useMemo(() => {
    const map = new Map<string, any>();
    [...localUsers, ...remoteUsers].forEach((item) => {
      if (!item?.email) return;
      map.set(item.email.toLowerCase(), {
        ...item,
        email: item.email.toLowerCase(),
      });
    });
    return Array.from(map.values());
  }, [localUsers, remoteUsers]);

  const selectedUser =
    users.find((u) => u.email === selectedEmail) ||
    searchAccounts("", currentUser.email).find((u) => u.email === selectedEmail);

  const conversation = selectedEmail ? getConversation(currentUser.email, selectedEmail) : [];
  const pagedConversation = selectedEmail
    ? getConversationPage(currentUser.email, selectedEmail, page, 30)
    : [];
  const filteredConversation = chatSearch.trim()
    ? searchConversationMessages(currentUser.email, selectedEmail, chatSearch)
    : pagedConversation;

  const presenceMap = getUserPresenceMap();
  const typingStates = selectedEmail
    ? getChatTypingStates([currentUser.email.trim().toLowerCase(), selectedEmail.trim().toLowerCase()].sort().join("__"))
    : [];
  const otherTyping = typingStates.find(
    (item) => item.sender_email.toLowerCase() !== currentUser.email.toLowerCase()
  );

  useEffect(() => {
    if (!selectedEmail || currentUser.is_guest) return;
    clearMessageNotificationsForConversation(currentUser.email, selectedEmail);
    markConversationRead(currentUser.email, selectedEmail);
    requestRemoteSyncNow({ push: true, pull: true });
  }, [selectedEmail, currentUser.email, currentUser.is_guest]);

  useEffect(() => {
    if (!selectedEmail) return;
    setPage(1);
    setChatSearch("");
  }, [selectedEmail]);

  useEffect(() => {
    if (currentUser.is_guest) return;

    markUserOnline(currentUser.email);
    requestRemoteSyncNow({ push: true, pull: false });

    const heartbeat = window.setInterval(() => {
      markUserOnline(currentUser.email);
      requestRemoteSyncNow({ push: true, pull: false });
    }, 10000);

    const onBeforeUnload = () => {
      markUserOffline(currentUser.email);
      requestRemoteSyncNow({ push: true, pull: false });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("beforeunload", onBeforeUnload);
      markUserOffline(currentUser.email);
      requestRemoteSyncNow({ push: true, pull: false });
    };
  }, [currentUser.email, currentUser.is_guest]);

  useEffect(() => {
    if (currentUser.is_guest) return;

    requestRemoteSyncNow({ pull: true, push: false });
    const timer = window.setInterval(() => {
      requestRemoteSyncNow({ pull: true, push: false });
    }, 300);

    return () => window.clearInterval(timer);
  }, [currentUser.is_guest, selectedEmail]);

  useEffect(() => {
    const keyword = search.trim();
    if (keyword.length < 2) {
      setRemoteUsers([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const found = await searchUsersRemote(keyword);
        setRemoteUsers(
          found.filter((item) => item.email?.toLowerCase() !== currentUser.email.toLowerCase())
        );
      } catch {
        setRemoteUsers([]);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [search, currentUser.email]);

  if (currentUser.is_guest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 border-white/10 max-w-md w-full text-center">
          <p className="text-white/70">Login required to use messages.</p>
        </Card>
      </div>
    );
  }

  const onInputChange = (value: string) => {
    setMessage(value);
    if (!selectedEmail) return;

    setChatTypingState({
      userEmail: currentUser.email,
      userName: currentUser.name,
      peerEmail: selectedEmail,
      isTyping: value.trim().length > 0,
    });
    requestRemoteSyncNow({ push: true, pull: false });

    if (typingStopTimer.current) window.clearTimeout(typingStopTimer.current);
    typingStopTimer.current = window.setTimeout(() => {
      setChatTypingState({
        userEmail: currentUser.email,
        userName: currentUser.name,
        peerEmail: selectedEmail,
        isTyping: false,
      });
      requestRemoteSyncNow({ push: true, pull: false });
    }, 1800);
  };

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
      setChatTypingState({
        userEmail: currentUser.email,
        userName: currentUser.name,
        peerEmail: selectedEmail,
        isTyping: false,
      });
      markConversationRead(currentUser.email, selectedEmail);
      requestRemoteSyncNow({ push: true, pull: true });
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
            placeholder="Search username, handle or email (min 2 chars)"
            className="bg-slate-900 border-white/10"
          />
          <div className="mt-3 space-y-2 max-h-[60vh] overflow-auto">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSearchParams({ with: user.email })}
                className={`w-full text-left p-3 rounded-lg border ${
                  selectedEmail === user.email
                    ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-white/10 inline-flex items-center justify-center text-xs">
                      {(user.full_name || "U")[0]}
                    </span>
                  )}
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span>{user.full_name}</span>
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          presenceMap[user.email?.toLowerCase()]?.online ? "bg-emerald-400" : "bg-white/30"
                        }`}
                      />
                    </p>
                    <p className="text-xs text-white/60">
                      {user.handle ? `@${user.handle} • ` : ""}
                      {user.email}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-4 border-white/10 bg-[#0a0a12]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-bold">
              {selectedUser ? `Chat with ${selectedUser.full_name}` : "Select a user to start chatting"}
            </h2>
            {selectedUser ? (
              <span className="text-xs font-mono text-white/60">
                {presenceMap[selectedUser.email?.toLowerCase()]?.online
                  ? "Online"
                  : `Last seen ${
                      presenceMap[selectedUser.email?.toLowerCase()]?.last_seen
                        ? new Date(
                            presenceMap[selectedUser.email?.toLowerCase()].last_seen
                          ).toLocaleTimeString()
                        : "unknown"
                    }`}
              </span>
            ) : null}
          </div>

          <Input
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            placeholder="Search in messages..."
            className="bg-slate-900 border-white/10 mb-3"
          />

          <div className="h-[55vh] overflow-auto space-y-2 border border-white/10 rounded-lg p-3 bg-black/20">
            {!chatSearch.trim() && conversation.length > pagedConversation.length ? (
              <div className="pb-2">
                <button
                  onClick={() => setPage((n) => n + 1)}
                  className="text-xs font-mono text-cyan-300 hover:text-cyan-200"
                >
                  Load older messages
                </button>
              </div>
            ) : null}

            {filteredConversation.map((item) => {
              const mine = item.sender_email.toLowerCase() === currentUser.email.toLowerCase();
              const isReadByPeer =
                mine && Array.isArray(item.read_by) && item.read_by.includes(selectedEmail.toLowerCase());
              const content = chatSearch.trim()
                ? item.message.replace(
                    new RegExp(`(${chatSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"),
                    "[$1]"
                  )
                : item.message;

              return (
                <div
                  key={item.id}
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    mine
                      ? "ml-auto bg-fuchsia-500/20 border border-fuchsia-400/30"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{content}</p>
                  <p className="text-[10px] text-white/50 mt-1 flex items-center justify-between gap-2">
                    <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                    {mine ? <span>{isReadByPeer ? "Read" : "Delivered"}</span> : null}
                  </p>
                </div>
              );
            })}

            {otherTyping ? (
              <div className="max-w-[70%] rounded-lg px-3 py-2 bg-white/5 border border-white/10">
                <p className="text-xs text-white/70">{otherTyping.sender_name} is typing...</p>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={message}
              onChange={(e) => onInputChange(e.target.value)}
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
