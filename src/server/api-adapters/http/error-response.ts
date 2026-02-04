import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import {
    AuthorizationError,
    EntityNotFoundError,
    InfrastructureError,
    LeavePolicyInUseError,
    ValidationError,
    type ErrorDetails,
} from '@/server/errors';
import { appLogger } from '@/server/logging/structured-logger';
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
}

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

function fromTypedError(error: ValidationError | EntityNotFoundError | AuthorizationError | InfrastructureError): ErrorDescriptor {
    if (error instanceof ValidationError) {
        return {
            status: 400,
            code: error.code,
            message: error.message,
            details: error.details,
        };
    }

    if (error instanceof EntityNotFoundError) {
        return {
            status: 404,
            code: error.code,
            message: error.message,
            details: error.details,
        };
    }

    if (error instanceof AuthorizationError) {
        return {
            status: 403,
            code: error.code,
            message: error.message,
            details: error.details,
        };
    }

    if (error instanceof InfrastructureError) {
        return {
            status: 502,
            code: error.code,
            message: error.message,
            details: error.details,
        };
    }

    return DEFAULT_ERROR;
}

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
        error instanceof InfrastructureError
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
            message: error.message,
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

    return NextResponse.json(
        {
            error: {
                code: descriptor.code,
                message: descriptor.message,
                ...(descriptor.details ? { details: descriptor.details } : {}),
            },
        },
        { status: descriptor.status },
    );
}
