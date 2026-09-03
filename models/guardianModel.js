"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Guardian Model
|--------------------------------------------------------------------------
| Handles parents and guardians of students.
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Create Guardian
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

    if (!firstName || !firstName.trim()) {
        throw new Error("Guardian first name is required.");
    }

    if (!lastName || !lastName.trim()) {
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
        middleName ? middleName.trim() : null,
        lastName.trim(),
        relationship,
        phone,
        alternativePhone,
        email,
        address,
        occupation,
        employer,
        emergencyContact
    ]);

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Guardian By ID
|--------------------------------------------------------------------------
*/

async function findGuardianById(guardianId, schoolId) {
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
| Find Guardians
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

    const safeLimit = Math.min(
        Math.max(Number(limit) || 100, 1),
        100
    );

    const safeOffset = Math.max(
        Number(offset) || 0,
        0
    );

    const sql = `
        SELECT *
        FROM guardians
        WHERE school_id = $1
        ORDER BY
            last_name ASC,
            first_name ASC
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
| Search Guardians
|--------------------------------------------------------------------------
*/

async function searchGuardians(searchTerm, schoolId) {
    if (!schoolId || !searchTerm || !searchTerm.trim()) {
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
                OR occupation ILIKE $2
                OR employer ILIKE $2
                OR relationship ILIKE $2
          )
        ORDER BY
            last_name ASC,
            first_name ASC
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
| Update Guardian
|--------------------------------------------------------------------------
*/

async function updateGuardian(
    guardianId,
    schoolId,
    data
) {
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
            allowedFields[key] &&
            data[key] !== undefined
        ) {
            let value = data[key];

            if (
                [
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

    const result = await query(sql, [
        guardianId,
        schoolId
    ]);

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Link Guardian To Student
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
        VALUES (
            $1,
            $2,
            $3
        )
        ON CONFLICT (student_id, guardian_id)
        DO UPDATE SET
            is_primary = EXCLUDED.is_primary
        RETURNING *
    `;

    const result = await query(sql, [
        studentId,
        guardianId,
        isPrimary
    ]);

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Unlink Guardian From Student
|--------------------------------------------------------------------------
*/

async function unlinkGuardianFromStudent(
    studentId,
    guardianId
) {
    const sql = `
        DELETE FROM student_guardians
        WHERE student_id = $1
          AND guardian_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        studentId,
        guardianId
    ]);

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
            g.relationship,
            sg.is_primary,
            se.academic_session_id,
            se.class_id,
            se.class_arm_id,
            se.department_id,
            c.class_name,
            ca.arm_name
        FROM student_guardians sg

        INNER JOIN guardians g
            ON g.id = sg.guardian_id

        INNER JOIN students s
            ON s.id = sg.student_id

        LEFT JOIN student_enrollments se
            ON se.student_id = s.id
           AND se.school_id = $2

        LEFT JOIN classes c
            ON c.id = se.class_id

        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id

        WHERE sg.guardian_id = $1
          AND g.school_id = $2

        ORDER BY
            s.last_name ASC,
            s.first_name ASC
    `;

    const result = await query(sql, [
        guardianId,
        schoolId
    ]);

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
            sg.is_primary
        FROM student_guardians sg

        INNER JOIN guardians g
            ON g.id = sg.guardian_id

        WHERE sg.student_id = $1
          AND g.school_id = $2

        ORDER BY
            sg.is_primary DESC,
            g.last_name ASC,
            g.first_name ASC
    `;

    const result = await query(sql, [
        studentId,
        schoolId
    ]);

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
    await query(
        `
            UPDATE student_guardians sg
            SET is_primary = FALSE
            FROM guardians g
            WHERE sg.guardian_id = g.id
              AND sg.student_id = $1
              AND g.school_id = $2
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
        WHERE sg.student_id = $1
          AND sg.guardian_id = $2
          AND g.id = sg.guardian_id
          AND g.school_id = $3
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
| Count Guardians
|--------------------------------------------------------------------------
*/

async function countGuardians(schoolId) {
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