import { z } from "zod";

const prayerNameEnum = z.enum([
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
]);

const timingTypeEnum = z.enum(["fixed", "relative"]);

const verificationStatusEnum = z.enum([
  "verified",
  "community_updated",
  "needs_update",
  "pending_review",
]);

const timeHHmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");

function isValidDateRange(data) {
  if (!data.effectiveFrom || !data.effectiveTo) {
    return true;
  }

  return new Date(data.effectiveFrom) <= new Date(data.effectiveTo);
}

const dailyPrayerTimingBaseSchema = z.object({
  prayerName: prayerNameEnum,

  azaanTime: timeHHmmSchema.optional().nullable(),
  jamaahTime: timeHHmmSchema.optional().nullable(),

  timingType: timingTypeEnum.default("fixed"),
  relativeTimeText: z.string().trim().optional().nullable(),

  effectiveFrom: z.string().datetime().optional().nullable(),
  effectiveTo: z.string().datetime().optional().nullable(),

  verificationStatus: verificationStatusEnum.default("pending_review"),
  sourceNote: z.string().trim().optional().nullable(),
});

export const createDailyPrayerTimingSchema = dailyPrayerTimingBaseSchema
  .refine(
    (data) => {
      if (data.timingType === "fixed") {
        return Boolean(data.jamaahTime);
      }

      return true;
    },
    {
      message: "jamaahTime is required when timingType is fixed",
    }
  )
  .refine(
    (data) => {
      if (data.timingType === "relative") {
        return Boolean(data.relativeTimeText);
      }

      return true;
    },
    {
      message: "relativeTimeText is required when timingType is relative",
    }
  )
  .refine(
    (data) => Boolean(data.jamaahTime || data.relativeTimeText),
    {
      message: "Either jamaahTime or relativeTimeText is required",
    }
  )
  .refine(isValidDateRange, {
    message: "effectiveFrom cannot be after effectiveTo",
  });

export const updateDailyPrayerTimingSchema = dailyPrayerTimingBaseSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required to update timing",
    }
  )
  .refine(isValidDateRange, {
    message: "effectiveFrom cannot be after effectiveTo",
  });


/*----------------------------------------*/

/*
What changed:

We added this helper:

function isValidDateRange(data) {
if (!data.effectiveFrom || !data.effectiveTo) {
  return true;
}

return new Date(data.effectiveFrom) <= new Date(data.effectiveTo);
}

And added it to both create and update validation.

*/

//***-------------------------------------------- */

// import { z } from "zod";

// const prayerNameEnum = z.enum([
//   "fajr",
//   "dhuhr",
//   "asr",
//   "maghrib",
//   "isha",
// ]);

// const timingTypeEnum = z.enum(["fixed", "relative"]);

// const verificationStatusEnum = z.enum([
//   "verified",
//   "community_updated",
//   "needs_update",
//   "pending_review",
// ]);

// const timeHHmmSchema = z
//   .string()
//   .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");

// const dailyPrayerTimingBaseSchema = z.object({
//   prayerName: prayerNameEnum,

//   azaanTime: timeHHmmSchema.optional().nullable(),
//   jamaahTime: timeHHmmSchema.optional().nullable(),

//   timingType: timingTypeEnum.default("fixed"),
//   relativeTimeText: z.string().trim().optional().nullable(),

//   effectiveFrom: z.string().datetime().optional().nullable(),
//   effectiveTo: z.string().datetime().optional().nullable(),

//   verificationStatus: verificationStatusEnum.default("pending_review"),
//   sourceNote: z.string().trim().optional().nullable(),
// });

// export const createDailyPrayerTimingSchema = dailyPrayerTimingBaseSchema
//   .refine(
//     (data) => {
//       if (data.timingType === "fixed") {
//         return Boolean(data.jamaahTime);
//       }

//       return true;
//     },
//     {
//       message: "jamaahTime is required when timingType is fixed",
//     }
//   )
//   .refine(
//     (data) => {
//       if (data.timingType === "relative") {
//         return Boolean(data.relativeTimeText);
//       }

//       return true;
//     },
//     {
//       message: "relativeTimeText is required when timingType is relative",
//     }
//   )
//   .refine(
//     (data) => Boolean(data.jamaahTime || data.relativeTimeText),
//     {
//       message: "Either jamaahTime or relativeTimeText is required",
//     }
//   );

// export const updateDailyPrayerTimingSchema =
//   dailyPrayerTimingBaseSchema.partial().refine(
//     (data) => Object.keys(data).length > 0,
//     {
//       message: "At least one field is required to update timing",
//     }
//   );