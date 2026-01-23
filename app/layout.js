// app/layout.js
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Moboflix",
  description: "Premium At-Home Repair Service",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    // apply font on <html> so server/client markup is identical
    <html lang="en" className={inter.className}>
      <body>
        {/* AuthProvider is a client component (context/AuthContext.js starts with "use client") */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
