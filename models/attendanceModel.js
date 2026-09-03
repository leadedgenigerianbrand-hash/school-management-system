"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Attendance Model
|--------------------------------------------------------------------------
| Uses the current attendance schema:
|
| school_id
| academic_session_id
| term_id
| class_id
| class_arm_id
| student_id
| attendance_date
| status
| remarks
| recorded_by
| created_at
| updated_at
|--------------------------------------------------------------------------
*/

const ALLOWED_STATUSES = [
    "present",
    "absent",
    "late",
    "excused"
];

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

    if (!status) {
        throw new Error("Attendance status is required.");
    }

    const normalizedStatus = String(status).toLowerCase().trim();

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
        throw new Error(
            "Invalid attendance status. Allowed values: " +
            ALLOWED_STATUSES.join(", ") +
            "."
        );
    }

    const sql = `
        INSERT INTO attendance (
            school_id,
            student_id,
            class_id,
            class_arm_id,
            academic_session_id,
            term_id,
            attendance_date,
            status,
            remarks,
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
            $10
        )
        ON CONFLICT (
            student_id,
            attendance_date,
            term_id
        )
        DO UPDATE SET
            class_id = EXCLUDED.class_id,
            class_arm_id = EXCLUDED.class_arm_id,
            academic_session_id = EXCLUDED.academic_session_id,
            status = EXCLUDED.status,
            remarks = EXCLUDED.remarks,
            recorded_by = EXCLUDED.recorded_by,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        studentId,
        classId,
        classArmId,
        sessionId,
        termId,
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
    const sql = `
        SELECT
            a.*,

            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name,

            c.class_name,

            ca.arm_name

        FROM attendance a

        INNER JOIN students s
            ON s.id = a.student_id

        INNER JOIN classes c
            ON c.id = a.class_id

        LEFT JOIN class_arms ca
            ON ca.id = a.class_arm_id

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
    let sql = `
        SELECT
            a.*,

            c.class_name,

            ca.arm_name

        FROM attendance a

        INNER JOIN classes c
            ON c.id = a.class_id

        LEFT JOIN class_arms ca
            ON ca.id = a.class_arm_id

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

    values.push(Number(limit));

    sql += `
        ORDER BY a.attendance_date DESC
        LIMIT $${values.length}
    `;

    values.push(Number(offset));

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
    let sql = `
        SELECT
            s.id AS student_id,

            s.admission_number,

            s.first_name,
            s.middle_name,
            s.last_name,

            a.id AS attendance_id,

            a.status,
            a.remarks,
            a.attendance_date

        FROM students s

        INNER JOIN student_enrollments se
            ON se.student_id = s.id

        LEFT JOIN attendance a
            ON a.student_id = s.id
           AND a.school_id = s.school_id
           AND a.class_id = $2
           AND a.attendance_date = $4
           AND a.academic_session_id = $5
           AND a.term_id = $6

        WHERE s.school_id = $1
          AND se.school_id = $1
          AND se.class_id = $2
          AND se.academic_session_id = $5
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

        sql += `
            AND (
                a.class_arm_id = $3
                OR a.class_arm_id IS NULL
            )
        `;
    }

    sql += `
        ORDER BY
            s.last_name ASC,
            s.first_name ASC
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
    let sql = `
        SELECT
            a.*,

            s.admission_number,

            s.first_name,
            s.middle_name,
            s.last_name,

            c.class_name,

            ca.arm_name

        FROM attendance a

        INNER JOIN students s
            ON s.id = a.student_id

        INNER JOIN classes c
            ON c.id = a.class_id

        LEFT JOIN class_arms ca
            ON ca.id = a.class_arm_id

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
*/

async function updateAttendance(
    attendanceId,
    schoolId,
    data
) {
    const allowedFields = {
        status: "status",
        remarks: "remarks",
        attendanceDate: "attendance_date",
        classId: "class_id",
        classArmId: "class_arm_id",
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
                value = String(value).toLowerCase().trim();

                if (!ALLOWED_STATUSES.includes(value)) {
                    throw new Error(
                        "Invalid attendance status."
                    );
                }
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
            ${updates.join(", ")},
            updated_at = CURRENT_TIMESTAMP

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
    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_days,

            COUNT(
                CASE
                    WHEN LOWER(status) = 'present'
                    THEN 1
                END
            )::INTEGER AS present_days,

            COUNT(
                CASE
                    WHEN LOWER(status) = 'absent'
                    THEN 1
                END
            )::INTEGER AS absent_days,

            COUNT(
                CASE
                    WHEN LOWER(status) = 'late'
                    THEN 1
                END
            )::INTEGER AS late_days,

            COUNT(
                CASE
                    WHEN LOWER(status) = 'excused'
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
    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_records,

            COUNT(
                CASE
                    WHEN LOWER(a.status) = 'present'
                    THEN 1
                END
            )::INTEGER AS present_records,

            COUNT(
                CASE
                    WHEN LOWER(a.status) = 'absent'
                    THEN 1
                END
            )::INTEGER AS absent_records,

            COUNT(
                CASE
                    WHEN LOWER(a.status) = 'late'
                    THEN 1
                END
            )::INTEGER AS late_records,

            COUNT(
                DISTINCT a.student_id
            )::INTEGER AS students_recorded

        FROM attendance a

        WHERE a.school_id = $1
          AND a.class_id = $2
          AND a.academic_session_id = $3
          AND a.term_id = $4
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
            AND a.attendance_date >= $${values.length}
        `;
    }

    if (endDate) {
        values.push(endDate);

        sql += `
            AND a.attendance_date <= $${values.length}
        `;
    }

    const result = await query(sql, values);

    const row = result.rows[0];

    const totalRecords = Number(row.total_records);
    const presentRecords = Number(row.present_records);

    return {
        totalRecords,

        presentRecords,

        absentRecords:
            Number(row.absent_records),

        lateRecords:
            Number(row.late_records),

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
    let sql = `
        SELECT
            COUNT(*)::INTEGER AS total_records,

            COUNT(
                CASE
                    WHEN LOWER(status) = 'present'
                    THEN 1
                END
            )::INTEGER AS present,

            COUNT(
                CASE
                    WHEN LOWER(status) = 'absent'
                    THEN 1
                END
            )::INTEGER AS absent,

            COUNT(
                CASE
                    WHEN LOWER(status) = 'late'
                    THEN 1
                END
            )::INTEGER AS late,

            COUNT(
                CASE
                    WHEN LOWER(status) = 'excused'
                    THEN 1
                END
            )::INTEGER AS excused

        FROM attendance

        WHERE school_id = $1
    `;

    const values = [schoolId];

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