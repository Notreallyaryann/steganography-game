import StudioClient from "./StudioClient";

export const metadata = { title: "Studio | StegGame" };

export default function StudioPage() {
  return (
    <main className="wrap narrow">
      <h1>Studio</h1>
      <p className="lede">
        Hide a message or a file inside a picture or a sound. Only someone with the password can reveal it, and
        without it the file looks untouched.
      </p>
      <StudioClient />
    </main>
  );
}
