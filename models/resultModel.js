"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| RESULT MODEL
|--------------------------------------------------------------------------
|
| Database table:
| results
|
| Responsibilities:
| - Create results
| - Bulk result entry
| - Find individual results
| - Retrieve student results
| - Retrieve class results
| - Retrieve subject results
| - Search results
| - Update results
| - Delete results
| - Publish and unpublish results
| - Approve results
| - Student result summaries
| - Class result rankings
| - Subject result summaries
| - Result statistics
|
| Score structure:
| CA    = 0 - 40
| Exam  = 0 - 60
| Total = CA + Exam
|
| All operations are school-scoped.
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| VALIDATION HELPERS
|--------------------------------------------------------------------------
*/

function requireSchoolId(schoolId) {
    if (!schoolId) {
        throw new Error("School ID is required");
    }

    return schoolId;
}

function requireResultId(resultId) {
    if (!resultId) {
        throw new Error("Result ID is required");
    }

    return resultId;
}

function requireStudentId(studentId) {
    if (!studentId) {
        throw new Error("Student ID is required");
    }

    return studentId;
}

function requireClassId(classId) {
    if (!classId) {
        throw new Error("Class ID is required");
    }

    return classId;
}

function requireSubjectId(subjectId) {
    if (!subjectId) {
        throw new Error("Subject ID is required");
    }

    return subjectId;
}

function requireSessionId(sessionId) {
    if (!sessionId) {
        throw new Error("Academic session ID is required");
    }

    return sessionId;
}

function requireTermId(termId) {
    if (!termId) {
        throw new Error("Term ID is required");
    }

    return termId;
}

function normalizeScore(
    value,
    fieldName,
    minimum,
    maximum
) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(
            fieldName + " must be a valid number"
        );
    }

    if (
        number < minimum ||
        number > maximum
    ) {
        throw new Error(
            fieldName +
            " must be between " +
            minimum +
            " and " +
            maximum
        );
    }

    return number;
}

function normalizeOptionalNumber(
    value,
    fieldName
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(
            fieldName + " must be a valid number"
        );
    }

    return number;
}

function normalizeOptionalInteger(
    value,
    fieldName
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number < 1
    ) {
        throw new Error(
            fieldName +
            " must be a valid positive integer"
        );
    }

    return number;
}

function normalizeBoolean(
    value,
    defaultValue = false
) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    if (
        value === "true" ||
        value === "1" ||
        value === 1
    ) {
        return true;
    }

    if (
        value === "false" ||
        value === "0" ||
        value === 0
    ) {
        return false;
    }

    return Boolean(value);
}

function normalizeText(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const text = String(value).trim();

    return text || null;
}

function calculateTotal(
    caScore,
    examScore
) {
    const ca = normalizeScore(
        caScore,
        "CA score",
        0,
        40
    );

    const exam = normalizeScore(
        examScore,
        "Exam score",
        0,
        60
    );

    return {
        ca,
        exam,
        total: ca + exam
    };
}

/*
|--------------------------------------------------------------------------
| COMMON RESULT SELECT
|--------------------------------------------------------------------------
*/

const resultSelect = `
    SELECT
        r.*,

        s.admission_number,
        s.first_name,
        s.middle_name,
        s.last_name,

        sub.subject_name,
        sub.subject_code,

        c.class_name,
        c.class_code,

        a.session_name,

        t.term_name,
        t.term_order

    FROM results r

    JOIN students s
        ON s.id = r.student_id

    JOIN subjects sub
        ON sub.id = r.subject_id

    JOIN classes c
        ON c.id = r.class_id

    JOIN academic_sessions a
        ON a.id = r.academic_session_id

    JOIN terms t
        ON t.id = r.term_id
`;

/*
|--------------------------------------------------------------------------
| CREATE RESULT
|--------------------------------------------------------------------------
*/

