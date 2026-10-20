import type { MetadataRoute } from "next";

// Absolute root paths match the existing cPanel frontend deployment.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "UrbanHelpHub",
    short_name: "UrbanHelpHub",
    description: "Trusted local help, wherever you are.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#082f5b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
