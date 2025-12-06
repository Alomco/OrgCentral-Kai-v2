export type ErrorDetails = Record<string, unknown> | undefined;

export class BaseTypedError extends Error {
    readonly code: string;
    readonly details?: ErrorDetails;

    constructor(message: string, code: string, details?: ErrorDetails) {
        super(message);
        this.name = new.target.name;
        this.code = code;
        this.details = details;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, new.target);
        }
    }
}
