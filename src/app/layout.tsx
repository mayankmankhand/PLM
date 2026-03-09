// Root layout - applies Inter font and global styles.
// Font: minimal-clean pairing (Inter for both heading and body).

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PLM - Product Lifecycle Management",
  description:
    "Manage product requirements, test procedures, and test cases through conversation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-body">{children}</body>
    </html>
  );
}
