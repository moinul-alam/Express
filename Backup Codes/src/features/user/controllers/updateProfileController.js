const User = require('@src/models/user');
const { errorResponse, successResponse } = require('@src/utils/responseFormatter');

const updateProfile = async (req, res, next) => {
    try {
        const userID = req.user.id;
        const { firstName, lastName, email, dateOfBirth, location, gender, avatar } = req.body;

        const updatedData = {};

        if (firstName) updatedData['info.firstName'] = firstName;
        if (lastName) updatedData['info.lastName'] = lastName;
        if (email) updatedData['info.email'] = email;
        if (dateOfBirth) updatedData['info.dateOfBirth'] = dateOfBirth;
        if (location) updatedData['info.location'] = location;
        if (gender) updatedData['info.gender'] = gender;
        if (avatar) updatedData['info.avatar'] = avatar;

        const user = await User.findByIdAndUpdate(userID, updatedData, { new: true })
            .select('info.firstName info.lastName info.email info.dateOfBirth info.location info.gender info.avatar createdAt');

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        return successResponse(res, 'Profile updated successfully', user);
    } catch (error) {
        next(error);
    }
};

module.exports = updateProfile;
