const { clearTokenCookie } = require('@src/features/auth/utils/tokenUtils');
const { successResponse } = require('@src/utils/responseFormatter');

const logout = (req, res, next) => {
  try {
    clearTokenCookie(res);

    return successResponse(res, 'Logged out successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = logout;
