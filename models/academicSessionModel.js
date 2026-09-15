"use strict";

const { query, pool } = require("../config/database");

async function createAcademicSession({
    schoolId,
    sessionName,
    startDate = null,
    endDate = null,
    isCurrent = false,
    isActive = true
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (
        typeof sessionName !== "string" ||
        !sessionName.trim()
    ) {
        throw new Error("Academic session name is required.");
    }

    const name = sessionName.trim();

    const existing = await findAcademicSessionByName(
        schoolId,
        name
    );

    if (existing) {
        throw new Error(
            "An academic session with this name already exists."
        );
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        if (isCurrent) {
            await client.query(
                `
                UPDATE academic_sessions
                SET
                    is_current = FALSE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE school_id = $1
                `,
                [schoolId]
            );
        }

        const result = await client.query(
            `
            INSERT INTO academic_sessions (
                school_id,
                session_name,
                start_date,
                end_date,
                is_current,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
                schoolId,
                name,
                startDate,
                endDate,
                Boolean(isCurrent),
                Boolean(isActive)
            ]
        );

        await client.query("COMMIT");

        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function findAcademicSessionById(
    sessionId,
    schoolId = null
) {
    let sql = `
        SELECT *
        FROM academic_sessions
        WHERE id = $1
    `;

    const values = [sessionId];

    if (
        schoolId !== null &&
        schoolId !== undefined
    ) {
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

async function findAcademicSessionByName(
    schoolId,
    sessionName
) {
    if (
        !schoolId ||
        typeof sessionName !== "string" ||
        !sessionName.trim()
    ) {
        return null;
    }

    const result = await query(
        `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
          AND LOWER(session_name) = LOWER($2)
        LIMIT 1
        `,
        [
            schoolId,
            sessionName.trim()
        ]
    );

    return result.rows[0] || null;
}

async function sessionExists(
    schoolId,
    sessionName,
    excludeSessionId = null
) {
    if (
        !schoolId ||
        typeof sessionName !== "string" ||
        !sessionName.trim()
    ) {
        return false;
    }

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM academic_sessions
            WHERE school_id = $1
              AND LOWER(session_name) = LOWER($2)
    `;

    const values = [
        schoolId,
        sessionName.trim()
    ];

    if (
        excludeSessionId !== null &&
        excludeSessionId !== undefined
    ) {
        values.push(excludeSessionId);

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

    return Boolean(
        result.rows[0]?.exists
    );
}

async function findAcademicSessionsBySchool(
    schoolId,
    {
        isActive = null
    } = {}
) {
    let sql = `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
    `;

    const values = [schoolId];

    if (
        isActive !== null &&
        isActive !== undefined
    ) {
        values.push(Boolean(isActive));

        sql += `
            AND is_active = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            start_date DESC NULLS LAST,
            session_name DESC,
            id DESC
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows;
}

async function findCurrentSession(
    schoolId
) {
    const result = await query(
        `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
          AND is_current = TRUE
          AND is_active = TRUE
        ORDER BY
            start_date DESC NULLS LAST,
            id DESC
        LIMIT 1
        `,
        [schoolId]
    );

    return result.rows[0] || null;
}

async function findUpcomingSessions(
    schoolId
) {
    const result = await query(
        `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
          AND is_active = TRUE
          AND start_date > CURRENT_DATE
        ORDER BY
            start_date ASC NULLS LAST,
            session_name ASC,
            id ASC
        `,
        [schoolId]
    );

    return result.rows;
}

async function findCompletedSessions(
    schoolId
) {
    const result = await query(
        `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
          AND end_date < CURRENT_DATE
        ORDER BY
            end_date DESC NULLS LAST,
            session_name DESC,
            id DESC
        `,
        [schoolId]
    );

    return result.rows;
}

async function updateAcademicSession(
    sessionId,
    schoolId,
    {
        sessionName,
        startDate = null,
        endDate = null,
        isCurrent = false,
        isActive = true
    }
) {
    if (
        typeof sessionName !== "string" ||
        !sessionName.trim()
    ) {
        throw new Error(
            "Academic session name is required."
        );
    }

    const name = sessionName.trim();

    const duplicate = await sessionExists(
        schoolId,
        name,
        sessionId
    );

    if (duplicate) {
        throw new Error(
            "An academic session with this name already exists."
        );
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        if (isCurrent) {
            await client.query(
                `
                UPDATE academic_sessions
                SET
                    is_current = FALSE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE school_id = $1
                  AND id <> $2
                `,
                [
                    schoolId,
                    sessionId
                ]
            );
        }

        const result = await client.query(
            `
            UPDATE academic_sessions
            SET
                session_name = $1,
                start_date = $2,
                end_date = $3,
                is_current = $4,
                is_active = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
              AND school_id = $7
            RETURNING *
            `,
            [
                name,
                startDate,
                endDate,
                Boolean(isCurrent),
                Boolean(isActive),
                sessionId,
                schoolId
            ]
        );

        await client.query("COMMIT");

        return result.rows[0] || null;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function renameAcademicSession(
    sessionId,
    schoolId,
    newName
) {
    if (
        typeof newName !== "string" ||
        !newName.trim()
    ) {
        throw new Error(
            "New session name is required."
        );
    }

    const name = newName.trim();

    const duplicate = await sessionExists(
        schoolId,
        name,
        sessionId
    );

    if (duplicate) {
        throw new Error(
            "An academic session with this name already exists."
        );
    }

    const result = await query(
        `
        UPDATE academic_sessions
        SET
            session_name = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND school_id = $3
        RETURNING *
        `,
        [
            name,
            sessionId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

async function activateSession(
    sessionId,
    schoolId
) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const sessionCheck = await client.query(
            `
            SELECT id
            FROM academic_sessions
            WHERE id = $1
              AND school_id = $2
              AND is_active = TRUE
            LIMIT 1
            `,
            [
                sessionId,
                schoolId
            ]
        );

        if (
            sessionCheck.rows.length === 0
        ) {
            await client.query("ROLLBACK");
            return null;
        }

        await client.query(
            `
            UPDATE academic_sessions
            SET
                is_current = FALSE,
                updated_at = CURRENT_TIMESTAMP
            WHERE school_id = $1
              AND id <> $2
            `,
            [
                schoolId,
                sessionId
            ]
        );

        const result = await client.query(
            `
            UPDATE academic_sessions
            SET
                is_current = TRUE,
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
              AND school_id = $2
            RETURNING *
            `,
            [
                sessionId,
                schoolId
            ]
        );

        await client.query("COMMIT");

        return result.rows[0] || null;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function setSessionUpcoming(
    sessionId,
    schoolId
) {
    const result = await query(
        `
        UPDATE academic_sessions
        SET
            is_current = FALSE,
            is_active = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND school_id = $2
        RETURNING *
        `,
        [
            sessionId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

async function completeSession(
    sessionId,
    schoolId
) {
    const result = await query(
        `
        UPDATE academic_sessions
        SET
            is_current = FALSE,
            is_active = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND school_id = $2
        RETURNING *
        `,
        [
            sessionId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

async function updateSessionDates(
    sessionId,
    schoolId,
    startDate,
    endDate
) {
    if (
        startDate &&
        endDate &&
        new Date(startDate) >
            new Date(endDate)
    ) {
        throw new Error(
            "Session start date cannot be later than the end date."
        );
    }

    const result = await query(
        `
        UPDATE academic_sessions
        SET
            start_date = $1,
            end_date = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
          AND school_id = $4
        RETURNING *
        `,
        [
            startDate,
            endDate,
            sessionId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

async function searchAcademicSessions(
    searchTerm,
    schoolId
) {
    const term = String(
        searchTerm || ""
    ).trim();

    const result = await query(
        `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
          AND (
              session_name ILIKE $2
              OR CAST(start_date AS TEXT) ILIKE $2
              OR CAST(end_date AS TEXT) ILIKE $2
          )
        ORDER BY
            start_date DESC NULLS LAST,
            session_name DESC,
            id DESC
        `,
        [
            schoolId,
            `%${term}%`
        ]
    );

    return result.rows;
}

async function deleteAcademicSession(
    sessionId,
    schoolId
) {
    const session =
        await findAcademicSessionById(
            sessionId,
            schoolId
        );

    if (!session) {
        return null;
    }

    if (session.is_current) {
        throw new Error(
            "The current academic session cannot be deleted. Set another session as current first."
        );
    }

    const result = await query(
        `
        DELETE FROM academic_sessions
        WHERE id = $1
          AND school_id = $2
        RETURNING
            id,
            school_id,
            session_name,
            start_date,
            end_date,
            is_current,
            is_active
        `,
        [
            sessionId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

async function getSessionStatistics(
    sessionId,
    schoolId
) {
    const result = await query(
        `
        SELECT
            (
                SELECT COUNT(*)
                FROM student_enrollments se
                WHERE se.academic_session_id = $1
                  AND se.school_id = $2
            ) AS enrolled_students,
            (
                SELECT COUNT(*)
                FROM results r
                WHERE r.academic_session_id = $1
                  AND r.school_id = $2
            ) AS result_records,
            (
                SELECT COUNT(*)
                FROM attendance a
                WHERE a.academic_session_id = $1
                  AND a.school_id = $2
            ) AS attendance_records
        FROM academic_sessions s
        WHERE s.id = $1
          AND s.school_id = $2
        LIMIT 1
        `,
        [
            sessionId,
            schoolId
        ]
    );

    if (!result.rows[0]) {
        return null;
    }

    return {
        enrolledStudents:
            Number(
                result.rows[0]
                    .enrolled_students
            ),
        resultRecords:
            Number(
                result.rows[0]
                    .result_records
            ),
        attendanceRecords:
            Number(
                result.rows[0]
                    .attendance_records
            )
    };
}

async function getSessionWithTerms(
    sessionId,
    schoolId
) {
    const sessionResult = await query(
        `
        SELECT
            id AS session_id,
            school_id,
            session_name,
            start_date AS session_start_date,
            end_date AS session_end_date,
            is_current,
            is_active
        FROM academic_sessions
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
        `,
        [
            sessionId,
            schoolId
        ]
    );

    if (!sessionResult.rows[0]) {
        return null;
    }

    const termsResult = await query(
        `
        SELECT
            id AS term_id,
            school_id,
            academic_session_id,
            term_name,
            term_order,
            start_date AS term_start_date,
            end_date AS term_end_date,
            is_current,
            is_active
        FROM terms
        WHERE school_id = $1
          AND academic_session_id = $2
        ORDER BY
            term_order ASC,
            start_date ASC NULLS LAST,
            id ASC
        `,
        [
            schoolId,
            sessionId
        ]
    );

    return {
        ...sessionResult.rows[0],
        terms: termsResult.rows
    };
}

module.exports = {
    createAcademicSession,
    findAcademicSessionById,
    findAcademicSessionByName,
    sessionExists,
    findAcademicSessionsBySchool,
    findCurrentSession,
    findUpcomingSessions,
    findCompletedSessions,
    updateAcademicSession,
    renameAcademicSession,
    activateSession,
    setSessionUpcoming,
    completeSession,
    updateSessionDates,
    searchAcademicSessions,
    deleteAcademicSession,
    getSessionStatistics,
    getSessionWithTerms
};