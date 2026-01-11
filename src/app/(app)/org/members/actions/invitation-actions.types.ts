export type RevokeOrgInvitationActionState =
    | { status: 'idle' }
    | { status: 'success'; message: string }
    | { status: 'error'; message: string };

export type ResendOrgInvitationActionState =
    | { status: 'idle' }
    | { status: 'success'; message: string }
    | { status: 'error'; message: string };
