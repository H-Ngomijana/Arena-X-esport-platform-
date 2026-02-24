import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { games as initialGames } from "@/lib/mock-data";
import { markKeyDirty } from "@/lib/remote-sync";

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  player_count: number;
  tournament_count: number;
  theme: { primary: string; secondary: string; accent: string };
  theme_config?: { gradient_from: string; gradient_to: string };
  logo_url?: string;
  banner_url?: string;
  background_url?: string;
  is_active?: boolean;
  game_modes?: ("team" | "solo")[];
}

interface GamesContextType {
  games: Game[];
  updateGame: (id: string, updates: Partial<Game>) => void;
  createGame: (game: Game) => void;
  deleteGame: (id: string) => void;
  getGameBySlug: (slug: string) => Game | undefined;
  getGameById: (id: string) => Game | undefined;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

const GAMES_KEY = "arenax_games";
const syncApiConfigured = Boolean((import.meta.env.VITE_SYNC_API_BASE_URL || "").trim());

function readStoredGames(): Game[] | null {
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Game[]) : null;
  } catch {
    return null;
  }
}

export const GamesProvider = ({ children }: { children: ReactNode }) => {
  const [games, setGames] = useState<Game[]>(() => {
    const stored = readStoredGames();
    if (stored) return stored;
    // In synced environments, avoid seeding static defaults before remote hydration.
    if (syncApiConfigured) return [];
    return initialGames as Game[];
  });

  // Re-hydrate from localStorage on mount and whenever sync writes in the same tab.
  useEffect(() => {
    const syncGames = () => {
      const stored = readStoredGames();
      if (stored) {
        setGames(stored);
        return;
      }
      if (!syncApiConfigured) {
        setGames(initialGames as Game[]);
      }
    };

    syncGames();

    const onStorage = (event: StorageEvent) => {
      if (event.key === GAMES_KEY || event.key === null) syncGames();
    };

    const onDataChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key || detail.key === "remote_sync" || detail.key === GAMES_KEY) {
        syncGames();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("arenax:data-changed", onDataChanged as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("arenax:data-changed", onDataChanged as EventListener);
    };
  }, []);

  // Save games to localStorage whenever they change
  useEffect(() => {
    // In synced environments, avoid writing empty defaults before first hydration.
    if (syncApiConfigured && games.length === 0 && localStorage.getItem(GAMES_KEY) === null) {
      return;
    }
    // Persist even when empty so intentional deletions remain after reload.
    localStorage.setItem(GAMES_KEY, JSON.stringify(games));
    markKeyDirty("arenax_games");

    window.dispatchEvent(
      new CustomEvent("arenax:data-changed", {
        detail: { key: GAMES_KEY, at: new Date().toISOString() },
      })
    );
  }, [games]);

  const updateGame = (id: string, updates: Partial<Game>) => {
    setGames((prevGames) =>
      prevGames.map((game) =>
        game.id === id ? { ...game, ...updates } : game
      )
    );
  };

  const createGame = (game: Game) => {
    setGames((prevGames) => [...prevGames, game]);
  };

  const deleteGame = (id: string) => {
    setGames((prevGames) => prevGames.filter((game) => game.id !== id));
  };

  const getGameBySlug = (slug: string) => {
    return games.find((game) => game.slug === slug);
  };

  const getGameById = (id: string) => {
    return games.find((game) => game.id === id);
  };

  return (
    <GamesContext.Provider
      value={{
        games,
        updateGame,
        createGame,
        deleteGame,
        getGameBySlug,
        getGameById,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
};

export const useGames = () => {
  const context = useContext(GamesContext);
  if (!context) {
    throw new Error("useGames must be used within a GamesProvider");
  }
  return context;
};
