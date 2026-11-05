-- Persist fields already accepted by the class log API instead of falling back to memory.
ALTER TABLE "learning_entries"
ADD COLUMN "subject" TEXT,
ADD COLUMN "subject_name" TEXT,
ADD COLUMN "period_name" TEXT,
ADD COLUMN "homework_assigned" TEXT,
ADD COLUMN "key_concepts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "notes" TEXT;
