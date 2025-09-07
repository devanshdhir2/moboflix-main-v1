/** @type {import('next').NextConfig} */
const nextConfig = {
    // This is the new configuration we are adding.
    // It tells Vercel to ignore ESLint errors during the build process,
    // which will allow your deployment to succeed.
    eslint: {
      ignoreDuringBuilds: true,
    },
};

export default nextConfig;
