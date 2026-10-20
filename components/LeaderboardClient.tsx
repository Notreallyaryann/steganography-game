"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AgentHandle from "@/components/AgentHandle";
import { getStoredUsername } from "@/lib/game/user";

interface Entry {
  rank: number;
  username: string;
  totalScore: number;
  missionsCompleted: number;
  lastActive: string;
}

function timeAgo(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "";
  }
}

export default function LeaderboardClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myHandle, setMyHandle] = useState<string | null>(null);

  useEffect(() => {
    setMyHandle(getStoredUsername());
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string | null>;
      setMyHandle(custom.detail);
    };
    window.addEventListener("agent-handle-changed", handler);
    return () => window.removeEventListener("agent-handle-changed", handler);
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setEntries(data.leaderboard ?? []);
    } catch {
      setError("Could not load the leaderboard from the database.");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main className="wrap">
      <p className="crumb">
        <Link href="/">Home</Link> / Leaderboard
      </p>

      <div className="lb-hero">
        <div>
          <h1>Global Operative Leaderboard</h1>
          <p className="lede">
            Verified cryptographic scores and mission progress tracked live via Neon PostgreSQL.
          </p>
        </div>
        <div className="lb-profile-box">
          <p className="note strong">Your Operative Profile</p>
          <AgentHandle onClaimed={() => loadData()} />
        </div>
      </div>

      <div className="lb-actions">
        <button type="button" className="btn" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh Rankings"}
        </button>
        <Link href="/play" className="btn primary">
          Play Missions
        </Link>
      </div>

      {error && <p className="err">{error}</p>}

      <section className="panel lb-panel">
        {loading && entries.length === 0 ? (
          <p className="note">Scanning operative database…</p>
        ) : entries.length === 0 ? (
          <div className="lb-empty">
            <p className="note strong">No classified scores logged yet.</p>
            <p className="note">
              Complete a mission in <Link href="/play">Missions</Link> and submit your codeword to claim the #1 spot!
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="lb-table">
              <thead>
                <tr>
                  <th style={{ width: "70px" }}>Rank</th>
                  <th>Operative</th>
                  <th style={{ textAlign: "right" }}>Total Score</th>
                  <th style={{ textAlign: "center" }}>Missions</th>
                  <th style={{ textAlign: "right" }}>Active</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((item) => {
                  const isMe = myHandle && item.username.toLowerCase() === myHandle.toLowerCase();
                  return (
                    <tr key={item.username} className={isMe ? "my-row" : ""}>
                      <td>
                        <span className={`rank-badge rank-${item.rank}`}>
                          {item.rank === 1 ? "🥇 #1" : item.rank === 2 ? "🥈 #2" : item.rank === 3 ? "🥉 #3" : `#${item.rank}`}
                        </span>
                      </td>
                      <td>
                        <span className="lb-username">
                          @{item.username}
                          {isMe && <span className="you-tag">YOU</span>}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 800 }} className="score-val">
                        {item.totalScore.toLocaleString()} pts
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="missions-val">{item.missionsCompleted} solved</span>
                      </td>
                      <td style={{ textAlign: "right" }} className="dim-time">
                        {timeAgo(item.lastActive)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
