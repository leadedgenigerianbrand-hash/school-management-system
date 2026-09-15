"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| REPORT MODEL
|--------------------------------------------------------------------------
|
| Central reporting/data-summary layer for the school management system.
|
| Responsibilities:
| - School overview
| - Student statistics
| - Students by class
| - Staff statistics
| - Staff by department
| - Fee statistics
| - Attendance statistics
| - Result statistics
| - Academic session reports
| - Class reports
| - Dashboard reports
|
| This model is read-only.
|
| It does not create, update or delete business records.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Validation Helpers
|--------------------------------------------------------------------------
*/

function validateRequired(value, fieldName) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        throw new Error(`${fieldName} is required`);
    }

    return value;
}

function validateId(value, fieldName) {
    validateRequired(value, fieldName);

    const id = String(value).trim();

    if (id.length === 0) {
        throw new Error(`${fieldName} is invalid`);
    }

    return id;
}

/*
|--------------------------------------------------------------------------
| School Overview
|--------------------------------------------------------------------------
*/

async function getSchoolOverview(schoolId) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    const sql = `
        SELECT
            (
                SELECT COUNT(*)
                FROM students
                WHERE school_id = $1
            )::INTEGER AS total_students,

            (
                SELECT COUNT(*)
                FROM students
                WHERE school_id = $1
                  AND LOWER(COALESCE(status, '')) = 'active'
            )::INTEGER AS active_students,

            (
                SELECT COUNT(*)
                FROM staff
                WHERE school_id = $1
            )::INTEGER AS total_staff,

            (
                SELECT COUNT(*)
                FROM staff
                WHERE school_id = $1
                  AND LOWER(COALESCE(status, '')) = 'active'
            )::INTEGER AS active_staff,

            (
                SELECT COUNT(*)
                FROM classes
                WHERE school_id = $1
            )::INTEGER AS total_classes,

            (
                SELECT COUNT(*)
                FROM subjects
                WHERE school_id = $1
            )::INTEGER AS total_subjects,

            (
                SELECT COUNT(*)
                FROM guardians
                WHERE school_id = $1
            )::INTEGER AS total_guardians
    `;

    const result = await query(
        sql,
        [validSchoolId]
    );

    const row = result.rows[0] || {};

    return {
        totalStudents: Number(
            row.total_students || 0
        ),
        activeStudents: Number(
            row.active_students || 0
        ),
        totalStaff: Number(
            row.total_staff || 0
        ),
        activeStaff: Number(
            row.active_staff || 0
        ),
        totalClasses: Number(
            row.total_classes || 0
        ),
        totalSubjects: Number(
            row.total_subjects || 0
        ),
        totalGuardians: Number(
            row.total_guardians || 0
        )
    };
}

/*
|--------------------------------------------------------------------------
| Student Statistics
|--------------------------------------------------------------------------
*/

async function getStudentStatistics(schoolId) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    const sql = `
        SELECT
            COUNT(*)::INTEGER AS total_students,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(status, '')) = 'active'
            )::INTEGER AS active_students,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(status, '')) <> 'active'
                   OR status IS NULL
            )::INTEGER AS inactive_students,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(gender, '')) = 'male'
            )::INTEGER AS male_students,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(gender, '')) = 'female'
            )::INTEGER AS female_students

        FROM students

        WHERE school_id = $1
    `;

    const result = await query(
        sql,
        [validSchoolId]
    );

    const row = result.rows[0] || {};

    return {
        totalStudents: Number(
            row.total_students || 0
        ),
        activeStudents: Number(
            row.active_students || 0
        ),
        inactiveStudents: Number(
            row.inactive_students || 0
        ),
        maleStudents: Number(
            row.male_students || 0
        ),
        femaleStudents: Number(
            row.female_students || 0
        )
    };
}

/*
|--------------------------------------------------------------------------
| Students By Class
|--------------------------------------------------------------------------
*/

