import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3100";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Chohan Industries | Trade that moves possibility",
    template: "%s | Chohan Industries",
  },
  description: "Chohan Industries connects trusted products, practical expertise and responsible logistics for businesses and communities.",
  keywords: ["Chohan Industries", "agriculture", "food systems", "trade logistics", "industrial materials", "renewable energy"],
  alternates: { canonical: "/chohan-industries" },
  openGraph: {
    type: "website",
    siteName: "Chohan Industries",
    title: "Chohan Industries | Trade that moves possibility",
    description: "Trusted products, practical expertise and responsible logistics.",
    url: "/chohan-industries",
  },
  twitter: { card: "summary_large_image", title: "Chohan Industries", description: "Trade that moves possibility." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function ChohanIndustriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
