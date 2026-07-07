import express from "express";
import { prisma } from "./prisma-client.mjs";
import {
  calculateTableFromResults,
  generateKnockoutBracket,
  generateRoundRobinFixtures,
} from "./competition-engine.mjs";

const router = express.Router();

function requireDatabase(_req, res, next) {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      error: "database_not_configured",
      message: "Set DATABASE_URL and run Prisma migrations to enable competition APIs.",
    });
  }
  return next();
}

function toInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function slugifyDivision(name, tierLevel) {
  const fromName = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return fromName || `division-${tierLevel}`;
}

async function findDivisionByRef(ref, include) {
  return prisma.division.findFirst({
    where: {
      OR: [{ slug: ref }, { id: ref }],
    },
    include,
  });
}

async function audit(action, metadata = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorId: metadata.actorId || null,
        entityId: metadata.entityId || null,
        entityType: metadata.entityType || null,
        metadata,
      },
    });
  } catch (error) {
    console.warn("[competition audit]", error);
  }
}

async function getSeasonTable(divisionId) {
  const season = await prisma.season.findFirst({
    where: {
      divisionId,
      competitionType: "LEAGUE",
      status: { in: ["SCHEDULED", "ACTIVE"] },
    },
    orderBy: { startDate: "desc" },
    include: {
      division: { include: { players: true } },
      fixtures: {
        include: { result: true },
      },
    },
  });

  if (!season?.division) return { season: null, table: [] };

  const playerIds = season.division.players.map((player) => player.id);
  const results = season.fixtures
    .filter((fixture) => fixture.result && fixture.homeId && fixture.awayId)
    .map((fixture) => ({
      fixtureId: fixture.id,
      homeId: fixture.homeId,
      awayId: fixture.awayId,
      homeScore: fixture.result.homeScore,
      awayScore: fixture.result.awayScore,
    }));

  const playerById = new Map(season.division.players.map((player) => [player.id, player]));
  const table = calculateTableFromResults(playerIds, results).map((row, index) => ({
    rank: index + 1,
    ...row,
    player: playerById.get(row.playerId) || null,
  }));

  return { season, table };
}

async function applyCareerStats(homeId, awayId, homeScore, awayScore) {
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const draw = homeScore === awayScore;

  const rows = [
    {
      userId: homeId,
      goalsFor: homeScore,
      goalsAgainst: awayScore,
      result: homeWon ? "W" : draw ? "D" : "L",
    },
    {
      userId: awayId,
      goalsFor: awayScore,
      goalsAgainst: homeScore,
      result: awayWon ? "W" : draw ? "D" : "L",
    },
  ];

  for (const row of rows) {
    const existing = await prisma.playerStats.findUnique({ where: { userId: row.userId } });
    const form = [...(existing?.form || []), row.result].slice(-5);
    const winDelta = row.result === "W" ? 1 : 0;
    const drawDelta = row.result === "D" ? 1 : 0;
    const lossDelta = row.result === "L" ? 1 : 0;
    const pointDelta = row.result === "W" ? 3 : row.result === "D" ? 1 : 0;

    await prisma.playerStats.upsert({
      where: { userId: row.userId },
      create: {
        userId: row.userId,
        played: 1,
        wins: winDelta,
        draws: drawDelta,
        losses: lossDelta,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: pointDelta,
        currentStreak: row.result === "W" ? 1 : 0,
        form,
      },
      update: {
        played: { increment: 1 },
        wins: { increment: winDelta },
        draws: { increment: drawDelta },
        losses: { increment: lossDelta },
        goalsFor: { increment: row.goalsFor },
        goalsAgainst: { increment: row.goalsAgainst },
        points: { increment: pointDelta },
        currentStreak: row.result === "W" ? { increment: 1 } : 0,
        form,
      },
    });
  }
}

async function snapshotTablePositions(seasonId, round) {
  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season?.divisionId) return;

  const { table } = await getSeasonTable(season.divisionId);
  for (const row of table) {
    await prisma.tablePositionHistory.upsert({
      where: {
        divisionId_playerId_round: {
          divisionId: season.divisionId,
          playerId: row.playerId,
          round,
        },
      },
      create: {
        divisionId: season.divisionId,
        playerId: row.playerId,
        seasonId,
        round,
        position: row.rank,
      },
      update: {
        seasonId,
        position: row.rank,
      },
    });
  }
}

