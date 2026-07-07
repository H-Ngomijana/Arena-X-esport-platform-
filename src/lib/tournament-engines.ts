export type PlayerId = string;

export interface PlayerSeedProfile {
  id: PlayerId;
  points?: number;
  goalDifference?: number;
  goalsFor?: number;
  divisionTier?: number;
  divisionRank?: number;
  form?: Array<"W" | "D" | "L"> | string;
}

export interface LeagueFixture {
  id: string;
  round: number;
  homeId: PlayerId;
  awayId: PlayerId;
  status: "PENDING" | "PLAYED" | "DISPUTED";
}

export interface MatchResultInput {
  fixtureId: string;
  homeId: PlayerId;
  awayId: PlayerId;
  homeScore: number;
  awayScore: number;
}

export interface LeagueStanding {
  playerId: PlayerId;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: Array<"W" | "D" | "L">;
}

export interface KnockoutFixture {
  id: string;
  round: number;
  position: number;
  homeId: PlayerId | null;
  awayId: PlayerId | null;
  status: "PENDING" | "PLAYED" | "BYE";
  winnerId: PlayerId | null;
  feedsIntoFixtureId: string | null;
  feedsIntoSlot: "home" | "away" | null;
}

export interface SwissPairingInput {
  playerIds: PlayerId[];
  standings: LeagueStanding[];
  playedPairs: Array<[PlayerId, PlayerId]>;
}

const BYE = "__ARENA_X_BYE__";

function fixtureId(prefix: string, round: number, position: number) {
  return `${prefix}-r${round}-m${position}`;
}

function normalizePair(a: PlayerId, b: PlayerId) {
  return [a, b].sort().join("::");
}

function nextPowerOfTwo(value: number) {
  if (value <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(value));
}

function formScore(form: PlayerSeedProfile["form"]) {
  const values = Array.isArray(form) ? form : String(form || "").split("");
  return values.slice(-5).reduce((score, item) => {
    if (item === "W") return score + 3;
    if (item === "D") return score + 1;
    return score;
  }, 0);
}

export function sortPlayersForSeeding(players: PlayerSeedProfile[]) {
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
      a.id.localeCompare(b.id)
    );
  });
}

export function generateRoundRobinFixtures(
  playerIds: PlayerId[],
  options: { doubleRound?: boolean; idPrefix?: string } = {}
): LeagueFixture[] {
  const uniquePlayers = [...new Set(playerIds)].filter(Boolean);
  if (uniquePlayers.length < 2) return [];

  const idPrefix = options.idPrefix || "league";
  const rotation = uniquePlayers.length % 2 === 0 ? [...uniquePlayers] : [...uniquePlayers, BYE];
  const roundsPerLeg = rotation.length - 1;
  const half = rotation.length / 2;
  const fixtures: LeagueFixture[] = [];

  for (let roundIndex = 0; roundIndex < roundsPerLeg; roundIndex += 1) {
    for (let pairIndex = 0; pairIndex < half; pairIndex += 1) {
      const left = rotation[pairIndex];
      const right = rotation[rotation.length - 1 - pairIndex];
      if (left === BYE || right === BYE) continue;

      const swapHome = (roundIndex + pairIndex) % 2 === 1;
      const homeId = swapHome ? right : left;
      const awayId = swapHome ? left : right;
      fixtures.push({
        id: fixtureId(idPrefix, roundIndex + 1, fixtures.length + 1),
        round: roundIndex + 1,
        homeId,
        awayId,
        status: "PENDING",
      });
    }

    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop() as PlayerId);
    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  if (!options.doubleRound) return fixtures;

  const secondLeg = fixtures.map((fixture, index) => ({
    ...fixture,
    id: fixtureId(idPrefix, fixture.round + roundsPerLeg, index + 1 + fixtures.length),
    round: fixture.round + roundsPerLeg,
    homeId: fixture.awayId,
    awayId: fixture.homeId,
  }));

  return [...fixtures, ...secondLeg];
}

export function calculateLeagueTable(playerIds: PlayerId[], results: MatchResultInput[]): LeagueStanding[] {
  const table = new Map<PlayerId, LeagueStanding>();

  for (const playerId of playerIds) {
    table.set(playerId, {
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
    });
  }

  const apply = (playerId: PlayerId, goalsFor: number, goalsAgainst: number) => {
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
      a.playerId.localeCompare(b.playerId)
  );
}

