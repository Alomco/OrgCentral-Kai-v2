-- CreateEnum
CREATE TYPE "hr"."BillingSubscriptionStatus" AS ENUM ('INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'PAUSED');

-- AlterTable
ALTER TABLE "compliance"."audit_logs" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "immutable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "hr"."leave_balances" ADD COLUMN     "auditBatchId" TEXT,
ADD COLUMN     "auditSource" TEXT,
ADD COLUMN     "dataClassification" "hr"."DataClassificationLevel" NOT NULL DEFAULT 'OFFICIAL',
ADD COLUMN     "residencyTag" "hr"."DataResidencyZone" NOT NULL DEFAULT 'UK_ONLY';

-- AlterTable
ALTER TABLE "hr"."leave_policies" ADD COLUMN     "auditBatchId" TEXT,
ADD COLUMN     "auditSource" TEXT,
ADD COLUMN     "dataClassification" "hr"."DataClassificationLevel" NOT NULL DEFAULT 'OFFICIAL',
ADD COLUMN     "residencyTag" "hr"."DataResidencyZone" NOT NULL DEFAULT 'UK_ONLY';

-- AlterTable
ALTER TABLE "hr"."leave_requests" ADD COLUMN     "auditBatchId" TEXT,
ADD COLUMN     "auditSource" TEXT,
ADD COLUMN     "dataClassification" "hr"."DataClassificationLevel" NOT NULL DEFAULT 'OFFICIAL',
ADD COLUMN     "residencyTag" "hr"."DataResidencyZone" NOT NULL DEFAULT 'UK_ONLY';

-- CreateTable
CREATE TABLE "hr"."organization_subscriptions" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripeSubscriptionItemId" TEXT,
    "stripePriceId" TEXT NOT NULL,
    "status" "hr"."BillingSubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "seatCount" INTEGER NOT NULL DEFAULT 1,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "lastStripeEventAt" TIMESTAMP(3),
    "metadata" JSONB,
    "dataClassification" "hr"."DataClassificationLevel" NOT NULL DEFAULT 'OFFICIAL',
    "residencyTag" "hr"."DataResidencyZone" NOT NULL DEFAULT 'UK_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_subscriptions_orgId_status_idx" ON "hr"."organization_subscriptions"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_subscriptions_orgId_key" ON "hr"."organization_subscriptions"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_subscriptions_stripeCustomerId_key" ON "hr"."organization_subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_subscriptions_stripeSubscriptionId_key" ON "hr"."organization_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "leave_balances_orgId_dataClassification_residencyTag_idx" ON "hr"."leave_balances"("orgId", "dataClassification", "residencyTag");

-- CreateIndex
CREATE INDEX "leave_policies_orgId_dataClassification_residencyTag_idx" ON "hr"."leave_policies"("orgId", "dataClassification", "residencyTag");

-- CreateIndex
CREATE INDEX "leave_requests_orgId_dataClassification_residencyTag_idx" ON "hr"."leave_requests"("orgId", "dataClassification", "residencyTag");

-- AddForeignKey
ALTER TABLE "hr"."organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "hr"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
