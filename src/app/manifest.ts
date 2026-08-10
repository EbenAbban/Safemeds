import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest by Next's metadata routing.
export default function manifest(): MetadataRoute.Manifest {
  return {
    // `id` pins app identity. Without it the browser derives identity from
    // start_url, and changing start_url later would register as a *different*
    // app — orphaning everyone's existing home-screen icon.
    id: "/",
    name: "SafeMeds — Anonymous Student Healthcare",
    short_name: "SafeMeds",
    description:
      "Secure, anonymous healthcare consultations for students. Professional medical advice from licensed pharmacists.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    categories: ["medical", "health", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Start a consultation",
        short_name: "Consult",
        url: "/consult",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Track a delivery",
        short_name: "Track",
        url: "/track",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
