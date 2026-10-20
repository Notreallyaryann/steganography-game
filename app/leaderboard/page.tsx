import type { Metadata } from "next";
import LeaderboardClient from "@/components/LeaderboardClient";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stegame.vercel.app";

export const metadata: Metadata = {
  title: "Global Operative Leaderboard: Top Steganography Scores",
  description:
    "Live global rankings of cybersecurity operatives and steganographers cracking classified missions in StegGame. Track scores, speed runs, and completion stats.",
  keywords: [
    "steganography leaderboard",
    "cybersecurity CTF rankings",
    "steganography challenge scores",
    "top steganographers",
    "cryptographic puzzle leaderboard",
    "CTF high scores"
  ],
  alternates: {
    canonical: "/leaderboard",
  },
  openGraph: {
    type: "website",
    url: `${baseUrl}/leaderboard`,
    title: "Global Operative Leaderboard — StegGame",
    description: "Track live high scores and speed rankings across all steganography missions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Operative Leaderboard — StegGame",
    description: "Live cybersecurity and steganography rankings backed by Neon PostgreSQL.",
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
