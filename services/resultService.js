```javascript
"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| RESULT SERVICE
|--------------------------------------------------------------------------
| Uses the actual results table structure:
|
| student_id
| school_id
| academic_session_id
| term_id
| class_id
| subject_id
| ca_score
| exam_score
| total_score
| grade
| grade_point
| position
| teacher_remark
| principal_remark
| is_published
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Get Student Results
|--------------------------------------------------------------------------
*/

async function getStudentResults(
    studentId,
    schoolId,
    {
        sessionId = null,
        termId = null,
        subjectId = null
    } = {}
) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            r.*,

            s.first_name,
            s.last_name,
            s.admission_number,

            sub.subject_name,
            sub.subject_code,

            ac.session_name,
            ac.session_code,

            t.term_name,
            t.term_code

        FROM results r

        INNER JOIN students s
            ON s.id = r.student_id

        LEFT JOIN subjects sub
            ON sub.id = r.subject_id

        LEFT JOIN academic_sessions ac
            ON ac.id = r.academic_session_id

        LEFT JOIN terms t
            ON t.id = r.term_id

        WHERE r.student_id = $1
          AND r.school_id = $2
    `;

    const values = [
        studentId,
        schoolId
    ];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND r.academic_session_id = $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND r.term_id = $${values.length}
        `;
    }

    if (subjectId) {
        values.push(subjectId);

        sql += `
            AND r.subject_id = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            sub.subject_name ASC,
            r.created_at ASC
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Result By ID
|--------------------------------------------------------------------------
*/

