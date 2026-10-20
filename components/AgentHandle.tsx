"use client";
import { useEffect, useState } from "react";
import { getStoredUsername, setStoredUsername, clearStoredUsername } from "@/lib/game/user";

interface Props {
  onClaimed?: (username: string) => void;
  compact?: boolean;
}

export default function AgentHandle({ onClaimed, compact }: Props) {
  const [handle, setHandle] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHandle(getStoredUsername());
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string | null>;
      setHandle(custom.detail);
    };
    window.addEventListener("agent-handle-changed", handler);
    return () => window.removeEventListener("agent-handle-changed", handler);
  }, []);

  // Debounced username availability check (350ms)
  useEffect(() => {
    const raw = input.trim().toLowerCase();
    if (!raw) {
      setStatus("idle");
      setStatusMsg("");
      return;
    }

    if (raw.length < 2) {
      setStatus("invalid");
      setStatusMsg("Minimum 2 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(raw)) {
      setStatus("invalid");
      setStatusMsg("Letters, numbers, _ and - only.");
      return;
    }

    setStatus("checking");
    setStatusMsg("Checking database…");

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/check?username=${encodeURIComponent(raw)}`);
        const data = await res.json();
        if (data.available) {
          setStatus("available");
          setStatusMsg("Username available ✓");
        } else {
          setStatus("taken");
          setStatusMsg(data.reason || "Username is already taken.");
        }
      } catch {
        setStatus("idle");
        setStatusMsg("Could not check availability.");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [input]);

  async function handleClaim(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const clean = input.trim().toLowerCase();
    if (!clean || status === "taken" || status === "invalid" || busy) return;

    setBusy(true);
    try {
      const res = await fetch("/api/users/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean }),
      });
      const data = await res.json();
      if (data.ok) {
        setStoredUsername(data.username);
        setHandle(data.username);
        setInput("");
        setIsEditing(false);
        if (onClaimed) onClaimed(data.username);
      } else {
        setStatus("taken");
        setStatusMsg(data.error || "Failed to claim.");
      }
    } catch {
      setStatusMsg("Network error.");
    }
    setBusy(false);
  }

  if (handle && !isEditing) {
    return (
      <div className={`agent-badge-wrap ${compact ? "compact" : ""}`}>
        <span className="agent-badge">
          <span className="agent-label">OPERATIVE:</span>
          <span className="agent-name">@{handle}</span>
        </span>
        <button
          type="button"
          className="agent-edit-btn"
          onClick={() => {
            setInput(handle);
            setIsEditing(true);
          }}
          title="Switch or change username"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className={`agent-claim-box ${compact ? "compact" : ""}`}>
      <form onSubmit={handleClaim} className="agent-form">
        <div className="agent-input-wrap">
          <span className="agent-at">@</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Choose unique username"
            maxLength={30}
            disabled={busy}
            autoFocus={isEditing}
            className={`agent-input ${status === "available" ? "ok" : status === "taken" ? "err" : ""}`}
          />
        </div>
        <button
          type="submit"
          className="btn primary agent-btn"
          disabled={busy || status !== "available"}
        >
          {busy ? "Claiming…" : "Claim"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn agent-cancel-btn"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </button>
        )}
      </form>

      {statusMsg && (
        <p className={`agent-status-msg ${status === "available" ? "ok" : status === "taken" || status === "invalid" ? "err" : "dim"}`}>
          {statusMsg}
        </p>
      )}
    </div>
  );
}
