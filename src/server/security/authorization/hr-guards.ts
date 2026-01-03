/**
 * HR Guards
 *
 * Re-exports from split modules for backwards compatibility.
 *
 * @module hr-guards
 * @see hr-guards/index for the split implementation
 */
export {
    // Core guard infrastructure
    assertHrAccess,
    hasPermission,
    hasAnyPermission,
    assertActorOrPrivileged,
    assertPrivileged,
    type HrGuardRequest,
    type HrGuardRequestWithTarget,
    type HrGuardRequestWithAction,
    // Absence guards
    canManageAbsences,
    assertAbsenceReader,
    assertAbsenceCreator,
    assertAbsenceAcknowledger,
    assertAbsenceActorOrPrivileged,
    assertPrivilegedAbsenceActor,
    // Leave guards
    canManageLeave,
    canApproveLeave,
    assertLeaveReader,
    assertLeaveCreator,
    assertLeaveApprover,
    assertLeaveCanceller,
    assertLeaveActorOrPrivileged,
    // Compliance guards
    canManageCompliance,
    assertComplianceReader,
    assertComplianceUpdater,
    assertComplianceReviewer,
    assertComplianceAssigner,
    assertPrivilegedComplianceActor,
    // Time tracking guards
    canManageTimeEntries,
    canApproveTimeEntries,
    assertTimeEntryReader,
    assertTimeEntryCreator,
    assertTimeEntryUpdater,
    assertTimeEntryApprover,
    assertTimeEntryActorOrPrivileged,
    assertPrivilegedTimeEntryActor,
    // Training guards
    canManageTraining,
    assertTrainingReader,
    assertTrainingEnroller,
    assertTrainingCompleter,
    assertPrivilegedTrainingActor,
    // People guards
    canManagePeople,
    assertProfileReader,
    assertProfileCreator,
    assertProfileUpdater,
    assertContractReader,
    assertPrivilegedPeopleActor,
    // Policy guards
    canManagePolicies,
    assertPolicyReader,
    assertPolicyCreator,
    assertPolicyUpdater,
    assertPolicyPublisher,
    assertPolicyAcknowledger,
    assertPrivilegedPolicyActor,
    // Onboarding guards
    canManageOnboarding,
    assertOnboardingReader,
    assertOnboardingCreator,
    assertOnboardingUpdater,
    assertOnboardingCompleter,
    assertPrivilegedOnboardingActor,
    // Performance guards
    canManagePerformance,
    assertPerformanceReviewReader,
    assertPerformanceReviewCreator,
    assertPerformanceGoalUpdater,
    assertPerformanceFeedbackProvider,
    assertPrivilegedPerformanceActor,
    // Notification guards
    assertNotificationReader,
    assertNotificationCreator,
    assertReminderManager,
    // Settings guards
    assertSettingsReader,
    assertSettingsUpdater,
    assertOrgSettingsReader,
    assertOrgSettingsUpdater,
} from './hr-guards/index';
