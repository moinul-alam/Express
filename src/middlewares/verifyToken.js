const jwt = require('jsonwebtoken');
const { errorResponse } = require('@src/utils/responseFormatter');

const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return errorResponse(res, 'Unauthorized', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return errorResponse(res, 'Invalid token', 403);
    }
};

module.exports = verifyToken;
