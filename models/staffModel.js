"use strict";

const { query } = require("../config/database");

/*
------------------------------------------------------------------------------
STAFF MODEL
--------------------------------------------------------------------------

This model handles database operations for the Staff module.

IMPORTANT DATABASE DESIGN
-------------------------
The live PostgreSQL staff table stores the department as TEXT:

staff.department

The departments table stores:

departments.id
departments.department_name

Therefore, when the controller supplies departmentId, this model
resolves the department record and stores department_name in staff.department.

When staff records are read, the model joins departments using:

school_id
department_name = staff.department

This allows the frontend/controller to continue working with departmentId
while respecting the actual PostgreSQL schema.
--------------------------------------------------------------------------
*/

/*
--------------------------------------------------------------------------
COMMON STAFF SELECT
--------------------------------------------------------------------------
*/

const STAFF_SELECT = [
"st.id",
"st.school_id",
"st.user_id",
"st.staff_number",
"st.first_name",
"st.middle_name",
"st.last_name",
"st.email",
"st.phone",
"st.position",
"st.department",
"d.id AS department_id",
"d.department_name",
"st.employment_date",
"st.profile_photo_url",
"st.status",
"st.created_at",
"st.updated_at",
"st.gender",
"st.date_of_birth",
"st.employment_type",
"st.qualification",
"st.address",
"st.notes"
].join(",\n        ");

/*
--------------------------------------------------------------------------
NORMALIZE EMPTY VALUES
--------------------------------------------------------------------------
*/

function normalizeNullable(value) {
if (value === undefined || value === null) {
return null;
}

if (typeof value === "string") {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
}

return value;

}

/*
--------------------------------------------------------------------------
RESOLVE DEPARTMENT NAME
--------------------------------------------------------------------------

Converts departmentId into the department_name stored by the staff table.
--------------------------------------------------------------------------
*/

async function resolveDepartmentName(departmentId, schoolId) {
if (!departmentId || !schoolId) {
return null;
}

const result = await query(
    [
        "SELECT department_name",
        "FROM departments",
        "WHERE id = $1",
        "AND school_id = $2",
        "LIMIT 1"
    ].join(" "),
    [departmentId, schoolId]
);

if (result.rows.length === 0) {
    throw new Error("Selected department was not found for this school.");
}

return result.rows[0].department_name;

}

/*
--------------------------------------------------------------------------
CREATE STAFF
--------------------------------------------------------------------------
*/

async function createStaff(data = {}) {
const schoolId = normalizeNullable(data.schoolId);

if (!schoolId) {
    throw new Error("School ID is required.");
}

const department = await resolveDepartmentName(
    data.departmentId,
    schoolId
);

const staffNumber = normalizeNullable(data.staffNumber);
const firstName = normalizeNullable(data.firstName);
const lastName = normalizeNullable(data.lastName);
const middleName = normalizeNullable(data.middleName);
const gender = normalizeNullable(data.gender);
const dateOfBirth = normalizeNullable(data.dateOfBirth);
const phone = normalizeNullable(data.phone);
const email = normalizeNullable(data.email);
const address = normalizeNullable(data.address);
const position = normalizeNullable(data.position);
const employmentType = normalizeNullable(data.employmentType);
const employmentDate = normalizeNullable(data.employmentDate);
const qualification = normalizeNullable(data.qualification);
const status = normalizeNullable(data.status) || "Active";
const notes = normalizeNullable(data.notes);
const userId = normalizeNullable(data.userId);
const profilePhotoUrl = normalizeNullable(data.profilePhotoUrl);

const result = await query(
    [
        "INSERT INTO staff (",
        "school_id,",
        "user_id,",
        "staff_number,",
        "first_name,",
        "middle_name,",
        "last_name,",
        "email,",
        "phone,",
        "position,",
        "department,",
        "employment_date,",
        "profile_photo_url,",
        "status,",
        "gender,",
        "date_of_birth,",
        "employment_type,",
        "qualification,",
        "address,",
        "notes",
        ")",
        "VALUES (",
        "$1, $2, $3, $4, $5, $6, $7, $8, $9, $10,",
        "$11, $12, $13, $14, $15, $16, $17, $18, $19",
        ")",
        "RETURNING id"
    ].join(" "),
    [
        schoolId,
        userId,
        staffNumber,
        firstName,
        middleName,
        lastName,
        email,
        phone,
        position,
        department,
        employmentDate,
        profilePhotoUrl,
        status,
        gender,
        dateOfBirth,
        employmentType,
        qualification,
        address,
        notes
    ]
);

if (result.rows.length === 0) {
    throw new Error("Staff record could not be created.");
}

return findStaffById(result.rows[0].id, schoolId);

}

