-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('masjid', 'musalla', 'islamic_center', 'prayer_room', 'temporary_jumuah_venue', 'eidgah_open_ground', 'hall_community_venue', 'other');

-- CreateEnum
CREATE TYPE "WomenPrayerSpace" AS ENUM ('available', 'not_available', 'jumuah_only', 'ramadan_eid_only', 'unknown');

-- CreateEnum
CREATE TYPE "FacilityAvailability" AS ENUM ('available', 'not_available', 'limited', 'unknown');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('verified', 'community_updated', 'needs_update', 'pending_review');

-- CreateEnum
CREATE TYPE "PrayerName" AS ENUM ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha');

-- CreateEnum
CREATE TYPE "TimingType" AS ENUM ('fixed', 'relative');

-- CreateEnum
CREATE TYPE "ReportIssueType" AS ENUM ('azaan_time_wrong', 'jamaah_time_wrong', 'jumuah_time_wrong', 'location_wrong', 'women_prayer_info_wrong', 'facility_info_wrong', 'venue_closed_or_inactive', 'other');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected', 'needs_more_info');

-- CreateEnum
CREATE TYPE "VenueSuggestionStatus" AS ENUM ('pending', 'approved', 'rejected', 'duplicate', 'needs_more_info');

-- CreateEnum
CREATE TYPE "AttachmentPurpose" AS ENUM ('timing_board_photo', 'report_proof', 'venue_suggestion_proof', 'verification_evidence', 'venue_image', 'other');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('android', 'ios', 'web');

-- CreateEnum
CREATE TYPE "NotificationPermissionStatus" AS ENUM ('not_requested', 'granted', 'denied', 'unknown');

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_roleId_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_userId_fkey";

-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN     "assignedById" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "profileImageUrl" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alternateNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "venueType" "VenueType" NOT NULL,
    "countryId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "areaId" TEXT,
    "address" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "googleMapsLink" TEXT,
    "phone" TEXT,
    "timezone" TEXT,
    "womenPrayerSpace" "WomenPrayerSpace" NOT NULL DEFAULT 'unknown',
    "wuduFacility" "FacilityAvailability" NOT NULL DEFAULT 'unknown',
    "parking" "FacilityAvailability" NOT NULL DEFAULT 'unknown',
    "defaultKhutbahLanguage" TEXT,
    "facilityNotes" TEXT,
    "importantNotice" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending_review',
    "lastVerifiedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_prayer_timings" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "prayerName" "PrayerName" NOT NULL,
    "azaanTime" TEXT,
    "jamaahTime" TEXT,
    "timingType" "TimingType" NOT NULL DEFAULT 'fixed',
    "relativeTimeText" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending_review',
    "sourceNote" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_prayer_timings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jumuah_timings" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "azaanTime" TEXT,
    "khutbahTime" TEXT,
    "jamaahTime" TEXT NOT NULL,
    "khutbahLanguage" TEXT,
    "womenPrayerSpace" "WomenPrayerSpace" NOT NULL DEFAULT 'unknown',
    "importantNotice" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'pending_review',
    "sourceNote" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jumuah_timings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timing_reports" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "dailyTimingId" TEXT,
    "jumuahTimingId" TEXT,
    "prayerName" "PrayerName",
    "issueType" "ReportIssueType" NOT NULL,
    "currentAzaanTime" TEXT,
    "currentJamaahTime" TEXT,
    "suggestedAzaanTime" TEXT,
    "suggestedJamaahTime" TEXT,
    "suggestedKhutbahTime" TEXT,
    "userNote" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "submittedById" TEXT,
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timing_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_suggestions" (
    "id" TEXT NOT NULL,
    "suggestedName" TEXT NOT NULL,
    "venueType" "VenueType",
    "address" TEXT,
    "areaText" TEXT,
    "cityText" TEXT,
    "stateText" TEXT,
    "countryText" TEXT,
    "pincode" TEXT,
    "googleMapsLink" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "optionalTimingNote" TEXT,
    "userNote" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "submittedById" TEXT,
    "reviewedById" TEXT,
    "approvedVenueId" TEXT,
    "reviewNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePath" TEXT,
    "fileType" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT,
    "venueId" TEXT,
    "dailyTimingId" TEXT,
    "jumuahTimingId" TEXT,
    "timingReportId" TEXT,
    "venueSuggestionId" TEXT,
    "purpose" "AttachmentPurpose" NOT NULL DEFAULT 'other',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_admin_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "canEditVenueProfile" BOOLEAN NOT NULL DEFAULT true,
    "canEditDailyTimings" BOOLEAN NOT NULL DEFAULT true,
    "canEditJumuahTimings" BOOLEAN NOT NULL DEFAULT true,
    "canReviewReports" BOOLEAN NOT NULL DEFAULT false,
    "canMarkVerified" BOOLEAN NOT NULL DEFAULT true,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "venue_admin_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "venueId" TEXT,
    "areaId" TEXT,
    "cityId" TEXT,
    "canVerifyTimings" BOOLEAN NOT NULL DEFAULT true,
    "canUpdateTimings" BOOLEAN NOT NULL DEFAULT false,
    "canReviewReports" BOOLEAN NOT NULL DEFAULT false,
    "canReviewSuggestions" BOOLEAN NOT NULL DEFAULT false,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "volunteer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousDeviceId" TEXT,
    "deviceToken" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "permissionStatus" "NotificationPermissionStatus" NOT NULL DEFAULT 'unknown',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "prayerRemindersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "jumuahRemindersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "announcementNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferredReminderMinutesBefore" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "update_history" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "venueId" TEXT,
    "dailyTimingId" TEXT,
    "jumuahTimingId" TEXT,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT,
    "sourceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "update_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_activity_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "venueId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_countryCode_key" ON "countries"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE INDEX "states_countryId_idx" ON "states"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "states_countryId_name_key" ON "states"("countryId", "name");

