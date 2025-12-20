import express from 'express';
import {
  getMyDreamTeam,
  updateMyDreamTeam,
  getDreamTeamByUser,
  getAllDreamTeams,
  getDreamTeamByUsername,
  deleteDreamTeamByUser
} from '../controller/dreamTeamController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/my', auth, getMyDreamTeam);
router.get('/', getAllDreamTeams);
router.put('/my', auth, updateMyDreamTeam);
router.get('/user/:userId', getDreamTeamByUser);
router.get('/username/:username', getDreamTeamByUsername);
router.delete('/user/:userId', auth, deleteDreamTeamByUser);

export default router;
