import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CyberSafe Nation",
  description: "National Cyber Security Awareness Creation Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white text-gray-900 flex flex-col antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID"}>
          <AuthProvider>
            <Header />
            <main id="main-content" className="flex-1 flex flex-col outline-none" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '10px',
                  background: '#1e293b',
                  color: '#fff',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#16a34a',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#dc2626',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
