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
  title: "Nuzlocke Route Planner",
  description:
    "An intelligent route planner for Pokemon Nuzlocke runs. Plan encounters, analyze type coverage, and prepare for boss battles.",
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
