import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Great_Vibes, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import PwaRegister from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  weight: "400",
  variable: "--font-great-vibes",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dadashri Designers",
  description: "Couture â€¢ Fashion â€¢ Quality â€” Tailoring Workshop Management",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/Logo.png",
    apple: "/Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="offline-auth-restore" strategy="beforeInteractive">{`
          (function () {
            try {
              if (typeof window === 'undefined' || window.navigator.onLine) return;
              if (window.location.pathname !== '/') return;
              if (window.localStorage.getItem('indigo-dashboard-authenticated') === 'true') {
                window.location.replace('/dashboard');
              }
            } catch (_) {}
          })();
        `}</Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${greatVibes.variable} ${cormorant.variable} antialiased`}
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
