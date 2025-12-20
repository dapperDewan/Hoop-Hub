import { Router } from 'express';
import blogController from '../controller/blogController.js';

const router = Router();

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/latest', blogController.getLatestBlogs);
router.get('/:id', blogController.getBlogById);

// Admin routes (protected by admin query param like other admin routes)
router.post('/', blogController.createBlog);
router.put('/:id', blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);

export default router;

