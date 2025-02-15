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
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // Only set to true in production
        sameSite: isProduction ? 'none' : 'strict', // Use 'none' in production, 'lax' in development
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
    };

    // Set domain only in production
    if (isProduction) {
        cookieOptions.domain = 'express-core.onrender.com';
    }

    res.cookie('jwt', token, cookieOptions);
};

// Clear cookie for logout
const clearTokenCookie = (res) => {
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // Only set to true in production
        sameSite: isProduction ? 'none' : 'strict', // Use 'none' in production, 'lax' in development
        path: '/',
    };

    // Set domain only in production
    if (isProduction) {
        cookieOptions.domain = 'express-core.onrender.com';
    }

    res.clearCookie('jwt', cookieOptions);
};

const handleTokenError = (req, res, next) => {
    try {
        next();
    } catch (error) {
        return errorResponse(res, 'Error generating token', 500, error.message);
    }
};

module.exports = { generateToken, setTokenCookie, clearTokenCookie, handleTokenError };