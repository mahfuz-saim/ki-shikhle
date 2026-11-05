-- Replace the implicit `Child`↔`Subject` many-to-many with an explicit, owner-scoped
-- join table.
--
-- The implicit `_ChildToSubject` table stored a child id and a subject id with no link
-- to the owning account, so a row could connect one tenant's child to another tenant's
-- custom subject. The explicit table carries `parent_id`, so the join can be
-- constrained by owner in a single query.
--
-- The old table has no rows (the relation was never written), so this is a straight
-- replacement with no data to carry over.

-- CreateTable
CREATE TABLE "child_subjects" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "child_subjects_child_id_subject_id_key" ON "child_subjects"("child_id", "subject_id");

-- CreateIndex
CREATE INDEX "child_subjects_parent_id_idx" ON "child_subjects"("parent_id");

-- CreateIndex
CREATE INDEX "child_subjects_subject_id_idx" ON "child_subjects"("subject_id");

-- AddForeignKey
ALTER TABLE "child_subjects" ADD CONSTRAINT "child_subjects_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_subjects" ADD CONSTRAINT "child_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropTable
DROP TABLE "_ChildToSubject";