async function getResultById(resultId, schoolId) {
    if (!resultId) {
        throw new Error("Result ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const result = await query(
        `
            SELECT
                r.*,

                s.first_name,
                s.last_name,
                s.admission_number,

                sub.subject_name,
                sub.subject_code,

                ac.session_name,
                ac.session_code,

                t.term_name,
                t.term_code

            FROM results r

            INNER JOIN students s
                ON s.id = r.student_id

            LEFT JOIN subjects sub
                ON sub.id = r.subject_id

            LEFT JOIN academic_sessions ac
                ON ac.id = r.academic_session_id

            LEFT JOIN terms t
                ON t.id = r.term_id

            WHERE r.id = $1
              AND r.school_id = $2

            LIMIT 1
        `,
        [
            resultId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Find Existing Result
|--------------------------------------------------------------------------
*/

async function findExistingResult({
    studentId,
    subjectId,
    sessionId,
    termId,
    schoolId
}) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!subjectId) {
        throw new Error("Subject ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const result = await query(
        `
            SELECT *
            FROM results

            WHERE student_id = $1
              AND subject_id = $2
              AND school_id = $3
              AND academic_session_id IS NOT DISTINCT FROM $4
              AND term_id IS NOT DISTINCT FROM $5

            LIMIT 1
        `,
        [
            studentId,
            subjectId,
            schoolId,
            sessionId || null,
            termId || null
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Create Result
|--------------------------------------------------------------------------
*/

async function createResult({
    schoolId,
    studentId,
    subjectId,
    sessionId = null,
    termId = null,
    classId = null,
    caScore = 0,
    examScore = 0,
    totalScore = null,
    grade = null,
    gradePoint = null,
    position = null,
    teacherRemark = null,
    principalRemark = null,
    isPublished = false
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!subjectId) {
        throw new Error("Subject ID is required.");
    }

    if (!sessionId) {
        throw new Error("Academic session ID is required.");
    }

    const ca = Number(caScore) || 0;
    const exam = Number(examScore) || 0;

    if (ca < 0 || ca > 40) {
        throw new Error("CA score must be between 0 and 40.");
    }

    if (exam < 0 || exam > 60) {
        throw new Error("Exam score must be between 0 and 60.");
    }

    const calculatedTotal =
        totalScore === null ||
        totalScore === undefined
            ? ca + exam
            : Number(totalScore);

    if (
        calculatedTotal < 0 ||
        calculatedTotal > 100
    ) {
        throw new Error(
            "Total score must be between 0 and 100."
        );
    }

    const calculatedGrade =
        grade || calculateGrade(calculatedTotal);

    const calculatedGradePoint =
        gradePoint === null ||
        gradePoint === undefined
            ? calculateGradePoint(calculatedTotal)
            : Number(gradePoint);

    const result = await query(
        `
            INSERT INTO results (
                school_id,
                student_id,
                academic_session_id,
                term_id,
                class_id,
                subject_id,
                ca_score,
                exam_score,
                total_score,
                grade,
                grade_point,
                position,
                teacher_remark,
                principal_remark,
                is_published
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
                $12,
                $13,
                $14,
                $15
            )

            RETURNING *
        `,
        [
            schoolId,
            studentId,
            sessionId,
            termId,
            classId,
            subjectId,
            ca,
            exam,
            calculatedTotal,
            calculatedGrade,
            calculatedGradePoint,
            position,
            teacherRemark,
            principalRemark,
            Boolean(isPublished)
        ]
    );

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Update Result
|--------------------------------------------------------------------------
*/

async function updateResult(
    resultId,
    schoolId,
    data
) {
    if (!resultId) {
        throw new Error("Result ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const currentResult = await query(
        `
            SELECT *
            FROM results
            WHERE id = $1
              AND school_id = $2
            LIMIT 1
        `,
        [
            resultId,
            schoolId
        ]
    );

    const existing = currentResult.rows[0];

    if (!existing) {
        return null;
    }

    const merged = {
        ...existing,
        ...data
    };

    const ca =
        data.caScore !== undefined
            ? Number(data.caScore) || 0
            : Number(existing.ca_score) || 0;

    const exam =
        data.examScore !== undefined
            ? Number(data.examScore) || 0
            : Number(existing.exam_score) || 0;

    if (ca < 0 || ca > 40) {
        throw new Error("CA score must be between 0 and 40.");
    }

    if (exam < 0 || exam > 60) {
        throw new Error("Exam score must be between 0 and 60.");
    }

    const total =
        data.totalScore !== undefined
            ? Number(data.totalScore)
            : ca + exam;

    if (total < 0 || total > 100) {
        throw new Error(
            "Total score must be between 0 and 100."
        );
    }

    const grade =
        data.grade ||
        calculateGrade(total);

    const gradePoint =
        data.gradePoint !== undefined
            ? Number(data.gradePoint)
            : calculateGradePoint(total);

    const allowedFields = {
        studentId: "student_id",
        subjectId: "subject_id",
        sessionId: "academic_session_id",
        termId: "term_id",
        classId: "class_id",
        position: "position",
        teacherRemark: "teacher_remark",
        principalRemark: "principal_remark",
        isPublished: "is_published"
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

    /*
    |----------------------------------------------------------------------
    | Always update calculated scores when score data changes.
    |----------------------------------------------------------------------
    */

    if (
        data.caScore !== undefined ||
        data.examScore !== undefined ||
        data.totalScore !== undefined
    ) {
        values.push(ca);
        updates.push(`ca_score = $${values.length}`);

        values.push(exam);
        updates.push(`exam_score = $${values.length}`);

        values.push(total);
        updates.push(`total_score = $${values.length}`);

        values.push(grade);
        updates.push(`grade = $${values.length}`);

        values.push(gradePoint);
        updates.push(`grade_point = $${values.length}`);
    }

    if (!updates.length) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }

    values.push(resultId);

    const resultIdPosition =
        values.length;

    values.push(schoolId);

    const schoolIdPosition =
        values.length;

    const result = await query(
        `
            UPDATE results

            SET
                ${updates.join(", ")},
                updated_at = CURRENT_TIMESTAMP

            WHERE id = $${resultIdPosition}
              AND school_id = $${schoolIdPosition}

            RETURNING *
        `,
        values
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Delete Result
|--------------------------------------------------------------------------
*/

async function deleteResult(
    resultId,
    schoolId
) {
    if (!resultId) {
        throw new Error("Result ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const result = await query(
        `
            DELETE FROM results

            WHERE id = $1
              AND school_id = $2

            RETURNING *
        `,
        [
            resultId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Get Results By Class
|--------------------------------------------------------------------------
*/

async function getResultsByClass(
    classId,
    schoolId,
    {
        sessionId = null,
        termId = null,
        subjectId = null
    } = {}
) {
    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            r.*,

            s.first_name,
            s.last_name,
            s.admission_number,

            sub.subject_name,
            sub.subject_code

        FROM results r

        INNER JOIN students s
            ON s.id = r.student_id

        LEFT JOIN subjects sub
            ON sub.id = r.subject_id

        WHERE r.class_id = $1
          AND r.school_id = $2
    `;

    const values = [
        classId,
        schoolId
    ];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND r.academic_session_id = $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND r.term_id = $${values.length}
        `;
    }

    if (subjectId) {
        values.push(subjectId);

        sql += `
            AND r.subject_id = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            s.last_name ASC,
            s.first_name ASC,
            sub.subject_name ASC
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Student Result Summary
|--------------------------------------------------------------------------
*/

async function getStudentResultSummary(
    studentId,
    schoolId,
    {
        sessionId = null,
        termId = null
    } = {}
) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            COUNT(*)::INTEGER AS subject_count,

            COALESCE(SUM(ca_score), 0)
                AS total_ca,

            COALESCE(SUM(exam_score), 0)
                AS total_exam,

            COALESCE(SUM(total_score), 0)
                AS total_score,

            COALESCE(AVG(total_score), 0)
                AS average_score,

            COUNT(
                CASE
                    WHEN grade IN ('A', 'A1')
                    THEN 1
                END
            )::INTEGER AS grade_a_count,

            COUNT(
                CASE
                    WHEN grade IN ('B', 'B2', 'B3')
                    THEN 1
                END
            )::INTEGER AS grade_b_count,

            COUNT(
                CASE
                    WHEN grade IN ('C', 'C4', 'C5', 'C6')
                    THEN 1
                END
            )::INTEGER AS grade_c_count,

            COUNT(
                CASE
                    WHEN grade IN ('D', 'E', 'F', 'F9')
                    THEN 1
                END
            )::INTEGER AS below_c_count

        FROM results

        WHERE student_id = $1
          AND school_id = $2
    `;

    const values = [
        studentId,
        schoolId
    ];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND academic_session_id = $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND term_id = $${values.length}
        `;
    }

    const result = await query(sql, values);

    const row = result.rows[0];

    return {
        subjectCount:
            Number(row.subject_count),

        totalCA:
            Number(row.total_ca),

        totalExam:
            Number(row.total_exam),

        totalScore:
            Number(row.total_score),

        averageScore:
            Number(row.average_score),

        gradeACount:
            Number(row.grade_a_count),

        gradeBCount:
            Number(row.grade_b_count),

        gradeCCount:
            Number(row.grade_c_count),

        belowCCount:
            Number(row.below_c_count)
    };
}


/*
|--------------------------------------------------------------------------
| Get Class Result Statistics
|--------------------------------------------------------------------------
*/

async function getClassResultStatistics(
    classId,
    schoolId,
    {
        sessionId = null,
        termId = null
    } = {}
) {
    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            COUNT(*)::INTEGER AS result_count,

            COUNT(DISTINCT student_id)::INTEGER
                AS student_count,

            COUNT(DISTINCT subject_id)::INTEGER
                AS subject_count,

            COALESCE(SUM(total_score), 0)
                AS total_score,

            COALESCE(AVG(total_score), 0)
                AS average_score,

            COALESCE(MAX(total_score), 0)
                AS highest_score,

            COALESCE(MIN(total_score), 0)
                AS lowest_score

        FROM results

        WHERE class_id = $1
          AND school_id = $2
    `;

    const values = [
        classId,
        schoolId
    ];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND academic_session_id = $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND term_id = $${values.length}
        `;
    }

    const result = await query(sql, values);

    const row = result.rows[0];

    return {
        resultCount:
            Number(row.result_count),

        studentCount:
            Number(row.student_count),

        subjectCount:
            Number(row.subject_count),

        totalScore:
            Number(row.total_score),

        averageScore:
            Number(row.average_score),

        highestScore:
            Number(row.highest_score),

        lowestScore:
            Number(row.lowest_score)
    };
}


/*
|--------------------------------------------------------------------------
| Search Results
|--------------------------------------------------------------------------
*/

async function searchResults(
    searchTerm,
    schoolId
) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const term =
        String(searchTerm || "").trim();

    if (!term) {
        return [];
    }

    const result = await query(
        `
            SELECT
                r.*,

                s.first_name,
                s.last_name,
                s.admission_number,

                sub.subject_name,
                sub.subject_code

            FROM results r

            INNER JOIN students s
                ON s.id = r.student_id

            LEFT JOIN subjects sub
                ON sub.id = r.subject_id

            WHERE r.school_id = $1

              AND (
                    s.first_name ILIKE $2
                    OR s.last_name ILIKE $2
                    OR s.admission_number ILIKE $2
                    OR sub.subject_name ILIKE $2
                    OR sub.subject_code ILIKE $2
                  )

            ORDER BY
                s.last_name ASC,
                s.first_name ASC

            LIMIT 100
        `,
        [
            schoolId,
            `%${term}%`
        ]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Publish Results
|--------------------------------------------------------------------------
*/

async function publishResults({
    schoolId,
    studentId = null,
    classId = null,
    sessionId = null,
    termId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        UPDATE results

        SET
            is_published = TRUE,
            updated_at = CURRENT_TIMESTAMP

        WHERE school_id = $1
    `;

    const values = [
        schoolId
    ];

    if (studentId) {
        values.push(studentId);

        sql += `
            AND student_id = $${values.length}
        `;
    }

    if (classId) {
        values.push(classId);

        sql += `
            AND class_id = $${values.length}
        `;
    }

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND academic_session_id = $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND term_id = $${values.length}
        `;
    }

    sql += `
        RETURNING *
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Published Results
|--------------------------------------------------------------------------
*/

async function getPublishedResults(
    studentId,
    schoolId,
    sessionId = null,
    termId = null
) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            r.*,

            sub.subject_name,
            sub.subject_code

        FROM results r

        LEFT JOIN subjects sub
            ON sub.id = r.subject_id

        WHERE r.student_id = $1
          AND r.school_id = $2
          AND r.is_published = TRUE
    `;

    const values = [
        studentId,
        schoolId
    ];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND r.academic_session_id = $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND r.term_id = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            sub.subject_name ASC
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Grade Calculator
|--------------------------------------------------------------------------
*/

function calculateGrade(score) {
    const value = Number(score);

    if (value >= 75) return "A";
    if (value >= 65) return "B";
    if (value >= 55) return "C";
    if (value >= 45) return "D";
    if (value >= 40) return "E";

    return "F";
}


/*
|--------------------------------------------------------------------------
| Grade Point Calculator
|--------------------------------------------------------------------------
*/

function calculateGradePoint(score) {
    const value = Number(score);

    if (value >= 75) return 4.0;
    if (value >= 65) return 3.0;
    if (value >= 55) return 2.0;
    if (value >= 45) return 1.0;
    if (value >= 40) return 0.0;

    return 0.0;
}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    getStudentResults,
    getResultById,
    findExistingResult,
    createResult,
    updateResult,
    deleteResult,
    getResultsByClass,
    getStudentResultSummary,
    getClassResultStatistics,
    searchResults,
    publishResults,
    getPublishedResults
};
```
