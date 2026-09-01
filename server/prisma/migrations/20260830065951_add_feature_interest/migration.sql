-- CreateTable
CREATE TABLE "feature_interest" (
    "id" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_interest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_interest_featureKey_userId_key" ON "feature_interest"("featureKey", "userId");

-- AddForeignKey
ALTER TABLE "feature_interest" ADD CONSTRAINT "feature_interest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
