import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://steganography-game.vercel.app";

export const viewport: Viewport = {
  themeColor: "#0f1b24",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "StegGame — Interactive Steganography Game, Tool & Study Guide",
    template: "%s | StegGame",
  },
  description:
    "Free online steganography game, LSB audio/image tool, and complete study guide. Inspect bit planes, learn Least Significant Bit (LSB) embedding, and crack forensic CTF challenges.",
  keywords: [
    "steganography online",
    "image steganography tool",
    "LSB steganography",
    "least significant bit",
    "stegsolve online",
    "bit plane viewer online",
    "aperisolve alternative",
    "hide text in image",
    "hide message in picture",
    "hide secret in photo",
    "audio steganography online",
    "WAV steganography",
    "steganography game",
    "CTF steganography practice",
    "steganalysis tool",
    "extract hidden message from image",
    "how to find hidden data in picture",
    "bit plane slicing tutorial",
    "cybersecurity puzzle game",
    "digital steganography online",
    "learn steganography",
    "steganography solver",
    "password protected steganography",
    "cybersecurity training game",
    "online steganography tools"
  ],
  authors: [{ name: "StegGame" }],
  creator: "StegGame",
  publisher: "StegGame",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "StegGame",
    title: "StegGame — Interactive Steganography Game & Analysis Suite",
    description:
      "Inspect bit planes, detect artificial payload static, solve forensic CTF missions, and hide your own secret messages inside images and audio.",
  },
  twitter: {
    card: "summary_large_image",
    title: "StegGame — Interactive Steganography Tool & Game",
    description:
      "Free browser-based steganography studio, interactive bit plane viewer, and CTF training missions.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${baseUrl}/#webapp`,
      name: "StegGame",
      url: baseUrl,
      applicationCategory: "SecurityApplication",
      operatingSystem: "All",
      description:
        "An interactive steganography game, forensic analysis suite, and educational tool to hide and extract data from images and audio.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Interactive 8-bit Plane Slicing & Viewer",
        "Spatial Anomaly & Shannon Entropy Steganalysis Radar",
        "Manual LSB and Multi-Channel Extractor",
        "Layered Payload Decoder (Base64, Hex, XOR)",
        "Client-Side In-Browser Audio and Image Steganography Studio",
        "Live Global Operative Leaderboard"
      ],
    },
    {
      "@type": "EducationalWebSite",
      "@id": `${baseUrl}/#educational`,
      name: "StegGame Steganography Field Manual",
      url: `${baseUrl}/study`,
      description:
        "Comprehensive educational guide covering digital pixels, RGBA canvas manipulation, LSB vs MSB, bit plane slicing, and forensic detection.",
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}

