-- CreateTable
CREATE TABLE "hr"."compliance_categories" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compliance_categories_orgId_sortOrder_idx" ON "hr"."compliance_categories"("orgId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_categories_orgId_key_key" ON "hr"."compliance_categories"("orgId", "key");

-- AddForeignKey
ALTER TABLE "hr"."compliance_categories" ADD CONSTRAINT "compliance_categories_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "hr"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
