import type { NextConfig } from "next";

/* Project Pages serve from https://<user>.github.io/<repo>/, so every URL the
   app emits needs that prefix. The workflow sets NEXT_PUBLIC_BASE_PATH; leave
   it empty for a local build, or once a custom domain serves the site from its
   own root. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Pages is a static host: no server, so no route handlers or server actions
  output: "export",
  basePath,
  // the image optimiser needs a server; the assets are already webp/jpeg
  images: { unoptimized: true },
};

export default nextConfig;
