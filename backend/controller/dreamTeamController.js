import prisma from '../config/prisma.js';

// Helper: Check if user is a team owner
const checkTeamOwner = async (userId) => {
  const teamOwner = await prisma.teamOwner.findUnique({
    where: { userId }
  });
  return teamOwner;
};

// Helper: Calculate player availability
const checkPlayerAvailability = async (playerId) => {
  const player = await prisma.player.findUnique({
    where: { id: playerId }
  });

  if (!player) return { available: false, reason: 'Player not found' };
  
  if (!player.price) {
    return { available: false, reason: 'Player price not set' };
  }

  // Check if player is currently unavailable
  if (player.unavailableUntil && new Date(player.unavailableUntil) > new Date()) {
    return { 
      available: false, 
      reason: 'Player is currently unavailable',
      unavailableUntil: player.unavailableUntil,
      currentOwner: player.currentOwner
    };
  }

  return { available: true, player };
};

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

// Helper: Clean up expired players from dream team
const cleanupExpiredPlayers = async (userId) => {
  try {
    const dreamTeam = await prisma.dreamTeam.findFirst({
      where: { userId }
    });
    
    if (!dreamTeam || !dreamTeam.players || dreamTeam.players.length === 0) {
      return;
    }

    // Get all players in dream team
    const players = await prisma.player.findMany({
      where: { id: { in: dreamTeam.players } }
    });

    const now = new Date();
    const expiredPlayerIds = [];
    const validPlayerIds = [];

    // Check each player's availability
    for (const player of players) {
      if (player.unavailableUntil && new Date(player.unavailableUntil) <= now) {
        expiredPlayerIds.push(player.id);
      } else {
        validPlayerIds.push(player.id);
      }
    }

    // If there are expired players, clean them up
    if (expiredPlayerIds.length > 0) {
      // Release expired players
      await prisma.player.updateMany({
        where: { id: { in: expiredPlayerIds } },
        data: {
          isAvailable: true,
          currentOwner: null,
          purchasedAt: null,
          unavailableUntil: null
        }
      });

      // Update dream team to remove expired players
      await prisma.dreamTeam.update({
        where: { id: dreamTeam.id },
        data: { players: validPlayerIds }
      });
    }
  } catch (err) {
    console.error('Error cleaning up expired players:', err);
  }
};

// Get current user's dream team
export const getMyDreamTeam = async (req, res) => {
  try {
    // Clean up expired players first
    await cleanupExpiredPlayers(req.user.id);

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
    // Check if user is a team owner
    const teamOwner = await checkTeamOwner(req.user.id);
    if (!teamOwner) {
      return res.status(403).json({ error: 'Only team owners can create/update dream teams. Please apply to become a team owner.' });
    }

    const players = req.body.players || [];
    let name;
    if (typeof req.body.name === 'string') {
      name = req.body.name;
    }
    if (players.length > 10) {
      return res.status(400).json({ error: 'You can only add up to 10 players in your dream team.' });
    }

    // Validate all players and calculate total cost
    let totalCost = 0;
    const playerDetails = [];
    const unavailableUntil = new Date();
    unavailableUntil.setDate(unavailableUntil.getDate() + 30); // 30 days lock period

    for (const playerId of players) {
      const availabilityCheck = await checkPlayerAvailability(playerId);
      
      if (!availabilityCheck.available) {
        return res.status(400).json({ 
          error: `Player ${playerId}: ${availabilityCheck.reason}`,
          details: availabilityCheck
        });
      }

      totalCost += availabilityCheck.player.price;
      playerDetails.push(availabilityCheck.player);
    }

    // Check if team owner has sufficient budget
    if (teamOwner.currentBudget < totalCost) {
      return res.status(400).json({ 
        error: 'Insufficient budget.',
        required: totalCost,
        available: teamOwner.currentBudget
      });
    }

    // Get existing dream team
    let dreamTeam = await prisma.dreamTeam.findFirst({
      where: { userId: req.user.id }
    });

    // Release previously owned players
    if (dreamTeam && dreamTeam.players.length > 0) {
      await prisma.player.updateMany({
        where: { 
          id: { in: dreamTeam.players },
          currentOwner: teamOwner.id
        },
        data: {
          isAvailable: true,
          currentOwner: null,
          purchasedAt: null,
          unavailableUntil: null
        }
      });
    }

    // Start a transaction to update players and dream team
    const result = await prisma.$transaction(async (tx) => {
      // Mark new players as unavailable
      for (const player of playerDetails) {
        await tx.player.update({
          where: { id: player.id },
          data: {
            isAvailable: false,
            currentOwner: teamOwner.id,
            purchasedAt: new Date(),
            unavailableUntil
          }
        });

        // Create transaction record
        await tx.playerTransaction.create({
          data: {
            playerId: player.id,
            teamOwnerId: teamOwner.id,
            purchasePrice: player.price,
            expiresAt: unavailableUntil
          }
        });
      }

      // Update team owner budget
      await tx.teamOwner.update({
        where: { id: teamOwner.id },
        data: {
          currentBudget: teamOwner.currentBudget - totalCost
        }
      });

      // Update or create dream team
      if (!dreamTeam) {
        return await tx.dreamTeam.create({
          data: {
            userId: req.user.id,
            players,
            name: name || teamOwner.teamName
          }
        });
      } else {
        const updateData = { players };
        if (typeof name === 'string') {
          updateData.name = name;
        }
        return await tx.dreamTeam.update({
          where: { id: dreamTeam.id },
          data: updateData
        });
      }
    });

    res.json({ 
      dreamTeam: result,
      totalCost,
      remainingBudget: teamOwner.currentBudget - totalCost
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update dream team.' });
  }
};

// Get another user's dream team by userId
export const getDreamTeamByUser = async (req, res) => {
  try {
    // Clean up expired players first
    await cleanupExpiredPlayers(req.params.userId);

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
    
    // Clean up expired players first
    await cleanupExpiredPlayers(user.id);
    
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
