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

function normalizePermissionName(permissionName) {
    requireValue(
        permissionName,
        "Permission name is required."
    );

    return String(permissionName)
        .trim()
        .toLowerCase();
}

function normalizeDescription(description) {
    if (
        description === undefined ||
        description === null ||
        String(description).trim() === ""
    ) {
        return null;
    }

    return String(description).trim();
}

function normalizeModule(module) {
    if (
        module === undefined ||
        module === null ||
        String(module).trim() === ""
    ) {
        return null;
    }

    return String(module)
        .trim()
        .toLowerCase();
}

async function createPermission({
    name,
    permissionName,
    description = null
}) {
    const finalName =
        permissionName || name;

    const normalizedName =
        normalizePermissionName(
            finalName
        );

    const normalizedDescription =
        normalizeDescription(
            description
        );

    const sql = `
        INSERT INTO permissions (
            permission_name,
            description
        )
        VALUES (
            $1,
            $2
        )
        RETURNING
            id,
            permission_name,
            description,
            created_at
    `;

    const result = await query(
        sql,
        [
            normalizedName,
            normalizedDescription
        ]
    );

    return result.rows[0] || null;
}

async function findPermissionById(
    permissionId
) {
    requireValue(
        permissionId,
        "Permission ID is required."
    );

    const sql = `
        SELECT
            id,
            permission_name,
            description,
            created_at
        FROM permissions
        WHERE id = $1
        LIMIT 1
    `;

    const result = await query(
        sql,
        [permissionId]
    );

    return result.rows[0] || null;
}

async function findPermissionByName(
    permissionName
) {
    const normalizedName =
        normalizePermissionName(
            permissionName
        );

    const sql = `
        SELECT
            id,
            permission_name,
            description,
            created_at
        FROM permissions
        WHERE LOWER(permission_name) = $1
        LIMIT 1
    `;

    const result = await query(
        sql,
        [normalizedName]
    );

    return result.rows[0] || null;
}

