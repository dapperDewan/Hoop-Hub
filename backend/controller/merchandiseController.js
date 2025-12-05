import prisma from '../config/prisma.js';

export const getAllMerchandise = async (req, res) => {
  try {
    const items = await prisma.merchandise.findMany();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch merchandise.' });
  }
};

export const buyMerchandise = async (req, res) => {
  try {
    const item = await prisma.merchandise.findUnique({
      where: { id: req.params.id }
    });
    if (!item || item.stock <= 0) {
      return res.status(400).json({ error: 'Item not available.' });
    }
    const updatedItem = await prisma.merchandise.update({
      where: { id: req.params.id },
      data: { stock: item.stock - 1 }
    });
    res.json({ message: 'Purchase successful!', item: updatedItem });
  } catch (err) {
    res.status(500).json({ error: 'Failed to buy merchandise.' });
  }
};

export const createMerchandise = async (req, res) => {
  try {
    const { name, description, price, image, stock, category, ownerId, ownerName, ownerEmail, isAdmin } = req.body;
    
    // Check if owner info is provided and profile is complete (skip for admin)
    if (ownerId && !isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: ownerId }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      
      // Check if profile is complete (has displayName or bio)
      const hasProfile = user.profile && (user.profile.displayName || user.profile.bio);
      if (!hasProfile) {
        return res.status(400).json({ 
          error: 'Please complete your profile before listing products.',
          profileIncomplete: true 
        });
      }
    }

    const item = await prisma.merchandise.create({
      data: { 
        name,
        description,
        price: price ? Number(price) : null,
        image,
        stock: stock ? Number(stock) : 10,
        category,
        verified: isAdmin ? true : false, // Admin products are verified by default
        ownerId: ownerId || null,
        ownerName: ownerName || null,
        ownerEmail: ownerEmail || null
      }
    });
    res.status(201).json(item);
  } catch (err) {
    console.error('Create merchandise error:', err);
    res.status(400).json({ error: 'Failed to create merchandise.' });
  }
};

// Admin: verify merchandise
export const verifyMerchandise = async (req, res) => {
  try {
    const item = await prisma.merchandise.update({
      where: { id: req.params.id },
      data: { verified: true }
    });
    res.json(item);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found.' });
    }
    res.status(500).json({ error: 'Failed to verify merchandise.' });
  }
};

// Admin: delete merchandise
export const deleteMerchandise = async (req, res) => {
  try {
    await prisma.merchandise.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Deleted successfully.' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found.' });
    }
    res.status(500).json({ error: 'Failed to delete merchandise.' });
  }
};

// Update merchandise (owner can edit their listing, sets verified to false for re-review)
export const updateMerchandise = async (req, res) => {
  try {
    const { name, description, price, image, stock, category } = req.body;
    const userId = req.user?.id;
    
    // Find the item first
    const item = await prisma.merchandise.findUnique({
      where: { id: req.params.id }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    
    // Check if user is owner or admin
    const isOwner = item.ownerId === userId;
    const isAdmin = req.user?.isAdmin;
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to edit this listing.' });
    }
    
    // Update the item - set verified to false if edited by owner (needs re-verification)
    const updatedItem = await prisma.merchandise.update({
      where: { id: req.params.id },
      data: {
        name: name || item.name,
        description: description !== undefined ? description : item.description,
        price: price !== undefined ? Number(price) : item.price,
        image: image || item.image,
        stock: stock !== undefined ? Number(stock) : item.stock,
        category: category || item.category,
        verified: isAdmin ? item.verified : false // Reset verification if owner edits
      }
    });
    
    res.json(updatedItem);
  } catch (err) {
    console.error('Update merchandise error:', err);
    res.status(500).json({ error: 'Failed to update merchandise.' });
  }
};

// Get owner info for a merchandise item
export const getMerchandiseOwner = async (req, res) => {
  try {
    const item = await prisma.merchandise.findUnique({
      where: { id: req.params.id }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    
    if (!item.ownerId) {
      return res.json({ owner: null });
    }
    
    const owner = await prisma.user.findUnique({
      where: { id: item.ownerId },
      select: {
        id: true,
        username: true,
        email: true,
        profile: true
      }
    });
    
    res.json({ owner });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch owner info.' });
  }
};
