"use strict";

const { query } = require("../config/database");


/*
|--------------------------------------------------------------------------
| School Model
|--------------------------------------------------------------------------
|
| Handles school information.
|
| This model is written to match the current database/schema.sql.
|
| schools columns:
|
| id
| school_name
| school_code
| registration_number
| address
| city
| state
| country
| phone
| email
| website
| logo_url
| motto
| principal_name
| school_type
| status
| created_at
| updated_at
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CREATE SCHOOL
|--------------------------------------------------------------------------
*/

async function createSchool({
    schoolCode,
    schoolName,
    registrationNumber = null,
    address = null,
    city = null,
    state = null,
    country = "Nigeria",
    phone = null,
    email = null,
    website = null,
    logoUrl = null,
    motto = null,
    principalName = null,
    schoolType = "Secondary School",
    status = "Active"
}) {

    if (
        !schoolCode ||
        typeof schoolCode !== "string" ||
        !schoolCode.trim()
    ) {
        throw new Error(
            "School code is required."
        );
    }


    if (
        !schoolName ||
        typeof schoolName !== "string" ||
        !schoolName.trim()
    ) {
        throw new Error(
            "School name is required."
        );
    }


    const sql = `
        INSERT INTO schools (

            school_code,

            school_name,

            registration_number,

            address,

            city,

            state,

            country,

            phone,

            email,

            website,

            logo_url,

            motto,

            principal_name,

            school_type,

            status

        )

        VALUES (

            $1,

            $2,

            $3,

            $4,

            $5,

            $6,

            $7,

            $8,

            $9,

            $10,

            $11,

            $12,

            $13,

            $14,

            $15

        )

        RETURNING *
    `;


    const result = await query(
        sql,
        [

            schoolCode.trim(),

            schoolName.trim(),

            registrationNumber,

            address,

            city,

            state,

            country,

            phone,

            email,

            website,

            logoUrl,

            motto,

            principalName,

            schoolType,

            status

        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| FIND SCHOOL BY ID
|--------------------------------------------------------------------------
*/

async function findSchoolById(
    schoolId
) {

    const sql = `
        SELECT *

        FROM schools

        WHERE id = $1

        LIMIT 1
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| FIND SCHOOL BY CODE
|--------------------------------------------------------------------------
*/

async function findSchoolByCode(
    schoolCode
) {

    const sql = `
        SELECT *

        FROM schools

        WHERE school_code = $1

        LIMIT 1
    `;


    const result = await query(
        sql,
        [
            schoolCode
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| FIND SCHOOLS
|--------------------------------------------------------------------------
*/

async function findSchools({
    status = null,
    state = null,
    schoolType = null,
    limit = 100,
    offset = 0
} = {}) {

    let sql = `
        SELECT *

        FROM schools

        WHERE 1 = 1
    `;


    const values = [];


    /*
    |--------------------------------------------------------------------------
    | STATUS FILTER
    |--------------------------------------------------------------------------
    */

    if (status) {

        values.push(status);

        sql += `
            AND status = $${values.length}
        `;
    }


    /*
    |--------------------------------------------------------------------------
    | STATE FILTER
    |--------------------------------------------------------------------------
    */

    if (state) {

        values.push(state);

        sql += `
            AND state = $${values.length}
        `;
    }


    /*
    |--------------------------------------------------------------------------
    | SCHOOL TYPE FILTER
    |--------------------------------------------------------------------------
    */

    if (schoolType) {

        values.push(schoolType);

        sql += `
            AND school_type = $${values.length}
        `;
    }


    /*
    |--------------------------------------------------------------------------
    | LIMIT
    |--------------------------------------------------------------------------
    */

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 100,
                1
            ),
            100
        );


    const safeOffset =
        Math.max(
            Number(offset) || 0,
            0
        );


    values.push(
        safeLimit
    );


    sql += `
        ORDER BY

            school_name ASC

        LIMIT $${values.length}
    `;


    values.push(
        safeOffset
    );


    sql += `
        OFFSET $${values.length}
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| SEARCH SCHOOLS
|--------------------------------------------------------------------------
|
| Searches fields that actually exist in schools.
|--------------------------------------------------------------------------
*/

async function searchSchools(
    searchTerm
) {

    if (
        !searchTerm ||
        typeof searchTerm !== "string"
    ) {

        return [];
    }


    const sql = `
        SELECT *

        FROM schools

        WHERE

            school_code ILIKE $1

            OR school_name ILIKE $1

            OR registration_number ILIKE $1

            OR city ILIKE $1

            OR state ILIKE $1

            OR principal_name ILIKE $1

        ORDER BY

            school_name ASC

        LIMIT 100
    `;


    const result = await query(
        sql,
        [
            `%${searchTerm.trim()}%`
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| UPDATE SCHOOL
|--------------------------------------------------------------------------
*/

async function updateSchool(
    schoolId,
    data
) {

    const allowedFields = {

        schoolCode:
            "school_code",

        schoolName:
            "school_name",

        registrationNumber:
            "registration_number",

        address:
            "address",

        city:
            "city",

        state:
            "state",

        country:
            "country",

        phone:
            "phone",

        email:
            "email",

        website:
            "website",

        logoUrl:
            "logo_url",

        motto:
            "motto",

        principalName:
            "principal_name",

        schoolType:
            "school_type",

        status:
            "status"

    };


    const updates = [];

    const values = [];


    for (
        const key of Object.keys(data || {})
    ) {

        if (
            allowedFields[key] &&
            data[key] !== undefined
        ) {

            values.push(
                data[key]
            );


            updates.push(
                `${allowedFields[key]} = $${values.length}`
            );
        }
    }


    if (
        updates.length === 0
    ) {

        throw new Error(
            "No valid fields supplied for update."
        );
    }


    values.push(
        schoolId
    );


    const schoolIdPosition =
        values.length;


    const sql = `
        UPDATE schools

        SET

            ${updates.join(", ")},

            updated_at = NOW()

        WHERE id = $${schoolIdPosition}

        RETURNING *
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| DELETE SCHOOL
|--------------------------------------------------------------------------
*/

async function deleteSchool(
    schoolId
) {

    const sql = `
        DELETE FROM schools

        WHERE id = $1

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| COUNT SCHOOLS
|--------------------------------------------------------------------------
*/

async function countSchools(
    status = null
) {

    let sql = `
        SELECT

            COUNT(*) AS school_count

        FROM schools
    `;


    const values = [];


    if (status) {

        values.push(
            status
        );


        sql += `
            WHERE status = $${values.length}
        `;
    }


    const result = await query(
        sql,
        values
    );


    return Number(
        result.rows[0].school_count
    );
}


/*
|--------------------------------------------------------------------------
| CHECK SCHOOL CODE
|--------------------------------------------------------------------------
*/

async function schoolCodeExists(
    schoolCode,
    excludeSchoolId = null
) {

    let sql = `
        SELECT EXISTS (

            SELECT 1

            FROM schools

            WHERE school_code = $1
    `;


    const values = [
        schoolCode
    ];


    if (excludeSchoolId) {

        values.push(
            excludeSchoolId
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


    return result.rows[0].exists;
}


/*
|--------------------------------------------------------------------------
| GET SCHOOL STATISTICS
|--------------------------------------------------------------------------
*/

async function getSchoolStatistics(
    schoolId
) {

    const sql = `
        SELECT

            (
                SELECT COUNT(*)

                FROM students

                WHERE school_id = $1
            )::INTEGER
                AS total_students,


            (
                SELECT COUNT(*)

                FROM staff

                WHERE school_id = $1
            )::INTEGER
                AS total_staff,


            (
                SELECT COUNT(*)

                FROM classes

                WHERE school_id = $1
            )::INTEGER
                AS total_classes,


            (
                SELECT COUNT(*)

                FROM subjects

                WHERE school_id = $1
            )::INTEGER
                AS total_subjects,


            (
                SELECT COUNT(*)

                FROM users

                WHERE school_id = $1
            )::INTEGER
                AS total_users
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


    const row =
        result.rows[0];


    return {

        totalStudents:
            Number(
                row.total_students
            ),

        totalStaff:
            Number(
                row.total_staff
            ),

        totalClasses:
            Number(
                row.total_classes
            ),

        totalSubjects:
            Number(
                row.total_subjects
            ),

        totalUsers:
            Number(
                row.total_users
            )

    };
}


/*
|--------------------------------------------------------------------------
| GET SCHOOL DASHBOARD
|--------------------------------------------------------------------------
*/

async function getSchoolDashboard(
    schoolId
) {

    const sql = `
        SELECT

            (
                SELECT COUNT(*)

                FROM students

                WHERE school_id = $1

                  AND status = 'Active'
            )::INTEGER
                AS active_students,


            (
                SELECT COUNT(*)

                FROM staff

                WHERE school_id = $1

                  AND status = 'Active'
            )::INTEGER
                AS active_staff,


            (
                SELECT COUNT(*)

                FROM classes

                WHERE school_id = $1

                  AND status = 'Active'
            )::INTEGER
                AS active_classes,


            (
                SELECT COUNT(*)

                FROM subjects

                WHERE school_id = $1

                  AND is_active = TRUE
            )::INTEGER
                AS active_subjects,


            (
                SELECT COALESCE(
                    SUM(amount),
                    0
                )

                FROM payments

                WHERE school_id = $1
            ) AS total_payments
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


    const row =
        result.rows[0];


    return {

        activeStudents:
            Number(
                row.active_students
            ),

        activeStaff:
            Number(
                row.active_staff
            ),

        activeClasses:
            Number(
                row.active_classes
            ),

        activeSubjects:
            Number(
                row.active_subjects
            ),

        totalPayments:
            Number(
                row.total_payments
            )

    };
}


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {

    createSchool,

    findSchoolById,

    findSchoolByCode,

    findSchools,

    searchSchools,

    updateSchool,

    deleteSchool,

    countSchools,

    schoolCodeExists,

    getSchoolStatistics,

    getSchoolDashboard

};
