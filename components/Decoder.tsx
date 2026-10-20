"use client";
import { useEffect, useState } from "react";
import { fromBase64, fromHex, xorKey, gunzip, printable, toHex, asciiString } from "@/lib/stego/layers";

/** Peel layers off an extracted payload: base64, hex, XOR, gzip. */
export default function Decoder({ incoming }: { incoming: Uint8Array | null }) {
  const [buf, setBuf] = useState<Uint8Array | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (incoming) {
      setBuf(incoming);
      setLog(["Loaded extracted payload"]);
      setError("");
    }
  }, [incoming]);

  async function apply(label: string, fn: (b: Uint8Array) => Uint8Array | Promise<Uint8Array>) {
    if (!buf) return;
    try {
      const out = await fn(buf);
      setBuf(out);
      setLog((l) => [...l, label]);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not work on this data.");
    }
  }

  if (!buf) {
    return <p className="note">Nothing here yet. Extract a payload and send it to the decoder.</p>;
  }

  return (
    <div>
      <div className="controls">
        <button type="button" className="btn" onClick={() => apply("Base64 decode", (b) => fromBase64(asciiString(b)))}>
          Base64 decode
        </button>
        <button type="button" className="btn" onClick={() => apply("Hex decode", (b) => fromHex(asciiString(b)))}>
          Hex decode
        </button>
        <button type="button" className="btn" onClick={() => apply("Gunzip", gunzip)}>
          Gunzip
        </button>
        <span className="keybox">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="XOR key"
            aria-label="XOR key"
          />
          <button
            type="button"
            className="btn"
            onClick={() => apply(`XOR with "${key}"`, (b) => xorKey(b, new TextEncoder().encode(key)))}
          >
            XOR
          </button>
        </span>
      </div>
      {error && <p className="err">{error}</p>}
      <p className="note">Steps so far: {log.join(" \u2192 ")}</p>
      <pre className="mono">{printable(buf, 400)}</pre>
      <pre className="mono dim">{toHex(buf.slice(0, 48))}</pre>
    </div>
  );
}
