import express from 'express';
import {
  getAllMerchandise,
  buyMerchandise,
  createMerchandise,
  verifyMerchandise,
  deleteMerchandise,
  getMerchandiseOwner,
  updateMerchandise
} from '../controller/merchandiseController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllMerchandise);
router.post('/', createMerchandise);
router.post('/:id/buy', buyMerchandise);
router.post('/:id/verify', verifyMerchandise);
router.get('/:id/owner', getMerchandiseOwner);
router.put('/:id', auth, updateMerchandise);
router.delete('/:id', deleteMerchandise);

export default router;
