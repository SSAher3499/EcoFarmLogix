const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken,
  getExpiryDate,
  JWT_REFRESH_EXPIRES_IN 
} = require('../utils/jwt');

class AuthService {
  
  /**
   * Register a new user
   */
  async register({ email, password, fullName, phone }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw { status: 409, message: 'User with this email already exists' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        phone: phone || null
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens
    };
  }

  /**
   * Login user
   */
  async login({ email, password }) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    // Check if user is active
    if (!user.isActive) {
      throw { status: 403, message: 'Your account has been deactivated' };
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Return user without password
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken) {
      throw { status: 401, message: 'Refresh token not found' };
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });
      throw { status: 401, message: 'Refresh token has expired' };
    }

    // Check if user is active
    if (!storedToken.user.isActive) {
      throw { status: 403, message: 'Your account has been deactivated' };
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id }
    });

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.user);

    return tokens;
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(refreshToken) {
    if (!refreshToken) {
      return { message: 'Logged out successfully' };
    }

    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId) {
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getExpiryDate(JWT_REFRESH_EXPIRES_IN)
      }
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer'
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    return user;
  }
}

module.exports = new AuthService();