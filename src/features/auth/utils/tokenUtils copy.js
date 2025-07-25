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
        secure: true,
        sameSite: 'none',
        domain: 'express-core.onrender.com',
        maxAge: 60 * 60 * 1000,
        path: '/',
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

const handleTokenError = (req, res, next) => {
    try {
        next();
    } catch (error) {
        return errorResponse(res, 'Error generating token', 500, error.message);
    }
};

module.exports = { generateToken, setTokenCookie, clearTokenCookie, handleTokenError };
