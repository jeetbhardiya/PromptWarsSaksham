/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure API keys never leak to client bundle
  serverRuntimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
  // Only expose safe public vars
  publicRuntimeConfig: {},
  images: {
    remotePatterns: [],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
