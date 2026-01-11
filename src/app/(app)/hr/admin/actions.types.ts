export interface AdminDashboardStats {
    totalEmployees: number;
    activeEmployees: number;
    pendingLeaveRequests: number;
    complianceAlerts: number;
    upcomingExpirations: number;
    newHiresThisMonth: number;
}

export interface PendingApprovalItem {
    id: string;
    type: 'leave' | 'compliance' | 'onboarding';
    title: string;
    description: string;
    submittedAt: Date;
    submittedBy: string;
}
