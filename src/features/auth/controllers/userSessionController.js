const User = require('@src/models/user');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const userSession = async (req, res, next) => {
    try {
        const { id } = req.user;

        const user = await User.findById(id).select('-password');

        if (!user) {
            return errorResponse(res, 'User not found', 400);
        }

        return successResponse(res, 'User session fetched successfully', {
            id: user._id,
            username: user.info.username,
        });
    } catch (error) {
        next(new Error(`Token Validation Failed: ${error.message}`));
    }
};

module.exports = userSession;
