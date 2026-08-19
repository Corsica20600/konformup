import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  outputFileTracingIncludes: {
    "/api/pdf/certificate/**": ["./documents/Signature/Signature_Karine.jpg"],
    "/api/pdf/convocation/**": ["./documents/Signature/Signature_Karine.jpg"],
    "/api/pdf/training-agreement/**": ["./documents/Signature/Signature_Karine.jpg"]
  }
};

export default nextConfig;
