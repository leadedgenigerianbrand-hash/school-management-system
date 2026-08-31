const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Term Model
|--------------------------------------------------------------------------
|
| Manages academic terms within an academic session.
|
| Example:
|
| 2026/2027
|   ├── First Term
|   ├── Second Term
|   └── Third Term
|
| The school can rename terms if it uses another naming system.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Term
|--------------------------------------------------------------------------
*/

async function createTerm({
    schoolId,
    sessionId,
    termName,
    termCode = null,
    startDate = null,
    endDate = null,
    description = null,
    displayOrder = 0,
    status = "upcoming"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!sessionId) {
        throw new Error("Academic session ID is required.");
    }

    if (!termName || !termName.trim()) {
        throw new Error("Term name is required.");
    }

    const sql = `
        INSERT INTO terms (
            school_id,
            session_id,
            term_name,
            term_code,
            start_date,
            end_date,
            description,
            display_order,
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
            $9
        )
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            schoolId,
            sessionId,
            termName.trim(),
            termCode,
            startDate,
            endDate,
            description,
            displayOrder,
            status
        ]
    );

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Term By ID
|--------------------------------------------------------------------------
*/

async function findTermById(
    termId,
    schoolId = null
) {

    let sql = `
        SELECT

            t.*,

            s.session_name,

            s.session_code

        FROM terms t

        INNER JOIN academic_sessions s
            ON s.id = t.session_id

        WHERE t.id = $1
    `;

    const values = [
        termId
    ];


    if (schoolId) {

        sql += `
            AND t.school_id = $2
        `;

        values.push(
            schoolId
        );
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
| Find Term By Name
|--------------------------------------------------------------------------
*/

async function findTermByName(
    sessionId,
    termName,
    schoolId
) {

    const sql = `
        SELECT *

        FROM terms

        WHERE session_id = $1

          AND school_id = $2

          AND LOWER(term_name) = LOWER($3)

        LIMIT 1
    `;

    const result = await query(
        sql,
        [
            sessionId,
            schoolId,
            termName.trim()
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Check Whether Term Exists
|--------------------------------------------------------------------------
*/

async function termExists(
    sessionId,
    termName,
    schoolId,
    excludeTermId = null
) {

    let sql = `
        SELECT EXISTS (

            SELECT 1

            FROM terms

            WHERE session_id = $1

              AND school_id = $2

              AND LOWER(term_name) = LOWER($3)
    `;

    const values = [
        sessionId,
        schoolId,
        termName.trim()
    ];


    if (excludeTermId) {

        sql += `
            AND id <> $4
        `;

        values.push(
            excludeTermId
        );
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
| Find All Terms For A Session
|--------------------------------------------------------------------------
*/

async function findTermsBySession(
    sessionId,
    schoolId,
    {
        includeInactive = false
    } = {}
) {

    let sql = `
        SELECT

            t.*,

            s.session_name,

            s.session_code

        FROM terms t

        INNER JOIN academic_sessions s
            ON s.id = t.session_id

        WHERE t.session_id = $1

          AND t.school_id = $2
    `;


    if (!includeInactive) {

        sql += `
            AND t.status <> 'inactive'
        `;
    }


    sql += `
        ORDER BY

            t.display_order ASC,

            t.start_date ASC NULLS LAST,

            t.term_name ASC
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
| Find All Terms For A School
|--------------------------------------------------------------------------
*/

async function findTermsBySchool(
    schoolId,
    {
        status = null
    } = {}
) {

    let sql = `
        SELECT

            t.*,

            s.session_name,

            s.session_code

        FROM terms t

        INNER JOIN academic_sessions s
            ON s.id = t.session_id

        WHERE t.school_id = $1
    `;

    const values = [
        schoolId
    ];


    if (status) {

        sql += `
            AND t.status = $2
        `;

        values.push(
            status
        );
    }


    sql += `
        ORDER BY

            s.start_date DESC NULLS LAST,

            t.display_order ASC,

            t.start_date ASC NULLS LAST
    `;


    const result = await query(
        sql,
        values
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Find Current Term
|--------------------------------------------------------------------------
*/

async function findCurrentTerm(
    schoolId,
    sessionId = null
) {

    let sql = `
        SELECT

            t.*,

            s.session_name,

            s.session_code

        FROM terms t

        INNER JOIN academic_sessions s
            ON s.id = t.session_id

        WHERE t.school_id = $1

          AND t.status = 'active'
    `;

    const values = [
        schoolId
    ];


    if (sessionId) {

        sql += `
            AND t.session_id = $2
        `;

        values.push(
            sessionId
        );
    }


    sql += `
        ORDER BY

            t.start_date DESC NULLS LAST

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
| Find Upcoming Terms
|--------------------------------------------------------------------------
*/

async function findUpcomingTerms(
    schoolId,
    sessionId = null
) {

    let sql = `
        SELECT

            t.*,

            s.session_name

        FROM terms t

        INNER JOIN academic_sessions s
            ON s.id = t.session_id

        WHERE t.school_id = $1

          AND t.status = 'upcoming'
    `;

    const values = [
        schoolId
    ];


    if (sessionId) {

        sql += `
            AND t.session_id = $2
        `;

        values.push(
            sessionId
        );
    }


    sql += `
        ORDER BY

            t.start_date ASC NULLS LAST
    `;


    const result = await query(
        sql,
        values
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Find Completed Terms
|--------------------------------------------------------------------------
*/

async function findCompletedTerms(
    schoolId,
    sessionId = null
) {

    let sql = `
        SELECT

            t.*,

            s.session_name

        FROM terms t

        INNER JOIN academic_sessions s
            ON s.id = t.session_id

        WHERE t.school_id = $1

          AND t.status = 'completed'
    `;

    const values = [
        schoolId
    ];


    if (sessionId) {

        sql += `
            AND t.session_id = $2
        `;

        values.push(
            sessionId
        );
    }


    sql += `
        ORDER BY

            t.end_date DESC NULLS LAST
    `;


    const result = await query(
        sql,
        values
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Update Term
|--------------------------------------------------------------------------
*/

async function updateTerm(
    termId,
    schoolId,
    {
        sessionId,
        termName,
        termCode = null,
        startDate = null,
        endDate = null,
        description = null,
        displayOrder = 0,
        status = "upcoming"
    }
) {

    if (!sessionId) {
        throw new Error(
            "Academic session ID is required."
        );
    }

    if (!termName || !termName.trim()) {
        throw new Error("Term name is required.");
    }


    const sql = `
        UPDATE terms

        SET

            session_id = $1,

            term_name = $2,

            term_code = $3,

            start_date = $4,

            end_date = $5,

            description = $6,

            display_order = $7,

            status = $8,

            updated_at = NOW()

        WHERE id = $9

          AND school_id = $10

        RETURNING *
    `;

    const result = await query(
        sql,
        [
            sessionId,
            termName.trim(),
            termCode,
            startDate,
            endDate,
            description,
            displayOrder,
            status,
            termId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Rename Term
|--------------------------------------------------------------------------
*/

async function renameTerm(
    termId,
    schoolId,
    newName
) {

    if (!newName || !newName.trim()) {
        throw new Error(
            "New term name is required."
        );
    }


    const sql = `
        UPDATE terms

        SET

            term_name = $1,

            updated_at = NOW()

        WHERE id = $2

          AND school_id = $3

        RETURNING *
    `;

    const result = await query(
        sql,
        [
            newName.trim(),
            termId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Activate Term
|--------------------------------------------------------------------------
|
| Only one term should normally be active within a session.
|--------------------------------------------------------------------------
*/

async function activateTerm(
    termId,
    schoolId
) {

    const currentTerm = await query(
        `
            SELECT session_id

            FROM terms

            WHERE id = $1

              AND school_id = $2

            LIMIT 1
        `,
        [
            termId,
            schoolId
        ]
    );


    if (!currentTerm.rows[0]) {
        return null;
    }


    const sessionId =
        currentTerm.rows[0].session_id;


    await query(
        `
            UPDATE terms

            SET

                status = 'completed',

                updated_at = NOW()

            WHERE school_id = $1

              AND session_id = $2

              AND status = 'active'

              AND id <> $3
        `,
        [
            schoolId,
            sessionId,
            termId
        ]
    );


    const result = await query(
        `
            UPDATE terms

            SET

                status = 'active',

                updated_at = NOW()

            WHERE id = $1

              AND school_id = $2

            RETURNING *
        `,
        [
            termId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Set Term As Upcoming
|--------------------------------------------------------------------------
*/

async function setTermUpcoming(
    termId,
    schoolId
) {

    const sql = `
        UPDATE terms

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
            termId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Complete Term
|--------------------------------------------------------------------------
*/

async function completeTerm(
    termId,
    schoolId
) {

    const sql = `
        UPDATE terms

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
            termId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Update Term Dates
|--------------------------------------------------------------------------
*/

async function updateTermDates(
    termId,
    schoolId,
    startDate,
    endDate
) {

    const sql = `
        UPDATE terms

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
            termId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Update Display Order
|--------------------------------------------------------------------------
*/

async function updateTermOrder(
    termId,
    schoolId,
    displayOrder
) {

    const sql = `
        UPDATE terms

        SET

            display_order = $1,

            updated_at = NOW()

        WHERE id = $2

          AND school_id = $3

        RETURNING *
    `;

    const result = await query(
        sql,
        [
            displayOrder,
            termId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Search Terms
|--------------------------------------------------------------------------
*/

async function searchTerms(
    searchTerm,
    schoolId
) {

    const sql = `
        SELECT

            t.*,

            s.session_name,

            CONCAT(
                s.session_name,
                ' - ',
                t.term_name
            ) AS display_name

        FROM terms t

        INNER JOIN academic_sessions s
            ON s.id = t.session_id

        WHERE t.school_id = $1

          AND (
              t.term_name ILIKE $2

              OR t.term_code ILIKE $2

              OR t.description ILIKE $2

              OR s.session_name ILIKE $2
          )

        ORDER BY

            s.start_date DESC NULLS LAST,

            t.display_order ASC
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
| Get Term Statistics
|--------------------------------------------------------------------------
*/

async function getTermStatistics(
    termId,
    schoolId
) {

    const sql = `
        SELECT

            (
                SELECT COUNT(*)

                FROM student_enrollments se

                WHERE se.term_id = $1

            ) AS enrolled_students,

            (
                SELECT COUNT(*)

                FROM results r

                WHERE r.term_id = $1

            ) AS result_records,

            (
                SELECT COUNT(*)

                FROM attendance a

                WHERE a.term_id = $1

            ) AS attendance_records

        WHERE EXISTS (

            SELECT 1

            FROM terms t

            WHERE t.id = $1

              AND t.school_id = $2
        )
    `;

    const result = await query(
        sql,
        [
            termId,
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
| Delete Term
|--------------------------------------------------------------------------
*/

async function deleteTerm(
    termId,
    schoolId
) {

    const sql = `
        DELETE FROM terms

        WHERE id = $1

          AND school_id = $2

        RETURNING

            id,

            session_id,

            term_name,

            status
    `;

    const result = await query(
        sql,
        [
            termId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    createTerm,

    findTermById,

    findTermByName,

    termExists,

    findTermsBySession,

    findTermsBySchool,

    findCurrentTerm,

    findUpcomingTerms,

    findCompletedTerms,

    updateTerm,

    renameTerm,

    activateTerm,

    setTermUpcoming,

    completeTerm,

    updateTermDates,

    updateTermOrder,

    searchTerms,

    getTermStatistics,

    deleteTerm

};