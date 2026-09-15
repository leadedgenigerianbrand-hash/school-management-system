"use strict";

const { query } = require("../config/database");

function requireValue(value, message) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        const error = new Error(message);
        error.statusCode = 400;
        throw error;
    }
}

function normalizeEmail(email) {
    if (
        email === undefined ||
        email === null ||
        String(email).trim() === ""
    ) {
        return null;
    }

    return String(email)
        .trim()
        .toLowerCase();
}

function normalizeUsername(username) {
    return String(username)
        .trim();
}

function normalizeName(value) {
    return String(value)
        .trim();
}

async function createUser({
    schoolId,
    roleId,
    username,
    email = null,
    passwordHash,
    firstName,
    middleName = null,
    lastName,
    phone = null,
    profilePhotoUrl = null,
    isActive = true
}) {
    requireValue(
        schoolId,
        "School ID is required."
    );

    requireValue(
        roleId,
        "Role ID is required."
    );

    requireValue(
        username,
        "Username is required."
    );

    requireValue(
        passwordHash,
        "Password hash is required."
    );

    requireValue(
        firstName,
        "First name is required."
    );

    requireValue(
        lastName,
        "Last name is required."
    );

    const normalizedUsername =
        normalizeUsername(username);

    const normalizedEmail =
        normalizeEmail(email);

    const sql = `
        INSERT INTO users (
            school_id,
            role_id,
            first_name,
            middle_name,
            last_name,
            email,
            phone,
            username,
            password_hash,
            profile_photo_url,
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
            $9,
            $10,
            $11
        )
        RETURNING
            id,
            school_id,
            role_id,
            first_name,
            middle_name,
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

    const result = await query(
        sql,
        [
            schoolId,
            roleId,
            normalizeName(firstName),
            middleName
                ? normalizeName(middleName)
                : null,
            normalizeName(lastName),
            normalizedEmail,
            phone
                ? String(phone).trim()
                : null,
            normalizedUsername,
            passwordHash,
            profilePhotoUrl
                ? String(profilePhotoUrl).trim()
                : null,
            Boolean(isActive)
        ]
    );

    return result.rows[0] || null;
}

async function findUserById(userId) {
    requireValue(
        userId,
        "User ID is required."
    );

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

async function findUserByUsername(username) {
    requireValue(
        username,
        "Username is required."
    );

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
        [normalizeUsername(username)]
    );

    return result.rows[0] || null;
}

async function findUserByEmail(email) {
    requireValue(
        email,
        "Email is required."
    );

    const normalizedEmail =
        normalizeEmail(email);

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
        [normalizedEmail]
    );

    return result.rows[0] || null;
}

async function findUserForLogin(identifier) {
    requireValue(
        identifier,
        "Username or email is required."
    );

    const normalizedIdentifier =
        String(identifier)
            .trim()
            .toLowerCase();

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
            LOWER(u.username) = $1
            OR LOWER(u.email) = $1
        LIMIT 1
    `;

    const result = await query(
        sql,
        [normalizedIdentifier]
    );

    return result.rows[0] || null;
}

async function updateLastLogin(userId) {
    requireValue(
        userId,
        "User ID is required."
    );

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

async function updatePassword(
    userId,
    passwordHash
) {
    requireValue(
        userId,
        "User ID is required."
    );

    requireValue(
        passwordHash,
        "Password hash is required."
    );

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

async function activateUser(userId) {
    requireValue(
        userId,
        "User ID is required."
    );

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

async function deactivateUser(userId) {
    requireValue(
        userId,
        "User ID is required."
    );

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

async function updateUserProfile(
    userId,
    {
        firstName = null,
        middleName = null,
        lastName = null,
        email = null,
        phone = null,
        profilePhotoUrl = null
    }
) {
    requireValue(
        userId,
        "User ID is required."
    );

    const normalizedFirstName =
        firstName === null ||
        firstName === undefined
            ? null
            : normalizeName(firstName);

    const normalizedMiddleName =
        middleName === null ||
        middleName === undefined ||
        String(middleName).trim() === ""
            ? null
            : normalizeName(middleName);

    const normalizedLastName =
        lastName === null ||
        lastName === undefined
            ? null
            : normalizeName(lastName);

    const normalizedEmail =
        normalizeEmail(email);

    const normalizedPhone =
        phone === null ||
        phone === undefined ||
        String(phone).trim() === ""
            ? null
            : String(phone).trim();

    const normalizedPhotoUrl =
        profilePhotoUrl === null ||
        profilePhotoUrl === undefined ||
        String(profilePhotoUrl).trim() === ""
            ? null
            : String(profilePhotoUrl).trim();

    const sql = `
        UPDATE users
        SET
            first_name =
                COALESCE($1, first_name),
            middle_name = $2,
            last_name =
                COALESCE($3, last_name),
            email =
                COALESCE($4, email),
            phone = $5,
            profile_photo_url =
                COALESCE($6, profile_photo_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING
            id,
            school_id,
            role_id,
            first_name,
            middle_name,
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

    const result = await query(
        sql,
        [
            normalizedFirstName,
            normalizedMiddleName,
            normalizedLastName,
            normalizedEmail,
            normalizedPhone,
            normalizedPhotoUrl,
            userId
        ]
    );

    return result.rows[0] || null;
}

async function findUsersBySchool(schoolId) {
    requireValue(
        schoolId,
        "School ID is required."
    );

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

async function usernameExists(
    username,
    excludeUserId = null,
    schoolId = null
) {
    requireValue(
        username,
        "Username is required."
    );

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM users
            WHERE LOWER(username) =
                LOWER($1)
    `;

    const values = [
        normalizeUsername(username)
    ];

    if (
        schoolId !== null &&
        schoolId !== undefined
    ) {
        values.push(schoolId);

        sql += `
            AND school_id = $${values.length}
        `;
    }

    if (
        excludeUserId !== null &&
        excludeUserId !== undefined
    ) {
        values.push(excludeUserId);

        sql += `
            AND id <> $${values.length}
        `;
    }

    sql += `
        ) AS exists
    `;

    const result = await query(
        sql,
        values
    );

    return Boolean(
        result.rows[0].exists
    );
}

async function emailExists(
    email,
    excludeUserId = null,
    schoolId = null
) {
    requireValue(
        email,
        "Email is required."
    );

    const normalizedEmail =
        normalizeEmail(email);

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM users
            WHERE LOWER(email) =
                LOWER($1)
    `;

    const values = [
        normalizedEmail
    ];

    if (
        schoolId !== null &&
        schoolId !== undefined
    ) {
        values.push(schoolId);

        sql += `
            AND school_id = $${values.length}
        `;
    }

    if (
        excludeUserId !== null &&
        excludeUserId !== undefined
    ) {
        values.push(excludeUserId);

        sql += `
            AND id <> $${values.length}
        `;
    }

    sql += `
        ) AS exists
    `;

    const result = await query(
        sql,
        values
    );

    return Boolean(
        result.rows[0].exists
    );
}

async function deleteUser(userId) {
    requireValue(
        userId,
        "User ID is required."
    );

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