import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif-var", weight: ["400", "500", "600"] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://human-arena-kappa.vercel.app";
const DESCRIPTION = "Learn AI by doing. 32 timed challenges inside a chat that watches what you click. Nothing here is real, so click anything.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "How to AI Games", template: "%s · How to AI Games" },
  description: DESCRIPTION,
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }], apple: "/apple-touch-icon.png" },
  openGraph: { title: "How to AI Games", description: DESCRIPTION, siteName: "How to AI Games", type: "website", url: SITE },
  twitter: { card: "summary_large_image", title: "How to AI Games", description: DESCRIPTION },
};

export const viewport: Viewport = { themeColor: "#faf9f5" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`} suppressHydrationWarning>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
