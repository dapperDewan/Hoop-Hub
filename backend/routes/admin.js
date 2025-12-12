import { Router } from 'express';
import prisma from '../config/prisma.js';

const router = Router();

function requireAdmin(req, res, next) {
  if (req.query.admin === 'true') return next();
  res.status(403).json({ message: 'Admin access required' });
}

router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, isAdmin: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'User deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

router.delete('/admin/players/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.player.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Player deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/players/:id/verify', requireAdmin, async (req, res) => {
  try {
    const updated = await prisma.player.update({
      where: { id: req.params.id },
      data: { verified: true }
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

router.delete('/admin/teams/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.team.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.status(500).json({ message: err.message });
  }
});

export default router;
