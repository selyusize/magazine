import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler через babel-plugin-react-compiler (Next применяет его только к файлам с JSX/хуками)
  reactCompiler: true,
  output: "standalone",
  // Без заголовка X-Powered-By: Next.js
  poweredByHeader: false,
};

export default nextConfig;
