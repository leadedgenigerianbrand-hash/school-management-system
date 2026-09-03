"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Report Model
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| School Overview
|--------------------------------------------------------------------------
*/

async function getSchoolOverview(schoolId) {
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
                  AND LOWER(status) = 'active'
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
                  AND LOWER(status) = 'active'
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

    const result = await query(sql, [schoolId]);
    const row = result.rows[0];

    return {
        totalStudents: Number(row.total_students),
        activeStudents: Number(row.active_students),
        totalStaff: Number(row.total_staff),
        activeStaff: Number(row.active_staff),
        totalClasses: Number(row.total_classes),
        totalSubjects: Number(row.total_subjects),
        totalGuardians: Number(row.total_guardians)
    };
}


/*
|--------------------------------------------------------------------------
| Student Statistics
|--------------------------------------------------------------------------
*/

async function getStudentStatistics(schoolId) {
    const sql = `
        SELECT
            COUNT(*)::INTEGER AS total_students,

            COUNT(*) FILTER (
                WHERE LOWER(status) = 'active'
            )::INTEGER AS active_students,

            COUNT(*) FILTER (
                WHERE LOWER(status) <> 'active'
            )::INTEGER AS inactive_students,

            COUNT(*) FILTER (
                WHERE LOWER(gender) = 'male'
            )::INTEGER AS male_students,

            COUNT(*) FILTER (
                WHERE LOWER(gender) = 'female'
            )::INTEGER AS female_students

        FROM students

        WHERE school_id = $1
    `;

    const result = await query(sql, [schoolId]);
    const row = result.rows[0];

    return {
        totalStudents: Number(row.total_students),
        activeStudents: Number(row.active_students),
        inactiveStudents: Number(row.inactive_students),
        maleStudents: Number(row.male_students),
        femaleStudents: Number(row.female_students)
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
    let sql = `
        SELECT
            c.id AS class_id,
            c.class_name,
            COUNT(DISTINCT se.student_id)::INTEGER AS student_count

        FROM classes c

        LEFT JOIN student_enrollments se
            ON se.class_id = c.id
           AND se.school_id = c.school_id
           AND se.admission_status IN (
                'Enrolled',
                'Promoted',
                'Repeated'
           )

        WHERE c.school_id = $1
    `;

    const values = [schoolId];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND se.academic_session_id = $${values.length}
        `;
    }

    sql += `
        GROUP BY
            c.id,
            c.class_name,
            c.class_order

        ORDER BY
            c.class_order ASC NULLS LAST,
            c.class_name ASC
    `;

    const result = await query(sql, values);

    return result.rows.map(row => ({
        classId: row.class_id,
        className: row.class_name,
        studentCount: Number(row.student_count)
    }));
}


/*
|--------------------------------------------------------------------------
| Staff Statistics
|--------------------------------------------------------------------------
*/

async function getStaffStatistics(schoolId) {
    const sql = `
        SELECT
            COUNT(*)::INTEGER AS total_staff,

            COUNT(*) FILTER (
                WHERE LOWER(status) = 'active'
            )::INTEGER AS active_staff,

            COUNT(*) FILTER (
                WHERE LOWER(status) <> 'active'
            )::INTEGER AS inactive_staff

        FROM staff

        WHERE school_id = $1
    `;

    const result = await query(sql, [schoolId]);
    const row = result.rows[0];

    return {
        totalStaff: Number(row.total_staff),
        activeStaff: Number(row.active_staff),
        inactiveStaff: Number(row.inactive_staff)
    };
}


/*
|--------------------------------------------------------------------------
| Staff By Department
|--------------------------------------------------------------------------
*/

async function getStaffByDepartment(schoolId) {
    const sql = `
        SELECT
            COALESCE(
                NULLIF(TRIM(department), ''),
                'Unassigned'
            ) AS department_name,

            COUNT(*)::INTEGER AS staff_count

        FROM staff

        WHERE school_id = $1

        GROUP BY
            COALESCE(
                NULLIF(TRIM(department), ''),
                'Unassigned'
            )

        ORDER BY
            department_name ASC
    `;

    const result = await query(sql, [schoolId]);

    return result.rows.map(row => ({
        departmentName: row.department_name,
        staffCount: Number(row.staff_count)
    }));
}


/*
|--------------------------------------------------------------------------
| Fee Statistics
|--------------------------------------------------------------------------
*/

async function getFeeStatistics(schoolId) {
    const sql = `
        SELECT
            COALESCE(
                (
                    SELECT SUM(sf.amount_due)
                    FROM student_fees sf
                    WHERE sf.school_id = $1
                ),
                0
            ) AS total_billed,

            COALESCE(
                (
                    SELECT SUM(sf.amount_paid)
                    FROM student_fees sf
                    WHERE sf.school_id = $1
                ),
                0
            ) AS total_paid,

            COALESCE(
                (
                    SELECT SUM(sf.balance)
                    FROM student_fees sf
                    WHERE sf.school_id = $1
                ),
                0
            ) AS total_outstanding,

            (
                SELECT COUNT(*)
                FROM student_fees sf
                WHERE sf.school_id = $1
            )::INTEGER AS total_records
    `;

    const result = await query(sql, [schoolId]);
    const row = result.rows[0];

    return {
        totalBilled: Number(row.total_billed),
        totalPaid: Number(row.total_paid),
        totalOutstanding: Number(row.total_outstanding),
        totalRecords: Number(row.total_records)
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
    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_records,

            COUNT(*) FILTER (
                WHERE LOWER(status) = 'present'
            )::INTEGER AS present,

            COUNT(*) FILTER (
                WHERE LOWER(status) = 'absent'
            )::INTEGER AS absent,

            COUNT(*) FILTER (
                WHERE LOWER(status) = 'late'
            )::INTEGER AS late,

            COUNT(*) FILTER (
                WHERE LOWER(status) = 'excused'
            )::INTEGER AS excused

        FROM attendance

        WHERE school_id = $1
    `;

    const values = [schoolId];

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
        values.push(sessionId);

        sql += `
            AND academic_session_id = $${values.length}
        `;
    }

    const result = await query(sql, values);
    const row = result.rows[0];

    const totalRecords = Number(row.total_records);
    const present = Number(row.present);

    const attendanceRate =
        totalRecords > 0
            ? Number(
                ((present / totalRecords) * 100).toFixed(2)
            )
            : 0;

    return {
        totalRecords,
        present,
        absent: Number(row.absent),
        late: Number(row.late),
        excused: Number(row.excused),
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
    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_results,

            COUNT(*) FILTER (
                WHERE UPPER(grade) = 'A'
            )::INTEGER AS grade_a,

            COUNT(*) FILTER (
                WHERE UPPER(grade) = 'B'
            )::INTEGER AS grade_b,

            COUNT(*) FILTER (
                WHERE UPPER(grade) = 'C'
            )::INTEGER AS grade_c,

            COUNT(*) FILTER (
                WHERE UPPER(grade) = 'D'
            )::INTEGER AS grade_d,

            COUNT(*) FILTER (
                WHERE UPPER(grade) = 'E'
            )::INTEGER AS grade_e,

            COUNT(*) FILTER (
                WHERE UPPER(grade) = 'F'
            )::INTEGER AS grade_f

        FROM results

        WHERE school_id = $1
    `;

    const values = [schoolId];

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
        totalResults: Number(row.total_results),
        gradeA: Number(row.grade_a),
        gradeB: Number(row.grade_b),
        gradeC: Number(row.grade_c),
        gradeD: Number(row.grade_d),
        gradeE: Number(row.grade_e),
        gradeF: Number(row.grade_f)
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

    const result = await query(sql, [
        sessionId,
        schoolId
    ]);

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
        totalTerms: Number(row.total_terms),
        totalEnrollments: Number(row.total_enrollments),
        totalStudents: Number(row.total_students)
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

        WHERE c.id = $2
          AND c.school_id = $1
    `;

    const values = [
        schoolId,
        classId
    ];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND se.academic_session_id = $${values.length}
        `;
    }

    sql += `
        GROUP BY
            c.id,
            c.class_name,
            c.class_code

        LIMIT 1
    `;

    const result = await query(sql, values);

    if (!result.rows[0]) {
        return null;
    }

    const row = result.rows[0];

    return {
        classId: row.class_id,
        className: row.class_name,
        classCode: row.class_code,
        studentCount: Number(row.student_count),
        subjectCount: Number(row.subject_count)
    };
}


/*
|--------------------------------------------------------------------------
| Dashboard Report
|--------------------------------------------------------------------------
*/

async function getDashboardReport(schoolId) {
    const [
        overview,
        students,
        staff,
        fees,
        attendance,
        results
    ] = await Promise.all([
        getSchoolOverview(schoolId),
        getStudentStatistics(schoolId),
        getStaffStatistics(schoolId),
        getFeeStatistics(schoolId),
        getAttendanceStatistics(schoolId),
        getResultStatistics(schoolId)
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