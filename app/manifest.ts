import type { MetadataRoute } from "next";

/* Lets HumanSoul be added to a phone's home screen and open full screen, like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HumanSoul",
    short_name: "HumanSoul",
    description: "A quiet place to notice yourself.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#141312",
    theme_color: "#4F6E55",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
