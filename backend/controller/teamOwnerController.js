import prisma from '../config/prisma.js';

// Apply to become a team owner
export const applyToBeTeamOwner = async (req, res) => {
  try {
    const { teamName, requestedBudget, applicationFee, paymentInfo } = req.body;

    if (!teamName || !requestedBudget || !applicationFee) {
      return res.status(400).json({ error: 'Team name, requested budget, and application fee are required.' });
    }

    if (!paymentInfo || !paymentInfo.phoneNumber || !paymentInfo.transactionId) {
      return res.status(400).json({ error: 'Payment information is required.' });
    }

    // Check if user already has an application
    const existingApplication = await prisma.teamOwnerApplication.findUnique({
      where: { userId: req.user.id }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You already have a pending application.' });
    }

    // Check if user is already a team owner
    const existingOwner = await prisma.teamOwner.findUnique({
      where: { userId: req.user.id }
    });

    if (existingOwner) {
      return res.status(400).json({ error: 'You are already a team owner.' });
    }

    const application = await prisma.teamOwnerApplication.create({
      data: {
        userId: req.user.id,
        teamName,
        requestedBudget: parseFloat(requestedBudget),
        applicationFee: parseFloat(applicationFee),
        status: 'pending',
        paymentInfo: {
          method: paymentInfo.method,
          phoneNumber: paymentInfo.phoneNumber,
          transactionId: paymentInfo.transactionId,
          timestamp: paymentInfo.timestamp || new Date().toISOString()
        }
      }
    });

    res.json({ message: 'Application submitted successfully.', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
};

// Get current user's team owner application status
export const getMyApplication = async (req, res) => {
  try {
    const application = await prisma.teamOwnerApplication.findUnique({
      where: { userId: req.user.id }
    });

    if (!application) {
      return res.json({ application: null });
    }

    res.json({ application });
  } catch (err) {
    console.error('Error in getMyApplication:', err);
    res.status(500).json({ error: 'Failed to fetch application.' });
  }
};

// Admin: Get all team owner applications
export const getAllApplications = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const applications = await prisma.teamOwnerApplication.findMany({
      include: {
        user: {
          select: { username: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
};

// Admin: Approve team owner application
export const approveApplication = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const { applicationId } = req.params;
    const { approvedBudget } = req.body;

    const application = await prisma.teamOwnerApplication.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Application has already been reviewed.' });
    }

    const budget = approvedBudget ? parseFloat(approvedBudget) : application.requestedBudget;

    // Create team owner
    const teamOwner = await prisma.teamOwner.create({
      data: {
        userId: application.userId,
        teamName: application.teamName,
        initialBudget: budget,
        currentBudget: budget,
        approvedBy: req.user.id,
        approvedAt: new Date()
      }
    });

    // Update application status
    await prisma.teamOwnerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }
    });

    res.json({ message: 'Application approved successfully.', teamOwner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve application.' });
  }
};

// Admin: Reject team owner application
export const rejectApplication = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const { applicationId } = req.params;

    const application = await prisma.teamOwnerApplication.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Application has already been reviewed.' });
    }

    await prisma.teamOwnerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }
    });

    res.json({ message: 'Application rejected.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject application.' });
  }
};

// Get current user's team owner profile
export const getMyTeamOwnerProfile = async (req, res) => {
  try {
    const teamOwner = await prisma.teamOwner.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: { username: true, email: true }
        }
      }
    });

    if (!teamOwner) {
      return res.json({ teamOwner: null });
    }

    res.json({ teamOwner });
  } catch (err) {
    console.error('Error in getMyTeamOwnerProfile:', err);
    res.status(500).json({ error: 'Failed to fetch team owner profile.' });
  }
};

// Get all team owners (for team owners to see)
export const getAllTeamOwners = async (req, res) => {
  try {
    // Only team owners can see this list
    const myTeamOwner = await prisma.teamOwner.findUnique({
      where: { userId: req.user.id }
    });

    if (!myTeamOwner && !req.user?.isAdmin) {
      return res.status(403).json({ error: 'Only team owners can view this information.' });
    }

    const teamOwners = await prisma.teamOwner.findMany({
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(teamOwners);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team owners.' });
  }
};
