"use strict";

const { query } = require("../config/database");

| /*                                                                         |
| -------------------------------------------------------------------------- |
| ENROLLMENT MODEL                                                           |
| -------------------------------------------------------------------------- |
|                                                                            |
| Database table:                                                            |
| student_enrollments                                                        |
|                                                                            |
| Main relationships:                                                        |
| students                                                                   |
| academic_sessions                                                          |
| classes                                                                    |
| class_arms                                                                 |
| departments                                                                |
|                                                                            |
| This model is responsible only for enrollment data operations.             |
|                                                                            |
| -------------------------------------------------------------------------- |
| */                                                                         |

function normalizeText(value) {
if (value === undefined || value === null) {
return null;
}

```
const text = String(value).trim();

return text === "" ? null : text;
```

}

function normalizeRequiredText(value, fieldName) {
const text = normalizeText(value);

```
if (!text) {
    throw new Error(`${fieldName} is required`);
}

return text;
```

}

function normalizeId(value, fieldName) {
const id = Number(value);

```
if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${fieldName} must be a valid ID`);
}

return id;
```

}

function normalizeLimit(value, defaultValue = 50) {
const limit = Number(value);

```
if (!Number.isInteger(limit) || limit <= 0) {
    return defaultValue;
}

return Math.min(limit, 500);
```

}

function normalizeOffset(value) {
const offset = Number(value);

```
if (!Number.isInteger(offset) || offset < 0) {
    return 0;
}

return offset;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| CREATE ENROLLMENT                                                          |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function createEnrollment(data = {}) {
const schoolId = normalizeId(data.schoolId, "schoolId");
const studentId = normalizeId(data.studentId, "studentId");
const academicSessionId = normalizeId(
data.academicSessionId || data.sessionId,
"academicSessionId"
);
const classId = normalizeId(data.classId, "classId");

```
const classArmId = data.classArmId
    ? normalizeId(data.classArmId, "classArmId")
    : null;

const departmentId = data.departmentId
    ? normalizeId(data.departmentId, "departmentId")
    : null;

const admissionStatus =
    normalizeText(data.admissionStatus) || "active";

const enrollmentDate =
    normalizeText(data.enrollmentDate) || null;

const exitDate =
    normalizeText(data.exitDate) || null;

/*
 * Confirm that the student belongs to the school.
 */
const studentCheck = await query(
    `
    SELECT id
    FROM students
    WHERE id = $1
      AND school_id = $2
    LIMIT 1
    `,
    [studentId, schoolId]
);

if (studentCheck.rows.length === 0) {
    throw new Error("Student not found for this school");
}

/*
 * Confirm that the academic session belongs to the school.
 */
const sessionCheck = await query(
    `
    SELECT id
    FROM academic_sessions
    WHERE id = $1
      AND school_id = $2
    LIMIT 1
    `,
    [academicSessionId, schoolId]
);

if (sessionCheck.rows.length === 0) {
    throw new Error("Academic session not found for this school");
}

/*
 * Confirm that the class belongs to the school.
 */
const classCheck = await query(
    `
    SELECT id
    FROM classes
    WHERE id = $1
      AND school_id = $2
    LIMIT 1
    `,
    [classId, schoolId]
);

if (classCheck.rows.length === 0) {
    throw new Error("Class not found for this school");
}

/*
 * If a class arm is supplied, confirm that it belongs to
 * the selected class and school.
 */
if (classArmId) {
    const classArmCheck = await query(
        `
        SELECT id
        FROM class_arms
        WHERE id = $1
          AND class_id = $2
          AND school_id = $3
        LIMIT 1
        `,
        [classArmId, classId, schoolId]
    );

    if (classArmCheck.rows.length === 0) {
        throw new Error(
            "Class arm not found for the selected class and school"
        );
    }
}

/*
 * If a department is supplied, confirm that it belongs
 * to the school.
 */
if (departmentId) {
    const departmentCheck = await query(
        `
        SELECT id
        FROM departments
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
        `,
        [departmentId, schoolId]
    );

    if (departmentCheck.rows.length === 0) {
        throw new Error("Department not found for this school");
    }
}

/*
 * Prevent duplicate enrollment for the same student,
 * school and academic session.
 */
const existingEnrollment = await query(
    `
    SELECT id
    FROM student_enrollments
    WHERE school_id = $1
      AND student_id = $2
      AND academic_session_id = $3
    LIMIT 1
    `,
    [schoolId, studentId, academicSessionId]
);

if (existingEnrollment.rows.length > 0) {
    throw new Error(
        "Student is already enrolled for this academic session"
    );
}

const result = await query(
    `
    INSERT INTO student_enrollments (
        school_id,
        student_id,
        academic_session_id,
        class_id,
        class_arm_id,
        department_id,
        admission_status,
        enrollment_date,
        exit_date
    )
    VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        COALESCE($8::date, CURRENT_DATE),
        $9::date
    )
    RETURNING *
    `,
    [
        schoolId,
        studentId,
        academicSessionId,
        classId,
        classArmId,
        departmentId,
        admissionStatus,
        enrollmentDate,
        exitDate
    ]
);

return result.rows[0];
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| FIND ENROLLMENT BY ID                                                      |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function findEnrollmentById(enrollmentId, schoolId) {
const id = normalizeId(enrollmentId, "enrollmentId");
const school = normalizeId(schoolId, "schoolId");

```
const result = await query(
    `
    SELECT
        se.*,
        s.student_number,
        s.admission_number,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.gender,
        s.student_photo_url,

        acs.session_name,
        acs.start_date AS session_start_date,
        acs.end_date AS session_end_date,

        c.class_name,
        c.class_code,

        ca.arm_name,
        ca.arm_code,

        d.department_name,
        d.department_code

    FROM student_enrollments se

    INNER JOIN students s
        ON s.id = se.student_id
       AND s.school_id = se.school_id

    INNER JOIN academic_sessions acs
        ON acs.id = se.academic_session_id
       AND acs.school_id = se.school_id

    INNER JOIN classes c
        ON c.id = se.class_id
       AND c.school_id = se.school_id

    LEFT JOIN class_arms ca
        ON ca.id = se.class_arm_id
       AND ca.school_id = se.school_id

    LEFT JOIN departments d
        ON d.id = se.department_id
       AND d.school_id = se.school_id

    WHERE se.id = $1
      AND se.school_id = $2

    LIMIT 1
    `,
    [id, school]
);

