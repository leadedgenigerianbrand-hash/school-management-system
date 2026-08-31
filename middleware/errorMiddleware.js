/*
|--------------------------------------------------------------------------
| Global Error Handling Middleware
|--------------------------------------------------------------------------
|
| This middleware provides one consistent error-handling system for the
| entire School Management System.
|
| Instead of exposing database errors, file paths, passwords or internal
| application details to users, we return safe API responses.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| 404 - Route Not Found
|--------------------------------------------------------------------------
|
| This handles requests to API routes that do not exist.
|--------------------------------------------------------------------------
*/

function notFoundHandler(req, res, next) {

    const error = new Error(
        `Route not found: ${req.method} ${req.originalUrl}`
    );

    error.statusCode = 404;

    next(error);

}


/*
|--------------------------------------------------------------------------
| PostgreSQL Error Handler
|--------------------------------------------------------------------------
|
| PostgreSQL uses specific error codes.
|
| We translate common database errors into safe messages.
|--------------------------------------------------------------------------
*/

function handleDatabaseError(error) {

    switch (error.code) {

        /*
        |--------------------------------------------------------------------------
        | Unique Violation
        |--------------------------------------------------------------------------
        */

        case "23505":

            return {
                statusCode: 409,
                message: "A record with this information already exists."
            };


        /*
        |--------------------------------------------------------------------------
        | Foreign Key Violation
        |--------------------------------------------------------------------------
        */

        case "23503":

            return {
                statusCode: 409,
                message:
                    "This record cannot be changed because it is connected to another record."
            };


        /*
        |--------------------------------------------------------------------------
        | Not Null Violation
        |--------------------------------------------------------------------------
        */

        case "23502":

            return {
                statusCode: 400,
                message:
                    "A required field is missing."
            };


        /*
        |--------------------------------------------------------------------------
        | Check Constraint Violation
        |--------------------------------------------------------------------------
        */

        case "23514":

            return {
                statusCode: 400,
                message:
                    "The supplied information does not satisfy the required rules."
            };


        /*
        |--------------------------------------------------------------------------
        | Invalid Text Representation
        |--------------------------------------------------------------------------
        */

        case "22P02":

            return {
                statusCode: 400,
                message:
                    "One or more supplied values have an invalid format."
            };


        /*
        |--------------------------------------------------------------------------
        | Undefined Table
        |--------------------------------------------------------------------------
        */

        case "42P01":

            return {
                statusCode: 500,
                message:
                    "A required database table is not available."
            };


        /*
        |--------------------------------------------------------------------------
        | Undefined Column
        |--------------------------------------------------------------------------
        */

        case "42703":

            return {
                statusCode: 500,
                message:
                    "A required database field is not available."
            };


        /*
        |--------------------------------------------------------------------------
        | Default Database Error
        |--------------------------------------------------------------------------
        */

        default:

            return {
                statusCode: 500,
                message:
                    "A database error occurred."
            };

    }

}


/*
|--------------------------------------------------------------------------
| JWT Error Handler
|--------------------------------------------------------------------------
*/

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


    return null;

}


/*
|--------------------------------------------------------------------------
| Multer / File Upload Error Handler
|--------------------------------------------------------------------------
*/

function handleUploadError(error) {

    if (!error) {
        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | File Too Large
    |--------------------------------------------------------------------------
    */

    if (error.code === "LIMIT_FILE_SIZE") {

        return {
            statusCode: 400,
            message:
                "The uploaded file is too large."
        };

    }


    /*
    |--------------------------------------------------------------------------
    | Too Many Files
    |--------------------------------------------------------------------------
    */

    if (error.code === "LIMIT_FILE_COUNT") {

        return {
            statusCode: 400,
            message:
                "Too many files were uploaded."
        };

    }


    /*
    |--------------------------------------------------------------------------
    | Unexpected File
    |--------------------------------------------------------------------------
    */

    if (error.code === "LIMIT_UNEXPECTED_FILE") {

        return {
            statusCode: 400,
            message:
                "An unexpected file was uploaded."
        };

    }


    return null;

}


/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

function errorHandler(error, req, res, next) {

    /*
    |--------------------------------------------------------------------------
    | If response has already started
    |--------------------------------------------------------------------------
    */

    if (res.headersSent) {

        return next(error);

    }


    /*
    |--------------------------------------------------------------------------
    | Default Error Values
    |--------------------------------------------------------------------------
    */

    let statusCode =
        error.statusCode ||
        error.status ||
        500;


    let message =
        error.message ||
        "An unexpected server error occurred.";


    /*
    |--------------------------------------------------------------------------
    | PostgreSQL Errors
    |--------------------------------------------------------------------------
    */

    if (error.code && /^[0-9A-Z]{5}$/.test(error.code)) {

        const databaseError =
            handleDatabaseError(error);

        statusCode =
            databaseError.statusCode;

        message =
            databaseError.message;

    }


    /*
    |--------------------------------------------------------------------------
    | JWT Errors
    |--------------------------------------------------------------------------
    */

    const authenticationError =
        handleAuthenticationError(error);


    if (authenticationError) {

        statusCode =
            authenticationError.statusCode;

        message =
            authenticationError.message;

    }


    /*
    |--------------------------------------------------------------------------
    | Upload Errors
    |--------------------------------------------------------------------------
    */

    const uploadError =
        handleUploadError(error);


    if (uploadError) {

        statusCode =
            uploadError.statusCode;

        message =
            uploadError.message;

    }


    /*
    |--------------------------------------------------------------------------
    | Development Logging
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | Production-Safe Response
    |--------------------------------------------------------------------------
    */

    const response = {

        success: false,

        message

    };


    /*
    |--------------------------------------------------------------------------
    | Include Error Details Only During Development
    |--------------------------------------------------------------------------
    */

    if (process.env.NODE_ENV !== "production") {

        response.error = {
            name: error.name,
            code: error.code || null
        };

    }


    /*
    |--------------------------------------------------------------------------
    | Send Response
    |--------------------------------------------------------------------------
    */

    return res
        .status(statusCode)
        .json(response);

}


/*
|--------------------------------------------------------------------------
| Async Controller Wrapper
|--------------------------------------------------------------------------
|
| This allows controllers such as:
|
| async function createStudent(req, res) {
|     ...
| }
|
| to automatically forward errors to errorHandler.
|--------------------------------------------------------------------------
*/

function asyncHandler(controller) {

    return function wrappedController(req, res, next) {

        Promise
            .resolve(controller(req, res, next))
            .catch(next);

    };

}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    notFoundHandler,

    errorHandler,

    asyncHandler

};