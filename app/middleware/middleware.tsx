import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Since middleware runs on the server, we can't directly access localStorage
  // Instead, we'll check for the token in the Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/signup');

  if (!token && !isAuthPage) {
    // Redirect to login if trying to access protected route without token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    // Redirect to sheets if trying to access auth pages with token
    return NextResponse.redirect(new URL('/sheet', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};