

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["postgres"],
  },
  async redirects() {
    return [
      { source: "/fixture-builder", destination: "/dry-run", permanent: false },
    ];
  },
};

export default nextConfig;
