import prisma from '../config/prisma.js';

// helper to enrich a match object with resolved team names
const isHex24 = v => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);
async function enrichMatch(match) {
  if (!match) return match;
  try {
    const teamIds = [match.homeTeam, match.awayTeam].filter(Boolean);
    const validIds = teamIds.filter(isHex24);
    let teams = [];
    if (validIds.length) {
      teams = await prisma.team.findMany({ where: { id: { in: validIds } } });
    }
    const teamMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
    return {
      ...match,
      homeTeamName: match.homeTeam ? (teamMap[match.homeTeam]?.name || (isHex24(match.homeTeam) ? null : match.homeTeam)) : null,
      awayTeamName: match.awayTeam ? (teamMap[match.awayTeam]?.name || (isHex24(match.awayTeam) ? null : match.awayTeam)) : null,
      teamsResolved: (match.teams || []).map(id => teamMap[id] ? { id: teamMap[id].id, name: teamMap[id].name } : { id, name: (isHex24(id) ? undefined : id) })
    };
  } catch (e) {
    console.error('enrichMatch failed', e);
    return match;
  }
}

export const getAllMatches = async (req, res) => {
  try {
    const { tournamentId } = req.query;
    const where = {};
    if (tournamentId) where.tournamentId = tournamentId;
    const matches = await prisma.match.findMany({
      where,
      orderBy: { date: 'asc' }
    });
    // attempt to resolve team names; if enrichment fails, still return raw matches
    try {
      const teamIds = Array.from(new Set(matches.flatMap(m => [m.homeTeam, m.awayTeam].filter(Boolean))));
      // only query teams for values that look like ObjectId hex strings
      const isHex24 = v => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);
      const validIds = teamIds.filter(isHex24);
      let teams = [];
      if (validIds.length) {
        teams = await prisma.team.findMany({ where: { id: { in: validIds } } });
      }
      const teamMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
      const enriched = matches.map(m => ({
        ...m,
        homeTeamName: m.homeTeam ? (teamMap[m.homeTeam]?.name || (isHex24(m.homeTeam) ? null : m.homeTeam)) : null,
        awayTeamName: m.awayTeam ? (teamMap[m.awayTeam]?.name || (isHex24(m.awayTeam) ? null : m.awayTeam)) : null,
        teamsResolved: (m.teams || []).map(id => teamMap[id] ? { id: teamMap[id].id, name: teamMap[id].name } : { id, name: (isHex24(id) ? undefined : id) })
      }));
      return res.json(enriched);
    } catch (enrichErr) {
      console.error('getAllMatches enrichment failed:', enrichErr);
      return res.json(matches);
    }
  } catch (err) {
    console.error('getAllMatches error:', err);
    // return an empty array instead of 500 so frontend can gracefully render
    return res.json([]);
  }
};

export const createMatch = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });

    const { tournamentId, homeTeam, awayTeam, date, venue, durationMin, stage } = req.body;
    if (!tournamentId) return res.status(400).json({ error: 'TournamentId is required' });

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    // tournament.teams should be an array of team ids
    const participants = tournament.teams || [];
    if (!participants.includes(homeTeam) || !participants.includes(awayTeam)) {
      return res.status(400).json({ error: 'Both teams must be participants of the tournament' });
    }

    const allowedStages = ['group', 'round_of_16', 'quarterfinal', 'semi_final', 'final', 'third_place'];
    const normalizedStage = stage && allowedStages.includes(stage) ? stage : 'group';

    const data = {
      tournamentId,
      teams: [homeTeam, awayTeam],
      homeTeam,
      awayTeam,
      date: date ? new Date(date) : null,
      venue,
      durationMin,
      stage: normalizedStage,
      status: 'scheduled',
    };

    const match = await prisma.match.create({ data });
    const enriched = await enrichMatch(match);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create match.' });
  }
};

export const updateMatch = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;
    const { score, status, date, venue, winner, isLive, stage } = req.body;

    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Match not found' });

    const data = {};
    if (score) data.score = score;
    if (status) data.status = status;
    if (typeof isLive === 'boolean') data.isLive = isLive;
    if (date) data.date = new Date(date);
    if (venue) data.venue = venue;
    if (winner) data.winner = winner;
    if (stage) {
      const allowedStages = ['group', 'round_of_16', 'quarterfinal', 'semi_final', 'final', 'third_place'];
      if (allowedStages.includes(stage)) data.stage = stage;
    }

    // If match marked completed and no winner provided, try infer from score
    if (status === 'completed' && !winner && score && typeof score.home === 'number' && typeof score.away === 'number') {
      if (score.home > score.away) data.winner = existing.homeTeam;
      else if (score.away > score.home) data.winner = existing.awayTeam;
    }

    const updated = await prisma.match.update({ where: { id }, data });
    const enriched = await enrichMatch(updated);
    res.json(enriched);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update match.' });
  }
};

export const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    // attempt to resolve team names but return match even if enrichment fails
    try {
      const teamIds = [match.homeTeam, match.awayTeam].filter(Boolean);
      const isHex24 = v => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);
      let teams = [];
      const validIds = teamIds.filter(isHex24);
      if (validIds.length) {
        teams = await prisma.team.findMany({ where: { id: { in: validIds } } });
      }
      const teamMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
      const enriched = {
        ...match,
        homeTeamName: match.homeTeam ? (teamMap[match.homeTeam]?.name || (isHex24(match.homeTeam) ? null : match.homeTeam)) : null,
        awayTeamName: match.awayTeam ? (teamMap[match.awayTeam]?.name || (isHex24(match.awayTeam) ? null : match.awayTeam)) : null,
        teamsResolved: (match.teams || []).map(id => teamMap[id] ? { id: teamMap[id].id, name: teamMap[id].name } : { id, name: (isHex24(id) ? undefined : id) })
      };
      return res.json(enriched);
    } catch (enrichErr) {
      console.error('getMatchById enrichment failed:', enrichErr);
      return res.json(match);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
};

export const deleteMatch = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });

    const { id } = req.params;
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Match not found' });

    // mark as cancelled rather than hard delete to preserve history
    const updated = await prisma.match.update({ where: { id }, data: { status: 'cancelled', isLive: false } });
    res.json(updated);
  } catch (err) {
    console.error('deleteMatch error:', err);
    res.status(400).json({ error: 'Failed to delete match.' });
  }
};
