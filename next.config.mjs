/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Lint errors will not fail the production build.
        // Run `npm run lint` manually to check for issues.
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Type errors will not fail the production build either.
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
