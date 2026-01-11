export type ResendOnboardingInvitationActionState =
    | { status: 'idle' }
    | { status: 'success'; message: string; invitationUrl: string }
    | { status: 'error'; message: string };
