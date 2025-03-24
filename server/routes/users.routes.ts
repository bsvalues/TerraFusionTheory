/**
 * User API Routes
 * 
 * These routes provide access to user data for the application.
 */

import express, { Request, Response } from 'express';
import { IStorage } from '../storage';
import { insertUserSchema, users } from '../../shared/schema';
import { z } from 'zod';

const router = express.Router();

export default function registerUserRoutes(app: express.Express, storage: IStorage): void {
  /**
   * Get all users
   * 
   * GET /api/users
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove sensitive information
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email ? `${user.email.substring(0, 3)}...${user.email.split('@')[1]}` : null,
      }));
      
      return res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
  
  /**
   * Create a new user
   * 
   * POST /api/users
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const parseResult = insertUserSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: 'Invalid user data',
          details: parseResult.error.format() 
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(parseResult.data.username);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      
      // Create the user
      const user = await storage.createUser(parseResult.data);
      
      // Return the user without sensitive information
      const sanitizedUser = {
        id: user.id,
        username: user.username,
        email: user.email || null,
      };
      
      return res.status(201).json(sanitizedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  });
  
  /**
   * Get user by ID
   * 
   * GET /api/users/:id
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive information
      const sanitizedUser = {
        id: user.id,
        username: user.username,
        email: user.email ? `${user.email.substring(0, 3)}...${user.email.split('@')[1]}` : null,
      };
      
      return res.status(200).json(sanitizedUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
  });
  
  /**
   * Get current authenticated user
   * 
   * GET /api/users/me
   */
  router.get('/me', (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      const userId = req.session.user.id;
      
      // Redirect to the user endpoint
      return res.redirect(`/api/users/${userId}`);
    } catch (error) {
      console.error('Error fetching current user:', error);
      return res.status(500).json({ error: 'Failed to fetch current user' });
    }
  });
  
  /**
   * Update a user
   * 
   * PUT /api/users/:id
   */
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // Get existing user
      const existingUser = await storage.getUser(userId);
      
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Create a schema for user updates
      const updateUserSchema = z.object({
        username: z.string().min(3).optional(),
        password: z.string().min(6).optional(),
        email: z.string().email().nullable().optional(),
      });
      
      const parseResult = updateUserSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: 'Invalid user data',
          details: parseResult.error.format() 
        });
      }
      
      // If username is changing, check for uniqueness
      if (parseResult.data.username && parseResult.data.username !== existingUser.username) {
        const userWithSameName = await storage.getUserByUsername(parseResult.data.username);
        if (userWithSameName) {
          return res.status(409).json({ error: 'Username already exists' });
        }
      }
      
      // Create updated user object
      const updatedUser = {
        ...existingUser,
        ...parseResult.data,
      };
      
      // Update the user
      const result = await storage.updateUser(updatedUser);
      
      // Return the user without sensitive information
      const sanitizedUser = {
        id: result.id,
        username: result.username,
        email: result.email ? `${result.email.substring(0, 3)}...${result.email.split('@')[1]}` : null,
      };
      
      return res.status(200).json(sanitizedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  });
  
  /**
   * Delete a user
   * 
   * DELETE /api/users/:id
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Delete the user
      const result = await storage.deleteUser(userId);
      
      if (result) {
        return res.status(200).json({ message: 'User deleted successfully' });
      } else {
        return res.status(500).json({ error: 'Failed to delete user' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  });
  
  // Register routes
  app.use('/api/users', router);
  console.log('[UserRoutes] User routes registered');
}