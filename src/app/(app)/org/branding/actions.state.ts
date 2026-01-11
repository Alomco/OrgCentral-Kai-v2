export interface OrgBrandingState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export const initialOrgBrandingState: OrgBrandingState = {
    status: 'idle',
};
