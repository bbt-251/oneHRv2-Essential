/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    // Disable default CORS behavior
    // experimental: {
    //     allowMiddlewareResponseBody: true,
    // },
    // Override any default CORS headers
    async rewrites() {
        return [];
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    reactStrictMode: true,
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: "frame-ancestors 'self';",
                    },
                    {
                        key: "Cache-Control",
                        value: "no-cache, no-store, must-revalidate, private, s-maxage=0",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    {
                        key: "Pragma",
                        value: "no-cache",
                    },
                    {
                        key: "Expires",
                        value: "0",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains",
                    },

                    {
                        key: "Server",
                        value: "nginx",
                    },
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "off",
                    },
                    {
                        key: "X-Download-Options",
                        value: "noopen",
                    },
                    {
                        key: "X-Permitted-Cross-Domain-Policies",
                        value: "none",
                    },
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "unsafe-none",
                    },
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                    {
                        key: "Cross-Origin-Resource-Policy",
                        value: "cross-origin",
                    },
                    {
                        key: "X-Vercel-Id",
                        value: "masked",
                    },
                ],
            },
            {
                source: "/manifest.json",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/manifest+json",
                    },
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "https://onehr.solutions",
                    },
                    {
                        key: "Cache-Control",
                        value: "public, max-age=3600",
                    },
                    {
                        key: "Server",
                        value: "nginx",
                    },
                ],
            },
            {
                source: "/_next/static/(.*)",
                headers: [
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains",
                    },
                    {
                        key: "Server",
                        value: "nginx",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                ],
            },
        ];
    },
    turbopack: {},
    // SVG Icon
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: [{ loader: "@svgr/webpack", options: { icon: true } }],
        });

        // Handle node:buffer and other node built-ins
        config.resolve.fallback = {
            ...config.resolve.fallback,
            buffer: false,
            fs: false,
            https: false,
            http: false,
            net: false,
            events: false,
        };

        return config;
    },
};

export default nextConfig;