async function getStudentsByClass(
    schoolId,
    sessionId = null
) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    let sql = `
        SELECT
            c.id AS class_id,
            c.class_name,
            c.class_code,
            COUNT(DISTINCT se.student_id)::INTEGER
                AS student_count

        FROM classes c

        LEFT JOIN student_enrollments se
            ON se.class_id = c.id
           AND se.school_id = c.school_id
           AND se.admission_status IN (
                'Enrolled',
                'Promoted',
                'Repeated'
           )
    `;

    const values = [
        validSchoolId
    ];

    sql += `
        WHERE c.school_id = $1
    `;

    if (sessionId) {
        values.push(
            validateId(
                sessionId,
                "Academic Session ID"
            )
        );

        sql += `
            AND se.academic_session_id = $${values.length}
        `;
    }

    sql += `
        GROUP BY
            c.id,
            c.class_name,
            c.class_code,
            c.class_order

        ORDER BY
            c.class_order ASC NULLS LAST,
            c.class_name ASC
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows.map(row => ({
        classId: row.class_id,
        className: row.class_name,
        classCode: row.class_code,
        studentCount: Number(
            row.student_count || 0
        )
    }));
}

/*
|--------------------------------------------------------------------------
| Staff Statistics
|--------------------------------------------------------------------------
*/

async function getStaffStatistics(schoolId) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    const sql = `
        SELECT
            COUNT(*)::INTEGER AS total_staff,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(status, '')) = 'active'
            )::INTEGER AS active_staff,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(status, '')) <> 'active'
                   OR status IS NULL
            )::INTEGER AS inactive_staff

        FROM staff

        WHERE school_id = $1
    `;

    const result = await query(
        sql,
        [validSchoolId]
    );

    const row = result.rows[0] || {};

    return {
        totalStaff: Number(
            row.total_staff || 0
        ),
        activeStaff: Number(
            row.active_staff || 0
        ),
        inactiveStaff: Number(
            row.inactive_staff || 0
        )
    };
}

/*
|--------------------------------------------------------------------------
| Staff By Department
|--------------------------------------------------------------------------
*/

async function getStaffByDepartment(schoolId) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    const sql = `
        SELECT
            d.id AS department_id,
            COALESCE(
                NULLIF(TRIM(d.department_name), ''),
                'Unassigned'
            ) AS department_name,
            COUNT(s.id)::INTEGER AS staff_count

        FROM departments d

        LEFT JOIN staff s
            ON s.department_id = d.id
           AND s.school_id = d.school_id

        WHERE d.school_id = $1

        GROUP BY
            d.id,
            d.department_name

        ORDER BY
            department_name ASC
    `;

    const result = await query(
        sql,
        [validSchoolId]
    );

    return result.rows.map(row => ({
        departmentId: row.department_id,
        departmentName: row.department_name,
        staffCount: Number(
            row.staff_count || 0
        )
    }));
}

/*
|--------------------------------------------------------------------------
| Fee Statistics
|--------------------------------------------------------------------------
*/

async function getFeeStatistics(schoolId) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    const sql = `
        SELECT
            COALESCE(
                SUM(amount_due),
                0
            ) AS total_billed,

            COALESCE(
                SUM(amount_paid),
                0
            ) AS total_paid,

            COALESCE(
                SUM(balance),
                0
            ) AS total_outstanding,

            COUNT(*)::INTEGER AS total_records,

            COUNT(*) FILTER (
                WHERE LOWER(
                    COALESCE(payment_status, '')
                ) = 'paid'
            )::INTEGER AS paid_records,

            COUNT(*) FILTER (
                WHERE LOWER(
                    COALESCE(payment_status, '')
                ) = 'partially paid'
            )::INTEGER AS partially_paid_records,

            COUNT(*) FILTER (
                WHERE LOWER(
                    COALESCE(payment_status, '')
                ) = 'unpaid'
            )::INTEGER AS unpaid_records

        FROM student_fees

        WHERE school_id = $1
    `;

    const result = await query(
        sql,
        [validSchoolId]
    );

    const row = result.rows[0] || {};

    return {
        totalBilled: Number(
            row.total_billed || 0
        ),
        totalPaid: Number(
            row.total_paid || 0
        ),
        totalOutstanding: Number(
            row.total_outstanding || 0
        ),
        totalRecords: Number(
            row.total_records || 0
        ),
        paidRecords: Number(
            row.paid_records || 0
        ),
        partiallyPaidRecords: Number(
            row.partially_paid_records || 0
        ),
        unpaidRecords: Number(
            row.unpaid_records || 0
        )
    };
}

/*
|--------------------------------------------------------------------------
| Attendance Statistics
|--------------------------------------------------------------------------
*/

async function getAttendanceStatistics(
    schoolId,
    startDate = null,
    endDate = null,
    sessionId = null
) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_records,

            COUNT(*) FILTER (
                WHERE LOWER(
                    COALESCE(status, '')
                ) = 'present'
            )::INTEGER AS present,

            COUNT(*) FILTER (
                WHERE LOWER(
                    COALESCE(status, '')
                ) = 'absent'
            )::INTEGER AS absent,

            COUNT(*) FILTER (
                WHERE LOWER(
                    COALESCE(status, '')
                ) = 'late'
            )::INTEGER AS late,

            COUNT(*) FILTER (
                WHERE LOWER(
                    COALESCE(status, '')
                ) = 'excused'
            )::INTEGER AS excused

        FROM attendance

        WHERE school_id = $1
    `;

    const values = [
        validSchoolId
    ];

    if (startDate) {
        values.push(startDate);

        sql += `
            AND attendance_date >= $${values.length}
        `;
    }

    if (endDate) {
        values.push(endDate);

        sql += `
            AND attendance_date <= $${values.length}
        `;
    }

    if (sessionId) {
        values.push(
            validateId(
                sessionId,
                "Academic Session ID"
            )
        );

        sql += `
            AND academic_session_id = $${values.length}
        `;
    }

    const result = await query(
        sql,
        values
    );

    const row = result.rows[0] || {};

    const totalRecords = Number(
        row.total_records || 0
    );

    const present = Number(
        row.present || 0
    );

    const attendanceRate =
        totalRecords > 0
            ? Number(
                (
                    (present / totalRecords) *
                    100
                ).toFixed(2)
            )
            : 0;

    return {
        totalRecords,
        present,
        absent: Number(
            row.absent || 0
        ),
        late: Number(
            row.late || 0
        ),
        excused: Number(
            row.excused || 0
        ),
        attendanceRate
    };
}

