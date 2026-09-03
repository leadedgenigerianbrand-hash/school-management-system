```javascript
"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Subject Model
|--------------------------------------------------------------------------
| Compatible with the current PostgreSQL schema.
|--------------------------------------------------------------------------
|
| subjects:
| id
| school_id
| subject_name
| subject_code
| description
| is_compulsory
| is_active
| created_at
|
| class_subjects:
| id
| class_id
| subject_id
| is_compulsory
| created_at
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Create Subject
|--------------------------------------------------------------------------
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
        throw new Error("School ID is required.");
    }

    if (!subjectName || !subjectName.trim()) {
        throw new Error("Subject name is required.");
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

    const result = await query(sql, [
        schoolId,
        subjectName.trim(),
        subjectCode,
        description,
        isCompulsory,
        isActive
    ]);

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Find Subject By ID
|--------------------------------------------------------------------------
*/

async function findSubjectById(
    subjectId,
    schoolId = null
) {
    let sql = `
        SELECT *
        FROM subjects
        WHERE id = $1
    `;

    const values = [subjectId];

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
| Find Subject By Code
|--------------------------------------------------------------------------
*/

async function findSubjectByCode(
    subjectCode,
    schoolId
) {
    const sql = `
        SELECT *
        FROM subjects
        WHERE subject_code = $1
          AND school_id = $2
        LIMIT 1
    `;

    const result = await query(sql, [
        subjectCode,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Find Subjects
|--------------------------------------------------------------------------
*/

async function findSubjects({
    schoolId,
    isActive = null,
    isCompulsory = null
} = {}) {
    let sql = `
        SELECT *
        FROM subjects
        WHERE school_id = $1
    `;

    const values = [schoolId];

    if (isActive !== null) {
        values.push(isActive);

        sql += `
            AND is_active = $${values.length}
        `;
    }

    if (isCompulsory !== null) {
        values.push(isCompulsory);

        sql += `
            AND is_compulsory = $${values.length}
        `;
    }

    sql += `
        ORDER BY subject_name ASC
    `;

    const result = await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Search Subjects
|--------------------------------------------------------------------------
*/

async function searchSubjects(
    searchTerm,
    schoolId
) {
    if (!searchTerm || !schoolId) {
        return [];
    }

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

    const result = await query(sql, [
        schoolId,
        `%${searchTerm.trim()}%`
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Update Subject
|--------------------------------------------------------------------------
*/

async function updateSubject(
    subjectId,
    schoolId,
    data
) {
    const allowedFields = {
        subjectName: "subject_name",
        subjectCode: "subject_code",
        description: "description",
        isCompulsory: "is_compulsory",
        isActive: "is_active"
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
                typeof value === "string" &&
                ["subjectName", "subjectCode"].includes(key)
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

    values.push(subjectId);
    const subjectIdPosition = values.length;

    values.push(schoolId);
    const schoolIdPosition = values.length;

    const sql = `
        UPDATE subjects
        SET
            ${updates.join(", ")}
        WHERE id = $${subjectIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Delete Subject
|--------------------------------------------------------------------------
*/

async function deleteSubject(
    subjectId,
    schoolId
) {
    const sql = `
        DELETE FROM subjects
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        subjectId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Assign Subject To Class
|--------------------------------------------------------------------------
*/

async function assignSubjectToClass({
    classId,
    subjectId,
    isCompulsory = false
}) {
    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!subjectId) {
        throw new Error("Subject ID is required.");
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
            is_compulsory = EXCLUDED.is_compulsory
        RETURNING *
    `;

    const result = await query(sql, [
        classId,
        subjectId,
        isCompulsory
    ]);

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Get Subjects For Class
|--------------------------------------------------------------------------
*/

async function getSubjectsForClass(
    classId,
    schoolId
) {
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

        WHERE cs.class_id = $1
          AND sub.school_id = $2

        ORDER BY
            sub.subject_name ASC
    `;

    const result = await query(sql, [
        classId,
        schoolId
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Remove Subject From Class
|--------------------------------------------------------------------------
*/

async function removeSubjectFromClass(
    classSubjectId,
    schoolId
) {
    const sql = `
        DELETE FROM class_subjects cs
        USING subjects sub
        WHERE cs.id = $1
          AND cs.subject_id = sub.id
          AND sub.school_id = $2
        RETURNING cs.*
    `;

    const result = await query(sql, [
        classSubjectId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Subject Statistics
|--------------------------------------------------------------------------
*/

async function getSubjectStatistics(
    schoolId
) {
    const sql = `
        SELECT
            COUNT(*)::INTEGER AS total_subjects,

            COUNT(*) FILTER (
                WHERE is_active = TRUE
            )::INTEGER AS active_subjects,

            COUNT(*) FILTER (
                WHERE is_compulsory = TRUE
            )::INTEGER AS compulsory_subjects

        FROM subjects

        WHERE school_id = $1
    `;

    const result = await query(sql, [schoolId]);

    const row = result.rows[0];

    return {
        totalSubjects: Number(row.total_subjects),
        activeSubjects: Number(row.active_subjects),
        compulsorySubjects: Number(row.compulsory_subjects)
    };
}

/*
|--------------------------------------------------------------------------
| Check Subject Code
|--------------------------------------------------------------------------
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
        subjectCode,
        schoolId
    ];

    if (excludeSubjectId) {
        values.push(excludeSubjectId);

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
| Subject Name Exists
|--------------------------------------------------------------------------
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
            WHERE LOWER(subject_name) = LOWER($1)
              AND school_id = $2
    `;

    const values = [
        subjectName.trim(),
        schoolId
    ];

    if (excludeSubjectId) {
        values.push(excludeSubjectId);

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
| Export
|--------------------------------------------------------------------------
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
