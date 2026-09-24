"use strict";

const { query } = require("../config/database");

/*
GUARDIAN MODEL

Database tables:

* guardians
* student_guardians

Responsibilities:

* Create guardians
* Find guardians
* Search guardians
* Update guardians
* Delete guardians
* Link guardians to students
* Unlink guardians from students
* Get students linked to a guardian
* Get guardians linked to a student
* Set a primary guardian
* Count guardians
* Get guardian relationship statistics
*/

/*
CREATE GUARDIAN
*/

async function createGuardian(data) {
    const {
        schoolId,
        firstName,
        middleName,
        lastName,
        relationship,
        phone,
        alternativePhone,
        email,
        occupation,
        employer,
        address,
        emergencyContact
    } = data;

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!firstName || !lastName) {
        throw new Error(
            "First name and last name are required."
        );
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
            occupation,
            employer,
            address,
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
        firstName,
        middleName || null,
        lastName,
        relationship || null,
        phone || null,
        alternativePhone || null,
        email || null,
        occupation || null,
        employer || null,
        address || null,
        emergencyContact || null
    ]);

    return result.rows[0];
}

/*
FIND GUARDIAN BY ID
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
        SELECT
            g.*,
            COUNT(DISTINCT sg.student_id)::INTEGER AS student_count
        FROM guardians g
        LEFT JOIN student_guardians sg
            ON sg.guardian_id = g.id
        WHERE g.id = $1
          AND g.school_id = $2
        GROUP BY g.id
    `;

    const result = await query(sql, [
        guardianId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
FIND GUARDIANS
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
        500
    );

    const safeOffset = Math.max(
        Number(offset) || 0,
        0
    );

    const sql = `
        SELECT
            g.*,
            COUNT(DISTINCT sg.student_id)::INTEGER AS student_count
        FROM guardians g
        LEFT JOIN student_guardians sg
            ON sg.guardian_id = g.id
        WHERE g.school_id = $1
        GROUP BY g.id
        ORDER BY
            g.created_at DESC,
            g.last_name ASC,
            g.first_name ASC
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
SEARCH GUARDIANS
*/

async function searchGuardians(
    searchTerm,
    schoolId
) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const term = String(
        searchTerm || ""
    ).trim();

    if (!term) {
        return findGuardians({
            schoolId
        });
    }

    const searchPattern = `%${term}%`;

    const sql = `
        SELECT
            g.*,
            COUNT(DISTINCT sg.student_id)::INTEGER AS student_count
        FROM guardians g
        LEFT JOIN student_guardians sg
            ON sg.guardian_id = g.id
        WHERE g.school_id = $1
          AND (
              g.first_name ILIKE $2
              OR g.middle_name ILIKE $2
              OR g.last_name ILIKE $2
              OR g.phone ILIKE $2
              OR g.alternative_phone ILIKE $2
              OR g.email ILIKE $2
              OR g.relationship ILIKE $2
              OR g.occupation ILIKE $2
              OR g.employer ILIKE $2
          )
        GROUP BY g.id
        ORDER BY
            g.last_name ASC,
            g.first_name ASC
        LIMIT 100
    `;

    const result = await query(sql, [
        schoolId,
        searchPattern
    ]);

    return result.rows;
}

/*
UPDATE GUARDIAN
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

    const {
        firstName,
        middleName,
        lastName,
        relationship,
        phone,
        alternativePhone,
        email,
        occupation,
        employer,
        address,
        emergencyContact
    } = data;

    const sql = `
        UPDATE guardians
        SET
            first_name = $1,
            middle_name = $2,
            last_name = $3,
            relationship = $4,
            phone = $5,
            alternative_phone = $6,
            email = $7,
            occupation = $8,
            employer = $9,
            address = $10,
            emergency_contact = $11,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
          AND school_id = $13
        RETURNING *
    `;

    const result = await query(sql, [
        firstName,
        middleName || null,
        lastName,
        relationship || null,
        phone || null,
        alternativePhone || null,
        email || null,
        occupation || null,
        employer || null,
        address || null,
        emergencyContact || null,
        guardianId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
DELETE GUARDIAN
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
LINK GUARDIAN TO STUDENT
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

    if (!result.rows[0]) {
        throw new Error(
            "Student and guardian could not be linked. Check that both records belong to the same school."
        );
    }

    return result.rows[0];
}

/*
UNLINK GUARDIAN FROM STUDENT
*/

