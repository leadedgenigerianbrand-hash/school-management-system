"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Permission Model
|--------------------------------------------------------------------------
| Compatible with the current PostgreSQL schema.
|
| permissions:
| id
| permission_name
| description
| created_at
|
| role_permissions:
| id
| role_id
| permission_id
| created_at
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Permission
|--------------------------------------------------------------------------
*/

async function createPermission({
    name,
    permissionName,
    description = null
}) {
    const finalName = permissionName || name;

    if (!finalName || !String(finalName).trim()) {
        throw new Error("Permission name is required.");
    }

    const sql = `
        INSERT INTO permissions (
            permission_name,
            description
        )
        VALUES ($1, $2)
        RETURNING *
    `;

    const result = await query(sql, [
        String(finalName).trim(),
        description
    ]);

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Permission By ID
|--------------------------------------------------------------------------
*/

async function findPermissionById(permissionId) {
    const sql = `
        SELECT *
        FROM permissions
        WHERE id = $1
        LIMIT 1
    `;

    const result = await query(sql, [
        permissionId
    ]);

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Find Permission By Name
|--------------------------------------------------------------------------
*/

async function findPermissionByName(permissionName) {
    const sql = `
        SELECT *
        FROM permissions
        WHERE LOWER(permission_name) = LOWER($1)
        LIMIT 1
    `;

    const result = await query(sql, [
        permissionName
    ]);

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Get All Permissions
|--------------------------------------------------------------------------
*/

async function findPermissions({
    module = null
} = {}) {
    let sql = `
        SELECT *
        FROM permissions
        WHERE 1 = 1
    `;

    const values = [];

    /*
     * There is no module column in the database.
     * Module filtering is based on permission_name.
     *
     * Example:
     * students.view
     * students.create
     * students.update
     */

    if (module) {
        values.push(`${String(module).trim()}.%`);

        sql += `
            AND permission_name ILIKE $${values.length}
        `;
    }

    sql += `
        ORDER BY permission_name ASC
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Update Permission
|--------------------------------------------------------------------------
*/

async function updatePermission(
    permissionId,
    {
        name,
        permissionName,
        description = null
    }
) {
    const finalName = permissionName || name;

    if (!finalName || !String(finalName).trim()) {
        throw new Error("Permission name is required.");
    }

    const sql = `
        UPDATE permissions
        SET
            permission_name = $1,
            description = $2
        WHERE id = $3
        RETURNING *
    `;

    const result = await query(sql, [
        String(finalName).trim(),
        description,
        permissionId
    ]);

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Delete Permission
|--------------------------------------------------------------------------
*/

async function deletePermission(permissionId) {
    const sql = `
        DELETE FROM permissions
        WHERE id = $1
        RETURNING *
    `;

    const result = await query(sql, [
        permissionId
    ]);

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Search Permissions
|--------------------------------------------------------------------------
*/

async function searchPermissions(searchTerm) {
    const sql = `
        SELECT *
        FROM permissions
        WHERE
            permission_name ILIKE $1
            OR description ILIKE $1
        ORDER BY permission_name ASC
        LIMIT 100
    `;

    const result = await query(sql, [
        `%${String(searchTerm || "").trim()}%`
    ]);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Permissions By Module
|--------------------------------------------------------------------------
*/

async function getPermissionsByModule(module) {
    if (!module || !String(module).trim()) {
        return [];
    }

    const sql = `
        SELECT *
        FROM permissions
        WHERE permission_name ILIKE $1
        ORDER BY permission_name ASC
    `;

    const result = await query(sql, [
        `${String(module).trim()}.%`
    ]);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Permission Modules
|--------------------------------------------------------------------------
*/

async function getPermissionModules() {
    const sql = `
        SELECT permission_name
        FROM permissions
        WHERE permission_name IS NOT NULL
          AND TRIM(permission_name) <> ''
        ORDER BY permission_name ASC
    `;

    const result = await query(sql);

    const modules = new Set();

    for (const row of result.rows) {
        const permissionName = String(
            row.permission_name
        );

        const separatorIndex =
            permissionName.indexOf(".");

        if (separatorIndex > 0) {
            modules.add(
                permissionName.substring(
                    0,
                    separatorIndex
                )
            );
        }
    }

    return Array.from(modules).sort();
}


/*
|--------------------------------------------------------------------------
| Get Roles With Permission
|--------------------------------------------------------------------------
*/

async function getPermissionRoles(permissionId) {
    const sql = `
        SELECT
            r.*
        FROM roles r
        INNER JOIN role_permissions rp
            ON rp.role_id = r.id
        WHERE rp.permission_id = $1
        ORDER BY r.role_name ASC
    `;

    const result = await query(sql, [
        permissionId
    ]);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Check If Permission Exists
|--------------------------------------------------------------------------
*/

async function permissionExists(
    permissionName,
    excludePermissionId = null
) {
    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM permissions
            WHERE LOWER(permission_name) = LOWER($1)
    `;

    const values = [
        permissionName
    ];

    if (excludePermissionId !== null) {
        values.push(excludePermissionId);

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

    return result.rows[0].exists;
}


/*
|--------------------------------------------------------------------------
| Count Permissions
|--------------------------------------------------------------------------
*/

async function countPermissions(module = null) {
    let sql = `
        SELECT COUNT(*) AS permission_count
        FROM permissions
        WHERE 1 = 1
    `;

    const values = [];

    if (module) {
        values.push(`${String(module).trim()}.%`);

        sql += `
            AND permission_name ILIKE $${values.length}
        `;
    }

    const result = await query(
        sql,
        values
    );

    return Number(
        result.rows[0].permission_count
    );
}


/*
|--------------------------------------------------------------------------
| Get Permission Summary
|--------------------------------------------------------------------------
*/

async function getPermissionSummary() {
    const sql = `
        SELECT
            split_part(
                p.permission_name,
                '.',
                1
            ) AS module,

            COUNT(p.id)::INTEGER
                AS permission_count,

            COUNT(
                DISTINCT rp.role_id
            )::INTEGER
                AS role_count

        FROM permissions p

        LEFT JOIN role_permissions rp
            ON rp.permission_id = p.id

        GROUP BY
            split_part(
                p.permission_name,
                '.',
                1
            )

        ORDER BY module ASC
    `;

    const result = await query(sql);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    createPermission,
    findPermissionById,
    findPermissionByName,
    findPermissions,
    updatePermission,
    deletePermission,
    searchPermissions,
    getPermissionsByModule,
    getPermissionModules,
    getPermissionRoles,
    permissionExists,
    countPermissions,
    getPermissionSummary
};