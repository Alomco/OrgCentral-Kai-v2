-- Add role inheritance + system flags
ALTER TABLE "hr"."roles"
ADD COLUMN IF NOT EXISTS "inheritsRoleIds" TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT FALSE;

-- Permission resource registry (org-scoped)
CREATE TABLE IF NOT EXISTS "hr"."permission_resources" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "resource" TEXT NOT NULL,
    "actions" TEXT[] NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "permission_resources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "permission_resources_orgId_resource_key"
    ON "hr"."permission_resources"("orgId", "resource");

CREATE INDEX IF NOT EXISTS "permission_resources_orgId_idx"
    ON "hr"."permission_resources"("orgId");

ALTER TABLE "hr"."permission_resources"
ADD CONSTRAINT "permission_resources_orgId_fkey"
FOREIGN KEY ("orgId") REFERENCES "hr"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
