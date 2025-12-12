import merchandiseRoutes from './merchandise.js';
import favoritesRoutes from './favorites.js';
import { Router } from 'express';
import playerController from '../controller/playerController.js';
import teamController from '../controller/teamController.js';
import featuresRoutes from './features.js';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import matchRoutes from './match.js';
import funFactsRoutes from './funFacts.js';
import dreamTeamRoutes from './dreamTeam.js';
import profileRoutes from './profile.js';
import teamOwnerRoutes from './teamOwner.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.use('/merchandise', merchandiseRoutes);
router.use('/funFacts', funFactsRoutes);
router.use('/dreamteam', dreamTeamRoutes);
router.use('/team-owner', teamOwnerRoutes);

router.get('/players', optionalAuth, playerController.getAllPlayers);
router.get('/players/:id', playerController.getPlayerById);
router.post('/players', playerController.createPlayer);
router.put('/players/:id', playerController.updatePlayer);
router.delete('/players/:id', playerController.deletePlayer);

router.get('/teams', teamController.getAllTeams);
router.get('/teams/:id', teamController.getTeamById);
router.post('/teams', teamController.createTeam);
router.put('/teams/:id', teamController.updateTeam);
router.delete('/teams/:id', teamController.deleteTeam);

router.use('/features', featuresRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/profile', profileRoutes);
router.use('/match', matchRoutes);
router.use(authRoutes);
router.use(adminRoutes);

export default router;
