import Link from "next/link";

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

      <section className="doors">
        <Link href="/play" className="door dark">
          <h2>Play</h2>
          <p>
            Missions that teach you to find hidden data with a bit-plane viewer, a manual extractor and a
            decoder. No one-click answers.
          </p>
          <span className="go">Open the first mission</span>
        </Link>
        <Link href="/studio" className="door light">
          <h2>Studio</h2>
          <p>
            Hide your own message or file in a picture or WAV sound, locked with a password. Runs entirely in
            your browser.
          </p>
          <span className="go">Hide something</span>
        </Link>
      </section>
    </main>
  );
}
