import PlayList from "@/components/PlayList";

export const metadata = { title: "Missions | StegGame" };

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
