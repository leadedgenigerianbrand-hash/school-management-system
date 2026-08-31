const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Student Model
|--------------------------------------------------------------------------
|
| Handles everything related to student records.
|
| Main areas:
|
| - Student profiles
| - Student search
| - Student enrollment
| - Guardians
| - Documents
| - Student statistics
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Student
|--------------------------------------------------------------------------
*/

async function createStudent({
    schoolId,
    admissionNumber,
    firstName,
    middleName = null,
    lastName,
    gender = null,
    dateOfBirth = null,
    phone = null,
    email = null,
    address = null,
    stateOfOrigin = null,
    lga = null,
    nationality = "Nigerian",
    religion = null,
    bloodGroup = null,
    genotype = null,
    admissionDate = null,
    status = "active"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!admissionNumber) {
        throw new Error(
            "Admission number is required."
        );
    }

    if (!firstName) {
        throw new Error(
            "First name is required."
        );
    }

    if (!lastName) {
        throw new Error(
            "Last name is required."
        );
    }


    const sql = `
        INSERT INTO students (
            school_id,
            admission_number,
            first_name,
            middle_name,
            last_name,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            state_of_origin,
            lga,
            nationality,
            religion,
            blood_group,
            genotype,
            admission_date,
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
            $17,
            $18
        )
        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            admissionNumber,
            firstName.trim(),
            middleName,
            lastName.trim(),
            gender,
            dateOfBirth,
            phone,
            email,
            address,
            stateOfOrigin,
            lga,
            nationality,
            religion,
            bloodGroup,
            genotype,
            admissionDate,
            status
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Student By ID
|--------------------------------------------------------------------------
*/

async function findStudentById(
    studentId,
    schoolId = null
) {

    let sql = `
        SELECT *

        FROM students

        WHERE id = $1
    `;


    const values = [
        studentId
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
| Find Student By Admission Number
|--------------------------------------------------------------------------
*/

async function findStudentByAdmissionNumber(
    admissionNumber,
    schoolId = null
) {

    let sql = `
        SELECT *

        FROM students

        WHERE admission_number = $1
    `;


    const values = [
        admissionNumber
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
| Get Student Full Profile
|--------------------------------------------------------------------------
*/

async function getStudentProfile(
    studentId,
    schoolId
) {

    const sql = `
        SELECT

            s.*,

            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id',
                        g.id,

                        'name',
                        g.full_name,

                        'relationship',
                        sg.relationship,

                        'phone',
                        g.phone,

                        'email',
                        g.email
                    )
                )
                FILTER (
                    WHERE g.id IS NOT NULL
                ),
                '[]'
            ) AS guardians

        FROM students s

        LEFT JOIN student_guardians sg
            ON sg.student_id = s.id

        LEFT JOIN guardians g
            ON g.id = sg.guardian_id

        WHERE s.id = $1

          AND s.school_id = $2

        GROUP BY s.id

        LIMIT 1
    `;


    const result = await query(
        sql,
        [
            studentId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| List Students
|--------------------------------------------------------------------------
*/

async function findStudents({
    schoolId,
    status = null,
    gender = null,
    limit = 100,
    offset = 0
}) {

    let sql = `
        SELECT

            s.*

        FROM students s

        WHERE s.school_id = $1
    `;


    const values = [
        schoolId
    ];


    if (status) {

        values.push(status);

        sql += `
            AND s.status = $${values.length}
        `;
    }


    if (gender) {

        values.push(gender);

        sql += `
            AND s.gender = $${values.length}
        `;
    }


    values.push(limit);

    sql += `
        ORDER BY

            s.last_name ASC,

            s.first_name ASC

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
| Search Students
|--------------------------------------------------------------------------
*/

async function searchStudents(
    searchTerm,
    schoolId
) {

    const sql = `
        SELECT *

        FROM students

        WHERE school_id = $1

          AND (

              admission_number ILIKE $2

              OR first_name ILIKE $2

              OR middle_name ILIKE $2

              OR last_name ILIKE $2

              OR phone ILIKE $2

              OR email ILIKE $2

          )

        ORDER BY

            last_name ASC,

            first_name ASC

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
| Update Student
|--------------------------------------------------------------------------
*/

async function updateStudent(
    studentId,
    schoolId,
    data
) {

    const allowedFields = {

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

        stateOfOrigin:
            "state_of_origin",

        lga:
            "lga",

        nationality:
            "nationality",

        religion:
            "religion",

        bloodGroup:
            "blood_group",

        genotype:
            "genotype",

        admissionDate:
            "admission_date",

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


    values.push(studentId);

    const studentIdPosition =
        values.length;


    values.push(schoolId);

    const schoolIdPosition =
        values.length;


    const sql = `
        UPDATE students

        SET

            ${updates.join(", ")},

            updated_at = NOW()

        WHERE id = $${studentIdPosition}

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
| Delete Student
|--------------------------------------------------------------------------
*/

async function deleteStudent(
    studentId,
    schoolId
) {

    const sql = `
        DELETE FROM students

        WHERE id = $1

          AND school_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            studentId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Count Students
|--------------------------------------------------------------------------
*/

async function countStudents(
    schoolId,
    status = null
) {

    let sql = `
        SELECT

            COUNT(*) AS student_count

        FROM students

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
        result.rows[0].student_count
    );
}


