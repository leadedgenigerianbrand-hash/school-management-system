"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| STUDENT MODEL
|--------------------------------------------------------------------------
|
| Database table:
| students
|
| Responsibilities:
| - Student creation
| - Student lookup
| - Student search
| - Student updates
| - Student deletion
| - Student statistics
| - Student profile data
| - Student enrollment lookup
| - Student enrollment creation
| - Student documents
| - Student guardians
|
| All school-level queries are isolated by school_id.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Utility Helpers
|--------------------------------------------------------------------------
*/

function normalizeText(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const text = String(value).trim();

    return text === "" ? null : text;
}


function normalizeRequiredText(value, fieldName) {
    const text = normalizeText(value);

    if (!text) {
        throw new Error(`${fieldName} is required.`);
    }

    return text;
}


function normalizeLimit(value, defaultValue = 100) {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 1) {
        return defaultValue;
    }

    return Math.min(Math.floor(number), 500);
}


function normalizeOffset(value) {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
        return 0;
    }

    return Math.floor(number);
}


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
    photoUrl = null,
    admissionDate = null,
    status = "Active"
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const finalAdmissionNumber =
        normalizeRequiredText(
            admissionNumber,
            "Admission number"
        );

    const finalFirstName =
        normalizeRequiredText(
            firstName,
            "First name"
        );

    const finalLastName =
        normalizeRequiredText(
            lastName,
            "Last name"
        );

    const finalMiddleName =
        normalizeText(middleName);

    const finalGender =
        normalizeText(gender);

    const finalPhone =
        normalizeText(phone);

    const finalEmail =
        normalizeText(email);

    const finalAddress =
        normalizeText(address);

    const finalStateOfOrigin =
        normalizeText(stateOfOrigin);

    const finalLga =
        normalizeText(lga);

    const finalNationality =
        normalizeText(nationality) || "Nigerian";

    const finalReligion =
        normalizeText(religion);

    const finalBloodGroup =
        normalizeText(bloodGroup);

    const finalGenotype =
        normalizeText(genotype);

    const finalPhotoUrl =
        normalizeText(photoUrl);

    const finalStatus =
        normalizeText(status) || "Active";


    /*
    |--------------------------------------------------------------------------
    | Generate Internal Student Number
    |--------------------------------------------------------------------------
    */

    const studentNumber =
        `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;


    /*
    |--------------------------------------------------------------------------
    | Insert Student
    |--------------------------------------------------------------------------
    */

    const sql = `
        INSERT INTO students (
            school_id,
            student_number,
            admission_number,
            first_name,
            middle_name,
            last_name,
            gender,
            date_of_birth,
            phone,
            email,
            residential_address,
            state_of_origin,
            local_government_area,
            nationality,
            religion,
            blood_group,
            genotype,
            student_photo_url,
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
            $18,
            $19,
            $20
        )
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        studentNumber,
        finalAdmissionNumber,
        finalFirstName,
        finalMiddleName,
        finalLastName,
        finalGender,
        dateOfBirth,
        finalPhone,
        finalEmail,
        finalAddress,
        finalStateOfOrigin,
        finalLga,
        finalNationality,
        finalReligion,
        finalBloodGroup,
        finalGenotype,
        finalPhotoUrl,
        admissionDate,
        finalStatus
    ]);

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

    const values = [studentId];

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
| Find Student By Admission Number
|--------------------------------------------------------------------------
*/

async function findStudentByAdmissionNumber(
    admissionNumber,
    schoolId = null
) {
    const finalAdmissionNumber =
        normalizeText(admissionNumber);

    if (!finalAdmissionNumber) {
        return null;
    }

    let sql = `
        SELECT *
        FROM students
        WHERE admission_number = $1
    `;

    const values = [finalAdmissionNumber];

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
| Get Student Full Profile
|--------------------------------------------------------------------------
*/

async function getStudentProfile(
    studentId,
    schoolId
) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT
            s.*,

            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', g.id,
                        'name', g.full_name,
                        'relationship', sg.relationship,
                        'phone', g.phone,
                        'email', g.email
                    )
                )
                FILTER (
                    WHERE g.id IS NOT NULL
                ),
                '[]'::json
            ) AS guardians

        FROM students s

        LEFT JOIN student_guardians sg
            ON sg.student_id = s.id

        LEFT JOIN guardians g
            ON g.id = sg.guardian_id
           AND g.school_id = s.school_id

        WHERE s.id = $1
          AND s.school_id = $2

        GROUP BY s.id

        LIMIT 1
    `;

    const result = await query(sql, [
        studentId,
        schoolId
    ]);

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
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const finalLimit =
        normalizeLimit(limit);

    const finalOffset =
        normalizeOffset(offset);

    let sql = `
        SELECT *
        FROM students
        WHERE school_id = $1
    `;

    const values = [schoolId];

    const finalStatus =
        normalizeText(status);

    const finalGender =
        normalizeText(gender);

    if (finalStatus) {
        values.push(finalStatus);

        sql += `
            AND status = $${values.length}
        `;
    }

    if (finalGender) {
        values.push(finalGender);

        sql += `
            AND gender = $${values.length}
        `;
    }

    values.push(finalLimit);

    sql += `
        ORDER BY
            last_name ASC,
            first_name ASC,
            id ASC

        LIMIT $${values.length}
    `;

    values.push(finalOffset);

    sql += `
        OFFSET $${values.length}
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Search Students
|--------------------------------------------------------------------------
|
| Searches:
| - Admission Number
| - Internal Student Number
| - First Name
| - Middle Name
| - Last Name
| - Phone
| - Email
|
|--------------------------------------------------------------------------
*/

