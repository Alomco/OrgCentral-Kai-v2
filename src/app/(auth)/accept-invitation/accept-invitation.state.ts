export type AcceptInvitationActionState =
    | { status: 'idle' }
    | { status: 'success'; organizationName: string; alreadyMember: boolean }
    | { status: 'error'; message: string };

export const initialAcceptInvitationState: AcceptInvitationActionState = { status: 'idle' };
