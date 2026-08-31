const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Result Model
|--------------------------------------------------------------------------
|
| Handles academic results for students.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Result
|--------------------------------------------------------------------------
*/

async function createResult({
    schoolId,
    studentId,
    classId,
    classArmId = null,
    subjectId,
    sessionId,
    termId,
    caScore = 0,
    examScore = 0,
    totalScore = null,
    grade = null,
    gradePoint = null,
    remark = null,
    teacherComment = null,
    recordedBy = null
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!subjectId) {
        throw new Error("Subject ID is required.");
    }

    if (!sessionId) {
        throw new Error("Academic session is required.");
    }

    if (!termId) {
        throw new Error("Term is required.");
    }


    /*
    |--------------------------------------------------------------------------
    | Calculate total score automatically
    |--------------------------------------------------------------------------
    */

    const calculatedTotal =
        totalScore !== null
            ? totalScore
            : Number(caScore || 0) +
            Number(examScore || 0);


    const sql = `
        INSERT INTO results (
            school_id,
            student_id,
            class_id,
            class_arm_id,
            subject_id,
            session_id,
            term_id,
            ca_score,
            exam_score,
            total_score,
            grade,
            grade_point,
            remark,
            teacher_comment,
            recorded_by
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
        ON CONFLICT (
            student_id,
            subject_id,
            session_id,
            term_id
        )
        DO UPDATE SET

            class_id = EXCLUDED.class_id,

            class_arm_id = EXCLUDED.class_arm_id,

            ca_score = EXCLUDED.ca_score,

            exam_score = EXCLUDED.exam_score,

            total_score = EXCLUDED.total_score,

            grade = EXCLUDED.grade,

            grade_point = EXCLUDED.grade_point,

            remark = EXCLUDED.remark,

            teacher_comment = EXCLUDED.teacher_comment,

            recorded_by = EXCLUDED.recorded_by,

            updated_at = NOW()

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            studentId,
            classId,
            classArmId,
            subjectId,
            sessionId,
            termId,
            caScore,
            examScore,
            calculatedTotal,
            grade,
            gradePoint,
            remark,
            teacherComment,
            recordedBy
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Create Bulk Results
|--------------------------------------------------------------------------
*/

async function createBulkResults(
    results
) {

    if (
        !Array.isArray(results) ||
        results.length === 0
    ) {
        throw new Error(
            "Result records are required."
        );
    }


    const savedResults = [];


    for (
        const resultData of results
    ) {

        const result =
            await createResult(
                resultData
            );


        savedResults.push(
            result
        );
    }


    return savedResults;
}


/*
|--------------------------------------------------------------------------
| Find Result By ID
|--------------------------------------------------------------------------
*/

async function findResultById(
    resultId,
    schoolId
) {

    const sql = `
        SELECT

            r.*,

            s.admission_number,

            s.first_name,

            s.middle_name,

            s.last_name,

            sub.subject_name,

            sub.subject_code,

            c.class_name,

            ca.arm_name

        FROM results r

        INNER JOIN students s
            ON s.id = r.student_id

        INNER JOIN subjects sub
            ON sub.id = r.subject_id

        INNER JOIN classes c
            ON c.id = r.class_id

        LEFT JOIN class_arms ca
            ON ca.id = r.class_arm_id

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
| Get Student Results
|--------------------------------------------------------------------------
*/

async function getStudentResults({
    schoolId,
    studentId,
    sessionId,
    termId
}) {

    const sql = `
        SELECT

            r.*,

            sub.subject_name,

            sub.subject_code,

            c.class_name,

            ca.arm_name

        FROM results r

        INNER JOIN subjects sub
            ON sub.id = r.subject_id

        INNER JOIN classes c
            ON c.id = r.class_id

        LEFT JOIN class_arms ca
            ON ca.id = r.class_arm_id

        WHERE r.school_id = $1

          AND r.student_id = $2

          AND r.session_id = $3

          AND r.term_id = $4

        ORDER BY

            sub.subject_name ASC
    `;


    const result = await query(
        sql,
        [
            schoolId,
            studentId,
            sessionId,
            termId
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Class Results
|--------------------------------------------------------------------------
*/

async function getClassResults({
    schoolId,
    classId,
    classArmId = null,
    sessionId,
    termId,
    subjectId = null
}) {

    let sql = `
        SELECT

            r.*,

            s.admission_number,

            s.first_name,

            s.middle_name,

            s.last_name,

            sub.subject_name,

            sub.subject_code

        FROM results r

        INNER JOIN students s
            ON s.id = r.student_id

        INNER JOIN subjects sub
            ON sub.id = r.subject_id

        WHERE r.school_id = $1

          AND r.class_id = $2

          AND r.session_id = $3

          AND r.term_id = $4
    `;


    const values = [
        schoolId,
        classId,
        sessionId,
        termId
    ];


    if (classArmId) {

        values.push(classArmId);

        sql += `
            AND r.class_arm_id = $${values.length}
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
| Update Result
|--------------------------------------------------------------------------
*/

async function updateResult(
    resultId,
    schoolId,
    data
) {

    const allowedFields = {

        classId:
            "class_id",

        classArmId:
            "class_arm_id",

        subjectId:
            "subject_id",

        sessionId:
            "session_id",

        termId:
            "term_id",

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
            "teacher_comment"

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

            values.push(
                data[key]
            );


            updates.push(
                `${allowedFields[key]} = $${values.length}`
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Automatically recalculate total
    |--------------------------------------------------------------------------
    */

    if (
        data.caScore !== undefined ||
        data.examScore !== undefined
    ) {

        const ca =
            data.caScore !== undefined
                ? Number(data.caScore)
                : null;

        const exam =
            data.examScore !== undefined
                ? Number(data.examScore)
                : null;


        if (
            ca !== null &&
            exam !== null
        ) {

            values.push(
                ca + exam
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
| Student Result Summary
|--------------------------------------------------------------------------
*/

async function getStudentResultSummary({
    schoolId,
    studentId,
    sessionId,
    termId
}) {

    const sql = `
        SELECT

            COUNT(*)::INTEGER
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
                SUM(grade_point),
                0
            ) AS total_grade_point,

            COALESCE(
                AVG(grade_point),
                0
            ) AS average_grade_point

        FROM results

        WHERE school_id = $1

          AND student_id = $2

          AND session_id = $3

          AND term_id = $4
    `;


    const result = await query(
        sql,
        [
            schoolId,
            studentId,
            sessionId,
            termId
        ]
    );


    const row = result.rows[0];


    return {

        subjectCount:
            Number(row.subject_count),

        totalScore:
            Number(row.total_score),

        averageScore:
            Number(
                Number(
                    row.average_score
                ).toFixed(2)
            ),

        totalGradePoint:
            Number(
                row.total_grade_point
            ),

        averageGradePoint:
            Number(
                Number(
                    row.average_grade_point
                ).toFixed(2)
            )

    };
}


/*
|--------------------------------------------------------------------------
| Class Result Summary
|--------------------------------------------------------------------------
*/

async function getClassResultSummary({
    schoolId,
    classId,
    sessionId,
    termId
}) {

    const sql = `
        SELECT

            s.id AS student_id,

            s.admission_number,

            s.first_name,

            s.middle_name,

            s.last_name,

            COUNT(r.id)::INTEGER
                AS subject_count,

            COALESCE(
                SUM(r.total_score),
                0
            ) AS total_score,

            COALESCE(
                AVG(r.total_score),
                0
            ) AS average_score,

            COALESCE(
                SUM(r.grade_point),
                0
            ) AS total_grade_point,

            COALESCE(
                AVG(r.grade_point),
                0
            ) AS average_grade_point

        FROM students s

        INNER JOIN results r
            ON r.student_id = s.id

        WHERE s.school_id = $1

          AND r.class_id = $2

          AND r.session_id = $3

          AND r.term_id = $4

        GROUP BY

            s.id,

            s.admission_number,

            s.first_name,

            s.middle_name,

            s.last_name

        ORDER BY

            average_score DESC
    `;


    const result = await query(
        sql,
        [
            schoolId,
            classId,
            sessionId,
            termId
        ]
    );


    return result.rows.map(
        (row, index) => ({

            studentId:
                row.student_id,

            admissionNumber:
                row.admission_number,

            firstName:
                row.first_name,

            middleName:
                row.middle_name,

            lastName:
                row.last_name,

            subjectCount:
                Number(
                    row.subject_count
                ),

            totalScore:
                Number(
                    row.total_score
                ),

            averageScore:
                Number(
                    Number(
                        row.average_score
                    ).toFixed(2)
                ),

            totalGradePoint:
                Number(
                    row.total_grade_point
                ),

            averageGradePoint:
                Number(
                    Number(
                        row.average_grade_point
                    ).toFixed(2)
                ),

            position:
                index + 1

        })
    );
}


/*
|--------------------------------------------------------------------------
| Subject Result Summary
|--------------------------------------------------------------------------
*/

async function getSubjectResultSummary({
    schoolId,
    classId,
    subjectId,
    sessionId,
    termId
}) {

    const sql = `
        SELECT

            COUNT(*)::INTEGER
                AS student_count,

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

        WHERE school_id = $1

          AND class_id = $2

          AND subject_id = $3

          AND session_id = $4

          AND term_id = $5
    `;


    const result = await query(
        sql,
        [
            schoolId,
            classId,
            subjectId,
            sessionId,
            termId
        ]
    );


    const row = result.rows[0];


    return {

        studentCount:
            Number(
                row.student_count
            ),

        averageScore:
            Number(
                Number(
                    row.average_score
                ).toFixed(2)
            ),

        highestScore:
            Number(
                row.highest_score
            ),

        lowestScore:
            Number(
                row.lowest_score
            )

    };
}


/*
|--------------------------------------------------------------------------
| Get Result Statistics
|--------------------------------------------------------------------------
*/

async function getResultStatistics(
    schoolId,
    sessionId = null,
    termId = null
) {

    let sql = `
        SELECT

            COUNT(*)::INTEGER
                AS total_results,

            COALESCE(
                AVG(total_score),
                0
            ) AS average_score,

            COUNT(
                CASE
                    WHEN grade = 'A'
                    THEN 1
                END
            )::INTEGER
                AS grade_a,

            COUNT(
                CASE
                    WHEN grade = 'B'
                    THEN 1
                END
            )::INTEGER
                AS grade_b,

            COUNT(
                CASE
                    WHEN grade = 'C'
                    THEN 1
                END
            )::INTEGER
                AS grade_c,

            COUNT(
                CASE
                    WHEN grade = 'D'
                    THEN 1
                END
            )::INTEGER
                AS grade_d,

            COUNT(
                CASE
                    WHEN grade = 'E'
                    THEN 1
                END
            )::INTEGER
                AS grade_e,

            COUNT(
                CASE
                    WHEN grade = 'F'
                    THEN 1
                END
            )::INTEGER
                AS grade_f

        FROM results

        WHERE school_id = $1
    `;


    const values = [
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

        totalResults:
            Number(row.total_results),

        averageScore:
            Number(
                Number(
                    row.average_score
                ).toFixed(2)
            ),

        gradeA:
            Number(row.grade_a),

        gradeB:
            Number(row.grade_b),

        gradeC:
            Number(row.grade_c),

        gradeD:
            Number(row.grade_d),

        gradeE:
            Number(row.grade_e),

        gradeF:
            Number(row.grade_f)

    };
}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    createResult,

    createBulkResults,

    findResultById,

    getStudentResults,

    getClassResults,

    updateResult,

    deleteResult,

    getStudentResultSummary,

    getClassResultSummary,

    getSubjectResultSummary,

    getResultStatistics

};