/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
      // Enable WebAssembly
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };
      
      // Configure worker loader
      config.module.rules.push({
        test: /\.worker\.js$/,
        loader: 'worker-loader',
        options: {
          filename: 'static/chunks/[name].[contenthash].js',
        },
      });
  
      // Explicitly set fs: false to prevent fs module being included
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
      };
      
      return config;
    }
  };
  
  export default nextConfig;