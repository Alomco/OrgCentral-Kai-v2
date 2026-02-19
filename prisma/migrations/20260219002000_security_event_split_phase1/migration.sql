-- CreateTable
CREATE TABLE "auth"."tenant_security_events" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "userId" UUID,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "additionalInfo" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataClassification" "hr"."DataClassificationLevel" NOT NULL DEFAULT 'OFFICIAL',
    "residencyTag" "hr"."DataResidencyZone" NOT NULL DEFAULT 'UK_ONLY',

    CONSTRAINT "tenant_security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."global_security_events" (
    "id" UUID NOT NULL,
    "sourceOrgId" UUID,
    "userId" UUID,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "additionalInfo" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_security_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_security_events_orgId_createdAt_idx" ON "auth"."tenant_security_events"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "tenant_security_events_orgId_eventType_idx" ON "auth"."tenant_security_events"("orgId", "eventType");

-- CreateIndex
CREATE INDEX "tenant_security_events_orgId_severity_idx" ON "auth"."tenant_security_events"("orgId", "severity");

-- CreateIndex
CREATE INDEX "tenant_security_events_orgId_resolved_idx" ON "auth"."tenant_security_events"("orgId", "resolved");

-- CreateIndex
CREATE INDEX "tenant_security_events_userId_idx" ON "auth"."tenant_security_events"("userId");

-- CreateIndex
CREATE INDEX "global_security_events_sourceOrgId_createdAt_idx" ON "auth"."global_security_events"("sourceOrgId", "createdAt");

-- CreateIndex
CREATE INDEX "global_security_events_eventType_idx" ON "auth"."global_security_events"("eventType");

-- CreateIndex
CREATE INDEX "global_security_events_severity_idx" ON "auth"."global_security_events"("severity");

-- CreateIndex
CREATE INDEX "global_security_events_resolved_idx" ON "auth"."global_security_events"("resolved");

-- AddForeignKey
ALTER TABLE "auth"."tenant_security_events" ADD CONSTRAINT "tenant_security_events_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "hr"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."tenant_security_events" ADD CONSTRAINT "tenant_security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "hr"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."tenant_security_events" ADD CONSTRAINT "tenant_security_events_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "hr"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."global_security_events" ADD CONSTRAINT "global_security_events_sourceOrgId_fkey" FOREIGN KEY ("sourceOrgId") REFERENCES "hr"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."global_security_events" ADD CONSTRAINT "global_security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "hr"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."global_security_events" ADD CONSTRAINT "global_security_events_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "hr"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
