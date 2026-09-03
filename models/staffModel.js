"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Staff Model
|--------------------------------------------------------------------------
| Compatible with the current PostgreSQL staff schema.
|--------------------------------------------------------------------------
|
| staff columns:
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

    if (!staffNumber || !staffNumber.trim()) {
        throw new Error("Staff number is required.");
    }

    if (!firstName || !firstName.trim()) {
        throw new Error("First name is required.");
    }

    if (!lastName || !lastName.trim()) {
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
        staffNumber.trim(),
        firstName.trim(),
        middleName,
        lastName.trim(),
        email,
        phone,
        position,
        department,
        employmentDate,
        profilePhotoUrl,
        status
    ]);

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Find Staff By ID
|--------------------------------------------------------------------------
*/

async function findStaffById(
    staffId,
    schoolId = null
) {
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

async function findStaffByNumber(
    staffNumber,
    schoolId = null
) {
    let sql = `
        SELECT *
        FROM staff
        WHERE staff_number = $1
    `;

    const values = [staffNumber];

    if (schoolId) {
        values.push(schoolId);

        sql += `
            AND school_id = $${values.length}
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

    if (department) {
        values.push(department);

        sql += `
            AND st.department = $${values.length}
        `;
    }

    if (status) {
        values.push(status);

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
            st.first_name ASC
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

async function searchStaff(
    searchTerm,
    schoolId
) {
    if (!schoolId || !searchTerm) {
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
            st.first_name ASC
        LIMIT 100
    `;

    const result = await query(sql, [
        schoolId,
        `%${searchTerm.trim()}%`
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Update Staff
|--------------------------------------------------------------------------
*/

async function updateStaff(
    staffId,
    schoolId,
    data
) {
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
                    "lastName"
                ].includes(key) &&
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

async function deleteStaff(
    staffId,
    schoolId
) {
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

async function countStaff(
    schoolId,
    status = null
) {
    let sql = `
        SELECT COUNT(*)::INTEGER AS staff_count
        FROM staff
        WHERE school_id = $1
    `;

    const values = [schoolId];

    if (status) {
        values.push(status);

        sql += `
            AND status = $${values.length}
        `;
    }

    const result = await query(sql, values);

    return Number(
        result.rows[0].staff_count
    );
}

/*
|--------------------------------------------------------------------------
| Staff Statistics
|--------------------------------------------------------------------------
*/

async function getStaffStatistics(
    schoolId
) {
    const sql = `
        SELECT
            COUNT(*)::INTEGER AS total_staff,

            COUNT(*) FILTER (
                WHERE LOWER(status) = 'active'
            )::INTEGER AS active_staff,

            COUNT(*) FILTER (
                WHERE LOWER(status) = 'inactive'
            )::INTEGER AS inactive_staff,

            COUNT(*) FILTER (
                WHERE LOWER(status) = 'suspended'
            )::INTEGER AS suspended_staff,

            COUNT(*) FILTER (
                WHERE LOWER(status) = 'resigned'
            )::INTEGER AS resigned_staff

        FROM staff
        WHERE school_id = $1
    `;

    const result = await query(sql, [schoolId]);

    const row = result.rows[0];

    return {
        totalStaff: Number(row.total_staff),
        activeStaff: Number(row.active_staff),
        inactiveStaff: Number(row.inactive_staff),
        suspendedStaff: Number(row.suspended_staff),
        resignedStaff: Number(row.resigned_staff)
    };
}

/*
|--------------------------------------------------------------------------
| Get Staff By Department
|--------------------------------------------------------------------------
*/

async function getStaffByDepartment(
    schoolId,
    department
) {
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
            st.first_name ASC
    `;

    const result = await query(sql, [
        schoolId,
        department
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
    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM staff
            WHERE staff_number = $1
              AND school_id = $2
    `;

    const values = [
        staffNumber,
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

    return result.rows[0].exists;
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