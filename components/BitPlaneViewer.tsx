"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyzePlanes } from "@/lib/stego/radar";
import type { Channel, Direction } from "@/lib/stego/lsb";

interface Props {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  onAimExtractor?: (params: { plane: number; channels: Channel[]; direction?: Direction }) => void;
}

const CHANNELS = ["Red", "Green", "Blue"];
const CHANNEL_KEYS: Channel[] = ["r", "g", "b"];

/** Renders one bit plane of one channel as black/white. Plane 0 shows the original image. */
export default function BitPlaneViewer({ pixels, width, height, onAimExtractor }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [channel, setChannel] = useState(0);
  const [plane, setPlane] = useState(0);

  // Compute spatial steganography radar metrics across all 24 planes
  const radar = useMemo(() => analyzePlanes(pixels, width, height), [pixels, width, height]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = width;
    cv.height = height;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(width, height);
    const d = img.data;
    if (plane === 0) {
      d.set(pixels);
    } else {
      const bit = plane - 1;
      for (let i = 0; i < width * height; i++) {
        const v = ((pixels[i * 4 + channel] >> bit) & 1) * 255;
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
        d[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [pixels, width, height, channel, plane]);

  const activePlaneAnalysis = plane > 0 ? radar.planes.find((p) => p.plane === plane) : null;

  return (
    <div>
      <div className="controls">
        <div className="seg" role="group" aria-label="Channel">
          {CHANNELS.map((name, i) => {
            const chKey = CHANNEL_KEYS[i];
            const isAnomalyOnCurrentPlane = activePlaneAnalysis?.anomalyChannels.includes(chKey);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={plane !== 0 && channel === i}
                onClick={() => {
                  setChannel(i);
                  if (plane === 0) setPlane(1);
                }}
              >
                {name}
                {isAnomalyOnCurrentPlane && <span className="radar-dot" aria-hidden="true">●</span>}
              </button>
            );
          })}
        </div>
        <div className="seg" role="group" aria-label="Bit plane">
          <button type="button" aria-pressed={plane === 0} onClick={() => setPlane(0)}>
            Image
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
            const pInfo = radar.planes.find((x) => x.plane === p);
            return (
              <button
                key={p}
                type="button"
                aria-pressed={plane === p}
                onClick={() => setPlane(p)}
                title={pInfo?.hasAnomaly ? `Anomaly detected in plane ${p}` : `Plane ${p}`}
              >
                {p}
                {pInfo?.hasAnomaly && <span className="radar-dot" aria-hidden="true">●</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lightbox">
        <canvas ref={ref} aria-label="Bit plane view" />
      </div>

      {/* Anomaly & Entropy Radar Telemetry */}
      <div className="radar-box" aria-live="polite">
        <div className="radar-header">
          <div className="radar-title">
            <span>ANOMALY & ENTROPY RADAR</span>
            {plane === 0 ? (
              <span className={`radar-badge ${radar.topAnomaly ? "alert" : "clean"}`}>
                {radar.topAnomaly
                  ? `ANOMALY DETECTED (PLANE ${radar.topAnomaly.plane})`
                  : "ALL CHANNELS NORMAL"}
              </span>
            ) : (
              <span className={`radar-badge ${activePlaneAnalysis?.hasAnomaly ? "alert" : "clean"}`}>
                {activePlaneAnalysis?.hasAnomaly ? "ARTIFICIAL NOISE DETECTED" : "NATURAL PLANE"}
              </span>
            )}
          </div>

          {activePlaneAnalysis?.hasAnomaly && onAimExtractor && (
            <button
              type="button"
              className="btn aim-btn"
              onClick={() =>
                onAimExtractor({
                  plane,
                  channels: activePlaneAnalysis.anomalyChannels,
                  direction: activePlaneAnalysis.suspectedDirection,
                })
              }
            >
              Aim Extractor to Plane {plane} ({activePlaneAnalysis.anomalyChannels.map((c) => c.toUpperCase()).join("+")})
            </button>
          )}

          {plane === 0 && radar.topAnomaly && (
            <button
              type="button"
              className="btn aim-btn"
              onClick={() => {
                setPlane(radar.topAnomaly!.plane);
                const firstCh = radar.topAnomaly!.anomalyChannels[0];
                if (firstCh) setChannel(CHANNEL_KEYS.indexOf(firstCh));
              }}
            >
              Inspect Anomaly (Plane {radar.topAnomaly.plane})
            </button>
          )}
        </div>

        {activePlaneAnalysis && (
          <div className="radar-bars">
            {CHANNEL_KEYS.map((ck, i) => {
              const stat = activePlaneAnalysis.channels[ck];
              // Map max 0.50 transition rate (white noise) to 100% bar width
              const barPercent = Math.min(100, Math.round(stat.peakNoise * 200));
              return (
                <div
                  key={ck}
                  className={`radar-bar-item ${stat.isAnomaly ? "highlight" : ""}`}
                >
                  <div className="radar-bar-label">
                    <span>{CHANNELS[i]} Channel</span>
                    <span>{(stat.peakNoise * 100).toFixed(1)}%</span>
                  </div>
                  <div className="radar-bar-meter">
                    <div
                      className={`radar-bar-fill ${stat.isAnomaly ? "alert" : ""}`}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={`radar-explain ${activePlaneAnalysis?.hasAnomaly ? "alert" : ""}`}>
          <span>
            {plane === 0
              ? radar.topAnomaly
                ? `Telemetry scans indicate suspicious artificial static on Bit Plane ${radar.topAnomaly.plane} (${radar.topAnomaly.anomalyChannels.map((c) => c.toUpperCase()).join(", ")}).`
                : "No high-entropy artificial steganographic patterns identified across bit planes."
              : activePlaneAnalysis?.explanation}
          </span>
        </div>
      </div>

      <p className="note">
        Natural photo gradients form smooth contours. Steganographic payloads appear as distinct
        patches of high-entropy static (near 50% bit transitions) with an abrupt boundary.
      </p>
    </div>
  );
}

