const crypto = require('crypto');
const Guest = require('../models/guest');
const { errorResponse } = require('@src/utils/responseFormatter');

// Generate a unique session ID
const generateSessionId = () => crypto.randomBytes(16).toString('hex');

// Function to create or validate session and store it in the cookie
const generateSession = async (req, res, next) => {
    try {
        let sessionId = req.cookies.guestSessionId;

        if (!sessionId) {
            sessionId = generateSessionId();

            // Set cookie
            res.cookie('guestSessionId', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 24 * 60 * 60 * 1000, // 1 day
            });

            // Upsert the guest session in the database
            await Guest.updateOne(
                { sessionId },
                { $set: { sessionId } },
                { upsert: true } // Creates a new document if no match is found
            );
        }

        return sessionId;
    } catch (error) {
        next(error); // Pass error to the next middleware
    }
};

// Middleware function to verify the session
const verifySession = async (req, res, next) => {
    const sessionId = req.cookies.guestSessionId;
    if (!sessionId) {
        return errorResponse(res, 'Guest session not initialized', 401);
    }

    try {
        // Verify if the session exists in the Guest model
        const guestData = await Guest.findOne({ sessionId });
        if (!guestData) {
            return errorResponse(res, 'Invalid guest session', 403);
        }

        // Attach guest data to the request object
        req.guest = guestData;

        next();
    } catch (error) {
        return errorResponse(res, 'Error verifying session: ' + error.message, 500);
    }
};

module.exports = { generateSession, verifySession };
