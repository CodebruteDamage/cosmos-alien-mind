"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/**
 * Browser auth client. The Next.js adapter proxies auth requests through
 * /api/auth, so the upstream Neon Auth URL stays server-side.
 */
export const authClient = createAuthClient();
