import { Router } from 'express';
import tournamentController from '../controller/tournamentController.js';

const router = Router();

function requireAdmin(req, res, next) {
  if (req.query.admin === 'true') return next();
  res.status(403).json({ message: 'Admin access required' });
}

// Public: list tournaments
router.get('/', tournamentController.listTournaments);
router.get('/:id', tournamentController.getTournament);

// Admin: create tournament
router.post('/', requireAdmin, tournamentController.createTournament);

// Suggest matchups for given list of teams (body: { teams: [...] })
router.post('/suggest', requireAdmin, tournamentController.suggestMatchups);

// Register tournament: create matches for first round and mark scheduled
router.post('/:id/register', requireAdmin, tournamentController.registerTournament);

export default router;
