import express from 'express';
import {
  getAllMerchandise,
  buyMerchandise,
  createMerchandise,
  verifyMerchandise,
  deleteMerchandise,
  getMerchandiseOwner,
  updateMerchandise,
  checkoutMerchandise,
  getAllOrders,
  getOwnerOrders,
  approveOrder,
  rejectOrder,
  getUserOrders
} from '../controller/merchandiseController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Non-parameterized routes first
router.get('/', getAllMerchandise);
router.post('/', createMerchandise);

// Checkout and orders - BEFORE parameterized routes
router.post('/checkout', auth, checkoutMerchandise);
router.get('/orders', auth, getAllOrders); // Admin gets all orders
router.get('/orders/my', auth, getUserOrders); // User gets their orders
router.get('/orders/owner', auth, getOwnerOrders); // Team owner gets their product orders
router.post('/orders/:id/approve', auth, approveOrder);
router.post('/orders/:id/reject', auth, rejectOrder);

// Parameterized routes AFTER specific routes
router.post('/:id/buy', buyMerchandise);
router.post('/:id/verify', verifyMerchandise);
router.get('/:id/owner', getMerchandiseOwner);
router.put('/:id', auth, updateMerchandise);
router.delete('/:id', deleteMerchandise);

export default router;
