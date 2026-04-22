import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Seberapa Boros Lo?",
    short_name: "Boros?",
    description: "Catet keborosan, pantau dompet, jadi lebih hemat.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7fdf9",
    theme_color: "#059669",
    orientation: "portrait",
    categories: ["finance", "lifestyle", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
