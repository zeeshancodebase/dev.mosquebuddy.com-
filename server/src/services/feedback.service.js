import prisma from "../config/prisma.js";
import createHttpError from "../utils/createHttpError.js";
import cleanValue from "../utils/cleanValue.js";

/*
|--------------------------------------------------------------------------
| Feedback Service
|--------------------------------------------------------------------------
| Purpose:
| - Public: registered users (or anonymous) submit app feedback.
| - Admin: Super Admin reviews feedback, changes status, adds internal note.
|
| Product rule:
| Feedback is informational, not a workflow like reports/suggestions.
| No approval chain — just open -> resolved, with an internal note.
*/

const ALLOWED_TYPES = ["general", "bug", "feature_request", "data_quality", "other"];
const ALLOWED_STATUSES = ["open", "resolved"];

function toPositiveInt(value, fallback) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) return fallback;
  return number;
}

const feedbackSelect = {
  id: true,
  type: true,
  message: true,
  rating: true,
  status: true,
  internalNote: true,
  createdAt: true,
  updatedAt: true,

  submittedById: true,
  submittedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
};

// ─── Public: submit feedback ──────────────────────────────
// submittedById is null when the request is unauthenticated (anonymous).
export async function submitFeedback(data = {}, submittedById = null) {
  const type = cleanValue(data.type) || "general";
  const message = cleanValue(data.message);
  const rating = data.rating != null ? Number(data.rating) : null;

  if (!ALLOWED_TYPES.includes(type)) {
    throw createHttpError(400, "Invalid feedback type");
  }

  if (!message) {
    throw createHttpError(400, "message is required");
  }

  if (rating != null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw createHttpError(400, "rating must be an integer between 1 and 5");
  }

  const feedback = await prisma.feedback.create({
    data: {
      type,
      message,
      rating,
      submittedById: submittedById || null,
    },
    select: feedbackSelect,
  });

  return feedback;
}

// ─── Admin: list feedback with filters + pagination ───────
export async function getAdminFeedbackList(query = {}) {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 20), 50);
  const skip = (page - 1) * limit;

  const type = cleanValue(query.type);
  const status = cleanValue(query.status);
  const search = cleanValue(query.search);

  if (type && !ALLOWED_TYPES.includes(type)) {
    throw createHttpError(400, "Invalid feedback type");
  }

  if (status && !ALLOWED_STATUSES.includes(status)) {
    throw createHttpError(400, "Invalid feedback status");
  }

  const where = {
    ...(type && { type }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { message: { contains: search, mode: "insensitive" } },
        { submittedBy: { name: { contains: search, mode: "insensitive" } } },
        { submittedBy: { email: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const [items, totalFeedback] = await prisma.$transaction([
    prisma.feedback.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: feedbackSelect,
    }),
    prisma.feedback.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      totalFeedback,
      totalPages: Math.ceil(totalFeedback / limit),
      hasNextPage: page * limit < totalFeedback,
      hasPreviousPage: page > 1,
    },
  };
}

// ─── Admin: get single feedback ───────────────────────────
export async function getAdminFeedbackById(feedbackId) {
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: feedbackSelect,
  });

  if (!feedback) {
    throw createHttpError(404, "Feedback not found");
  }

  return feedback;
}

// ─── Admin: update status / internal note ─────────────────
export async function updateAdminFeedback(feedbackId, data = {}) {
  const status = cleanValue(data.status);
  const internalNote = data.internalNote !== undefined ? cleanValue(data.internalNote) : undefined;

  if (status && !ALLOWED_STATUSES.includes(status)) {
    throw createHttpError(400, "Invalid feedback status");
  }

  const existing = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw createHttpError(404, "Feedback not found");
  }

  const updatedFeedback = await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      ...(status && { status }),
      ...(internalNote !== undefined && { internalNote: internalNote || null }),
    },
    select: feedbackSelect,
  });

  return {
    previousStatus: existing.status,
    feedback: updatedFeedback,
  };
}

// ─── Admin: dashboard-style summary (optional, used by stat cards) ─
export async function getAdminFeedbackSummary() {
  const [total, open, bugOpen, ratings] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.count({ where: { status: "open" } }),
    prisma.feedback.count({ where: { status: "open", type: "bug" } }),
    prisma.feedback.findMany({
      where: { rating: { not: null } },
      select: { rating: true },
    }),
  ]);

  const avgRating = ratings.length
    ? Number((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1))
    : null;

  return { total, open, bugOpen, avgRating };
}