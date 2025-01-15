const User = require('@src/models/user');
const { generateToken, setTokenCookie } = require('@src/features/auth/utils/tokenUtils');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');
const bcrypt = require('bcryptjs');

const login = async (req, res, next) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return errorResponse(res, 'Username and password are required', 400);
        }

        const user = await User.findOne({ 'info.username': username });
        if (!user) {
            return errorResponse(res, 'Incorrect username', 400);
        }

        const isMatch = await bcrypt.compare(password, user.info.password);
        if (!isMatch) {
            return errorResponse(res, 'Incorrect password', 400);
        }

        const token = generateToken(user._id);
        setTokenCookie(res, token);

        return successResponse(res, 'Login successful', { username: user.info.username });
    } catch (error) {
        return next(error);
    }
};

module.exports = login;
