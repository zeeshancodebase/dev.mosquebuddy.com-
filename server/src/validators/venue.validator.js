import { z } from "zod";

const venueTypeEnum = z.enum([
  "masjid",
  "musalla",
  "islamic_center",
  "prayer_room",
  "temporary_jumuah_venue",
  "eidgah_open_ground",
  "hall_community_venue",
  "other",
]);

const womenPrayerSpaceEnum = z.enum([
  "available",
  "not_available",
  "jumuah_only",
  "ramadan_eid_only",
  "unknown",
]);

const facilityEnum = z.enum([
  "available",
  "not_available",
  "limited",
  "unknown",
]);

const verificationStatusEnum = z.enum([
  "verified",
  "community_updated",
  "needs_update",
  "pending_review",
]);

export const createVenueSchema = z.object({
  name: z.string().trim().min(2, "Venue name is required"),
  alternateNames: z.array(z.string().trim().min(1)).optional(),

  venueType: venueTypeEnum,

  countryId: z.string().uuid("Valid countryId is required"),
  stateId: z.string().uuid("Valid stateId is required"),
  cityId: z.string().uuid("Valid cityId is required"),
  areaId: z.string().uuid("Valid areaId is required").optional().nullable(),

  address: z.string().trim().optional().nullable(),
  pincode: z.string().trim().optional().nullable(),

  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),

  googleMapsLink: z
    .string()
    .trim()
    .url("Google Maps link must be a valid URL")
    .optional()
    .nullable(),

  phone: z.string().trim().optional().nullable(),
  timezone: z.string().trim().optional().nullable(),

  womenPrayerSpace: womenPrayerSpaceEnum.default("unknown"),
  wuduFacility: facilityEnum.default("unknown"),
  parking: facilityEnum.default("unknown"),

  defaultKhutbahLanguage: z.string().trim().optional().nullable(),
  facilityNotes: z.string().trim().optional().nullable(),
  importantNotice: z.string().trim().optional().nullable(),

  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),

  verificationStatus: verificationStatusEnum.default("pending_review"),
});

export const updateVenueSchema = createVenueSchema.partial();

export const updateVenueStatusSchema = z
  .object({
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    verificationStatus: verificationStatusEnum.optional(),
  })
  .refine(
    (data) =>
      data.isActive !== undefined ||
      data.isPublic !== undefined ||
      data.verificationStatus !== undefined,
    {
      message: "At least one status field is required",
    }
  );

export const venueQuerySchema = z.object({
  search: z.string().trim().optional(),

  countryId: z.string().uuid("Valid countryId is required").optional(),
  stateId: z.string().uuid("Valid stateId is required").optional(),
  cityId: z.string().uuid("Valid cityId is required").optional(),
  areaId: z.string().uuid("Valid areaId is required").optional(),

  venueType: venueTypeEnum.optional(),
  verificationStatus: verificationStatusEnum.optional(),

  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === "true";
    }),

  isPublic: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === "true";
    }),

  page: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return 1;
      const page = Number(value);
      return Number.isNaN(page) || page < 1 ? 1 : page;
    }),

  limit: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return 20;
      const limit = Number(value);
      if (Number.isNaN(limit) || limit < 1) return 20;
      return Math.min(limit, 100);
    }),
});