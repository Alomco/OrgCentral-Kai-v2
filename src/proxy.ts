import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isNonProduction = process.env.NODE_ENV !== 'production';

function buildContentSecurityPolicy(nonce: string): string {
    const scriptSource = [
        "'self'",
        'https://js.stripe.com',
        'https://m.stripe.network',
    ];
    const styleSource = ["'self'", "'unsafe-inline'"];

    if (isNonProduction) {
        scriptSource.push("'unsafe-eval'", "'unsafe-inline'");
    } else {
        scriptSource.push(`'nonce-${nonce}'`);
    }

    return [
        "default-src 'self'",
        `script-src ${scriptSource.join(' ')}`,
        `style-src ${styleSource.join(' ')}`,
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://q.stripe.com https://m.stripe.network",
        "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ].join('; ');
}

export function proxy(request: NextRequest) {
    if (isMalformedPath(request.nextUrl.pathname)) {
        return new NextResponse('Not Found', { status: 404 });
    }

    const nonce = crypto.randomUUID();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(nonce));

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

function isMalformedPath(pathname: string): boolean {
    if (!pathname.startsWith('/')) {
        return true;
    }

    if (pathname.startsWith('//')) {
        return true;
    }

    const lowered = pathname.toLowerCase();
    if (lowered.includes('/.env') || lowered.includes('/..')) {
        return true;
    }

    return false;
}
