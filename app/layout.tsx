import { ReactNode } from 'react';
import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from '@/app/ClientProviders';
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });


// PERF-F09 fix: Proper SEO metadata (requires Server Component)
// FUNC-F07 fix: Updated description from "co-working" to real estate
export const metadata: Metadata = {
  title: "Virpanix - Intelligent Real Estate Platform",
  description: "Modern real estate management platform with AI-powered analytics, lead tracking, and property management tools.",
};

interface LayoutProps {
  children: ReactNode;
}

/**
 * PERF-F01 fix: Root layout is now a Server Component.
 * Previously had 'use client' which made the entire app client-rendered,
 * losing all SSR, RSC, and SEO benefits of Next.js App Router.
 */
export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Bootstrap Icons CDN - keeping for now as it's not in node_modules yet */}
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning={true}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>

    </html>
  );
}
