import React, { createContext, useContext, useState, useEffect } from "react";
import { markKeyDirty } from "@/lib/remote-sync";

export interface SoloRegistration {
  id: string;
  player_id: string;
  player_name: string;
  game_id: string;
  game_name: string;
  rank_tier: string;
  current_rating: number;
  status: "active" | "inactive";
  registered_at: string;
}

export interface TeamRegistration {
  id: string;
  team_id: string;
  team_name: string;
  game_id: string;
  game_name: string;
  captain_id: string;
  member_count: number;
  team_rating: number;
  status: "active" | "inactive";
  registered_at: string;
}

interface RegistrationsContextType {
  soloRegistrations: SoloRegistration[];
  teamRegistrations: TeamRegistration[];
  registerSolo: (registration: Omit<SoloRegistration, "id" | "registered_at">) => void;
  registerTeam: (registration: Omit<TeamRegistration, "id" | "registered_at">) => void;
  unregisterSolo: (id: string) => void;
  unregisterTeam: (id: string) => void;
  getPlayerSoloRegistration: (playerId: string, gameId: string) => SoloRegistration | undefined;
  getTeamRegistration: (teamId: string, gameId: string) => TeamRegistration | undefined;
  getGameSoloRegistrations: (gameId: string) => SoloRegistration[];
  getGameTeamRegistrations: (gameId: string) => TeamRegistration[];
}

const RegistrationsContext = createContext<RegistrationsContextType | undefined>(undefined);

export const RegistrationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [soloRegistrations, setSoloRegistrations] = useState<SoloRegistration[]>([]);
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>([]);
  const [loaded, setLoaded] = useState(false);
  const syncApiConfigured = Boolean((import.meta.env.VITE_SYNC_API_BASE_URL || "").trim());

  // Load from localStorage on mount
  useEffect(() => {
    const storedSolo = localStorage.getItem("solo_registrations");
    const storedTeam = localStorage.getItem("team_registrations");

    if (storedSolo) {
      try {
        setSoloRegistrations(JSON.parse(storedSolo));
      } catch (err) {
        console.error("Failed to load solo registrations", err);
      }
    }

    if (storedTeam) {
      try {
        setTeamRegistrations(JSON.parse(storedTeam));
      } catch (err) {
        console.error("Failed to load team registrations", err);
      }
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!loaded) return;
    if (syncApiConfigured && soloRegistrations.length === 0 && localStorage.getItem("solo_registrations") === null) {
      return;
    }
    localStorage.setItem("solo_registrations", JSON.stringify(soloRegistrations));
    markKeyDirty("solo_registrations");
  }, [soloRegistrations, loaded, syncApiConfigured]);

  useEffect(() => {
    if (!loaded) return;
    if (syncApiConfigured && teamRegistrations.length === 0 && localStorage.getItem("team_registrations") === null) {
      return;
    }
    localStorage.setItem("team_registrations", JSON.stringify(teamRegistrations));
    markKeyDirty("team_registrations");
  }, [teamRegistrations, loaded, syncApiConfigured]);

  const registerSolo = (registration: Omit<SoloRegistration, "id" | "registered_at">) => {
    const newRegistration: SoloRegistration = {
      ...registration,
      id: Date.now().toString(),
      registered_at: new Date().toISOString(),
    };
    setSoloRegistrations((prev) => [...prev, newRegistration]);
  };

  const registerTeam = (registration: Omit<TeamRegistration, "id" | "registered_at">) => {
    const newRegistration: TeamRegistration = {
      ...registration,
      id: Date.now().toString(),
      registered_at: new Date().toISOString(),
    };
    setTeamRegistrations((prev) => [...prev, newRegistration]);
  };

  const unregisterSolo = (id: string) => {
    setSoloRegistrations((prev) => prev.filter((reg) => reg.id !== id));
  };

  const unregisterTeam = (id: string) => {
    setTeamRegistrations((prev) => prev.filter((reg) => reg.id !== id));
  };

  const getPlayerSoloRegistration = (playerId: string, gameId: string) => {
    return soloRegistrations.find(
      (reg) => reg.player_id === playerId && reg.game_id === gameId && reg.status === "active"
    );
  };

  const getTeamRegistration = (teamId: string, gameId: string) => {
    return teamRegistrations.find(
      (reg) => reg.team_id === teamId && reg.game_id === gameId && reg.status === "active"
    );
  };

  const getGameSoloRegistrations = (gameId: string) => {
    return soloRegistrations.filter((reg) => reg.game_id === gameId && reg.status === "active");
  };

  const getGameTeamRegistrations = (gameId: string) => {
    return teamRegistrations.filter((reg) => reg.game_id === gameId && reg.status === "active");
  };

  return (
    <RegistrationsContext.Provider
      value={{
        soloRegistrations,
        teamRegistrations,
        registerSolo,
        registerTeam,
        unregisterSolo,
        unregisterTeam,
        getPlayerSoloRegistration,
        getTeamRegistration,
        getGameSoloRegistrations,
        getGameTeamRegistrations,
      }}
    >
      {children}
    </RegistrationsContext.Provider>
  );
};

export const useRegistrations = () => {
  const context = useContext(RegistrationsContext);
  if (!context) {
    throw new Error("useRegistrations must be used within RegistrationsProvider");
  }
  return context;
};
