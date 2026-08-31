const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();


/*
|--------------------------------------------------------------------------
| Validate Database Environment
|--------------------------------------------------------------------------
*/

const requiredEnvironmentVariables = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD"
];


for (const variable of requiredEnvironmentVariables) {

    if (
        process.env[variable] === undefined ||
        process.env[variable] === ""
    ) {

        console.error(
            `ERROR: ${variable} is not configured in .env`
        );

    }

}


/*
|--------------------------------------------------------------------------
| PostgreSQL Configuration
|--------------------------------------------------------------------------
*/

const databaseConfig = {

    host:
        process.env.DB_HOST || "localhost",

    port:
        Number(process.env.DB_PORT) || 5432,

    database:
        process.env.DB_NAME || "school_management",

    user:
        process.env.DB_USER || "postgres",

    password:
        String(process.env.DB_PASSWORD || ""),

    max: 20,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 5000

};


/*
|--------------------------------------------------------------------------
| PostgreSQL Connection Pool
|--------------------------------------------------------------------------
*/

const pool = new Pool(databaseConfig);


/*
|--------------------------------------------------------------------------
| Pool Connection Event
|--------------------------------------------------------------------------
*/

pool.on("connect", () => {

    console.log(
        "PostgreSQL connection established."
    );

});


/*
|--------------------------------------------------------------------------
| Pool Error Event
|--------------------------------------------------------------------------
*/

pool.on("error", (error) => {

    console.error(
        "Unexpected PostgreSQL pool error:"
    );

    console.error(
        error.message
    );

});


/*
|--------------------------------------------------------------------------
| Test Database Connection
|--------------------------------------------------------------------------
*/

async function testDatabaseConnection() {

    let client;

    try {

        console.log(
            "Connecting to PostgreSQL..."
        );


        client = await pool.connect();


        const result = await client.query(`
            SELECT

                current_database()
                    AS database,

                current_user
                    AS user,

                NOW()
                    AS server_time
        `);


        console.log(
            "PostgreSQL database connection successful."
        );


        console.log(
            `Database: ${result.rows[0].database}`
        );


        console.log(
            `User: ${result.rows[0].user}`
        );


        console.log(
            `Server time: ${result.rows[0].server_time}`
        );


        return true;

    } catch (error) {

        console.error(
            "PostgreSQL connection failed."
        );

        console.error(
            error.message
        );


        throw error;

    } finally {

        if (client) {

            client.release();

        }

    }

}


/*
|--------------------------------------------------------------------------
| Query Helper
|--------------------------------------------------------------------------
*/

async function query(
    text,
    params = []
) {

    const start =
        Date.now();


    try {

        const result =
            await pool.query(
                text,
                params
            );


        const duration =
            Date.now() - start;


        console.log(
            `Database query executed in ${duration}ms - ${result.rowCount ?? 0} row(s)`
        );


        return result;

    } catch (error) {

        console.error(
            "Database query error:"
        );

        console.error(
            error.message
        );


        throw error;

    }

}


/*
|--------------------------------------------------------------------------
| Transaction Helper
|--------------------------------------------------------------------------
*/

async function transaction(
    callback
) {

    const client =
        await pool.connect();


    try {

        await client.query(
            "BEGIN"
        );


        const result =
            await callback(client);


        await client.query(
            "COMMIT"
        );


        return result;

    } catch (error) {

        await client.query(
            "ROLLBACK"
        );


        console.error(
            "Transaction rolled back:"
        );

        console.error(
            error.message
        );


        throw error;

    } finally {

        client.release();

    }

}


/*
|--------------------------------------------------------------------------
| Graceful Database Shutdown
|--------------------------------------------------------------------------
*/

async function closeDatabase() {

    await pool.end();


    console.log(
        "PostgreSQL connection pool closed."
    );

}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    pool,

    query,

    transaction,

    testDatabaseConnection,

    closeDatabase

};