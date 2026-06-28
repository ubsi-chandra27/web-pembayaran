import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Web Pembayaran dan Tabungan TK Islam Azkia",
    short_name: "Azkia Bayar",
    description: "Portal pembayaran sekolah dan tabungan siswa TK Islam Azkia.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#078435",
    orientation: "portrait",
    icons: [
      {
        src: "/logo-tk-azkia-transparent.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/logo-tk-azkia.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
