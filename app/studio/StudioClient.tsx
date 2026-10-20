"use client";
import { useState } from "react";
import { hide, reveal, studioCapacity, type Carrier } from "@/lib/stego/studio";
import { encodePayload, decodePayload, type Payload } from "@/lib/stego/payload";
import { wavToCarrier, carrierToWav, type WavInfo } from "@/lib/stego/wav";
import { loadImageBlob, pixelsToPngBlob, downloadBlob } from "@/lib/stego/image";
import { psnr } from "@/lib/stego/metrics";

interface Cover {
  kind: "image" | "audio";
  name: string;
  carrier: Carrier;
  previewUrl?: string;
  wav?: { bytes: Uint8Array; info: WavInfo };
}

interface Done {
  blob: Blob;
  filename: string;
  afterUrl?: string;
  quality?: number;
}

const isWav = (f: File) => f.type.includes("wav") || /\.wav$/i.test(f.name);
const baseName = (n: string) => n.replace(/\.[^.]+$/, "").replace(/[^\w\- ]/g, "_") || "file";

async function readCover(file: File): Promise<Cover> {
  if (isWav(file)) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { carrier, info } = wavToCarrier(bytes);
    return { kind: "audio", name: file.name, carrier, wav: { bytes, info } };
  }
  const p = await loadImageBlob(file);
  return {
    kind: "image",
    name: file.name,
    carrier: { ...p, channels: ["r", "g", "b"] },
    previewUrl: URL.createObjectURL(file),
  };
}

export default function StudioClient() {
  const [tab, setTab] = useState<"hide" | "reveal">("hide");
  return (
    <div>
      <div className="seg tabs" role="tablist" aria-label="Studio mode">
        <button role="tab" aria-selected={tab === "hide"} aria-pressed={tab === "hide"} onClick={() => setTab("hide")}>
          Hide a message
        </button>
        <button role="tab" aria-selected={tab === "reveal"} aria-pressed={tab === "reveal"} onClick={() => setTab("reveal")}>
          Reveal a message
        </button>
      </div>
      {tab === "hide" ? <HidePanel /> : <RevealPanel />}
    </div>
  );
}

