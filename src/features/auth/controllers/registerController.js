const bcrypt = require('bcrypt');
const User = require('@src/models/user');
const { successResponse, errorResponse } = require('@src/utils/responseFormatter');

const register = async (req, res, next) => {
    const { username, firstName, lastName, email, password, gender, dateOfBirth } = req.body;

    try {
        const usernameExists = await User.findOne({ 'info.username': username });
        if (usernameExists) {
            return errorResponse(res, 'Username already exists', 400);
        }

        const emailExists = await User.findOne({ 'info.email': email });
        if (emailExists) {
            return errorResponse(res, 'Email already exists', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            role: 'user',
            info: {                
                username: username.trim(),
                firstName: firstName,
                lastName: lastName,
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                gender: gender,
                dateOfBirth: dateOfBirth
            },
        };

        const newUser = new User(userData);
        await newUser.save();

        return successResponse(res, 'User registered successfully', 201);
    } catch (error) {
        next(error);
    }
};

module.exports = register;
