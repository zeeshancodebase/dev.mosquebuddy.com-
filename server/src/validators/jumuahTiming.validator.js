import { z } from "zod";

const womenPrayerSpaceEnum = z.enum([
  "available",
  "not_available",
  "jumuah_only",
  "ramadan_eid_only",
  "unknown",
]);

const verificationStatusEnum = z.enum([
  "verified",
  "community_updated",
  "needs_update",
  "pending_review",
]);

const timeHHmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");

const jumuahTimingBaseSchema = z.object({
  slotNumber: z
    .number({
      required_error: "Slot number is required",
      invalid_type_error: "Slot number must be a number",
    })
    .int("Slot number must be an integer")
    .min(1, "Slot number must be at least 1"),

  azaanTime: timeHHmmSchema.optional().nullable(),
  khutbahTime: timeHHmmSchema.optional().nullable(),

  jamaahTime: timeHHmmSchema,

  khutbahLanguage: z.string().trim().optional().nullable(),
  womenPrayerSpace: womenPrayerSpaceEnum.default("unknown"),
  importantNotice: z.string().trim().optional().nullable(),

  effectiveFrom: z.string().datetime().optional().nullable(),
  effectiveTo: z.string().datetime().optional().nullable(),

  verificationStatus: verificationStatusEnum.default("pending_review"),
  sourceNote: z.string().trim().optional().nullable(),
});

export const createJumuahTimingSchema = jumuahTimingBaseSchema.refine(
  (data) => {
    if (!data.effectiveFrom || !data.effectiveTo) return true;

    return new Date(data.effectiveFrom) <= new Date(data.effectiveTo);
  },
  {
    message: "effectiveFrom cannot be after effectiveTo",
  }
);

export const updateJumuahTimingSchema = jumuahTimingBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update Jumu‘ah timing",
  })
  .refine(
    (data) => {
      if (!data.effectiveFrom || !data.effectiveTo) return true;

      return new Date(data.effectiveFrom) <= new Date(data.effectiveTo);
    },
    {
      message: "effectiveFrom cannot be after effectiveTo",
    }
  );