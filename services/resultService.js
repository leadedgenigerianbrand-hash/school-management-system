const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Result Service
|--------------------------------------------------------------------------
|
| Handles business logic for student academic results.
|
| Responsibilities:
|
| - Get student results
| - Get results by session
| - Get results by term
| - Get results by class
| - Get individual result records
| - Calculate student result summaries
| - Calculate class statistics
| - Save/update results
| - Delete results
| - Search results
|
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
            ON ac.id = r.session_id

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
            AND r.session_id = $${values.length}
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

    const result = await query(
        sql,
        values
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Result By ID
|--------------------------------------------------------------------------
*/

async function getResultById(
    resultId,
    schoolId
) {

    if (!resultId) {
        throw new Error("Result ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
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
            ON ac.id = r.session_id

        LEFT JOIN terms t
            ON t.id = r.term_id

        WHERE r.id = $1

          AND r.school_id = $2

        LIMIT 1
    `;

    const result = await query(
        sql,
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

    const sql = `
        SELECT *

        FROM results

        WHERE student_id = $1

          AND subject_id = $2

          AND school_id = $3

          AND session_id IS NOT DISTINCT FROM $4

          AND term_id IS NOT DISTINCT FROM $5

        LIMIT 1
    `;

    const result = await query(
        sql,
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
    remark = null,
    teacherComment = null,
    status = "draft"
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

    const ca = Number(caScore) || 0;
    const exam = Number(examScore) || 0;

    const calculatedTotal =
        totalScore === null ||
        totalScore === undefined
            ? ca + exam
            : Number(totalScore);

    const sql = `
        INSERT INTO results (
            school_id,
            student_id,
            subject_id,
            session_id,
            term_id,
            class_id,
            ca_score,
            exam_score,
            total_score,
            grade,
            grade_point,
            remark,
            teacher_comment,
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
            $9,
            $10,
            $11,
            $12,
            $13,
            $14
        )
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            schoolId,
            studentId,
            subjectId,
            sessionId,
            termId,
            classId,
            ca,
            exam,
            calculatedTotal,
            grade,
            gradePoint,
            remark,
            teacherComment,
            status
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

    const allowedFields = {

        studentId:
            "student_id",

        subjectId:
            "subject_id",

        sessionId:
            "session_id",

        termId:
            "term_id",

        classId:
            "class_id",

        caScore:
            "ca_score",

        examScore:
            "exam_score",

        totalScore:
            "total_score",

        grade:
            "grade",

        gradePoint:
            "grade_point",

        remark:
            "remark",

        teacherComment:
            "teacher_comment",

        status:
            "status"

    };

    const updates = [];
    const values = [];

    for (
        const key of Object.keys(data || {})
    ) {

        if (
            allowedFields[key] &&
            data[key] !== undefined
        ) {

            values.push(
                data[key]
            );

            updates.push(
                `${allowedFields[key]} = $${values.length}`
            );
        }
    }

    /*
    |----------------------------------------------------------------------
    | Automatically Recalculate Total
    |----------------------------------------------------------------------
    */

    if (
        data.caScore !== undefined ||
        data.examScore !== undefined
    ) {

        const caValue =
            data.caScore !== undefined
                ? Number(data.caScore) || 0
                : null;

        const examValue =
            data.examScore !== undefined
                ? Number(data.examScore) || 0
                : null;

        if (
            caValue !== null &&
            examValue !== null
        ) {

            values.push(
                caValue + examValue
            );

            updates.push(
                `total_score = $${values.length}`
            );
        }
    }

    if (updates.length === 0) {

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

    const sql = `
        UPDATE results

        SET

            ${updates.join(", ")},

            updated_at = NOW()

        WHERE id = $${resultIdPosition}

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

    const sql = `
        DELETE FROM results

        WHERE id = $1

          AND school_id = $2

        RETURNING *
    `;

    const result = await query(
        sql,
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
            AND r.session_id = $${values.length}
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

    const result = await query(
        sql,
        values
    );

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

            COUNT(*)::INTEGER
                AS subject_count,

            COALESCE(
                SUM(ca_score),
                0
            ) AS total_ca,

            COALESCE(
                SUM(exam_score),
                0
            ) AS total_exam,

            COALESCE(
                SUM(total_score),
                0
            ) AS total_score,

            COALESCE(
                AVG(total_score),
                0
            ) AS average_score,

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
            AND session_id = $${values.length}
        `;
    }

    if (termId) {

        values.push(termId);

        sql += `
            AND term_id = $${values.length}
        `;
    }

    const result = await query(
        sql,
        values
    );

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

            COUNT(*)::INTEGER
                AS result_count,

            COUNT(
                DISTINCT student_id
            )::INTEGER
                AS student_count,

            COUNT(
                DISTINCT subject_id
            )::INTEGER
                AS subject_count,

            COALESCE(
                SUM(total_score),
                0
            ) AS total_score,

            COALESCE(
                AVG(total_score),
                0
            ) AS average_score,

            COALESCE(
                MAX(total_score),
                0
            ) AS highest_score,

            COALESCE(
                MIN(total_score),
                0
            ) AS lowest_score

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
            AND session_id = $${values.length}
        `;
    }

    if (termId) {

        values.push(termId);

        sql += `
            AND term_id = $${values.length}
        `;
    }

    const result = await query(
        sql,
        values
    );

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

    const sql = `
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
            status = 'published',
            updated_at = NOW()

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
            AND session_id = $${values.length}
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

    const result = await query(
        sql,
        values
    );

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

          AND r.status = 'published'
    `;

    const values = [
        studentId,
        schoolId
    ];

    if (sessionId) {

        values.push(sessionId);

        sql += `
            AND r.session_id = $${values.length}
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

    const result = await query(
        sql,
        values
    );

    return result.rows;
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