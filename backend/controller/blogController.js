import prisma from '../config/prisma.js';

const blogController = {
  // Get all blogs (sorted by newest first)
  getAllBlogs: async (req, res) => {
    try {
      const blogs = await prisma.blog.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(blogs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get latest N blogs (for homepage)
  getLatestBlogs: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 3;
      const blogs = await prisma.blog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          createdAt: true
        }
      });
      res.json(blogs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Get blog by ID
  getBlogById: async (req, res) => {
    try {
      const blog = await prisma.blog.findUnique({
        where: { id: req.params.id }
      });
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
      res.json(blog);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Create a new blog (admin only)
  createBlog: async (req, res) => {
    try {
      const { title, details, imageUrl, imageUrls } = req.body;
      if (!title || !details) {
        return res.status(400).json({ message: 'Title and details are required' });
      }
      // Support both imageUrl (single) and imageUrls (CSV format)
      const finalImageUrl = imageUrls || imageUrl || null;
      const blog = await prisma.blog.create({
        data: {
          title,
          details,
          imageUrl: finalImageUrl
        }
      });
      res.status(201).json(blog);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Update a blog (admin only)
  updateBlog: async (req, res) => {
    try {
      const { title, details, imageUrl } = req.body;
      const blog = await prisma.blog.update({
        where: { id: req.params.id },
        data: {
          title,
          details,
          imageUrl
        }
      });
      res.json(blog);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Blog not found' });
      }
      res.status(500).json({ message: err.message });
    }
  },

  // Delete a blog (admin only)
  deleteBlog: async (req, res) => {
    try {
      await prisma.blog.delete({
        where: { id: req.params.id }
      });
      res.json({ message: 'Blog deleted successfully' });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Blog not found' });
      }
      res.status(500).json({ message: err.message });
    }
  }
};

export default blogController;
