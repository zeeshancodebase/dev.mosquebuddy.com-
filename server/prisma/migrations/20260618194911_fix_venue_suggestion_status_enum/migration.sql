/*
  Warnings:

  - The `status` column on the `venue_suggestions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "venue_suggestions" DROP COLUMN "status",
ADD COLUMN     "status" "VenueSuggestionStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "venue_suggestions_status_idx" ON "venue_suggestions"("status");
