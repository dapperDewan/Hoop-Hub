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

// Checkout with payment - creates an order pending admin approval
export const checkoutMerchandise = async (req, res) => {
  try {
    const { items, paymentInfo, buyerPhone } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart.' });
    }
    
    if (!paymentInfo || !paymentInfo.method || !paymentInfo.phoneNumber || !paymentInfo.transactionId) {
      return res.status(400).json({ error: 'Payment information is required.' });
    }
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Validate and get merchandise items
    const merchandiseIds = items.map(item => item.id || item._id);
    const merchandiseItems = await prisma.merchandise.findMany({
      where: { id: { in: merchandiseIds } }
    });
    
    // Check stock availability
    for (const cartItem of items) {
      const merchItem = merchandiseItems.find(m => m.id === (cartItem.id || cartItem._id));
      if (!merchItem) {
        return res.status(400).json({ error: `Item ${cartItem.name} not found.` });
      }
      if (merchItem.stock < cartItem.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${cartItem.name}.` });
      }
    }
    
    // Calculate total and prepare order items
    const orderItems = items.map(item => {
      const merchItem = merchandiseItems.find(m => m.id === (item.id || item._id));
      return {
        merchandiseId: merchItem.id,
        name: merchItem.name,
        price: merchItem.price,
        quantity: item.quantity,
        image: merchItem.image
      };
    });
    
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Get owner info (assuming all items belong to the same owner for simplicity)
    const firstItem = merchandiseItems[0];
    
    // Create the order
    const order = await prisma.merchandiseOrder.create({
      data: {
        buyerId: userId,
        buyerName: user.profile?.displayName || user.username,
        buyerEmail: user.email,
        buyerPhone: buyerPhone || paymentInfo.phoneNumber,
        items: orderItems,
        totalAmount,
        paymentInfo: {
          method: paymentInfo.method,
          phoneNumber: paymentInfo.phoneNumber,
          transactionId: paymentInfo.transactionId,
          timestamp: paymentInfo.timestamp || new Date().toISOString()
        },
        status: 'pending',
        ownerId: firstItem.ownerId,
        ownerName: firstItem.ownerName
      }
    });
    
    // Reserve stock (reduce it)
    for (const cartItem of items) {
      const merchItem = merchandiseItems.find(m => m.id === (cartItem.id || cartItem._id));
      await prisma.merchandise.update({
        where: { id: merchItem.id },
        data: { stock: merchItem.stock - cartItem.quantity }
      });
    }
    
    res.status(201).json({ 
      message: 'Order placed successfully! Awaiting admin approval.',
      order 
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to process checkout.' });
  }
};

// Get all orders (admin only)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.merchandiseOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

// Get orders for a specific team owner
export const getOwnerOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    console.log('getOwnerOrders userId:', userId);
    console.log('getOwnerOrders req.user:', req.user);
    console.log('userId type:', typeof userId, 'value:', userId);

    // Return all orders for which this user is the owner (include pending/approved/rejected)
    let orders;
    try {
      orders = await prisma.merchandiseOrder.findMany({
        where: { ownerId: userId }
      });
      console.log('getOwnerOrders found orders:', orders.length);
    } catch (queryErr) {
      console.error('Prisma query error in getOwnerOrders:', queryErr);
      throw queryErr; // Re-throw to be caught by outer catch
    }

    res.json(orders);
  } catch (err) {
    console.error('Get owner orders error:', err);
    // Handle malformed ObjectId errors from Prisma gracefully
    if (err.code === 'P2023' || err.message?.includes('Malformed ObjectID')) {
      return res.status(400).json({ error: 'Invalid owner id for query.', details: err.message });
    }
    // Return error message for easier debugging in dev
    return res.status(500).json({ error: 'Failed to fetch orders.', details: err.message });
  }
};

// Approve order (admin only) - adds amount to team owner's balance
export const approveOrder = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const orderId = req.params.id;
    
    const order = await prisma.merchandiseOrder.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order already processed.' });
    }
    
    // Update order status
    const updatedOrder = await prisma.merchandiseOrder.update({
      where: { id: orderId },
      data: {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    });
    
    // Add amount to team owner's balance if ownerId exists
    if (order.ownerId) {
      const teamOwner = await prisma.teamOwner.findUnique({
        where: { userId: order.ownerId }
      });
      
      if (teamOwner) {
        await prisma.teamOwner.update({
          where: { userId: order.ownerId },
          data: {
            currentBudget: teamOwner.currentBudget + order.totalAmount
          }
        });
      }
    }
    
    res.json({ 
      message: 'Order approved! Amount added to team owner balance.',
      order: updatedOrder 
    });
  } catch (err) {
    console.error('Approve order error:', err);
    res.status(500).json({ error: 'Failed to approve order.' });
  }
};

// Reject order (admin only) - restores stock
export const rejectOrder = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const orderId = req.params.id;
    
    const order = await prisma.merchandiseOrder.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order already processed.' });
    }
    
    // Restore stock
    for (const item of order.items) {
      const merchItem = await prisma.merchandise.findUnique({
        where: { id: item.merchandiseId }
      });
      
      if (merchItem) {
        await prisma.merchandise.update({
          where: { id: item.merchandiseId },
          data: { stock: merchItem.stock + item.quantity }
        });
      }
    }
    
    // Update order status
    const updatedOrder = await prisma.merchandiseOrder.update({
      where: { id: orderId },
      data: {
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    });
    
    res.json({ 
      message: 'Order rejected. Stock restored.',
      order: updatedOrder 
    });
  } catch (err) {
    console.error('Reject order error:', err);
    res.status(500).json({ error: 'Failed to reject order.' });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const orders = await prisma.merchandiseOrder.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
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
