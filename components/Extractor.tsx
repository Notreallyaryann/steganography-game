"use client";
import { useState } from "react";
import { extract, capacityBytes, type Channel, type BitOrder, type Direction, type LsbParams } from "@/lib/stego/lsb";
import { parseFrameLength, FRAME_HEADER } from "@/lib/game/frame";
import { printable, asciiString } from "@/lib/stego/layers";

interface Props {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  onSend: (bytes: Uint8Array) => void;
}

interface Result {
  preview: string;
  message?: Uint8Array;
  error?: string;
}

/** Manual extractor: wrong settings give gibberish, right settings reveal a message frame. */
export default function Extractor({ pixels, width, height, onSend }: Props) {
  const [plane, setPlane] = useState(1);
  const [chans, setChans] = useState<Record<Channel, boolean>>({ r: true, g: true, b: true });
  const [bitOrder, setBitOrder] = useState<BitOrder>("msb-first");
  const [direction, setDirection] = useState<Direction>("row");
  const [result, setResult] = useState<Result | null>(null);

  function run() {
    const channels = (["r", "g", "b"] as Channel[]).filter((c) => chans[c]);
    if (channels.length === 0) {
      setResult({ preview: "", error: "Pick at least one channel." });
      return;
    }
    const params: LsbParams = { plane, channels, bitOrder, direction };
    const cap = capacityBytes(width, height, params);
    const head = extract(pixels, width, height, Math.min(96, cap), params);
    const n = parseFrameLength(head);
    if (n !== null && n <= cap - FRAME_HEADER) {
      const msg = extract(pixels, width, height, FRAME_HEADER + n, params).slice(FRAME_HEADER);
      setResult({ preview: printable(head), message: msg });
    } else {
      setResult({ preview: printable(head) });
    }
  }

  return (
    <div>
      <div className="fields">
        <label>
          Bit plane
          <select value={plane} onChange={(e) => setPlane(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Channels</legend>
          {(["r", "g", "b"] as Channel[]).map((c) => (
            <label key={c} className="inline">
              <input
                type="checkbox"
                checked={chans[c]}
                onChange={(e) => setChans({ ...chans, [c]: e.target.checked })}
              />
              {c.toUpperCase()}
            </label>
          ))}
        </fieldset>
        <label>
          Bit order
          <select value={bitOrder} onChange={(e) => setBitOrder(e.target.value as BitOrder)}>
            <option value="msb-first">Most significant first</option>
            <option value="lsb-first">Least significant first</option>
          </select>
        </label>
        <label>
          Scan direction
          <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
            <option value="row">Row by row</option>
            <option value="col">Column by column</option>
          </select>
        </label>
      </div>
      <button type="button" className="btn primary" onClick={run}>
        Extract
      </button>

      {result?.error && <p className="err">{result.error}</p>}
      {result && !result.error && (
        <div className="result">
          <p className="note">First 96 bytes read with these settings:</p>
          <pre className="mono">{result.preview}</pre>
          {result.message ? (
            <>
              <p className="ok">Message frame found ({result.message.length} bytes):</p>
              <pre className="mono found">{asciiString(result.message)}</pre>
              <button type="button" className="btn" onClick={() => onSend(result.message!)}>
                Send to decoder
              </button>
            </>
          ) : (
            <p className="note">No message frame here. Static like this means the settings are wrong.</p>
          )}
        </div>
      )}
    </div>
  );
}
