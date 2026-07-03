import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/diamond-price-calculator",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
