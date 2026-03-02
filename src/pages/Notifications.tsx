import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Swords, AlertTriangle, Bell, Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getAnnouncements,
  getCurrentUser,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/storage";

interface Notification {
  id: string;
  type: "tournament" | "match" | "dispute" | "system" | "announcement" | "tournament_update";
  title: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  link: string;
}

const formatTimeAgo = (iso: string) => {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(deltaMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const Notifications = () => {
  const currentUser = getCurrentUser();
  const dynamicUserNotifications = useMemo(
    () =>
      getUserNotifications(currentUser.email).map((item) => ({
        id: item.id,
        type: item.type === "tournament_update" ? "tournament_update" : "system",
        title: item.title,
        message: item.message,
        timestamp: formatTimeAgo(item.created_at),
        is_read: item.read,
        link: item.link || "/notifications",
      })),
    [currentUser.email]
  );

  const announcementNotifications = useMemo<Notification[]>(
    () =>
      getAnnouncements().map((item) => ({
        id: `a_${item.id}`,
        type: "announcement",
        title: `[${item.type.toUpperCase()}] ${item.title}`,
        message: item.message,
        timestamp: formatTimeAgo(item.created_at),
        is_read: false,
        link: "/notifications",
      })),
    []
  );

  const [notifications, setNotifications] = useState<Notification[]>([
    ...dynamicUserNotifications,
    ...announcementNotifications,
  ]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "tournament":
        return <Trophy size={20} className="text-amber-400" />;
      case "match":
        return <Swords size={20} className="text-blue-400" />;
      case "dispute":
        return <AlertTriangle size={20} className="text-rose-400" />;
      case "announcement":
        return <Megaphone size={20} className="text-emerald-400" />;
      case "tournament_update":
        return <Trophy size={20} className="text-emerald-300" />;
      case "system":
      default:
        return <Bell size={20} className="text-primary" />;
    }
  };

  const markAsRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    markAllNotificationsAsRead(currentUser.email);
    setNotifications((prev) => prev.filter((n) => n.type === "announcement"));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </motion.div>

        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notif, index) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  markAsRead(notif.id);
                  if (notif.link && notif.link !== "/notifications") {
                    window.location.href = notif.link;
                  }
                }}
                className={`p-4 rounded-lg border transition-all cursor-pointer group ${
                  notif.is_read
                    ? "border-white/10 hover:border-white/20 bg-white/[0.02]"
                    : "border-primary/50 bg-primary/10 hover:bg-primary/15"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors flex-shrink-0 mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">{notif.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">{notif.timestamp}</p>
                  </div>
                  {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </div>
              </motion.div>
            ))
          ) : (
            <Card className="p-12 border-white/10 text-center">
              <Bell className="mx-auto text-muted-foreground mb-3" size={24} />
              <p className="text-muted-foreground">No notifications yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