-- CreateIndex
CREATE INDEX "cities_stateId_idx" ON "cities"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "cities_stateId_name_key" ON "cities"("stateId", "name");

-- CreateIndex
CREATE INDEX "areas_cityId_idx" ON "areas"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "areas_cityId_name_key" ON "areas"("cityId", "name");

-- CreateIndex
CREATE INDEX "venues_countryId_idx" ON "venues"("countryId");

-- CreateIndex
CREATE INDEX "venues_stateId_idx" ON "venues"("stateId");

-- CreateIndex
CREATE INDEX "venues_cityId_idx" ON "venues"("cityId");

-- CreateIndex
CREATE INDEX "venues_areaId_idx" ON "venues"("areaId");

-- CreateIndex
CREATE INDEX "venues_venueType_idx" ON "venues"("venueType");

-- CreateIndex
CREATE INDEX "venues_isActive_isPublic_idx" ON "venues"("isActive", "isPublic");

-- CreateIndex
CREATE INDEX "venues_verificationStatus_idx" ON "venues"("verificationStatus");

-- CreateIndex
CREATE INDEX "venues_latitude_longitude_idx" ON "venues"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "daily_prayer_timings_venueId_idx" ON "daily_prayer_timings"("venueId");

-- CreateIndex
CREATE INDEX "daily_prayer_timings_prayerName_idx" ON "daily_prayer_timings"("prayerName");

-- CreateIndex
CREATE INDEX "daily_prayer_timings_verificationStatus_idx" ON "daily_prayer_timings"("verificationStatus");

-- CreateIndex
CREATE INDEX "daily_prayer_timings_effectiveFrom_effectiveTo_idx" ON "daily_prayer_timings"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "jumuah_timings_venueId_idx" ON "jumuah_timings"("venueId");

-- CreateIndex
CREATE INDEX "jumuah_timings_slotNumber_idx" ON "jumuah_timings"("slotNumber");

-- CreateIndex
CREATE INDEX "jumuah_timings_verificationStatus_idx" ON "jumuah_timings"("verificationStatus");

-- CreateIndex
CREATE INDEX "jumuah_timings_effectiveFrom_effectiveTo_idx" ON "jumuah_timings"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "timing_reports_venueId_idx" ON "timing_reports"("venueId");

