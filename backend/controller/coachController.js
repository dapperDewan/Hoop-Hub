import prisma from '../config/prisma.js';

// Admin: create a coach
export const createCoach = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required.' });
    }
    const { name, title, price, image, description } = req.body;
    const adminId = req.user.id;
    const coach = await prisma.coach.create({
      data: {
        name,
        title: title || null,
        price: price ? Number(price) : 0,
        image: image || null,
        description: description || null,
        adminId
      }
    });
    res.status(201).json(coach);
  } catch (err) {
    console.error('Create coach error:', err);
    res.status(500).json({ error: 'Failed to create coach.' });
  }
};

// Public: list coaches
export const getAllCoaches = async (req, res) => {
  try {
    const coaches = await prisma.coach.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coaches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coaches.' });
  }
};

export const getCoachById = async (req, res) => {
  try {
    const coach = await prisma.coach.findUnique({ where: { id: req.params.id } });
    if (!coach) return res.status(404).json({ error: 'Coach not found.' });
    res.json(coach);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coach.' });
  }
};

// Admin: update
export const updateCoach = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required.' });
    }
    const { name, title, price, image, description } = req.body;
    const coach = await prisma.coach.update({
      where: { id: req.params.id },
      data: {
        name,
        title: title || null,
        price: price ? Number(price) : undefined,
        image: image || null,
        description: description || null
      }
    });
    res.json(coach);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Coach not found.' });
    res.status(500).json({ error: 'Failed to update coach.' });
  }
};

// Admin: delete
export const deleteCoach = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required.' });
    }
    await prisma.coach.delete({ where: { id: req.params.id } });
    res.json({ message: 'Coach deleted.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Coach not found.' });
    res.status(500).json({ error: 'Failed to delete coach.' });
  }
};

// Team owner books a coach for 30 days
export const bookCoach = async (req, res) => {
  try {
    // teamOwnerAuth middleware should populate req.teamOwner
    const teamOwner = req.teamOwner;
    if (!teamOwner) return res.status(403).json({ error: 'Team owner access required.' });

    const coach = await prisma.coach.findUnique({ where: { id: req.params.id } });
    if (!coach) return res.status(404).json({ error: 'Coach not found.' });

    // Immediate purchase flow: ensure owner balance and availability
    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    // Refresh team owner from DB to get latest budget
    const owner = await prisma.teamOwner.findUnique({ where: { id: teamOwner.id } });
    if (!owner) return res.status(404).json({ error: 'Team owner profile not found.' });

    const price = Number(coach.price ?? 0);
    if ((owner.currentBudget ?? 0) < price) {
      return res.status(400).json({ error: 'Insufficient balance to buy this coach.' });
    }

    // Ensure this coach is not already booked for the requested period
    const existingCoachBookings = await prisma.coachBooking.findMany({ where: { coachId: coach.id } });
    const coachOverlap = existingCoachBookings.some(o => (o.status === 'booked' || o.status === 'active') && !(new Date(o.endDate) < startDate || new Date(o.startDate) > endDate));
    if (coachOverlap) {
      return res.status(400).json({ error: 'Coach is already booked for the requested period.' });
    }

    // Ensure the team owner does not already have an active/ booked coach overlapping now
    const ownerBookings = await prisma.coachBooking.findMany({ where: { teamOwnerId: owner.id } });
    const ownerOverlap = ownerBookings.some(o => (o.status === 'booked' || o.status === 'active') && !(new Date(o.endDate) < startDate || new Date(o.startDate) > endDate));
    if (ownerOverlap) {
      return res.status(400).json({ error: 'You already have a coach booked for this period. One coach per team at a time.' });
    }

    // Create booking as 'booked' and deduct budget
    const bookingData = {
      coachId: coach.id,
      teamOwnerId: owner.id,
      startDate,
      endDate,
      pricePaid: price,
      status: 'booked'
    };

    let booking;
    try {
      booking = await prisma.coachBooking.create({ data: bookingData });
      // deduct budget
      const updatedOwner = await prisma.teamOwner.update({ where: { id: owner.id }, data: { currentBudget: (owner.currentBudget ?? 0) - price } });
      // Success
      res.status(201).json({ message: 'Coach purchased and locked for 30 days.', booking, owner: updatedOwner });
    } catch (err2) {
      // rollback if booking created but owner update failed
      try {
        if (booking && booking.id) {
          await prisma.coachBooking.delete({ where: { id: booking.id } });
        }
      } catch (delErr) {
        console.error('Rollback delete failed:', delErr);
      }
      console.error('Purchase error:', err2);
      res.status(500).json({ error: 'Failed to complete purchase.' });
    }
  } catch (err) {
    console.error('bookCoach error:', err);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
};

// Note: cart/checkout flow for coaches removed — use direct `bookCoach`.

// Admin: approve a pending booking
export const approveBooking = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin required.' });
    const bookingId = req.params.id;
    const booking = await prisma.coachBooking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Only pending bookings can be approved.' });

    // Check overlapping approved bookings for this coach
    const others = await prisma.coachBooking.findMany({ where: { coachId: booking.coachId } });
    const overlap = others.some(o => (o.status === 'booked' || o.status === 'active') && !(new Date(o.endDate) < new Date(booking.startDate) || new Date(o.startDate) > new Date(booking.endDate)));
    if (overlap) {
      return res.status(400).json({ error: 'Coach is already booked for the requested period.' });
    }

    const updated = await prisma.coachBooking.update({ where: { id: bookingId }, data: { status: 'booked' } });
    res.json({ message: 'Booking approved.', booking: updated });
  } catch (err) {
    console.error('approveBooking error:', err);
    res.status(500).json({ error: 'Failed to approve booking.' });
  }
};

// Admin: reject a pending booking
export const rejectBooking = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin required.' });
    const bookingId = req.params.id;
    const booking = await prisma.coachBooking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Only pending bookings can be rejected.' });

    const updated = await prisma.coachBooking.update({ where: { id: bookingId }, data: { status: 'rejected' } });
    res.json({ message: 'Booking rejected.', booking: updated });
  } catch (err) {
    console.error('rejectBooking error:', err);
    res.status(500).json({ error: 'Failed to reject booking.' });
  }
};

// Team owner: get my bookings
export const getMyBookings = async (req, res) => {
  try {
    const teamOwner = req.teamOwner;
    if (!teamOwner) return res.status(403).json({ error: 'Team owner access required.' });

    const bookings = await prisma.coachBooking.findMany({
      where: { teamOwnerId: teamOwner.id },
      include: { coach: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};

// Admin: get bookings for a specific coach
export const getCoachBookings = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin required.' });
    const bookings = await prisma.coachBooking.findMany({ where: { coachId: req.params.id }, include: { teamOwner: true }, orderBy: { createdAt: 'desc' } });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coach bookings.' });
  }
};

// Admin: get all coach bookings (optionally filter by status)
export const getAllBookings = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin required.' });
    const status = req.query.status;
    const where = status ? { status } : {};
    const bookings = await prisma.coachBooking.findMany({ where, include: { coach: true, teamOwner: true }, orderBy: { createdAt: 'desc' } });
    res.json(bookings);
  } catch (err) {
    console.error('getAllBookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};

// Named exports are used throughout routes; no default export needed.
