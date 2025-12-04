import prisma from '../config/prisma.js';

// Admin: Delete any user's dream team
export const deleteDreamTeamByUser = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const result = await prisma.dreamTeam.deleteMany({
      where: { userId: req.params.userId }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Dream team not found.' });
    }
    res.json({ message: 'Dream team deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete dream team.' });
  }
};

// Get current user's dream team
export const getMyDreamTeam = async (req, res) => {
  try {
    const dreamTeam = await prisma.dreamTeam.findFirst({
      where: { userId: req.user.id }
    });
    if (!dreamTeam) {
      return res.json({ players: [] });
    }
    // Populate players
    const players = dreamTeam.players?.length > 0
      ? await prisma.player.findMany({
          where: { id: { in: dreamTeam.players } }
        })
      : [];
    res.json({ ...dreamTeam, players });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dream team.' });
  }
};

// Update current user's dream team
export const updateMyDreamTeam = async (req, res) => {
  try {
    const players = req.body.players || [];
    let name;
    if (typeof req.body.name === 'string') {
      name = req.body.name;
    }
    if (players.length > 5) {
      return res.status(400).json({ error: 'You can only add up to 5 players in your dream team.' });
    }
    
    let dreamTeam = await prisma.dreamTeam.findFirst({
      where: { userId: req.user.id }
    });
    
    if (!dreamTeam) {
      dreamTeam = await prisma.dreamTeam.create({
        data: {
          userId: req.user.id,
          players,
          name: name || 'My Dream Team'
        }
      });
    } else {
      const updateData = { players };
      if (typeof name === 'string') {
        updateData.name = name;
      }
      dreamTeam = await prisma.dreamTeam.update({
        where: { id: dreamTeam.id },
        data: updateData
      });
    }
    res.json(dreamTeam);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update dream team.' });
  }
};

// Get another user's dream team by userId
export const getDreamTeamByUser = async (req, res) => {
  try {
    const dreamTeam = await prisma.dreamTeam.findFirst({
      where: { userId: req.params.userId }
    });
    if (!dreamTeam) {
      return res.json({ players: [] });
    }
    // Populate players
    const players = dreamTeam.players?.length > 0
      ? await prisma.player.findMany({
          where: { id: { in: dreamTeam.players } }
        })
      : [];
    res.json({ ...dreamTeam, players });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dream team.' });
  }
};

// Get another user's dream team by username
export const getDreamTeamByUsername = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const dreamTeam = await prisma.dreamTeam.findFirst({
      where: { userId: user.id }
    });
    if (!dreamTeam) {
      return res.json({ players: [] });
    }
    // Populate players
    const players = dreamTeam.players?.length > 0
      ? await prisma.player.findMany({
          where: { id: { in: dreamTeam.players } }
        })
      : [];
    res.json({ ...dreamTeam, players });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dream team.' });
  }
};
