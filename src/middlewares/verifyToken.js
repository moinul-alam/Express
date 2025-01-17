const jwt = require('jsonwebtoken');
const { errorResponse } = require('@src/utils/responseFormatter');

const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.jwt || req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return errorResponse(res, 'Unauthorized: No token provided', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded payload to request object
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 'Unauthorized: Token expired', 401);
        }
        if (err.name === 'JsonWebTokenError') {
            return errorResponse(res, 'Unauthorized: Invalid token', 401);
        }
        console.error('Token verification error:', err.message);
        return errorResponse(res, 'Forbidden: Could not verify token', 403);
    }
};

module.exports = verifyToken;
