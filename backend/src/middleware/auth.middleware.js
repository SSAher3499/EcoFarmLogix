const { verifyToken } = require('../utils/jwt');
const { prisma } = require('../config/database');
const { hasPermission, getUserFarmRole } = require('../utils/permissions');

/**
 * Middleware to protect routes - requires valid access token
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // DEBUG: Log the request details
    console.log('🔐 Auth Debug:', {
      method: req.method,
      path: req.path,
      hasAuthHeader: !!authHeader,
      authHeaderStart: authHeader ? authHeader.substring(0, 20) + '...' : 'none'
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth failed: No Bearer token');
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      console.log('❌ Auth failed: Token invalid or expired');
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired access token'
      });
    }

    console.log('✅ Auth success:', { userId: decoded.userId, role: decoded.role });
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Auth error:', error.message);
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
}

/**
 * Middleware to check user roles
 * @param {string[]} roles - Allowed roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
}

/**
 * Middleware to check permission for a specific action
 * @param {string} permission - Permission name to check
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
}

/**
 * Middleware to check farm access
 * Checks if user has access to the specified farm
 */
function requireFarmAccess(requiredRole = null) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      // Get farmId from params or body
      const farmId = req.params.farmId || req.body.farmId;

      if (!farmId) {
        return res.status(400).json({
          status: 'error',
          message: 'Farm ID is required'
        });
      }

      // Super Admin has access to all farms
      if (req.user.role === 'SUPER_ADMIN') {
        req.farmRole = 'SUPER_ADMIN';
        return next();
      }

      // Check if user is farm owner
      const farm = await prisma.farm.findFirst({
        where: { id: farmId, userId: req.user.userId }
      });

      if (farm) {
        req.farmRole = 'OWNER';
        return next();
      }

      // Check FarmUser assignment
      const farmUser = await prisma.farmUser.findUnique({
        where: {
          farmId_userId: { farmId, userId: req.user.userId }
        }
      });

      if (!farmUser || !farmUser.isActive) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have access to this farm'
        });
      }

      // Check required role if specified
      if (requiredRole) {
        const roleHierarchy = ['VIEWER', 'OPERATOR', 'MANAGER', 'OWNER'];
        const userRoleIndex = roleHierarchy.indexOf(farmUser.role);
        const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

        if (userRoleIndex < requiredRoleIndex) {
          return res.status(403).json({
            status: 'error',
            message: 'Insufficient permissions for this action'
          });
        }
      }

      req.farmRole = farmUser.role;
      next();
    } catch (error) {
      console.error('Farm access check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error checking farm access'
      });
    }
  };
}

/**
 * Middleware for Super Admin only routes
 */
function superAdminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      status: 'error',
      message: 'Super Admin access required'
    });
  }

  next();
}

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  requireFarmAccess,
  superAdminOnly
};