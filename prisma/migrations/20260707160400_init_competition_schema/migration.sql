-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('LEAGUE', 'KNOCKOUT');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FixtureStatus" AS ENUM ('PENDING', 'PLAYED', 'DISPUTED', 'FORFEIT');

-- CreateEnum
CREATE TYPE "MatchSubmissionStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('DIVISION_CREATED', 'COMPETITION_CREATED', 'SEASON_CREATED', 'FIXTURES_GENERATED', 'RESULT_SUBMITTED', 'RESULT_CONFIRMED', 'RESULT_DISPUTED', 'RESULT_REVIEWED', 'STANDINGS_UPDATED', 'PROMOTION_APPLIED', 'RELEGATION_APPLIED', 'KNOCKOUT_ADVANCED', 'DIVISION_ACCESS_REQUESTED', 'DIVISION_ACCESS_APPROVED', 'DIVISION_ACCESS_REJECTED', 'DIVISION_TRANSFER_APPROVED');

-- CreateEnum
CREATE TYPE "DivisionAccessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT NOT NULL,
    "inGameName" TEXT,
    "inGameId" TEXT,
    "avatarUrl" TEXT,
    "divisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "disciplinaryFlags" INTEGER NOT NULL DEFAULT 0,
    "form" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "theme" JSONB NOT NULL DEFAULT '{}',
    "tierLevel" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "promotionSlots" INTEGER NOT NULL,
    "relegationSlots" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DivisionAccessRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "requestedTierLevel" INTEGER,
    "currentDivisionProofUrl" TEXT NOT NULL,
    "inGameName" TEXT,
    "inGameId" TEXT,
    "note" TEXT,
    "status" "DivisionAccessStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DivisionAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CompetitionType" NOT NULL,
    "entryMethod" TEXT NOT NULL,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT,
    "competitionId" TEXT,
    "competitionType" "CompetitionType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "CompetitionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 1,
    "homeId" TEXT,
    "awayId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" "FixtureStatus" NOT NULL DEFAULT 'PENDING',
    "winnerId" TEXT,
    "feedsIntoFixtureId" TEXT,
    "feedsIntoSlot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSubmission" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "proofImageUrl" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "confirmedById" TEXT,
    "status" "MatchSubmissionStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "proofImageUrl" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "disputed" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerDivisionHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "seasonId" TEXT,
    "movement" TEXT NOT NULL,
    "fromTierLevel" INTEGER,
    "toTierLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerDivisionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TablePositionHistory" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seasonId" TEXT,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TablePositionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorId" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_userId_key" ON "PlayerStats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Division_slug_key" ON "Division"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Division_tierLevel_key" ON "Division"("tierLevel");

-- CreateIndex
CREATE INDEX "Division_slug_idx" ON "Division"("slug");

-- CreateIndex
CREATE INDEX "DivisionAccessRequest_divisionId_status_idx" ON "DivisionAccessRequest"("divisionId", "status");

-- CreateIndex
CREATE INDEX "DivisionAccessRequest_userId_status_idx" ON "DivisionAccessRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "Season_divisionId_status_idx" ON "Season"("divisionId", "status");

-- CreateIndex
CREATE INDEX "Season_competitionId_status_idx" ON "Season"("competitionId", "status");

-- CreateIndex
CREATE INDEX "Fixture_seasonId_round_idx" ON "Fixture"("seasonId", "round");

-- CreateIndex
CREATE INDEX "Fixture_homeId_idx" ON "Fixture"("homeId");

-- CreateIndex
CREATE INDEX "Fixture_awayId_idx" ON "Fixture"("awayId");

-- CreateIndex
CREATE INDEX "MatchSubmission_fixtureId_status_idx" ON "MatchSubmission"("fixtureId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MatchResult_fixtureId_key" ON "MatchResult"("fixtureId");

-- CreateIndex
CREATE INDEX "PlayerDivisionHistory_userId_createdAt_idx" ON "PlayerDivisionHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TablePositionHistory_divisionId_round_idx" ON "TablePositionHistory"("divisionId", "round");

-- CreateIndex
CREATE INDEX "TablePositionHistory_playerId_idx" ON "TablePositionHistory"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TablePositionHistory_divisionId_playerId_round_key" ON "TablePositionHistory"("divisionId", "playerId", "round");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionAccessRequest" ADD CONSTRAINT "DivisionAccessRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionAccessRequest" ADD CONSTRAINT "DivisionAccessRequest_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionAccessRequest" ADD CONSTRAINT "DivisionAccessRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_awayId_fkey" FOREIGN KEY ("awayId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSubmission" ADD CONSTRAINT "MatchSubmission_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSubmission" ADD CONSTRAINT "MatchSubmission_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSubmission" ADD CONSTRAINT "MatchSubmission_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerDivisionHistory" ADD CONSTRAINT "PlayerDivisionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerDivisionHistory" ADD CONSTRAINT "PlayerDivisionHistory_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TablePositionHistory" ADD CONSTRAINT "TablePositionHistory_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

