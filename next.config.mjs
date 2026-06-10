/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  experimental: {
    // Permite subir varias fotos del plan en un mismo request.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
