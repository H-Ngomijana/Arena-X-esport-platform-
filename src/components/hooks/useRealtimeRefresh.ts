import { useEffect, useState } from "react";

type Options = {
  keys?: string[];
  intervalMs?: number;
};

export function useRealtimeRefresh(options: Options = {}) {
  const { keys = [], intervalMs = 0 } = options;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);

    const onDataChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      const key = detail?.key;
      if (!keys.length || !key || keys.includes(key) || key === "remote_sync") refresh();
    };

    const onStorage = (event: StorageEvent) => {
      if (!keys.length || !event.key || keys.includes(event.key)) refresh();
    };

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("arenax:data-changed", onDataChanged as EventListener);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    let timer: number | undefined;
    if (intervalMs > 0) {
      timer = window.setInterval(refresh, intervalMs);
    }

    return () => {
      window.removeEventListener("arenax:data-changed", onDataChanged as EventListener);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer) window.clearInterval(timer);
    };
  }, [intervalMs, JSON.stringify(keys)]);

  return tick;
}

