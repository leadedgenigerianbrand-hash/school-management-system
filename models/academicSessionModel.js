const { query, pool } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Academic Session Model
|--------------------------------------------------------------------------
| Handles academic sessions for each school.
|
| Database fields:
| id
| school_id
| session_name
| start_date
| end_date
| is_current
| is_active
| created_at
| updated_at
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| CREATE ACADEMIC SESSION
|--------------------------------------------------------------------------
*/

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

    if (!sessionName || !sessionName.trim()) {
        throw new Error("Academic session name is required.");
    }

    const existing = await findAcademicSessionByName(
        schoolId,
        sessionName
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
                sessionName.trim(),
                startDate,
                endDate,
                isCurrent,
                isActive
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

/*
|--------------------------------------------------------------------------
| FIND SESSION BY ID
|--------------------------------------------------------------------------
*/

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
| FIND SESSION BY NAME
|--------------------------------------------------------------------------
*/

async function findAcademicSessionByName(
    schoolId,
    sessionName
) {
    const sql = `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
          AND LOWER(session_name) = LOWER($2)
        LIMIT 1
    `;

    const result = await query(sql, [
        schoolId,
        sessionName.trim()
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| CHECK WHETHER SESSION EXISTS
|--------------------------------------------------------------------------
*/

async function sessionExists(
    schoolId,
    sessionName,
    excludeSessionId = null
) {
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

    if (excludeSessionId) {
        values.push(excludeSessionId);

        sql += `
            AND id <> $${values.length}
        `;
    }

    sql += `
        ) AS exists
    `;

    const result = await query(sql, values);

    return result.rows[0].exists;
}

/*
|--------------------------------------------------------------------------
| FIND ALL SESSIONS FOR A SCHOOL
|--------------------------------------------------------------------------
*/

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

    if (isActive !== null && isActive !== undefined) {
        values.push(isActive);

        sql += `
            AND is_active = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            start_date DESC NULLS LAST,
            session_name DESC
    `;

    const result = await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| FIND CURRENT SESSION
|--------------------------------------------------------------------------
*/

async function findCurrentSession(schoolId) {
    const sql = `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
          AND is_current = TRUE
          AND is_active = TRUE
        ORDER BY start_date DESC NULLS LAST
        LIMIT 1
    `;

    const result = await query(sql, [schoolId]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| FIND UPCOMING SESSIONS
|--------------------------------------------------------------------------
*/

async function findUpcomingSessions(schoolId) {
    const sql = `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
          AND is_active = TRUE
          AND start_date > CURRENT_DATE
        ORDER BY
            start_date ASC NULLS LAST,
            session_name ASC
    `;

    const result = await query(sql, [schoolId]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| FIND COMPLETED SESSIONS
|--------------------------------------------------------------------------
*/

async function findCompletedSessions(schoolId) {
    const sql = `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
          AND end_date < CURRENT_DATE
        ORDER BY
            end_date DESC NULLS LAST,
            session_name DESC
    `;

    const result = await query(sql, [schoolId]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| UPDATE ACADEMIC SESSION
|--------------------------------------------------------------------------
*/

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
    if (!sessionName || !sessionName.trim()) {
        throw new Error(
            "Academic session name is required."
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
                sessionName.trim(),
                startDate,
                endDate,
                isCurrent,
                isActive,
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

/*
|--------------------------------------------------------------------------
| RENAME SESSION
|--------------------------------------------------------------------------
*/

async function renameAcademicSession(
    sessionId,
    schoolId,
    newName
) {
    if (!newName || !newName.trim()) {
        throw new Error(
            "New session name is required."
        );
    }

    const sql = `
        UPDATE academic_sessions
        SET
            session_name = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result = await query(sql, [
        newName.trim(),
        sessionId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| ACTIVATE / MAKE CURRENT SESSION
|--------------------------------------------------------------------------
*/

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

        if (sessionCheck.rows.length === 0) {
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

/*
|--------------------------------------------------------------------------
| SET SESSION UPCOMING
|--------------------------------------------------------------------------
*/

async function setSessionUpcoming(
    sessionId,
    schoolId
) {
    const sql = `
        UPDATE academic_sessions
        SET
            is_current = FALSE,
            is_active = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        sessionId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| COMPLETE SESSION
|--------------------------------------------------------------------------
*/

async function completeSession(
    sessionId,
    schoolId
) {
    const sql = `
        UPDATE academic_sessions
        SET
            is_current = FALSE,
            is_active = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        sessionId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| UPDATE SESSION DATES
|--------------------------------------------------------------------------
*/

async function updateSessionDates(
    sessionId,
    schoolId,
    startDate,
    endDate
) {
    const sql = `
        UPDATE academic_sessions
        SET
            start_date = $1,
            end_date = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
          AND school_id = $4
        RETURNING *
    `;

    const result = await query(sql, [
        startDate,
        endDate,
        sessionId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| SEARCH ACADEMIC SESSIONS
|--------------------------------------------------------------------------
*/

async function searchAcademicSessions(
    searchTerm,
    schoolId
) {
    const sql = `
        SELECT *
        FROM academic_sessions
        WHERE school_id = $1
          AND session_name ILIKE $2
        ORDER BY
            start_date DESC NULLS LAST,
            session_name DESC
    `;

    const result = await query(sql, [
        schoolId,
        `%${String(searchTerm || "").trim()}%`
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| DELETE ACADEMIC SESSION
|--------------------------------------------------------------------------
*/

async function deleteAcademicSession(
    sessionId,
    schoolId
) {
    const sql = `
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
    `;

    const result = await query(sql, [
        sessionId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| GET SESSION STATISTICS
|--------------------------------------------------------------------------
*/

async function getSessionStatistics(
    sessionId,
    schoolId
) {
    const sql = `
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
    `;

    const result = await query(sql, [
        sessionId,
        schoolId
    ]);

    if (!result.rows[0]) {
        return null;
    }

    return {
        enrolledStudents: Number(
            result.rows[0].enrolled_students
        ),
        resultRecords: Number(
            result.rows[0].result_records
        ),
        attendanceRecords: Number(
            result.rows[0].attendance_records
        )
    };
}

/*
|--------------------------------------------------------------------------
| GET SESSION WITH TERMS
|--------------------------------------------------------------------------
*/

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
        return [];
    }

    const termsResult = await query(
        `
            SELECT
                id AS term_id,
                school_id,
                term_name,
                term_order,
                start_date AS term_start_date,
                end_date AS term_end_date,
                is_current,
                is_active
            FROM terms
            WHERE school_id = $1
            ORDER BY term_order ASC
        `,
        [
            schoolId
        ]
    );

    return termsResult.rows.map(term => ({
        ...sessionResult.rows[0],
        ...term
    }));
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

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