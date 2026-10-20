"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { PublicMission } from "@/lib/game/missions";
import { computeScore, TIER_POINTS } from "@/lib/game/scoring";
import { loadProgress, saveProgress, type MissionProgress, type ProgressMap } from "@/lib/game/progress";
import { loadImageUrl, type Pixels } from "@/lib/stego/image";
import type { Channel, Direction } from "@/lib/stego/lsb";
import BitPlaneViewer from "./BitPlaneViewer";
import Extractor from "./Extractor";
import Decoder from "./Decoder";
import AgentHandle from "./AgentHandle";
import { getStoredUsername } from "@/lib/game/user";

function fmt(sec: number): string {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export default function MissionClient({ mission }: { mission: PublicMission }) {
  const [img, setImg] = useState<Pixels | null>(null);
  const [loadError, setLoadError] = useState("");
  const [prog, setProg] = useState<MissionProgress | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [payload, setPayload] = useState<Uint8Array | null>(null);
  const [tunedParams, setTunedParams] = useState<{
    plane: number;
    channels: Channel[];
    direction?: Direction;
  } | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [myHandle, setMyHandle] = useState<string | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);

  useEffect(() => {
    setMyHandle(getStoredUsername());
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string | null>;
      setMyHandle(custom.detail);
    };
    window.addEventListener("agent-handle-changed", handler);
    return () => window.removeEventListener("agent-handle-changed", handler);
  }, []);



  const update = useCallback(
    (fn: (p: MissionProgress) => MissionProgress) => {
      setProg((cur) => {
        if (!cur) return cur;
        const next = fn(cur);
        const all: ProgressMap = loadProgress();
        all[mission.id] = next;
        saveProgress(all);
        return next;
      });
    },
    [mission.id]
  );

  // load image + progress, and re-fetch any hints already paid for
  useEffect(() => {
    loadImageUrl(mission.assetUrl).then(setImg, () => setLoadError("Could not load the evidence file."));
    const all = loadProgress();
    const p = all[mission.id] ?? { startedAt: Date.now(), wrong: 0, hintsUsed: 0 };
    all[mission.id] = p;
    saveProgress(all);
    setProg(p);
    (async () => {
      const got: string[] = [];
      for (let n = 0; n < p.hintsUsed; n++) {
        const r = await fetch(`/api/missions/${mission.id}/hint?n=${n}`);
        if (r.ok) got.push((await r.json()).text);
      }
      setHints(got);
    })();
  }, [mission.id, mission.assetUrl]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!prog) return <p className="note">Loading mission…</p>;

  const solved = prog.solved;
  const elapsed = Math.max(0, Math.floor((now - prog.startedAt) / 1000));
  const attemptsLeft = mission.maxAttempts - prog.wrong;
  const nextCost = mission.hintCosts[prog.hintsUsed];

  async function takeHint() {
    if (busy || nextCost === undefined) return;
    setBusy(true);
    const r = await fetch(`/api/missions/${mission.id}/hint?n=${prog!.hintsUsed}`);
    if (r.ok) {
      const { text } = await r.json();
      setHints((h) => [...h, text]);
      update((p) => ({ ...p, hintsUsed: p.hintsUsed + 1 }));
    }
    setBusy(false);
  }

  async function submit() {
    if (busy || !answer.trim() || attemptsLeft <= 0 || solved) return;
    setBusy(true);
    setFeedback("");
    try {
      const r = await fetch(`/api/missions/${mission.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (r.status === 429) {
        setFeedback("Too many tries in a short time. Wait a minute.");
      } else {
        const { correct } = await r.json();
        if (correct) {
          const score = computeScore({
            tier: mission.tier,
            elapsedSec: elapsed,
            parSec: mission.parTimeSec,
            hintsUsed: prog!.hintsUsed,
            hintCosts: mission.hintCosts,
            wrong: prog!.wrong,
          });
          update((p) => ({ ...p, solved: { score, at: Date.now() } }));

          const handle = getStoredUsername();
          if (handle) {
            saveScoreToDb(handle, score);
          }
        } else {
          update((p) => ({ ...p, wrong: p.wrong + 1 }));
          setFeedback("That is not it. Each wrong report costs 25 points.");
        }
      }
    } catch {
      setFeedback("Could not reach the server.");
    }
    setBusy(false);
  }

  async function saveScoreToDb(handle: string, score: number) {
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: handle,
          missionId: mission.id,
          score,
          elapsedSec: elapsed,
          hintsUsed: prog?.hintsUsed ?? 0,
        }),
      });
      if (res.ok) setScoreSaved(true);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mission">
      <p className="crumb">
        <Link href="/play">All missions</Link>
      </p>
      <h1>{mission.title}</h1>
      <p className="meta">
        {mission.skill}. Worth up to {Math.round(TIER_POINTS[mission.tier] * 1.5)} points.
        {solved ? "" : ` Time on file ${fmt(elapsed)} (par ${fmt(mission.parTimeSec)}).`}
      </p>

      <section className="panel">
        <h2>Briefing</h2>
        <p className="story">{mission.story}</p>
      </section>

      <section className="panel">
        <h2>Evidence</h2>
        {loadError && <p className="err">{loadError}</p>}
        {img ? (
          <BitPlaneViewer
            pixels={img.pixels}
            width={img.width}
            height={img.height}
            onAimExtractor={setTunedParams}
          />
        ) : (
          !loadError && <p className="note">Loading evidence…</p>
        )}
      </section>

      <section className="panel">
        <h2>Extractor</h2>
        {img && (
          <Extractor
            pixels={img.pixels}
            width={img.width}
            height={img.height}
            onSend={setPayload}
            presetParams={tunedParams}
          />
        )}
      </section>

      <section className="panel">
        <h2>Decoder</h2>
        <Decoder incoming={payload} />
      </section>

      <section className="panel report">
        <h2>Report</h2>
        {solved ? (
          <div className="solved">
            <p className="ok big">Mission complete: {solved.score} points.</p>
            {scoreSaved ? (
              <p className="ok">✓ Score recorded on the Global Leaderboard for Operative @{myHandle}!</p>
            ) : myHandle ? (
              <p className="note">Logged under Operative @{myHandle}</p>
            ) : (
              <div className="claim-prompt">
                <p className="note strong">Claim an operative username to post your score to the Global Leaderboard:</p>
                <AgentHandle onClaimed={(username) => saveScoreToDb(username, solved.score)} />
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
              <Link className="btn primary" href="/play">
                Back to missions
              </Link>
              <Link className="btn" href="/leaderboard">
                View Leaderboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="submit">
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Codeword"
                aria-label="Codeword"
                disabled={attemptsLeft <= 0}
              />
              <button type="button" className="btn primary" onClick={submit} disabled={busy || attemptsLeft <= 0}>
                Submit
              </button>
            </div>
            {feedback && <p className="err">{feedback}</p>}
            <p className="note">
              {attemptsLeft > 0 ? `${attemptsLeft} attempts left.` : "No attempts left on this mission."}
            </p>
            <div className="hints">
              {hints.map((h, i) => (
                <p key={i} className="hint">
                  Hint {i + 1}: {h}
                </p>
              ))}
              {nextCost !== undefined && (
                <button type="button" className="btn" onClick={takeHint} disabled={busy}>
                  Reveal hint {prog.hintsUsed + 1} (costs {nextCost} points)
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
