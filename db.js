"use strict";

const {
    pool,
    query,
    transaction,
    testDatabaseConnection,
    closeDatabase
} = require("./config/database");

module.exports = {
    pool,
    query,
    transaction,
    testDatabaseConnection,
    closeDatabase
};