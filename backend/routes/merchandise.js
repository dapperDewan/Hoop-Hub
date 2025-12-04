import express from 'express';
import {
  getAllMerchandise,
  buyMerchandise,
  createMerchandise,
  verifyMerchandise,
  deleteMerchandise
} from '../controller/merchandiseController.js';

const router = express.Router();

router.get('/', getAllMerchandise);
router.post('/', createMerchandise);
router.post('/:id/buy', buyMerchandise);
router.post('/:id/verify', verifyMerchandise);
router.delete('/:id', deleteMerchandise);

export default router;
