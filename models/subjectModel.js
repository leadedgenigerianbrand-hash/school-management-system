"use strict";

const { query } = require("../config/database");

/*
--------------------------------------------------------------------------
 Subject Model
--------------------------------------------------------------------------

 PostgreSQL tables:

 subjects
 class_subjects

 A subject belongs to a school.
 A subject can be assigned to one or more classes.

--------------------------------------------------------------------------
*/

/*
--------------------------------------------------------------------------
 Create Subject
--------------------------------------------------------------------------
*/

async function createSubject({
    schoolId,
    subjectName,
    subjectCode = null,
    description = null,
    isCompulsory = false,
    isActive = true
}) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    if (
        !subjectName ||
        typeof subjectName !== "string" ||
        !subjectName.trim()
    ) {
        throw new Error(
            "Subject name is required."
        );
    }

    const sql = `
        INSERT INTO subjects (
            school_id,
            subject_name,
            subject_code,
            description,
            is_compulsory,
            is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            schoolId,
            subjectName.trim(),
            typeof subjectCode === "string"
                ? subjectCode.trim() || null
                : subjectCode || null,
            typeof description === "string"
                ? description.trim() || null
                : description || null,
            Boolean(isCompulsory),
            isActive !== false
        ]
    );

    return result.rows[0];
}

/*
--------------------------------------------------------------------------
 Find Subject By ID
--------------------------------------------------------------------------
*/

async function findSubjectById(
    subjectId,
    schoolId = null
) {
    if (!subjectId) {
        return null;
    }

    let sql = `
        SELECT *
        FROM subjects
        WHERE id = $1
    `;

    const values = [
        subjectId
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
--------------------------------------------------------------------------
 Find Subject By Code
--------------------------------------------------------------------------
*/

async function findSubjectByCode(
    subjectCode,
    schoolId
) {
    if (!subjectCode || !schoolId) {
        return null;
    }

    const sql = `
        SELECT *
        FROM subjects
        WHERE subject_code = $1
          AND school_id = $2
        LIMIT 1
    `;

    const result = await query(
        sql,
        [
            subjectCode,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

/*
--------------------------------------------------------------------------
 Find Subjects
--------------------------------------------------------------------------
*/

async function findSubjects({
    schoolId,
    isActive = null,
    isCompulsory = null
} = {}) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    let sql = `
        SELECT *
        FROM subjects
        WHERE school_id = $1
    `;

    const values = [
        schoolId
    ];

    if (
        isActive !== null &&
        isActive !== undefined
    ) {
        values.push(
            Boolean(isActive)
        );

        sql += `
            AND is_active = $${values.length}
        `;
    }

    if (
        isCompulsory !== null &&
        isCompulsory !== undefined
    ) {
        values.push(
            Boolean(isCompulsory)
        );

        sql += `
            AND is_compulsory = $${values.length}
        `;
    }

    sql += `
        ORDER BY subject_name ASC
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows;
}

/*
--------------------------------------------------------------------------
 Search Subjects
--------------------------------------------------------------------------
*/

async function searchSubjects(
    searchTerm,
    schoolId
) {
    if (!schoolId) {
        return [];
    }

    const term =
        String(
            searchTerm || ""
        ).trim();

    const sql = `
        SELECT *
        FROM subjects
        WHERE school_id = $1
          AND (
              subject_name ILIKE $2
              OR subject_code ILIKE $2
              OR description ILIKE $2
          )
        ORDER BY subject_name ASC
        LIMIT 100
    `;

    const result = await query(
        sql,
        [
            schoolId,
            `%${term}%`
        ]
    );

    return result.rows;
}

/*
--------------------------------------------------------------------------
 Update Subject
--------------------------------------------------------------------------
*/

