/**
 * PUBLIC mission data. Safe to ship to the browser: it contains no answers,
 * no extraction parameters and no hints. Those live in server-only files.
 */

export interface PublicMission {
  id: string;
  order: number;
  title: string;
  skill: string;
  tier: 1 | 2 | 3 | 4;
  story: string;
  assetUrl: string;
  parTimeSec: number;
  hintCosts: number[];
  maxAttempts: number;
}

export const MISSIONS: PublicMission[] = [
  {
    id: "mission-01",
    order: 1,
    title: "First Contact",
    skill: "LSB in an image",
    tier: 1,
    story:
      "Agent Falcon sent a harbour photo and a one-line note: 'Look closer than the eye allows.' The photo is a normal image to everyone else. Somewhere in its pixels is a short message. Find it and report the codeword it gives.",
    assetUrl: "/assets/mission-01.png",
    parTimeSec: 300,
    hintCosts: [50, 100, 200],
    maxAttempts: 10,
  },
  {
    id: "mission-02",
    order: 2,
    title: "Quiet Channel",
    skill: "Bit planes",
    tier: 2,
    story:
      "A safehouse photo arrived over a wire that scrambles nothing and hides everything. The default settings give only noise. Use the bit-plane viewer to see where the picture stops looking natural, then aim the extractor there.",
    assetUrl: "/assets/mission-02.png",
    parTimeSec: 600,
    hintCosts: [50, 100, 200],
    maxAttempts: 10,
  },
  {
    id: "mission-03",
    order: 3,
    title: "Against the Grain",
    skill: "Channels, bit order, scan direction",
    tier: 3,
    story:
      "This courier hid data in a way nobody reads in the usual order. The viewer will show you the shape of the noise, and the shape tells you which way the data runs. Not every colour channel carries it.",
    assetUrl: "/assets/mission-03.png",
    parTimeSec: 900,
    hintCosts: [50, 100, 200],
    maxAttempts: 10,
  },
  {
    id: "mission-04",
    order: 4,
    title: "Dead Drop",
    skill: "Layered payloads",
    tier: 4,
    story:
      "The extraction is only the first lock. What comes out is not readable text, and it has been through more than one transformation. The key is the codename of the agent who sent you the very first photo, written in capital letters. Peel the layers in the right order.",
    assetUrl: "/assets/mission-04.png",
    parTimeSec: 1200,
    hintCosts: [50, 100, 200],
    maxAttempts: 10,
  },
];

export function getMission(id: string): PublicMission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
