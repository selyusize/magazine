import type { NextConfig } from "next";

/**
 * Откуда next/image может брать фото товаров: сам бэкенд Medusa (локальный файловый провайдер)
 * и хосты из IMAGE_REMOTE_HOSTS через пробел или запятую — S3, CDN, MinIO. Читается при сборке.
 */
const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000").origin;
const imageHosts = (process.env.IMAGE_REMOTE_HOSTS ?? "").split(/[\s,]+/).filter(Boolean);

const nextConfig: NextConfig = {
  // React Compiler через babel-plugin-react-compiler (Next применяет его только к файлам с JSX/хуками)
  reactCompiler: true,
  output: "standalone",
  // Без заголовка X-Powered-By: Next.js
  poweredByHeader: false,
  images: {
    remotePatterns: [new URL(`${apiOrigin}/**`), ...imageHosts.map((hostname) => ({ protocol: "https" as const, hostname }))],
  },
};

export default nextConfig;
