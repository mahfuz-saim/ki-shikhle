-- CreateTable
CREATE TABLE "routine_completions" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "routine_id" TEXT,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routine_completions_child_id_date_start_time_key" ON "routine_completions"("child_id", "date", "start_time");

-- CreateIndex
CREATE INDEX "routine_completions_child_id_date_idx" ON "routine_completions"("child_id", "date");

-- AddForeignKey
ALTER TABLE "routine_completions" ADD CONSTRAINT "routine_completions_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;
