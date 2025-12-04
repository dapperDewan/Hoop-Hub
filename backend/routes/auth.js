import express from 'express';
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const secret = process.env.JWT_SECRET || 'supersecretkey';

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const existingEmail = await prisma.user.findFirst({ where: { email } });
    if (existingEmail) return res.status(400).json({ message: 'Email already in use' });
    const hashed = await bcrypt.hash(password, 10);
    const isAdmin = username.toLowerCase() === 'araav';
    const user = await prisma.user.create({
      data: { username, password: hashed, isAdmin, email }
    });
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });
    res.json({ username: user.username, email: user.email, isAdmin: user.isAdmin, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });
    res.json({ username: user.username, email: user.email, isAdmin: user.isAdmin, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Google OAuth endpoint
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
    }

    // Check if user exists by email
    let user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      // Create new user with Google data
      // Generate a unique username from email or name
      let username = email.split('@')[0];
      
      // Check if username exists, append random numbers if it does
      let existingUsername = await prisma.user.findUnique({ where: { username } });
      while (existingUsername) {
        username = `${email.split('@')[0]}${Math.floor(Math.random() * 10000)}`;
        existingUsername = await prisma.user.findUnique({ where: { username } });
      }

      user = await prisma.user.create({
        data: {
          username,
          email,
          password: '', // No password for Google users
          googleId,
          profile: {
            displayName: name || '',
            avatar: picture || ''
          }
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });
    
    res.json({ 
      username: user.username, 
      email: user.email, 
      isAdmin: user.isAdmin || false, 
      token 
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

export default router;