async function findPermissions({
    module = null
} = {}) {
    const normalizedModule =
        normalizeModule(module);

    let sql = `
        SELECT
            id,
            permission_name,
            description,
            created_at
        FROM permissions
        WHERE 1 = 1
    `;

    const values = [];

    if (normalizedModule) {
        values.push(
            `${normalizedModule}.%`
        );

        sql += `
            AND LOWER(permission_name)
                LIKE $${values.length}
        `;
    }

    sql += `
        ORDER BY
            permission_name ASC
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows;
}

async function updatePermission(
    permissionId,
    {
        name,
        permissionName,
        description = null
    }
) {
    requireValue(
        permissionId,
        "Permission ID is required."
    );

    const finalName =
        permissionName || name;

    const normalizedName =
        normalizePermissionName(
            finalName
        );

    const normalizedDescription =
        normalizeDescription(
            description
        );

    const sql = `
        UPDATE permissions
        SET
            permission_name = $1,
            description = $2
        WHERE id = $3
        RETURNING
            id,
            permission_name,
            description,
            created_at
    `;

    const result = await query(
        sql,
        [
            normalizedName,
            normalizedDescription,
            permissionId
        ]
    );

    return result.rows[0] || null;
}

async function deletePermission(
    permissionId
) {
    requireValue(
        permissionId,
        "Permission ID is required."
    );

    const sql = `
        DELETE FROM permissions
        WHERE id = $1
        RETURNING
            id,
            permission_name,
            description,
            created_at
    `;

    const result = await query(
        sql,
        [permissionId]
    );

    return result.rows[0] || null;
}

async function searchPermissions(
    searchTerm
) {
    const term =
        String(searchTerm || "")
            .trim();

    if (!term) {
        return findPermissions();
    }

    const sql = `
        SELECT
            id,
            permission_name,
            description,
            created_at
        FROM permissions
        WHERE
            permission_name ILIKE $1
            OR description ILIKE $1
        ORDER BY
            permission_name ASC
        LIMIT 100
    `;

    const result = await query(
        sql,
        [`%${term}%`]
    );

    return result.rows;
}

async function getPermissionsByModule(
    module
) {
    const normalizedModule =
        normalizeModule(module);

    if (!normalizedModule) {
        return [];
    }

    const sql = `
        SELECT
            id,
            permission_name,
            description,
            created_at
        FROM permissions
        WHERE LOWER(permission_name)
            LIKE $1
        ORDER BY
            permission_name ASC
    `;

    const result = await query(
        sql,
        [
            `${normalizedModule}.%`
        ]
    );

    return result.rows;
}

async function getPermissionModules() {
    const sql = `
        SELECT
            permission_name
        FROM permissions
        WHERE permission_name IS NOT NULL
          AND TRIM(permission_name) <> ''
        ORDER BY
            permission_name ASC
    `;

    const result = await query(sql);

    const modules = new Set();

    for (const row of result.rows) {
        const permissionName =
            String(
                row.permission_name
            ).trim();

        const separatorIndex =
            permissionName.indexOf(".");

        if (separatorIndex > 0) {
            modules.add(
                permissionName
                    .substring(
                        0,
                        separatorIndex
                    )
                    .toLowerCase()
            );
        }
    }

    return Array.from(
        modules
    ).sort();
}

async function getPermissionRoles(
    permissionId
) {
    requireValue(
        permissionId,
        "Permission ID is required."
    );

    const sql = `
        SELECT
            r.id,
            r.role_name,
            r.description,
            r.created_at
        FROM roles r
        INNER JOIN role_permissions rp
            ON rp.role_id = r.id
        WHERE rp.permission_id = $1
        ORDER BY
            r.role_name ASC
    `;

    const result = await query(
        sql,
        [permissionId]
    );

    return result.rows;
}

async function permissionExists(
    permissionName,
    excludePermissionId = null
) {
    const normalizedName =
        normalizePermissionName(
            permissionName
        );

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM permissions
            WHERE LOWER(permission_name) = $1
    `;

    const values = [
        normalizedName
    ];

    if (
        excludePermissionId !== null &&
        excludePermissionId !== undefined
    ) {
        values.push(
            excludePermissionId
        );

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

async function countPermissions(
    module = null
) {
    const normalizedModule =
        normalizeModule(module);

    let sql = `
        SELECT
            COUNT(*)::INTEGER
                AS permission_count
        FROM permissions
        WHERE 1 = 1
    `;

    const values = [];

    if (normalizedModule) {
        values.push(
            `${normalizedModule}.%`
        );

        sql += `
            AND LOWER(permission_name)
                LIKE $${values.length}
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

async function getPermissionSummary() {
    const sql = `
        SELECT
            split_part(
                LOWER(p.permission_name),
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
                LOWER(p.permission_name),
                '.',
                1
            )
        ORDER BY
            module ASC
    `;

    const result = await query(sql);

    return result.rows;
}

async function getPermissionUsage(
    permissionId
) {
    requireValue(
        permissionId,
        "Permission ID is required."
    );

    const sql = `
        SELECT
            p.id,
            p.permission_name,
            p.description,
            COUNT(
                DISTINCT rp.role_id
            )::INTEGER AS role_count
        FROM permissions p
        LEFT JOIN role_permissions rp
            ON rp.permission_id = p.id
        WHERE p.id = $1
        GROUP BY
            p.id,
            p.permission_name,
            p.description
        LIMIT 1
    `;

    const result = await query(
        sql,
        [permissionId]
    );

    return result.rows[0] || null;
}

async function getRolePermissionIds(
    roleId
) {
    requireValue(
        roleId,
        "Role ID is required."
    );

    const sql = `
        SELECT
            permission_id
        FROM role_permissions
        WHERE role_id = $1
        ORDER BY
            permission_id ASC
    `;

    const result = await query(
        sql,
        [roleId]
    );

    return result.rows.map(
        (row) => row.permission_id
    );
}

async function assignPermissionToRole(
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
            id,
            role_id,
            permission_id,
            created_at
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

async function removePermissionFromRole(
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
            id,
            role_id,
            permission_id,
            created_at
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
    getPermissionSummary,
    getPermissionUsage,
    getRolePermissionIds,
    assignPermissionToRole,
    removePermissionFromRole
};