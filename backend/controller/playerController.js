import prisma from '../config/prisma.js';

const playerController = {
    // Get all players
    getAllPlayers: async (req, res) => {
        try {
            const isAdmin = req.query.admin === 'true';
            // Check if user is a team owner (passed from auth middleware if available)
            const isTeamOwner = req.user ? await prisma.teamOwner.findUnique({
                where: { userId: req.user.id }
            }) : null;

            // For non-admins, show everything except explicitly unverified=false
            const where = isAdmin ? {} : { NOT: { verified: false } };
            let players = await prisma.player.findMany({ where });

            // If user is a team owner, include ownership details
            // If user is not a team owner, hide certain fields
            if (!isTeamOwner && !isAdmin) {
                // Hide ownership and price details from regular users
                players = players.map(player => ({
                    ...player,
                    price: undefined,
                    isAvailable: undefined,
                    currentOwner: undefined,
                    purchasedAt: undefined,
                    unavailableUntil: undefined
                }));
            } else if (isTeamOwner) {
                // For team owners, include owner info
                const ownerIds = [...new Set(players.map(p => p.currentOwner).filter(Boolean))];
                const owners = await prisma.teamOwner.findMany({
                    where: { id: { in: ownerIds } },
                    include: {
                        user: { select: { username: true } }
                    }
                });
                const ownerMap = Object.fromEntries(owners.map(o => [o.id, o]));
                
                players = players.map(player => ({
                    ...player,
                    ownerInfo: player.currentOwner ? ownerMap[player.currentOwner] : null
                }));
            }

            res.json(players);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get a single player by ID
    getPlayerById: async (req, res) => {
        try {
            const player = await prisma.player.findUnique({
                where: { id: req.params.id }
            });
            if (!player) {
                return res.status(404).json({ message: 'Player not found' });
            }
            res.json(player);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Create a new player
    createPlayer: async (req, res) => {
        try {
            const isAdmin = req.query.admin === 'true';
            const newPlayer = await prisma.player.create({
                data: {
                    ...req.body,
                    verified: isAdmin ? true : false
                }
            });
            res.status(201).json(newPlayer);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Update a player
    updatePlayer: async (req, res) => {
        try {
            const player = await prisma.player.findUnique({
                where: { id: req.params.id }
            });
            if (!player) {
                return res.status(404).json({ message: 'Player not found' });
            }
            
            const updatedPlayer = await prisma.player.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(updatedPlayer);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Delete a player
    deletePlayer: async (req, res) => {
        try {
            const player = await prisma.player.findUnique({
                where: { id: req.params.id }
            });
            if (!player) {
                return res.status(404).json({ message: 'Player not found' });
            }
            
            await prisma.player.delete({
                where: { id: req.params.id }
            });
            res.json({ message: 'Player deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default playerController;
