const jwt = require('jsonwebtoken');
const { errorResponse } = require('@src/utils/responseFormatter');

// Generate JWT
const generateToken = (userID) => {
    try {
        return jwt.sign({ id: userID }, process.env.JWT_SECRET, { expiresIn: '1h' });
    } catch (error) {
        throw new Error('Error generating token: ' + error.message);
    }
};

// Set secure cookie
const setTokenCookie = (res, token) => {
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: true, // Ensure cookies are only sent over HTTPS
        sameSite: 'none', // Required for cross-site cookies
        domain: 'express-core.onrender.com',
        maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
        path: '/', // Cookie accessible site-wide
    });
};

// Clear cookie for logout
const clearTokenCookie = (res) => {
    res.clearCookie('jwt', { 
        httpOnly: true, 
        secure: true,
        sameSite: 'none',
        domain: 'express-core.onrender.com', 
    });
};

// Middleware to handle token generation errors consistently
const handleTokenError = (req, res, next) => {
    try {
        next();
    } catch (error) {
        return errorResponse(res, 'Error generating token', 500, error.message);
    }
};

module.exports = { generateToken, setTokenCookie, clearTokenCookie, handleTokenError };
