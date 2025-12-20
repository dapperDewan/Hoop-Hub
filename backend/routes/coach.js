import express from 'express';
import * as coachController from '../controller/coachController.js';
import auth from '../middleware/auth.js';
import teamOwnerAuth from '../middleware/teamOwnerAuth.js';

const router = express.Router();

// Team owner routes
router.get('/my/bookings', auth, teamOwnerAuth, coachController.getMyBookings);
router.post('/:id/book', auth, teamOwnerAuth, coachController.bookCoach);
// checkout route removed; coaches are purchased via POST /:id/book

// Public
router.get('/', coachController.getAllCoaches);
router.get('/:id', coachController.getCoachById);

// Admin
router.post('/', auth, coachController.createCoach);
router.put('/:id', auth, coachController.updateCoach);
router.delete('/:id', auth, coachController.deleteCoach);
router.get('/:id/bookings', auth, coachController.getCoachBookings);
router.post('/bookings/:id/approve', auth, coachController.approveBooking);
router.post('/bookings/:id/reject', auth, coachController.rejectBooking);
router.get('/bookings', auth, coachController.getAllBookings);

export default router;
