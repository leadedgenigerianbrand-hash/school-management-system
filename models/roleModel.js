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

function normalizeRoleName(roleName) {
    return String(roleName)
        .trim();
}

function normalizePermissionName(permissionName) {
    return String(permissionName)
        .trim()
        .toLowerCase();
}

async function createRole({
    roleName,
    description = null
}) {
    requireValue(
        roleName,
        "Role name is required."
    );

    const normalizedRoleName =
        normalizeRoleName(roleName);

    const normalizedDescription =
        description === null ||
        description === undefined ||
        String(description).trim() === ""
            ? null
            : String(description).trim();

    const sql = `
        INSERT INTO roles (
            role_name,
            description
        )
        VALUES (
            $1,
            $2
        )
        RETURNING
            id,
            role_name,
            description,
            created_at
    `;

    const result = await query(
        sql,
        [
            normalizedRoleName,
            normalizedDescription
        ]
    );

    return result.rows[0] || null;
}

async function findRoleById(roleId) {
    requireValue(
        roleId,
        "Role ID is required."
    );

    const sql = `
        SELECT
            id,
            role_name,
            description,
            created_at
        FROM roles
        WHERE id = $1
        LIMIT 1
    `;

    const result = await query(
        sql,
        [roleId]
    );

    return result.rows[0] || null;
}

async function findRoleByName(roleName) {
    requireValue(
        roleName,
        "Role name is required."
    );

    const sql = `
        SELECT
            id,
            role_name,
            description,
            created_at
        FROM roles
        WHERE LOWER(role_name) = LOWER($1)
        LIMIT 1
    `;

    const result = await query(
        sql,
        [normalizeRoleName(roleName)]
    );

    return result.rows[0] || null;
}

async function findRoles() {
    const sql = `
        SELECT
            r.id,
            r.role_name,
            r.description,
            r.created_at,
            COUNT(
                DISTINCT rp.permission_id
            )::INTEGER AS permission_count
        FROM roles r
        LEFT JOIN role_permissions rp
            ON rp.role_id = r.id
        GROUP BY
            r.id,
            r.role_name,
            r.description,
            r.created_at
        ORDER BY
            r.role_name ASC
    `;

    const result = await query(sql);

    return result.rows;
}

async function updateRole(
    roleId,
    {
        roleName,
        description = null
    }
) {
    requireValue(
        roleId,
        "Role ID is required."
    );

    requireValue(
        roleName,
        "Role name is required."
    );

    const normalizedRoleName =
        normalizeRoleName(roleName);

    const normalizedDescription =
        description === null ||
        description === undefined ||
        String(description).trim() === ""
            ? null
            : String(description).trim();

    const sql = `
        UPDATE roles
        SET
            role_name = $1,
            description = $2
        WHERE id = $3
        RETURNING
            id,
            role_name,
            description,
            created_at
    `;

    const result = await query(
        sql,
        [
            normalizedRoleName,
            normalizedDescription,
            roleId
        ]
    );

    return result.rows[0] || null;
}

async function deleteRole(roleId) {
    requireValue(
        roleId,
        "Role ID is required."
    );

    const sql = `
        DELETE FROM roles
        WHERE id = $1
        RETURNING
            id,
            role_name,
            description,
            created_at
    `;

    const result = await query(
        sql,
        [roleId]
    );

    return result.rows[0] || null;
}

async function assignPermission(
    roleId,
    permissionId
) {
    requireValue(
        roleId,
        "Role ID is required."
    );

    requireValue(
        permissionId,
        "Permission ID is required."
    );

    const sql = `
        INSERT INTO role_permissions (
            role_id,
            permission_id
        )
        VALUES (
            $1,
            $2
        )
        ON CONFLICT (
            role_id,
            permission_id
        )
        DO NOTHING
        RETURNING
            role_id,
            permission_id
    `;

    const result = await query(
        sql,
        [
            roleId,
            permissionId
        ]
    );

    return result.rows[0] || null;
}

