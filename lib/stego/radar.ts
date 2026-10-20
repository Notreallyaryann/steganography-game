import type { Channel, Direction } from "./lsb";

export interface ChannelStats {
  channel: Channel;
  avgNoise: number;        // Overall average transition rate (0..1)
  peakNoise: number;       // Peak regional transition rate (0..1)
  peakCol: number;         // Peak vertical strip rate (column scan signature)
  peakRow: number;         // Peak horizontal strip rate (row scan signature)
  isAnomaly: boolean;      // True if artificial high entropy detected
}

export interface PlaneAnalysis {
  plane: number;           // 1..8
  channels: Record<Channel, ChannelStats>;
  anomalyChannels: Channel[];
  hasAnomaly: boolean;
  suspectedDirection?: Direction;
  explanation: string;
}

export interface RadarReport {
  planes: PlaneAnalysis[];
  topAnomaly?: PlaneAnalysis;
}

const CHANNELS: Channel[] = ["r", "g", "b"];
const STRIP_COUNT = 16;

/**
 * Analyzes all 8 bit planes across R, G, B channels using spatial transition
 * rate analysis to detect steganographic payloads (high-entropy static).
 *
 * Natural image gradients produce low to moderate spatial bit transitions (< 0.25).
 * Steganographic payloads (encrypted/compressed/random bits) produce transition
 * rates approaching 0.50 (ideal random distribution).
 */
export function analyzePlanes(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): RadarReport {
  const planes: PlaneAnalysis[] = [];
  const stripW = Math.max(1, Math.floor(width / STRIP_COUNT));
  const stripH = Math.max(1, Math.floor(height / STRIP_COUNT));

  for (let p = 1; p <= 8; p++) {
    const bit = p - 1;
    const channelStats: Record<Channel, ChannelStats> = {
      r: { channel: "r", avgNoise: 0, peakNoise: 0, peakCol: 0, peakRow: 0, isAnomaly: false },
      g: { channel: "g", avgNoise: 0, peakNoise: 0, peakCol: 0, peakRow: 0, isAnomaly: false },
      b: { channel: "b", avgNoise: 0, peakNoise: 0, peakCol: 0, peakRow: 0, isAnomaly: false },
    };

    const anomalyChannels: Channel[] = [];
    let bestDirection: Direction = "row";
    let maxColRatio = 0;

    for (let c = 0; c < 3; c++) {
      const ch = CHANNELS[c];

      // Vertical strips (tests column-wise continuity & column scan)
      const colRates: number[] = [];
      for (let s = 0; s < STRIP_COUNT; s++) {
        let trans = 0;
        let tot = 0;
        const x0 = s * stripW;
        const x1 = s === STRIP_COUNT - 1 ? width : (s + 1) * stripW;
        for (let x = x0; x < x1; x++) {
          for (let y = 0; y < height - 1; y++) {
            const i1 = (y * width + x) * 4 + c;
            const i2 = ((y + 1) * width + x) * 4 + c;
            if (((pixels[i1] >> bit) & 1) !== ((pixels[i2] >> bit) & 1)) trans++;
            tot++;
          }
        }
        colRates.push(tot > 0 ? trans / tot : 0);
      }

      // Horizontal strips (tests row-wise continuity & row scan)
      const rowRates: number[] = [];
      for (let s = 0; s < STRIP_COUNT; s++) {
        let trans = 0;
        let tot = 0;
        const y0 = s * stripH;
        const y1 = s === STRIP_COUNT - 1 ? height : (s + 1) * stripH;
        for (let y = y0; y < y1; y++) {
          const rowOff = y * width * 4;
          for (let x = 0; x < width - 1; x++) {
            const i1 = rowOff + x * 4 + c;
            const i2 = i1 + 4;
            if (((pixels[i1] >> bit) & 1) !== ((pixels[i2] >> bit) & 1)) trans++;
            tot++;
          }
        }
        rowRates.push(tot > 0 ? trans / tot : 0);
      }

      const peakCol = Math.max(...colRates);
      const peakRow = Math.max(...rowRates);
      const peakNoise = Math.max(peakCol, peakRow);
      const avgNoise =
        (colRates.reduce((a, b) => a + b, 0) + rowRates.reduce((a, b) => a + b, 0)) /
        (colRates.length + rowRates.length);

      // Anomaly threshold:
      // In natural images, higher planes (>= 2) rarely exceed 0.35 transition rate.
      // Plane 1 can have natural dither/noise up to ~0.35, but random payload hits > 0.44.
      // Anomaly is flagged if peakNoise >= 0.42 (close to 0.50 random static).
      const isAnomaly = peakNoise >= 0.42;
      if (isAnomaly) {
        anomalyChannels.push(ch);
        // Compare vertical vs horizontal peak to determine direction
        if (peakCol > peakRow * 1.35) {
          maxColRatio = Math.max(maxColRatio, peakCol / peakRow);
        }
      }

      channelStats[ch] = {
        channel: ch,
        avgNoise,
        peakNoise,
        peakCol,
        peakRow,
        isAnomaly,
      };
    }

    if (maxColRatio > 1.35) {
      bestDirection = "col";
    } else {
      bestDirection = "row";
    }

    let explanation = "Natural image structure. No artificial static detected.";
    if (anomalyChannels.length > 0) {
      const chNames = anomalyChannels.map((c) => c.toUpperCase()).join(" & ");
      const dirName = bestDirection === "col" ? "column-major (vertical)" : "row-major (horizontal)";
      explanation = `Artificial noise detected in ${chNames} channel (${dirName} scan pattern).`;
    }

    planes.push({
      plane: p,
      channels: channelStats,
      anomalyChannels,
      hasAnomaly: anomalyChannels.length > 0,
      suspectedDirection: anomalyChannels.length > 0 ? bestDirection : undefined,
      explanation,
    });
  }

  // Find the top anomaly: prefer higher planes (plane >= 2) or cleanest signal
  const anomalousPlanes = planes.filter((p) => p.hasAnomaly);
  // If plane 2 or 3 has an anomaly, that's often the intentional one in missions
  const topAnomaly =
    anomalousPlanes.slice().reverse().find((p) => p.plane >= 2) ?? anomalousPlanes[0];

  return { planes, topAnomaly };
}
