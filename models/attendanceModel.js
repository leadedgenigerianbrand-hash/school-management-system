"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| ATTENDANCE MODEL
|--------------------------------------------------------------------------
|
| Database table:
|
| attendance
|
| Current database fields:
|
| id
| student_id
| school_id
| academic_session_id
| term_id
| class_id
| attendance_date
| status
| remark
| recorded_by
| created_at
|
| Important:
|
| class_arm_id is NOT stored in attendance.
| A student's class arm is stored in student_enrollments.
|
| Attendance uniqueness:
|
| UNIQUE(student_id, attendance_date)
|
|--------------------------------------------------------------------------
*/

const ALLOWED_STATUSES = [
    "Present",
    "Absent",
    "Late",
    "Excused"
];

/*
|--------------------------------------------------------------------------
| NORMALIZE STATUS
|--------------------------------------------------------------------------
*/

function normalizeStatus(status) {
    if (status === undefined || status === null) {
        throw new Error("Attendance status is required.");
    }

    const normalized = String(status).trim().toLowerCase();

    const statusMap = {
        present: "Present",
        absent: "Absent",
        late: "Late",
        excused: "Excused"
    };

    if (!statusMap[normalized]) {
        throw new Error(
            "Invalid attendance status. Allowed values: " +
            ALLOWED_STATUSES.join(", ") +
            "."
        );
    }

    return statusMap[normalized];
}

/*
|--------------------------------------------------------------------------
| NORMALIZE LIMIT
|--------------------------------------------------------------------------
*/

function normalizeLimit(limit) {
    const value = Number(limit);

    if (!Number.isFinite(value) || value <= 0) {
        return 100;
    }

    return Math.min(Math.floor(value), 500);
}

/*
|--------------------------------------------------------------------------
| NORMALIZE OFFSET
|--------------------------------------------------------------------------
*/

function normalizeOffset(offset) {
    const value = Number(offset);

    if (!Number.isFinite(value) || value < 0) {
        return 0;
    }

    return Math.floor(value);
}

/*
|--------------------------------------------------------------------------
| VALIDATE ATTENDANCE CONTEXT
|--------------------------------------------------------------------------
|
| Verifies that:
|
| - student belongs to school
| - student has an enrollment for the academic session
| - enrollment belongs to requested class
| - optional class arm belongs to that enrollment
| - academic session belongs to the school
| - term belongs to the school
|
|--------------------------------------------------------------------------
*/

