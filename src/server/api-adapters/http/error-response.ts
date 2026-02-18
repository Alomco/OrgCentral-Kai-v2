import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import {
    AuthorizationError,
    ConflictError,
    EntityNotFoundError,
    InfrastructureError,
    LeavePolicyInUseError,
    RateLimitError,
    ValidationError,
    type ErrorDetails,
} from '@/server/errors';
import { appLogger } from '@/server/logging/structured-logger';
import { sanitizeLogMetadata } from '@/server/logging/log-sanitizer';
import { throwIfNextPrerenderBailout } from '@/server/api-adapters/http/next-prerender-bailout';

export interface ErrorResponseBody {
    error: {
        code: string;
        message: string;
        details?: ErrorDetails;
    };
}

interface ErrorDescriptor {
    status: number;
    code: string;
    message: string;
    details?: ErrorDetails;
    headers?: HeadersInit;
}

type TypedError =
    | ValidationError
    | EntityNotFoundError
    | AuthorizationError
    | InfrastructureError
    | ConflictError
    | RateLimitError;

const DEFAULT_ERROR: ErrorDescriptor = {
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
};

function fromZodError(error: ZodError): ErrorDescriptor {
    return {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload.',
        details: z.treeifyError(error) as ErrorDetails,
    };
}

function fromTypedError(error: TypedError): ErrorDescriptor {
    if (error instanceof RateLimitError) {
        return fromRateLimitError(error);
    }

    const resolved = resolveSimpleTypedError(error);
    return resolved ?? DEFAULT_ERROR;
}

function resolveSimpleTypedError(error: TypedError): ErrorDescriptor | null {
    for (const entry of SIMPLE_TYPED_ERROR_MAP) {
        if (entry.match(error)) {
            return entry.build(error);
        }
    }
    return null;
}

function fromRateLimitError(error: RateLimitError): ErrorDescriptor {
    const details = (error.details ?? {});
    const retryAfterSeconds = typeof details.retryAfterSeconds === 'number'
        ? details.retryAfterSeconds
        : undefined;
    const limit = typeof details.limit === 'number' ? details.limit : undefined;
    const remaining = typeof details.remaining === 'number' ? details.remaining : undefined;
    const resetAt = typeof details.resetAt === 'number' ? details.resetAt : undefined;

    const headers: HeadersInit = {};
    if (typeof retryAfterSeconds === 'number') {
        headers['Retry-After'] = String(retryAfterSeconds);
    }
    if (typeof limit === 'number') {
        headers['X-RateLimit-Limit'] = String(limit);
    }
    if (typeof remaining === 'number') {
        headers['X-RateLimit-Remaining'] = String(remaining);
    }
    if (typeof resetAt === 'number') {
        headers['X-RateLimit-Reset'] = String(resetAt);
    }

    return {
        status: 429,
        code: error.code,
        message: error.message,
        details: error.details,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
    };
}

function buildSimpleDescriptor(status: number, error: TypedError): ErrorDescriptor {
    return {
        status,
        code: error.code,
        message: error.message,
        details: error.details,
    };
}

function buildAuthorizationDescriptor(error: AuthorizationError): ErrorDescriptor {
    const reason =
        error.details && typeof error.details.reason === 'string'
            ? error.details.reason
            : null;
    const status =
        reason === 'unauthenticated' ||
            reason === 'session_expired' ||
            reason === 'invalid_session_identity'
            ? 401
            : 403;
    return buildSimpleDescriptor(status, error);
}

const SIMPLE_TYPED_ERROR_MAP: {
    match: (error: TypedError) => boolean;
    build: (error: TypedError) => ErrorDescriptor;
}[] = [
        {
            match: (error) => error instanceof ValidationError,
            build: (error) => buildSimpleDescriptor(400, error),
        },
        {
            match: (error) => error instanceof EntityNotFoundError,
            build: (error) => buildSimpleDescriptor(404, error),
        },
        {
            match: (error) => error instanceof AuthorizationError,
            build: (error) => buildAuthorizationDescriptor(error as AuthorizationError),
        },
        {
            match: (error) => error instanceof InfrastructureError,
            build: (error) => buildSimpleDescriptor(502, error),
        },
        {
            match: (error) => error instanceof ConflictError,
            build: (error) => buildSimpleDescriptor(409, error),
        },
    ];

function toDescriptor(error: unknown): ErrorDescriptor {
    if (error instanceof ZodError) {
        return fromZodError(error);
    }

    if (error instanceof LeavePolicyInUseError) {
        return {
            status: 409,
            code: error.code,
            message: error.message,
            details: error.details,
        };
    }

    if (
        error instanceof ValidationError ||
        error instanceof EntityNotFoundError ||
        error instanceof AuthorizationError ||
        error instanceof InfrastructureError ||
        error instanceof ConflictError ||
        error instanceof RateLimitError
    ) {
        return fromTypedError(error);
    }

    if (error instanceof SyntaxError) {
        return {
            status: 400,
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON.',
        };
    }

    if (error instanceof Error) {
        return {
            status: 500,
            code: 'UNEXPECTED_ERROR',
            message: DEFAULT_ERROR.message,
        };
    }

    return DEFAULT_ERROR;
}

export function buildErrorResponse(error: unknown): NextResponse<ErrorResponseBody> {
    throwIfNextPrerenderBailout(error);

    const descriptor = toDescriptor(error);

    if (descriptor.status >= 500) {
        appLogger.error('Unhandled server error', {
            code: descriptor.code,
            message: descriptor.message,
        });
    }

    const sanitizedDetails = descriptor.status < 500
        ? sanitizeErrorDetails(descriptor.details)
        : undefined;

    return NextResponse.json(
        {
            error: {
                code: descriptor.code,
                message: descriptor.message,
                ...(sanitizedDetails ? { details: sanitizedDetails } : {}),
            },
        },
        { status: descriptor.status, headers: descriptor.headers },
    );
}

function sanitizeErrorDetails(details: ErrorDetails | undefined): ErrorDetails | undefined {
    if (details === undefined) {
        return undefined;
    }
    return sanitizeLogMetadata(details);
}