router.use(requireDatabase);

router.get("/divisions", async (_req, res) => {
  const divisions = await prisma.division.findMany({
    orderBy: { tierLevel: "asc" },
    include: { _count: { select: { players: true, seasons: true } } },
  });
  return res.json({ divisions });
});

router.get("/divisions/:slug", async (req, res) => {
  const division = await findDivisionByRef(req.params.slug, {
    _count: { select: { players: true, seasons: true } },
  });
  if (!division) return res.status(404).json({ error: "division_not_found" });
  return res.json({ division });
});

router.post("/admin/divisions", async (req, res) => {
  const { name, slug, tierLevel, maxPlayers, promotionSlots, relegationSlots, actorId } = req.body || {};
  if (!name || !tierLevel) {
    return res.status(400).json({ error: "name_and_tier_required" });
  }
  const normalizedTier = toInt(tierLevel, 1);

  const division = await prisma.division.create({
    data: {
      name: String(name),
      slug: String(slug || slugifyDivision(name, normalizedTier)),
      bannerUrl: req.body?.bannerUrl || null,
      theme: req.body?.theme && typeof req.body.theme === "object" ? req.body.theme : {},
      tierLevel: normalizedTier,
      maxPlayers: toInt(maxPlayers, 20),
      promotionSlots: toInt(promotionSlots, 2),
      relegationSlots: toInt(relegationSlots, 2),
    },
  });
  await audit("DIVISION_CREATED", { actorId, entityId: division.id, entityType: "Division" });
  return res.status(201).json({ division });
});

router.post("/admin/competitions", async (req, res) => {
  const { name, type, entryMethod, config, actorId } = req.body || {};
  if (!name || !["LEAGUE", "KNOCKOUT"].includes(type)) {
    return res.status(400).json({ error: "valid_name_and_type_required" });
  }

  const competition = await prisma.competition.create({
    data: {
      name: String(name),
      type,
      entryMethod: String(entryMethod || "manual"),
      config: config && typeof config === "object" ? config : {},
    },
  });
  await audit("COMPETITION_CREATED", { actorId, entityId: competition.id, entityType: "Competition" });
  return res.status(201).json({ competition });
});

router.get("/competitions", async (_req, res) => {
  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" },
    include: { seasons: { orderBy: { startDate: "desc" }, take: 3 } },
  });
  return res.json({ competitions });
});

router.post("/admin/seasons", async (req, res) => {
  const { divisionId, competitionId, competitionType, startDate, endDate, config, actorId } = req.body || {};
  if (!["LEAGUE", "KNOCKOUT"].includes(competitionType)) {
    return res.status(400).json({ error: "valid_competition_type_required" });
  }

  const season = await prisma.season.create({
    data: {
      divisionId: divisionId || null,
      competitionId: competitionId || null,
      competitionType,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      status: "SCHEDULED",
      config: config && typeof config === "object" ? config : {},
    },
  });
  await audit("SEASON_CREATED", { actorId, entityId: season.id, entityType: "Season" });
  return res.status(201).json({ season });
});

router.get("/divisions/:slug/current-season", async (req, res) => {
  const division = await findDivisionByRef(req.params.slug);
  if (!division) return res.status(404).json({ error: "division_not_found" });

  const season = await prisma.season.findFirst({
    where: {
      divisionId: division.id,
      status: { in: ["SCHEDULED", "ACTIVE"] },
    },
    orderBy: { startDate: "desc" },
    include: {
      fixtures: {
        orderBy: [{ round: "desc" }],
        take: 1,
      },
    },
  });
  if (!season) return res.status(404).json({ error: "active_season_not_found" });

  const currentRound = season.fixtures[0]?.round || 1;
  return res.json({
    division,
    season: {
      ...season,
      currentRound,
      daysRemaining: season.endDate
        ? Math.max(0, Math.ceil((season.endDate.getTime() - Date.now()) / 86_400_000))
        : null,
    },
  });
});

