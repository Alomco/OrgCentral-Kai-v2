export interface LifecycleActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}
