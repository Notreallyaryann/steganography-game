import Link from "next/link";
import NavAgent from "./NavAgent";

export default function Nav() {
  return (
    <header className="nav">
      <Link href="/" className="brand">
        StegGame
      </Link>
      <nav aria-label="Main">
        <Link href="/play">Play</Link>
        <Link href="/study">Study</Link>
        <Link href="/leaderboard">Leaderboard</Link>
        <Link href="/studio">Studio</Link>
        <NavAgent />
      </nav>
    </header>
  );
}

