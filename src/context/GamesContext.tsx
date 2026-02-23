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

export const GamesProvider = ({ children }: { children: ReactNode }) => {
  const [games, setGames] = useState<Game[]>([]);

  // Initialize games from localStorage if available, otherwise use mock data
  useEffect(() => {
    const savedGames = localStorage.getItem("arenax_games");
    if (savedGames) {
      try {
        setGames(JSON.parse(savedGames));
      } catch {
        setGames(initialGames as Game[]);
      }
    } else {
      setGames(initialGames as Game[]);
    }
  }, []);

  // Save games to localStorage whenever they change
  useEffect(() => {
    // Persist even when empty so deletions remain after reload.
    localStorage.setItem("arenax_games", JSON.stringify(games));
    markKeyDirty("arenax_games");
  }, [games]);

  useEffect(() => {
    const syncGames = () => {
      const savedGames = localStorage.getItem("arenax_games");
      if (!savedGames) return;
      try {
        setGames(JSON.parse(savedGames));
      } catch {
        // keep current state on parse failure
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "arenax_games") syncGames();
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

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
