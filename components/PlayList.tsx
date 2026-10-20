"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MISSIONS } from "@/lib/game/missions";
import { loadProgress, type ProgressMap } from "@/lib/game/progress";

export default function PlayList() {
  const [prog, setProg] = useState<ProgressMap>({});
  useEffect(() => setProg(loadProgress()), []);
  const total = Object.values(prog).reduce((a, p) => a + (p.solved?.score ?? 0), 0);

  return (
    <>
      <p className="meta">Total score: {total}</p>
      <ol className="dossier">
        {MISSIONS.map((m) => {
          const p = prog[m.id];
          return (
            <li key={m.id}>
              <Link href={`/play/${m.id}`}>
                <span className="ord">{m.order}</span>
                <span className="what">
                  <strong>{m.title}</strong>
                  <span>{m.skill}</span>
                </span>
                <span className={p?.solved ? "state done" : "state"}>
                  {p?.solved ? `Solved, ${p.solved.score}` : p ? "In progress" : "Not started"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
