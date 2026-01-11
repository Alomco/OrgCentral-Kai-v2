export interface OrgProfileActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: Record<string, string[]>;
}

export const initialOrgProfileActionState: OrgProfileActionState = { status: 'idle' };
