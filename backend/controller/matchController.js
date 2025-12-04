import prisma from '../config/prisma.js';

export const getAllMatches = async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { date: 'asc' }
    });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches.' });
  }
};

export const createMatch = async (req, res) => {
  try {
    const match = await prisma.match.create({
      data: req.body
    });
    res.status(201).json(match);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create match.' });
  }
};
