const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.MONGODB_URI_LOCAL && !process.env.MONGODB_URI_CLOUD) {
    console.error('MongoDB URIs are not defined in environment variables.');
    process.exit(1);
}

const logMessage = (message) => {
    console.log(`${message}`);
};

const logError = (error) => {
    console.error(`${new Date().toISOString()} - Error: ${error.message}`);
};

const connectDB = async () => {
    const options = {
        autoIndex: false,
    };

    // Try connecting to LOCAL first
    try {
        logMessage('Attempting to connect to LOCAL MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI_LOCAL, options);
        logMessage('MongoDB connected successfully to LOCAL instance.');
        return; // Exit the function if connection is successful
    } catch (localError) {
        logError(localError);
        logMessage('Failed to connect to LOCAL MongoDB. Trying CLOUD...');
    }

    // If LOCAL connection fails, try connecting to CLOUD
    try {
        await mongoose.connect(process.env.MONGODB_URI_CLOUD, options);
        logMessage('MongoDB connected successfully to CLOUD instance.');
    } catch (cloudError) {
        logError(cloudError);
        console.error('Failed to connect to both LOCAL and CLOUD MongoDB instances.');
        process.exit(1);
    }
};

const gracefulShutdown = async () => {
    try {
        logMessage('Closing MongoDB connection...');
        await mongoose.connection.close();
        logMessage('MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        logError(error);
        process.exit(1);
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = connectDB;