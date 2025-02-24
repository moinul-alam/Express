const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { NODE_ENV, MONGODB_URI_LOCAL, MONGODB_URI_CLOUD } = process.env;

if (!MONGODB_URI_CLOUD) {
    console.error('MONGODB_URI_CLOUD is not defined in environment variables.');
    process.exit(1);
}

const logMessage = (message) => console.log(`${message}`);
const logError = (error) => console.error(`${new Date().toISOString()} - Error: ${error.message}`);

const connectDB = async () => {
    const options = { autoIndex: false };
    let dbURI = MONGODB_URI_CLOUD; // Default to cloud

    if (NODE_ENV === 'development' && MONGODB_URI_LOCAL) {
        dbURI = MONGODB_URI_LOCAL;
        logMessage('Running in DEVELOPMENT mode. Trying to connect to LOCAL MongoDB...');
    } else {
        logMessage('Running in PRODUCTION mode or LOCAL not available. Connecting to CLOUD MongoDB...');
    }

    try {
        await mongoose.connect(dbURI, options);
        logMessage(`MongoDB connected successfully to ${dbURI === MONGODB_URI_CLOUD ? 'CLOUD' : 'LOCAL'} instance.`);
    } catch (error) {
        logError(error);
        console.error(`Failed to connect to MongoDB at ${dbURI}.`);
        process.exit(1);
    }
};

process.on('SIGINT', async () => {
    logMessage('Closing MongoDB connection...');
    await mongoose.connection.close();
    logMessage('MongoDB connection closed.');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logMessage('Closing MongoDB connection...');
    await mongoose.connection.close();
    logMessage('MongoDB connection closed.');
    process.exit(0);
});

module.exports = connectDB;
