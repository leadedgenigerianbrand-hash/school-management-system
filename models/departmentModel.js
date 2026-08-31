const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Department Model
|--------------------------------------------------------------------------
|
| Handles school departments.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Department
|--------------------------------------------------------------------------
*/

async function createDepartment({
    schoolId,
    departmentName,
    departmentCode = null,
    description = null,
    headOfDepartment = null,
    status = "active"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!departmentName || !departmentName.trim()) {
        throw new Error("Department name is required.");
    }

    const sql = `
        INSERT INTO departments (
            school_id,
            department_name,
            department_code,
            description,
            head_of_department,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
        )
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            schoolId,
            departmentName.trim(),
            departmentCode,
            description,
            headOfDepartment,
            status
        ]
    );

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Department By ID
|--------------------------------------------------------------------------
*/

async function findDepartmentById(
    departmentId,
    schoolId = null
) {

    let sql = `
        SELECT

            d.*,

            COUNT(DISTINCT st.id)::INTEGER AS staff_count

        FROM departments d

        LEFT JOIN staff st
            ON st.department_id = d.id

        WHERE d.id = $1
    `;

    const values = [
        departmentId
    ];


    if (schoolId) {

        sql += `
            AND d.school_id = $2
        `;

        values.push(
            schoolId
        );
    }


    sql += `
        GROUP BY d.id
        LIMIT 1
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Find Department By Code
|--------------------------------------------------------------------------
*/

async function findDepartmentByCode(
    departmentCode,
    schoolId
) {

    const sql = `
        SELECT *

        FROM departments

        WHERE department_code = $1

          AND school_id = $2

        LIMIT 1
    `;


    const result = await query(
        sql,
        [
            departmentCode,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Find All Departments
|--------------------------------------------------------------------------
*/

async function findDepartments(
    schoolId,
    {
        status = null
    } = {}
) {

    let sql = `
        SELECT

            d.*,

            COUNT(DISTINCT st.id)::INTEGER AS staff_count

        FROM departments d

        LEFT JOIN staff st
            ON st.department_id = d.id

        WHERE d.school_id = $1
    `;


    const values = [
        schoolId
    ];


    if (status) {

        values.push(status);

        sql += `
            AND d.status = $${values.length}
        `;
    }


    sql += `
        GROUP BY d.id

        ORDER BY d.department_name ASC
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Update Department
|--------------------------------------------------------------------------
*/

async function updateDepartment(
    departmentId,
    schoolId,
    {
        departmentName,
        departmentCode = null,
        description = null,
        headOfDepartment = null,
        status = "active"
    }
) {

    if (!departmentName || !departmentName.trim()) {
        throw new Error("Department name is required.");
    }


    const sql = `
        UPDATE departments

        SET

            department_name = $1,

            department_code = $2,

            description = $3,

            head_of_department = $4,

            status = $5,

            updated_at = NOW()

        WHERE id = $6

          AND school_id = $7

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            departmentName.trim(),
            departmentCode,
            description,
            headOfDepartment,
            status,
            departmentId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Delete Department
|--------------------------------------------------------------------------
*/

async function deleteDepartment(
    departmentId,
    schoolId
) {

    const sql = `
        DELETE FROM departments

        WHERE id = $1

          AND school_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            departmentId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Search Departments
|--------------------------------------------------------------------------
*/

async function searchDepartments(
    searchTerm,
    schoolId
) {

    const sql = `
        SELECT

            d.*,

            COUNT(DISTINCT st.id)::INTEGER AS staff_count

        FROM departments d

        LEFT JOIN staff st
            ON st.department_id = d.id

        WHERE d.school_id = $1

          AND (

              d.department_name ILIKE $2

              OR d.department_code ILIKE $2

              OR d.description ILIKE $2

          )

        GROUP BY d.id

        ORDER BY

            d.department_name ASC
    `;


    const result = await query(
        sql,
        [
            schoolId,
            `%${searchTerm}%`
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Count Departments
|--------------------------------------------------------------------------
*/

async function countDepartments(
    schoolId,
    status = null
) {

    let sql = `
        SELECT

            COUNT(*) AS department_count

        FROM departments

        WHERE school_id = $1
    `;


    const values = [
        schoolId
    ];


    if (status) {

        values.push(status);

        sql += `
            AND status = $${values.length}
        `;
    }


    const result = await query(
        sql,
        values
    );


    return Number(
        result.rows[0].department_count
    );
}


/*
|--------------------------------------------------------------------------
| Get Department Staff
|--------------------------------------------------------------------------
*/

async function getDepartmentStaff(
    departmentId,
    schoolId
) {

    const sql = `
        SELECT

            st.*,

            d.department_name

        FROM staff st

        INNER JOIN departments d
            ON d.id = st.department_id

        WHERE st.department_id = $1

          AND st.school_id = $2

        ORDER BY

            st.last_name ASC,

            st.first_name ASC
    `;


    const result = await query(
        sql,
        [
            departmentId,
            schoolId
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Department Summary
|--------------------------------------------------------------------------
*/

async function getDepartmentSummary(
    schoolId
) {

    const sql = `
        SELECT

            d.id,

            d.department_name,

            d.department_code,

            d.status,

            COUNT(st.id)::INTEGER AS staff_count

        FROM departments d

        LEFT JOIN staff st
            ON st.department_id = d.id

        WHERE d.school_id = $1

        GROUP BY

            d.id,

            d.department_name,

            d.department_code,

            d.status

        ORDER BY

            d.department_name ASC
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Update Department Status
|--------------------------------------------------------------------------
*/

async function updateDepartmentStatus(
    departmentId,
    schoolId,
    status
) {

    const allowedStatuses = [
        "active",
        "inactive"
    ];


    if (!allowedStatuses.includes(status)) {
        throw new Error(
            "Invalid department status."
        );
    }


    const sql = `
        UPDATE departments

        SET

            status = $1,

            updated_at = NOW()

        WHERE id = $2

          AND school_id = $3

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            status,
            departmentId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    createDepartment,

    findDepartmentById,

    findDepartmentByCode,

    findDepartments,

    updateDepartment,

    deleteDepartment,

    searchDepartments,

    countDepartments,

    getDepartmentStaff,

    getDepartmentSummary,

    updateDepartmentStatus

};