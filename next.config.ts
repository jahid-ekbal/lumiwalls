import type { NextConfig } from "next";
import "./src/lib/env/clientEnv";
import { serverEnv } from "./src/lib/env/serverEnv";

let s3Origin = "";
try {
  s3Origin = new URL(serverEnv.S3_ENDPOINT).origin;
} catch {
  s3Origin = "";
}

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${s3Origin ? ` ${s3Origin}` : ""}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  ...(process.env.NODE_ENV === "production" ?
    [
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      },
    ]
  : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  async redirects() {
    return [
      {
        source: "/admin/taxonomy",
        destination: "/admin/categories",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