/*
|--------------------------------------------------------------------------
| Result Statistics
|--------------------------------------------------------------------------
*/

async function getResultStatistics(
    schoolId,
    sessionId = null,
    termId = null
) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_results,

            COUNT(*) FILTER (
                WHERE UPPER(
                    COALESCE(grade, '')
                ) = 'A'
            )::INTEGER AS grade_a,

            COUNT(*) FILTER (
                WHERE UPPER(
                    COALESCE(grade, '')
                ) = 'B'
            )::INTEGER AS grade_b,

            COUNT(*) FILTER (
                WHERE UPPER(
                    COALESCE(grade, '')
                ) = 'C'
            )::INTEGER AS grade_c,

            COUNT(*) FILTER (
                WHERE UPPER(
                    COALESCE(grade, '')
                ) = 'D'
            )::INTEGER AS grade_d,

            COUNT(*) FILTER (
                WHERE UPPER(
                    COALESCE(grade, '')
                ) = 'E'
            )::INTEGER AS grade_e,

            COUNT(*) FILTER (
                WHERE UPPER(
                    COALESCE(grade, '')
                ) = 'F'
            )::INTEGER AS grade_f

        FROM results

        WHERE school_id = $1
    `;

    const values = [
        validSchoolId
    ];

    if (sessionId) {
        values.push(
            validateId(
                sessionId,
                "Academic Session ID"
            )
        );

        sql += `
            AND academic_session_id = $${values.length}
        `;
    }

    if (termId) {
        values.push(
            validateId(
                termId,
                "Term ID"
            )
        );

        sql += `
            AND term_id = $${values.length}
        `;
    }

    const result = await query(
        sql,
        values
    );

    const row = result.rows[0] || {};

    return {
        totalResults: Number(
            row.total_results || 0
        ),
        gradeA: Number(
            row.grade_a || 0
        ),
        gradeB: Number(
            row.grade_b || 0
        ),
        gradeC: Number(
            row.grade_c || 0
        ),
        gradeD: Number(
            row.grade_d || 0
        ),
        gradeE: Number(
            row.grade_e || 0
        ),
        gradeF: Number(
            row.grade_f || 0
        )
    };
}

/*
|--------------------------------------------------------------------------
| Academic Session Report
|--------------------------------------------------------------------------
*/

async function getAcademicSessionReport(
    schoolId,
    sessionId
) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    const validSessionId = validateId(
        sessionId,
        "Academic Session ID"
    );

    const sql = `
        SELECT
            s.id AS session_id,
            s.session_name,
            s.start_date,
            s.end_date,
            s.is_current,
            s.is_active,

            (
                SELECT COUNT(*)
                FROM terms t
                WHERE t.school_id = s.school_id
                  AND t.academic_session_id = s.id
            )::INTEGER AS total_terms,

            (
                SELECT COUNT(*)
                FROM student_enrollments se
                WHERE se.school_id = s.school_id
                  AND se.academic_session_id = s.id
            )::INTEGER AS total_enrollments,

            (
                SELECT COUNT(DISTINCT se.student_id)
                FROM student_enrollments se
                WHERE se.school_id = s.school_id
                  AND se.academic_session_id = s.id
            )::INTEGER AS total_students

        FROM academic_sessions s

        WHERE s.id = $1
          AND s.school_id = $2

        LIMIT 1
    `;

    const result = await query(
        sql,
        [
            validSessionId,
            validSchoolId
        ]
    );

    if (!result.rows[0]) {
        return null;
    }

    const row = result.rows[0];

    return {
        sessionId: row.session_id,
        sessionName: row.session_name,
        startDate: row.start_date,
        endDate: row.end_date,
        isCurrent: row.is_current,
        isActive: row.is_active,
        totalTerms: Number(
            row.total_terms || 0
        ),
        totalEnrollments: Number(
            row.total_enrollments || 0
        ),
        totalStudents: Number(
            row.total_students || 0
        )
    };
}

/*
|--------------------------------------------------------------------------
| Class Report
|--------------------------------------------------------------------------
*/

async function getClassReport(
    schoolId,
    classId,
    sessionId = null
) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    const validClassId = validateId(
        classId,
        "Class ID"
    );

    let sql = `
        SELECT
            c.id AS class_id,
            c.class_name,
            c.class_code,

            COUNT(DISTINCT se.student_id)::INTEGER
                AS student_count,

            COUNT(DISTINCT cs.subject_id)::INTEGER
                AS subject_count

        FROM classes c

        LEFT JOIN student_enrollments se
            ON se.class_id = c.id
           AND se.school_id = c.school_id
           AND se.admission_status IN (
                'Enrolled',
                'Promoted',
                'Repeated'
           )

        LEFT JOIN class_subjects cs
            ON cs.class_id = c.id

        WHERE c.id = $1
          AND c.school_id = $2
    `;

    const values = [
        validClassId,
        validSchoolId
    ];

    if (sessionId) {
        values.push(
            validateId(
                sessionId,
                "Academic Session ID"
            )
        );

        sql += `
            AND (
                se.academic_session_id = $${values.length}
                OR se.academic_session_id IS NULL
            )
        `;
    }

    sql += `
        GROUP BY
            c.id,
            c.class_name,
            c.class_code

        LIMIT 1
    `;

    const result = await query(
        sql,
        values
    );

    if (!result.rows[0]) {
        return null;
    }

    const row = result.rows[0];

    return {
        classId: row.class_id,
        className: row.class_name,
        classCode: row.class_code,
        studentCount: Number(
            row.student_count || 0
        ),
        subjectCount: Number(
            row.subject_count || 0
        )
    };
}

/*
|--------------------------------------------------------------------------
| Dashboard Report
|--------------------------------------------------------------------------
*/

async function getDashboardReport(schoolId) {
    const validSchoolId = validateId(
        schoolId,
        "School ID"
    );

    const [
        overview,
        students,
        staff,
        fees,
        attendance,
        results
    ] = await Promise.all([
        getSchoolOverview(validSchoolId),
        getStudentStatistics(validSchoolId),
        getStaffStatistics(validSchoolId),
        getFeeStatistics(validSchoolId),
        getAttendanceStatistics(validSchoolId),
        getResultStatistics(validSchoolId)
    ]);

    return {
        overview,
        students,
        staff,
        fees,
        attendance,
        results
    };
}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    getSchoolOverview,
    getStudentStatistics,
    getStudentsByClass,
    getStaffStatistics,
    getStaffByDepartment,
    getFeeStatistics,
    getAttendanceStatistics,
    getResultStatistics,
    getAcademicSessionReport,
    getClassReport,
    getDashboardReport
};