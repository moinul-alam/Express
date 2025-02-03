const jwt = require('jsonwebtoken');
const { errorResponse } = require('@src/utils/responseFormatter');

const generateToken = (userID) => {
    try {
        return jwt.sign({ id: userID }, process.env.JWT_SECRET, { 
            expiresIn: '1h',
            issuer: 'Explora',
            audience: 'explora-core.vercel.app'
        });
    } catch (error) {
        throw new Error('Error generating token: ' + error.message);
    }
};

const setTokenCookie = (res, token) => {

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: '.vercel.app',
        maxAge: 60 * 60 * 1000,
        path: '/',
    });
};

const clearTokenCookie = (res) => {
    res.clearCookie('jwt', { 
        httpOnly: true, 
        secure: true,
        sameSite: 'none',
        domain: '.vercel.app',
        path: '/',
    });
};

// // Middleware to verify token
// const verifyToken = (req, res, next) => {
//     const token = req.cookies.jwt;
    
//     if (!token) {
//         return errorResponse(res, 'No token provided', 401);
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;
//         next();
//     } catch (error) {
//         clearTokenCookie(res); // Clear invalid token
//         return errorResponse(res, 'Invalid token', 401);
//     }
// };

const handleTokenError = (req, res, next) => {
    try {
        next();
    } catch (error) {
        return errorResponse(res, 'Error generating token', 500, error.message);
    }
};

module.exports = { 
    generateToken, 
    setTokenCookie, 
    clearTokenCookie, 
    // verifyToken,
    handleTokenError 
};