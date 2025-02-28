const winston = require('winston');
const { errorResponse } = require('@src/utils/responseFormatter');

const errorHandler = (app) => {
    app.use((err, req, res, next) => {
        const statusCode = err.status || 500;
        const message = err.message || 'Something went wrong!';
        const details = err.details || null;

        // Log the error
        if (process.env.NODE_ENV === 'development') {
            console.error(err.stack);
        } else {
            winston.error({
                message: err.message,
                stack: err.stack,
                details,
                timestamp: new Date().toISOString(),
            });
        }

        // Use errorResponse for consistent formatting
        errorResponse(res, message, process.env.NODE_ENV === 'development' ? err.stack : null, statusCode);
    });
};

module.exports = errorHandler;
