-- AlterTable
ALTER TABLE "children" ADD COLUMN "email" TEXT;
ALTER TABLE "children" ADD COLUMN "password_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "children_email_key" ON "children"("email");
