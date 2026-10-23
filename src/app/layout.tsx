import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { NavigationWrapper } from "@/components/NavigationWrapper";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import NextTopLoader from 'nextjs-toploader';
import { PwaManager } from "@/components/pwa/PwaManager";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#11132c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "INSA Cyber Awareness | National Cybersecurity Portal",
    template: "%s | INSA Cyber Awareness",
  },
  description: "National Cyber Security Awareness Creation Portal - Empowering Ethiopian Citizens and Organizations with Cybersecurity Knowledge and Tools.",
  applicationName: "INSA CyberSafe",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "INSA CyberSafe",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="INSA CyberSafe" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if (typeof window !== 'undefined' && window.location.hostname === '0.0.0.0') { window.location.replace('http://localhost:' + (window.location.port || '3000') + window.location.pathname + window.location.search); }`,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col antialiased transition-colors duration-200`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader color="var(--color-primary)" showSpinner={false} height={3} shadow="0 0 10px var(--color-primary),0 0 5px var(--color-primary)" />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:outline-none focus:ring-2 focus:ring-background focus:ring-offset-2 focus:ring-offset-primary focus:text-sm focus:font-semibold"
          >
            Skip to main content
          </a>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID"}>
            <AuthProvider>
              <TooltipProvider>
                <PwaManager>
                  <NavigationWrapper Header={<Header />} Footer={<Footer />}>
                    <main id="main-content" className="flex-1 flex flex-col outline-none w-full" tabIndex={-1}>
                      {children}
                    </main>
                  </NavigationWrapper>
                </PwaManager>
              </TooltipProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: "bg-card text-card-foreground border border-border shadow-lg shadow-black/10 dark:shadow-none",
                  style: {
                    borderRadius: '10px',
                    fontSize: '14px',
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--color-success)',
                      secondary: 'var(--color-background)',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'var(--color-destructive)',
                      secondary: 'var(--color-background)',
                    },
                  },
                }}
              />
            </AuthProvider>
          </GoogleOAuthProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
      </body>
    </html>
  );
}
