import Link from "next/link";

export default function Nav() {
  return (
    <header className="nav">
      <Link href="/" className="brand">
        StegGame
      </Link>
      <nav aria-label="Main">
        <Link href="/play">Play</Link>
        <Link href="/studio">Studio</Link>
      </nav>
    </header>
  );
}
