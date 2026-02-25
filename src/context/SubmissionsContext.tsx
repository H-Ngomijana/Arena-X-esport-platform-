import React, { createContext, useContext, useState, useEffect } from "react";
import { markKeyDirty } from "@/lib/remote-sync";

export interface Submission {
  id: string;
  player_id: string;
  player_name: string;
  game_id: string;
  game_name: string;
  screenshot_url: string;
  comment: string;
  status: "pending" | "approved" | "rejected";
  points_gained?: number;
  rank_before?: number;
  rank_after?: number;
  created_at: string;
  reviewed_at?: string;
  admin_notes?: string;
}

interface SubmissionsContextType {
  submissions: Submission[];
  addSubmission: (submission: Omit<Submission, "id" | "created_at">) => void;
  updateSubmissionStatus: (
    id: string,
    status: "approved" | "rejected",
    pointsGained?: number,
    rankAfter?: number,
    adminNotes?: string
  ) => void;
  deleteSubmission: (id: string) => void;
  getPlayerSubmissions: (playerId: string) => Submission[];
  getPendingSubmissions: () => Submission[];
}

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(
  undefined
);

export const SubmissionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loaded, setLoaded] = useState(false);
  const syncApiConfigured = Boolean((import.meta.env.VITE_SYNC_API_BASE_URL || "").trim());

  // Load from localStorage on mount
  useEffect(() => {
    const storedSubmissions = localStorage.getItem("submissions");
    if (storedSubmissions) {
      try {
        setSubmissions(JSON.parse(storedSubmissions));
      } catch (err) {
        console.error("Failed to load submissions from localStorage", err);
      }
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage whenever submissions change
  useEffect(() => {
    if (!loaded) return;
    if (syncApiConfigured && submissions.length === 0 && localStorage.getItem("submissions") === null) {
      return;
    }
    localStorage.setItem("submissions", JSON.stringify(submissions));
    markKeyDirty("submissions");
  }, [submissions, loaded, syncApiConfigured]);

  const addSubmission = (
    submission: Omit<Submission, "id" | "created_at">
  ) => {
    const newSubmission: Submission = {
      ...submission,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    setSubmissions((prev) => [...prev, newSubmission]);
  };

  const updateSubmissionStatus = (
    id: string,
    status: "approved" | "rejected",
    pointsGained?: number,
    rankAfter?: number,
    adminNotes?: string
  ) => {
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === id
          ? {
              ...sub,
              status,
              points_gained: pointsGained,
              rank_after: rankAfter,
              admin_notes: adminNotes,
              reviewed_at: new Date().toISOString(),
            }
          : sub
      )
    );
  };

  const deleteSubmission = (id: string) => {
    setSubmissions((prev) => prev.filter((sub) => sub.id !== id));
  };

  const getPlayerSubmissions = (playerId: string) => {
    return submissions.filter((sub) => sub.player_id === playerId);
  };

  const getPendingSubmissions = () => {
    return submissions.filter((sub) => sub.status === "pending");
  };

  return (
    <SubmissionsContext.Provider
      value={{
        submissions,
        addSubmission,
        updateSubmissionStatus,
        deleteSubmission,
        getPlayerSubmissions,
        getPendingSubmissions,
      }}
    >
      {children}
    </SubmissionsContext.Provider>
  );
};

export const useSubmissions = () => {
  const context = useContext(SubmissionsContext);
  if (!context) {
    throw new Error(
      "useSubmissions must be used within SubmissionsProvider"
    );
  }
  return context;
};
