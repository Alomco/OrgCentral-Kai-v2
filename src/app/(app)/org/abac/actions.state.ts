export interface AbacPolicyEditorState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export const initialAbacPolicyEditorState: AbacPolicyEditorState = { status: 'idle' };
