import { handlers } from "@/auth";

// This enables next-auth to handle all auth requests
export const { GET, POST } = handlers;

// Set cache-control headers to prevent caching
export async function headers() {
  return {
    "Cache-Control": "no-store, max-age=0",
  };
}
