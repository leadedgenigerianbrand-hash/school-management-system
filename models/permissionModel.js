const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Permission Model
|--------------------------------------------------------------------------
|
| Handles the permissions used by the school management system.
|
| Examples:
|
| students.view
| students.create
| students.update
| students.delete
|
| results.view
| results.enter
| results.approve
|
| fees.view
| fees.collect
|
| attendance.view
| attendance.mark
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Permission
|--------------------------------------------------------------------------
*/

async function createPermission({
    name,
    description = null,
    module = null
}) {

    if (!name || !name.trim()) {
        throw new Error("Permission name is required.");
    }


    const sql = `
        INSERT INTO permissions (
            name,
            description,
            module
        )
        VALUES (
            $1,
            $2,
            $3
        )
        RETURNING *
    `;


    const result = await query(
        sql,
        [
            name.trim(),
            description,
            module
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Permission By ID
|--------------------------------------------------------------------------
*/

async function findPermissionById(
    permissionId
) {

    const sql = `
        SELECT *

        FROM permissions

        WHERE id = $1

        LIMIT 1
    `;


    const result = await query(
        sql,
        [
            permissionId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Find Permission By Name
|--------------------------------------------------------------------------
*/

async function findPermissionByName(
    permissionName
) {

    const sql = `
        SELECT *

        FROM permissions

        WHERE LOWER(name) = LOWER($1)

        LIMIT 1
    `;


    const result = await query(
        sql,
        [
            permissionName
        ]
    );


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


    if (module) {

        values.push(module);

        sql += `
            AND module = $${values.length}
        `;
    }


    sql += `
        ORDER BY

            module ASC NULLS LAST,

            name ASC
    `;


    const result = await query(
        sql,
        values
    );


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
        description = null,
        module = null
    }
) {

    if (!name || !name.trim()) {
        throw new Error(
            "Permission name is required."
        );
    }


    const sql = `
        UPDATE permissions

        SET

            name = $1,

            description = $2,

            module = $3,

            updated_at = NOW()

        WHERE id = $4

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            name.trim(),
            description,
            module,
            permissionId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Delete Permission
|--------------------------------------------------------------------------
*/

async function deletePermission(
    permissionId
) {

    const sql = `
        DELETE FROM permissions

        WHERE id = $1

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            permissionId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Search Permissions
|--------------------------------------------------------------------------
*/

async function searchPermissions(
    searchTerm
) {

    const sql = `
        SELECT *

        FROM permissions

        WHERE

            name ILIKE $1

            OR description ILIKE $1

            OR module ILIKE $1

        ORDER BY

            name ASC
    `;


    const result = await query(
        sql,
        [
            `%${searchTerm}%`
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Permissions By Module
|--------------------------------------------------------------------------
*/

async function getPermissionsByModule(
    module
) {

    const sql = `
        SELECT *

        FROM permissions

        WHERE module = $1

        ORDER BY

            name ASC
    `;


    const result = await query(
        sql,
        [
            module
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Permission Modules
|--------------------------------------------------------------------------
*/

async function getPermissionModules() {

    const sql = `
        SELECT DISTINCT

            module

        FROM permissions

        WHERE module IS NOT NULL

          AND module <> ''

        ORDER BY

            module ASC
    `;


    const result = await query(
        sql
    );


    return result.rows.map(
        row => row.module
    );
}


/*
|--------------------------------------------------------------------------
| Get Roles With Permission
|--------------------------------------------------------------------------
*/

async function getPermissionRoles(
    permissionId
) {

    const sql = `
        SELECT

            r.*

        FROM roles r

        INNER JOIN role_permissions rp
            ON rp.role_id = r.id

        WHERE rp.permission_id = $1

        ORDER BY

            r.name ASC
    `;


    const result = await query(
        sql,
        [
            permissionId
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Check If Permission Exists
|--------------------------------------------------------------------------
*/

async function permissionExists(
    permissionName
) {

    const sql = `
        SELECT

            EXISTS (

                SELECT 1

                FROM permissions

                WHERE LOWER(name)
                    =
                    LOWER($1)

            ) AS exists
    `;


    const result = await query(
        sql,
        [
            permissionName
        ]
    );


    return result.rows[0].exists;
}


/*
|--------------------------------------------------------------------------
| Count Permissions
|--------------------------------------------------------------------------
*/

async function countPermissions(
    module = null
) {

    let sql = `
        SELECT

            COUNT(*) AS permission_count

        FROM permissions

        WHERE 1 = 1
    `;


    const values = [];


    if (module) {

        values.push(module);

        sql += `
            AND module = $${values.length}
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

            p.module,

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

            p.module

        ORDER BY

            p.module ASC NULLS LAST
    `;


    const result = await query(
        sql
    );


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