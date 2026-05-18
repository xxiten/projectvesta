/**
 * The browser calls the API same-origin under `/api/*`; a Node route handler
 * (app/api/[...path]/route.ts) proxies it to the API service at *request time*.
 *
 * NOTE: next.config `rewrites()` is baked into the build manifest at
 * `next build`, so it cannot read a runtime env in a prebuilt image — that's
 * why the proxy is a route handler, not a rewrite.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Source-only workspace packages are compiled by Next.
  transpilePackages: ['@vesta/design-system', '@vesta/api-contracts', '@vesta/i18n'],
};

export default nextConfig;
