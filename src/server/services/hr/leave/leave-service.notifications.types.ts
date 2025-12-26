export interface LeaveNotificationMetadata extends Record<string, unknown> {
    orgId?: string;
    requestId?: string;
}

export interface LeaveNotificationLogger {
    warn: (message: string, metadata?: LeaveNotificationMetadata) => void;
    error: (message: string, metadata?: LeaveNotificationMetadata) => void;
}

export interface CancelNotificationContext {
    userId?: string | null;
    employeeId?: string;
    requestId: string;
    leaveType: string;
    totalDays: number;
    startDate: string;
    endDate: string;
    reason?: string | null;
}
