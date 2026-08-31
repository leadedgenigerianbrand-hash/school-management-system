const {
    pool,
    query,
    transaction,
    testDatabaseConnection,
    closeDatabase
} = require("./config/database");


/*
|--------------------------------------------------------------------------
| Database Module
|--------------------------------------------------------------------------
|
| This file provides a single interface to the PostgreSQL database.
|
| The actual PostgreSQL connection pool lives in:
|
|     config/database.js
|
| All models should use:
|
|     const { query } = require("../config/database");
|
|--------------------------------------------------------------------------
*/


module.exports = {

    pool,

    query,

    transaction,

    testDatabaseConnection,

    closeDatabase

};