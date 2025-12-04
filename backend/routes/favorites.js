import express from 'express';
import prisma from '../config/prisma.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/players', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!user || !user.favorites || user.favorites.length === 0) {
      return res.json([]);
    }
    // Populate favorites
    const favorites = await prisma.player.findMany({
      where: { id: { in: user.favorites } }
    });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorite players.' });
  }
});

router.put('/players', auth, async (req, res) => {
  try {
    const favorites = req.body.favorites || [];
    await prisma.user.update({
      where: { id: req.user.id },
      data: { favorites }
    });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update favorite players.' });
  }
});

router.get('/teams', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!user || !user.favoriteTeams || user.favoriteTeams.length === 0) {
      return res.json([]);
    }
    // Populate favoriteTeams
    const favoriteTeams = await prisma.team.findMany({
      where: { id: { in: user.favoriteTeams } }
    });
    res.json(favoriteTeams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorite teams.' });
  }
});

router.put('/teams', auth, async (req, res) => {
  try {
    const favoriteTeams = req.body.favoriteTeams || [];
    await prisma.user.update({
      where: { id: req.user.id },
      data: { favoriteTeams }
    });
    res.json(favoriteTeams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update favorite teams.' });
  }
});

export default router;
