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
    const item = await prisma.merchandise.create({
      data: { ...req.body, verified: false }
    });
    res.status(201).json(item);
  } catch (err) {
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
