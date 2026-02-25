import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Reusable query wrapper for ArenaX real-time storage sync.
// It listens to global sync events and invalidates the target query key.
export function useRealtimeQuery(queryKey, queryFn, options = {}) {
  const queryClient = useQueryClient();
  const watchKeys = options.watchKeys || [];

  const query = useQuery({
    queryKey,
    queryFn,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    ...options,
  });

  useEffect(() => {
    const onDataChanged = (event) => {
      const key = event?.detail?.key;
      if (!watchKeys.length || !key || watchKeys.includes(key) || key === "remote_sync") {
        queryClient.invalidateQueries({ queryKey });
      }
    };
    const onStorage = (event) => {
      if (!watchKeys.length || !event?.key || watchKeys.includes(event.key)) {
        queryClient.invalidateQueries({ queryKey });
      }
    };
    const onFocus = () => queryClient.invalidateQueries({ queryKey });

    window.addEventListener("arenax:data-changed", onDataChanged);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("arenax:data-changed", onDataChanged);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [queryClient, JSON.stringify(queryKey), JSON.stringify(watchKeys)]);

  return query;
}