function HidePanel() {
  const [cover, setCover] = useState<Cover | null>(null);
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [attach, setAttach] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  async function onCover(f: File | undefined) {
    setDone(null);
    setError("");
    if (!f) return;
    try {
      setCover(await readCover(f));
    } catch (e) {
      setCover(null);
      setError(e instanceof Error ? e.message : "Could not read that file.");
    }
  }

  async function buildPayload(): Promise<Payload | null> {
    if (mode === "text") return text ? { kind: "text", text } : null;
    if (!attach) return null;
    return { kind: "file", name: attach.name, data: new Uint8Array(await attach.arrayBuffer()) };
  }

  const approxSize = mode === "text" ? new TextEncoder().encode(text).length + 1 : attach ? attach.size + attach.name.length + 3 : 0;
  const capacity = cover ? studioCapacity(cover.carrier) : 0;
  const ratio = capacity ? Math.min(1, approxSize / capacity) : 0;
  const tooBig = approxSize > capacity;
  const ready = !!cover && !!password && approxSize > 0 && !tooBig && !busy;

  async function run() {
    if (!cover) return;
    setBusy(true);
    setError("");
    setDone(null);
    try {
      const payload = await buildPayload();
      if (!payload) throw new Error("Nothing to hide yet.");
      const out = await hide(cover.carrier, encodePayload(payload), password);
      if (cover.kind === "image") {
        const blob = await pixelsToPngBlob({ pixels: out, width: cover.carrier.width, height: cover.carrier.height });
        setDone({
          blob,
          filename: `${baseName(cover.name)}-hidden.png`,
          afterUrl: URL.createObjectURL(blob),
          quality: psnr(cover.carrier.pixels, out),
        });
      } else {
        const wav = carrierToWav(cover.wav!.bytes, cover.wav!.info, out);
        setDone({ blob: new Blob([wav as unknown as BlobPart], { type: "audio/wav" }), filename: `${baseName(cover.name)}-hidden.wav` });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <div className="studio-panel">
      <section className="panel">
        <h2>1. Choose a picture or sound</h2>
        <input type="file" accept="image/*,.wav,audio/wav" onChange={(e) => onCover(e.target.files?.[0])} />
        <p className="note">Pictures: PNG, JPG, WebP. Sound: 16-bit WAV. The result is saved as PNG or WAV so nothing is lost.</p>
        {cover && (
          <p className="note">
            {cover.name}: room for about {capacity.toLocaleString()} bytes of secret data.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>2. Write your secret</h2>
        <div className="seg" role="group" aria-label="Secret type">
          <button type="button" aria-pressed={mode === "text"} onClick={() => setMode("text")}>
            Message
          </button>
          <button type="button" aria-pressed={mode === "file"} onClick={() => setMode("file")}>
            File
          </button>
        </div>
        {mode === "text" ? (
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Type your secret message" />
        ) : (
          <input type="file" onChange={(e) => setAttach(e.target.files?.[0] ?? null)} />
        )}
        {cover && (
          <div className="meterwrap">
            <div className="meter" aria-hidden="true">
              <div className={tooBig ? "fill over" : "fill"} style={{ width: `${ratio * 100}%` }} />
            </div>
            <span className="note">
              {approxSize.toLocaleString()} of {capacity.toLocaleString()} bytes {tooBig ? "(too big, use a larger file)" : ""}
            </span>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>3. Set a password</h2>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="new-password" />
        <p className="note">Everything happens in your browser; nothing is uploaded. If you forget the password, the secret cannot be recovered.</p>
        <button type="button" className="btn primary" disabled={!ready} onClick={run}>
          {busy ? "Hiding…" : "Hide it"}
        </button>
        {error && <p className="err">{error}</p>}
      </section>

      {done && (
        <section className="panel">
          <h2>Done</h2>
          {cover?.previewUrl && done.afterUrl && (
            <div className="compare">
              <figure>
                <img src={cover.previewUrl} alt="Original" />
                <figcaption>Original</figcaption>
              </figure>
              <figure>
                <img src={done.afterUrl} alt="With hidden message" />
                <figcaption>With secret</figcaption>
              </figure>
            </div>
          )}
          {done.quality !== undefined && (
            <p className="note">
              Similarity {Number.isFinite(done.quality) ? `${done.quality.toFixed(1)} dB (above 40 dB is invisible)` : "identical"}.
            </p>
          )}
          <button type="button" className="btn primary" onClick={() => downloadBlob(done.blob, done.filename)}>
            Download {done.filename}
          </button>
          <p className="warn">
            Send it as a file or document, not as a photo. WhatsApp, Instagram and most chat apps recompress photos, which destroys the secret.
          </p>
        </section>
      )}
    </div>
  );
}

function RevealPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);
  const [found, setFound] = useState<Payload | null>(null);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError("");
    setChecked(false);
    setFound(null);
    try {
      const cover = await readCover(file);
      const plain = await reveal(cover.carrier, password);
      setFound(plain ? decodePayload(plain) : null);
      setChecked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    }
    setBusy(false);
  }

  return (
    <div className="studio-panel">
      <section className="panel">
        <h2>Reveal</h2>
        <input type="file" accept="image/*,.wav,audio/wav" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setChecked(false); }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="off" />
        <button type="button" className="btn primary" disabled={!file || !password || busy} onClick={run}>
          {busy ? "Looking…" : "Reveal"}
        </button>
        {error && <p className="err">{error}</p>}
        {checked && !found && <p className="note strong">No message found.</p>}
        {found?.kind === "text" && <pre className="mono found secret">{found.text}</pre>}
        {found?.kind === "file" && (
          <div>
            <p className="ok">A hidden file: {found.name}</p>
            <button
              type="button"
              className="btn primary"
              onClick={() => downloadBlob(new Blob([found.data as unknown as BlobPart]), found.name.replace(/[^\w.\- ]/g, "_"))}
            >
              Download file
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
