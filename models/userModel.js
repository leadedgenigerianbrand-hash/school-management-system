"use strict";

const { query } = require("../config/database");

async function createUser({
    schoolId,
    roleId,
    username,
    email,
    passwordHash,
    firstName,
    middleName = null,
    lastName,
    phone = null,
    profilePhotoUrl = null,
    isActive = true
}) {
    if (!schoolId) throw new Error("School ID is required.");
    if (!roleId) throw new Error("Role ID is required.");
    if (!username || !username.trim()) throw new Error("Username is required.");
    if (!passwordHash) throw new Error("Password hash is required.");
    if (!firstName || !firstName.trim()) throw new Error("First name is required.");
    if (!lastName || !lastName.trim()) throw new Error("Last name is required.");

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
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11
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

    const result = await query(sql, [
        schoolId,
        roleId,
        firstName.trim(),
        middleName ? middleName.trim() : null,
        lastName.trim(),
        email ? email.trim().toLowerCase() : null,
        phone || null,
        username.trim(),
        passwordHash,
        profilePhotoUrl || null,
        isActive
    ]);

    return result.rows[0] || null;
}

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
        LEFT JOIN roles r ON r.id = u.role_id
        LEFT JOIN schools s ON s.id = u.school_id
        WHERE u.id = $1
        LIMIT 1
    `;

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
}

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
        LEFT JOIN roles r ON r.id = u.role_id
        LEFT JOIN schools s ON s.id = u.school_id
        WHERE LOWER(u.username) = LOWER($1)
        LIMIT 1
    `;

    const result = await query(sql, [username]);
    return result.rows[0] || null;
}

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
        LEFT JOIN roles r ON r.id = u.role_id
        LEFT JOIN schools s ON s.id = u.school_id
        WHERE LOWER(u.email) = LOWER($1)
        LIMIT 1
    `;

    const result = await query(sql, [email]);
    return result.rows[0] || null;
}

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
        LEFT JOIN roles r ON r.id = u.role_id
        LEFT JOIN schools s ON s.id = u.school_id
        WHERE
            LOWER(u.username) = LOWER($1)
            OR LOWER(u.email) = LOWER($1)
        LIMIT 1
    `;

    const result = await query(sql, [identifier]);
    return result.rows[0] || null;
}

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

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
}

async function updatePassword(userId, passwordHash) {
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

    const result = await query(sql, [passwordHash, userId]);
    return result.rows[0] || null;
}

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

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
}

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

    const result = await query(sql, [userId]);
    return result.rows[0] || null;
}

async function updateUserProfile(
    userId,
    {
        firstName,
        middleName = null,
        lastName,
        email,
        phone,
        profilePhotoUrl
    }
) {
    const sql = `
        UPDATE users
        SET
            first_name = COALESCE($1, first_name),
            middle_name = $2,
            last_name = COALESCE($3, last_name),
            email = COALESCE($4, email),
            phone = $5,
            profile_photo_url = COALESCE($6, profile_photo_url),
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

    const result = await query(sql, [
        firstName || null,
        middleName,
        lastName || null,
        email ? email.trim().toLowerCase() : null,
        phone || null,
        profilePhotoUrl || null,
        userId
    ]);

    return result.rows[0] || null;
}

async function findUsersBySchool(schoolId) {
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
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.school_id = $1
        ORDER BY
            u.first_name ASC,
            u.last_name ASC,
            u.username ASC
    `;

    const result = await query(sql, [schoolId]);
    return result.rows;
}

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

    const values = [username];

    if (schoolId) {
        values.push(schoolId);
        sql += ` AND school_id = $${values.length}`;
    }

    if (excludeUserId) {
        values.push(excludeUserId);
        sql += ` AND id <> $${values.length}`;
    }

    sql += ` ) AS exists`;

    const result = await query(sql, values);
    return result.rows[0].exists;
}

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

    const values = [email];

    if (schoolId) {
        values.push(schoolId);
        sql += ` AND school_id = $${values.length}`;
    }

    if (excludeUserId) {
        values.push(excludeUserId);
        sql += ` AND id <> $${values.length}`;
    }

    sql += ` ) AS exists`;

    const result = await query(sql, values);
    return result.rows[0].exists;
}

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

    const result = await query(sql, [userId]);
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