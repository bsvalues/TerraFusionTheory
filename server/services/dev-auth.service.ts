/**
 * Development One-Time Authentication Service
 * 
 * This service provides secure, single-use tokens for development authentication.
 * These tokens automatically expire after a specified time period or upon first use.
 * 
 * IMPORTANT: This service should ONLY be enabled in development environments.
 */

import crypto from 'crypto';
import { OptimizedLogger } from './optimized-logging';
import { LogCategory, LogLevel } from '@shared/schema';

// Interface for token data
interface DevTokenData {
  token: string;
  userId: number;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class DevAuthService {
  private static instance: DevAuthService;
  private tokens: Map<string, DevTokenData> = new Map();
  private logger: OptimizedLogger;
  
  // Default token expiration time (in minutes)
  private defaultExpirationMinutes = 60;
  
  // Is this service enabled
  private isEnabled = process.env.NODE_ENV !== 'production';
  
  private constructor() {
    this.logger = OptimizedLogger.getInstance();
    
    // Log warning if enabled in production (should never happen)
    if (process.env.NODE_ENV === 'production' && this.isEnabled) {
      this.logger.critical(
        'DevAuthService is enabled in production environment! This is a security risk.',
        LogCategory.SECURITY,
        { source: 'DevAuthService' }
      );
    }
    
    // Set up a cleanup task to remove expired tokens
    setInterval(() => this.cleanupExpiredTokens(), 15 * 60 * 1000); // Run every 15 minutes
  }
  
  /**
   * Get singleton instance of DevAuthService
   */
  public static getInstance(): DevAuthService {
    if (!DevAuthService.instance) {
      DevAuthService.instance = new DevAuthService();
    }
    return DevAuthService.instance;
  }
  
  /**
   * Generate a new one-time authentication token for a user
   * 
   * @param userId The ID of the user to authenticate
   * @param expirationMinutes How long the token is valid (defaults to 60 minutes)
   * @returns The generated token or null if service is not enabled
   */
  public generateToken(userId: number, expirationMinutes: number = this.defaultExpirationMinutes): string | null {
    if (!this.isEnabled) {
      this.logger.warning(
        LogCategory.SECURITY,
        'Attempted to generate dev auth token in non-development environment',
        { source: 'DevAuthService', userId }
      );
      return null;
    }
    
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration time
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + (expirationMinutes * 60 * 1000));
    
    // Store token data
    this.tokens.set(token, {
      token,
      userId,
      createdAt,
      expiresAt,
      used: false
    });
    
    // Log token generation
    this.logger.info(
      LogCategory.SECURITY,
      `Generated one-time dev auth token for user ${userId}`,
      { 
        source: 'DevAuthService', 
        userId,
        expiresAt,
        tokenId: token.substring(0, 8) + '...' // Only log a portion of the token for security
      }
    );
    
    return token;
  }
  
  /**
   * Validate and consume a one-time auth token
   * 
   * @param token The token to validate
   * @param requestInfo Additional information about the request
   * @returns The associated userId if valid, null otherwise
   */
  public validateToken(token: string, requestInfo?: { ipAddress?: string; userAgent?: string }): number | null {
    if (!this.isEnabled) {
      this.logger.warning(
        LogCategory.SECURITY,
        'Attempted to validate dev auth token in non-development environment',
        { source: 'DevAuthService' }
      );
      return null;
    }
    
    const tokenData = this.tokens.get(token);
    
    // Token doesn't exist
    if (!tokenData) {
      this.logger.warning(
        LogCategory.SECURITY,
        'Invalid dev auth token attempted',
        { source: 'DevAuthService', tokenFragment: token.substring(0, 8) + '...' }
      );
      return null;
    }
    
    // Token has already been used
    if (tokenData.used) {
      this.logger.warning(
        LogCategory.SECURITY,
        'Attempted to reuse one-time dev auth token',
        { 
          source: 'DevAuthService',
          userId: tokenData.userId,
          tokenFragment: token.substring(0, 8) + '...',
          originalUseTime: tokenData.usedAt
        }
      );
      return null;
    }
    
    // Token has expired
    if (tokenData.expiresAt < new Date()) {
      this.logger.warning(
        LogCategory.SECURITY,
        'Attempted to use expired dev auth token',
        { 
          source: 'DevAuthService',
          userId: tokenData.userId,
          tokenFragment: token.substring(0, 8) + '...',
          expiredAt: tokenData.expiresAt
        }
      );
      
      // Clean up expired token
      this.tokens.delete(token);
      return null;
    }
    
    // Token is valid - mark as used
    tokenData.used = true;
    tokenData.usedAt = new Date();
    
    // Add request info if provided
    if (requestInfo) {
      tokenData.ipAddress = requestInfo.ipAddress;
      tokenData.userAgent = requestInfo.userAgent;
    }
    
    // Update token data
    this.tokens.set(token, tokenData);
    
    // Log successful use
    this.logger.info(
      LogCategory.SECURITY,
      `Successfully authenticated user ${tokenData.userId} using one-time dev auth token`,
      { 
        source: 'DevAuthService',
        userId: tokenData.userId,
        tokenFragment: token.substring(0, 8) + '...',
        ipAddress: tokenData.ipAddress,
        timeToUse: (tokenData.usedAt.getTime() - tokenData.createdAt.getTime()) / 1000
      }
    );
    
    return tokenData.userId;
  }
  
