/**
 * Deterministic round-robin match generator.
 * Uses the "round-robin tournament" algorithm (circle method).
 * Returns ordered pairs [homeIndex, awayIndex] for each round.
 */
export function generateRoundRobinPairs(teamCount: number): [number, number][][] {
  if (teamCount < 2) return [];

  const teams = Array.from({ length: teamCount }, (_, i) => i);
  // Add bye if odd
  const hasBye = teamCount % 2 !== 0;
  if (hasBye) teams.push(-1); // -1 = bye

  const n = teams.length;
  const rounds: [number, number][][] = [];

  for (let round = 0; round < n - 1; round++) {
    const roundPairs: [number, number][] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = teams[i];
      const away = teams[n - 1 - i];
      if (home !== -1 && away !== -1) {
        roundPairs.push([home, away]);
      }
    }
    rounds.push(roundPairs);
    // Rotate: keep teams[0] fixed, rotate rest
    teams.splice(1, 0, teams.pop()!);
  }

  return rounds;
}

export type MatchSlot = {
  roundIndex: number;
  homeTeamIndex: number;
  awayTeamIndex: number;
  phase: "regular";
};

export function generateSingleRoundRobin(teamCount: number): MatchSlot[] {
  const rounds = generateRoundRobinPairs(teamCount);
  return rounds.flatMap((round, ri) =>
    round.map((pair) => ({
      roundIndex: ri,
      homeTeamIndex: pair[0],
      awayTeamIndex: pair[1],
      phase: "regular" as const,
    }))
  );
}

export function generateDoubleRoundRobin(teamCount: number): MatchSlot[] {
  const single = generateSingleRoundRobin(teamCount);
  const reversed = single.map((m) => ({
    ...m,
    roundIndex: m.roundIndex + (teamCount % 2 === 0 ? teamCount - 1 : teamCount),
    homeTeamIndex: m.awayTeamIndex,
    awayTeamIndex: m.homeTeamIndex,
  }));
  return [...single, ...reversed];
}
