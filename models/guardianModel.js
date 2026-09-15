"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| GUARDIAN MODEL
|--------------------------------------------------------------------------
|
| Database tables:
|
| guardians
| student_guardians
| students
| student_enrollments
| classes
| class_arms
|
| This model is responsible only for database operations involving
| parents/guardians and their relationships with students.
|
| The public function names and signatures are preserved so existing
| controllers and routes can continue to use this model without redesign.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CREATE GUARDIAN
|--------------------------------------------------------------------------
*/

async function createGuardian({
    schoolId,
    firstName,
    middleName = null,
    lastName,
    relationship = null,
    phone = null,
    alternativePhone = null,
    email = null,
    address = null,
    occupation = null,
    employer = null,
    emergencyContact = false
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (
        !firstName ||
        typeof firstName !== "string" ||
        !firstName.trim()
    ) {
        throw new Error("Guardian first name is required.");
    }

    if (
        !lastName ||
        typeof lastName !== "string" ||
        !lastName.trim()
    ) {
        throw new Error("Guardian last name is required.");
    }

    const sql = `
        INSERT INTO guardians (
            school_id,
            first_name,
            middle_name,
            last_name,
            relationship,
            phone,
            alternative_phone,
            email,
            address,
            occupation,
            employer,
            emergency_contact
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
            $12
        )
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        firstName.trim(),
        typeof middleName === "string" && middleName.trim()
            ? middleName.trim()
            : null,
        lastName.trim(),
        relationship || null,
        phone || null,
        alternativePhone || null,
        email || null,
        address || null,
        occupation || null,
        employer || null,
        Boolean(emergencyContact)
    ]);

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| FIND GUARDIAN BY ID
|--------------------------------------------------------------------------
*/

async function findGuardianById(
    guardianId,
    schoolId
) {
    if (!guardianId) {
        throw new Error("Guardian ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT *
        FROM guardians
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
    `;

    const result = await query(sql, [
        guardianId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| FIND GUARDIANS
|--------------------------------------------------------------------------
*/

async function findGuardians({
    schoolId,
    limit = 100,
    offset = 0
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const numericLimit = Number(limit);
    const numericOffset = Number(offset);

    const safeLimit = Math.min(
        Math.max(
            Number.isFinite(numericLimit)
                ? Math.trunc(numericLimit)
                : 100,
            1
        ),
        100
    );

    const safeOffset = Math.max(
        Number.isFinite(numericOffset)
            ? Math.trunc(numericOffset)
            : 0,
        0
    );

    const sql = `
        SELECT *
        FROM guardians
        WHERE school_id = $1
        ORDER BY
            last_name ASC,
            first_name ASC,
            middle_name ASC
        LIMIT $2
        OFFSET $3
    `;

    const result = await query(sql, [
        schoolId,
        safeLimit,
        safeOffset
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| SEARCH GUARDIANS
|--------------------------------------------------------------------------
*/

async function searchGuardians(
    searchTerm,
    schoolId
) {
    if (!schoolId) {
        return [];
    }

    if (
        !searchTerm ||
        typeof searchTerm !== "string" ||
        !searchTerm.trim()
    ) {
        return [];
    }

    const sql = `
        SELECT *
        FROM guardians
        WHERE school_id = $1
          AND (
                first_name ILIKE $2
                OR middle_name ILIKE $2
                OR last_name ILIKE $2
                OR phone ILIKE $2
                OR alternative_phone ILIKE $2
                OR email ILIKE $2
                OR address ILIKE $2
                OR occupation ILIKE $2
                OR employer ILIKE $2
                OR relationship ILIKE $2
          )
        ORDER BY
            last_name ASC,
            first_name ASC,
            middle_name ASC
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
| UPDATE GUARDIAN
|--------------------------------------------------------------------------
*/

async function updateGuardian(
    guardianId,
    schoolId,
    data
) {
    if (!guardianId) {
        throw new Error("Guardian ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const allowedFields = {
        firstName: "first_name",
        middleName: "middle_name",
        lastName: "last_name",
        relationship: "relationship",
        phone: "phone",
        alternativePhone: "alternative_phone",
        email: "email",
        address: "address",
        occupation: "occupation",
        employer: "employer",
        emergencyContact: "emergency_contact"
    };

    const updates = [];
    const values = [];

    for (const key of Object.keys(data || {})) {
        if (
            !allowedFields[key] ||
            data[key] === undefined
        ) {
            continue;
        }

        let value = data[key];

        if (
            [
                "firstName",
                "middleName",
                "lastName"
            ].includes(key)
        ) {
            if (value === null) {
                value = null;
            } else if (typeof value === "string") {
                value = value.trim();

                if (!value) {
                    value = null;
                }
            }
        }

        if (key === "emergencyContact") {
            value = Boolean(value);
        }

        values.push(value);

        updates.push(
            `${allowedFields[key]} = $${values.length}`
        );
    }

    if (updates.length === 0) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }

    values.push(guardianId);
    const guardianIdPosition = values.length;

    values.push(schoolId);
    const schoolIdPosition = values.length;

    const sql = `
        UPDATE guardians
        SET
            ${updates.join(", ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $${guardianIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| DELETE GUARDIAN
|--------------------------------------------------------------------------
*/

async function deleteGuardian(
    guardianId,
    schoolId
) {
    if (!guardianId) {
        throw new Error("Guardian ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        DELETE FROM guardians
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        guardianId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| LINK GUARDIAN TO STUDENT
|--------------------------------------------------------------------------
|
| The relationship table does not contain school_id.
|
| Therefore the student and guardian are validated against their respective
| school records before the relationship is inserted.
|
| This prevents an accidental cross-school guardian relationship.
|
|--------------------------------------------------------------------------
*/

async function linkGuardianToStudent({
    studentId,
    guardianId,
    isPrimary = false
}) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!guardianId) {
        throw new Error("Guardian ID is required.");
    }

    const sql = `
        INSERT INTO student_guardians (
            student_id,
            guardian_id,
            is_primary
        )
        SELECT
            s.id,
            g.id,
            $3
        FROM students s
        INNER JOIN guardians g
            ON g.id = $2
           AND g.school_id = s.school_id
        WHERE s.id = $1
        ON CONFLICT (student_id, guardian_id)
        DO UPDATE SET
            is_primary = EXCLUDED.is_primary
        RETURNING *
    `;

    const result = await query(sql, [
        studentId,
        guardianId,
        Boolean(isPrimary)
    ]);

    if (result.rows.length === 0) {
        throw new Error(
            "Student and guardian must belong to the same school."
        );
    }

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| UNLINK GUARDIAN FROM STUDENT
|--------------------------------------------------------------------------
*/

async function unlinkGuardianFromStudent(
    studentId,
    guardianId
) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!guardianId) {
        throw new Error("Guardian ID is required.");
    }

    const sql = `
        DELETE FROM student_guardians sg
        USING students s, guardians g
        WHERE sg.student_id = s.id
          AND sg.guardian_id = g.id
          AND s.id = $1
          AND g.id = $2
          AND s.school_id = g.school_id
        RETURNING sg.*
    `;

    const result = await query(sql, [
        studentId,
        guardianId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| GET GUARDIAN'S STUDENTS
|--------------------------------------------------------------------------
*/

async function getGuardianStudents(
    guardianId,
    schoolId
) {
    if (!guardianId) {
        throw new Error("Guardian ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT
            s.*,
            sg.is_primary,
            se.academic_session_id,
            se.class_id,
            se.class_arm_id,
            se.department_id,
            se.admission_status,
            se.enrollment_date,
            se.exit_date,
            c.class_name,
            ca.arm_name,
            d.department_name,
            ses.session_name
        FROM student_guardians sg

        INNER JOIN guardians g
            ON g.id = sg.guardian_id
           AND g.school_id = $2

        INNER JOIN students s
            ON s.id = sg.student_id
           AND s.school_id = $2

        LEFT JOIN student_enrollments se
            ON se.student_id = s.id
           AND se.school_id = $2

        LEFT JOIN classes c
            ON c.id = se.class_id
           AND c.school_id = $2

        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id
           AND ca.school_id = $2

        LEFT JOIN departments d
            ON d.id = se.department_id
           AND d.school_id = $2

        LEFT JOIN academic_sessions ses
            ON ses.id = se.academic_session_id
           AND ses.school_id = $2

        WHERE sg.guardian_id = $1

        ORDER BY
            s.last_name ASC,
            s.first_name ASC,
            ses.start_date DESC NULLS LAST
    `;

    const result = await query(sql, [
        guardianId,
        schoolId
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET STUDENT'S GUARDIANS
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
            sg.is_primary
        FROM student_guardians sg

        INNER JOIN guardians g
            ON g.id = sg.guardian_id
           AND g.school_id = $2

        INNER JOIN students s
            ON s.id = sg.student_id
           AND s.school_id = $2

        WHERE sg.student_id = $1

        ORDER BY
            sg.is_primary DESC,
            g.last_name ASC,
            g.first_name ASC,
            g.middle_name ASC
    `;

    const result = await query(sql, [
        studentId,
        schoolId
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| SET PRIMARY GUARDIAN
|--------------------------------------------------------------------------
|
| Only guardians belonging to the same school as the student can be made
| primary.
|
| First, all guardians for the student are made non-primary.
| Then the requested guardian is made primary.
|
|--------------------------------------------------------------------------
*/

async function setPrimaryGuardian(
    studentId,
    guardianId,
    schoolId
) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!guardianId) {
        throw new Error("Guardian ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    await query(
        `
            UPDATE student_guardians sg
            SET is_primary = FALSE
            FROM guardians g
            INNER JOIN students s
                ON s.id = sg.student_id
            WHERE sg.guardian_id = g.id
              AND sg.student_id = $1
              AND g.school_id = $2
              AND s.school_id = $2
        `,
        [
            studentId,
            schoolId
        ]
    );

    const sql = `
        UPDATE student_guardians sg
        SET is_primary = TRUE
        FROM guardians g
        INNER JOIN students s
            ON s.id = sg.student_id
        WHERE sg.student_id = $1
          AND sg.guardian_id = $2
          AND g.id = sg.guardian_id
          AND g.school_id = $3
          AND s.school_id = $3
        RETURNING sg.*
    `;

    const result = await query(sql, [
        studentId,
        guardianId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| COUNT GUARDIANS
|--------------------------------------------------------------------------
*/

async function countGuardians(
    schoolId
) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT COUNT(*) AS guardian_count
        FROM guardians
        WHERE school_id = $1
    `;

    const result = await query(sql, [
        schoolId
    ]);

    return Number(
        result.rows[0].guardian_count
    );
}

/*
|--------------------------------------------------------------------------
| EXPORT
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