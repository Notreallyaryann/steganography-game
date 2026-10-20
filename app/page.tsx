import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "StegGame — Interactive Steganography Game, Tool & Study Guide",
  description:
    "Learn, practice, and master digital steganography online. Inspect 8-bit planes, extract hidden LSB payloads, solve cybersecurity CTF missions, and hide your own secret files inside PNG images and WAV audio.",
  keywords: [
    "steganography online",
    "image steganography tool",
    "LSB steganography online",
    "stegsolve online",
    "bit plane viewer online",
    "aperisolve alternative",
    "hide message in picture",
    "hide secret in photo",
    "audio steganography online",
    "WAV steganography",
    "steganography game",
    "CTF steganography practice",
    "steganalysis tool",
    "extract hidden message from image",
    "how to find hidden data in picture",
    "cybersecurity puzzle game",
    "learn steganography"
  ],
  alternates: {
    canonical: "/",
  },
};


export default function Home() {
  return (
    <main className="wrap">
      <section className="hero">
        <h1>
          Every picture is <span className="redact" tabIndex={0}>keeping a secret</span>.
          <br />
          Most people never <span className="redact" tabIndex={0}>look closely enough</span>.
        </h1>
        <p className="lede">
          Hide a message inside a photo or a sound that looks and plays exactly the same. Or take
          on missions where you hunt for what someone else hid. <span className="hint-inline">Hover or tap the black bars.</span>
        </p>
      </section>

      <section className="doors" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <Link href="/play" className="door dark">
          <h2>Play</h2>
          <p>
            Missions that teach you to find hidden data with a bit-plane viewer, a manual extractor and a
            decoder.
          </p>
          <span className="go">Open first mission</span>
        </Link>
        <Link href="/study" className="door light">
          <h2>Study</h2>
          <p>
            Field manual covering the whole technique: pixels, RGBA, LSB vs MSB, bit planes, and forensic analysis.
          </p>
          <span className="go">Read manual</span>
        </Link>
        <Link href="/leaderboard" className="door light">
          <h2>Leaderboard</h2>
          <p>
            Live agent rankings backed by Neon PostgreSQL. Claim your unique operative codename.
          </p>
          <span className="go">View rankings</span>
        </Link>
        <Link href="/studio" className="door light">
          <h2>Studio</h2>
          <p>
            Hide your own message or file in a picture or WAV sound, locked with a password.
          </p>
          <span className="go">Hide something</span>
        </Link>
      </section>
    </main>
  );
}
