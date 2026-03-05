import { apiGet } from "@/lib/api";

export interface RemoteUserSearchResult {
  id: string;
  full_name: string;
  handle?: string;
  email: string;
  avatar_url?: string;
  online?: boolean;
  last_seen?: string;
}

export async function searchUsersRemote(query: string) {
  const keyword = query.trim();
  if (keyword.length < 2) return [];
  const encoded = encodeURIComponent(keyword);
  return apiGet<{ users: RemoteUserSearchResult[] }>(`/users/search?q=${encoded}`).then((row) =>
    Array.isArray(row?.users) ? row.users : []
  );
}

