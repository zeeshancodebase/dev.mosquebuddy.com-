-- CreateEnum
CREATE TYPE "AnnouncementScope" AS ENUM ('venue', 'area', 'city', 'state');

-- CreateEnum
CREATE TYPE "AnnouncementCategory" AS ENUM ('event', 'eid', 'urgent', 'class', 'general');

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "scope" "AnnouncementScope" NOT NULL,
    "category" "AnnouncementCategory" NOT NULL DEFAULT 'general',
    "venueId" TEXT,
    "areaId" TEXT,
    "cityId" TEXT,
    "stateId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "eventTimeText" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdByRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