async function removePermission(
    roleId,
    permissionId
) {
    requireValue(
        roleId,
        "Role ID is required."
    );

    requireValue(
        permissionId,
        "Permission ID is required."
    );

    const sql = `
        DELETE FROM role_permissions
        WHERE role_id = $1
          AND permission_id = $2
        RETURNING
            role_id,
            permission_id
    `;

    const result = await query(
        sql,
        [
            roleId,
            permissionId
        ]
    );

    return result.rows[0] || null;
}

async function getRolePermissions(roleId) {
    requireValue(
        roleId,
        "Role ID is required."
    );

    const sql = `
        SELECT
            p.id,
            p.permission_name,
            p.description,
            p.created_at
        FROM permissions p
        INNER JOIN role_permissions rp
            ON rp.permission_id = p.id
        WHERE rp.role_id = $1
        ORDER BY
            p.permission_name ASC
    `;

    const result = await query(
        sql,
        [roleId]
    );

    return result.rows;
}

async function hasPermission(
    roleId,
    permissionName
) {
    requireValue(
        roleId,
        "Role ID is required."
    );

    requireValue(
        permissionName,
        "Permission name is required."
    );

    const sql = `
        SELECT EXISTS (
            SELECT 1
            FROM role_permissions rp
            INNER JOIN permissions p
                ON p.id = rp.permission_id
            WHERE rp.role_id = $1
              AND LOWER(p.permission_name) = LOWER($2)
        ) AS has_permission
    `;

    const result = await query(
        sql,
        [
            roleId,
            normalizePermissionName(
                permissionName
            )
        ]
    );

    return Boolean(
        result.rows[0].has_permission
    );
}

async function getUserRoles(userId) {
    requireValue(
        userId,
        "User ID is required."
    );

    const sql = `
        SELECT
            r.id,
            r.role_name,
            r.description,
            r.created_at
        FROM roles r
        INNER JOIN users u
            ON u.role_id = r.id
        WHERE u.id = $1
        LIMIT 1
    `;

    const result = await query(
        sql,
        [userId]
    );

    return result.rows;
}

async function getRoleUsers(
    roleId,
    schoolId = null
) {
    requireValue(
        roleId,
        "Role ID is required."
    );

    let sql = `
        SELECT
            u.id,
            u.username,
            u.email,
            u.role_id,
            u.school_id,
            u.first_name,
            u.middle_name,
            u.last_name,
            u.phone,
            u.profile_photo_url,
            u.is_active,
            u.created_at,
            u.updated_at
        FROM users u
        WHERE u.role_id = $1
    `;

    const values = [roleId];

    if (
        schoolId !== null &&
        schoolId !== undefined
    ) {
        values.push(schoolId);

        sql += `
            AND u.school_id = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            u.first_name ASC,
            u.last_name ASC,
            u.username ASC
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows;
}

async function getRoleSummary() {
    const sql = `
        SELECT
            r.id,
            r.role_name,
            r.description,
            COUNT(
                DISTINCT u.id
            )::INTEGER AS user_count,
            COUNT(
                DISTINCT rp.permission_id
            )::INTEGER AS permission_count
        FROM roles r
        LEFT JOIN users u
            ON u.role_id = r.id
        LEFT JOIN role_permissions rp
            ON rp.role_id = r.id
        GROUP BY
            r.id,
            r.role_name,
            r.description
        ORDER BY
            r.role_name ASC
    `;

    const result = await query(sql);

    return result.rows;
}

async function roleExists(
    roleName,
    excludeRoleId = null
) {
    requireValue(
        roleName,
        "Role name is required."
    );

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM roles
            WHERE LOWER(role_name) = LOWER($1)
    `;

    const values = [
        normalizeRoleName(roleName)
    ];

    if (
        excludeRoleId !== null &&
        excludeRoleId !== undefined
    ) {
        values.push(excludeRoleId);

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

async function countRoles() {
    const sql = `
        SELECT
            COUNT(*)::INTEGER AS count
        FROM roles
    `;

    const result = await query(sql);

    return Number(
        result.rows[0].count
    );
}

module.exports = {
    createRole,
    findRoleById,
    findRoleByName,
    findRoles,
    updateRole,
    deleteRole,
    assignPermission,
    removePermission,
    getRolePermissions,
    hasPermission,
    getUserRoles,
    getRoleUsers,
    getRoleSummary,
    roleExists,
    countRoles
};