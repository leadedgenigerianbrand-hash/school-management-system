const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Academic Session Model
|--------------------------------------------------------------------------
|
| Handles academic sessions for each school.
|
| Examples:
|
| 2025/2026
| 2026/2027
| 2027/2028
|
| Every academic session belongs to one school.
|
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
    sessionCode = null,
    startDate = null,
    endDate = null,
    description = null,
    status = "upcoming"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!sessionName || !sessionName.trim()) {
        throw new Error(
            "Academic session name is required."
        );
    }


    const sql = `
        INSERT INTO academic_sessions (
            school_id,
            session_name,
            session_code,
            start_date,
            end_date,
            description,
            status
        )

        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
        )

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            sessionName.trim(),
            sessionCode,
            startDate,
            endDate,
            description,
            status
        ]
    );


    return result.rows[0];
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


    const values = [
        sessionId
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


    const result = await query(
        sql,
        [
            schoolId,
            sessionName.trim()
        ]
    );


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


    const result = await query(
        sql,
        values
    );


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
        status = null
    } = {}
) {

    let sql = `
        SELECT *

        FROM academic_sessions

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


    sql += `
        ORDER BY

            start_date DESC NULLS LAST,

            session_name DESC
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| FIND CURRENT / ACTIVE SESSION
|--------------------------------------------------------------------------
*/

async function findCurrentSession(
    schoolId
) {

    const sql = `
        SELECT *

        FROM academic_sessions

        WHERE school_id = $1

          AND status = 'active'

        ORDER BY

            start_date DESC NULLS LAST

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
| FIND UPCOMING SESSIONS
|--------------------------------------------------------------------------
*/

async function findUpcomingSessions(
    schoolId
) {

    const sql = `
        SELECT *

        FROM academic_sessions

        WHERE school_id = $1

          AND status = 'upcoming'

        ORDER BY

            start_date ASC NULLS LAST,

            session_name ASC
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| FIND COMPLETED SESSIONS
|--------------------------------------------------------------------------
*/

async function findCompletedSessions(
    schoolId
) {

    const sql = `
        SELECT *

        FROM academic_sessions

        WHERE school_id = $1

          AND status = 'completed'

        ORDER BY

            end_date DESC NULLS LAST,

            session_name DESC
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


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
        sessionCode = null,
        startDate = null,
        endDate = null,
        description = null,
        status = "upcoming"
    }
) {

    if (!sessionName || !sessionName.trim()) {
        throw new Error(
            "Academic session name is required."
        );
    }


    const sql = `
        UPDATE academic_sessions

        SET

            session_name = $1,

            session_code = $2,

            start_date = $3,

            end_date = $4,

            description = $5,

            status = $6,

            updated_at = NOW()

        WHERE id = $7

          AND school_id = $8

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            sessionName.trim(),
            sessionCode,
            startDate,
            endDate,
            description,
            status,
            sessionId,
            schoolId
        ]
    );


    return result.rows[0] || null;
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

            updated_at = NOW()

        WHERE id = $2

          AND school_id = $3

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            newName.trim(),
            sessionId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| ACTIVATE SESSION
|--------------------------------------------------------------------------
|
| Only one active session should normally exist for a school.
|
| IMPORTANT:
| This operation uses a database transaction so that both changes
| succeed or fail together.
|
|--------------------------------------------------------------------------
*/

async function activateSession(
    sessionId,
    schoolId
) {

    const client = await require("../config/database")
        .pool
        .connect();


    try {

        await client.query("BEGIN");


        /*
        Check that the requested session belongs
        to the requested school.
        */

        const sessionCheck = await client.query(
            `
                SELECT id

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


        if (sessionCheck.rows.length === 0) {

            await client.query("ROLLBACK");

            return null;
        }


        /*
        Complete any currently active session.
        */

        await client.query(
            `
                UPDATE academic_sessions

                SET

                    status = 'completed',

                    updated_at = NOW()

                WHERE school_id = $1

                  AND status = 'active'

                  AND id <> $2
            `,
            [
                schoolId,
                sessionId
            ]
        );


        /*
        Activate the requested session.
        */

        const result = await client.query(
            `
                UPDATE academic_sessions

                SET

                    status = 'active',

                    updated_at = NOW()

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
| SET SESSION AS UPCOMING
|--------------------------------------------------------------------------
*/

async function setSessionUpcoming(
    sessionId,
    schoolId
) {

    const sql = `
        UPDATE academic_sessions

        SET

            status = 'upcoming',

            updated_at = NOW()

        WHERE id = $1

          AND school_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            sessionId,
            schoolId
        ]
    );


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

            status = 'completed',

            updated_at = NOW()

        WHERE id = $1

          AND school_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            sessionId,
            schoolId
        ]
    );


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

            updated_at = NOW()

        WHERE id = $3

          AND school_id = $4

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            startDate,
            endDate,
            sessionId,
            schoolId
        ]
    );


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

          AND (
                session_name ILIKE $2

                OR session_code ILIKE $2

                OR description ILIKE $2
          )

        ORDER BY

            start_date DESC NULLS LAST,

            session_name DESC
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

            session_name,

            status
    `;


    const result = await query(
        sql,
        [
            sessionId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| GET SESSION STATISTICS
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The database schema uses:
|
| academic_session_id
|
| in:
|
| - student_enrollments
| - results
| - attendance
|
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
            ) AS enrolled_students,


            (
                SELECT COUNT(*)

                FROM results r

                WHERE r.academic_session_id = $1
            ) AS result_records,


            (
                SELECT COUNT(*)

                FROM attendance a

                WHERE a.academic_session_id = $1
            ) AS attendance_records


        WHERE EXISTS (

            SELECT 1

            FROM academic_sessions s

            WHERE s.id = $1

              AND s.school_id = $2
        )
    `;


    const result = await query(
        sql,
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
                result.rows[0].enrolled_students
            ),

        resultRecords:
            Number(
                result.rows[0].result_records
            ),

        attendanceRecords:
            Number(
                result.rows[0].attendance_records
            )

    };
}


/*
|--------------------------------------------------------------------------
| GET SESSION WITH TERMS
|--------------------------------------------------------------------------
|
| The terms table is linked using:
|
| academic_session_id
|
|--------------------------------------------------------------------------
*/

async function getSessionWithTerms(
    sessionId,
    schoolId
) {

    const sql = `
        SELECT

            s.id AS session_id,

            s.session_name,

            s.session_code,

            s.start_date AS session_start_date,

            s.end_date AS session_end_date,

            s.status AS session_status,


            t.id AS term_id,

            t.term_name,

            t.term_code,

            t.start_date AS term_start_date,

            t.end_date AS term_end_date,

            t.status AS term_status


        FROM academic_sessions s

        LEFT JOIN terms t

            ON t.academic_session_id = s.id


        WHERE s.id = $1

          AND s.school_id = $2


        ORDER BY

            t.start_date ASC NULLS LAST
    `;


    const result = await query(
        sql,
        [
            sessionId,
            schoolId
        ]
    );


    return result.rows;
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