async function validateAttendanceContext({
    schoolId,
    studentId,
    classId,
    classArmId = null,
    sessionId,
    termId
}) {
    const sql = `
        SELECT
            s.id AS student_id,
            se.class_id,
            se.class_arm_id,
            se.academic_session_id,
            ses.id AS session_id,
            t.id AS term_id
        FROM students s
        INNER JOIN student_enrollments se
            ON se.student_id = s.id
           AND se.school_id = s.school_id
           AND se.academic_session_id = $4
           AND se.class_id = $3
        INNER JOIN academic_sessions ses
            ON ses.id = se.academic_session_id
           AND ses.school_id = s.school_id
        INNER JOIN terms t
            ON t.id = $5
           AND t.school_id = s.school_id
        WHERE s.id = $2
          AND s.school_id = $1
          AND (
              $6::uuid IS NULL
              OR se.class_arm_id = $6
          )
        LIMIT 1
    `;

    const result = await query(sql, [
        schoolId,
        studentId,
        classId,
        sessionId,
        termId,
        classArmId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| RECORD ATTENDANCE
|--------------------------------------------------------------------------
*/

async function recordAttendance({
    schoolId,
    studentId,
    classId,
    classArmId = null,
    sessionId,
    termId,
    attendanceDate,
    status,
    remarks = null,
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

    if (!sessionId) {
        throw new Error("Academic session is required.");
    }

    if (!termId) {
        throw new Error("Term is required.");
    }

    if (!attendanceDate) {
        throw new Error("Attendance date is required.");
    }

    const normalizedStatus = normalizeStatus(status);

    const context = await validateAttendanceContext({
        schoolId,
        studentId,
        classId,
        classArmId,
        sessionId,
        termId
    });

    if (!context) {
        throw new Error(
            "Student enrollment does not match the selected school, class, academic session, term, or class arm."
        );
    }

    const sql = `
        INSERT INTO attendance (
            school_id,
            student_id,
            academic_session_id,
            term_id,
            class_id,
            attendance_date,
            status,
            remark,
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
            $9
        )
        ON CONFLICT (
            student_id,
            attendance_date
        )
        DO UPDATE SET
            school_id = EXCLUDED.school_id,
            academic_session_id = EXCLUDED.academic_session_id,
            term_id = EXCLUDED.term_id,
            class_id = EXCLUDED.class_id,
            status = EXCLUDED.status,
            remark = EXCLUDED.remark,
            recorded_by = EXCLUDED.recorded_by
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        studentId,
        sessionId,
        termId,
        classId,
        attendanceDate,
        normalizedStatus,
        remarks,
        recordedBy
    ]);

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| RECORD BULK ATTENDANCE
|--------------------------------------------------------------------------
*/

async function recordBulkAttendance(records) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error("Attendance records are required.");
    }

    const results = [];

    for (const record of records) {
        const result = await recordAttendance(record);
        results.push(result);
    }

    return results;
}

/*
|--------------------------------------------------------------------------
| FIND ATTENDANCE BY ID
|--------------------------------------------------------------------------
*/

async function findAttendanceById(
    attendanceId,
    schoolId
) {
    if (!attendanceId) {
        throw new Error("Attendance ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT
            a.*,
            a.remark AS remarks,
            s.student_number,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name,
            c.class_name,
            ca.id AS class_arm_id,
            ca.arm_name,
            se.department_id
        FROM attendance a
        INNER JOIN students s
            ON s.id = a.student_id
           AND s.school_id = a.school_id
        INNER JOIN classes c
            ON c.id = a.class_id
           AND c.school_id = a.school_id
        LEFT JOIN student_enrollments se
            ON se.student_id = a.student_id
           AND se.school_id = a.school_id
           AND se.academic_session_id = a.academic_session_id
           AND se.class_id = a.class_id
        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id
           AND ca.school_id = a.school_id
        WHERE a.id = $1
          AND a.school_id = $2
        LIMIT 1
    `;

    const result = await query(sql, [
        attendanceId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| GET STUDENT ATTENDANCE
|--------------------------------------------------------------------------
*/

async function getStudentAttendance({
    schoolId,
    studentId,
    sessionId = null,
    termId = null,
    startDate = null,
    endDate = null,
    limit = 100,
    offset = 0
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    let sql = `
        SELECT
            a.*,
            a.remark AS remarks,
            c.class_name,
            ca.id AS class_arm_id,
            ca.arm_name
        FROM attendance a
        INNER JOIN students s
            ON s.id = a.student_id
           AND s.school_id = a.school_id
        INNER JOIN classes c
            ON c.id = a.class_id
           AND c.school_id = a.school_id
        LEFT JOIN student_enrollments se
            ON se.student_id = a.student_id
           AND se.school_id = a.school_id
           AND se.academic_session_id = a.academic_session_id
           AND se.class_id = a.class_id
        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id
           AND ca.school_id = a.school_id
        WHERE a.school_id = $1
          AND a.student_id = $2
    `;

    const values = [
        schoolId,
        studentId
    ];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND a.academic_session_id = $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND a.term_id = $${values.length}
        `;
    }

    if (startDate) {
        values.push(startDate);

        sql += `
            AND a.attendance_date >= $${values.length}
        `;
    }

    if (endDate) {
        values.push(endDate);

        sql += `
            AND a.attendance_date <= $${values.length}
        `;
    }

    const safeLimit = normalizeLimit(limit);
    const safeOffset = normalizeOffset(offset);

    values.push(safeLimit);

    sql += `
        ORDER BY
            a.attendance_date DESC
        LIMIT $${values.length}
    `;

    values.push(safeOffset);

    sql += `
        OFFSET $${values.length}
    `;

    const result = await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET CLASS ATTENDANCE FOR DATE
|--------------------------------------------------------------------------
*/

async function getClassAttendance({
    schoolId,
    classId,
    classArmId = null,
    attendanceDate,
    sessionId,
    termId
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!attendanceDate) {
        throw new Error("Attendance date is required.");
    }

    if (!sessionId) {
        throw new Error("Academic session is required.");
    }

    if (!termId) {
        throw new Error("Term is required.");
    }

    let sql = `
        SELECT
            s.id AS student_id,
            s.student_number,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name,
            se.class_id,
            se.class_arm_id,
            ca.arm_name,
            a.id AS attendance_id,
            a.status,
            a.remark,
            a.remark AS remarks,
            a.attendance_date
        FROM students s
        INNER JOIN student_enrollments se
            ON se.student_id = s.id
           AND se.school_id = s.school_id
           AND se.academic_session_id = $5
           AND se.class_id = $2
        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id
           AND ca.school_id = s.school_id
        LEFT JOIN attendance a
            ON a.student_id = s.id
           AND a.school_id = s.school_id
           AND a.class_id = $2
           AND a.attendance_date = $4
           AND a.academic_session_id = $5
           AND a.term_id = $6
        WHERE s.school_id = $1
          AND s.status = 'Active'
    `;

    const values = [
        schoolId,
        classId,
        classArmId,
        attendanceDate,
        sessionId,
        termId
    ];

    if (classArmId) {
        sql += `
            AND se.class_arm_id = $3
        `;
    }

    sql += `
        ORDER BY
            s.last_name ASC,
            s.first_name ASC,
            s.middle_name ASC
    `;

    const result = await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET ATTENDANCE BY DATE
|--------------------------------------------------------------------------
*/

async function getAttendanceByDate(
    schoolId,
    attendanceDate,
    classId = null
) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!attendanceDate) {
        throw new Error("Attendance date is required.");
    }

    let sql = `
        SELECT
            a.*,
            a.remark AS remarks,
            s.student_number,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name,
            c.class_name,
            ca.id AS class_arm_id,
            ca.arm_name
        FROM attendance a
        INNER JOIN students s
            ON s.id = a.student_id
           AND s.school_id = a.school_id
        INNER JOIN classes c
            ON c.id = a.class_id
           AND c.school_id = a.school_id
        LEFT JOIN student_enrollments se
            ON se.student_id = a.student_id
           AND se.school_id = a.school_id
           AND se.academic_session_id = a.academic_session_id
           AND se.class_id = a.class_id
        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id
           AND ca.school_id = a.school_id
        WHERE a.school_id = $1
          AND a.attendance_date = $2
    `;

    const values = [
        schoolId,
        attendanceDate
    ];

    if (classId) {
        values.push(classId);

        sql += `
            AND a.class_id = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            c.class_name ASC,
            s.last_name ASC,
            s.first_name ASC
    `;

    const result = await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| UPDATE ATTENDANCE
|--------------------------------------------------------------------------
|
| classArmId is intentionally not included because attendance does not
| contain a class_arm_id column. Class-arm information comes from the
| student's enrollment.
|
|--------------------------------------------------------------------------
*/

async function updateAttendance(
    attendanceId,
    schoolId,
    data
) {
    if (!attendanceId) {
        throw new Error("Attendance ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const allowedFields = {
        status: "status",
        remarks: "remark",
        remark: "remark",
        attendanceDate: "attendance_date",
        classId: "class_id",
        sessionId: "academic_session_id",
        termId: "term_id"
    };

    const updates = [];
    const values = [];

    for (const key of Object.keys(data || {})) {
        if (
            allowedFields[key] &&
            data[key] !== undefined
        ) {
            let value = data[key];

            if (key === "status") {
                value = normalizeStatus(value);
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

    values.push(attendanceId);

    const attendanceIdPosition = values.length;

    values.push(schoolId);

    const schoolIdPosition = values.length;

    const sql = `
        UPDATE attendance
        SET
            ${updates.join(", ")}
        WHERE id = $${attendanceIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| DELETE ATTENDANCE
|--------------------------------------------------------------------------
*/

async function deleteAttendance(
    attendanceId,
    schoolId
) {
    if (!attendanceId) {
        throw new Error("Attendance ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        DELETE FROM attendance
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        attendanceId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| STUDENT ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
*/

async function getStudentAttendanceSummary({
    schoolId,
    studentId,
    sessionId = null,
    termId = null,
    startDate = null,
    endDate = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_days,
            COUNT(
                CASE
                    WHEN status = 'Present'
                    THEN 1
                END
            )::INTEGER AS present_days,
            COUNT(
                CASE
                    WHEN status = 'Absent'
                    THEN 1
                END
            )::INTEGER AS absent_days,
            COUNT(
                CASE
                    WHEN status = 'Late'
                    THEN 1
                END
            )::INTEGER AS late_days,
            COUNT(
                CASE
                    WHEN status = 'Excused'
                    THEN 1
                END
            )::INTEGER AS excused_days
        FROM attendance
        WHERE school_id = $1
          AND student_id = $2
    `;

    const values = [
        schoolId,
        studentId
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

    const result = await query(sql, values);

    const row = result.rows[0];

    const totalDays = Number(row.total_days);
    const presentDays = Number(row.present_days);

    return {
        totalDays,
        presentDays,
        absentDays: Number(row.absent_days),
        lateDays: Number(row.late_days),
        excusedDays: Number(row.excused_days),
        attendancePercentage:
            totalDays > 0
                ? Number(
                    (
                        (presentDays / totalDays) *
                        100
                    ).toFixed(2)
                )
                : 0
    };
}

/*
|--------------------------------------------------------------------------
| CLASS ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
*/

async function getClassAttendanceSummary({
    schoolId,
    classId,
    sessionId,
    termId,
    startDate = null,
    endDate = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!sessionId) {
        throw new Error("Academic session is required.");
    }

    if (!termId) {
        throw new Error("Term is required.");
    }

    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_records,
            COUNT(
                CASE
                    WHEN status = 'Present'
                    THEN 1
                END
            )::INTEGER AS present_records,
            COUNT(
                CASE
                    WHEN status = 'Absent'
                    THEN 1
                END
            )::INTEGER AS absent_records,
            COUNT(
                CASE
                    WHEN status = 'Late'
                    THEN 1
                END
            )::INTEGER AS late_records,
            COUNT(
                CASE
                    WHEN status = 'Excused'
                    THEN 1
                END
            )::INTEGER AS excused_records,
            COUNT(
                DISTINCT student_id
            )::INTEGER AS students_recorded
        FROM attendance
        WHERE school_id = $1
          AND class_id = $2
          AND academic_session_id = $3
          AND term_id = $4
    `;

    const values = [
        schoolId,
        classId,
        sessionId,
        termId
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

    const result = await query(sql, values);

    const row = result.rows[0];

    const totalRecords =
        Number(row.total_records);

    const presentRecords =
        Number(row.present_records);

    return {
        totalRecords,
        presentRecords,
        absentRecords:
            Number(row.absent_records),
        lateRecords:
            Number(row.late_records),
        excusedRecords:
            Number(row.excused_records),
        studentsRecorded:
            Number(row.students_recorded),
        attendancePercentage:
            totalRecords > 0
                ? Number(
                    (
                        (presentRecords / totalRecords) *
                        100
                    ).toFixed(2)
                )
                : 0
    };
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE STATISTICS
|--------------------------------------------------------------------------
*/

async function getAttendanceStatistics(
    schoolId,
    attendanceDate = null
) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_records,
            COUNT(
                CASE
                    WHEN status = 'Present'
                    THEN 1
                END
            )::INTEGER AS present,
            COUNT(
                CASE
                    WHEN status = 'Absent'
                    THEN 1
                END
            )::INTEGER AS absent,
            COUNT(
                CASE
                    WHEN status = 'Late'
                    THEN 1
                END
            )::INTEGER AS late,
            COUNT(
                CASE
                    WHEN status = 'Excused'
                    THEN 1
                END
            )::INTEGER AS excused
        FROM attendance
        WHERE school_id = $1
    `;

    const values = [
        schoolId
    ];

    if (attendanceDate) {
        values.push(attendanceDate);

        sql += `
            AND attendance_date = $${values.length}
        `;
    }

    const result = await query(sql, values);

    const row = result.rows[0];

    return {
        totalRecords:
            Number(row.total_records),
        present:
            Number(row.present),
        absent:
            Number(row.absent),
        late:
            Number(row.late),
        excused:
            Number(row.excused)
    };
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    recordAttendance,
    recordBulkAttendance,
    findAttendanceById,
    getStudentAttendance,
    getClassAttendance,
    getAttendanceByDate,
    updateAttendance,
    deleteAttendance,
    getStudentAttendanceSummary,
    getClassAttendanceSummary,
    getAttendanceStatistics
};