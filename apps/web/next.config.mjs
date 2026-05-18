/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Source-only workspace packages are compiled by Next.
  transpilePackages: ['@vesta/design-system', '@vesta/api-contracts', '@vesta/i18n'],
};

export default nextConfig;
