import express from 'express';
import {
  applyToBeTeamOwner,
  getMyApplication,
  getAllApplications,
  approveApplication,
  rejectApplication,
  getMyTeamOwnerProfile,
  getAllTeamOwners
} from '../controller/teamOwnerController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// User routes
router.post('/apply', auth, applyToBeTeamOwner);
router.get('/my-application', auth, getMyApplication);
router.get('/my-profile', auth, getMyTeamOwnerProfile);
router.get('/all', auth, getAllTeamOwners); // Only accessible by team owners

// Admin routes
router.get('/applications', auth, getAllApplications);
router.post('/applications/:applicationId/approve', auth, approveApplication);
router.post('/applications/:applicationId/reject', auth, rejectApplication);

export default router;
