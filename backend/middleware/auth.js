import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const secret = process.env.JWT_SECRET || 'supersecretkey';

const auth = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional auth middleware - doesn't fail if no token, just sets req.user if valid token exists
export const optionalAuth = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without user
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    req.user = user || null;
    next();
  } catch (err) {
    // Invalid token, continue without user
    req.user = null;
    next();
  }
};

export default auth;
