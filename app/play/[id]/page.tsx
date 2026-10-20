import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MissionClient from "@/components/MissionClient";
import { getMission } from "@/lib/game/missions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission) return { title: "Mission Not Found" };

  return {
    title: `Mission ${mission.order}: ${mission.title} (${mission.skill})`,
    description: mission.story,
    keywords: [
      "steganography challenge",
      mission.title.toLowerCase(),
      mission.skill.toLowerCase(),
      "extract hidden message",
      "CTF steganography mission",
      "bit plane steganalysis",
      "LSB decoding"
    ],
    alternates: {
      canonical: `/play/${id}`,
    },
    openGraph: {
      title: `Mission ${mission.order}: ${mission.title} — StegGame`,
      description: mission.story,
      images: [mission.assetUrl],
    },
  };
}


export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission) notFound();
  return (
    <main className="wrap narrow">
      <MissionClient mission={mission} />
    </main>
  );
}
