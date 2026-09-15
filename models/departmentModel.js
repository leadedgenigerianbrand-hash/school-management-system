"use strict";

const { query } = require("../config/database");

/*
 * Department Model
 *
 * PostgreSQL table:
 * departments
 *
 * Fields:
 * id
 * school_id
 * department_name
 * department_code
 * description
 * is_active
 * created_at
 * updated_at
 *
 * Department relationships:
 *
 * Staff:
 * The current staff table stores department as TEXT:
 * staff.department
 *
 * Students:
 * Students are connected to departments through:
 * student_enrollments.department_id
 *
 * Classes:
 * Classes are connected independently through:
 * classes.academic_level_id
 *
 * Every department query is scoped by school_id where
 * the operation requires school isolation.
 */

/*
 * Create Department
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

    if (
        !departmentName ||
        typeof departmentName !== "string" ||
        !departmentName.trim()
    ) {
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
        departmentCode || null,
        description || null,
        isActive !== false
    ]);

    return result.rows[0];
}

/*
 * Find Department By ID
 */
async function findDepartmentById(
    departmentId,
    schoolId = null
) {
    if (!departmentId) {
        return null;
    }

    let sql = `
        SELECT
            d.*,

            (
                SELECT COUNT(*)::INTEGER
                FROM staff st
                WHERE st.school_id = d.school_id
                  AND LOWER(TRIM(st.department)) =
                      LOWER(TRIM(d.department_name))
            ) AS staff_count,

            (
                SELECT COUNT(DISTINCT se.student_id)::INTEGER
                FROM student_enrollments se
                WHERE se.school_id = d.school_id
                  AND se.department_id = d.id
            ) AS student_count

        FROM departments d

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
        LIMIT 1
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
 * Find Department By Code
 */
async function findDepartmentByCode(
    departmentCode,
    schoolId
) {
    if (!departmentCode || !schoolId) {
        return null;
    }

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
 * Check Whether Department Exists
 *
 * Used before creating or renaming a department.
 * Comparison is case-insensitive.
 */
async function departmentExists(
    schoolId,
    departmentName,
    excludeDepartmentId = null
) {
    if (!schoolId || !departmentName) {
        return false;
    }

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM departments
            WHERE school_id = $1
              AND LOWER(TRIM(department_name)) =
                  LOWER(TRIM($2))
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

    return Boolean(result.rows[0]?.exists);
}

/*
 * Find All Departments
 */
async function findDepartments(
    schoolId,
    {
        isActive = null
    } = {}
) {
    if (!schoolId) {
        return [];
    }

    let sql = `
        SELECT
            d.*,

            (
                SELECT COUNT(*)::INTEGER
                FROM staff st
                WHERE st.school_id = d.school_id
                  AND LOWER(TRIM(st.department)) =
                      LOWER(TRIM(d.department_name))
            ) AS staff_count,

            (
                SELECT COUNT(DISTINCT se.student_id)::INTEGER
                FROM student_enrollments se
                WHERE se.school_id = d.school_id
                  AND se.department_id = d.id
            ) AS student_count

        FROM departments d

        WHERE d.school_id = $1
    `;

    const values = [schoolId];

    if (
        isActive !== null &&
        isActive !== undefined
    ) {
        values.push(Boolean(isActive));

        sql += `
            AND d.is_active = $${values.length}
        `;
    }

    sql += `
        ORDER BY d.department_name ASC
    `;

    const result = await query(sql, values);

    return result.rows;
}

/*
 * Update Department
 */
async function updateDepartment(
    departmentId,
    schoolId,
    data
) {
    if (!departmentId) {
        throw new Error("Department ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

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

            if (
                key === "departmentCode" &&
                typeof value === "string"
            ) {
                value = value.trim() || null;
            }

            if (
                key === "description" &&
                typeof value === "string"
            ) {
                value = value.trim() || null;
            }

            if (key === "isActive") {
                value = Boolean(value);
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

    const departmentIdPosition =
        values.length;

    values.push(schoolId);

    const schoolIdPosition =
        values.length;

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
 * Update Department Status
 */
async function updateDepartmentStatus(
    departmentId,
    schoolId,
    isActive
) {
    if (!departmentId) {
        throw new Error("Department ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

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
        Boolean(isActive),
        departmentId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
 * Delete Department
 */
async function deleteDepartment(
    departmentId,
    schoolId
) {
    if (!departmentId) {
        throw new Error("Department ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

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
 * Search Departments
 */
async function searchDepartments(
    searchTerm,
    schoolId
) {
    if (!schoolId) {
        return [];
    }

    const term =
        String(searchTerm || "").trim();

    const sql = `
        SELECT
            d.*,

            (
                SELECT COUNT(*)::INTEGER
                FROM staff st
                WHERE st.school_id = d.school_id
                  AND LOWER(TRIM(st.department)) =
                      LOWER(TRIM(d.department_name))
            ) AS staff_count,

            (
                SELECT COUNT(DISTINCT se.student_id)::INTEGER
                FROM student_enrollments se
                WHERE se.school_id = d.school_id
                  AND se.department_id = d.id
            ) AS student_count

        FROM departments d

        WHERE d.school_id = $1

          AND (
              d.department_name ILIKE $2
              OR d.department_code ILIKE $2
              OR d.description ILIKE $2
          )

        ORDER BY d.department_name ASC

        LIMIT 100
    `;

    const result = await query(sql, [
        schoolId,
        `%${term}%`
    ]);

    return result.rows;
}

/*
 * Count Departments
 */
async function countDepartments(
    schoolId,
    isActive = null
) {
    if (!schoolId) {
        return 0;
    }

    let sql = `
        SELECT COUNT(*) AS department_count

        FROM departments

        WHERE school_id = $1
    `;

    const values = [schoolId];

    if (
        isActive !== null &&
        isActive !== undefined
    ) {
        values.push(Boolean(isActive));

        sql += `
            AND is_active = $${values.length}
        `;
    }

    const result = await query(sql, values);

    return Number(
        result.rows[0]?.department_count || 0
    );
}

/*
 * Get Department Staff
 *
 * The current staff schema stores department
 * as text in staff.department.
 */
async function getDepartmentStaff(
    departmentId,
    schoolId
) {
    if (!departmentId || !schoolId) {
        return [];
    }

    const sql = `
        SELECT
            st.*,
            d.department_name

        FROM staff st

        INNER JOIN departments d
            ON d.school_id = st.school_id
           AND LOWER(TRIM(st.department)) =
               LOWER(TRIM(d.department_name))

        WHERE d.id = $1
          AND d.school_id = $2
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
 * Get Department Students
 *
 * Students are connected to departments through:
 * student_enrollments.department_id
 */
async function getDepartmentStudents(
    departmentId,
    schoolId
) {
    if (!departmentId || !schoolId) {
        return [];
    }

    const sql = `
        SELECT
            s.*,
            d.department_name,
            c.class_name,
            ca.arm_name,
            ses.session_name

        FROM student_enrollments se

        INNER JOIN students s
            ON s.id = se.student_id
           AND s.school_id = se.school_id

        INNER JOIN departments d
            ON d.id = se.department_id
           AND d.school_id = se.school_id

        LEFT JOIN classes c
            ON c.id = se.class_id
           AND c.school_id = se.school_id

        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id
           AND ca.school_id = se.school_id

        LEFT JOIN academic_sessions ses
            ON ses.id = se.academic_session_id
           AND ses.school_id = se.school_id

        WHERE se.department_id = $1
          AND se.school_id = $2

        ORDER BY
            s.last_name ASC,
            s.first_name ASC
    `;

    const result = await query(sql, [
        departmentId,
        schoolId
    ]);

    return result.rows;
}

/*
 * Get Department Summary
 */
async function getDepartmentSummary(
    schoolId
) {
    if (!schoolId) {
        return [];
    }

    const sql = `
        SELECT
            d.id,
            d.department_name,
            d.department_code,
            d.description,
            d.is_active,

            (
                SELECT COUNT(*)::INTEGER
                FROM staff st
                WHERE st.school_id = d.school_id
                  AND LOWER(TRIM(st.department)) =
                      LOWER(TRIM(d.department_name))
            ) AS staff_count,

            (
                SELECT COUNT(DISTINCT se.student_id)::INTEGER
                FROM student_enrollments se
                WHERE se.school_id = d.school_id
                  AND se.department_id = d.id
            ) AS student_count

        FROM departments d

        WHERE d.school_id = $1

        ORDER BY d.department_name ASC
    `;

    const result = await query(sql, [
        schoolId
    ]);

    return result.rows;
}

/*
 * Export Department Model
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
    getDepartmentStudents,
    getDepartmentSummary
};