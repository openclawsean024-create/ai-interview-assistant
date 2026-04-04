/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // GitHub Pages support
  basePath: process.env.GITHUB_PAGES ? '/ai-interview-assistant' : '',
  // Static export for GitHub Pages (disables API routes)
  output: process.env.GITHUB_PAGES ? 'export' : undefined,
  images: {
    unoptimized: process.env.GITHUB_PAGES ? true : undefined,
  },
  // Ensure trailing slashes for GitHub Pages compatibility
  trailingSlash: true,
};

module.exports = nextConfig;
