// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext"; // 👈 1. Import the provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ABS Web", // Change as needed
  description: "ABS Educational Solution Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 👇 2. Wrap your children with the provider */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}