/*
|--------------------------------------------------------------------------
| Get Student Statistics
|--------------------------------------------------------------------------
*/

async function getStudentStatistics(
    schoolId
) {

    const sql = `
        SELECT

            COUNT(*)::INTEGER
                AS total_students,

            COUNT(
                CASE
                    WHEN status = 'active'
                    THEN 1
                END
            )::INTEGER
                AS active_students,

            COUNT(
                CASE
                    WHEN status = 'inactive'
                    THEN 1
                END
            )::INTEGER
                AS inactive_students,

            COUNT(
                CASE
                    WHEN gender = 'male'
                    THEN 1
                END
            )::INTEGER
                AS male_students,

            COUNT(
                CASE
                    WHEN gender = 'female'
                    THEN 1
                END
            )::INTEGER
                AS female_students

        FROM students

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

        totalStudents:
            Number(row.total_students),

        activeStudents:
            Number(row.active_students),

        inactiveStudents:
            Number(row.inactive_students),

        maleStudents:
            Number(row.male_students),

        femaleStudents:
            Number(row.female_students)

    };
}


/*
|--------------------------------------------------------------------------
| Get Student Enrollment
|--------------------------------------------------------------------------
*/

async function getStudentEnrollment(
    studentId,
    schoolId
) {

    const sql = `
        SELECT

            se.*,

            c.class_name,

            ca.arm_name,

            ses.session_name,

            t.term_name

        FROM student_enrollments se

        INNER JOIN classes c
            ON c.id = se.class_id

        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id

        INNER JOIN academic_sessions ses
            ON ses.id = se.session_id

        INNER JOIN terms t
            ON t.id = se.term_id

        WHERE se.student_id = $1

          AND se.school_id = $2

        ORDER BY

            ses.start_date DESC

        LIMIT 1
    `;


    const result = await query(
        sql,
        [
            studentId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Enroll Student
|--------------------------------------------------------------------------
*/

async function enrollStudent({
    schoolId,
    studentId,
    classId,
    classArmId = null,
    sessionId,
    termId,
    enrollmentDate = null,
    status = "active"
}) {

    const sql = `
        INSERT INTO student_enrollments (
            school_id,
            student_id,
            class_id,
            class_arm_id,
            session_id,
            term_id,
            enrollment_date,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            COALESCE(
                $7,
                CURRENT_DATE
            ),
            $8
        )
        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            studentId,
            classId,
            classArmId,
            sessionId,
            termId,
            enrollmentDate,
            status
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Get Student Documents
|--------------------------------------------------------------------------
*/

async function getStudentDocuments(
    studentId,
    schoolId
) {

    const sql = `
        SELECT *

        FROM student_documents

        WHERE student_id = $1

          AND school_id = $2

        ORDER BY

            created_at DESC
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
| Get Student Guardians
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

        FROM guardians g

        INNER JOIN student_guardians sg
            ON sg.guardian_id = g.id

        WHERE sg.student_id = $1

          AND g.school_id = $2

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
| Search Student By Name
|--------------------------------------------------------------------------
*/

async function searchStudentByName(
    name,
    schoolId
) {

    const sql = `
        SELECT *

        FROM students

        WHERE school_id = $1

          AND (

              CONCAT(
                  first_name,
                  ' ',
                  COALESCE(
                      middle_name,
                      ''
                  ),
                  ' ',
                  last_name
              ) ILIKE $2

              OR first_name ILIKE $2

              OR last_name ILIKE $2

          )

        ORDER BY

            last_name ASC,

            first_name ASC

        LIMIT 100
    `;


    const result = await query(
        sql,
        [
            schoolId,
            `%${name}%`
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Check Admission Number
|--------------------------------------------------------------------------
*/

async function admissionNumberExists(
    admissionNumber,
    schoolId
) {

    const sql = `
        SELECT

            EXISTS (

                SELECT 1

                FROM students

                WHERE admission_number = $1

                  AND school_id = $2

            ) AS exists
    `;


    const result = await query(
        sql,
        [
            admissionNumber,
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

    createStudent,

    findStudentById,

    findStudentByAdmissionNumber,

    getStudentProfile,

    findStudents,

    searchStudents,

    updateStudent,

    deleteStudent,

    countStudents,

    getStudentStatistics,

    getStudentEnrollment,

    enrollStudent,

    getStudentDocuments,

    getStudentGuardians,

    searchStudentByName,

    admissionNumberExists

};