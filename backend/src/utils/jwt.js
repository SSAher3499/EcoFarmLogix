const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate access token
 * @param {object} payload - Data to encode in token
 * @returns {string} - JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate refresh token
 * @param {object} payload - Data to encode in token
 * @returns {string} - JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Verify and decode a token
 * @param {string} token - JWT token to verify
 * @returns {object|null} - Decoded payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Get token expiry date
 * @param {string} expiresIn - Duration string (e.g., '7d', '15m')
 * @returns {Date} - Expiry date
 */
function getExpiryDate(expiresIn) {
  const now = new Date();
  
  if (expiresIn.endsWith('d')) {
    const days = parseInt(expiresIn);
    now.setDate(now.getDate() + days);
  } else if (expiresIn.endsWith('h')) {
    const hours = parseInt(expiresIn);
    now.setHours(now.getHours() + hours);
  } else if (expiresIn.endsWith('m')) {
    const minutes = parseInt(expiresIn);
    now.setMinutes(now.getMinutes() + minutes);
  }
  
  return now;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  getExpiryDate,
  JWT_REFRESH_EXPIRES_IN
};