const BYE = "__ARENA_X_BYE__";

function fixtureId(prefix, round, position) {
  return `${prefix}-r${round}-m${position}`;
}

function nextPowerOfTwo(value) {
  if (value <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(value));
}

function formScore(form) {
  const values = Array.isArray(form) ? form : String(form || "").split("");
  return values.slice(-5).reduce((score, item) => {
    if (item === "W") return score + 3;
    if (item === "D") return score + 1;
    return score;
  }, 0);
}

export function sortPlayersForSeeding(players) {
  return [...players].sort((a, b) => {
    const tierA = a.divisionTier ?? Number.MAX_SAFE_INTEGER;
    const tierB = b.divisionTier ?? Number.MAX_SAFE_INTEGER;
    const rankA = a.divisionRank ?? Number.MAX_SAFE_INTEGER;
    const rankB = b.divisionRank ?? Number.MAX_SAFE_INTEGER;

    return (
      (b.points ?? 0) - (a.points ?? 0) ||
      (b.goalDifference ?? 0) - (a.goalDifference ?? 0) ||
      (b.goalsFor ?? 0) - (a.goalsFor ?? 0) ||
      formScore(b.form) - formScore(a.form) ||
      tierA - tierB ||
      rankA - rankB ||
      String(a.id).localeCompare(String(b.id))
    );
  });
}

export function generateRoundRobinFixtures(playerIds, options = {}) {
  const uniquePlayers = [...new Set(playerIds)].filter(Boolean);
  if (uniquePlayers.length < 2) return [];

  const idPrefix = options.idPrefix || "league";
  const rotation = uniquePlayers.length % 2 === 0 ? [...uniquePlayers] : [...uniquePlayers, BYE];
  const roundsPerLeg = rotation.length - 1;
  const half = rotation.length / 2;
  const fixtures = [];

  for (let roundIndex = 0; roundIndex < roundsPerLeg; roundIndex += 1) {
    for (let pairIndex = 0; pairIndex < half; pairIndex += 1) {
      const left = rotation[pairIndex];
      const right = rotation[rotation.length - 1 - pairIndex];
      if (left === BYE || right === BYE) continue;

      const swapHome = (roundIndex + pairIndex) % 2 === 1;
      fixtures.push({
        id: fixtureId(idPrefix, roundIndex + 1, fixtures.length + 1),
        round: roundIndex + 1,
        position: fixtures.length + 1,
        homeId: swapHome ? right : left,
        awayId: swapHome ? left : right,
      });
    }

    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop());
    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  if (!options.doubleRound) return fixtures;

  return [
    ...fixtures,
    ...fixtures.map((fixture, index) => ({
      ...fixture,
      id: fixtureId(idPrefix, fixture.round + roundsPerLeg, index + 1 + fixtures.length),
      round: fixture.round + roundsPerLeg,
      position: index + 1 + fixtures.length,
      homeId: fixture.awayId,
      awayId: fixture.homeId,
    })),
  ];
}

export function generateKnockoutBracket(players, options = {}) {
  const seeded = sortPlayersForSeeding(players);
  if (seeded.length < 2) return [];

  const idPrefix = options.idPrefix || "cup";
  const bracketSize = nextPowerOfTwo(seeded.length);
  const roundCount = Math.log2(bracketSize);
  const fixtures = [];

  for (let round = 1; round <= roundCount; round += 1) {
    const matchCount = bracketSize / 2 ** round;
    for (let position = 1; position <= matchCount; position += 1) {
      fixtures.push({
        id: fixtureId(idPrefix, round, position),
        round,
        position,
        homeId: null,
        awayId: null,
        status: "PENDING",
        winnerId: null,
        feedsIntoFixtureId: round === roundCount ? null : fixtureId(idPrefix, round + 1, Math.ceil(position / 2)),
        feedsIntoSlot: round === roundCount ? null : position % 2 === 1 ? "home" : "away",
      });
    }
  }

  const firstRound = fixtures.filter((fixture) => fixture.round === 1);
  for (let index = 0; index < firstRound.length; index += 1) {
    const fixture = firstRound[index];
    fixture.homeId = seeded[index]?.id ?? null;
    fixture.awayId = seeded[bracketSize - 1 - index]?.id ?? null;

    if (fixture.homeId && !fixture.awayId) {
      fixture.status = "BYE";
      fixture.winnerId = fixture.homeId;
      const nextFixture = fixtures.find((item) => item.id === fixture.feedsIntoFixtureId);
      if (nextFixture && fixture.feedsIntoSlot) {
        nextFixture[`${fixture.feedsIntoSlot}Id`] = fixture.homeId;
      }
    }
  }

  return fixtures;
}

export function calculateTableFromResults(playerIds, results) {
  const table = new Map(
    playerIds.map((playerId) => [
      playerId,
      {
        playerId,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [],
      },
    ])
  );

  const apply = (playerId, goalsFor, goalsAgainst) => {
    const row = table.get(playerId);
    if (!row) return;
    row.played += 1;
    row.goalsFor += goalsFor;
    row.goalsAgainst += goalsAgainst;
    row.goalDifference = row.goalsFor - row.goalsAgainst;

    if (goalsFor > goalsAgainst) {
      row.wins += 1;
      row.points += 3;
      row.form.push("W");
    } else if (goalsFor === goalsAgainst) {
      row.draws += 1;
      row.points += 1;
      row.form.push("D");
    } else {
      row.losses += 1;
      row.form.push("L");
    }
    row.form = row.form.slice(-5);
  };

  for (const result of results) {
    apply(result.homeId, result.homeScore, result.awayScore);
    apply(result.awayId, result.awayScore, result.homeScore);
  }

  return [...table.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      String(a.playerId).localeCompare(String(b.playerId))
  );
}