router.get("/divisions/:slug/table", async (req, res) => {
  const division = await findDivisionByRef(req.params.slug);
  if (!division) return res.status(404).json({ error: "division_not_found" });
  const { season, table } = await getSeasonTable(division.id);
  if (!season) return res.status(404).json({ error: "active_season_not_found" });
  return res.json({ division, seasonId: season.id, table });
});

router.get("/divisions/:slug/fixtures", async (req, res) => {
  const division = await findDivisionByRef(req.params.slug);
  if (!division) return res.status(404).json({ error: "division_not_found" });
  const round = req.query?.round ? toInt(req.query.round, 0) : 0;
  const season = await prisma.season.findFirst({
    where: {
      divisionId: division.id,
      competitionType: "LEAGUE",
      status: { in: ["SCHEDULED", "ACTIVE"] },
    },
    orderBy: { startDate: "desc" },
    include: {
      fixtures: {
        where: round > 0 ? { round } : undefined,
        orderBy: [{ round: "asc" }, { position: "asc" }],
        include: { home: true, away: true, result: true },
      },
    },
  });
  if (!season) return res.status(404).json({ error: "active_season_not_found" });
  return res.json({ division, seasonId: season.id, fixtures: season.fixtures });
});

router.get("/divisions/:slug/history", async (req, res) => {
  const division = await findDivisionByRef(req.params.slug);
  if (!division) return res.status(404).json({ error: "division_not_found" });

  const seasons = await prisma.season.findMany({
    where: { divisionId: division.id, status: "COMPLETED" },
    orderBy: { endDate: "desc" },
    take: Math.min(toInt(req.query?.limit, 10), 50),
    include: {
      fixtures: {
        include: { result: true, home: true, away: true },
      },
    },
  });
  return res.json({ division, seasons });
});

router.post("/divisions/:slug/access-requests", async (req, res) => {
  const division = await findDivisionByRef(req.params.slug);
  if (!division) return res.status(404).json({ error: "division_not_found" });

  const { userId, currentDivisionProofUrl, inGameName, inGameId, note, requestedTierLevel } = req.body || {};
  if (!userId || !currentDivisionProofUrl) {
    return res.status(400).json({ error: "user_and_division_proof_required" });
  }

  const request = await prisma.divisionAccessRequest.create({
    data: {
      userId: String(userId),
      divisionId: division.id,
      requestedTierLevel: requestedTierLevel ? toInt(requestedTierLevel, division.tierLevel) : division.tierLevel,
      currentDivisionProofUrl: String(currentDivisionProofUrl),
      inGameName: inGameName ? String(inGameName) : null,
      inGameId: inGameId ? String(inGameId) : null,
      note: note ? String(note) : null,
    },
  });

  await audit("DIVISION_ACCESS_REQUESTED", {
    actorId: userId,
    entityId: request.id,
    entityType: "DivisionAccessRequest",
    divisionId: division.id,
  });
  return res.status(201).json({ request });
});

router.get("/admin/division-access-requests", async (req, res) => {
  const status = String(req.query?.status || "PENDING").toUpperCase();
  const where = status === "ALL" ? {} : { status };
  const requests = await prisma.divisionAccessRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      division: true,
      reviewedBy: true,
    },
  });
  return res.json({ requests });
});

router.post("/admin/division-access-requests/:id/approve", async (req, res) => {
  const { reviewedById } = req.body || {};
  const request = await prisma.divisionAccessRequest.findUnique({
    where: { id: req.params.id },
    include: { division: true, user: true },
  });
  if (!request) return res.status(404).json({ error: "request_not_found" });

  const previousDivision = request.user.divisionId
    ? await prisma.division.findUnique({ where: { id: request.user.divisionId } })
    : null;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: request.userId },
      data: {
        divisionId: request.divisionId,
        inGameName: request.inGameName || undefined,
        inGameId: request.inGameId || undefined,
      },
    });
    await tx.playerDivisionHistory.create({
      data: {
        userId: request.userId,
        divisionId: request.divisionId,
        movement: previousDivision ? "ADMIN_TRANSFER_APPROVED" : "ADMIN_JOIN_APPROVED",
        fromTierLevel: previousDivision?.tierLevel || null,
        toTierLevel: request.division.tierLevel,
      },
    });
    return tx.divisionAccessRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        reviewedById: reviewedById || null,
        reviewedAt: new Date(),
      },
      include: { user: true, division: true },
    });
  });

  await audit(previousDivision ? "DIVISION_TRANSFER_APPROVED" : "DIVISION_ACCESS_APPROVED", {
    actorId: reviewedById,
    entityId: request.id,
    entityType: "DivisionAccessRequest",
    userId: request.userId,
    divisionId: request.divisionId,
  });
  return res.json({ request: updated });
});

