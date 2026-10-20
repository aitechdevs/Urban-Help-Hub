import type { Metadata, Viewport } from "next";
import "./globals.css";
import LanguageProvider from "@/components/LanguageProvider";
import PwaSupport from "@/components/PwaSupport";

export const metadata: Metadata = {
  applicationName: "UrbanHelpHub",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "UrbanHelpHub", statusBarStyle: "default" },
  icons: { apple: "/icons/icon-192.png" },
  title: "UrbanHelpHub | Local Help Across Canada",
  description:
    "Find trusted local help for cleaning, moving, assembly, delivery, errands, home repairs and more across Canada.",
};

export const viewport: Viewport = { themeColor: "#082f5b" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><LanguageProvider>{children}<PwaSupport /></LanguageProvider></body>
    </html>
  );
}
