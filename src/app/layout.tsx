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
  title: "Media App - Admin Panel",
  description: "Admin panel for media application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fff" />
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
