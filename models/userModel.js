"use strict";

const { query } = require("../config/database");


/*
|--------------------------------------------------------------------------
| USER MODEL
|--------------------------------------------------------------------------
|
| Handles database operations for system users.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
*/

async function createUser({
    schoolId,
    roleId,
    username,
    email,
    passwordHash,
    firstName,
    lastName,
    phone = null
}) {

    const sql = `
        INSERT INTO users (
            school_id,
            role_id,
            first_name,
            last_name,
            email,
            phone,
            username,
            password_hash,
            is_active
        )

        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            TRUE
        )

        RETURNING
            id,
            school_id,
            role_id,
            first_name,
            last_name,
            email,
            phone,
            username,
            is_active,
            last_login_at,
            created_at,
            updated_at
    `;

    const values = [
        schoolId,
        roleId,
        firstName,
        lastName,
        email,
        phone,
        username,
        passwordHash
    ];

    const result = await query(sql, values);

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| FIND USER BY ID
|--------------------------------------------------------------------------
*/

async function findUserById(userId) {

    const sql = `
        SELECT
            u.id,
            u.school_id,
            u.role_id,

            u.first_name,
            u.middle_name,
            u.last_name,

            u.email,
            u.phone,
            u.username,

            u.profile_photo_url,

            u.is_active,
            u.last_login_at,

            u.created_at,
            u.updated_at,

            r.role_name,

            s.school_name,
            s.school_code,
            s.status AS school_status

        FROM users u

        LEFT JOIN roles r
            ON r.id = u.role_id

        LEFT JOIN schools s
            ON s.id = u.school_id

        WHERE u.id = $1

        LIMIT 1
    `;

    const result = await query(
        sql,
        [userId]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| FIND USER BY USERNAME
|--------------------------------------------------------------------------
*/

async function findUserByUsername(username) {

    const sql = `
        SELECT
            u.id,
            u.school_id,
            u.role_id,

            u.first_name,
            u.middle_name,
            u.last_name,

            u.email,
            u.phone,
            u.username,

            u.profile_photo_url,

            u.is_active,
            u.last_login_at,

            u.created_at,
            u.updated_at,

            r.role_name,

            s.school_name,
            s.school_code,
            s.status AS school_status

        FROM users u

        LEFT JOIN roles r
            ON r.id = u.role_id

        LEFT JOIN schools s
            ON s.id = u.school_id

        WHERE LOWER(u.username) = LOWER($1)

        LIMIT 1
    `;

    const result = await query(
        sql,
        [username]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| FIND USER BY EMAIL
|--------------------------------------------------------------------------
*/

async function findUserByEmail(email) {

    const sql = `
        SELECT
            u.id,
            u.school_id,
            u.role_id,

            u.first_name,
            u.middle_name,
            u.last_name,

            u.email,
            u.phone,
            u.username,

            u.profile_photo_url,

            u.is_active,
            u.last_login_at,

            u.created_at,
            u.updated_at,

            r.role_name,

            s.school_name,
            s.school_code,
            s.status AS school_status

        FROM users u

        LEFT JOIN roles r
            ON r.id = u.role_id

        LEFT JOIN schools s
            ON s.id = u.school_id

        WHERE LOWER(u.email) = LOWER($1)

        LIMIT 1
    `;

    const result = await query(
        sql,
        [email]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| FIND USER FOR LOGIN
|--------------------------------------------------------------------------
|
| Login needs password_hash.
|
|--------------------------------------------------------------------------
*/

async function findUserForLogin(identifier) {

    const sql = `
        SELECT
            u.id,
            u.school_id,
            u.role_id,

            u.first_name,
            u.middle_name,
            u.last_name,

            u.email,
            u.phone,
            u.username,

            u.password_hash,

            u.profile_photo_url,

            u.is_active,
            u.last_login_at,

            u.created_at,
            u.updated_at,

            r.role_name,

            s.school_name,
            s.school_code,
            s.status AS school_status

        FROM users u

        LEFT JOIN roles r
            ON r.id = u.role_id

        LEFT JOIN schools s
            ON s.id = u.school_id

        WHERE
            LOWER(u.username) = LOWER($1)

            OR

            LOWER(u.email) = LOWER($1)

        LIMIT 1
    `;

    const result = await query(
        sql,
        [identifier]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| UPDATE LAST LOGIN
|--------------------------------------------------------------------------
*/

async function updateLastLogin(userId) {

    const sql = `
        UPDATE users

        SET
            last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $1

        RETURNING
            id,
            last_login_at,
            updated_at
    `;

    const result = await query(
        sql,
        [userId]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| UPDATE PASSWORD
|--------------------------------------------------------------------------
*/

async function updatePassword(
    userId,
    passwordHash
) {

    const sql = `
        UPDATE users

        SET
            password_hash = $1,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $2

        RETURNING
            id,
            updated_at
    `;

    const result = await query(
        sql,
        [
            passwordHash,
            userId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| ACTIVATE USER
|--------------------------------------------------------------------------
*/

async function activateUser(userId) {

    const sql = `
        UPDATE users

        SET
            is_active = TRUE,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $1

        RETURNING
            id,
            school_id,
            username,
            is_active,
            updated_at
    `;

    const result = await query(
        sql,
        [userId]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| DEACTIVATE USER
|--------------------------------------------------------------------------
*/

async function deactivateUser(userId) {

    const sql = `
        UPDATE users

        SET
            is_active = FALSE,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $1

        RETURNING
            id,
            school_id,
            username,
            is_active,
            updated_at
    `;

    const result = await query(
        sql,
        [userId]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| UPDATE USER PROFILE
|--------------------------------------------------------------------------
*/

async function updateUserProfile(
    userId,
    {
        firstName,
        lastName,
        email,
        phone
    }
) {

    const sql = `
        UPDATE users

        SET
            first_name = $1,
            last_name = $2,
            email = $3,
            phone = $4,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $5

        RETURNING
            id,
            school_id,
            role_id,

            first_name,
            last_name,

            email,
            phone,
            username,

            profile_photo_url,

            is_active,
            last_login_at,

            created_at,
            updated_at
    `;

    const values = [
        firstName,
        lastName,
        email,
        phone,
        userId
    ];

    const result = await query(
        sql,
        values
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| FIND USERS BY SCHOOL
|--------------------------------------------------------------------------
*/

async function findUsersBySchool(schoolId) {

    const sql = `
        SELECT
            u.id,
            u.school_id,

            u.first_name,
            u.middle_name,
            u.last_name,

            u.email,
            u.phone,
            u.username,

            u.profile_photo_url,

            u.is_active,
            u.last_login_at,

            u.created_at,
            u.updated_at,

            r.id AS role_id,
            r.role_name

        FROM users u

        LEFT JOIN roles r
            ON r.id = u.role_id

        WHERE u.school_id = $1

        ORDER BY
            u.first_name ASC,
            u.last_name ASC,
            u.username ASC
    `;

    const result = await query(
        sql,
        [schoolId]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| CHECK USERNAME
|--------------------------------------------------------------------------
*/

async function usernameExists(
    username,
    excludeUserId = null,
    schoolId = null
) {

    let sql = `
        SELECT EXISTS (
            SELECT 1

            FROM users

            WHERE LOWER(username) = LOWER($1)
    `;

    const values = [
        username
    ];

    if (schoolId) {

        sql += `
            AND school_id = $2
        `;

        values.push(schoolId);
    }

    if (excludeUserId) {

        const parameterNumber =
            values.length + 1;

        sql += `
            AND id <> $${parameterNumber}
        `;

        values.push(excludeUserId);
    }

    sql += `
        )
        AS exists
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows[0].exists;
}


/*
|--------------------------------------------------------------------------
| CHECK EMAIL
|--------------------------------------------------------------------------
*/

async function emailExists(
    email,
    excludeUserId = null,
    schoolId = null
) {

    let sql = `
        SELECT EXISTS (
            SELECT 1

            FROM users

            WHERE LOWER(email) = LOWER($1)
    `;

    const values = [
        email
    ];

    if (schoolId) {

        sql += `
            AND school_id = $2
        `;

        values.push(schoolId);
    }

    if (excludeUserId) {

        const parameterNumber =
            values.length + 1;

        sql += `
            AND id <> $${parameterNumber}
        `;

        values.push(excludeUserId);
    }

    sql += `
        )
        AS exists
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows[0].exists;
}


/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/

async function deleteUser(userId) {

    const sql = `
        DELETE FROM users

        WHERE id = $1

        RETURNING
            id,
            school_id,
            username,
            email
    `;

    const result = await query(
        sql,
        [userId]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {

    createUser,

    findUserById,

    findUserByUsername,

    findUserByEmail,

    findUserForLogin,

    updateLastLogin,

    updatePassword,

    activateUser,

    deactivateUser,

    updateUserProfile,

    findUsersBySchool,

    usernameExists,

    emailExists,

    deleteUser

};