return result.rows[0] || null;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| FIND ENROLLMENTS                                                           |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function findEnrollments(filters = {}) {
const schoolId = normalizeId(filters.schoolId, "schoolId");

```
const studentId = filters.studentId
    ? normalizeId(filters.studentId, "studentId")
    : null;

const academicSessionId =
    filters.academicSessionId || filters.sessionId
        ? normalizeId(
              filters.academicSessionId || filters.sessionId,
              "academicSessionId"
          )
        : null;

const classId = filters.classId
    ? normalizeId(filters.classId, "classId")
    : null;

const classArmId = filters.classArmId
    ? normalizeId(filters.classArmId, "classArmId")
    : null;

const departmentId = filters.departmentId
    ? normalizeId(filters.departmentId, "departmentId")
    : null;

const admissionStatus = normalizeText(filters.admissionStatus);

const limit = normalizeLimit(filters.limit);
const offset = normalizeOffset(filters.offset);

const values = [schoolId];

let whereClause = `
    WHERE se.school_id = $1
`;

if (studentId) {
    values.push(studentId);
    whereClause += ` AND se.student_id = $${values.length}`;
}

if (academicSessionId) {
    values.push(academicSessionId);
    whereClause += ` AND se.academic_session_id = $${values.length}`;
}

if (classId) {
    values.push(classId);
    whereClause += ` AND se.class_id = $${values.length}`;
}

if (classArmId) {
    values.push(classArmId);
    whereClause += ` AND se.class_arm_id = $${values.length}`;
}

if (departmentId) {
    values.push(departmentId);
    whereClause += ` AND se.department_id = $${values.length}`;
}

if (admissionStatus) {
    values.push(admissionStatus);
    whereClause += ` AND LOWER(se.admission_status) = LOWER($${values.length})`;
}

values.push(limit);
const limitParameter = values.length;

values.push(offset);
const offsetParameter = values.length;

const result = await query(
    `
    SELECT
        se.*,

        s.student_number,
        s.admission_number,
        s.first_name,
        s.middle_name,
        s.last_name,
        s.gender,
        s.student_photo_url,

        acs.session_name,
        acs.start_date AS session_start_date,
        acs.end_date AS session_end_date,

        c.class_name,
        c.class_code,

        ca.arm_name,
        ca.arm_code,

        d.department_name,
        d.department_code

    FROM student_enrollments se

    INNER JOIN students s
        ON s.id = se.student_id
       AND s.school_id = se.school_id

    INNER JOIN academic_sessions acs
        ON acs.id = se.academic_session_id
       AND acs.school_id = se.school_id

    INNER JOIN classes c
        ON c.id = se.class_id
       AND c.school_id = se.school_id

    LEFT JOIN class_arms ca
        ON ca.id = se.class_arm_id
       AND ca.school_id = se.school_id

    LEFT JOIN departments d
        ON d.id = se.department_id
       AND d.school_id = se.school_id

    ${whereClause}

    ORDER BY
        acs.start_date DESC NULLS LAST,
        se.enrollment_date DESC NULLS LAST,
        se.id DESC

    LIMIT $${limitParameter}
    OFFSET $${offsetParameter}
    `,
    values
);

return result.rows;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET STUDENT ENROLLMENT HISTORY                                             |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getStudentEnrollments(studentId, schoolId) {
const student = normalizeId(studentId, "studentId");
const school = normalizeId(schoolId, "schoolId");

```
const result = await query(
    `
    SELECT
        se.*,

        acs.session_name,
        acs.start_date AS session_start_date,
        acs.end_date AS session_end_date,

        c.class_name,
        c.class_code,

        ca.arm_name,
        ca.arm_code,

        d.department_name,
        d.department_code

    FROM student_enrollments se

    INNER JOIN academic_sessions acs
        ON acs.id = se.academic_session_id
       AND acs.school_id = se.school_id

    INNER JOIN classes c
        ON c.id = se.class_id
       AND c.school_id = se.school_id

    LEFT JOIN class_arms ca
        ON ca.id = se.class_arm_id
       AND ca.school_id = se.school_id

    LEFT JOIN departments d
        ON d.id = se.department_id
       AND d.school_id = se.school_id

    WHERE se.student_id = $1
      AND se.school_id = $2

    ORDER BY
        acs.start_date DESC NULLS LAST,
        se.enrollment_date DESC NULLS LAST,
        se.id DESC
    `,
    [student, school]
);

return result.rows;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET CURRENT / LATEST STUDENT ENROLLMENT                                    |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getCurrentEnrollment(studentId, schoolId) {
const student = normalizeId(studentId, "studentId");
const school = normalizeId(schoolId, "schoolId");

```
const result = await query(
    `
    SELECT
        se.*,

        acs.session_name,
        acs.start_date AS session_start_date,
        acs.end_date AS session_end_date,

        c.class_name,
        c.class_code,

        ca.arm_name,
        ca.arm_code,

        d.department_name,
        d.department_code

    FROM student_enrollments se

    INNER JOIN academic_sessions acs
        ON acs.id = se.academic_session_id
       AND acs.school_id = se.school_id

    INNER JOIN classes c
        ON c.id = se.class_id
       AND c.school_id = se.school_id

    LEFT JOIN class_arms ca
        ON ca.id = se.class_arm_id
       AND ca.school_id = se.school_id

    LEFT JOIN departments d
        ON d.id = se.department_id
       AND d.school_id = se.school_id

    WHERE se.student_id = $1
      AND se.school_id = $2

    ORDER BY
        acs.start_date DESC NULLS LAST,
        se.enrollment_date DESC NULLS LAST,
        se.id DESC

    LIMIT 1
    `,
    [student, school]
);

return result.rows[0] || null;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| UPDATE ENROLLMENT                                                          |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function updateEnrollment(enrollmentId, schoolId, data = {}) {
const id = normalizeId(enrollmentId, "enrollmentId");
const school = normalizeId(schoolId, "schoolId");

```
const existing = await findEnrollmentById(id, school);

if (!existing) {
    throw new Error("Enrollment not found");
}

const studentId = data.studentId !== undefined
    ? normalizeId(data.studentId, "studentId")
    : existing.student_id;

const academicSessionId =
    data.academicSessionId !== undefined ||
    data.sessionId !== undefined
        ? normalizeId(
              data.academicSessionId || data.sessionId,
              "academicSessionId"
          )
        : existing.academic_session_id;

const classId = data.classId !== undefined
    ? normalizeId(data.classId, "classId")
    : existing.class_id;

const classArmId = data.classArmId !== undefined
    ? data.classArmId === null || data.classArmId === ""
        ? null
        : normalizeId(data.classArmId, "classArmId")
    : existing.class_arm_id;

const departmentId = data.departmentId !== undefined
    ? data.departmentId === null || data.departmentId === ""
        ? null
        : normalizeId(data.departmentId, "departmentId")
    : existing.department_id;

const admissionStatus =
    data.admissionStatus !== undefined
        ? normalizeRequiredText(
              data.admissionStatus,
              "admissionStatus"
          )
        : existing.admission_status;

const enrollmentDate =
    data.enrollmentDate !== undefined
        ? normalizeText(data.enrollmentDate)
        : existing.enrollment_date;

const exitDate =
    data.exitDate !== undefined
        ? normalizeText(data.exitDate)
        : existing.exit_date;

/*
 * Validate student ownership.
 */
const studentCheck = await query(
    `
    SELECT id
    FROM students
    WHERE id = $1
      AND school_id = $2
    LIMIT 1
    `,
    [studentId, school]
);

if (studentCheck.rows.length === 0) {
    throw new Error("Student not found for this school");
}

/*
 * Validate session ownership.
 */
const sessionCheck = await query(
    `
    SELECT id
    FROM academic_sessions
    WHERE id = $1
      AND school_id = $2
    LIMIT 1
    `,
    [academicSessionId, school]
);

if (sessionCheck.rows.length === 0) {
    throw new Error("Academic session not found for this school");
}

/*
 * Validate class ownership.
 */
const classCheck = await query(
    `
    SELECT id
    FROM classes
    WHERE id = $1
      AND school_id = $2
    LIMIT 1
    `,
    [classId, school]
);

if (classCheck.rows.length === 0) {
    throw new Error("Class not found for this school");
}

/*
 * Validate class arm if supplied.
 */
if (classArmId) {
    const classArmCheck = await query(
        `
        SELECT id
        FROM class_arms
        WHERE id = $1
          AND class_id = $2
          AND school_id = $3
        LIMIT 1
        `,
        [classArmId, classId, school]
    );

    if (classArmCheck.rows.length === 0) {
        throw new Error(
            "Class arm not found for the selected class and school"
        );
    }
}

/*
 * Validate department if supplied.
 */
if (departmentId) {
    const departmentCheck = await query(
        `
        SELECT id
        FROM departments
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
        `,
        [departmentId, school]
    );

    if (departmentCheck.rows.length === 0) {
        throw new Error("Department not found for this school");
    }
}

/*
 * Prevent another enrollment from using the same
 * student/session combination.
 */
const duplicateCheck = await query(
    `
    SELECT id
    FROM student_enrollments
    WHERE school_id = $1
      AND student_id = $2
      AND academic_session_id = $3
      AND id <> $4
    LIMIT 1
    `,
    [school, studentId, academicSessionId, id]
);

if (duplicateCheck.rows.length > 0) {
    throw new Error(
        "Student is already enrolled for this academic session"
    );
}

const result = await query(
    `
    UPDATE student_enrollments
    SET
        student_id = $1,
        academic_session_id = $2,
        class_id = $3,
        class_arm_id = $4,
        department_id = $5,
        admission_status = $6,
        enrollment_date = COALESCE($7::date, enrollment_date),
        exit_date = $8::date
    WHERE id = $9
      AND school_id = $10
    RETURNING *
    `,
    [
        studentId,
        academicSessionId,
        classId,
        classArmId,
        departmentId,
        admissionStatus,
        enrollmentDate,
        exitDate,
        id,
        school
    ]
);

return result.rows[0] || null;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| DELETE ENROLLMENT                                                          |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function deleteEnrollment(enrollmentId, schoolId) {
const id = normalizeId(enrollmentId, "enrollmentId");
const school = normalizeId(schoolId, "schoolId");

```
const result = await query(
    `
    DELETE FROM student_enrollments
    WHERE id = $1
      AND school_id = $2
    RETURNING *
    `,
    [id, school]
);

return result.rows[0] || null;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| CHECK ENROLLMENT EXISTS                                                    |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function enrollmentExists(
schoolId,
studentId,
academicSessionId,
excludeEnrollmentId = null
) {
const school = normalizeId(schoolId, "schoolId");
const student = normalizeId(studentId, "studentId");
const session = normalizeId(
academicSessionId,
"academicSessionId"
);

```
const values = [school, student, session];

let sql = `
    SELECT EXISTS (
        SELECT 1
        FROM student_enrollments
        WHERE school_id = $1
          AND student_id = $2
          AND academic_session_id = $3
`;

if (excludeEnrollmentId !== null && excludeEnrollmentId !== undefined) {
    const excluded = normalizeId(
        excludeEnrollmentId,
        "excludeEnrollmentId"
    );

    values.push(excluded);
    sql += `
          AND id <> $4
    `;
}

sql += `
    ) AS exists
`;

const result = await query(sql, values);

return Boolean(result.rows[0]?.exists);
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| COUNT ENROLLMENTS                                                          |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function countEnrollments(filters = {}) {
const schoolId = normalizeId(filters.schoolId, "schoolId");

```
const studentId = filters.studentId
    ? normalizeId(filters.studentId, "studentId")
    : null;

const academicSessionId =
    filters.academicSessionId || filters.sessionId
        ? normalizeId(
              filters.academicSessionId || filters.sessionId,
              "academicSessionId"
          )
        : null;

const classId = filters.classId
    ? normalizeId(filters.classId, "classId")
    : null;

const classArmId = filters.classArmId
    ? normalizeId(filters.classArmId, "classArmId")
    : null;

const departmentId = filters.departmentId
    ? normalizeId(filters.departmentId, "departmentId")
    : null;

const admissionStatus = normalizeText(filters.admissionStatus);

const values = [schoolId];

let whereClause = `
    WHERE school_id = $1
`;

if (studentId) {
    values.push(studentId);
    whereClause += ` AND student_id = $${values.length}`;
}

if (academicSessionId) {
    values.push(academicSessionId);
    whereClause += ` AND academic_session_id = $${values.length}`;
}

if (classId) {
    values.push(classId);
    whereClause += ` AND class_id = $${values.length}`;
}

if (classArmId) {
    values.push(classArmId);
    whereClause += ` AND class_arm_id = $${values.length}`;
}

if (departmentId) {
    values.push(departmentId);
    whereClause += ` AND department_id = $${values.length}`;
}

if (admissionStatus) {
    values.push(admissionStatus);
    whereClause += `
        AND LOWER(admission_status) = LOWER($${values.length})
    `;
}

const result = await query(
    `
    SELECT COUNT(*)::integer AS count
    FROM student_enrollments
    ${whereClause}
    `,
    values
);

return Number(result.rows[0]?.count || 0);
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET ENROLLMENT STATISTICS                                                  |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getEnrollmentStatistics(schoolId, academicSessionId = null) {
const school = normalizeId(schoolId, "schoolId");

```
let session = null;

if (
    academicSessionId !== null &&
    academicSessionId !== undefined &&
    academicSessionId !== ""
) {
    session = normalizeId(
        academicSessionId,
        "academicSessionId"
    );
}

const values = [school];

let whereClause = `
    WHERE school_id = $1
`;

if (session) {
    values.push(session);
    whereClause += `
        AND academic_session_id = $${values.length}
    `;
}

const result = await query(
    `
    SELECT
        COUNT(*)::integer AS total_enrollments,

        COUNT(*) FILTER (
            WHERE LOWER(admission_status) = 'active'
        )::integer AS active_enrollments,

        COUNT(*) FILTER (
            WHERE LOWER(admission_status) = 'inactive'
        )::integer AS inactive_enrollments,

        COUNT(*) FILTER (
            WHERE LOWER(admission_status) = 'graduated'
        )::integer AS graduated_enrollments,

        COUNT(*) FILTER (
            WHERE LOWER(admission_status) = 'withdrawn'
        )::integer AS withdrawn_enrollments

    FROM student_enrollments
    ${whereClause}
    `,
    values
);

return result.rows[0] || {
    total_enrollments: 0,
    active_enrollments: 0,
    inactive_enrollments: 0,
    graduated_enrollments: 0,
    withdrawn_enrollments: 0
};
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| EXPORTS                                                                    |
| -------------------------------------------------------------------------- |
| */                                                                         |

module.exports = {
createEnrollment,
findEnrollmentById,
findEnrollments,
getStudentEnrollments,
getCurrentEnrollment,
updateEnrollment,
deleteEnrollment,
enrollmentExists,
countEnrollments,
getEnrollmentStatistics
};
