CREATE TABLE "HouseholdInvite" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HouseholdInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HouseholdInvite_tokenHash_key" ON "HouseholdInvite"("tokenHash");
CREATE INDEX "HouseholdInvite_householdId_expiresAt_idx" ON "HouseholdInvite"("householdId", "expiresAt");

ALTER TABLE "HouseholdInvite"
ADD CONSTRAINT "HouseholdInvite_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HouseholdInvite"
ADD CONSTRAINT "HouseholdInvite_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
