/** Client-side username / agent handle persistence (localStorage) */

const USER_KEY = "stegame:agent_handle";

export function getStoredUsername(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export function setStoredUsername(username: string): void {
  if (typeof window === "undefined") return;
  try {
    const clean = username.trim().toLowerCase();
    localStorage.setItem(USER_KEY, clean);
    window.dispatchEvent(new CustomEvent("agent-handle-changed", { detail: clean }));
  } catch {
    /* storage unavailable */
  }
}

export function clearStoredUsername(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new CustomEvent("agent-handle-changed", { detail: null }));
  } catch {
    /* storage unavailable */
  }
}