router.post("/admin/division-access-requests/:id/reject", async (req, res) => {
  const { reviewedById, rejectionReason } = req.body || {};
  const request = await prisma.divisionAccessRequest.update({
    where: { id: req.params.id },
    data: {
      status: "REJECTED",
      reviewedById: reviewedById || null,
      reviewedAt: new Date(),
      rejectionReason: rejectionReason ? String(rejectionReason) : "Rejected by admin",
    },
    include: { user: true, division: true },
  });
  await audit("DIVISION_ACCESS_REJECTED", {
    actorId: reviewedById,
    entityId: request.id,
    entityType: "DivisionAccessRequest",
    userId: request.userId,
    divisionId: request.divisionId,
  });
  return res.json({ request });
});

router.get("/rankings/global-elite", async (_req, res) => {
  const division = await prisma.division.findFirst({ where: { tierLevel: 1 } });
  if (!division) return res.json({ division: null, leaderboard: [] });

  const { table } = await getSeasonTable(division.id);
  return res.json({ division, leaderboard: table.slice(0, 10) });
});

router.get("/rankings/:slug", async (req, res) => {
  const division = await findDivisionByRef(req.params.slug);
  if (!division) return res.status(404).json({ error: "division_not_found" });

  const { season, table } = await getSeasonTable(division.id);
  if (!season) return res.status(404).json({ error: "active_season_not_found" });

  const currentRound = Math.max(1, ...season.fixtures.map((fixture) => fixture.round || 1));
  const previousPositions = await prisma.tablePositionHistory.findMany({
    where: { divisionId: division.id, round: Math.max(currentRound - 1, 1) },
  });
  const previousByPlayer = new Map(previousPositions.map((row) => [row.playerId, row.position]));
  const leaderboard = table.map((row) => {
    const previous = previousByPlayer.get(row.playerId);
    return {
      ...row,
      previousPosition: previous || null,
      rankDelta: previous ? previous - row.rank : 0,
    };
  });

  return res.json({ division, seasonId: season.id, leaderboard });
});

router.post("/seasons/:id/generate-fixtures", async (req, res) => {
  const { actorId, entrantIds, doubleRound } = req.body || {};
  const season = await prisma.season.findUnique({
    where: { id: req.params.id },
    include: {
      division: { include: { players: { include: { stats: true } } } },
      competition: true,
      fixtures: true,
    },
  });

  if (!season) return res.status(404).json({ error: "season_not_found" });
  if (season.fixtures.length > 0) return res.status(409).json({ error: "fixtures_already_generated" });

  let generated = [];
  if (season.competitionType === "LEAGUE") {
    const playerIds = season.division?.players.map((player) => player.id) || entrantIds || [];
    generated = generateRoundRobinFixtures(playerIds, {
      doubleRound: Boolean(doubleRound ?? season.config?.doubleRound),
      idPrefix: `season-${season.id}`,
    });
  } else {
    const users = await prisma.user.findMany({
      where: { id: { in: Array.isArray(entrantIds) ? entrantIds : [] } },
      include: { stats: true, division: true },
    });
    generated = generateKnockoutBracket(
      users.map((user) => ({
        id: user.id,
        points: user.stats?.points || 0,
        goalDifference: (user.stats?.goalsFor || 0) - (user.stats?.goalsAgainst || 0),
        goalsFor: user.stats?.goalsFor || 0,
        divisionTier: user.division?.tierLevel,
        form: user.stats?.form || [],
      })),
      { idPrefix: `season-${season.id}` }
    );
  }

  const fixtures = await prisma.$transaction(async (tx) => {
    await tx.season.update({ where: { id: season.id }, data: { status: "ACTIVE" } });
    const created = [];
    for (const fixture of generated) {
      created.push(
        await tx.fixture.create({
          data: {
            id: fixture.id,
            seasonId: season.id,
            round: fixture.round,
            position: fixture.position,
            homeId: fixture.homeId || null,
            awayId: fixture.awayId || null,
            status: fixture.status || "PENDING",
            winnerId: fixture.winnerId || null,
            feedsIntoFixtureId: fixture.feedsIntoFixtureId || null,
            feedsIntoSlot: fixture.feedsIntoSlot || null,
          },
        })
      );
    }
    return created;
  });

  await audit("FIXTURES_GENERATED", {
    actorId,
    entityId: season.id,
    entityType: "Season",
    count: fixtures.length,
    competitionType: season.competitionType,
  });
  return res.status(201).json({ fixtures });
});

