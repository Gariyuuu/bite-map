import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "picsum.photos" },
      { hostname: "fastly.picsum.photos" },
      { hostname: "places.googleapis.com" },
      { hostname: "s3-media0.fl.yelpcdn.com" },
      { hostname: "s3-media1.fl.yelpcdn.com" },
      { hostname: "s3-media2.fl.yelpcdn.com" },
      { hostname: "s3-media3.fl.yelpcdn.com" },
      { hostname: "s3-media4.fl.yelpcdn.com" },
      { hostname: "fastly.4sqi.net" },
      { hostname: "img.clerk.com" },
      { hostname: "utfs.io" },
    ],
  },
};

export default nextConfig;
