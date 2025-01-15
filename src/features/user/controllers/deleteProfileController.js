const User = require('@src/models/user');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const deleteProfile = async (req, res, next) => {
  try {
    const userID = req.user.id;

    const user = await User.findByIdAndDelete(userID);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, 'Profile deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = deleteProfile;
