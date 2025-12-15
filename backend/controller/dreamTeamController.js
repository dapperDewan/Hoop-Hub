import prisma from '../config/prisma.js';

// Helper: Check if user is a team owner
const checkTeamOwner = async (userId) => {
  const teamOwner = await prisma.teamOwner.findUnique({
    where: { userId }
  });
  return teamOwner;
};

// Helper: Calculate player availability
// teamOwnerId is optional - if provided, allows players already owned by this team owner
const checkPlayerAvailability = async (playerId, teamOwnerId = null) => {
  const player = await prisma.player.findUnique({
    where: { id: playerId }
  });

  if (!player) return { available: false, reason: 'Player not found' };
  
  if (!player.price) {
    return { available: false, reason: 'Player price not set' };
  }

  // Check if player is currently unavailable
  if (player.unavailableUntil && new Date(player.unavailableUntil) > new Date()) {
    // If the player is owned by the same team owner, they can still include them
    if (teamOwnerId && player.currentOwner === teamOwnerId) {
      return { available: true, player, alreadyOwned: true };
    }
    return { 
      available: false, 
      reason: 'Player is currently unavailable',
      unavailableUntil: player.unavailableUntil,
      currentOwner: player.currentOwner
    };
  }

  return { available: true, player, alreadyOwned: false };
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

    // Get existing dream team to know which players are already owned
    let dreamTeam = await prisma.dreamTeam.findFirst({
      where: { userId: req.user.id }
    });
    const existingPlayerIds = dreamTeam?.players || [];

    // Validate all players and calculate total cost (only for NEW players)
    let totalCost = 0;
    const playerDetails = [];
    const newPlayerDetails = []; // Players that need to be purchased
    const existingPlayerDetails = []; // Players already owned
    const unavailableUntil = new Date();
    unavailableUntil.setDate(unavailableUntil.getDate() + 30); // 30 days lock period

    for (const playerId of players) {
      // Pass teamOwnerId to allow already-owned players
      const availabilityCheck = await checkPlayerAvailability(playerId, teamOwner.id);
      
      if (!availabilityCheck.available) {
        return res.status(400).json({ 
          error: `Player ${playerId}: ${availabilityCheck.reason}`,
          details: availabilityCheck
        });
      }

      playerDetails.push(availabilityCheck.player);
      
      // Only charge for players that are not already owned by this team owner
      if (!availabilityCheck.alreadyOwned) {
        totalCost += availabilityCheck.player.price;
        newPlayerDetails.push(availabilityCheck.player);
      } else {
        existingPlayerDetails.push(availabilityCheck.player);
      }
    }

    // Check if team owner has sufficient budget (only for new players)
    if (teamOwner.currentBudget < totalCost) {
      return res.status(400).json({ 
        error: 'Insufficient budget.',
        required: totalCost,
        available: teamOwner.currentBudget
      });
    }

    // Find players to release (were in dream team but not in new list)
    const playersToRelease = existingPlayerIds.filter(id => !players.includes(id));

    // Release players that are being removed from the team
    if (playersToRelease.length > 0) {
      await prisma.player.updateMany({
        where: { 
          id: { in: playersToRelease },
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
      // Only mark NEW players as unavailable (not already owned ones)
      for (const player of newPlayerDetails) {
        await tx.player.update({
          where: { id: player.id },
          data: {
            isAvailable: false,
            currentOwner: teamOwner.id,
            purchasedAt: new Date(),
            unavailableUntil
          }
        });

        // Create transaction record only for new purchases
        await tx.playerTransaction.create({
          data: {
            playerId: player.id,
            teamOwnerId: teamOwner.id,
            purchasePrice: player.price,
            expiresAt: unavailableUntil
          }
        });
      }

      // Update team owner budget (only deduct for new players)
      if (totalCost > 0) {
        await tx.teamOwner.update({
          where: { id: teamOwner.id },
          data: {
            currentBudget: teamOwner.currentBudget - totalCost
          }
        });
      }

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

// Get a list of recent dream teams for exploration
export const getAllDreamTeams = async (req, res) => {
  try {
    const dreamTeams = await prisma.dreamTeam.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const results = [];
    for (const dt of dreamTeams) {
      const players = dt.players?.length > 0
        ? await prisma.player.findMany({ where: { id: { in: dt.players } } })
        : [];
      const user = await prisma.user.findUnique({ where: { id: dt.userId } });
      results.push({
        id: dt.id,
        userId: dt.userId,
        username: user?.username || null,
        name: dt.name || null,
        players
      });
    }

    res.json({ teams: results });
  } catch (err) {
    console.error('Failed to list dream teams', err);
    res.status(500).json({ error: 'Failed to list dream teams.' });
  }
};
