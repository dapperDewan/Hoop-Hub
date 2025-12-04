import prisma from '../config/prisma.js';

const teamController = {
    // Get all teams
    getAllTeams: async (req, res) => {
        try {
            const teams = await prisma.team.findMany();
            // Populate roster manually since Prisma doesn't have automatic refs like Mongoose
            const teamsWithRoster = await Promise.all(
                teams.map(async (team) => {
                    if (team.roster && team.roster.length > 0) {
                        const roster = await prisma.player.findMany({
                            where: { id: { in: team.roster } }
                        });
                        return { ...team, roster };
                    }
                    return { ...team, roster: [] };
                })
            );
            res.json(teamsWithRoster);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get single team by ID
    getTeamById: async (req, res) => {
        try {
            const team = await prisma.team.findUnique({
                where: { id: req.params.id }
            });
            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }
            // Populate roster
            if (team.roster && team.roster.length > 0) {
                const roster = await prisma.player.findMany({
                    where: { id: { in: team.roster } }
                });
                return res.json({ ...team, roster });
            }
            res.json({ ...team, roster: [] });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Create a new team
    createTeam: async (req, res) => {
        try {
            const newTeam = await prisma.team.create({
                data: req.body
            });
            res.status(201).json(newTeam);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Update a team
    updateTeam: async (req, res) => {
        try {
            const team = await prisma.team.findUnique({
                where: { id: req.params.id }
            });
            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }
            
            const updatedTeam = await prisma.team.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(updatedTeam);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Delete a team
    deleteTeam: async (req, res) => {
        try {
            const team = await prisma.team.findUnique({
                where: { id: req.params.id }
            });
            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }
            
            await prisma.team.delete({
                where: { id: req.params.id }
            });
            res.json({ message: 'Team deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default teamController;
