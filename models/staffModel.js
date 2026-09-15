"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| STAFF MODEL
|--------------------------------------------------------------------------
|
| Database table:
| staff
|
| Current staff columns:
| id
| school_id
| user_id
| staff_number
| first_name
| middle_name
| last_name
| email
| phone
| position
| department
| employment_date
| profile_photo_url
| status
| created_at
| updated_at
|
| This model provides the stable database layer for the Staff module.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Create Staff
|--------------------------------------------------------------------------
*/

async function createStaff({
    schoolId,
    userId = null,
    staffNumber,
    firstName,
    middleName = null,
    lastName,
    email = null,
    phone = null,
    position = null,
    department = null,
    employmentDate = null,
    profilePhotoUrl = null,
    status = "Active"
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!staffNumber || !String(staffNumber).trim()) {
        throw new Error("Staff number is required.");
    }

    if (!firstName || !String(firstName).trim()) {
        throw new Error("First name is required.");
    }

    if (!lastName || !String(lastName).trim()) {
        throw new Error("Last name is required.");
    }

    const sql = `
        INSERT INTO staff (
            school_id,
            user_id,
            staff_number,
            first_name,
            middle_name,
            last_name,
            email,
            phone,
            position,
            department,
            employment_date,
            profile_photo_url,
            status
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13
        )
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        userId,
        String(staffNumber).trim(),
        String(firstName).trim(),
        middleName ? String(middleName).trim() : null,
        String(lastName).trim(),
        email ? String(email).trim() : null,
        phone ? String(phone).trim() : null,
        position ? String(position).trim() : null,
        department ? String(department).trim() : null,
        employmentDate || null,
        profilePhotoUrl || null,
        status ? String(status).trim() : "Active"
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Find Staff By ID
|--------------------------------------------------------------------------
*/

async function findStaffById(staffId, schoolId = null) {
    if (!staffId) {
        return null;
    }

    let sql = `
        SELECT
            st.*,
            s.school_name
        FROM staff st
        LEFT JOIN schools s
            ON s.id = st.school_id
        WHERE st.id = $1
    `;

    const values = [staffId];

    if (schoolId) {
        values.push(schoolId);

        sql += `
            AND st.school_id = $${values.length}
        `;
    }

    sql += `
        LIMIT 1
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Find Staff By Staff Number
|--------------------------------------------------------------------------
*/

async function findStaffByNumber(staffNumber, schoolId = null) {
    if (!staffNumber) {
        return null;
    }

    let sql = `
        SELECT
            st.*,
            s.school_name
        FROM staff st
        LEFT JOIN schools s
            ON s.id = st.school_id
        WHERE st.staff_number = $1
    `;

    const values = [String(staffNumber).trim()];

    if (schoolId) {
        values.push(schoolId);

        sql += `
            AND st.school_id = $${values.length}
        `;
    }

    sql += `
        LIMIT 1
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Find Staff
|--------------------------------------------------------------------------
*/

async function findStaff({
    schoolId,
    department = null,
    status = null,
    limit = 100,
    offset = 0
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            st.*,
            s.school_name
        FROM staff st
        LEFT JOIN schools s
            ON s.id = st.school_id
        WHERE st.school_id = $1
    `;

    const values = [schoolId];

    if (department && String(department).trim()) {
        values.push(String(department).trim());

        sql += `
            AND st.department = $${values.length}
        `;
    }

    if (status && String(status).trim()) {
        values.push(String(status).trim());

        sql += `
            AND st.status = $${values.length}
        `;
    }

    const safeLimit = Math.min(
        Math.max(Number(limit) || 100, 1),
        100
    );

    const safeOffset = Math.max(
        Number(offset) || 0,
        0
    );

    values.push(safeLimit);

    sql += `
        ORDER BY
            st.last_name ASC,
            st.first_name ASC,
            st.id ASC
        LIMIT $${values.length}
    `;

    values.push(safeOffset);

    sql += `
        OFFSET $${values.length}
    `;

    const result = await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Search Staff
|--------------------------------------------------------------------------
*/

async function searchStaff(searchTerm, schoolId) {
    if (!schoolId || !searchTerm) {
        return [];
    }

    const cleanedSearchTerm = String(searchTerm).trim();

    if (!cleanedSearchTerm) {
        return [];
    }

    const sql = `
        SELECT
            st.*,
            s.school_name
        FROM staff st
        LEFT JOIN schools s
            ON s.id = st.school_id
        WHERE st.school_id = $1
          AND (
              st.staff_number ILIKE $2
              OR st.first_name ILIKE $2
              OR st.middle_name ILIKE $2
              OR st.last_name ILIKE $2
              OR st.email ILIKE $2
              OR st.phone ILIKE $2
              OR st.position ILIKE $2
              OR st.department ILIKE $2
          )
        ORDER BY
            st.last_name ASC,
            st.first_name ASC,
            st.id ASC
        LIMIT 100
    `;

    const result = await query(sql, [
        schoolId,
        `%${cleanedSearchTerm}%`
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Update Staff
|--------------------------------------------------------------------------
*/

async function updateStaff(staffId, schoolId, data) {
    if (!staffId) {
        throw new Error("Staff ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const allowedFields = {
        userId: "user_id",
        staffNumber: "staff_number",
        firstName: "first_name",
        middleName: "middle_name",
        lastName: "last_name",
        email: "email",
        phone: "phone",
        position: "position",
        department: "department",
        employmentDate: "employment_date",
        profilePhotoUrl: "profile_photo_url",
        status: "status"
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
                [
                    "staffNumber",
                    "firstName",
                    "middleName",
                    "lastName",
                    "email",
                    "phone",
                    "position",
                    "department",
                    "status"
                ].includes(key)
            ) {
                if (value === null || value === "") {
                    value = null;
                } else if (typeof value === "string") {
                    value = value.trim();
                }
            }

            if (key === "employmentDate" && value === "") {
                value = null;
            }

            if (key === "profilePhotoUrl" && value === "") {
                value = null;
            }

            values.push(value);

            updates.push(
                `${allowedFields[key]} = $${values.length}`
            );
        }
    }

    if (updates.length === 0) {
        throw new Error("No valid fields supplied for update.");
    }

    values.push(staffId);
    const staffIdPosition = values.length;

    values.push(schoolId);
    const schoolIdPosition = values.length;

    const sql = `
        UPDATE staff
        SET
            ${updates.join(", ")},
            updated_at = NOW()
        WHERE id = $${staffIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Delete Staff
|--------------------------------------------------------------------------
*/

async function deleteStaff(staffId, schoolId) {
    if (!staffId) {
        throw new Error("Staff ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        DELETE FROM staff
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        staffId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Count Staff
|--------------------------------------------------------------------------
*/

async function countStaff(schoolId, status = null) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            COUNT(*)::INTEGER AS staff_count
        FROM staff
        WHERE school_id = $1
    `;

    const values = [schoolId];

    if (status && String(status).trim()) {
        values.push(String(status).trim());

        sql += `
            AND status = $${values.length}
        `;
    }

    const result = await query(sql, values);

    return Number(
        result.rows[0]?.staff_count || 0
    );
}

/*
|--------------------------------------------------------------------------
| Staff Statistics
|--------------------------------------------------------------------------
*/

async function getStaffStatistics(schoolId) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT
            COUNT(*)::INTEGER AS total_staff,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(status, '')) = 'active'
            )::INTEGER AS active_staff,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(status, '')) = 'inactive'
            )::INTEGER AS inactive_staff,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(status, '')) = 'suspended'
            )::INTEGER AS suspended_staff,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(status, '')) = 'resigned'
            )::INTEGER AS resigned_staff

        FROM staff
        WHERE school_id = $1
    `;

    const result = await query(sql, [schoolId]);

    const row = result.rows[0] || {};

    return {
        totalStaff: Number(row.total_staff || 0),
        activeStaff: Number(row.active_staff || 0),
        inactiveStaff: Number(row.inactive_staff || 0),
        suspendedStaff: Number(row.suspended_staff || 0),
        resignedStaff: Number(row.resigned_staff || 0)
    };
}

/*
|--------------------------------------------------------------------------
| Get Staff By Department
|--------------------------------------------------------------------------
*/

async function getStaffByDepartment(schoolId, department) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!department || !String(department).trim()) {
        return [];
    }

    const sql = `
        SELECT
            st.*,
            s.school_name
        FROM staff st
        LEFT JOIN schools s
            ON s.id = st.school_id
        WHERE st.school_id = $1
          AND st.department = $2
        ORDER BY
            st.last_name ASC,
            st.first_name ASC,
            st.id ASC
    `;

    const result = await query(sql, [
        schoolId,
        String(department).trim()
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Check Staff Number
|--------------------------------------------------------------------------
*/

async function staffNumberExists(
    staffNumber,
    schoolId,
    excludeStaffId = null
) {
    if (!staffNumber || !schoolId) {
        return false;
    }

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM staff
            WHERE staff_number = $1
              AND school_id = $2
    `;

    const values = [
        String(staffNumber).trim(),
        schoolId
    ];

    if (excludeStaffId) {
        values.push(excludeStaffId);

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
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    createStaff,
    findStaffById,
    findStaffByNumber,
    findStaff,
    searchStaff,
    updateStaff,
    deleteStaff,
    countStaff,
    getStaffStatistics,
    getStaffByDepartment,
    staffNumberExists
};