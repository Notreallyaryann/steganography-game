import type { Metadata } from "next";
import StudyClient from "@/components/StudyClient";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://steganography-game.vercel.app";

export const metadata: Metadata = {
  title: "Steganography Tutorial & Field Manual: LSB, MSB, Bit Planes & Steganalysis",
  description:
    "Comprehensive masterclass on digital image and audio steganography. Learn pixel RGBA buffers, Least Significant Bit (LSB) embedding, bit plane slicing, and forensic detection.",
  keywords: [
    "steganography tutorial",
    "how steganography works",
    "LSB steganography explained",
    "least significant bit tutorial",
    "bit plane slicing",
    "MSB vs LSB",
    "steganalysis tutorial",
    "spatial domain steganography",
    "hide message in image tutorial",
    "cybersecurity steganography guide",
    "learn steganography online",
    "image pixel manipulation LSB",
    "CTF steganography guide",
    "digital watermarking technique"
  ],
  alternates: {
    canonical: "/study",
  },
  openGraph: {
    type: "article",
    url: `${baseUrl}/study`,
    title: "Steganography Tutorial & Field Manual: LSB, MSB & Bit Planes",
    description:
      "Master the math and techniques behind digital steganography: from binary bits and sub-perceptual color shifts to spatial steganalysis.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Steganography Field Manual & Tutorial",
    description:
      "Interactive tutorial covering how Least Significant Bit (LSB) steganography works, bit plane slicing, and forensic detection.",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Steganography Field Manual: LSB, MSB, Bit Planes, and Forensic Detection",
  description:
    "A comprehensive technical tutorial explaining pixel RGBA buffers, binary bit manipulation, Least Significant Bit (LSB) injection, and statistical steganalysis.",
  author: {
    "@type": "Organization",
    name: "StegGame",
  },
  publisher: {
    "@type": "Organization",
    name: "StegGame",
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${baseUrl}/study`,
  },
  about: [
    { "@type": "Thing", name: "Steganography" },
    { "@type": "Thing", name: "Least Significant Bit (LSB)" },
    { "@type": "Thing", name: "Steganalysis" },
    { "@type": "Thing", name: "Cybersecurity" },
    { "@type": "Thing", name: "Digital Image Processing" },
  ],
};

export default function StudyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <StudyClient />
    </>
  );
}