async function searchStudents(
    searchTerm,
    schoolId
) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const finalSearchTerm =
        normalizeText(searchTerm);

    if (!finalSearchTerm) {
        return [];
    }

    const sql = `
        SELECT *
        FROM students

        WHERE school_id = $1

          AND (
              admission_number ILIKE $2
              OR student_number ILIKE $2
              OR first_name ILIKE $2
              OR middle_name ILIKE $2
              OR last_name ILIKE $2
              OR phone ILIKE $2
              OR email ILIKE $2
          )

        ORDER BY
            last_name ASC,
            first_name ASC,
            id ASC

        LIMIT 100
    `;

    const result = await query(sql, [
        schoolId,
        `%${finalSearchTerm}%`
    ]);

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
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!data || typeof data !== "object") {
        throw new Error("Student update data is required.");
    }

    const allowedFields = {
        firstName: "first_name",
        middleName: "middle_name",
        lastName: "last_name",
        gender: "gender",
        dateOfBirth: "date_of_birth",
        phone: "phone",
        email: "email",
        address: "residential_address",
        stateOfOrigin: "state_of_origin",
        lga: "local_government_area",
        nationality: "nationality",
        religion: "religion",
        bloodGroup: "blood_group",
        genotype: "genotype",
        photoUrl: "student_photo_url",
        admissionDate: "admission_date",
        status: "status"
    };

    const updates = [];
    const values = [];

    for (const key of Object.keys(data)) {
        if (
            Object.prototype.hasOwnProperty.call(
                allowedFields,
                key
            ) &&
            data[key] !== undefined
        ) {
            let value = data[key];

            if (
                typeof value === "string" &&
                key !== "dateOfBirth" &&
                key !== "admissionDate"
            ) {
                value = normalizeText(value);
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

    const result = await query(sql, values);

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
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        DELETE FROM students

        WHERE id = $1
          AND school_id = $2

        RETURNING *
    `;

    const result = await query(sql, [
        studentId,
        schoolId
    ]);

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
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT COUNT(*) AS student_count
        FROM students
        WHERE school_id = $1
    `;

    const values = [schoolId];

    const finalStatus =
        normalizeText(status);

    if (finalStatus) {
        values.push(finalStatus);

        sql += `
            AND status = $${values.length}
        `;
    }

    const result = await query(sql, values);

    return Number(
        result.rows[0]?.student_count || 0
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
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT

            COUNT(*)::INTEGER
                AS total_students,

            COUNT(
                CASE
                    WHEN LOWER(COALESCE(status, '')) = 'active'
                    THEN 1
                END
            )::INTEGER
                AS active_students,

            COUNT(
                CASE
                    WHEN LOWER(COALESCE(status, '')) = 'inactive'
                    THEN 1
                END
            )::INTEGER
                AS inactive_students,

            COUNT(
                CASE
                    WHEN LOWER(COALESCE(gender, '')) = 'male'
                    THEN 1
                END
            )::INTEGER
                AS male_students,

            COUNT(
                CASE
                    WHEN LOWER(COALESCE(gender, '')) = 'female'
                    THEN 1
                END
            )::INTEGER
                AS female_students

        FROM students

        WHERE school_id = $1
    `;

    const result = await query(
        sql,
        [schoolId]
    );

    const row =
        result.rows[0] || {};

    return {
        totalStudents:
            Number(row.total_students || 0),

        activeStudents:
            Number(row.active_students || 0),

        inactiveStudents:
            Number(row.inactive_students || 0),

        maleStudents:
            Number(row.male_students || 0),

        femaleStudents:
            Number(row.female_students || 0)
    };
}


/*
|--------------------------------------------------------------------------
| Get Student Enrollment
|--------------------------------------------------------------------------
|
| Enrollment structure:
|
| Student
|   ↓
| Academic Session
|   ↓
| Class
|   ↓
| Class Arm
|   ↓
| Department
|
| Term is NOT stored in student_enrollments.
|
| If academicSessionId is supplied:
| return enrollment for that session.
|
| If omitted:
| return the most recent enrollment.
|
|--------------------------------------------------------------------------
*/

async function getStudentEnrollment(
    studentId,
    schoolId,
    academicSessionId = null
) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT

            se.id AS enrollment_id,

            se.student_id,

            se.school_id,

            se.academic_session_id,

            se.class_id,

            se.class_arm_id,

            se.department_id,

            se.admission_status,

            se.enrollment_date,

            se.exit_date,

            c.class_name,

            c.class_code,

            c.class_order,

            ca.arm_name,

            ca.arm_code,

            d.department_name,

            d.department_code,

            ses.session_name,

            ses.start_date AS session_start_date,

            ses.end_date AS session_end_date,

            ses.is_current AS session_is_current,

            ses.is_active AS session_is_active

        FROM student_enrollments se

        INNER JOIN classes c
            ON c.id = se.class_id
           AND c.school_id = se.school_id

        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id
           AND ca.school_id = se.school_id

        LEFT JOIN departments d
            ON d.id = se.department_id
           AND d.school_id = se.school_id

        INNER JOIN academic_sessions ses
            ON ses.id = se.academic_session_id
           AND ses.school_id = se.school_id

        WHERE se.student_id = $1
          AND se.school_id = $2
    `;

    const values = [
        studentId,
        schoolId
    ];

    if (academicSessionId) {
        values.push(academicSessionId);

        sql += `
            AND se.academic_session_id = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            ses.start_date DESC,
            se.created_at DESC,
            se.id DESC

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
| Enroll Student
|--------------------------------------------------------------------------
|
| Current student_enrollments structure:
|
| - student_id
| - school_id
| - academic_session_id
| - class_id
| - class_arm_id
| - department_id
| - admission_status
| - enrollment_date
| - exit_date
|
| There is NO term_id here.
|
|--------------------------------------------------------------------------
*/

async function enrollStudent({
    schoolId,
    studentId,
    classId,
    classArmId = null,
    departmentId = null,
    sessionId = null,
    academicSessionId = null,
    enrollmentDate = null,
    status = "Enrolled",
    admissionStatus = null,
    exitDate = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!classId) {
        throw new Error("Class ID is required.");
    }

    const finalAcademicSessionId =
        academicSessionId || sessionId;

    if (!finalAcademicSessionId) {
        throw new Error("Academic session is required.");
    }

    const finalAdmissionStatus =
        normalizeText(admissionStatus) ||
        normalizeText(status) ||
        "Enrolled";


    /*
    |--------------------------------------------------------------------------
    | Verify Student Belongs To School
    |--------------------------------------------------------------------------
    */

    const studentCheck = await query(
        `
            SELECT id
            FROM students
            WHERE id = $1
              AND school_id = $2
            LIMIT 1
        `,
        [
            studentId,
            schoolId
        ]
    );

    if (studentCheck.rows.length === 0) {
        throw new Error(
            "Student was not found in this school."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Class Belongs To School
    |--------------------------------------------------------------------------
    */

    const classCheck = await query(
        `
            SELECT id
            FROM classes
            WHERE id = $1
              AND school_id = $2
            LIMIT 1
        `,
        [
            classId,
            schoolId
        ]
    );

    if (classCheck.rows.length === 0) {
        throw new Error(
            "Class was not found in this school."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Academic Session Belongs To School
    |--------------------------------------------------------------------------
    */

    const sessionCheck = await query(
        `
            SELECT id
            FROM academic_sessions
            WHERE id = $1
              AND school_id = $2
            LIMIT 1
        `,
        [
            finalAcademicSessionId,
            schoolId
        ]
    );

    if (sessionCheck.rows.length === 0) {
        throw new Error(
            "Academic session was not found in this school."
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Insert Enrollment
    |--------------------------------------------------------------------------
    */

    const sql = `
        INSERT INTO student_enrollments (
            school_id,
            student_id,
            academic_session_id,
            class_id,
            class_arm_id,
            department_id,
            admission_status,
            enrollment_date,
            exit_date
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            COALESCE($8, CURRENT_DATE),
            $9
        )
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            schoolId,
            studentId,
            finalAcademicSessionId,
            classId,
            classArmId,
            departmentId,
            finalAdmissionStatus,
            enrollmentDate,
            exitDate
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
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT *
        FROM student_documents

        WHERE student_id = $1
          AND school_id = $2

        ORDER BY
            created_at DESC,
            id DESC
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
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

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
            g.full_name ASC,
            g.id ASC
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
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const finalName =
        normalizeText(name);

    if (!finalName) {
        return [];
    }

    const sql = `
        SELECT *
        FROM students

        WHERE school_id = $1

          AND (
              CONCAT_WS(
                  ' ',
                  first_name,
                  NULLIF(middle_name, ''),
                  last_name
              ) ILIKE $2

              OR first_name ILIKE $2

              OR last_name ILIKE $2
          )

        ORDER BY
            last_name ASC,
            first_name ASC,
            id ASC

        LIMIT 100
    `;

    const result = await query(
        sql,
        [
            schoolId,
            `%${finalName}%`
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
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const finalAdmissionNumber =
        normalizeText(admissionNumber);

    if (!finalAdmissionNumber) {
        return false;
    }

    const sql = `
        SELECT EXISTS (

            SELECT 1

            FROM students

            WHERE admission_number = $1
              AND school_id = $2

        ) AS exists
    `;

    const result = await query(
        sql,
        [
            finalAdmissionNumber,
            schoolId
        ]
    );

    return Boolean(
        result.rows[0]?.exists
    );
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