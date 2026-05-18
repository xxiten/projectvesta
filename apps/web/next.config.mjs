/**
 * The browser calls the API same-origin under `/api/*`; Next proxies it
 * server-side to the API service. This removes CORS and — crucially — any
 * build-time API URL, so the web image is portable/reproducible (required for
 * the GHCR registry-based deploy). `API_PROXY_TARGET` is a *runtime* env read
 * at server start (next start), defaulting to local dev.
 *
 * @type {import('next').NextConfig}
 */
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://localhost:3001';

const nextConfig = {
  reactStrictMode: true,
  // Source-only workspace packages are compiled by Next.
  transpilePackages: ['@vesta/design-system', '@vesta/api-contracts', '@vesta/i18n'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_PROXY_TARGET}/:path*` }];
  },
};

export default nextConfig;