-- CreateIndex
CREATE INDEX "timing_reports_dailyTimingId_idx" ON "timing_reports"("dailyTimingId");

-- CreateIndex
CREATE INDEX "timing_reports_jumuahTimingId_idx" ON "timing_reports"("jumuahTimingId");

-- CreateIndex
CREATE INDEX "timing_reports_submittedById_idx" ON "timing_reports"("submittedById");

-- CreateIndex
CREATE INDEX "timing_reports_reviewedById_idx" ON "timing_reports"("reviewedById");

-- CreateIndex
CREATE INDEX "timing_reports_status_idx" ON "timing_reports"("status");

-- CreateIndex
CREATE INDEX "timing_reports_issueType_idx" ON "timing_reports"("issueType");

-- CreateIndex
CREATE INDEX "venue_suggestions_submittedById_idx" ON "venue_suggestions"("submittedById");

-- CreateIndex
CREATE INDEX "venue_suggestions_reviewedById_idx" ON "venue_suggestions"("reviewedById");

-- CreateIndex
CREATE INDEX "venue_suggestions_approvedVenueId_idx" ON "venue_suggestions"("approvedVenueId");

-- CreateIndex
CREATE INDEX "venue_suggestions_status_idx" ON "venue_suggestions"("status");

-- CreateIndex
CREATE INDEX "venue_suggestions_venueType_idx" ON "venue_suggestions"("venueType");

-- CreateIndex
CREATE INDEX "attachments_uploadedById_idx" ON "attachments"("uploadedById");

-- CreateIndex
CREATE INDEX "attachments_venueId_idx" ON "attachments"("venueId");

-- CreateIndex
CREATE INDEX "attachments_dailyTimingId_idx" ON "attachments"("dailyTimingId");

-- CreateIndex
CREATE INDEX "attachments_jumuahTimingId_idx" ON "attachments"("jumuahTimingId");

-- CreateIndex
CREATE INDEX "attachments_timingReportId_idx" ON "attachments"("timingReportId");

-- CreateIndex
CREATE INDEX "attachments_venueSuggestionId_idx" ON "attachments"("venueSuggestionId");

-- CreateIndex
CREATE INDEX "attachments_purpose_idx" ON "attachments"("purpose");

-- CreateIndex
CREATE INDEX "venue_admin_assignments_userId_idx" ON "venue_admin_assignments"("userId");

-- CreateIndex
CREATE INDEX "venue_admin_assignments_venueId_idx" ON "venue_admin_assignments"("venueId");

-- CreateIndex
CREATE INDEX "venue_admin_assignments_assignedById_idx" ON "venue_admin_assignments"("assignedById");

-- CreateIndex
CREATE INDEX "venue_admin_assignments_isActive_idx" ON "venue_admin_assignments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "venue_admin_assignments_userId_venueId_key" ON "venue_admin_assignments"("userId", "venueId");

-- CreateIndex
CREATE INDEX "volunteer_assignments_userId_idx" ON "volunteer_assignments"("userId");

-- CreateIndex
CREATE INDEX "volunteer_assignments_venueId_idx" ON "volunteer_assignments"("venueId");

-- CreateIndex
CREATE INDEX "volunteer_assignments_areaId_idx" ON "volunteer_assignments"("areaId");

-- CreateIndex
CREATE INDEX "volunteer_assignments_cityId_idx" ON "volunteer_assignments"("cityId");

-- CreateIndex
CREATE INDEX "volunteer_assignments_assignedById_idx" ON "volunteer_assignments"("assignedById");

-- CreateIndex
CREATE INDEX "volunteer_assignments_isActive_idx" ON "volunteer_assignments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_deviceToken_key" ON "device_tokens"("deviceToken");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE INDEX "device_tokens_anonymousDeviceId_idx" ON "device_tokens"("anonymousDeviceId");

-- CreateIndex
CREATE INDEX "device_tokens_platform_idx" ON "device_tokens"("platform");

-- CreateIndex
CREATE INDEX "device_tokens_permissionStatus_idx" ON "device_tokens"("permissionStatus");

