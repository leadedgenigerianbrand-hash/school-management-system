const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Report Model
|--------------------------------------------------------------------------
|
| Handles reporting and dashboard data for the school management system.
|
| Reports supported:
|
| - Student statistics
| - Staff statistics
| - Fee statistics
| - Attendance statistics
| - Result statistics
| - School overview
| - Academic session report
| - Class report
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Get School Overview
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
                  AND status = 'active'
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
                  AND status = 'active'
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
        [schoolId]
    );

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
| Get Student Statistics
|--------------------------------------------------------------------------
*/

async function getStudentStatistics(schoolId) {

    const sql = `
        SELECT

            COUNT(*)::INTEGER AS total_students,

            COUNT(
                CASE
                    WHEN status = 'active'
                    THEN 1
                END
            )::INTEGER AS active_students,

            COUNT(
                CASE
                    WHEN status = 'inactive'
                    THEN 1
                END
            )::INTEGER AS inactive_students,

            COUNT(
                CASE
                    WHEN gender = 'Male'
                    THEN 1
                END
            )::INTEGER AS male_students,

            COUNT(
                CASE
                    WHEN gender = 'Female'
                    THEN 1
                END
            )::INTEGER AS female_students

        FROM students

        WHERE school_id = $1
    `;

    const result = await query(
        sql,
        [schoolId]
    );

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
| Get Students By Class
|--------------------------------------------------------------------------
*/

async function getStudentsByClass(schoolId) {

    const sql = `
        SELECT

            c.id AS class_id,

            c.class_name,

            COUNT(s.id)::INTEGER AS student_count

        FROM classes c

        LEFT JOIN students s
            ON s.class_id = c.id
            AND s.school_id = $1

        WHERE c.school_id = $1

        GROUP BY

            c.id,
            c.class_name

        ORDER BY

            c.class_name ASC
    `;

    const result = await query(
        sql,
        [schoolId]
    );

    return result.rows.map(row => ({
        classId: row.class_id,
        className: row.class_name,
        studentCount: Number(row.student_count)
    }));
}


/*
|--------------------------------------------------------------------------
| Get Staff Statistics
|--------------------------------------------------------------------------
*/

async function getStaffStatistics(schoolId) {

    const sql = `
        SELECT

            COUNT(*)::INTEGER AS total_staff,

            COUNT(
                CASE
                    WHEN status = 'active'
                    THEN 1
                END
            )::INTEGER AS active_staff,

            COUNT(
                CASE
                    WHEN status <> 'active'
                    THEN 1
                END
            )::INTEGER AS inactive_staff

        FROM staff

        WHERE school_id = $1
    `;

    const result = await query(
        sql,
        [schoolId]
    );

    const row = result.rows[0];

    return {
        totalStaff: Number(row.total_staff),
        activeStaff: Number(row.active_staff),
        inactiveStaff: Number(row.inactive_staff)
    };
}


/*
|--------------------------------------------------------------------------
| Get Staff By Department
|--------------------------------------------------------------------------
*/

async function getStaffByDepartment(schoolId) {

    const sql = `
        SELECT

            d.id AS department_id,

            d.department_name,

            COUNT(st.id)::INTEGER AS staff_count

        FROM departments d

        LEFT JOIN staff st
            ON st.department_id = d.id
            AND st.school_id = $1

        WHERE d.school_id = $1

        GROUP BY

            d.id,
            d.department_name

        ORDER BY

            d.department_name ASC
    `;

    const result = await query(
        sql,
        [schoolId]
    );

    return result.rows.map(row => ({
        departmentId: row.department_id,
        departmentName: row.department_name,
        staffCount: Number(row.staff_count)
    }));
}


/*
|--------------------------------------------------------------------------
| Get Fee Statistics
|--------------------------------------------------------------------------
*/

async function getFeeStatistics(schoolId) {

    const sql = `
        SELECT

            COALESCE(
                SUM(amount),
                0
            ) AS total_billed,

            COALESCE(
                SUM(
                    CASE
                        WHEN status = 'paid'
                        THEN amount
                        ELSE 0
                    END
                ),
                0
            ) AS total_paid,

            COALESCE(
                SUM(
                    CASE
                        WHEN status <> 'paid'
                        THEN amount
                        ELSE 0
                    END
                ),
                0
            ) AS total_outstanding,

            COUNT(*)::INTEGER AS total_records

        FROM fees

        WHERE school_id = $1
    `;

    const result = await query(
        sql,
        [schoolId]
    );

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
| Get Attendance Statistics
|--------------------------------------------------------------------------
*/

async function getAttendanceStatistics(
    schoolId,
    startDate = null,
    endDate = null
) {

    let sql = `
        SELECT

            COUNT(*)::INTEGER AS total_records,

            COUNT(
                CASE
                    WHEN status = 'present'
                    THEN 1
                END
            )::INTEGER AS present,

            COUNT(
                CASE
                    WHEN status = 'absent'
                    THEN 1
                END
            )::INTEGER AS absent,

            COUNT(
                CASE
                    WHEN status = 'late'
                    THEN 1
                END
            )::INTEGER AS late,

            COUNT(
                CASE
                    WHEN status = 'excused'
                    THEN 1
                END
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

    const result = await query(
        sql,
        values
    );

    const row = result.rows[0];

    const totalRecords =
        Number(row.total_records);

    const present =
        Number(row.present);

    const attendanceRate =
        totalRecords > 0
            ? Number(
                (
                    (present / totalRecords) * 100
                ).toFixed(2)
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
| Get Result Statistics
|--------------------------------------------------------------------------
*/

async function getResultStatistics(schoolId) {

    const sql = `
        SELECT

            COUNT(*)::INTEGER AS total_results,

            COUNT(
                CASE
                    WHEN grade = 'A'
                    THEN 1
                END
            )::INTEGER AS grade_a,

            COUNT(
                CASE
                    WHEN grade = 'B'
                    THEN 1
                END
            )::INTEGER AS grade_b,

            COUNT(
                CASE
                    WHEN grade = 'C'
                    THEN 1
                END
            )::INTEGER AS grade_c,

            COUNT(
                CASE
                    WHEN grade = 'D'
                    THEN 1
                END
            )::INTEGER AS grade_d,

            COUNT(
                CASE
                    WHEN grade = 'E'
                    THEN 1
                END
            )::INTEGER AS grade_e,

            COUNT(
                CASE
                    WHEN grade = 'F'
                    THEN 1
                END
            )::INTEGER AS grade_f

        FROM results

        WHERE school_id = $1
    `;

    const result = await query(
        sql,
        [schoolId]
    );

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
| Get Academic Session Report
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

            s.session_code,

            s.start_date,

            s.end_date,

            s.status,

            (
                SELECT COUNT(*)
                FROM terms t
                WHERE t.session_id = s.id
                  AND t.school_id = s.school_id
            )::INTEGER AS total_terms,

            (
                SELECT COUNT(*)
                FROM students st
                WHERE st.school_id = s.school_id
            )::INTEGER AS total_students

        FROM academic_sessions s

        WHERE s.id = $1

          AND s.school_id = $2

        LIMIT 1
    `;

    const result = await query(
        sql,
        [
            sessionId,
            schoolId
        ]
    );

    if (!result.rows[0]) {
        return null;
    }

    const row = result.rows[0];

    return {
        sessionId: row.session_id,
        sessionName: row.session_name,
        sessionCode: row.session_code,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        totalTerms: Number(row.total_terms),
        totalStudents: Number(row.total_students)
    };
}


/*
|--------------------------------------------------------------------------
| Get Class Report
|--------------------------------------------------------------------------
*/

async function getClassReport(
    schoolId,
    classId
) {

    const sql = `
        SELECT

            c.id AS class_id,

            c.class_name,

            c.class_code,

            COUNT(
                DISTINCT s.id
            )::INTEGER AS student_count,

            COUNT(
                DISTINCT cs.subject_id
            )::INTEGER AS subject_count

        FROM classes c

        LEFT JOIN students s
            ON s.class_id = c.id
            AND s.school_id = $1

        LEFT JOIN class_subjects cs
            ON cs.class_id = c.id
            AND cs.school_id = $1

        WHERE c.id = $2

          AND c.school_id = $1

        GROUP BY

            c.id,
            c.class_name,
            c.class_code

        LIMIT 1
    `;

    const result = await query(
        sql,
        [
            schoolId,
            classId
        ]
    );

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
| Get Dashboard Report
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

        getSchoolOverview(
            schoolId
        ),

        getStudentStatistics(
            schoolId
        ),

        getStaffStatistics(
            schoolId
        ),

        getFeeStatistics(
            schoolId
        ),

        getAttendanceStatistics(
            schoolId
        ),

        getResultStatistics(
            schoolId
        )

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