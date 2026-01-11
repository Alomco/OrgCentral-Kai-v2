export interface RoleCreateState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export const initialRoleCreateState: RoleCreateState = {
    status: 'idle',
};

export type InlineRoleActionState =
    | { status: 'idle' }
    | { status: 'success'; message: string }
    | { status: 'error'; message: string };
