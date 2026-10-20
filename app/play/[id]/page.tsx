import { notFound } from "next/navigation";
import MissionClient from "@/components/MissionClient";
import { getMission } from "@/lib/game/missions";

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
