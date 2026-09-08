import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface DecodedToken {
  userId: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'SHOP_OWNER' | 'ADMIN';
  shopId?: string;
  exp?: number;
}

function parseJwt(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);

    // Check expiration if present
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      return null;
    }

    return parsed;
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, api routes, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('printporter_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const session = token ? parseJwt(token) : null;

  // 1. Admin Routes Protection (/admin/*)
  if (pathname.startsWith('/admin')) {
    if (!session || session.role !== 'ADMIN') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('role', 'admin');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Printer Dashboard Routes Protection (/printer/dashboard, /printer/printers, etc.)
  // Note: /printer/register and /printer/login are public!
  if (
    pathname.startsWith('/printer') &&
    !pathname.startsWith('/printer/register') &&
    !pathname.startsWith('/printer/login')
  ) {
    if (!session || (session.role !== 'SHOP_OWNER' && session.role !== 'ADMIN')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('role', 'printer_owner');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Customer Dashboard Protection (/user/*)
  if (pathname.startsWith('/user')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('role', 'customer');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/printer/:path*', '/user/:path*'],
};