async function updateSubject(
    subjectId,
    schoolId,
    data
) {
    if (!subjectId) {
        throw new Error(
            "Subject ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const allowedFields = {
        subjectName: "subject_name",
        subjectCode: "subject_code",
        description: "description",
        isCompulsory: "is_compulsory",
        isActive: "is_active"
    };

    const updates = [];
    const values = [];

    for (
        const key of Object.keys(
            data || {}
        )
    ) {
        if (
            allowedFields[key] &&
            data[key] !== undefined
        ) {
            let value =
                data[key];

            if (
                key === "subjectName" &&
                typeof value === "string"
            ) {
                value =
                    value.trim();
            }

            if (
                key === "subjectCode" &&
                typeof value === "string"
            ) {
                value =
                    value.trim() ||
                    null;
            }

            if (
                key === "description" &&
                typeof value === "string"
            ) {
                value =
                    value.trim() ||
                    null;
            }

            if (
                key === "isCompulsory" ||
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

    if (updates.length === 0) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }

    values.push(subjectId);

    const subjectIdPosition =
        values.length;

    values.push(schoolId);

    const schoolIdPosition =
        values.length;

    const sql = `
        UPDATE subjects
        SET
            ${updates.join(", ")},
            updated_at = NOW()
        WHERE id = $${subjectIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows[0] || null;
}

/*
--------------------------------------------------------------------------
 Delete Subject
--------------------------------------------------------------------------
*/

async function deleteSubject(
    subjectId,
    schoolId
) {
    if (!subjectId) {
        throw new Error(
            "Subject ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const sql = `
        DELETE FROM subjects
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            subjectId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

/*
--------------------------------------------------------------------------
 Assign Subject To Class
--------------------------------------------------------------------------
*/

async function assignSubjectToClass({
    classId,
    subjectId,
    isCompulsory = false
}) {
    if (!classId) {
        throw new Error(
            "Class ID is required."
        );
    }

    if (!subjectId) {
        throw new Error(
            "Subject ID is required."
        );
    }

    const sql = `
        INSERT INTO class_subjects (
            class_id,
            subject_id,
            is_compulsory
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (
            class_id,
            subject_id
        )
        DO UPDATE SET
            is_compulsory =
                EXCLUDED.is_compulsory
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            classId,
            subjectId,
            Boolean(isCompulsory)
        ]
    );

    return result.rows[0];
}

/*
--------------------------------------------------------------------------
 Get Subjects For Class
--------------------------------------------------------------------------
*/

async function getSubjectsForClass(
    classId,
    schoolId
) {
    if (!classId || !schoolId) {
        return [];
    }

    const sql = `
        SELECT
            cs.id,
            cs.class_id,
            cs.subject_id,
            cs.is_compulsory,
            cs.created_at,
            sub.subject_name,
            sub.subject_code,
            sub.description,
            sub.is_active
        FROM class_subjects cs
        INNER JOIN subjects sub
            ON sub.id = cs.subject_id
        INNER JOIN classes c
            ON c.id = cs.class_id
           AND c.school_id = sub.school_id
        WHERE cs.class_id = $1
          AND sub.school_id = $2
        ORDER BY
            sub.subject_name ASC
    `;

    const result = await query(
        sql,
        [
            classId,
            schoolId
        ]
    );

    return result.rows;
}

/*
--------------------------------------------------------------------------
 Remove Subject From Class
--------------------------------------------------------------------------
*/

async function removeSubjectFromClass(
    classSubjectId,
    schoolId
) {
    if (!classSubjectId || !schoolId) {
        return null;
    }

    const sql = `
        DELETE FROM class_subjects cs
        USING subjects sub
        WHERE cs.id = $1
          AND cs.subject_id = sub.id
          AND sub.school_id = $2
        RETURNING cs.*
    `;

    const result = await query(
        sql,
        [
            classSubjectId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

/*
--------------------------------------------------------------------------
 Subject Statistics
--------------------------------------------------------------------------
*/

async function getSubjectStatistics(
    schoolId
) {
    if (!schoolId) {
        return {
            totalSubjects: 0,
            activeSubjects: 0,
            compulsorySubjects: 0
        };
    }

    const sql = `
        SELECT
            COUNT(*)::INTEGER
                AS total_subjects,
            COUNT(*) FILTER (
                WHERE is_active = TRUE
            )::INTEGER
                AS active_subjects,
            COUNT(*) FILTER (
                WHERE is_compulsory = TRUE
            )::INTEGER
                AS compulsory_subjects
        FROM subjects
        WHERE school_id = $1
    `;

    const result = await query(
        sql,
        [schoolId]
    );

    const row =
        result.rows[0] || {};

    return {
        totalSubjects:
            Number(
                row.total_subjects || 0
            ),

        activeSubjects:
            Number(
                row.active_subjects || 0
            ),

        compulsorySubjects:
            Number(
                row.compulsory_subjects || 0
            )
    };
}

/*
--------------------------------------------------------------------------
 Check Subject Code
--------------------------------------------------------------------------
*/

async function subjectCodeExists(
    subjectCode,
    schoolId,
    excludeSubjectId = null
) {
    if (!subjectCode || !schoolId) {
        return false;
    }

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM subjects
            WHERE subject_code = $1
              AND school_id = $2
    `;

    const values = [
        subjectCode.trim(),
        schoolId
    ];

    if (excludeSubjectId) {
        values.push(
            excludeSubjectId
        );

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

/*
--------------------------------------------------------------------------
 Subject Name Exists
--------------------------------------------------------------------------
*/

async function subjectNameExists(
    subjectName,
    schoolId,
    excludeSubjectId = null
) {
    if (!subjectName || !schoolId) {
        return false;
    }

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM subjects
            WHERE LOWER(
                TRIM(subject_name)
            ) =
            LOWER(
                TRIM($1)
            )
            AND school_id = $2
    `;

    const values = [
        subjectName.trim(),
        schoolId
    ];

    if (excludeSubjectId) {
        values.push(
            excludeSubjectId
        );

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

/*
--------------------------------------------------------------------------
 Export
--------------------------------------------------------------------------
*/

module.exports = {
    createSubject,
    findSubjectById,
    findSubjectByCode,
    findSubjects,
    searchSubjects,
    updateSubject,
    deleteSubject,
    assignSubjectToClass,
    getSubjectsForClass,
    removeSubjectFromClass,
    getSubjectStatistics,
    subjectCodeExists,
    subjectNameExists
};