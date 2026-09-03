```javascript
"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Term Model
|--------------------------------------------------------------------------
| Compatible with the current PostgreSQL schema.
|--------------------------------------------------------------------------
|
| terms:
| id
| school_id
| term_name
| term_order
| start_date
| end_date
| is_current
| is_active
| created_at
|
| IMPORTANT:
| The current database schema does NOT link terms directly to
| academic_sessions. Terms are school-level records.
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Create Term
|--------------------------------------------------------------------------
*/

async function createTerm({
    schoolId,
    sessionId = null,
    termName,
    termCode = null,
    startDate = null,
    endDate = null,
    description = null,
    displayOrder = 0,
    termOrder = null,
    status = "upcoming",
    isCurrent = false,
    isActive = true
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!termName || !termName.trim()) {
        throw new Error("Term name is required.");
    }

    const order =
        termOrder !== null
            ? termOrder
            : Number(displayOrder) || 0;

    const current =
        isCurrent ||
        String(status).toLowerCase() === "active";

    if (current) {
        await query(
            `
                UPDATE terms
                SET is_current = FALSE
                WHERE school_id = $1
            `,
            [schoolId]
        );
    }

    const sql = `
        INSERT INTO terms (
            school_id,
            term_name,
            term_order,
            start_date,
            end_date,
            is_current,
            is_active
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7
        )
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        termName.trim(),
        order,
        startDate,
        endDate,
        current,
        isActive
    ]);

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
        SELECT *
        FROM terms
        WHERE id = $1
    `;

    const values = [termId];

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
        WHERE school_id = $1
          AND LOWER(term_name) = LOWER($2)
        LIMIT 1
    `;

    const result = await query(sql, [
        schoolId,
        termName.trim()
    ]);

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
            WHERE school_id = $1
              AND LOWER(term_name) = LOWER($2)
    `;

    const values = [
        schoolId,
        termName.trim()
    ];

    if (excludeTermId) {
        values.push(excludeTermId);

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
| Find Terms By Session
|--------------------------------------------------------------------------
| Terms are not linked to academic_sessions in the current schema.
| The sessionId parameter is retained for controller compatibility.
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
        SELECT *
        FROM terms
        WHERE school_id = $1
    `;

    const values = [schoolId];

    if (!includeInactive) {
        sql += `
            AND is_active = TRUE
        `;
    }

    sql += `
        ORDER BY
            term_order ASC,
            start_date ASC NULLS LAST,
            term_name ASC
    `;

    const result = await query(sql, values);

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
        status = null,
        isActive = null
    } = {}
) {
    let sql = `
        SELECT *
        FROM terms
        WHERE school_id = $1
    `;

    const values = [schoolId];

    if (isActive !== null) {
        values.push(isActive);

        sql += `
            AND is_active = $${values.length}
        `;
    } else if (status) {
        const normalizedStatus =
            String(status).toLowerCase();

        if (normalizedStatus === "inactive") {
            sql += `
                AND is_active = FALSE
            `;
        } else {
            sql += `
                AND is_active = TRUE
            `;
        }
    }

    sql += `
        ORDER BY
            term_order ASC,
            start_date ASC NULLS LAST,
            term_name ASC
    `;

    const result = await query(sql, values);

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
    const sql = `
        SELECT *
        FROM terms
        WHERE school_id = $1
          AND is_current = TRUE
          AND is_active = TRUE
        ORDER BY
            term_order ASC
        LIMIT 1
    `;

    const result = await query(sql, [
        schoolId
    ]);

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
    const sql = `
        SELECT *
        FROM terms
        WHERE school_id = $1
          AND is_active = TRUE
          AND is_current = FALSE
          AND (
              start_date IS NULL
              OR start_date > CURRENT_DATE
          )
        ORDER BY
            start_date ASC NULLS LAST,
            term_order ASC
    `;

    const result = await query(sql, [
        schoolId
    ]);

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
    const sql = `
        SELECT *
        FROM terms
        WHERE school_id = $1
          AND end_date IS NOT NULL
          AND end_date < CURRENT_DATE
        ORDER BY
            end_date DESC NULLS LAST,
            term_order DESC
    `;

    const result = await query(sql, [
        schoolId
    ]);

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
    data
) {
    const allowedFields = {
        termName: "term_name",
        termOrder: "term_order",
        displayOrder: "term_order",
        startDate: "start_date",
        endDate: "end_date",
        isCurrent: "is_current",
        isActive: "is_active"
    };

    const updates = [];
    const values = [];

    for (const key of Object.keys(data || {})) {
        if (
            allowedFields[key] &&
            data[key] !== undefined
        ) {
            values.push(data[key]);

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

    if (
        data.isCurrent === true ||
        String(data.status || "").toLowerCase() === "active"
    ) {
        await query(
            `
                UPDATE terms
                SET is_current = FALSE
                WHERE school_id = $1
                  AND id <> $2
            `,
            [
                schoolId,
                termId
            ]
        );

        if (
            !updates.some(
                item => item.startsWith("is_current")
            )
        ) {
            values.push(true);

            updates.push(
                `is_current = $${values.length}`
            );
        }
    }

    values.push(termId);
    const termIdPosition = values.length;

    values.push(schoolId);
    const schoolIdPosition = values.length;

    const sql = `
        UPDATE terms
        SET
            ${updates.join(", ")}
        WHERE id = $${termIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
    `;

    const result = await query(sql, values);

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
        SET term_name = $1
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result = await query(sql, [
        newName.trim(),
        termId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Activate Term
|--------------------------------------------------------------------------
*/

async function activateTerm(
    termId,
    schoolId
) {
    const term = await findTermById(
        termId,
        schoolId
    );

    if (!term) {
        return null;
    }

    await query(
        `
            UPDATE terms
            SET is_current = FALSE
            WHERE school_id = $1
        `,
        [schoolId]
    );

    const result = await query(
        `
            UPDATE terms
            SET
                is_current = TRUE,
                is_active = TRUE
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
            is_current = FALSE,
            is_active = TRUE
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        termId,
        schoolId
    ]);

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
            is_current = FALSE,
            is_active = FALSE
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        termId,
        schoolId
    ]);

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
            end_date = $2
        WHERE id = $3
          AND school_id = $4
        RETURNING *
    `;

    const result = await query(sql, [
        startDate,
        endDate,
        termId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Update Term Order
|--------------------------------------------------------------------------
*/

async function updateTermOrder(
    termId,
    schoolId,
    displayOrder
) {
    const sql = `
        UPDATE terms
        SET term_order = $1
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result = await query(sql, [
        displayOrder,
        termId,
        schoolId
    ]);

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

            CONCAT(
                t.term_order,
                ' - ',
                t.term_name
            ) AS display_name

        FROM terms t

        WHERE t.school_id = $1
          AND (
              t.term_name ILIKE $2
              OR CAST(t.term_order AS TEXT) ILIKE $2
          )

        ORDER BY
            t.term_order ASC,
            t.term_name ASC
    `;

    const result = await query(sql, [
        schoolId,
        `%${searchTerm}%`
    ]);

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
    const existsResult = await query(
        `
            SELECT id
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

    if (!existsResult.rows[0]) {
        return null;
    }

    const result = await query(
        `
            SELECT
                (
                    SELECT COUNT(*)
                    FROM results r
                    WHERE r.term_id = $1
                      AND r.school_id = $2
                ) AS result_records,

                (
                    SELECT COUNT(*)
                    FROM attendance a
                    WHERE a.term_id = $1
                      AND a.school_id = $2
                ) AS attendance_records
        `,
        [
            termId,
            schoolId
        ]
    );

    const row = result.rows[0];

    return {
        enrolledStudents: 0,
        resultRecords: Number(
            row.result_records
        ),
        attendanceRecords: Number(
            row.attendance_records
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
            term_name,
            term_order,
            start_date,
            end_date,
            is_current,
            is_active
    `;

    const result = await query(sql, [
        termId,
        schoolId
    ]);

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
