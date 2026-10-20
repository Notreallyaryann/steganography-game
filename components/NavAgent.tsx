"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredUsername } from "@/lib/game/user";

export default function NavAgent() {
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    setHandle(getStoredUsername());
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string | null>;
      setHandle(custom.detail);
    };
    window.addEventListener("agent-handle-changed", handler);
    return () => window.removeEventListener("agent-handle-changed", handler);
  }, []);

  if (!handle) {
    return (
      <Link href="/leaderboard" className="nav-claim-link">
        Claim Handle
      </Link>
    );
  }

  return (
    <Link href="/leaderboard" className="nav-agent-tag" title="View your standing on the leaderboard">
      <span className="dot">●</span> @{handle}
    </Link>
  );
}
