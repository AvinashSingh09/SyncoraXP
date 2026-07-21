const configuredApiOrigin = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

export const API_ORIGIN = configuredApiOrigin || window.location.origin;

export function backendUrl(path: string): string {
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(backendUrl(path), init);
}
