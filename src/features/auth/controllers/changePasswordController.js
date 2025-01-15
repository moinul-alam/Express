const User = require('@src/models/user'); 
const bcrypt = require('bcrypt');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const changePassword = async (req, res, next) => {
    try {
        const userID = req.user.id;
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(userID);
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        const isMatch = await bcrypt.compare(oldPassword, user.info.password);
        
        if (!isMatch) {
            return errorResponse(res, 'Old password is incorrect', 400);
        }

        if (oldPassword === newPassword) {
            return errorResponse(res, 'New password cannot be the same as the old password', 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.info.password = hashedPassword;
        await user.save();

        return successResponse(res, 'Password updated successfully', 200);
    } catch (error) {
        next(error);
    }
};

module.exports = changePassword;
