import type { Metadata, Viewport } from "next";
import { Hedvig_Letters_Serif, Instrument_Sans, Public_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { DialogHost } from "@/components/dialog";

/* Design System v2: Hedvig Letters Serif (headings) + Instrument Sans (text).
   The wordmark uses Instrument Sans + Times New Roman (system font, see ds.css).
   Public Sans stays for Admin. */
const hedvig = Hedvig_Letters_Serif({
  variable: "--font-hedvig",
  subsets: ["latin"],
  weight: "400",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "HumanSoul", template: "%s · HumanSoul" },
  description: "A quiet place to notice yourself, record your journal, and explore guided journeys of personal growth.",
  applicationName: "HumanSoul",
  openGraph: { siteName: "HumanSoul", title: "HumanSoul", type: "website" },
  appleWebApp: { capable: true, title: "HumanSoul", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

/* The status bar and browser chrome follow the app's own background in light and dark. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F4" },
    { media: "(prefers-color-scheme: dark)", color: "#141312" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hedvig.variable} ${instrumentSans.variable} ${publicSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col selection:bg-[var(--ds-accent)]/20 selection:text-[var(--ds-text)]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <DialogHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
