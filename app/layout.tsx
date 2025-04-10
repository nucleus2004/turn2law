"use client";

import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { Toaster } from 'sonner'
import Chatbot from '@/components/Chatbot'

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-black`}>
        <SessionProvider>
          {children}
          <Toaster position="top-right" />
          <Chatbot />
        </SessionProvider>
      </body>
    </html>
  );
}
