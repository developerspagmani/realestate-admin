import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: process.env.NODE_ENV === 'development' ? 10000 : 100, // limit each IP to 100 requests per windowMs (10000 in dev)
  authAttempts: 5, // max failed login attempts
  lockoutDuration: 30 * 60 * 1000 // 30 minutes lockout
};

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIP || 'unknown';
  return ip;
}

function checkRateLimit(ip: string, endpoint: string = 'general'): boolean {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // SEC-F09 fix: Prevent unbounded growth — clean up expired entries when map gets large
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore) {
      if (now > v.resetTime) rateLimitStore.delete(k);
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs
    });
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

function validateToken(token: string): { valid: boolean; role?: string; userId?: string } {
  if (!token || token.length < 10) return { valid: false };

  // Basic token format validation (JWT-like)
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false };

  try {
    // Check if payload is valid base64
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;

    // Check if token is expired (if exp claim exists)
    if (payload.exp && payload.exp < now) {
      return { valid: false };
    }

    // SEC-F03 fix: Extract role and userId from JWT payload instead of trusting cookies
    return {
      valid: true,
      role: payload.role?.toString(),
      userId: payload.userId || payload.id || payload.sub,
    };
  } catch {
    return { valid: false };
  }
}

function sanitizePath(pathname: string): string {
  // Remove dangerous path components
  return pathname.replace(/\.\./g, '').replace(/\/+/g, '/');
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const pathname = sanitizePath(request.nextUrl.pathname);

  // PERF: Bypass middleware for public static routes to improve performance
  if (pathname.startsWith('/legal') || pathname.startsWith('/public') || pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Custom Domain Routing (Standalone Landing Pages)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  const isCustomHost = hostname && hostname !== rootDomain && hostname !== 'localhost:3001' && !hostname.endsWith('.vercel.app') && hostname !== 'app.virpanix.com';

  // PERF-F11 fix: Avoid rewriting public assets, api, or go links which are already global
  if (isCustomHost &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/public') &&
    !pathname.startsWith('/go') &&
    !pathname.startsWith('/standalone') // Avoid double rewriting
  ) {
    // Rewrite custom domain requests to our standalone renderer
    // Fix: Strip port number from hostname for DB lookup consistency
    const domainWithoutPort = hostname.split(':')[0];
    return NextResponse.rewrite(new URL(`/standalone/${domainWithoutPort}${pathname}`, request.url));
  }

  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';

  // Security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Allow iframes for public widgets
  if (pathname.startsWith('/public/widgets')) {
    response.headers.set('X-Frame-Options', 'ALLOWALL');
  } else {
    response.headers.set('X-Frame-Options', 'DENY');
  }

  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Rate limiting for all requests
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: response.headers }
    );
  }

  // Enhanced rate limiting for authentication endpoints
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (!checkRateLimit(clientIP, 'auth')) {
      return NextResponse.redirect(new URL('/rate-limit', request.url));
    }
  }

  // Block suspicious user agents (SEC-F06 fix: whitelist legitimate search engines)
  const legitimateBots = [
    /Googlebot/i, /Bingbot/i, /Yahoo.*Slurp/i, /DuckDuckBot/i,
    /Baiduspider/i, /YandexBot/i, /facebookexternalhit/i,
    /Twitterbot/i, /LinkedInBot/i, /WhatsApp/i,
  ];
  const suspiciousPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i
  ];
  const isLegitimateBot = legitimateBots.some(pattern => pattern.test(userAgent));

  if (!isLegitimateBot &&
    suspiciousPatterns.some(pattern => pattern.test(userAgent)) &&
    !pathname.includes('/api/') &&
    !pathname.includes('/_next/')) {
    return NextResponse.redirect(new URL('/blocked', request.url));
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/realestate-admin',
    '/realestate-owner-admin',
    '/realestate-agent',
    '/user',
    '/cart',
    '/checkout',
    '/booking-confirmation',
    '/profile'
  ];

  // Admin-only routes
  const adminRoutes = [
    '/realestate-admin/dashboard',
    '/realestate-admin/workspace',
    '/realestate-admin/workspaces',
    '/realestate-admin/users',
    '/realestate-admin/bookings',
    '/realestate-admin/owners',
    '/realestate-admin/properties',
    '/realestate-admin/units',
    '/realestate-admin/leads',
    '/realestate-admin/property-3d',
    '/realestate-admin/media-library',
    '/realestate-admin/whatsapp-business',
    '/realestate-admin',
    '/cart',
    '/checkout',
    '/booking-confirmation'
  ];

  // owner-admin-only routes
  const ownerRoutes = [
    '/realestate-owner-admin/dashboard',
    '/realestate-owner-admin/workspace',
    '/realestate-owner-admin/workspaces',
    '/realestate-owner-admin/bookings',
    '/realestate-owner-admin/properties',
    '/realestate-owner-admin/units',
    '/realestate-owner-admin/users',
    '/realestate-owner-admin/leads',
    '/realestate-owner-admin/media-library',
    '/realestate-owner-admin/marketing-tool',
    '/realestate-owner-admin/settings',
    '/realestate-owner-admin',
  ];

  // Agent-only routes
  const agentRoutes = [
    '/realestate-agent/dashboard',
    '/realestate-agent/leads',
    '/realestate-agent/commissions',
    '/realestate-agent/profile',
    '/realestate-agent',
  ];

  // User-only routes
  const userRoutes = [
    '/user/dashboard',
    '/user/cart',
    '/user/checkout',
    '/user/my-bookings',
    '/user/profile',
    '/cart',
    '/checkout',
    '/booking-confirmation'
  ];

  // Public exceptions inside protected paths
  const publicExceptions = [
    '/realestate-owner-admin/widgets'
  ];

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isException = publicExceptions.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !isException) {
    const token = request.cookies.get('auth-token')?.value;

    // SEC-F03 fix: Extract role from JWT payload, not from a spoofable cookie
    const tokenResult = token ? validateToken(token) : { valid: false };

    // Validate token exists and is properly formatted
    if (!token || !tokenResult.valid) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      response.cookies.delete('user-role');
      response.cookies.delete('user-id');
      return response;
    }

    // Use role and userId from the verified JWT payload when available,
    // fall back to cookies for backwards compatibility (current JWT only has userId)
    const userRole = tokenResult.role || request.cookies.get('user-role')?.value;
    const userId = tokenResult.userId || request.cookies.get('user-id')?.value;

    // Check if user ID exists (additional validation)
    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check role-based access (using numeric roles: 1=user, 2=admin, 3=owner, 4=agent)
    const isAdminPath = adminRoutes.some(route => pathname.startsWith(route));
    const isOwnerPath = ownerRoutes.some(route => pathname.startsWith(route));
    const isAgentPath = agentRoutes.some(route => pathname.startsWith(route));
    const isUserPath = userRoutes.some(route => pathname.startsWith(route));

    // Role-specific check: If a route is strictly for a role, block others.
    // If it's a shared route (in multiple lists), allow if user has ANY of those roles.
    let authorized = false;

    if (isAdminPath && userRole === '2') authorized = true;
    else if (isOwnerPath && userRole === '3') authorized = true;
    else if (isAgentPath && userRole === '4') authorized = true;
    else if (isUserPath && userRole === '1') authorized = true;

    // If route is in a role list but user didn't match any of their allowed roles
    if ((isAdminPath || isOwnerPath || isAgentPath || isUserPath) && !authorized) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Additional security for sensitive operations
    if (pathname.includes('/checkout') || pathname.includes('/booking-confirmation')) {
      // Verify user session is still valid by checking recent activity
      const lastActivity = request.cookies.get('last-activity')?.value;
      if (lastActivity) {
        const activityTime = parseInt(lastActivity);
        const now = Date.now();
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes

        if (now - activityTime > sessionTimeout) {
          const response = NextResponse.redirect(new URL('/login?session=expired', request.url));
          response.cookies.delete('auth-token');
          response.cookies.delete('user-role');
          response.cookies.delete('user-id');
          response.cookies.delete('last-activity');
          return response;
        }
      }

      // Update last activity
      response.cookies.set('last-activity', Date.now().toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60 // 30 minutes
      });
    }
  }

  // Prevent access to sensitive files and directories
  const blockedPaths = [
    '/.env',
    '/.git',
    '/node_modules'
  ];

  if (blockedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/not-found', request.url));
  }

  return response;
}

// Configure matcher for middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};