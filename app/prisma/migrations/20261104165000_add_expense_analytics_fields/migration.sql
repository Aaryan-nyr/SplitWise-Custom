ALTER TABLE "Expense"
ADD COLUMN "createdById" TEXT,
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Other',
ADD COLUMN "expenseDate" TIMESTAMP(3);

UPDATE "Expense"
SET "expenseDate" = "createdAt";

ALTER TABLE "Expense"
ALTER COLUMN "expenseDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "expenseDate" SET NOT NULL;

CREATE INDEX "Expense_createdById_idx" ON "Expense"("createdById");

ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
