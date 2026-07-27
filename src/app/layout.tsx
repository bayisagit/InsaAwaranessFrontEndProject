import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { NavigationWrapper } from "@/components/NavigationWrapper";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "INSA Cyber Awareness",
  description: "National Cyber Security Awareness Creation Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col antialiased transition-colors duration-200`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:outline-none focus:ring-2 focus:ring-background focus:ring-offset-2 focus:ring-offset-primary focus:text-sm focus:font-semibold"
          >
            Skip to main content
          </a>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID"}>
            <AuthProvider>
              <TooltipProvider>
                <NavigationWrapper Header={<Header />} Footer={<Footer />}>
                  <main id="main-content" className="flex-1 flex flex-col outline-none w-full" tabIndex={-1}>
                  {children}
                </main>
              </NavigationWrapper>
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
      </body>
    </html>
  );
}
