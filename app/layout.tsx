import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* The type system is three voices: a heavy grotesque for display and body, a
   serif for the editorial lede and the film reviews, a mono for every label,
   number and piece of metadata. Nothing else. */

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
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

const favicon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23090405'/%3E%3Crect x='4' y='4' width='56' height='56' fill='none' stroke='%23ff2233' stroke-width='3'/%3E%3Ctext x='32' y='44' font-family='Arial Black, Arial' font-size='28' fill='%23f2ece4' text-anchor='middle' font-weight='900'%3EPG%3C/text%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: "Pratyush Garg — Portfolio",
  description:
    "Pratyush Garg, B.Tech CS student at the Faculty of Technology, DU. I build things for the web, mostly late at night.",
  icons: { icon: favicon },
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
