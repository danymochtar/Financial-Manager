import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Financial Manager",
    short_name: "Finance",
    description:
      "Personal financial manager untuk track duit masuk/keluar di MYR & IDR, dengan OCR receipt Claude Vision.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2c37f5",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
