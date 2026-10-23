import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const display = Fredoka({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"], weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "SignBridge: sign and speech, both ways",
  description: "Real-time two-way translation between sign language and speech, with friendly signing avatars.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="sb-sky" aria-hidden>
          <div className="sb-blob" style={{ width: 520, height: 520, left: "-8%", top: "8%", background: "#ff4fa3" }} />
          <div className="sb-blob" style={{ width: 460, height: 460, right: "-6%", top: "-4%", background: "#22d3ee", animationDelay: "-6s" }} />
          <div className="sb-blob" style={{ width: 420, height: 420, left: "35%", bottom: "-12%", background: "#8b5cf6", animationDelay: "-12s" }} />
          <div className="sb-blob" style={{ width: 260, height: 260, right: "18%", bottom: "12%", background: "#fbbf24", opacity: 0.25 }} />
        </div>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-black">
          Skip to content
        </a>
        <Nav />
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 sm:px-6">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-7xl px-6 pb-8 text-sm text-muted">
          Built for accessibility · Handshapes and phrase signs are simplified approximations, not a replacement for a qualified interpreter.
        </footer>
      </body>
    </html>
  );
}
