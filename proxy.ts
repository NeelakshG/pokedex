import { auth } from "@/lib/auth";

export { auth as proxy }

export const config = {
  matcher: ["/favorites/:path*", "/teams/:path*"]
}