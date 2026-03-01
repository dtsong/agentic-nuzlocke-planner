import type { Metadata } from "next";
import { DM_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trainerlab.io"),
  title: {
    default: "Trainer Lab — Nuzlocke Route Planner",
    template: "%s | Trainer Lab",
  },
  description:
    "Plan your Pokemon Nuzlocke run with Trainer Lab. Route encounters, analyze type coverage, and prepare for boss battles across FireRed, LeafGreen, and more.",
  keywords: [
    "nuzlocke",
    "nuzlocke planner",
    "pokemon nuzlocke",
    "route planner",
    "nuzlocke tracker",
    "trainer lab",
    "type coverage",
    "pokemon challenge run",
  ],
  openGraph: {
    title: "Trainer Lab — Nuzlocke Route Planner",
    description:
      "Plan your Pokemon Nuzlocke run with Trainer Lab. Route encounters, analyze type coverage, and prepare for boss battles across FireRed, LeafGreen, and more.",
    url: "https://trainerlab.io",
    siteName: "Trainer Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfairDisplay.variable} ${dmMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
