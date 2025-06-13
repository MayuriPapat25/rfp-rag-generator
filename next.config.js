/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is the key part for externalizing modules in Webpack
  webpack: (config, { isServer }) => {
    // Only externalize 'faiss-node' on the server-side build.
    // 'faiss-node' is a native module and should not be bundled for the client.
    if (isServer) {
      config.externals.push("faiss-node");
    }

    return config;
  },
  // Other Next.js configurations can go here
  // For example, if you're using App Router
  // experimental: {
  //   appDir: true,
  // },
};

module.exports = nextConfig;
