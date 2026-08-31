const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Guardian Model
|--------------------------------------------------------------------------
|
| Handles parents and guardians of students.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Guardian
|--------------------------------------------------------------------------
*/

async function createGuardian({
    schoolId,
    fullName,
    relationship = null,
    phone = null,
    alternatePhone = null,
    email = null,
    address = null,
    occupation = null,
    workplace = null,
    status = "active"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!fullName) {
        throw new Error("Guardian name is required.");
    }


    const sql = `
        INSERT INTO guardians (
            school_id,
            full_name,
            relationship,
            phone,
            alternate_phone,
            email,
            address,
            occupation,
            workplace,
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
            $10
        )
        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            fullName.trim(),
            relationship,
            phone,
            alternatePhone,
            email,
            address,
            occupation,
            workplace,
            status
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Guardian By ID
|--------------------------------------------------------------------------
*/

async function findGuardianById(
    guardianId,
    schoolId
) {

    const sql = `
        SELECT *

        FROM guardians

        WHERE id = $1

          AND school_id = $2

        LIMIT 1
    `;


    const result = await query(
        sql,
        [
            guardianId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Find Guardians
|--------------------------------------------------------------------------
*/

async function findGuardians({
    schoolId,
    status = null,
    limit = 100,
    offset = 0
}) {

    let sql = `
        SELECT *

        FROM guardians

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


    values.push(limit);

    sql += `
        ORDER BY

            full_name ASC

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
| Search Guardians
|--------------------------------------------------------------------------
*/

async function searchGuardians(
    searchTerm,
    schoolId
) {

    const sql = `
        SELECT *

        FROM guardians

        WHERE school_id = $1

          AND (

              full_name ILIKE $2

              OR phone ILIKE $2

              OR alternate_phone ILIKE $2

              OR email ILIKE $2

              OR occupation ILIKE $2

              OR workplace ILIKE $2

          )

        ORDER BY

            full_name ASC

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
| Update Guardian
|--------------------------------------------------------------------------
*/

async function updateGuardian(
    guardianId,
    schoolId,
    data
) {

    const allowedFields = {

        fullName:
            "full_name",

        relationship:
            "relationship",

        phone:
            "phone",

        alternatePhone:
            "alternate_phone",

        email:
            "email",

        address:
            "address",

        occupation:
            "occupation",

        workplace:
            "workplace",

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


    values.push(guardianId);

    const guardianIdPosition =
        values.length;


    values.push(schoolId);

    const schoolIdPosition =
        values.length;


    const sql = `
        UPDATE guardians

        SET

            ${updates.join(", ")},

            updated_at = NOW()

        WHERE id = $${guardianIdPosition}

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
| Delete Guardian
|--------------------------------------------------------------------------
*/

async function deleteGuardian(
    guardianId,
    schoolId
) {

    const sql = `
        DELETE FROM guardians

        WHERE id = $1

          AND school_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            guardianId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Link Guardian To Student
|--------------------------------------------------------------------------
*/

async function linkGuardianToStudent({
    schoolId,
    studentId,
    guardianId,
    relationship = null,
    isPrimary = false
}) {

    const sql = `
        INSERT INTO student_guardians (
            school_id,
            student_id,
            guardian_id,
            relationship,
            is_primary
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
        )
        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            studentId,
            guardianId,
            relationship,
            isPrimary
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Unlink Guardian From Student
|--------------------------------------------------------------------------
*/

async function unlinkGuardianFromStudent(
    studentId,
    guardianId,
    schoolId
) {

    const sql = `
        DELETE FROM student_guardians

        WHERE student_id = $1

          AND guardian_id = $2

          AND school_id = $3

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            studentId,
            guardianId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Get Guardian's Students
|--------------------------------------------------------------------------
*/

async function getGuardianStudents(
    guardianId,
    schoolId
) {

    const sql = `
        SELECT

            s.*,

            sg.relationship,

            sg.is_primary,

            se.class_id,

            se.class_arm_id,

            c.class_name,

            ca.arm_name

        FROM student_guardians sg

        INNER JOIN students s
            ON s.id = sg.student_id

        LEFT JOIN student_enrollments se
            ON se.student_id = s.id

        LEFT JOIN classes c
            ON c.id = se.class_id

        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id

        WHERE sg.guardian_id = $1

          AND sg.school_id = $2

        ORDER BY

            s.last_name ASC,

            s.first_name ASC
    `;


    const result = await query(
        sql,
        [
            guardianId,
            schoolId
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Student's Guardians
|--------------------------------------------------------------------------
*/

async function getStudentGuardians(
    studentId,
    schoolId
) {

    const sql = `
        SELECT

            g.*,

            sg.relationship,

            sg.is_primary

        FROM student_guardians sg

        INNER JOIN guardians g
            ON g.id = sg.guardian_id

        WHERE sg.student_id = $1

          AND sg.school_id = $2

        ORDER BY

            sg.is_primary DESC,

            g.full_name ASC
    `;


    const result = await query(
        sql,
        [
            studentId,
            schoolId
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Set Primary Guardian
|--------------------------------------------------------------------------
*/

async function setPrimaryGuardian(
    studentId,
    guardianId,
    schoolId
) {

    /*
    |--------------------------------------------------------------------------
    | First remove primary status from
    | all guardians of this student.
    |--------------------------------------------------------------------------
    */

    await query(
        `
            UPDATE student_guardians

            SET is_primary = FALSE

            WHERE student_id = $1

              AND school_id = $2
        `,
        [
            studentId,
            schoolId
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | Make selected guardian primary.
    |--------------------------------------------------------------------------
    */

    const sql = `
        UPDATE student_guardians

        SET is_primary = TRUE

        WHERE student_id = $1

          AND guardian_id = $2

          AND school_id = $3

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            studentId,
            guardianId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Count Guardians
|--------------------------------------------------------------------------
*/

async function countGuardians(
    schoolId,
    status = null
) {

    let sql = `
        SELECT

            COUNT(*) AS guardian_count

        FROM guardians

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
        result.rows[0].guardian_count
    );
}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    createGuardian,

    findGuardianById,

    findGuardians,

    searchGuardians,

    updateGuardian,

    deleteGuardian,

    linkGuardianToStudent,

    unlinkGuardianFromStudent,

    getGuardianStudents,

    getStudentGuardians,

    setPrimaryGuardian,

    countGuardians

};