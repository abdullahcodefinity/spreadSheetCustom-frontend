import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the request is for the users route
  const isUsersRoute = pathname.startsWith('/users');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  
  // Get token from Authorization header or cookies
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // For users route, we need to check if user is super admin
  if (isUsersRoute) {
    if (!token) {
      // No token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Try to get user info from cookies (set by client-side)
    const userCookie = request.cookies.get('user');
    let userRole = null;
    
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value);
        userRole = user.role;
      } catch (error) {
        console.error('Error parsing user cookie:', error);
      }
    }
    console.log(userRole,'userRole');
    
    // If user is not a super admin, redirect to sheets page
    if (userRole !== 'SuperAdmin') {

      return NextResponse.redirect(new URL('/sheet', request.url));
    }
  }
  
  // Handle auth pages (login/signup)
  if (token && isAuthPage) {
    // Redirect to sheets if trying to access auth pages with token
    return NextResponse.redirect(new URL('/sheet', request.url));
  }
  
  // Handle protected routes without token
  if (!token && !isAuthPage && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    // Redirect to login if trying to access protected route without token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};