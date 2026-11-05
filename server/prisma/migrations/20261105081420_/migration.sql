/*
  Warnings:

  - A unique constraint covering the columns `[parent_id,slug]` on the table `children` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "children" ADD COLUMN     "demo_profile" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "ai_summary" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "routines" ADD COLUMN     "period_name" TEXT,
ADD COLUMN     "room" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "teacher" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "children_parent_id_slug_key" ON "children"("parent_id", "slug");
