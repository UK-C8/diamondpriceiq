import type { Metadata } from "next";
import { Oxygen } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { ApiInterestCTA } from "@/components/ApiInterestCTA";
import { GA4 } from "@/components/GA4";
import { DiamondIcon } from "@/components/DiamondIcon";

const oxygen = Oxygen({ variable: "--font-oxygen", subsets: ["latin"], display: "swap", weight: ["300", "400", "700"] });

export const metadata: Metadata = {
  title: "DiamondPrice IQ — Fair Diamond Price in 10 Seconds",
  description:
    "Get an instant, model-backed fair price range for any diamond based on its 4Cs — from the diamond capital. Free, mobile-first, no signup required.",
  keywords: ["diamond price", "diamond valuation", "4Cs", "diamond estimate", "GIA", "carat price"],
  openGraph: {
    title: "DiamondPrice IQ",
    description: "A diamond's fair price in 10 seconds, from the diamond capital.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oxygen.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 font-[family-name:var(--font-oxygen)]">
        <GA4 />
        {/* Skip to main content — WCAG 2.1 AA */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        {/* Top nav */}
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded">
              <DiamondIcon size={22} />
              <span>DiamondPrice<span className="text-amber-500"> IQ</span></span>
            </Link>
            <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-3">
              <Link href="/diamond-price-calculator" className="text-xs font-medium text-gray-500 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded px-1 hidden sm:inline">
                Calculator
              </Link>
              <Link href="/1-carat-diamond-price" className="text-xs font-medium text-gray-500 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded px-1 hidden sm:inline">
                1ct price
              </Link>
              <Link href="/diamond-parcel-valuation" className="text-xs font-medium text-gray-500 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded px-1 hidden sm:inline">
                Parcel
              </Link>
              <Link href="/methodology" className="text-xs font-medium text-gray-500 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded px-1">
                How it works
              </Link>
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1">{children}</main>

        {/* API interest CTA */}
        <ApiInterestCTA />

        {/* Persistent footer disclaimer */}
        <footer className="border-t border-gray-100 bg-white py-5 px-4">
          <div className="mx-auto max-w-2xl">
            <Disclaimer />
            <nav aria-label="Footer links" className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
              <Link href="/diamond-price-calculator" className="text-xs text-gray-400 hover:text-amber-700 underline">Calculator</Link>
              <Link href="/1-carat-diamond-price" className="text-xs text-gray-400 hover:text-amber-700 underline">1ct price guide</Link>
              <Link href="/diamond-parcel-valuation" className="text-xs text-gray-400 hover:text-amber-700 underline">Parcel valuation</Link>
              <Link href="/methodology" className="text-xs text-gray-400 hover:text-amber-700 underline">Methodology</Link>
              <Link href="/privacy" className="text-xs text-gray-400 hover:text-amber-700 underline">Privacy</Link>
            </nav>
            <p className="mt-3 text-center text-xs text-gray-400">
              Built by{" "}
              <a href="https://centr8.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700">
                Centr8 LLP
              </a>
              , Surat · India&apos;s diamond capital
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
