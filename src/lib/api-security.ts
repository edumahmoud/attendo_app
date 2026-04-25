// =====================================================
// API Security Utilities
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getSupabaseServerClient } from '@/lib/supabase-server';

// --- Rate Limiting (in-memory) ---

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

/** Check rate limit by IP. Returns { allowed, remaining, retryAfterMs } */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();

  // Clean up expired entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, retryAfterMs: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = entry.resetTime - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, retryAfterMs: 0 };
}

/** Create rate limit headers for the response */
export function getRateLimitHeaders(remaining: number, retryAfterMs: number): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
  };
  if (retryAfterMs > 0) {
    headers['Retry-After'] = String(Math.ceil(retryAfterMs / 1000));
  }
  return headers;
}

// --- Request Validation ---

const MAX_CONTENT_LENGTH = 1_000_000; // 1MB max request body

/** Validate request: content-type, body size. Returns error response or null if valid */
export function validateRequest(request: NextRequest): NextResponse | null {
  // Content-Type validation
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return NextResponse.json(
      { success: false, error: 'يجب أن يكون نوع المحتوى application/json' },
      { status: 415 }
    );
  }

  // Content-Length validation
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { success: false, error: 'حجم الطلب كبير جداً' },
      { status: 413 }
    );
  }

  return null;
}

// --- Input Sanitization ---

/** Sanitize a string input: trim, limit length, strip HTML */
export function sanitizeString(input: unknown, maxLength: number = 50000): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim().substring(0, maxLength);
}

/** Generic safe error response that doesn't leak internals */
export function safeErrorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

// --- Authentication Helpers ---

/**
 * Verify the authenticated user from the request.
 * Checks Bearer token first, then falls back to cookie-based session.
 * Returns the authenticated user object or null.
 */
export async function getAuthenticatedUser(request: Request) {
  // Try Bearer token first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (!error && user) return user;
  }

  // Fall back to cookie-based session
  try {
    const serverClient = await getSupabaseServerClient();
    const { data: { user }, error } = await serverClient.auth.getUser();
    if (!error && user) return user;
  } catch {}

  return null;
}

/**
 * Require authentication. Returns the user or an error response.
 * Usage: const { user, error } = requireAuth(request);
 *        if (error) return error;
 */
export async function requireAuth(request: Request): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>;
  error: null;
} | { user: null; error: NextResponse }> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      ),
    };
  }
  return { user, error: null };
}

/**
 * Get the user's role from the users table.
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const { data: profile } = await supabaseServer
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return (profile as { role: string } | null)?.role || null;
}

/**
 * Require that the authenticated user has one of the specified roles.
 * Returns the user or an error response.
 */
export async function requireRole(
  request: Request,
  roles: string[]
): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>;
  error: null;
} | { user: null; error: NextResponse }> {
  const { user, error } = await requireAuth(request);
  if (error) return { user: null, error };

  const role = await getUserRole(user.id);
  if (!role || !roles.includes(role)) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'غير مصرح بالوصول' },
        { status: 403 }
      ),
    };
  }
  return { user, error: null };
}

/**
 * Verify that a user is a participant in a conversation.
 */
export async function verifyConversationParticipant(userId: string, conversationId: string): Promise<boolean> {
  const { data } = await supabaseServer
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

/**
 * Validate that a URL is a safe HTTP(S) URL (prevents javascript: protocol).
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitize chat message content: strip HTML, limit length.
 */
export function sanitizeMessageContent(content: string, maxLength: number = 5000): string {
  if (typeof content !== 'string') return '';
  return content
    .replace(/<[^>]*>/g, '')        // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // strip control chars
    .trim()
    .substring(0, maxLength);
}
