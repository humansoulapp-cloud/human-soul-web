import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, Instrument_Sans, Public_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

/* Design System v2: Fraunces (headings, SOFT axis) + Instrument Sans (text).
   DM Sans and Bernstein only draw the wordmark. Public Sans stays for Admin. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["500"],
});

const bernstein = localFont({
  variable: "--font-bernstein",
  src: "./fonts/BernsteinSerial-Regular.ttf",
  weight: "400",
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "The Human Soul — A quiet place to notice yourself",
  description: "A quiet place to notice yourself, record your journal, and explore guided journeys of personal growth.",
  applicationName: "HumanSoul",
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
      className={`${fraunces.variable} ${instrumentSans.variable} ${dmSans.variable} ${bernstein.variable} ${publicSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col selection:bg-[var(--ds-accent)]/20 selection:text-[var(--ds-text)]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