-- CreateIndex
CREATE INDEX "device_tokens_isActive_idx" ON "device_tokens"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "update_history_entityType_idx" ON "update_history"("entityType");

-- CreateIndex
CREATE INDEX "update_history_entityId_idx" ON "update_history"("entityId");

-- CreateIndex
CREATE INDEX "update_history_venueId_idx" ON "update_history"("venueId");

-- CreateIndex
CREATE INDEX "update_history_dailyTimingId_idx" ON "update_history"("dailyTimingId");

-- CreateIndex
CREATE INDEX "update_history_jumuahTimingId_idx" ON "update_history"("jumuahTimingId");

-- CreateIndex
CREATE INDEX "update_history_changedById_idx" ON "update_history"("changedById");

-- CreateIndex
CREATE INDEX "admin_activity_logs_actorId_idx" ON "admin_activity_logs"("actorId");

-- CreateIndex
CREATE INDEX "admin_activity_logs_action_idx" ON "admin_activity_logs"("action");

-- CreateIndex
CREATE INDEX "admin_activity_logs_entityType_idx" ON "admin_activity_logs"("entityType");

-- CreateIndex
CREATE INDEX "admin_activity_logs_entityId_idx" ON "admin_activity_logs"("entityId");

-- CreateIndex
CREATE INDEX "admin_activity_logs_venueId_idx" ON "admin_activity_logs"("venueId");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE INDEX "user_roles_assignedById_idx" ON "user_roles"("assignedById");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_prayer_timings" ADD CONSTRAINT "daily_prayer_timings_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_prayer_timings" ADD CONSTRAINT "daily_prayer_timings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuah_timings" ADD CONSTRAINT "jumuah_timings_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jumuah_timings" ADD CONSTRAINT "jumuah_timings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timing_reports" ADD CONSTRAINT "timing_reports_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timing_reports" ADD CONSTRAINT "timing_reports_dailyTimingId_fkey" FOREIGN KEY ("dailyTimingId") REFERENCES "daily_prayer_timings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timing_reports" ADD CONSTRAINT "timing_reports_jumuahTimingId_fkey" FOREIGN KEY ("jumuahTimingId") REFERENCES "jumuah_timings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timing_reports" ADD CONSTRAINT "timing_reports_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timing_reports" ADD CONSTRAINT "timing_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_suggestions" ADD CONSTRAINT "venue_suggestions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_suggestions" ADD CONSTRAINT "venue_suggestions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_suggestions" ADD CONSTRAINT "venue_suggestions_approvedVenueId_fkey" FOREIGN KEY ("approvedVenueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_dailyTimingId_fkey" FOREIGN KEY ("dailyTimingId") REFERENCES "daily_prayer_timings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_jumuahTimingId_fkey" FOREIGN KEY ("jumuahTimingId") REFERENCES "jumuah_timings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_timingReportId_fkey" FOREIGN KEY ("timingReportId") REFERENCES "timing_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_venueSuggestionId_fkey" FOREIGN KEY ("venueSuggestionId") REFERENCES "venue_suggestions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_admin_assignments" ADD CONSTRAINT "venue_admin_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_admin_assignments" ADD CONSTRAINT "venue_admin_assignments_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_admin_assignments" ADD CONSTRAINT "venue_admin_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_assignments" ADD CONSTRAINT "volunteer_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_assignments" ADD CONSTRAINT "volunteer_assignments_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_assignments" ADD CONSTRAINT "volunteer_assignments_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_assignments" ADD CONSTRAINT "volunteer_assignments_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_assignments" ADD CONSTRAINT "volunteer_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_history" ADD CONSTRAINT "update_history_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_history" ADD CONSTRAINT "update_history_dailyTimingId_fkey" FOREIGN KEY ("dailyTimingId") REFERENCES "daily_prayer_timings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_history" ADD CONSTRAINT "update_history_jumuahTimingId_fkey" FOREIGN KEY ("jumuahTimingId") REFERENCES "jumuah_timings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_history" ADD CONSTRAINT "update_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
