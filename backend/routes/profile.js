import express from 'express';
import auth from '../middleware/auth.js';
import prisma from '../config/prisma.js';

const router = express.Router();

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  isAdmin: user.isAdmin,
  profile: {
    displayName: user.profile?.displayName || '',
    location: user.profile?.location || '',
    favoriteTeam: user.profile?.favoriteTeam || '',
    bio: user.profile?.bio || ''
  }
});

router.get('/me', auth, (req, res) => {
  return res.json(serializeUser(req.user));
});

router.put('/me', auth, async (req, res) => {
  try {
    const { email, profile = {} } = req.body || {};
    const updates = {};

    if (email && email !== req.user.email) {
      // Check if email is already in use by another user
      const existing = await prisma.user.findFirst({ 
        where: { 
          email,
          NOT: { id: req.user.id }
        } 
      });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updates.email = email;
    }

    // Build profile object for update
    const currentProfile = req.user.profile || {};
    const profileFields = ['displayName', 'location', 'favoriteTeam', 'bio'];
    const newProfile = { ...currentProfile };
    profileFields.forEach((field) => {
      if (profile[field] !== undefined) {
        newProfile[field] = profile[field];
      }
    });
    updates.profile = newProfile;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updates
    });

    return res.json(serializeUser(updatedUser));
  } catch (error) {
    console.error('Failed to update profile', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;