async function createResult({
    schoolId,
    studentId,
    classId,
    subjectId,
    sessionId,
    termId,
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
    requireSchoolId(schoolId);
    requireStudentId(studentId);
    requireClassId(classId);
    requireSubjectId(subjectId);
    requireSessionId(sessionId);
    requireTermId(termId);

    const scores = calculateTotal(
        caScore,
        examScore
    );

    if (
        totalScore !== undefined &&
        totalScore !== null &&
        totalScore !== ""
    ) {
        const suppliedTotal =
            Number(totalScore);

        if (
            !Number.isFinite(suppliedTotal) ||
            suppliedTotal !== scores.total
        ) {
            throw new Error(
                "Total score must equal CA + Exam (" +
                scores.total +
                ")"
            );
        }
    }

    const normalizedGrade =
        normalizeText(grade);

    const normalizedGradePoint =
        normalizeOptionalNumber(
            gradePoint,
            "Grade point"
        );

    const normalizedPosition =
        normalizeOptionalInteger(
            position,
            "Position"
        );

    const normalizedTeacherRemark =
        normalizeText(teacherRemark);

    const normalizedPrincipalRemark =
        normalizeText(principalRemark);

    const published =
        normalizeBoolean(
            isPublished,
            false
        );

    const sql = `
        INSERT INTO results (
            student_id,
            school_id,
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
        ON CONFLICT (
            student_id,
            academic_session_id,
            term_id,
            subject_id
        )
        DO UPDATE SET
            school_id = EXCLUDED.school_id,
            class_id = EXCLUDED.class_id,
            ca_score = EXCLUDED.ca_score,
            exam_score = EXCLUDED.exam_score,
            total_score = EXCLUDED.total_score,
            grade = EXCLUDED.grade,
            grade_point = EXCLUDED.grade_point,
            position = EXCLUDED.position,
            teacher_remark = EXCLUDED.teacher_remark,
            principal_remark = EXCLUDED.principal_remark,
            is_published = EXCLUDED.is_published,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
    `;

    const result = await query(sql, [
        studentId,
        schoolId,
        sessionId,
        termId,
        classId,
        subjectId,
        scores.ca,
        scores.exam,
        scores.total,
        normalizedGrade,
        normalizedGradePoint,
        normalizedPosition,
        normalizedTeacherRemark,
        normalizedPrincipalRemark,
        published
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| CREATE BULK RESULTS
|--------------------------------------------------------------------------
*/

async function createBulkResults(results) {
    if (!Array.isArray(results)) {
        throw new Error("Results must be an array");
    }

    if (results.length === 0) {
        return [];
    }

    const created = [];

    for (const resultData of results) {
        created.push(
            await createResult(resultData)
        );
    }

    return created;
}

/*
|--------------------------------------------------------------------------
| FIND RESULT BY ID
|--------------------------------------------------------------------------
*/

async function findResultById(
    resultId,
    schoolId
) {
    requireResultId(resultId);
    requireSchoolId(schoolId);

    const sql = `
        ${resultSelect}
        WHERE r.id = $1
          AND r.school_id = $2
        LIMIT 1
    `;

    const result = await query(sql, [
        resultId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| GET ALL RESULTS
|--------------------------------------------------------------------------
*/

async function getAllResults({
    schoolId,
    sessionId = null,
    termId = null,
    classId = null,
    subjectId = null
}) {
    requireSchoolId(schoolId);

    const sql = `
        ${resultSelect}

        WHERE r.school_id = $1

          AND (
              $2::uuid IS NULL
              OR r.academic_session_id = $2
          )

          AND (
              $3::uuid IS NULL
              OR r.term_id = $3
          )

          AND (
              $4::uuid IS NULL
              OR r.class_id = $4
          )

          AND (
              $5::uuid IS NULL
              OR r.subject_id = $5
          )

        ORDER BY
            s.first_name ASC,
            s.last_name ASC,
            sub.subject_name ASC
    `;

    const result = await query(sql, [
        schoolId,
        sessionId,
        termId,
        classId,
        subjectId
    ]);

    return result.rows;
}

const findAllResults =
    getAllResults;

/*
|--------------------------------------------------------------------------
| GET STUDENT RESULTS
|--------------------------------------------------------------------------
*/

async function getStudentResults({
    schoolId,
    studentId,
    sessionId,
    termId
}) {
    requireSchoolId(schoolId);
    requireStudentId(studentId);
    requireSessionId(sessionId);
    requireTermId(termId);

    const sql = `
        ${resultSelect}

        WHERE r.school_id = $1
          AND r.student_id = $2
          AND r.academic_session_id = $3
          AND r.term_id = $4

        ORDER BY
            sub.subject_name ASC
    `;

    const result = await query(sql, [
        schoolId,
        studentId,
        sessionId,
        termId
    ]);

    return result.rows;
}

async function findStudentResults(
    schoolId,
    studentId,
    sessionId,
    termId
) {
    return getStudentResults({
        schoolId,
        studentId,
        sessionId,
        termId
    });
}

/*
|--------------------------------------------------------------------------
| GET CLASS RESULTS
|--------------------------------------------------------------------------
*/

async function getClassResults({
    schoolId,
    classId,
    sessionId,
    termId,
    subjectId = null
}) {
    requireSchoolId(schoolId);
    requireClassId(classId);
    requireSessionId(sessionId);
    requireTermId(termId);

    const sql = `
        ${resultSelect}

        WHERE r.school_id = $1
          AND r.class_id = $2
          AND r.academic_session_id = $3
          AND r.term_id = $4

          AND (
              $5::uuid IS NULL
              OR r.subject_id = $5
          )

        ORDER BY
            s.first_name ASC,
            s.last_name ASC,
            sub.subject_name ASC
    `;

    const result = await query(sql, [
        schoolId,
        classId,
        sessionId,
        termId,
        subjectId
    ]);

    return result.rows;
}

async function findClassResults(
    schoolId,
    classId,
    sessionId,
    termId,
    subjectId = null
) {
    return getClassResults({
        schoolId,
        classId,
        sessionId,
        termId,
        subjectId
    });
}

/*
|--------------------------------------------------------------------------
| GET SUBJECT RESULTS
|--------------------------------------------------------------------------
*/

async function getSubjectResults({
    schoolId,
    subjectId,
    sessionId,
    termId,
    classId = null
}) {
    requireSchoolId(schoolId);
    requireSubjectId(subjectId);
    requireSessionId(sessionId);
    requireTermId(termId);

    const sql = `
        ${resultSelect}

        WHERE r.school_id = $1
          AND r.subject_id = $2
          AND r.academic_session_id = $3
          AND r.term_id = $4

          AND (
              $5::uuid IS NULL
              OR r.class_id = $5
          )

        ORDER BY
            r.total_score DESC,
            s.first_name ASC,
            s.last_name ASC
    `;

    const result = await query(sql, [
        schoolId,
        subjectId,
        sessionId,
        termId,
        classId
    ]);

    return result.rows;
}

async function findSubjectResults(
    schoolId,
    subjectId,
    sessionId,
    termId,
    classId = null
) {
    return getSubjectResults({
        schoolId,
        subjectId,
        sessionId,
        termId,
        classId
    });
}

/*
|--------------------------------------------------------------------------
| SEARCH RESULTS
|--------------------------------------------------------------------------
*/

async function searchResults(
    searchTerm,
    schoolId
) {
    requireSchoolId(schoolId);

    const term =
        String(searchTerm || "").trim();

    if (!term) {
        return getAllResults({
            schoolId
        });
    }

    const search =
        "%" + term + "%";

    const sql = `
        ${resultSelect}

        WHERE r.school_id = $1

          AND (
              CONCAT_WS(
                  ' ',
                  s.first_name,
                  s.middle_name,
                  s.last_name
              ) ILIKE $2

              OR s.admission_number ILIKE $2

              OR sub.subject_name ILIKE $2

              OR sub.subject_code ILIKE $2

              OR c.class_name ILIKE $2

              OR c.class_code ILIKE $2

              OR r.grade ILIKE $2

              OR CAST(r.total_score AS TEXT) ILIKE $2
          )

        ORDER BY
            s.first_name ASC,
            s.last_name ASC,
            sub.subject_name ASC
    `;

    const result = await query(sql, [
        schoolId,
        search
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| UPDATE RESULT
|--------------------------------------------------------------------------
*/

async function updateResult(
    resultId,
    schoolId,
    data = {}
) {
    requireResultId(resultId);
    requireSchoolId(schoolId);

    if (
        !data ||
        typeof data !== "object"
    ) {
        throw new Error(
            "Result update data is required"
        );
    }

    const existingSql = `
        SELECT
            id,
            student_id,
            class_id,
            subject_id,
            academic_session_id,
            term_id,
            ca_score,
            exam_score,
            total_score,
            grade,
            grade_point,
            position,
            teacher_remark,
            principal_remark,
            is_published
        FROM results
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
    `;

    const existing =
        await query(existingSql, [
            resultId,
            schoolId
        ]);

    if (existing.rows.length === 0) {
        return null;
    }

    const current =
        existing.rows[0];

    const studentId =
        data.studentId !== undefined
            ? data.studentId
            : current.student_id;

    const classId =
        data.classId !== undefined
            ? data.classId
            : current.class_id;

    const subjectId =
        data.subjectId !== undefined
            ? data.subjectId
            : current.subject_id;

    const sessionId =
        data.sessionId !== undefined
            ? data.sessionId
            : current.academic_session_id;

    const termId =
        data.termId !== undefined
            ? data.termId
            : current.term_id;

    const caScore =
        data.caScore !== undefined
            ? data.caScore
            : current.ca_score;

    const examScore =
        data.examScore !== undefined
            ? data.examScore
            : current.exam_score;

    const scores =
        calculateTotal(
            caScore,
            examScore
        );

    const grade =
        data.grade !== undefined
            ? normalizeText(data.grade)
            : current.grade;

    const gradePoint =
        data.gradePoint !== undefined
            ? normalizeOptionalNumber(
                data.gradePoint,
                "Grade point"
            )
            : current.grade_point;

    const position =
        data.position !== undefined
            ? normalizeOptionalInteger(
                data.position,
                "Position"
            )
            : current.position;

    const teacherRemark =
        data.teacherRemark !== undefined
            ? normalizeText(
                data.teacherRemark
            )
            : (
                data.remark !== undefined
                    ? normalizeText(
                        data.remark
                    )
                    : current.teacher_remark
            );

    const principalRemark =
        data.principalRemark !== undefined
            ? normalizeText(
                data.principalRemark
            )
            : current.principal_remark;

    const isPublished =
        data.isPublished !== undefined
            ? normalizeBoolean(
                data.isPublished
            )
            : current.is_published;

    const sql = `
        UPDATE results
        SET
            student_id = $1,
            class_id = $2,
            subject_id = $3,
            academic_session_id = $4,
            term_id = $5,
            ca_score = $6,
            exam_score = $7,
            total_score = $8,
            grade = $9,
            grade_point = $10,
            position = $11,
            teacher_remark = $12,
            principal_remark = $13,
            is_published = $14,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
          AND school_id = $16
        RETURNING *
    `;

    const result = await query(sql, [
        studentId,
        classId,
        subjectId,
        sessionId,
        termId,
        scores.ca,
        scores.exam,
        scores.total,
        grade,
        gradePoint,
        position,
        teacherRemark,
        principalRemark,
        isPublished,
        resultId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| DELETE RESULT
|--------------------------------------------------------------------------
*/

async function deleteResult(
    resultId,
    schoolId
) {
    requireResultId(resultId);
    requireSchoolId(schoolId);

    const sql = `
        DELETE FROM results
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        resultId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| PUBLISH RESULT
|--------------------------------------------------------------------------
*/

async function publishResult(
    resultId,
    schoolId
) {
    requireResultId(resultId);
    requireSchoolId(schoolId);

    const sql = `
        UPDATE results
        SET
            is_published = TRUE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        resultId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| UNPUBLISH RESULT
|--------------------------------------------------------------------------
*/

async function unpublishResult(
    resultId,
    schoolId
) {
    requireResultId(resultId);
    requireSchoolId(schoolId);

    const sql = `
        UPDATE results
        SET
            is_published = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        resultId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| APPROVE RESULT
|--------------------------------------------------------------------------
|
| Approval currently means publishing the result.
| A separate approval workflow would require an intentional database/API
| design change.
|--------------------------------------------------------------------------
*/

async function approveResult(
    resultId,
    schoolId
) {
    return publishResult(
        resultId,
        schoolId
    );
}

/*
|--------------------------------------------------------------------------
| STUDENT RESULT SUMMARY
|--------------------------------------------------------------------------
*/

async function getStudentResultSummary({
    schoolId,
    studentId,
    sessionId,
    termId
}) {
    requireSchoolId(schoolId);
    requireStudentId(studentId);
    requireSessionId(sessionId);
    requireTermId(termId);

    const sql = `
        SELECT
            COUNT(*)::INTEGER
                AS subject_count,

            COALESCE(
                SUM(total_score),
                0
            )::NUMERIC
                AS total_score,

            COALESCE(
                AVG(total_score),
                0
            )::NUMERIC(10,2)
                AS average_score,

            COALESCE(
                SUM(grade_point),
                0
            )::NUMERIC
                AS total_grade_point,

            COALESCE(
                AVG(grade_point),
                0
            )::NUMERIC(10,2)
                AS average_grade_point

        FROM results

        WHERE school_id = $1
          AND student_id = $2
          AND academic_session_id = $3
          AND term_id = $4
    `;

    const result = await query(sql, [
        schoolId,
        studentId,
        sessionId,
        termId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| CLASS RESULT SUMMARY
|--------------------------------------------------------------------------
|
| Produces one summary row per student and calculates class position
| from average total score.
|--------------------------------------------------------------------------
*/

async function getClassResultSummary({
    schoolId,
    classId,
    sessionId,
    termId
}) {
    requireSchoolId(schoolId);
    requireClassId(classId);
    requireSessionId(sessionId);
    requireTermId(termId);

    const sql = `
        WITH student_results AS (
            SELECT
                r.student_id,

                COUNT(*)::INTEGER
                    AS subject_count,

                COALESCE(
                    SUM(r.total_score),
                    0
                ) AS total_score,

                COALESCE(
                    AVG(r.total_score),
                    0
                ) AS average_score,

                s.first_name,
                s.middle_name,
                s.last_name,
                s.admission_number

            FROM results r

            JOIN students s
                ON s.id = r.student_id

            WHERE r.school_id = $1
              AND r.class_id = $2
              AND r.academic_session_id = $3
              AND r.term_id = $4

            GROUP BY
                r.student_id,
                s.first_name,
                s.middle_name,
                s.last_name,
                s.admission_number
        ),

        ranked AS (
            SELECT
                *,
                RANK() OVER (
                    ORDER BY average_score DESC
                )::INTEGER AS position

            FROM student_results
        )

        SELECT *
        FROM ranked

        ORDER BY
            position ASC,
            first_name ASC,
            last_name ASC
    `;

    const result = await query(sql, [
        schoolId,
        classId,
        sessionId,
        termId
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| SUBJECT RESULT SUMMARY
|--------------------------------------------------------------------------
*/

async function getSubjectResultSummary({
    schoolId,
    classId,
    subjectId,
    sessionId,
    termId
}) {
    requireSchoolId(schoolId);
    requireClassId(classId);
    requireSubjectId(subjectId);
    requireSessionId(sessionId);
    requireTermId(termId);

    const sql = `
        SELECT
            COUNT(*)::INTEGER
                AS student_count,

            COALESCE(
                AVG(total_score),
                0
            )::NUMERIC(10,2)
                AS average_score,

            COALESCE(
                MAX(total_score),
                0
            )::NUMERIC(10,2)
                AS highest_score,

            COALESCE(
                MIN(total_score),
                0
            )::NUMERIC(10,2)
                AS lowest_score

        FROM results

        WHERE school_id = $1
          AND class_id = $2
          AND subject_id = $3
          AND academic_session_id = $4
          AND term_id = $5
    `;

    const result = await query(sql, [
        schoolId,
        classId,
        subjectId,
        sessionId,
        termId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| RESULT STATISTICS
|--------------------------------------------------------------------------
*/

async function getResultStatistics(
    schoolIdOrOptions,
    sessionId = null,
    termId = null,
    classId = null
) {
    let schoolId =
        schoolIdOrOptions;

    if (
        schoolIdOrOptions &&
        typeof schoolIdOrOptions === "object"
    ) {
        schoolId =
            schoolIdOrOptions.schoolId;

        sessionId =
            schoolIdOrOptions.sessionId ||
            null;

        termId =
            schoolIdOrOptions.termId ||
            null;

        classId =
            schoolIdOrOptions.classId ||
            null;
    }

    requireSchoolId(schoolId);

    const sql = `
        SELECT

            COUNT(*)::INTEGER
                AS total_results,

            COUNT(*) FILTER (
                WHERE total_score >= 40
            )::INTEGER
                AS passed_results,

            COUNT(*) FILTER (
                WHERE total_score < 40
            )::INTEGER
                AS failed_results,

            COALESCE(
                AVG(total_score),
                0
            )::NUMERIC(10,2)
                AS average_score,

            COUNT(*) FILTER (
                WHERE grade = 'A'
            )::INTEGER
                AS grade_a,

            COUNT(*) FILTER (
                WHERE grade = 'B'
            )::INTEGER
                AS grade_b,

            COUNT(*) FILTER (
                WHERE grade = 'C'
            )::INTEGER
                AS grade_c,

            COUNT(*) FILTER (
                WHERE grade = 'D'
            )::INTEGER
                AS grade_d,

            COUNT(*) FILTER (
                WHERE grade = 'E'
            )::INTEGER
                AS grade_e,

            COUNT(*) FILTER (
                WHERE grade = 'F'
            )::INTEGER
                AS grade_f

        FROM results

        WHERE school_id = $1

          AND (
              $2::uuid IS NULL
              OR academic_session_id = $2
          )

          AND (
              $3::uuid IS NULL
              OR term_id = $3
          )

          AND (
              $4::uuid IS NULL
              OR class_id = $4
          )
    `;

    const result = await query(sql, [
        schoolId,
        sessionId,
        termId,
        classId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| GET PUBLISHED RESULTS
|--------------------------------------------------------------------------
*/

async function getPublishedResults({
    schoolId,
    studentId = null,
    sessionId = null,
    termId = null,
    classId = null
}) {
    requireSchoolId(schoolId);

    const sql = `
        ${resultSelect}

        WHERE r.school_id = $1
          AND r.is_published = TRUE

          AND (
              $2::uuid IS NULL
              OR r.student_id = $2
          )

          AND (
              $3::uuid IS NULL
              OR r.academic_session_id = $3
          )

          AND (
              $4::uuid IS NULL
              OR r.term_id = $4
          )

          AND (
              $5::uuid IS NULL
              OR r.class_id = $5
          )

        ORDER BY
            s.first_name ASC,
            s.last_name ASC,
            sub.subject_name ASC
    `;

    const result = await query(sql, [
        schoolId,
        studentId,
        sessionId,
        termId,
        classId
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET RESULT COUNT
|--------------------------------------------------------------------------
*/

async function countResults({
    schoolId,
    sessionId = null,
    termId = null,
    classId = null,
    subjectId = null
}) {
    requireSchoolId(schoolId);

    const sql = `
        SELECT
            COUNT(*)::INTEGER AS result_count
        FROM results

        WHERE school_id = $1

          AND (
              $2::uuid IS NULL
              OR academic_session_id = $2
          )

          AND (
              $3::uuid IS NULL
              OR term_id = $3
          )

          AND (
              $4::uuid IS NULL
              OR class_id = $4
          )

          AND (
              $5::uuid IS NULL
              OR subject_id = $5
          )
    `;

    const result = await query(sql, [
        schoolId,
        sessionId,
        termId,
        classId,
        subjectId
    ]);

    return Number(
        result.rows[0]?.result_count || 0
    );
}

/*
|--------------------------------------------------------------------------
| COMPATIBILITY ALIASES
|--------------------------------------------------------------------------
*/

const getResultById =
    findResultById;

const getResults =
    getAllResults;

const getStudentResult =
    getStudentResults;

const getClassResult =
    getClassResults;

const getSubjectResult =
    getSubjectResults;

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    createResult,
    createBulkResults,

    findResultById,
    getResultById,

    getAllResults,
    getResults,
    findAllResults,

    getStudentResults,
    getStudentResult,
    findStudentResults,

    getClassResults,
    getClassResult,
    findClassResults,

    getSubjectResults,
    getSubjectResult,
    findSubjectResults,

    searchResults,

    updateResult,
    deleteResult,

    publishResult,
    unpublishResult,
    approveResult,

    getStudentResultSummary,
    getClassResultSummary,
    getSubjectResultSummary,

    getResultStatistics,

    getPublishedResults,

    countResults
};