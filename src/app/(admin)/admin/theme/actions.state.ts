export interface UpdateOrgThemeState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export const initialThemeState: UpdateOrgThemeState = { status: 'idle' };
