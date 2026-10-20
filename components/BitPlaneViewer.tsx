"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
}

const CHANNELS = ["Red", "Green", "Blue"];

/** Renders one bit plane of one channel as black/white. Plane 0 shows the original image. */
export default function BitPlaneViewer({ pixels, width, height }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [channel, setChannel] = useState(0);
  const [plane, setPlane] = useState(0);

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

  return (
    <div>
      <div className="controls">
        <div className="seg" role="group" aria-label="Channel">
          {CHANNELS.map((name, i) => (
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
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Bit plane">
          <button type="button" aria-pressed={plane === 0} onClick={() => setPlane(0)}>
            Image
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
            <button key={p} type="button" aria-pressed={plane === p} onClick={() => setPlane(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="lightbox">
        <canvas ref={ref} aria-label="Bit plane view" />
      </div>
      <p className="note">
        Plane 1 is the least significant bit, the one the eye cannot see. Natural pictures form smooth
        patterns; hidden data looks like static.
      </p>
    </div>
  );
}
