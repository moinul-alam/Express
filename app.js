require('module-alias/register');
require('dotenv').config();

const createApp = require('@src/configs/createApp'); 
const connectDB = require('@src/configs/database');
const startServer = require('@src/configs/server');

// Create Express App
const app = createApp();

// Database connection
connectDB();

// Start the server
startServer(app);
