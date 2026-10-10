/*
  Warnings:

  - Added the required column `createdById` to the `TodoItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('TODO', 'INPROGRESS', 'DONE', 'OBSOLETE');

-- AlterTable
ALTER TABLE "TodoItem" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "lastEditedById" TEXT,
ADD COLUMN     "priority" "TodoPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "status" "TodoStatus" NOT NULL DEFAULT 'TODO';

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "todoItemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskComment_todoItemId_createdAt_idx" ON "TaskComment"("todoItemId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskComment_createdById_idx" ON "TaskComment"("createdById");

-- CreateIndex
CREATE INDEX "TodoItem_createdById_idx" ON "TodoItem"("createdById");

-- CreateIndex
CREATE INDEX "TodoItem_lastEditedById_idx" ON "TodoItem"("lastEditedById");

-- AddForeignKey
ALTER TABLE "TodoItem" ADD CONSTRAINT "TodoItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoItem" ADD CONSTRAINT "TodoItem_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_todoItemId_fkey" FOREIGN KEY ("todoItemId") REFERENCES "TodoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
