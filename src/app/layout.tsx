import type { Metadata } from "next";
import { Unbounded, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-unbounded" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-jetbrains" });

const SITE = (process.env.APP_URL ?? "https://trenchmates.xyz").replace(/\/$/, "");
const TITLE = "trenchmates — your Solana trench agent";
const DESC = "Sign in with X and get an AI agent built from your feed: scan any contract, track wallets, catch when they ape together, trade in one click. $PAWS.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "trenchmates",
    title: TITLE,
    description: DESC,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "trenchmates: a cat in a hard hat and a dog in a suit, your Solana trench agents" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
