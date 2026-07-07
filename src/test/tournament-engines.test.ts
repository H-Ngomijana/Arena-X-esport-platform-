import { describe, expect, it } from "vitest";
import {
  advanceKnockoutWinner,
  calculateLeagueTable,
  generateKnockoutBracket,
  generateRoundRobinFixtures,
  generateSwissPairings,
  sortPlayersForSeeding,
} from "@/lib/tournament-engines";

describe("tournament engines", () => {
  it("generates a single round-robin schedule without duplicate pairs", () => {
    const fixtures = generateRoundRobinFixtures(["p1", "p2", "p3", "p4"]);
    const pairs = fixtures.map((fixture) => [fixture.homeId, fixture.awayId].sort().join(":"));

    expect(fixtures).toHaveLength(6);
    expect(new Set(pairs).size).toBe(6);
    expect(fixtures.every((fixture) => fixture.homeId !== fixture.awayId)).toBe(true);
  });

  it("handles odd player counts with byes and no placeholder fixtures", () => {
    const fixtures = generateRoundRobinFixtures(["p1", "p2", "p3"]);

    expect(fixtures).toHaveLength(3);
    expect(fixtures.some((fixture) => fixture.homeId.includes("BYE") || fixture.awayId.includes("BYE"))).toBe(false);
  });

  it("generates reversed second-leg fixtures for home and away leagues", () => {
    const fixtures = generateRoundRobinFixtures(["p1", "p2", "p3", "p4"], { doubleRound: true });
    const firstLeg = fixtures.slice(0, 6);
    const secondLeg = fixtures.slice(6);

    expect(fixtures).toHaveLength(12);
    expect(secondLeg[0]).toMatchObject({
      homeId: firstLeg[0].awayId,
      awayId: firstLeg[0].homeId,
    });
  });

  it("calculates a league table using football points and tie breakers", () => {
    const table = calculateLeagueTable(["p1", "p2", "p3"], [
      { fixtureId: "m1", homeId: "p1", awayId: "p2", homeScore: 2, awayScore: 1 },
      { fixtureId: "m2", homeId: "p1", awayId: "p3", homeScore: 0, awayScore: 0 },
      { fixtureId: "m3", homeId: "p2", awayId: "p3", homeScore: 4, awayScore: 1 },
    ]);

    expect(table.map((row) => row.playerId)).toEqual(["p1", "p2", "p3"]);
    expect(table[0]).toMatchObject({ points: 4, wins: 1, draws: 1 });
    expect(table[1]).toMatchObject({ points: 3, goalsFor: 5, goalsAgainst: 3, goalDifference: 2 });
  });

  it("sorts seeds by stats, form, division strength, and rank", () => {
    const seeds = sortPlayersForSeeding([
      { id: "p3", points: 9, goalDifference: 2, form: ["W", "L"], divisionTier: 2, divisionRank: 1 },
      { id: "p1", points: 12, goalDifference: 1, form: ["W"], divisionTier: 3, divisionRank: 2 },
      { id: "p2", points: 12, goalDifference: 4, form: ["D"], divisionTier: 1, divisionRank: 4 },
    ]);

    expect(seeds.map((seed) => seed.id)).toEqual(["p2", "p1", "p3"]);
  });

  it("pairs nearest-ranked Swiss opponents who have not played each other", () => {
    const standings = calculateLeagueTable(["p1", "p2", "p3", "p4"], [
      { fixtureId: "m1", homeId: "p1", awayId: "p2", homeScore: 1, awayScore: 0 },
      { fixtureId: "m2", homeId: "p3", awayId: "p4", homeScore: 3, awayScore: 0 },
    ]);
    const fixtures = generateSwissPairings({
      playerIds: ["p1", "p2", "p3", "p4"],
      standings,
      playedPairs: [
        ["p1", "p2"],
        ["p3", "p4"],
      ],
    });

    const pairs = fixtures.map((fixture) => [fixture.homeId, fixture.awayId].sort().join(":"));
    expect(pairs).toEqual(["p1:p3", "p2:p4"]);
  });

  it("generates seeded knockout brackets with byes and feed pointers", () => {
    const bracket = generateKnockoutBracket([
      { id: "seed1", points: 30 },
      { id: "seed2", points: 25 },
      { id: "seed3", points: 20 },
      { id: "seed4", points: 15 },
      { id: "seed5", points: 10 },
    ]);

    const roundOne = bracket.filter((fixture) => fixture.round === 1);
    const semiFinals = bracket.filter((fixture) => fixture.round === 2);

    expect(roundOne).toHaveLength(4);
    expect(semiFinals).toHaveLength(2);
    expect(roundOne[0]).toMatchObject({ homeId: "seed1", awayId: null, status: "BYE", winnerId: "seed1" });
    expect(semiFinals[0].homeId).toBe("seed1");
    expect(roundOne[3]).toMatchObject({ homeId: "seed4", awayId: "seed5" });
  });

  it("advances knockout winners into the configured next fixture slot", () => {
    const bracket = generateKnockoutBracket([
      { id: "seed1", points: 40 },
      { id: "seed2", points: 30 },
      { id: "seed3", points: 20 },
      { id: "seed4", points: 10 },
    ]);

    advanceKnockoutWinner(bracket, "cup-r1-m2", "seed2");

    expect(bracket.find((fixture) => fixture.id === "cup-r2-m1")).toMatchObject({ awayId: "seed2" });
    expect(bracket.find((fixture) => fixture.id === "cup-r1-m2")).toMatchObject({
      status: "PLAYED",
      winnerId: "seed2",
    });
  });
});
