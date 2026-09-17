import type { NextConfig } from "next";

// Local-dev only: any /api/v1 path not served by a local mock route handler
// falls back to staging so the app stays usable offline. Never enabled in
// preview/production builds — there, unmatched /api/v1 calls 404 instead of
// silently proxying to staging.
const devApiFallback: Pick<NextConfig, "rewrites"> =
  process.env.NODE_ENV === "development"
    ? {
        async rewrites() {
          return {
            fallback: [
              {
                source: "/api/v1/:path*",
                destination: "https://staging-api.cofoundaz.com/api/v1/:path*",
              },
            ],
          };
        },
      }
    : {};

const nextConfig: NextConfig = {
  ...devApiFallback,
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
