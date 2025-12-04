import { Router } from 'express';
import prisma from '../config/prisma.js';

const router = Router();

router.post('/players/byIds', async (req, res) => {
  try {
    const players = await prisma.player.findMany({
      where: { id: { in: req.body.ids } }
    });
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/teams/byIds', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: { id: { in: req.body.ids } }
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
