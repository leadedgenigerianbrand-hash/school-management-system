"use strict";

require("dotenv").config({
    path: ".env.render"
});

const bcrypt = require("bcryptjs");
const { query } = require("./config/database");

async function main() {
    try {
        console.log("Connecting to Render PostgreSQL...");

        const schools = await query(`
            SELECT id, school_name, school_code
            FROM schools
            ORDER BY id
        `);

        console.log("\nSCHOOLS:");
        console.table(schools.rows);

        const roles = await query(`
            SELECT id, role_name
            FROM roles
            ORDER BY id
        `);

        console.log("\nROLES:");
        console.table(roles.rows);

        const users = await query(`
            SELECT id, username, email, is_active
            FROM users
            ORDER BY id
        `);

        console.log("\nCURRENT USERS:");
        console.table(users.rows);

        const existingAdmin = await query(`
            SELECT id, username, email, password_hash, is_active
            FROM users
            WHERE LOWER(username) = 'admin'
            LIMIT 1
        `);

        const school = await query(`
            SELECT id
            FROM schools
            WHERE school_code = 'LMC001'
            LIMIT 1
        `);

        const role = await query(`
            SELECT id
            FROM roles
            WHERE LOWER(role_name) = 'administrator'
            LIMIT 1
        `);

        if (!school.rows.length) {
            throw new Error("Leadedge Model College (LMC001) was not found.");
        }

        if (!role.rows.length) {
            throw new Error("Administrator role was not found.");
        }

        const passwordHash = await bcrypt.hash(
            "Admin@123",
            10
        );

        if (existingAdmin.rows.length) {

            await query(`
                UPDATE users
                SET
                    school_id = $1,
                    role_id = $2,
                    first_name = 'System',
                    last_name = 'Administrator',
                    email = 'admin@leadedgecollege.local',
                    password_hash = $3,
                    is_active = TRUE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE LOWER(username) = 'admin'
            `, [
                school.rows[0].id,
                role.rows[0].id,
                passwordHash
            ]);

            console.log("\n==========================================");
            console.log(" EXISTING ADMIN ACCOUNT RESET SUCCESSFULLY");
            console.log("==========================================");
            console.log("Username: admin");
            console.log("Password: Admin@123");

        } else {

            await query(`
                INSERT INTO users (
                    school_id,
                    role_id,
                    first_name,
                    last_name,
                    email,
                    username,
                    password_hash,
                    is_active
                )
                VALUES (
                    $1,
                    $2,
                    'System',
                    'Administrator',
                    'admin@leadedgecollege.local',
                    'admin',
                    $3,
                    TRUE
                )
            `, [
                school.rows[0].id,
                role.rows[0].id,
                passwordHash
            ]);

            console.log("\n==========================================");
            console.log(" ADMIN ACCOUNT CREATED SUCCESSFULLY");
            console.log("==========================================");
            console.log("Username: admin");
            console.log("Password: Admin@123");
        }

        process.exit(0);

    } catch (error) {

        console.error("\n==========================================");
        console.error(" RENDER ADMIN SETUP FAILED");
        console.error("==========================================");
        console.error(error.message);

        process.exit(1);
    }
}

main();
