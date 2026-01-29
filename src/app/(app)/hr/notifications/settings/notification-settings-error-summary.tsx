import { forwardRef } from 'react';

export const NotificationSettingsErrorSummary = forwardRef<
    HTMLDivElement,
    { message: string }
>(function NotificationSettingsErrorSummary({ message }, ref) {
    return (
        <div
            ref={ref}
            tabIndex={-1}
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
        >
            {message}
        </div>
    );
});
