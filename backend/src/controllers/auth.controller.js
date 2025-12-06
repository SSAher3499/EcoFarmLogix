const authService = require('../services/auth.service');

class AuthController {
  
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const { email, password, fullName, phone } = req.body;
      
      const result = await authService.register({ 
        email, 
        password, 
        fullName, 
        phone 
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login({ email, password });

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh-token
   * Refresh access token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.logout(refreshToken);

      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout-all
   * Logout from all devices
   */
  async logoutAll(req, res, next) {
    try {
      const result = await authService.logoutAll(req.user.userId);

      res.status(200).json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();