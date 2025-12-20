import express from 'express';
import auth from '../middleware/auth.js';
import { getAllMatches, createMatch, updateMatch, getMatchById, deleteMatch } from '../controller/matchController.js';

const router = express.Router();

router.get('/', getAllMatches);
router.get('/:id', getMatchById);
router.post('/', auth, createMatch);
router.put('/:id', auth, updateMatch);
router.delete('/:id', auth, deleteMatch);

export default router;
