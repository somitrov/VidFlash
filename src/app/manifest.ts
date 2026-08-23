import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VidFlash.in - Videos on Flash!",
    short_name: "VidFlash",
    description:
      "Automated video editing and in-browser audiobook to YouTube MP4 conversion suite with zero server uploads.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
