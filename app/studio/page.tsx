import type { Metadata } from "next";
import StudioClient from "./StudioClient";

export const metadata: Metadata = {
  title: "Steganography Studio: Hide Text & Files in Images and Audio Online",
  description:
    "Free in-browser steganography tool. Hide secret text or files inside PNG images and WAV audio files with password-based encryption and pseudo-random pixel scattering.",
  keywords: [
    "online steganography tool",
    "hide text in image",
    "hide file in image",
    "audio steganography online",
    "WAV steganography tool",
    "password protected steganography",
    "LSB image encoder",
    "reveal hidden data online",
    "extract secret from image",
    "encrypted steganography tool"
  ],
  alternates: {
    canonical: "/studio",
  },
  openGraph: {
    title: "Steganography Studio: Hide & Reveal Secrets Online — StegGame",
    description: "Hide messages and files inside PNG images or WAV audio directly in your browser.",
    url: "/studio",
  },
};


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
