const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("bt-token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error("Server returned an invalid response. Please try again.");
  }
  if (!res.ok) {
    const err: any = new Error(data.error || "Request failed");
    err.code = data.code;
    throw err;
  }
  return data;
}

export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}

export { API_URL };
