"use strict";

function notFoundHandler(req, res, next) {
    const error = new Error(
        `Route not found: ${req.method} ${req.originalUrl}`
    );

    error.statusCode = 404;

    next(error);
}

function handleDatabaseError(error) {
    switch (error.code) {
        case "23505":
            return {
                statusCode: 409,
                message: "A record with this information already exists."
            };

        case "23503":
            return {
                statusCode: 409,
                message: "This record cannot be changed because it is connected to another record."
            };

        case "23502":
            return {
                statusCode: 400,
                message: "A required field is missing."
            };

        case "23514":
            return {
                statusCode: 400,
                message: "The supplied information does not satisfy the required rules."
            };

        case "22P02":
            return {
                statusCode: 400,
                message: "One or more supplied values have an invalid format."
            };

        case "42P01":
            return {
                statusCode: 500,
                message: "A required database table is not available."
            };

        case "42703":
            return {
                statusCode: 500,
                message: "A required database field is not available."
            };

        case "23504":
            return {
                statusCode: 409,
                message: "The record cannot be changed because of a related database restriction."
            };

        case "23514":
            return {
                statusCode: 400,
                message: "The supplied information does not satisfy the required rules."
            };

        default:
            return {
                statusCode: 500,
                message: "A database error occurred."
            };
    }
}

function handleAuthenticationError(error) {
    if (error.name === "JsonWebTokenError") {
        return {
            statusCode: 401,
            message: "Invalid authentication token."
        };
    }

    if (error.name === "TokenExpiredError") {
        return {
            statusCode: 401,
            message: "Authentication token has expired."
        };
    }

    if (error.name === "NotBeforeError") {
        return {
            statusCode: 401,
            message: "Authentication token is not yet valid."
        };
    }

    return null;
}

function handleUploadError(error) {
    if (!error) {
        return null;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
        return {
            statusCode: 400,
            message: "The uploaded file is too large."
        };
    }

    if (error.code === "LIMIT_FILE_COUNT") {
        return {
            statusCode: 400,
            message: "Too many files were uploaded."
        };
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return {
            statusCode: 400,
            message: "An unexpected file was uploaded."
        };
    }

    if (error.code === "LIMIT_FIELD_COUNT") {
        return {
            statusCode: 400,
            message: "Too many form fields were submitted."
        };
    }

    if (error.code === "LIMIT_FIELD_KEY") {
        return {
            statusCode: 400,
            message: "A submitted field name is too long."
        };
    }

    if (error.code === "LIMIT_FIELD_VALUE") {
        return {
            statusCode: 400,
            message: "A submitted field value is too large."
        };
    }

    if (error.code === "LIMIT_PART_COUNT") {
        return {
            statusCode: 400,
            message: "The uploaded multipart request contains too many parts."
        };
    }

    return null;
}

function handleValidationError(error) {
    if (!error) {
        return null;
    }

    if (error.name === "ValidationError") {
        return {
            statusCode: 400,
            message: error.message || "The supplied information is invalid."
        };
    }

    if (error.statusCode === 400 || error.status === 400) {
        return {
            statusCode: 400,
            message: error.message || "The supplied information is invalid."
        };
    }

    return null;
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    let statusCode =
        error.statusCode ||
        error.status ||
        500;

    let message =
        error.message ||
        "An unexpected server error occurred.";

    if (error.code && /^[0-9A-Z]{5}$/.test(error.code)) {
        const databaseError = handleDatabaseError(error);

        statusCode = databaseError.statusCode;
        message = databaseError.message;
    }

    const authenticationError =
        handleAuthenticationError(error);

    if (authenticationError) {
        statusCode = authenticationError.statusCode;
        message = authenticationError.message;
    }

    const uploadError =
        handleUploadError(error);

    if (uploadError) {
        statusCode = uploadError.statusCode;
        message = uploadError.message;
    }

    const validationError =
        handleValidationError(error);

    if (validationError) {
        statusCode = validationError.statusCode;
        message = validationError.message;
    }

    if (statusCode < 400 || statusCode > 599) {
        statusCode = 500;
    }

    console.error("==============================================");
    console.error("SERVER ERROR");
    console.error("==============================================");
    console.error("Method:", req.method);
    console.error("URL:", req.originalUrl);
    console.error("Status:", statusCode);
    console.error("Message:", error.message);

    if (process.env.NODE_ENV !== "production") {
        console.error("Stack:", error.stack);
    }

    const response = {
        success: false,
        message
    };

    if (process.env.NODE_ENV !== "production") {
        response.error = {
            name: error.name || "Error",
            code: error.code || null
        };
    }

    return res
        .status(statusCode)
        .json(response);
}

function asyncHandler(controller) {
    return function wrappedController(req, res, next) {
        Promise
            .resolve(controller(req, res, next))
            .catch(next);
    };
}

errorHandler.notFoundHandler = notFoundHandler;
errorHandler.errorHandler = errorHandler;
errorHandler.asyncHandler = asyncHandler;
errorHandler.handleDatabaseError = handleDatabaseError;
errorHandler.handleAuthenticationError = handleAuthenticationError;
errorHandler.handleUploadError = handleUploadError;
errorHandler.handleValidationError = handleValidationError;

module.exports = errorHandler;