/*
--------------------------------------------------------------------------
FIND ALL STAFF
--------------------------------------------------------------------------
*/

async function findStaff(options = {}) {
const schoolId = normalizeNullable(options.schoolId);

if (!schoolId) {
    return [];
}

const departmentId = normalizeNullable(options.departmentId);
const status = normalizeNullable(options.status);

const conditions = [
    "st.school_id = $1"
];

const values = [schoolId];

if (departmentId) {
    values.push(departmentId);
    conditions.push("d.id = $" + values.length);
}

if (status) {
    values.push(status);
    conditions.push("st.status = $" + values.length);
}

const sql = [
    "SELECT",
    "        " + STAFF_SELECT,
    "FROM staff st",
    "LEFT JOIN departments d",
    "       ON d.school_id = st.school_id",
    "      AND LOWER(TRIM(d.department_name)) = LOWER(TRIM(st.department))",
    "WHERE " + conditions.join("\n  AND "),
    "ORDER BY st.first_name ASC, st.last_name ASC"
].join("\n");

const result = await query(sql, values);

return result.rows;

}

/*
--------------------------------------------------------------------------
FIND STAFF BY ID
--------------------------------------------------------------------------
*/

async function findStaffById(staffId, schoolId = null) {
if (!staffId) {
return null;
}

const conditions = [
    "st.id = $1"
];

const values = [staffId];

if (schoolId) {
    values.push(schoolId);
    conditions.push("st.school_id = $" + values.length);
}

const sql = [
    "SELECT",
    "        " + STAFF_SELECT,
    "FROM staff st",
    "LEFT JOIN departments d",
    "       ON d.school_id = st.school_id",
    "      AND LOWER(TRIM(d.department_name)) = LOWER(TRIM(st.department))",
    "WHERE " + conditions.join("\n  AND "),
    "LIMIT 1"
].join("\n");

const result = await query(sql, values);

return result.rows.length > 0 ? result.rows[0] : null;

}

/*
--------------------------------------------------------------------------
FIND STAFF BY STAFF NUMBER
--------------------------------------------------------------------------
*/

async function findStaffByNumber(staffNumber, schoolId = null) {
if (!staffNumber) {
return null;
}

const conditions = [
    "LOWER(TRIM(st.staff_number)) = LOWER(TRIM($1))"
];

const values = [staffNumber];

if (schoolId) {
    values.push(schoolId);
    conditions.push("st.school_id = $" + values.length);
}

const sql = [
    "SELECT",
    "        " + STAFF_SELECT,
    "FROM staff st",
    "LEFT JOIN departments d",
    "       ON d.school_id = st.school_id",
    "      AND LOWER(TRIM(d.department_name)) = LOWER(TRIM(st.department))",
    "WHERE " + conditions.join("\n  AND "),
    "LIMIT 1"
].join("\n");

const result = await query(sql, values);

return result.rows.length > 0 ? result.rows[0] : null;

}

/*
--------------------------------------------------------------------------
SEARCH STAFF
--------------------------------------------------------------------------
*/

async function searchStaff(searchTerm, schoolId) {
if (!schoolId || !searchTerm) {
return [];
}

const term = "%" + String(searchTerm).trim() + "%";

const sql = [
    "SELECT",
    "        " + STAFF_SELECT,
    "FROM staff st",
    "LEFT JOIN departments d",
    "       ON d.school_id = st.school_id",
    "      AND LOWER(TRIM(d.department_name)) = LOWER(TRIM(st.department))",
    "WHERE st.school_id = $1",
    "AND (",
    "       st.staff_number ILIKE $2",
    "    OR st.first_name ILIKE $2",
    "    OR st.middle_name ILIKE $2",
    "    OR st.last_name ILIKE $2",
    "    OR st.email ILIKE $2",
    "    OR st.phone ILIKE $2",
    "    OR st.position ILIKE $2",
    "    OR st.department ILIKE $2",
    "    OR CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) ILIKE $2",
    ")",
    "ORDER BY st.first_name ASC, st.last_name ASC"
].join("\n");

const result = await query(sql, [
    schoolId,
    term
]);

return result.rows;

}

