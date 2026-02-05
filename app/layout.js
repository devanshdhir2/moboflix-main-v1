// app/layout.js
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

// --- SEO & METADATA CONFIGURATION ---
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  // 1. Title Template: "Page Name | Moboflix"
  title: {
    default: "Moboflix | Premium At-Home Mobile Repair",
    template: "%s | Moboflix",
  },
  description: "Elite at-home mobile repair service. Certified technicians, premium parts, and gold-standard warranty delivered to your doorstep.",

  // 2. Browser Tab Icons (Favicons)
  // This makes the logo appear on the browser tab
  icons: {
    icon: "/mobologo.png",        // Use your PNG logo as the main icon
    shortcut: "/mobologo.png",
    apple: "/mobologo.png",       // Fallback for Apple devices
  },

  // 3. Social Media Previews (Open Graph)
  // This makes the logo appear when sharing on WhatsApp/Facebook/LinkedIn
  openGraph: {
    title: "Moboflix | Elite Mobile Care",
    description: "Experience the ultimate in convenience. Certified technicians, premium parts, right at your doorstep.",
    url: "https://moboflix.com", // Replace with your actual domain
    siteName: "Moboflix",
    images: [
      {
        url: "/mobologo.png",
        width: 800,
        height: 600,
        alt: "Moboflix Gold Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // 4. Manifest for mobile install
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  // 5. JSON-LD Structured Data (For Google Search Logo & SEO)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Moboflix",
    "url": "https://moboflix.com", // Replace with your actual domain
    "logo": "https://moboflix.com/mobologo.png", // Helps Google show this image in search results
    "description": "Premium At-Home Repair Service",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-8360003700",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi", "pa"]
    },
    "sameAs": [
      // Add your social media links here if you have them, e.g.:
      // "https://instagram.com/moboflix",
      // "https://facebook.com/moboflix"
    ]
  };

  return (
    <html lang="en" className="dark">
      <head>
        {/* Inject JSON-LD for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-black min-h-screen antialiased selection:bg-yellow-500/30">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
