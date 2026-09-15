"use strict";

const {
    query,
    pool
} = require("../config/database");

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

    if (
        typeof termName !== "string" ||
        !termName.trim()
    ) {
        throw new Error("Term name is required.");
    }

    if (
        startDate &&
        endDate &&
        new Date(startDate) >
            new Date(endDate)
    ) {
        throw new Error(
            "Term start date cannot be later than the end date."
        );
    }

    const normalizedName =
        termName.trim();

    const existing =
        await findTermByName(
            sessionId,
            normalizedName,
            schoolId
        );

    if (existing) {
        throw new Error(
            "A term with this name already exists for this school."
        );
    }

    const order =
        termOrder !== null &&
        termOrder !== undefined
            ? Number(termOrder)
            : Number(displayOrder) || 0;

    const normalizedStatus =
        String(status || "")
            .trim()
            .toLowerCase();

    const current =
        Boolean(isCurrent) ||
        normalizedStatus === "active" ||
        normalizedStatus === "current";

    const client =
        await pool.connect();

    try {
        await client.query("BEGIN");

        if (current) {
            await client.query(
                `
                UPDATE terms
                SET is_current = FALSE
                WHERE school_id = $1
                `,
                [schoolId]
            );
        }

        const result =
            await client.query(
                `
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
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7
                )
                RETURNING *
                `,
                [
                    schoolId,
                    normalizedName,
                    order,
                    startDate,
                    endDate,
                    current,
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

    const result =
        await query(
            sql,
            values
        );

    return result.rows[0] || null;
}

async function findTermByName(
    sessionId,
    termName,
    schoolId
) {
    if (
        !schoolId ||
        typeof termName !== "string" ||
        !termName.trim()
    ) {
        return null;
    }

    const result =
        await query(
            `
            SELECT *
            FROM terms
            WHERE school_id = $1
              AND LOWER(term_name) = LOWER($2)
            LIMIT 1
            `,
            [
                schoolId,
                termName.trim()
            ]
        );

    return result.rows[0] || null;
}

async function termExists(
    sessionId,
    termName,
    schoolId,
    excludeTermId = null
) {
    if (
        !schoolId ||
        typeof termName !== "string" ||
        !termName.trim()
    ) {
        return false;
    }

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

    if (
        excludeTermId !== null &&
        excludeTermId !== undefined
    ) {
        values.push(excludeTermId);

        sql += `
            AND id <> $${values.length}
        `;
    }

    sql += `
        ) AS exists
    `;

    const result =
        await query(
            sql,
            values
        );

    return Boolean(
        result.rows[0]?.exists
    );
}

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
            term_name ASC,
            id ASC
    `;

    const result =
        await query(
            sql,
            values
        );

    return result.rows;
}

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

    if (
        isActive !== null &&
        isActive !== undefined
    ) {
        values.push(Boolean(isActive));

        sql += `
            AND is_active = $${values.length}
        `;
    }

    if (status) {
        const normalizedStatus =
            String(status)
                .trim()
                .toLowerCase();

        if (
            normalizedStatus === "inactive"
        ) {
            sql += `
                AND is_active = FALSE
            `;
        }

        if (
            normalizedStatus === "active"
        ) {
            sql += `
                AND is_active = TRUE
            `;
        }

        if (
            normalizedStatus === "current"
        ) {
            sql += `
                AND is_current = TRUE
                AND is_active = TRUE
            `;
        }

        if (
            normalizedStatus === "upcoming"
        ) {
            sql += `
                AND is_active = TRUE
                AND is_current = FALSE
                AND (
                    start_date IS NULL
                    OR start_date > CURRENT_DATE
                )
            `;
        }

        if (
            normalizedStatus === "completed"
        ) {
            sql += `
                AND end_date IS NOT NULL
                AND end_date < CURRENT_DATE
            `;
        }
    }

    sql += `
        ORDER BY
            term_order ASC,
            start_date ASC NULLS LAST,
            term_name ASC,
            id ASC
    `;

    const result =
        await query(
            sql,
            values
        );

    return result.rows;
}

async function findCurrentTerm(
    schoolId,
    sessionId = null
) {
    const result =
        await query(
            `
            SELECT *
            FROM terms
            WHERE school_id = $1
              AND is_current = TRUE
              AND is_active = TRUE
            ORDER BY
                term_order ASC,
                start_date ASC NULLS LAST,
                id ASC
            LIMIT 1
            `,
            [schoolId]
        );

    return result.rows[0] || null;
}

async function findUpcomingTerms(
    schoolId,
    sessionId = null
) {
    const result =
        await query(
            `
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
                term_order ASC,
                term_name ASC,
                id ASC
            `,
            [schoolId]
        );

    return result.rows;
}

async function findCompletedTerms(
    schoolId,
    sessionId = null
) {
    const result =
        await query(
            `
            SELECT *
            FROM terms
            WHERE school_id = $1
              AND end_date IS NOT NULL
              AND end_date < CURRENT_DATE
            ORDER BY
                end_date DESC NULLS LAST,
                term_order DESC,
                term_name DESC,
                id DESC
            `,
            [schoolId]
        );

    return result.rows;
}

async function updateTerm(
    termId,
    schoolId,
    data = {}
) {
    if (
        data.termName !== undefined &&
        (
            typeof data.termName !== "string" ||
            !data.termName.trim()
        )
    ) {
        throw new Error(
            "Term name is required."
        );
    }

    if (
        data.startDate &&
        data.endDate &&
        new Date(data.startDate) >
            new Date(data.endDate)
    ) {
        throw new Error(
            "Term start date cannot be later than the end date."
        );
    }

    if (
        data.termName !== undefined
    ) {
        const duplicate =
            await termExists(
                null,
                data.termName,
                schoolId,
                termId
            );

        if (duplicate) {
            throw new Error(
                "A term with this name already exists for this school."
            );
        }
    }

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

    for (
        const key of Object.keys(data)
    ) {
        if (
            allowedFields[key] &&
            data[key] !== undefined
        ) {
            let value =
                data[key];

            if (
                key === "termName"
            ) {
                value =
                    String(value).trim();
            }

            if (
                key === "termOrder" ||
                key === "displayOrder"
            ) {
                value =
                    Number(value);
            }

            if (
                key === "isCurrent" ||
                key === "isActive"
            ) {
                value =
                    Boolean(value);
            }

            values.push(value);

            updates.push(
                `${allowedFields[key]} = $${values.length}`
            );
        }
    }

    const wantsCurrent =
        data.isCurrent === true ||
        String(data.status || "")
            .trim()
            .toLowerCase() === "active";

    if (updates.length === 0) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }

    const client =
        await pool.connect();

    try {
        await client.query("BEGIN");

        if (wantsCurrent) {
            await client.query(
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

            const hasCurrentUpdate =
                updates.some(
                    item =>
                        item.startsWith(
                            "is_current ="
                        )
                );

            if (!hasCurrentUpdate) {
                values.push(true);

                updates.push(
                    `is_current = $${values.length}`
                );
            }
        }

        values.push(termId);

        const termIdPosition =
            values.length;

        values.push(schoolId);

        const schoolIdPosition =
            values.length;

        const sql = `
            UPDATE terms
            SET
                ${updates.join(", ")}
            WHERE id = $${termIdPosition}
              AND school_id = $${schoolIdPosition}
            RETURNING *
        `;

        const result =
            await client.query(
                sql,
                values
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

async function renameTerm(
    termId,
    schoolId,
    newName
) {
    if (
        typeof newName !== "string" ||
        !newName.trim()
    ) {
        throw new Error(
            "New term name is required."
        );
    }

    const duplicate =
        await termExists(
            null,
            newName,
            schoolId,
            termId
        );

    if (duplicate) {
        throw new Error(
            "A term with this name already exists for this school."
        );
    }

    const result =
        await query(
            `
            UPDATE terms
            SET term_name = $1
            WHERE id = $2
              AND school_id = $3
            RETURNING *
            `,
            [
                newName.trim(),
                termId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function activateTerm(
    termId,
    schoolId
) {
    const client =
        await pool.connect();

    try {
        await client.query("BEGIN");

        const term =
            await client.query(
                `
                SELECT id
                FROM terms
                WHERE id = $1
                  AND school_id = $2
                  AND is_active = TRUE
                LIMIT 1
                `,
                [
                    termId,
                    schoolId
                ]
            );

        if (
            term.rows.length === 0
        ) {
            await client.query("ROLLBACK");
            return null;
        }

        await client.query(
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

        const result =
            await client.query(
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

        await client.query("COMMIT");

        return result.rows[0] || null;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function setTermUpcoming(
    termId,
    schoolId
) {
    const result =
        await query(
            `
            UPDATE terms
            SET
                is_current = FALSE,
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

async function completeTerm(
    termId,
    schoolId
) {
    const result =
        await query(
            `
            UPDATE terms
            SET
                is_current = FALSE,
                is_active = FALSE
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

async function updateTermDates(
    termId,
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
            "Term start date cannot be later than the end date."
        );
    }

    const result =
        await query(
            `
            UPDATE terms
            SET
                start_date = $1,
                end_date = $2
            WHERE id = $3
              AND school_id = $4
            RETURNING *
            `,
            [
                startDate,
                endDate,
                termId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function updateTermOrder(
    termId,
    schoolId,
    displayOrder
) {
    const order =
        Number(displayOrder);

    if (
        !Number.isInteger(order) ||
        order < 0
    ) {
        throw new Error(
            "Term order must be a non-negative integer."
        );
    }

    const result =
        await query(
            `
            UPDATE terms
            SET term_order = $1
            WHERE id = $2
              AND school_id = $3
            RETURNING *
            `,
            [
                order,
                termId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function searchTerms(
    searchTerm,
    schoolId
) {
    const term =
        String(
            searchTerm || ""
        ).trim();

    const result =
        await query(
            `
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
                  OR CAST(
                      t.term_order AS TEXT
                  ) ILIKE $2
              )
            ORDER BY
                t.term_order ASC,
                t.term_name ASC,
                t.id ASC
            `,
            [
                schoolId,
                `%${term}%`
            ]
        );

    return result.rows;
}

async function getTermStatistics(
    termId,
    schoolId
) {
    const existsResult =
        await query(
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

    if (
        !existsResult.rows[0]
    ) {
        return null;
    }

    const result =
        await query(
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

    const row =
        result.rows[0];

    return {
        enrolledStudents: 0,
        resultRecords:
            Number(
                row.result_records
            ),
        attendanceRecords:
            Number(
                row.attendance_records
            )
    };
}

async function deleteTerm(
    termId,
    schoolId
) {
    const term =
        await findTermById(
            termId,
            schoolId
        );

    if (!term) {
        return null;
    }

    if (term.is_current) {
        throw new Error(
            "The current term cannot be deleted. Set another term as current first."
        );
    }

    const result =
        await query(
            `
            DELETE FROM terms
            WHERE id = $1
              AND school_id = $2
            RETURNING
                id,
                school_id,
                term_name,
                term_order,
                start_date,
                end_date,
                is_current,
                is_active
            `,
            [
                termId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

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