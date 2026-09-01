import prisma from '../config/prisma.js';

export const registerInterest = async ({ featureKey, userId }) => {
  const existing = userId
    ? await prisma.featureInterest.findFirst({ where: { featureKey, userId } })
    : null;

  if (existing) return { alreadyRegistered: true };

  await prisma.featureInterest.create({ data: { featureKey, userId: userId || null } });
  return { alreadyRegistered: false };
};

export const getInterestSummary = async () => {
  const grouped = await prisma.featureInterest.groupBy({
    by: ['featureKey'],
    _count: { featureKey: true },
  });

  return grouped.map((g) => ({ featureKey: g.featureKey, count: g._count.featureKey }));
};