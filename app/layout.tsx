import type { Metadata, Viewport } from "next";
import { SITE_TITLE } from "@/lib/data";
import { Archivo, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* The type system is three voices: a heavy grotesque for display and body, a
   serif for the editorial lede and the film reviews, a mono for every label,
   number and piece of metadata. Nothing else. */

/* Variable, and with the width axis included: the section titles open from a
   condensed 62 to 100 as they rise, and stretch past it under the pointer.
   No `weight` here on purpose — asking for static weights loads the static
   family, and `axes` is only available on the variable one. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

/* Where the site actually lives, so the crawler is handed absolute URLs for
   the share card. The workflow sets this alongside NEXT_PUBLIC_BASE_PATH;
   locally it falls back to the Pages URL, which is still a real address. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mrcreoid.github.io/portfolio-website";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const DESCRIPTION =
  "Pratyush Garg, B.Tech CS student at the Faculty of Technology, DU. I build things for the web, mostly late at night.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: DESCRIPTION,
  icons: {
    icon: [
      { url: `${BASE}/favicon.svg`, type: "image/svg+xml" },
      { url: `${BASE}/favicon.ico`, sizes: "any" },
    ],
    apple: `${BASE}/apple-touch-icon.png`,
  },
  openGraph: {
    type: "website",
    siteName: "Pratyush Garg — The Archive",
    title: SITE_TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: `${BASE}/og.png`,
        width: 1200,
        height: 630,
        alt: "Pratyush Garg — The Archive, Portfolio 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: DESCRIPTION,
    images: [`${BASE}/og.png`],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
