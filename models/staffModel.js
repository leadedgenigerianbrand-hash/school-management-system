const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Staff Model
|--------------------------------------------------------------------------
|
| Handles teachers and other school staff.
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
    staffNumber,
    firstName,
    middleName = null,
    lastName,
    gender = null,
    dateOfBirth = null,
    phone = null,
    email = null,
    address = null,
    departmentId = null,
    designation = null,
    employmentDate = null,
    employmentType = null,
    qualification = null,
    specialization = null,
    status = "active"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!staffNumber) {
        throw new Error("Staff number is required.");
    }

    if (!firstName) {
        throw new Error("First name is required.");
    }

    if (!lastName) {
        throw new Error("Last name is required.");
    }


    const sql = `
        INSERT INTO staff (
            school_id,
            staff_number,
            first_name,
            middle_name,
            last_name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            department_id,
            designation,
            employment_date,
            employment_type,
            qualification,
            specialization,
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
            $15,
            $16,
            $17
        )
        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            staffNumber.trim(),
            firstName.trim(),
            middleName,
            lastName.trim(),
            gender,
            dateOfBirth,
            phone,
            email,
            address,
            departmentId,
            designation,
            employmentDate,
            employmentType,
            qualification,
            specialization,
            status
        ]
    );


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

            d.department_name

        FROM staff st

        LEFT JOIN departments d
            ON d.id = st.department_id

        WHERE st.id = $1
    `;


    const values = [
        staffId
    ];


    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND st.school_id = $${values.length}
        `;
    }


    sql += `
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


    const values = [
        staffNumber
    ];


    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND school_id = $${values.length}
        `;
    }


    sql += `
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
| List Staff
|--------------------------------------------------------------------------
*/

async function findStaff({
    schoolId,
    departmentId = null,
    status = null,
    limit = 100,
    offset = 0
}) {

    let sql = `
        SELECT

            st.*,

            d.department_name

        FROM staff st

        LEFT JOIN departments d
            ON d.id = st.department_id

        WHERE st.school_id = $1
    `;


    const values = [
        schoolId
    ];


    if (departmentId) {

        values.push(departmentId);

        sql += `
            AND st.department_id = $${values.length}
        `;
    }


    if (status) {

        values.push(status);

        sql += `
            AND st.status = $${values.length}
        `;
    }


    values.push(limit);

    sql += `
        ORDER BY

            st.last_name ASC,

            st.first_name ASC

        LIMIT $${values.length}
    `;


    values.push(offset);

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
| Search Staff
|--------------------------------------------------------------------------
*/

async function searchStaff(
    searchTerm,
    schoolId
) {

    const sql = `
        SELECT

            st.*,

            d.department_name

        FROM staff st

        LEFT JOIN departments d
            ON d.id = st.department_id

        WHERE st.school_id = $1

          AND (

              st.staff_number ILIKE $2

              OR st.first_name ILIKE $2

              OR st.middle_name ILIKE $2

              OR st.last_name ILIKE $2

              OR st.phone ILIKE $2

              OR st.email ILIKE $2

              OR st.designation ILIKE $2

              OR d.department_name ILIKE $2

          )

        ORDER BY

            st.last_name ASC,

            st.first_name ASC

        LIMIT 100
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
| Update Staff
|--------------------------------------------------------------------------
*/

async function updateStaff(
    staffId,
    schoolId,
    data
) {

    const allowedFields = {

        staffNumber:
            "staff_number",

        firstName:
            "first_name",

        middleName:
            "middle_name",

        lastName:
            "last_name",

        gender:
            "gender",

        dateOfBirth:
            "date_of_birth",

        phone:
            "phone",

        email:
            "email",

        address:
            "address",

        departmentId:
            "department_id",

        designation:
            "designation",

        employmentDate:
            "employment_date",

        employmentType:
            "employment_type",

        qualification:
            "qualification",

        specialization:
            "specialization",

        status:
            "status"

    };


    const updates = [];

    const values = [];


    for (
        const key of Object.keys(data)
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


    if (updates.length === 0) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }


    values.push(staffId);

    const staffIdPosition =
        values.length;


    values.push(schoolId);

    const schoolIdPosition =
        values.length;


    const sql = `
        UPDATE staff

        SET

            ${updates.join(", ")},

            updated_at = NOW()

        WHERE id = $${staffIdPosition}

          AND school_id = $${schoolIdPosition}

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


    const result = await query(
        sql,
        [
            staffId,
            schoolId
        ]
    );


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
        SELECT

            COUNT(*) AS staff_count

        FROM staff

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

            COUNT(*)::INTEGER
                AS total_staff,

            COUNT(
                CASE
                    WHEN status = 'active'
                    THEN 1
                END
            )::INTEGER
                AS active_staff,

            COUNT(
                CASE
                    WHEN status = 'inactive'
                    THEN 1
                END
            )::INTEGER
                AS inactive_staff,

            COUNT(
                CASE
                    WHEN gender = 'male'
                    THEN 1
                END
            )::INTEGER
                AS male_staff,

            COUNT(
                CASE
                    WHEN gender = 'female'
                    THEN 1
                END
            )::INTEGER
                AS female_staff

        FROM staff

        WHERE school_id = $1
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


    const row = result.rows[0];


    return {

        totalStaff:
            Number(row.total_staff),

        activeStaff:
            Number(row.active_staff),

        inactiveStaff:
            Number(row.inactive_staff),

        maleStaff:
            Number(row.male_staff),

        femaleStaff:
            Number(row.female_staff)

    };
}


/*
|--------------------------------------------------------------------------
| Get Staff By Department
|--------------------------------------------------------------------------
*/

async function getStaffByDepartment(
    schoolId,
    departmentId
) {

    const sql = `
        SELECT

            st.*,

            d.department_name

        FROM staff st

        LEFT JOIN departments d
            ON d.id = st.department_id

        WHERE st.school_id = $1

          AND st.department_id = $2

        ORDER BY

            st.last_name ASC,

            st.first_name ASC
    `;


    const result = await query(
        sql,
        [
            schoolId,
            departmentId
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Check Staff Number
|--------------------------------------------------------------------------
*/

async function staffNumberExists(
    staffNumber,
    schoolId
) {

    const sql = `
        SELECT

            EXISTS (

                SELECT 1

                FROM staff

                WHERE staff_number = $1

                  AND school_id = $2

            ) AS exists
    `;


    const result = await query(
        sql,
        [
            staffNumber,
            schoolId
        ]
    );


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