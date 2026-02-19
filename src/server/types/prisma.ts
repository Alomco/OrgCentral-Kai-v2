import {
    type PrismaClient,
    Prisma,
    AbsenceStatus,
    ComplianceTier,
    DataClassificationLevel,
    DataResidencyZone,
    EmploymentStatus,
    EmploymentType,
    HRNotificationType,
    HealthStatus,
    InvitationStatus,
    LeaveAccrualFrequency,
    LeavePolicyType,
    LeaveRequestStatus,
    MembershipStatus,
    NotificationPriority,
    NotificationTopic,
    type NotificationChannel,
    OrganizationStatus,
    PerformanceGoalStatus,
    RoleScope,
    SecurityClassification,
    SessionStatus,
    TimeEntryStatus,
} from '@prisma/client';
import type {
    ComplianceRecord as PrismaComplianceRecordModel,
    DataSubjectRight as PrismaDataSubjectRightModel,
    Department as PrismaDepartmentModel,
    DocumentVault as PrismaDocumentVaultModel,
    EventOutbox as PrismaEventOutboxModel,
    IntegrationConfig as PrismaIntegrationConfigModel,
    Membership as PrismaMembershipModel,
    NotificationMessage as PrismaNotificationMessageModel,
    NotificationPreference as PrismaNotificationPreferenceModel,
    Organization as PrismaOrganizationModel,
    PermissionResource as PrismaPermissionResourceModel,
    Role as PrismaRoleModel,
    StatutoryReport as PrismaStatutoryReportModel,
    User as PrismaUserModel,
} from '@prisma/client';

// Centralized Prisma surface to keep services and use-cases decoupled from the client import site.
export { Prisma };
export {
    AbsenceStatus,
    HealthStatus,
    InvitationStatus,
    SecurityClassification,
    ComplianceTier,
    DataClassificationLevel,
    DataResidencyZone,
    EmploymentStatus,
    EmploymentType,
    HRNotificationType,
    LeaveAccrualFrequency,
    LeavePolicyType,
    LeaveRequestStatus,
    MembershipStatus,
    NotificationPriority,
    NotificationTopic,
    OrganizationStatus,
    PerformanceGoalStatus,
    RoleScope,
    SessionStatus,
    TimeEntryStatus,
};

export type PrismaClientInstance = PrismaClient;
export type PrismaTransaction = Prisma.TransactionClient;
export type PrismaBatchPayload = Prisma.BatchPayload;
export type PrismaJsonValue = Prisma.JsonValue;
export type PrismaJsonObject = Prisma.JsonObject;
export type PrismaJsonArray = Prisma.JsonArray;
export type PrismaInputJsonValue = Prisma.InputJsonValue;
export type PrismaInputJsonObject = Prisma.InputJsonObject;
export type PrismaInputJsonArray = Prisma.InputJsonArray;
export type PrismaNullableJsonNullValueInput = Prisma.NullableJsonNullValueInput;
export type PrismaDecimal = Prisma.Decimal;
export type PrismaAction = Prisma.PrismaAction;
export type PrismaTypes = typeof Prisma;
export const PrismaTypes = Prisma;

export const PrismaDecimal = Prisma.Decimal;

export type PrismaNotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];
export type PrismaHealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];
export type PrismaMembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];
export type PrismaRoleScope = (typeof RoleScope)[keyof typeof RoleScope];
export type PrismaSessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export type PrismaDepartment = PrismaDepartmentModel;
export type PrismaNotificationPreference = PrismaNotificationPreferenceModel;        
export type PrismaIntegrationConfig = PrismaIntegrationConfigModel;
export type PrismaMembership = PrismaMembershipModel;
export type PrismaOrganization = PrismaOrganizationModel;
export type PrismaRole = PrismaRoleModel;
export type PrismaPermissionResource = PrismaPermissionResourceModel;
export type PrismaUser = PrismaUserModel;
export type PrismaDocumentVault = PrismaDocumentVaultModel;
export type PrismaEventOutbox = PrismaEventOutboxModel;
export type PrismaDataSubjectRight = PrismaDataSubjectRightModel;
export type PrismaStatutoryReport = PrismaStatutoryReportModel;
export type PrismaComplianceRecord = PrismaComplianceRecordModel;
export type NotificationMessage = PrismaNotificationMessageModel;
