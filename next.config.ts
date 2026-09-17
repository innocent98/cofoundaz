import type { NextConfig } from "next";

// Local-dev only: proxy ALL /api/v1 calls to the real API server-side. The
// browser then talks same-origin (localhost:3000) so there's no CORS, and
// `beforeFiles` runs ahead of the local mock route handlers, so real endpoints
// win over the mocks. Override the target with API_PROXY_TARGET. Never enabled
// in preview/production — there the client calls the API origin directly (which
// must allow the app origin via CORS) through NEXT_PUBLIC_API_BASE_URL.
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET || "https://staging-api.cofoundaz.com";

const devApiProxy: Pick<NextConfig, "rewrites"> =
  process.env.NODE_ENV === "development"
    ? {
        async rewrites() {
          return {
            beforeFiles: [
              {
                source: "/api/v1/:path*",
                destination: `${API_PROXY_TARGET}/api/v1/:path*`,
              },
            ],
          };
        },
      }
    : {};

const nextConfig: NextConfig = {
  ...devApiProxy,
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
