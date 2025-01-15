const express = require('express');
const routes = require('@src/features');
const middlewares = require('@src/middlewares/setupMiddlewares');
const errorHandler = require('@src/middlewares/errorHandler');

const createApp = () => {
    const app = express();

    // Middlewares
    middlewares(app);

    // Routes
    routes(app);

    // Error Handling Middleware
    errorHandler(app);

    return app;
};

module.exports = createApp;
