import prisma from '../config/prisma.js';

// Middleware to check if user is a team owner
const teamOwnerAuth = async function (req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const teamOwner = await prisma.teamOwner.findUnique({
      where: { userId: req.user.id }
    });

    if (!teamOwner) {
      return res.status(403).json({ error: 'Only team owners can access this resource. Please apply to become a team owner.' });
    }

    req.teamOwner = teamOwner;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify team owner status' });
  }
};

export default teamOwnerAuth;
