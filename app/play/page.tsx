import type { Metadata } from "next";
import PlayList from "@/components/PlayList";

export const metadata: Metadata = {
  title: "Steganography Missions & CTF Challenges: Crack Hidden Messages",
  description:
    "Train your cybersecurity and steganalysis skills with hands-on steganography challenges. Use the interactive bit-plane viewer, manual LSB extractor, and multi-layer decoder to extract codewords.",
  keywords: [
    "steganography challenges",
    "CTF steganography practice",
    "stegsolve online alternative",
    "bit plane viewer online",
    "extract hidden message from image",
    "LSB extractor online",
    "cybersecurity puzzle game",
    "steganalysis challenge",
    "online steganography CTF"
  ],
  alternates: {
    canonical: "/play",
  },
  openGraph: {
    title: "Steganography Missions & CTF Challenges — StegGame",
    description: "Hands-on cybersecurity challenges. Inspect bit planes, find hidden payloads, and decode secret codewords.",
    url: "/play",
  },
};


export default function PlayPage() {
  return (
    <main className="wrap narrow">
      <h1>Missions</h1>
      <p className="lede">
        Each file below is hiding something. You get a viewer, an extractor and a decoder. There is no
        one-click answer; you have to work out how it was hidden.
      </p>
      <PlayList />
    </main>
  );
}