router.post("/fixtures/:id/result", async (req, res) => {
  const { homeScore, awayScore, proofImageUrl, reportedById } = req.body || {};
  if (!reportedById || !proofImageUrl || homeScore == null || awayScore == null) {
    return res.status(400).json({ error: "result_payload_incomplete" });
  }

  const fixture = await prisma.fixture.findUnique({ where: { id: req.params.id } });
  if (!fixture) return res.status(404).json({ error: "fixture_not_found" });
  if (fixture.status === "PLAYED") return res.status(409).json({ error: "fixture_already_locked" });

  const submission = await prisma.matchSubmission.create({
    data: {
      fixtureId: fixture.id,
      homeScore: toInt(homeScore, 0),
      awayScore: toInt(awayScore, 0),
      proofImageUrl: String(proofImageUrl),
      reportedById: String(reportedById),
    },
  });

  await audit("RESULT_SUBMITTED", {
    actorId: reportedById,
    entityId: fixture.id,
    entityType: "Fixture",
    submissionId: submission.id,
  });
  return res.status(201).json({ submission });
});

router.post("/fixtures/:id/result/confirm", async (req, res) => {
  const { submissionId, confirmedById, homeScore, awayScore } = req.body || {};
  if (!submissionId || !confirmedById) return res.status(400).json({ error: "confirmation_payload_incomplete" });

  const submission = await prisma.matchSubmission.findUnique({
    where: { id: String(submissionId) },
    include: { fixture: true },
  });
  if (!submission || submission.fixtureId !== req.params.id) {
    return res.status(404).json({ error: "submission_not_found" });
  }

  const scoreMatches =
    (homeScore == null || toInt(homeScore, -1) === submission.homeScore) &&
    (awayScore == null || toInt(awayScore, -1) === submission.awayScore);
  if (!scoreMatches) {
    await prisma.matchSubmission.update({
      where: { id: submission.id },
      data: { status: "DISPUTED", confirmedById: String(confirmedById) },
    });
    await prisma.fixture.update({ where: { id: req.params.id }, data: { status: "DISPUTED" } });
    await audit("RESULT_DISPUTED", { actorId: confirmedById, entityId: req.params.id, entityType: "Fixture" });
    return res.status(409).json({ error: "submitted_scores_do_not_match", disputed: true });
  }

  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.matchResult.create({
      data: {
        fixtureId: req.params.id,
        homeScore: submission.homeScore,
        awayScore: submission.awayScore,
        proofImageUrl: submission.proofImageUrl,
        reportedById: submission.reportedById,
        verifiedById: String(confirmedById),
        lockedAt: new Date(),
      },
    });
    await tx.matchSubmission.update({
      where: { id: submission.id },
      data: { status: "CONFIRMED", confirmedById: String(confirmedById) },
    });
    await tx.fixture.update({
      where: { id: req.params.id },
      data: {
        status: "PLAYED",
        winnerId:
          submission.homeScore === submission.awayScore
            ? null
            : submission.homeScore > submission.awayScore
            ? submission.fixture.homeId
            : submission.fixture.awayId,
      },
    });
    return locked;
  });

  if (submission.fixture.homeId && submission.fixture.awayId) {
    await applyCareerStats(
      submission.fixture.homeId,
      submission.fixture.awayId,
      submission.homeScore,
      submission.awayScore
    );
    await snapshotTablePositions(submission.fixture.seasonId, submission.fixture.round);
  }

  if (submission.fixture.feedsIntoFixtureId && result.homeScore !== result.awayScore) {
    const winnerId = result.homeScore > result.awayScore ? submission.fixture.homeId : submission.fixture.awayId;
    const data =
      submission.fixture.feedsIntoSlot === "home"
        ? { homeId: winnerId }
        : submission.fixture.feedsIntoSlot === "away"
        ? { awayId: winnerId }
        : {};
    if (winnerId && Object.keys(data).length > 0) {
      await prisma.fixture.update({ where: { id: submission.fixture.feedsIntoFixtureId }, data });
      await audit("KNOCKOUT_ADVANCED", {
        actorId: confirmedById,
        entityId: submission.fixture.feedsIntoFixtureId,
        entityType: "Fixture",
        winnerId,
      });
    }
  }

  await audit("RESULT_CONFIRMED", { actorId: confirmedById, entityId: req.params.id, entityType: "Fixture" });
  return res.json({ result });
});