  /**
   * Get information about a specific token
   * 
   * @param token The token to get information about
   * @returns Token information or null if token doesn't exist
   */
  public getTokenInfo(token: string): Omit<DevTokenData, 'token'> | null {
    if (!this.isEnabled) {
      return null;
    }
    
    const tokenData = this.tokens.get(token);
    if (!tokenData) {
      return null;
    }
    
    // Return copy of token data without the actual token
    const { token: _, ...tokenInfo } = tokenData;
    return tokenInfo;
  }
  
  /**
   * Get all active tokens for a user
   * 
   * @param userId The user ID to get tokens for
   * @returns Array of token information
   */
  public getUserTokens(userId: number): Array<Omit<DevTokenData, 'token'> & { tokenFragment: string }> {
    if (!this.isEnabled) {
      return [];
    }
    
    const userTokens: Array<Omit<DevTokenData, 'token'> & { tokenFragment: string }> = [];
    
    for (const [token, data] of this.tokens.entries()) {
      if (data.userId === userId && !data.used && data.expiresAt > new Date()) {
        const { token: _, ...tokenInfo } = data;
        userTokens.push({
          ...tokenInfo,
          tokenFragment: token.substring(0, 8) + '...'
        });
      }
    }
    
    return userTokens;
  }
  
  /**
   * Revoke a specific token
   * 
   * @param token The token to revoke
   * @returns true if token was revoked, false otherwise
   */
  public revokeToken(token: string): boolean {
    if (!this.isEnabled || !this.tokens.has(token)) {
      return false;
    }
    
    const tokenData = this.tokens.get(token);
    if (tokenData) {
      this.logger.info(
        LogCategory.SECURITY,
        `Manually revoked one-time dev auth token for user ${tokenData.userId}`,
        { 
          source: 'DevAuthService',
          userId: tokenData.userId,
          tokenFragment: token.substring(0, 8) + '...'
        }
      );
    }
    
    this.tokens.delete(token);
    return true;
  }
  
  /**
   * Revoke all tokens for a specific user
   * 
   * @param userId The user ID to revoke tokens for
   * @returns Number of tokens revoked
   */
  public revokeUserTokens(userId: number): number {
    if (!this.isEnabled) {
      return 0;
    }
    
    let revokedCount = 0;
    
    for (const [token, data] of this.tokens.entries()) {
      if (data.userId === userId) {
        this.tokens.delete(token);
        revokedCount++;
      }
    }
    
    if (revokedCount > 0) {
      this.logger.info(
        LogCategory.SECURITY,
        `Revoked ${revokedCount} dev auth tokens for user ${userId}`,
        { source: 'DevAuthService', userId, count: revokedCount }
      );
    }
    
    return revokedCount;
  }
  
  /**
   * Get total number of active tokens
   */
  public getActiveTokenCount(): number {
    if (!this.isEnabled) {
      return 0;
    }
    
    let count = 0;
    const now = new Date();
    
    for (const data of this.tokens.values()) {
      if (!data.used && data.expiresAt > now) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Create a secure login URL with embedded token
   * 
   * @param token The authentication token
   * @param baseUrl Base URL of the application
   * @returns Full URL for one-time login
   */
  public createLoginUrl(token: string, baseUrl: string = ''): string {
    return `${baseUrl}/dev-auth?token=${token}`;
  }
  
  /**
   * Private method to clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    if (!this.isEnabled) {
      return;
    }
    
    const now = new Date();
    let removedCount = 0;
    
    for (const [token, data] of this.tokens.entries()) {
      // Remove if expired or used more than 24 hours ago
      if (data.expiresAt < now || (data.used && data.usedAt && 
          (now.getTime() - data.usedAt.getTime()) > 24 * 60 * 60 * 1000)) {
        this.tokens.delete(token);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.logger.debug(
        LogCategory.SYSTEM,
        `Cleaned up ${removedCount} expired or used dev auth tokens`,
        { source: 'DevAuthService', count: removedCount }
      );
    }
  }
}

export const devAuthService = DevAuthService.getInstance();