const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Role Model
|--------------------------------------------------------------------------
|
| Handles system roles and role permissions.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Role
|--------------------------------------------------------------------------
*/

async function createRole({
    roleName,
    description = null
}) {

    if (!roleName || !roleName.trim()) {
        throw new Error("Role name is required.");
    }

    const sql = `
        INSERT INTO roles (
            role_name,
            description
        )
        VALUES (
            $1,
            $2
        )
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            roleName.trim(),
            description
        ]
    );

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Role By ID
|--------------------------------------------------------------------------
*/

async function findRoleById(roleId) {

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


/*
|--------------------------------------------------------------------------
| Find Role By Name
|--------------------------------------------------------------------------
*/

async function findRoleByName(roleName) {

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
        [roleName]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Find All Roles
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Update Role
|--------------------------------------------------------------------------
*/

async function updateRole(
    roleId,
    {
        roleName,
        description = null
    }
) {

    if (!roleName || !roleName.trim()) {
        throw new Error("Role name is required.");
    }

    const sql = `
        UPDATE roles

        SET
            role_name = $1,
            description = $2

        WHERE id = $3

        RETURNING *
    `;

    const result = await query(
        sql,
        [
            roleName.trim(),
            description,
            roleId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Delete Role
|--------------------------------------------------------------------------
*/

async function deleteRole(roleId) {

    const sql = `
        DELETE FROM roles
        WHERE id = $1
        RETURNING *
    `;

    const result = await query(
        sql,
        [roleId]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Assign Permission To Role
|--------------------------------------------------------------------------
*/

async function assignPermission(
    roleId,
    permissionId
) {

    const sql = `
        INSERT INTO role_permissions (
            role_id,
            permission_id
        )
        VALUES (
            $1,
            $2
        )
        ON CONFLICT DO NOTHING
        RETURNING *
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


/*
|--------------------------------------------------------------------------
| Remove Permission From Role
|--------------------------------------------------------------------------
*/

async function removePermission(
    roleId,
    permissionId
) {

    const sql = `
        DELETE FROM role_permissions
        WHERE role_id = $1
        AND permission_id = $2
        RETURNING *
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


/*
|--------------------------------------------------------------------------
| Get Role Permissions
|--------------------------------------------------------------------------
*/

async function getRolePermissions(roleId) {

    const sql = `
        SELECT
            p.*
        FROM permissions p

        INNER JOIN role_permissions rp
            ON rp.permission_id = p.id

        WHERE rp.role_id = $1

        ORDER BY
            p.name ASC
    `;

    const result = await query(
        sql,
        [roleId]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Check Role Permission
|--------------------------------------------------------------------------
*/

async function hasPermission(
    roleId,
    permissionName
) {

    const sql = `
        SELECT EXISTS (

            SELECT 1

            FROM role_permissions rp

            INNER JOIN permissions p
                ON p.id = rp.permission_id

            WHERE rp.role_id = $1

            AND (
                LOWER(p.name) = LOWER($2)

                OR LOWER(
                    COALESCE(
                        p.permission_name,
                        ''
                    )
                ) = LOWER($2)
            )

        ) AS has_permission
    `;

    const result = await query(
        sql,
        [
            roleId,
            permissionName
        ]
    );

    return result.rows[0].has_permission;
}


/*
|--------------------------------------------------------------------------
| Get Roles For User
|--------------------------------------------------------------------------
*/

async function getUserRoles(userId) {

    const sql = `
        SELECT
            r.*
        FROM roles r

        INNER JOIN users u
            ON u.role_id = r.id

        WHERE u.id = $1

        ORDER BY
            r.role_name ASC
    `;

    const result = await query(
        sql,
        [userId]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Role Users
|--------------------------------------------------------------------------
*/

async function getRoleUsers(
    roleId,
    schoolId = null
) {

    let sql = `
        SELECT
            u.id,
            u.username,
            u.email,
            u.role_id,
            u.school_id,
            u.first_name,
            u.last_name,
            u.is_active,
            u.created_at

        FROM users u

        WHERE u.role_id = $1
    `;

    const values = [roleId];

    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND u.school_id = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            u.username ASC
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Role Summary
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

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

    getRoleSummary

};