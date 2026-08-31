require("dotenv").config();

const { Client } = require("pg");

const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function inspectTables() {

    try {

        await client.connect();

        console.log("Connected to PostgreSQL.");

        const tables = [
            "schools",
            "roles",
            "users"
        ];

        for (const table of tables) {

            console.log("");
            console.log("==============================================");
            console.log(`TABLE: ${table.toUpperCase()}`);
            console.log("==============================================");

            const result = await client.query(
                `
                SELECT
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = $1
                ORDER BY ordinal_position
                `,
                [table]
            );

            console.table(result.rows);
        }

    } catch (error) {

        console.error("Inspection failed:");
        console.error(error.message);

    } finally {

        await client.end();

    }
}

inspectTables();
