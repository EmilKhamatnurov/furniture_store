import type { MetadataRoute } from "next";

// ---------------------------------------------------------------------------
// Web App Manifest — /manifest.webmanifest. PWA metadata + correct icons in
// browser tabs, "add to home screen", and some search surfaces.
// ---------------------------------------------------------------------------
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KHAMATNUROV MEBEL — мебель ручной работы",
    short_name: "KHAMATNUROV MEBEL",
    description:
      "Тестовая витрина современной предметной мебели из Уфы.",
    start_url: "/",
    display: "standalone",
    lang: "ru-RU",
    background_color: "#FBFAF6",
    theme_color: "#161613",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
