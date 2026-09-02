import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif-var", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "Human Arena", template: "%s · Human Arena" },
  description: "A Claude-like training environment. Learn AI by doing timed challenges in a safe, instrumented chat.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#faf9f5" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`} suppressHydrationWarning>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