async function unlinkGuardianFromStudent({
    studentId,
    guardianId
}) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!guardianId) {
        throw new Error("Guardian ID is required.");
    }

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
GET STUDENTS LINKED TO GUARDIAN
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
            sg.created_at AS relationship_created_at
        FROM student_guardians sg
        INNER JOIN students s
            ON s.id = sg.student_id
        INNER JOIN guardians g
            ON g.id = sg.guardian_id
        WHERE sg.guardian_id = $1
          AND g.school_id = $2
          AND s.school_id = $2
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
GET GUARDIANS LINKED TO STUDENT
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
            sg.is_primary,
            sg.created_at AS relationship_created_at
        FROM student_guardians sg
        INNER JOIN guardians g
            ON g.id = sg.guardian_id
        INNER JOIN students s
            ON s.id = sg.student_id
        WHERE sg.student_id = $1
          AND g.school_id = $2
          AND s.school_id = $2
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
SET PRIMARY GUARDIAN
*/

async function setPrimaryGuardian({
    studentId,
    guardianId,
    schoolId
}) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!guardianId) {
        throw new Error("Guardian ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    await query("BEGIN");

    try {
        const resetSql = `
            UPDATE student_guardians sg
            SET is_primary = FALSE
            FROM guardians g,
                 students s
            WHERE sg.student_id = $1
              AND sg.student_id = s.id
              AND sg.guardian_id = g.id
              AND s.school_id = $3
              AND g.school_id = $3
        `;

        await query(resetSql, [
            studentId,
            guardianId,
            schoolId
        ]);

        const linkSql = `
            INSERT INTO student_guardians (
                student_id,
                guardian_id,
                is_primary
            )
            SELECT
                s.id,
                g.id,
                TRUE
            FROM students s
            INNER JOIN guardians g
                ON g.id = $2
               AND g.school_id = s.school_id
            WHERE s.id = $1
              AND s.school_id = $3
            ON CONFLICT (student_id, guardian_id)
            DO UPDATE SET
                is_primary = TRUE
            RETURNING *
        `;

        const result = await query(
            linkSql,
            [
                studentId,
                guardianId,
                schoolId
            ]
        );

        await query("COMMIT");

        return result.rows[0] || null;
    } catch (error) {
        await query("ROLLBACK");
        throw error;
    }
}

/*
COUNT GUARDIANS
*/

async function countGuardians(
    schoolId
) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT COUNT(*) AS count
        FROM guardians
        WHERE school_id = $1
    `;

    const result = await query(sql, [
        schoolId
    ]);

    return Number(
        result.rows[0]?.count || 0
    );
}

/*
GET GUARDIAN RELATIONSHIP STATISTICS

totalGuardians:
All guardian records belonging to the school.

linkedGuardians:
Guardians linked to at least one student.

linkedStudents:
Students linked to at least one guardian.

primaryGuardians:
Guardians that have at least one primary relationship.
*/

async function getGuardianRelationshipStats(
    schoolId
) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT
            (
                SELECT COUNT(*)
                FROM guardians g
                WHERE g.school_id = $1
            ) AS total_guardians,

            (
                SELECT COUNT(DISTINCT sg.guardian_id)
                FROM student_guardians sg
                INNER JOIN guardians g
                    ON g.id = sg.guardian_id
                   AND g.school_id = $1
                INNER JOIN students s
                    ON s.id = sg.student_id
                   AND s.school_id = $1
            ) AS linked_guardians,

            (
                SELECT COUNT(DISTINCT sg.student_id)
                FROM student_guardians sg
                INNER JOIN guardians g
                    ON g.id = sg.guardian_id
                   AND g.school_id = $1
                INNER JOIN students s
                    ON s.id = sg.student_id
                   AND s.school_id = $1
            ) AS linked_students,

            (
                SELECT COUNT(DISTINCT sg.guardian_id)
                FROM student_guardians sg
                INNER JOIN guardians g
                    ON g.id = sg.guardian_id
                   AND g.school_id = $1
                INNER JOIN students s
                    ON s.id = sg.student_id
                   AND s.school_id = $1
                WHERE sg.is_primary = TRUE
            ) AS primary_guardians
    `;

    const result = await query(sql, [
        schoolId
    ]);

    const row = result.rows[0] || {};

    return {
        totalGuardians: Number(
            row.total_guardians || 0
        ),
        linkedGuardians: Number(
            row.linked_guardians || 0
        ),
        linkedStudents: Number(
            row.linked_students || 0
        ),
        primaryGuardians: Number(
            row.primary_guardians || 0
        )
    };
}

/*
EXPORTS
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
    countGuardians,
    getGuardianRelationshipStats
};