/*
--------------------------------------------------------------------------
UPDATE STAFF
--------------------------------------------------------------------------
*/

async function updateStaff(staffId, schoolId, data = {}) {
if (!staffId) {
throw new Error("Staff ID is required.");
}

if (!schoolId) {
    throw new Error("School ID is required.");
}

const existing = await findStaffById(staffId, schoolId);

if (!existing) {
    return null;
}

let department = existing.department;

if (data.departmentId !== undefined) {
    department = await resolveDepartmentName(
        data.departmentId,
        schoolId
    );
}

const staffNumber =
    data.staffNumber !== undefined
        ? normalizeNullable(data.staffNumber)
        : existing.staff_number;

const firstName =
    data.firstName !== undefined
        ? normalizeNullable(data.firstName)
        : existing.first_name;

const lastName =
    data.lastName !== undefined
        ? normalizeNullable(data.lastName)
        : existing.last_name;

const middleName =
    data.middleName !== undefined
        ? normalizeNullable(data.middleName)
        : existing.middle_name;

const gender =
    data.gender !== undefined
        ? normalizeNullable(data.gender)
        : existing.gender;

const dateOfBirth =
    data.dateOfBirth !== undefined
        ? normalizeNullable(data.dateOfBirth)
        : existing.date_of_birth;

const phone =
    data.phone !== undefined
        ? normalizeNullable(data.phone)
        : existing.phone;

const email =
    data.email !== undefined
        ? normalizeNullable(data.email)
        : existing.email;

const address =
    data.address !== undefined
        ? normalizeNullable(data.address)
        : existing.address;

const position =
    data.position !== undefined
        ? normalizeNullable(data.position)
        : existing.position;

const employmentType =
    data.employmentType !== undefined
        ? normalizeNullable(data.employmentType)
        : existing.employment_type;

const employmentDate =
    data.employmentDate !== undefined
        ? normalizeNullable(data.employmentDate)
        : existing.employment_date;

const qualification =
    data.qualification !== undefined
        ? normalizeNullable(data.qualification)
        : existing.qualification;

const status =
    data.status !== undefined
        ? normalizeNullable(data.status)
        : existing.status;

const notes =
    data.notes !== undefined
        ? normalizeNullable(data.notes)
        : existing.notes;

const profilePhotoUrl =
    data.profilePhotoUrl !== undefined
        ? normalizeNullable(data.profilePhotoUrl)
        : existing.profile_photo_url;

const userId =
    data.userId !== undefined
        ? normalizeNullable(data.userId)
        : existing.user_id;

const sql = [
    "UPDATE staff",
    "SET",
    "staff_number = $1,",
    "first_name = $2,",
    "middle_name = $3,",
    "last_name = $4,",
    "email = $5,",
    "phone = $6,",
    "position = $7,",
    "department = $8,",
    "employment_date = $9,",
    "profile_photo_url = $10,",
    "status = $11,",
    "gender = $12,",
    "date_of_birth = $13,",
    "employment_type = $14,",
    "qualification = $15,",
    "address = $16,",
    "notes = $17,",
    "user_id = $18,",
    "updated_at = CURRENT_TIMESTAMP",
    "WHERE id = $19",
    "AND school_id = $20",
    "RETURNING id"
].join("\n");

const result = await query(sql, [
    staffNumber,
    firstName,
    middleName,
    lastName,
    email,
    phone,
    position,
    department,
    employmentDate,
    profilePhotoUrl,
    status,
    gender,
    dateOfBirth,
    employmentType,
    qualification,
    address,
    notes,
    userId,
    staffId,
    schoolId
]);

if (result.rows.length === 0) {
    return null;
}

return findStaffById(staffId, schoolId);

}

/*
--------------------------------------------------------------------------
DELETE STAFF
--------------------------------------------------------------------------
*/

async function deleteStaff(staffId, schoolId) {
if (!staffId) {
throw new Error("Staff ID is required.");
}

if (!schoolId) {
    throw new Error("School ID is required.");
}

const result = await query(
    [
        "DELETE FROM staff",
        "WHERE id = $1",
        "AND school_id = $2",
        "RETURNING id, staff_number, first_name, middle_name, last_name"
    ].join(" "),
    [
        staffId,
        schoolId
    ]
);

return result.rows.length > 0 ? result.rows[0] : null;

}

