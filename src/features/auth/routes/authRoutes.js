const express = require('express');
const register = require('@src/features/auth/controllers/registerController');
const login = require('@src/features/auth/controllers/loginController');
const logout = require('@src/features/auth/controllers/logoutController');
const userSession = require('@src/features/auth/controllers/userSessionController');
const changePassword = require('@src/features/auth/controllers/changePasswordController');
const { registerValidation, loginValidation } = require('@src/features/auth/middlewares/authValidator');
const verifyToken = require('@src/middlewares/verifyToken');

const router = express.Router();

// Register route
router.post('/register', registerValidation, register);

// Login route
router.post('/login', loginValidation, login);

// Route for login session 
router.get('/me', verifyToken, userSession);

//Logout route
router.post('/logout', verifyToken, logout);

// Route for changing password
router.patch('/password/change', verifyToken, changePassword);



module.exports = router;

