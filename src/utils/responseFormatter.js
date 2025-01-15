//ResponseFormatter@src/utils/

function successResponse(res, message = "Operation successful", data = {}, statusCode = 200) {
    res.status(statusCode).json({
        status: "success",
        message,
        data: data || {},
        // timestamp: new Date().toISOString(),
    });
}

function errorResponse(res, message = "An error occurred", error = null, statusCode = 500) {
    res.status(statusCode).json({
        status: "error",
        message,
        data: null, 
        error: error
            ? typeof error === 'string'
                ? { code: statusCode, details: error } 
                : { code: statusCode, details: error }
            : null,
        // timestamp: new Date().toISOString(),
    });
}

module.exports = { successResponse, errorResponse };
