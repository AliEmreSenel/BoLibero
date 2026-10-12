import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_TITLE, SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: SITE_TITLE,
    description: "Find free study rooms at Bocconi University",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="google-site-verification" content="KGE-VzUzN6SwZcRTn5u900W3OUqkOCyABh-MGaqLsho" />
                {/* Reading the cookie in the server render would make every page
                    dynamic; this runs before paint, so lang is correct pre-paint. */}
                <script
                  dangerouslySetInnerHTML={{
                    __html:
                      "try{var m=document.cookie.match(/(?:^|;\\s*)bolibero_lang=(en|it)(?:;|$)/);if(m)document.documentElement.lang=m[1];}catch(e){}",
                  }}
                />
            </head>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