export function generateSwissPairings({ playerIds, standings, playedPairs }: SwissPairingInput): LeagueFixture[] {
  const played = new Set(playedPairs.map(([a, b]) => normalizePair(a, b)));
  const standingByPlayer = new Map(standings.map((row) => [row.playerId, row]));
  const ordered = [...playerIds].sort((a, b) => {
    const rowA = standingByPlayer.get(a);
    const rowB = standingByPlayer.get(b);
    return (
      (rowB?.points ?? 0) - (rowA?.points ?? 0) ||
      (rowB?.goalDifference ?? 0) - (rowA?.goalDifference ?? 0) ||
      (rowB?.goalsFor ?? 0) - (rowA?.goalsFor ?? 0) ||
      a.localeCompare(b)
    );
  });
  const unpaired = new Set(ordered);
  const fixtures: LeagueFixture[] = [];

  for (const homeId of ordered) {
    if (!unpaired.has(homeId)) continue;
    const awayId = ordered.find((candidate) => candidate !== homeId && unpaired.has(candidate) && !played.has(normalizePair(homeId, candidate)));
    if (!awayId) continue;

    unpaired.delete(homeId);
    unpaired.delete(awayId);
    fixtures.push({
      id: fixtureId("swiss", 1, fixtures.length + 1),
      round: 1,
      homeId,
      awayId,
      status: "PENDING",
    });
  }

  return fixtures;
}

export function generateKnockoutBracket(players: PlayerSeedProfile[], options: { idPrefix?: string } = {}): KnockoutFixture[] {
  const seeded = sortPlayersForSeeding(players);
  if (seeded.length < 2) return [];

  const idPrefix = options.idPrefix || "cup";
  const bracketSize = nextPowerOfTwo(seeded.length);
  const roundCount = Math.log2(bracketSize);
  const fixtures: KnockoutFixture[] = [];

  for (let round = 1; round <= roundCount; round += 1) {
    const matchCount = bracketSize / 2 ** round;
    for (let position = 1; position <= matchCount; position += 1) {
      const feedsIntoFixtureId = round === roundCount ? null : fixtureId(idPrefix, round + 1, Math.ceil(position / 2));
      fixtures.push({
        id: fixtureId(idPrefix, round, position),
        round,
        position,
        homeId: null,
        awayId: null,
        status: "PENDING",
        winnerId: null,
        feedsIntoFixtureId,
        feedsIntoSlot: round === roundCount ? null : position % 2 === 1 ? "home" : "away",
      });
    }
  }

  const firstRound = fixtures.filter((fixture) => fixture.round === 1);
  for (let index = 0; index < firstRound.length; index += 1) {
    const highSeed = seeded[index]?.id ?? null;
    const lowSeed = seeded[bracketSize - 1 - index]?.id ?? null;
    const fixture = firstRound[index];
    fixture.homeId = highSeed;
    fixture.awayId = lowSeed;

    if (fixture.homeId && !fixture.awayId) {
      fixture.status = "BYE";
      fixture.winnerId = fixture.homeId;
      advanceKnockoutWinner(fixtures, fixture.id, fixture.homeId);
    }
  }

  return fixtures;
}

export function advanceKnockoutWinner(fixtures: KnockoutFixture[], fixtureIdToAdvance: string, winnerId: PlayerId) {
  const fixture = fixtures.find((item) => item.id === fixtureIdToAdvance);
  if (!fixture) throw new Error(`Fixture not found: ${fixtureIdToAdvance}`);

  fixture.winnerId = winnerId;
  fixture.status = fixture.status === "BYE" ? "BYE" : "PLAYED";

  if (!fixture.feedsIntoFixtureId || !fixture.feedsIntoSlot) return fixtures;

  const nextFixture = fixtures.find((item) => item.id === fixture.feedsIntoFixtureId);
  if (!nextFixture) throw new Error(`Next fixture not found: ${fixture.feedsIntoFixtureId}`);

  if (fixture.feedsIntoSlot === "home") nextFixture.homeId = winnerId;
  if (fixture.feedsIntoSlot === "away") nextFixture.awayId = winnerId;

  return fixtures;
}
