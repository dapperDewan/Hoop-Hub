import prisma from '../config/prisma.js';

// Suggest simple bracket pairings: adjacent pairing, build rounds until winner
function generateBracket(teams) {
  const rounds = [];
  let current = teams.slice();
  while (current.length > 1) {
    const matches = [];
    for (let i = 0; i < current.length; i += 2) {
      const home = current[i];
      const away = current[i + 1] ?? null; // bye if null
      matches.push({ home, away });
    }
    rounds.push(matches);
    // build next round placeholders (winners)
    current = matches.map((m, idx) => `W${rounds.length}_${idx}`);
  }
  return rounds;
}

const tournamentController = {
  listTournaments: async (req, res) => {
    try {
      const tournaments = await prisma.tournament.findMany({
        orderBy: { startDate: 'desc' }
      });
      // Optionally populate teams
      const populated = await Promise.all(
        tournaments.map(async (t) => {
          const teams = t.teams && t.teams.length > 0
            ? await prisma.team.findMany({ where: { id: { in: t.teams } } })
            : [];
          return { ...t, teams };
        })
      );
      res.json(populated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch tournaments.' });
    }
  },

  getTournament: async (req, res) => {
    try {
      const t = await prisma.tournament.findUnique({ where: { id: req.params.id } });
      if (!t) return res.status(404).json({ message: 'Tournament not found' });
      const teams = t.teams && t.teams.length > 0
        ? await prisma.team.findMany({ where: { id: { in: t.teams } } })
        : [];
      res.json({ ...t, teams });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch tournament.' });
    }
  },

  createTournament: async (req, res) => {
    try {
      // Admin check expected to be done in route; still guard if omitted
      if (req.query.admin !== 'true') return res.status(403).json({ message: 'Admin access required' });

      // Ensure Prisma client has the Tournament model generated
      try {
        console.log('Prisma client type:', typeof prisma);
        console.log('Prisma client keys:', Object.keys(prisma || {}));
      } catch (e) {
        console.error('Failed to list prisma keys', e);
      }
      if (!prisma || !prisma.tournament) {
        console.error('Prisma client missing `tournament`. Did you run `npx prisma generate` after schema changes?');
        return res.status(500).json({ message: 'Server misconfiguration: Tournament model not available. Run `npx prisma generate` and restart the server.' });
      }

      const payload = req.body;
      // Basic validation so clients get clearer 4xx responses
      const { name, startDate, endDate, teams } = payload || {};
      console.log('createTournament payload:', payload);
      if (!name || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required fields: name, startDate, endDate' });
      }
      if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
        return res.status(400).json({ message: 'Invalid date format for startDate or endDate' });
      }
      if (teams && !Array.isArray(teams)) {
        return res.status(400).json({ message: 'teams must be an array of team IDs' });
      }

      // Expect payload to include: name, startDate, endDate, teams (array of team IDs)
      const created = await prisma.tournament.create({ data: payload });
      res.status(201).json(created);
    } catch (err) {
      console.error('createTournament error:', err);
      res.status(400).json({ error: err.message || 'Failed to create tournament.' });
    }
  },

  suggestMatchups: async (req, res) => {
    try {
      const { teams } = req.body;
      if (!teams || !Array.isArray(teams) || teams.length < 2) {
        return res.status(400).json({ message: 'Provide an array of at least two team IDs.' });
      }
      const rounds = generateBracket(teams);
      res.json({ rounds });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  registerTournament: async (req, res) => {
    try {
      if (req.query.admin !== 'true') return res.status(403).json({ message: 'Admin access required' });
      const tournamentId = req.params.id;
      const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
      if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
      const teams = tournament.teams || [];
      if (teams.length < 2) return res.status(400).json({ message: 'Tournament needs at least two teams.' });

      // Create suggested pairings (first round) and persist as matches
      const rounds = generateBracket(teams);
      const firstRound = rounds[0] || [];

      const baseDate = tournament.startDate ? new Date(tournament.startDate) : null;
      const createdMatches = [];
      for (let i = 0; i < firstRound.length; i++) {
        const m = firstRound[i];
        const date = baseDate ? new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000) : null;
        const matchData = {
          homeTeam: m.home || null,
          awayTeam: m.away || null,
          tournamentId: tournamentId,
          date: date,
          status: 'scheduled'
        };
        const created = await prisma.match.create({ data: matchData });
        createdMatches.push(created);
      }

      // update tournament status
      await prisma.tournament.update({ where: { id: tournamentId }, data: { status: 'scheduled' } });

      res.json({ message: 'Tournament registered', matches: createdMatches });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

export default tournamentController;
