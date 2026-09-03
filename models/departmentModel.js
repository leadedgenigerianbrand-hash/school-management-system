const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Department Model
|--------------------------------------------------------------------------
| Compatible with the current PostgreSQL schema.
|
| departments:
| id, school_id, department_name, department_code, description,
| is_active, created_at, updated_at
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
    isActive = true
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
            is_active
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        departmentName.trim(),
        departmentCode,
        description,
        isActive
    ]);

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Find Department By ID
|--------------------------------------------------------------------------
*/

async function findDepartmentById(departmentId, schoolId = null) {
    let sql = `
        SELECT
            d.*,
            COUNT(DISTINCT st.id)::INTEGER AS staff_count
        FROM departments d
        LEFT JOIN staff st
            ON st.department_id = d.id
        WHERE d.id = $1
    `;

    const values = [departmentId];

    if (schoolId) {
        values.push(schoolId);

        sql += `
            AND d.school_id = $${values.length}
        `;
    }

    sql += `
        GROUP BY d.id
        LIMIT 1
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Find Department By Code
|--------------------------------------------------------------------------
*/

async function findDepartmentByCode(departmentCode, schoolId) {
    const sql = `
        SELECT *
        FROM departments
        WHERE department_code = $1
          AND school_id = $2
        LIMIT 1
    `;

    const result = await query(sql, [
        departmentCode,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Check Whether Department Exists
|--------------------------------------------------------------------------
*/

async function departmentExists(
    schoolId,
    departmentName,
    excludeDepartmentId = null
) {
    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM departments
            WHERE school_id = $1
              AND LOWER(department_name) = LOWER($2)
    `;

    const values = [
        schoolId,
        departmentName
    ];

    if (excludeDepartmentId) {
        values.push(excludeDepartmentId);

        sql += `
            AND id <> $${values.length}
        `;
    }

    sql += `
        ) AS exists
    `;

    const result = await query(sql, values);

    return result.rows[0].exists;
}

/*
|--------------------------------------------------------------------------
| Find All Departments
|--------------------------------------------------------------------------
*/

async function findDepartments(
    schoolId,
    {
        isActive = null
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

    const values = [schoolId];

    if (isActive !== null && isActive !== undefined) {
        values.push(isActive);

        sql += `
            AND d.is_active = $${values.length}
        `;
    }

    sql += `
        GROUP BY d.id
        ORDER BY d.department_name ASC
    `;

    const result = await query(sql, values);

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
    data
) {
    const allowedFields = {
        departmentName: "department_name",
        departmentCode: "department_code",
        description: "description",
        isActive: "is_active"
    };

    const updates = [];
    const values = [];

    for (const key of Object.keys(data || {})) {
        if (
            allowedFields[key] &&
            data[key] !== undefined
        ) {
            let value = data[key];

            if (
                key === "departmentName" &&
                typeof value === "string"
            ) {
                value = value.trim();
            }

            values.push(value);

            updates.push(
                `${allowedFields[key]} = $${values.length}`
            );
        }
    }

    if (updates.length === 0) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }

    values.push(departmentId);
    const departmentIdPosition = values.length;

    values.push(schoolId);
    const schoolIdPosition = values.length;

    const sql = `
        UPDATE departments
        SET
            ${updates.join(", ")},
            updated_at = NOW()
        WHERE id = $${departmentIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Update Department Status
|--------------------------------------------------------------------------
*/

async function updateDepartmentStatus(
    departmentId,
    schoolId,
    isActive
) {
    const sql = `
        UPDATE departments
        SET
            is_active = $1,
            updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result = await query(sql, [
        isActive,
        departmentId,
        schoolId
    ]);

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

    const result = await query(sql, [
        departmentId,
        schoolId
    ]);

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
        ORDER BY d.department_name ASC
        LIMIT 100
    `;

    const result = await query(sql, [
        schoolId,
        `%${String(searchTerm || "").trim()}%`
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Count Departments
|--------------------------------------------------------------------------
*/

async function countDepartments(
    schoolId,
    isActive = null
) {
    let sql = `
        SELECT COUNT(*) AS department_count
        FROM departments
        WHERE school_id = $1
    `;

    const values = [schoolId];

    if (isActive !== null && isActive !== undefined) {
        values.push(isActive);

        sql += `
            AND is_active = $${values.length}
        `;
    }

    const result = await query(sql, values);

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

    const result = await query(sql, [
        departmentId,
        schoolId
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Get Department Summary
|--------------------------------------------------------------------------
*/

async function getDepartmentSummary(schoolId) {
    const sql = `
        SELECT
            d.id,
            d.department_name,
            d.department_code,
            d.description,
            d.is_active,
            COUNT(st.id)::INTEGER AS staff_count
        FROM departments d
        LEFT JOIN staff st
            ON st.department_id = d.id
        WHERE d.school_id = $1
        GROUP BY
            d.id,
            d.department_name,
            d.department_code,
            d.description,
            d.is_active
        ORDER BY d.department_name ASC
    `;

    const result = await query(sql, [
        schoolId
    ]);

    return result.rows;
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
    departmentExists,
    findDepartments,
    updateDepartment,
    updateDepartmentStatus,
    deleteDepartment,
    searchDepartments,
    countDepartments,
    getDepartmentStaff,
    getDepartmentSummary
};