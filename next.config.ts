import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/validation-hub/:path*',
        destination: '/validation/:path*',
        permanent: true,
      },
      {
        source: '/marketing-hub/:path*',
        destination: '/marketing/:path*',
        permanent: true,
      },
      {
        source: '/sales-hub/:path*',
        destination: '/sales/:path*',
        permanent: true,
      },
      {
        source: '/finance-hub/:path*',
        destination: '/finance/:path*',
        permanent: true,
      },
      {
        source: '/legal&compliance/:path*',
        destination: '/legal/:path*',
        permanent: true,
      },
      {
        source: '/legal-compliance/:path*',
        destination: '/legal/:path*',
        permanent: true,
      },
      {
        source: '/funding-hub/:path*',
        destination: '/funding/:path*',
        permanent: true,
      },
      {
        source: '/investor-readiness-hub/:path*',
        destination: '/investor-readiness/:path*',
        permanent: true,
      },
      {
        source: '/marketplace-hub/:path*',
        destination: '/marketplace/:path*',
        permanent: true,
      },
      {
        source: '/learning-academy/:path*',
        destination: '/academy/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
