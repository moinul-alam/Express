const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.MONGODB_URI) {
    console.error('MongoDB URI is not defined in environment variables.');
    process.exit(1);
}

const logMessage = (message) => {
    console.log(`${message}`);
};

const logError = (error) => {
    console.error(`${new Date().toISOString()} - Error: ${error.message}`);
};

const connectDB = async () => {
    try {
        const options = {
            autoIndex: false,
        };
        await mongoose.connect(process.env.MONGODB_URI, options);
        logMessage('MongoDB connected successfully.');
    } catch (error) {
        logError(error);
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