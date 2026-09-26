"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| ATTENDANCE MODEL
|--------------------------------------------------------------------------
|
| The attendance table supports both students and staff.
|
| A record must contain exactly one of:
|
|     student_id
|     staff_id
|
| Student attendance:
|     - school
|     - student
|     - academic session
|     - term
|     - class
|     - optional class arm through enrollment
|
| Staff attendance:
|     - school
|     - staff
|     - academic session
|     - term
|
| Attendance method:
|     - Manual
|     - Fingerprint
|     - Device Import
|     - Admin Correction
|
| biometric_id is optional and is intended to identify a person in
| a future fingerprint/biometric device integration.
|
| Raw biometric/fingerprint images are NOT stored here.
|
|--------------------------------------------------------------------------
*/

const ALLOWED_STATUSES = [
    "Present",
    "Absent",
    "Late",
    "Excused"
];

const ALLOWED_METHODS = [
    "Manual",
    "Fingerprint",
    "Device Import",
    "Admin Correction"
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

    const normalized = String(status)
        .trim()
        .toLowerCase();

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
| NORMALIZE ATTENDANCE METHOD
|--------------------------------------------------------------------------
*/

function normalizeAttendanceMethod(method) {
    if (
        method === undefined ||
        method === null ||
        String(method).trim() === ""
    ) {
        return "Manual";
    }

    const normalized = String(method)
        .trim()
        .toLowerCase();

    const methodMap = {
        manual: "Manual",
        fingerprint: "Fingerprint",
        "device import": "Device Import",
        "admin correction": "Admin Correction"
    };

    if (!methodMap[normalized]) {
        throw new Error(
            "Invalid attendance method. Allowed values: " +
            ALLOWED_METHODS.join(", ") +
            "."
        );
    }

    return methodMap[normalized];
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
| VALIDATE STUDENT ATTENDANCE CONTEXT
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
| VALIDATE STAFF ATTENDANCE CONTEXT
|--------------------------------------------------------------------------
|
| Staff attendance does not require a class.
| The staff member only needs to belong to the authenticated school,
| while the academic session and term must also belong to that school.
|
|--------------------------------------------------------------------------
*/

async function validateStaffAttendanceContext({
    schoolId,
    staffId,
    sessionId,
    termId
}) {
    const sql = `
        SELECT
            st.id AS staff_id,
            st.school_id,
            st.staff_number,
            st.first_name,
            st.middle_name,
            st.last_name,
            st.position,
            st.employment_type,
            st.status,
            ses.id AS session_id,
            t.id AS term_id
        FROM staff st
        INNER JOIN academic_sessions ses
            ON ses.id = $3
           AND ses.school_id = st.school_id
        INNER JOIN terms t
            ON t.id = $4
           AND t.school_id = st.school_id
        WHERE st.id = $2
          AND st.school_id = $1
        LIMIT 1
    `;

    const result = await query(sql, [
        schoolId,
        staffId,
        sessionId,
        termId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| RECORD ATTENDANCE
|--------------------------------------------------------------------------
|
| Supports both student and staff attendance.
|
| Student record:
|     studentId required
|     classId required
|
| Staff record:
|     staffId required
|     classId not required
|
|--------------------------------------------------------------------------
*/

async function recordAttendance({
    schoolId,
    studentId = null,
    staffId = null,
    classId = null,
    classArmId = null,
    sessionId,
    termId,
    attendanceDate,
    status,
    remarks = null,
    recordedBy = null,
    attendanceMethod = "Manual",
    biometricId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const hasStudent =
        Boolean(studentId);

    const hasStaff =
        Boolean(staffId);

    if (hasStudent === hasStaff) {
        throw new Error(
            "Attendance must belong to exactly one student or one staff member."
        );
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

    const normalizedStatus =
        normalizeStatus(status);

    const normalizedMethod =
        normalizeAttendanceMethod(
            attendanceMethod
        );

    if (hasStudent) {
        if (!classId) {
            throw new Error("Class ID is required for student attendance.");
        }

        const context =
            await validateAttendanceContext({
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
    }

    if (hasStaff) {
        const context =
            await validateStaffAttendanceContext({
                schoolId,
                staffId,
                sessionId,
                termId
            });

        if (!context) {
            throw new Error(
                "Staff member does not match the selected school, academic session, or term."
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STUDENT ATTENDANCE
    |--------------------------------------------------------------------------
    */

    if (hasStudent) {
        const sql = `
            INSERT INTO attendance (
                school_id,
                student_id,
                staff_id,
                academic_session_id,
                term_id,
                class_id,
                attendance_date,
                status,
                remark,
                recorded_by,
                attendance_method,
                biometric_id
            )
            VALUES (
                $1,
                $2,
                NULL,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11
            )
            ON CONFLICT (
                student_id,
                attendance_date
            )
            DO UPDATE SET
                school_id = EXCLUDED.school_id,
                academic_session_id =
                    EXCLUDED.academic_session_id,
                term_id =
                    EXCLUDED.term_id,
                class_id =
                    EXCLUDED.class_id,
                status =
                    EXCLUDED.status,
                remark =
                    EXCLUDED.remark,
                recorded_by =
                    EXCLUDED.recorded_by,
                attendance_method =
                    EXCLUDED.attendance_method,
                biometric_id =
                    EXCLUDED.biometric_id
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
            recordedBy,
            normalizedMethod,
            biometricId
        ]);

        return result.rows[0];
    }

    /*
    |--------------------------------------------------------------------------
    | STAFF ATTENDANCE
    |--------------------------------------------------------------------------
    */

    const sql = `
        INSERT INTO attendance (
            school_id,
            student_id,
            staff_id,
            academic_session_id,
            term_id,
            class_id,
            attendance_date,
            status,
            remark,
            recorded_by,
            attendance_method,
            biometric_id
        )
        VALUES (
            $1,
            NULL,
            $2,
            $3,
            $4,
            NULL,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10
        )
        ON CONFLICT (
            staff_id,
            attendance_date
        )
        DO UPDATE SET
            school_id =
                EXCLUDED.school_id,
            academic_session_id =
                EXCLUDED.academic_session_id,
            term_id =
                EXCLUDED.term_id,
            status =
                EXCLUDED.status,
            remark =
                EXCLUDED.remark,
            recorded_by =
                EXCLUDED.recorded_by,
            attendance_method =
                EXCLUDED.attendance_method,
            biometric_id =
                EXCLUDED.biometric_id
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        staffId,
        sessionId,
        termId,
        attendanceDate,
        normalizedStatus,
        remarks,
        recordedBy,
        normalizedMethod,
        biometricId
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
        const result =
            await recordAttendance(record);

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
            s.first_name AS student_first_name,
            s.middle_name AS student_middle_name,
            s.last_name AS student_last_name,

            st.staff_number,
            st.first_name AS staff_first_name,
            st.middle_name AS staff_middle_name,
            st.last_name AS staff_last_name,
            st.position AS staff_position,
            st.employment_type AS staff_employment_type,

            c.class_name,

            ca.id AS class_arm_id,
            ca.arm_name,

            se.department_id

        FROM attendance a

        LEFT JOIN students s
            ON s.id = a.student_id
           AND s.school_id = a.school_id

        LEFT JOIN staff st
            ON st.id = a.staff_id
           AND st.school_id = a.school_id

        LEFT JOIN classes c
            ON c.id = a.class_id
           AND c.school_id = a.school_id

        LEFT JOIN student_enrollments se
            ON se.student_id = a.student_id
           AND se.school_id = a.school_id
           AND se.academic_session_id =
               a.academic_session_id
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

        LEFT JOIN classes c
            ON c.id = a.class_id
           AND c.school_id = a.school_id

        LEFT JOIN student_enrollments se
            ON se.student_id = a.student_id
           AND se.school_id = a.school_id
           AND se.academic_session_id =
               a.academic_session_id
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
            AND a.academic_session_id =
                $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND a.term_id =
                $${values.length}
        `;
    }

    if (startDate) {
        values.push(startDate);

        sql += `
            AND a.attendance_date >=
                $${values.length}
        `;
    }

    if (endDate) {
        values.push(endDate);

        sql += `
            AND a.attendance_date <=
                $${values.length}
        `;
    }

    const safeLimit =
        normalizeLimit(limit);

    const safeOffset =
        normalizeOffset(offset);

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

    const result =
        await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET STAFF ATTENDANCE
|--------------------------------------------------------------------------
*/

async function getStaffAttendance({
    schoolId,
    staffId,
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

    if (!staffId) {
        throw new Error("Staff ID is required.");
    }

    let sql = `
        SELECT
            a.*,
            a.remark AS remarks,

            st.staff_number,
            st.first_name,
            st.middle_name,
            st.last_name,
            st.position,
            st.employment_type,
            st.department AS department,
            st.status AS staff_status

        FROM attendance a

        INNER JOIN staff st
            ON st.id = a.staff_id
           AND st.school_id = a.school_id

        WHERE a.school_id = $1
          AND a.staff_id = $2
    `;

    const values = [
        schoolId,
        staffId
    ];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND a.academic_session_id =
                $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND a.term_id =
                $${values.length}
        `;
    }

    if (startDate) {
        values.push(startDate);

        sql += `
            AND a.attendance_date >=
                $${values.length}
        `;
    }

    if (endDate) {
        values.push(endDate);

        sql += `
            AND a.attendance_date <=
                $${values.length}
        `;
    }

    const safeLimit =
        normalizeLimit(limit);

    const safeOffset =
        normalizeOffset(offset);

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

    const result =
        await query(sql, values);

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
            a.attendance_date,
            a.attendance_method,
            a.biometric_id

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

    const result =
        await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET STAFF ATTENDANCE FOR DATE
|--------------------------------------------------------------------------
*/

async function getStaffAttendanceByDate({
    schoolId,
    attendanceDate,
    sessionId = null,
    termId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!attendanceDate) {
        throw new Error("Attendance date is required.");
    }

    let sql = `
        SELECT
            st.id AS staff_id,
            st.staff_number,
            st.first_name,
            st.middle_name,
            st.last_name,
            st.position,
            st.employment_type,
            st.department AS department,
            st.status AS staff_status,

            a.id AS attendance_id,
            a.status,
            a.remark,
            a.remark AS remarks,
            a.attendance_date,
            a.academic_session_id,
            a.term_id,
            a.attendance_method,
            a.biometric_id

        FROM staff st

        LEFT JOIN attendance a
            ON a.staff_id = st.id
           AND a.school_id = st.school_id
           AND a.attendance_date = $2
    `;

    const values = [
        schoolId,
        attendanceDate
    ];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND a.academic_session_id =
                $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND a.term_id =
                $${values.length}
        `;
    }

    sql += `
        WHERE st.school_id = $1
          AND st.status = 'Active'

        ORDER BY
            st.last_name ASC,
            st.first_name ASC,
            st.middle_name ASC
    `;

    const result =
        await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET ALL ATTENDANCE BY DATE
|--------------------------------------------------------------------------
|
| Returns student and staff attendance in one result set.
|
|--------------------------------------------------------------------------
*/

async function getAllAttendanceByDate({
    schoolId,
    attendanceDate,
    sessionId = null,
    termId = null,
    classId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!attendanceDate) {
        throw new Error("Attendance date is required.");
    }

    const values = [
        schoolId,
        attendanceDate
    ];

    let studentSql = `
        SELECT
            a.id,
            'student' AS person_type,
            a.student_id AS person_id,
            NULL::uuid AS staff_id,

            s.student_number AS person_number,
            s.admission_number,

            s.first_name,
            s.middle_name,
            s.last_name,

            NULL::text AS position,
            NULL::text AS employment_type,

            c.class_name,
            ca.arm_name,

            a.academic_session_id,
            a.term_id,
            a.class_id,
            a.attendance_date,
            a.status,
            a.remark,
            a.remark AS remarks,
            a.attendance_method,
            a.biometric_id,
            a.recorded_by,
            a.created_at

        FROM attendance a

        INNER JOIN students s
            ON s.id = a.student_id
           AND s.school_id = a.school_id

        LEFT JOIN classes c
            ON c.id = a.class_id
           AND c.school_id = a.school_id

        LEFT JOIN student_enrollments se
            ON se.student_id = a.student_id
           AND se.school_id = a.school_id
           AND se.academic_session_id =
               a.academic_session_id
           AND se.class_id = a.class_id

        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id
           AND ca.school_id = a.school_id

        WHERE a.school_id = $1
          AND a.attendance_date = $2
    `;

    if (sessionId) {
        values.push(sessionId);

        studentSql += `
            AND a.academic_session_id =
                $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        studentSql += `
            AND a.term_id =
                $${values.length}
        `;
    }

    if (classId) {
        values.push(classId);

        studentSql += `
            AND a.class_id =
                $${values.length}
        `;
    }

    const staffValues = [
        schoolId,
        attendanceDate
    ];

    let staffSql = `
        SELECT
            a.id,
            'staff' AS person_type,
            NULL::uuid AS person_id,
            a.staff_id,

            st.staff_number AS person_number,
            NULL::text AS admission_number,

            st.first_name,
            st.middle_name,
            st.last_name,

            st.position,
            st.employment_type,

            NULL::text AS class_name,
            NULL::text AS arm_name,

            a.academic_session_id,
            a.term_id,
            NULL::uuid AS class_id,
            a.attendance_date,
            a.status,
            a.remark,
            a.remark AS remarks,
            a.attendance_method,
            a.biometric_id,
            a.recorded_by,
            a.created_at

        FROM attendance a

        INNER JOIN staff st
            ON st.id = a.staff_id
           AND st.school_id = a.school_id

        WHERE a.school_id = $1
          AND a.attendance_date = $2
    `;

    if (sessionId) {
        staffValues.push(sessionId);

        staffSql += `
            AND a.academic_session_id =
                $${staffValues.length}
        `;
    }

    if (termId) {
        staffValues.push(termId);

        staffSql += `
            AND a.term_id =
                $${staffValues.length}
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | UNION
    |--------------------------------------------------------------------------
    */

    const sql = `
        SELECT *
        FROM (
            ${studentSql}

            UNION ALL

            ${staffSql}
        ) attendance_union

        ORDER BY
            person_type ASC,
            last_name ASC,
            first_name ASC,
            middle_name ASC
    `;

    /*
    | The two SELECT statements use separate parameter arrays.
    | PostgreSQL requires one parameter list, so the staff placeholders
    | must be renumbered after the student parameters.
    */

    const studentParameterCount =
        values.length;

    const combinedStaffValues =
        staffValues.slice(2);

    let finalStaffSql =
        staffSql;

    if (combinedStaffValues.length > 0) {
        finalStaffSql =
            finalStaffSql.replace(
                /\$(\d+)/g,
                (match, number) => {
                    const original =
                        Number(number);

                    if (original <= 2) {
                        return match;
                    }

                    return "$" +
                        (
                            studentParameterCount +
                            original -
                            2
                        );
                }
            );
    }

    const finalSql = `
        SELECT *
        FROM (
            ${studentSql}

            UNION ALL

            ${finalStaffSql}
        ) attendance_union

        ORDER BY
            person_type ASC,
            last_name ASC,
            first_name ASC,
            middle_name ASC
    `;

    const finalValues = [
        ...values,
        ...combinedStaffValues
    ];

    const result =
        await query(finalSql, finalValues);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET ATTENDANCE BY DATE
|--------------------------------------------------------------------------
|
| Existing student attendance endpoint is preserved.
|
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

        LEFT JOIN classes c
            ON c.id = a.class_id
           AND c.school_id = a.school_id

        LEFT JOIN student_enrollments se
            ON se.student_id = a.student_id
           AND se.school_id = a.school_id
           AND se.academic_session_id =
               a.academic_session_id
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

    const result =
        await query(sql, values);

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
        termId: "term_id",
        attendanceMethod: "attendance_method",
        biometricId: "biometric_id"
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

            if (key === "attendanceMethod") {
                value =
                    normalizeAttendanceMethod(value);
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

    const attendanceIdPosition =
        values.length;

    values.push(schoolId);

    const schoolIdPosition =
        values.length;

    const sql = `
        UPDATE attendance
        SET
            ${updates.join(", ")}
        WHERE id = $${attendanceIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
    `;

    const result =
        await query(sql, values);

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

    const result =
        await query(sql, [
            attendanceId,
            schoolId
        ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| ATTENDANCE SUMMARY HELPER
|--------------------------------------------------------------------------
*/

function buildAttendanceSummary(row) {
    const totalDays =
        Number(row.total_days || 0);

    const presentDays =
        Number(row.present_days || 0);

    return {
        totalDays,
        presentDays,
        absentDays:
            Number(row.absent_days || 0),
        lateDays:
            Number(row.late_days || 0),
        excusedDays:
            Number(row.excused_days || 0),
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
            AND academic_session_id =
                $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND term_id =
                $${values.length}
        `;
    }

    if (startDate) {
        values.push(startDate);

        sql += `
            AND attendance_date >=
                $${values.length}
        `;
    }

    if (endDate) {
        values.push(endDate);

        sql += `
            AND attendance_date <=
                $${values.length}
        `;
    }

    const result =
        await query(sql, values);

    return buildAttendanceSummary(
        result.rows[0]
    );
}

/*
|--------------------------------------------------------------------------
| STAFF ATTENDANCE SUMMARY
|--------------------------------------------------------------------------
*/

async function getStaffAttendanceSummary({
    schoolId,
    staffId,
    sessionId = null,
    termId = null,
    startDate = null,
    endDate = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!staffId) {
        throw new Error("Staff ID is required.");
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
          AND staff_id = $2
    `;

    const values = [
        schoolId,
        staffId
    ];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND academic_session_id =
                $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND term_id =
                $${values.length}
        `;
    }

    if (startDate) {
        values.push(startDate);

        sql += `
            AND attendance_date >=
                $${values.length}
        `;
    }

    if (endDate) {
        values.push(endDate);

        sql += `
            AND attendance_date <=
                $${values.length}
        `;
    }

    const result =
        await query(sql, values);

    return buildAttendanceSummary(
        result.rows[0]
    );
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
          AND student_id IS NOT NULL
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
            AND attendance_date >=
                $${values.length}
        `;
    }

    if (endDate) {
        values.push(endDate);

        sql += `
            AND attendance_date <=
                $${values.length}
        `;
    }

    const result =
        await query(sql, values);

    const row =
        result.rows[0];

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
                        (presentRecords /
                            totalRecords) *
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
            )::INTEGER AS excused,

            COUNT(
                CASE
                    WHEN student_id IS NOT NULL
                    THEN 1
                END
            )::INTEGER AS student_records,

            COUNT(
                CASE
                    WHEN staff_id IS NOT NULL
                    THEN 1
                END
            )::INTEGER AS staff_records

        FROM attendance

        WHERE school_id = $1
    `;

    const values = [
        schoolId
    ];

    if (attendanceDate) {
        values.push(attendanceDate);

        sql += `
            AND attendance_date =
                $${values.length}
        `;
    }

    const result =
        await query(sql, values);

    const row =
        result.rows[0];

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
            Number(row.excused),

        studentRecords:
            Number(row.student_records),

        staffRecords:
            Number(row.staff_records)
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
    getStaffAttendance,

    getClassAttendance,

    getAttendanceByDate,
    getStaffAttendanceByDate,
    getAllAttendanceByDate,

    updateAttendance,
    deleteAttendance,

    getStudentAttendanceSummary,
    getStaffAttendanceSummary,
    getClassAttendanceSummary,

    getAttendanceStatistics
};