router.post("/fixtures/:id/result/dispute", async (req, res) => {
  const { submissionId, disputedById, reason } = req.body || {};
  if (!submissionId || !disputedById) return res.status(400).json({ error: "dispute_payload_incomplete" });

  await prisma.matchSubmission.update({
    where: { id: String(submissionId) },
    data: { status: "DISPUTED", confirmedById: String(disputedById) },
  });
  const fixture = await prisma.fixture.update({
    where: { id: req.params.id },
    data: { status: "DISPUTED" },
  });
  await audit("RESULT_DISPUTED", {
    actorId: disputedById,
    entityId: req.params.id,
    entityType: "Fixture",
    reason: reason || "",
  });
  return res.json({ fixture });
});

router.post("/seasons/:id/finalize", async (req, res) => {
  const { actorId } = req.body || {};
  const season = await prisma.season.findUnique({
    where: { id: req.params.id },
    include: { division: true },
  });
  if (!season) return res.status(404).json({ error: "season_not_found" });
  if (season.competitionType !== "LEAGUE" || !season.divisionId || !season.division) {
    await prisma.season.update({ where: { id: season.id }, data: { status: "COMPLETED", endDate: new Date() } });
    return res.json({ promoted: [], relegated: [] });
  }

  const { table } = await getSeasonTable(season.divisionId);
  const promoted = table.slice(0, season.division.promotionSlots);
  const relegated = table.slice(Math.max(table.length - season.division.relegationSlots, 0));
  const higherDivision = await prisma.division.findFirst({
    where: { tierLevel: season.division.tierLevel - 1 },
  });
  const lowerDivision = await prisma.division.findFirst({
    where: { tierLevel: season.division.tierLevel + 1 },
  });

  await prisma.$transaction(async (tx) => {
    for (const row of promoted) {
      if (!higherDivision) continue;
      await tx.user.update({ where: { id: row.playerId }, data: { divisionId: higherDivision.id } });
      await tx.playerDivisionHistory.create({
        data: {
          userId: row.playerId,
          divisionId: higherDivision.id,
          seasonId: season.id,
          movement: "PROMOTED",
          fromTierLevel: season.division.tierLevel,
          toTierLevel: higherDivision.tierLevel,
        },
      });
    }
    for (const row of relegated) {
      if (!lowerDivision) continue;
      await tx.user.update({ where: { id: row.playerId }, data: { divisionId: lowerDivision.id } });
      await tx.playerDivisionHistory.create({
        data: {
          userId: row.playerId,
          divisionId: lowerDivision.id,
          seasonId: season.id,
          movement: "RELEGATED",
          fromTierLevel: season.division.tierLevel,
          toTierLevel: lowerDivision.tierLevel,
        },
      });
    }
    await tx.season.update({ where: { id: season.id }, data: { status: "COMPLETED", endDate: new Date() } });
  });

  await audit("PROMOTION_APPLIED", {
    actorId,
    entityId: season.id,
    entityType: "Season",
    promoted: promoted.map((row) => row.playerId),
    relegated: relegated.map((row) => row.playerId),
  });
  return res.json({ promoted, relegated });
});

export default router;
