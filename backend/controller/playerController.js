import prisma from '../config/prisma.js';

const playerController = {
    // Get all players
    getAllPlayers: async (req, res) => {
        try {
            const players = await prisma.player.findMany();
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
            const newPlayer = await prisma.player.create({
                data: req.body
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
