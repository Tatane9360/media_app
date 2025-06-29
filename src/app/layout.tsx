import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import "./globals.css";
import "@uiw/react-md-editor/markdown-editor.css";

import { Navbar, Footer, Header } from "@components";

import ClientLayout from "./ClientLayout";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Sa dit koi - Contenu exclusif",
  description: "Sa Dit Koi ? est un média digital pensé pour les 18-25 ans : vidéos, articles et témoignages sur la santé mentale, le monde du travail, les galères étudiantes... Une info vraie, utile et sans filtre, dans un ton jeune et proche.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fff" />
      
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Media App" />
        <link rel="apple-touch-icon" href="/images/apple-icon.png" /> 
        <link rel="manifest" href="/manifest.json" />
        
      
      </head>
      <body
        className={`${poppins.variable} antialiased pb-16`}
        suppressHydrationWarning={true}
      >
        <ClientLayout
          loaderConfig={{
            videoSrc: "/videos/loader-main.mp4",
            fallbackVideoSrc: "/videos/loader-main.webm",
          }}
        >
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <Navbar />
        </ClientLayout>
      </body>
    </html>
  );
}
