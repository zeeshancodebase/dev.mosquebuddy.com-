-- AlterTable
ALTER TABLE "venue_suggestions" ADD COLUMN     "areaId" TEXT,
ADD COLUMN     "cityId" TEXT;

-- AddForeignKey
ALTER TABLE "venue_suggestions" ADD CONSTRAINT "venue_suggestions_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_suggestions" ADD CONSTRAINT "venue_suggestions_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