/*
--------------------------------------------------------------------------
COUNT STAFF
--------------------------------------------------------------------------
*/

async function countStaff(schoolId, filters = {}) {
if (!schoolId) {
return 0;
}

const conditions = [
    "st.school_id = $1"
];

const values = [schoolId];

if (filters.departmentId) {
    values.push(filters.departmentId);
    conditions.push("d.id = $" + values.length);
}

if (filters.status) {
    values.push(filters.status);
    conditions.push("st.status = $" + values.length);
}

const sql = [
    "SELECT COUNT(*)::int AS count",
    "FROM staff st",
    "LEFT JOIN departments d",
    "       ON d.school_id = st.school_id",
    "      AND LOWER(TRIM(d.department_name)) = LOWER(TRIM(st.department))",
    "WHERE " + conditions.join("\n  AND ")
].join("\n");

const result = await query(sql, values);

return Number(result.rows[0]?.count || 0);

}

/*
--------------------------------------------------------------------------
STAFF STATISTICS
--------------------------------------------------------------------------

Returns the values required by the Staff dashboard summary:

total       = all staff
active      = staff with Active status
teachers    = positions containing teacher or teaching
departments = distinct non-empty department names represented by staff
--------------------------------------------------------------------------
*/

async function getStaffStatistics(schoolId) {
if (!schoolId) {
return {
total: 0,
active: 0,
teachers: 0,
departments: 0
};
}

const sql = [
    "SELECT",
    "COUNT(*)::int AS total,",
    "COUNT(*) FILTER (WHERE st.status = 'Active')::int AS active,",
    "COUNT(*) FILTER (",
    "    WHERE LOWER(COALESCE(st.position, '')) LIKE '%teacher%'",
    "       OR LOWER(COALESCE(st.position, '')) LIKE '%teaching%'",
    ")::int AS teachers,",
    "COUNT(DISTINCT NULLIF(LOWER(TRIM(st.department)), ''))::int AS departments",
    "FROM staff st",
    "WHERE st.school_id = $1"
].join("\n");

const result = await query(sql, [schoolId]);

const row = result.rows[0] || {};

return {
    total: Number(row.total || 0),
    active: Number(row.active || 0),
    teachers: Number(row.teachers || 0),
    departments: Number(row.departments || 0)
};

}

/*
--------------------------------------------------------------------------
FIND STAFF BY DEPARTMENT
--------------------------------------------------------------------------
*/

async function getStaffByDepartment(departmentId, schoolId) {
if (!departmentId || !schoolId) {
return [];
}

const sql = [
    "SELECT",
    "        " + STAFF_SELECT,
    "FROM staff st",
    "INNER JOIN departments d",
    "        ON d.school_id = st.school_id",
    "       AND LOWER(TRIM(d.department_name)) = LOWER(TRIM(st.department))",
    "WHERE d.id = $1",
    "AND st.school_id = $2",
    "ORDER BY st.first_name ASC, st.last_name ASC"
].join("\n");

const result = await query(sql, [
    departmentId,
    schoolId
]);

return result.rows;

}

/*
--------------------------------------------------------------------------
CHECK STAFF NUMBER
--------------------------------------------------------------------------
*/

async function staffNumberExists(staffNumber, schoolId, excludeStaffId = null) {
if (!staffNumber || !schoolId) {
return false;
}

const conditions = [
    "school_id = $1",
    "LOWER(TRIM(staff_number)) = LOWER(TRIM($2))"
];

const values = [
    schoolId,
    staffNumber
];

if (excludeStaffId) {
    values.push(excludeStaffId);
    conditions.push("id <> $" + values.length);
}

const sql = [
    "SELECT 1",
    "FROM staff",
    "WHERE " + conditions.join("\n  AND "),
    "LIMIT 1"
].join("\n");

const result = await query(sql, values);

return result.rows.length > 0;

}

/*
--------------------------------------------------------------------------
EXPORTS
--------------------------------------------------------------------------
*/

module.exports = {
createStaff,
findStaff,
findStaffById,
findStaffByNumber,
searchStaff,
updateStaff,
deleteStaff,
countStaff,
getStaffStatistics,
getStaffByDepartment,
staffNumberExists
};
