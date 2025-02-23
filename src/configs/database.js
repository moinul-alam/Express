const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { NODE_ENV, MONGODB_URI_LOCAL, MONGODB_URI_CLOUD } = process.env;

if (!NODE_ENV || (!MONGODB_URI_LOCAL && !MONGODB_URI_CLOUD)) {
    console.error('NODE_ENV or MongoDB URIs are not defined in environment variables.');
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

    let dbURI;

    if (NODE_ENV === 'production') {
        dbURI = MONGODB_URI_CLOUD;
        logMessage('Running in PRODUCTION mode. Connecting to CLOUD MongoDB...');
    } else if (NODE_ENV === 'development') {
        dbURI = MONGODB_URI_LOCAL;
        logMessage('Running in DEVELOPMENT mode. Connecting to LOCAL MongoDB...');
    } else {
        console.error('Invalid NODE_ENV value. Must be either "production" or "development".');
        process.exit(1);
    }

    try {
        await mongoose.connect(dbURI, options);
        logMessage(`MongoDB connected successfully to ${NODE_ENV === 'production' ? 'CLOUD' : 'LOCAL'} instance.`);
    } catch (error) {
        logError(error);
        console.error(`Failed to connect to MongoDB in ${NODE_ENV} mode.`);
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
