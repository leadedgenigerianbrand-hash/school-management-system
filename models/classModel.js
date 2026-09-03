```javascript
const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Class Model
|--------------------------------------------------------------------------
| Compatible with the current PostgreSQL schema.
|
| classes:
| id, school_id, academic_level_id, class_name, class_code,
| class_order, description, is_active, created_at, updated_at
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Create Class
|--------------------------------------------------------------------------
*/

async function createClass({
    schoolId,
    className,
    classCode = null,
    academicLevelId = null,
    description = null,
    classOrder = 0,
    isActive = true
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!className || !className.trim()) {
        throw new Error("Class name is required.");
    }

    const sql = `
        INSERT INTO classes (
            school_id,
            academic_level_id,
            class_name,
            class_code,
            class_order,
            description,
            is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        academicLevelId,
        className.trim(),
        classCode,
        classOrder,
        description,
        isActive
    ]);

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Find Class By ID
|--------------------------------------------------------------------------
*/

async function findClassById(classId, schoolId = null) {
    let sql = `
        SELECT
            c.*,
            al.level_name,
            al.level_code
        FROM classes c
        LEFT JOIN academic_levels al
            ON al.id = c.academic_level_id
        WHERE c.id = $1
    `;

    const values = [classId];

    if (schoolId) {
        values.push(schoolId);
        sql += ` AND c.school_id = $${values.length}`;
    }

    sql += ` LIMIT 1`;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| List Classes
|--------------------------------------------------------------------------
*/

async function findClasses({
    schoolId,
    academicLevelId = null,
    isActive = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            c.*,
            al.level_name,
            al.level_code
        FROM classes c
        LEFT JOIN academic_levels al
            ON al.id = c.academic_level_id
        WHERE c.school_id = $1
    `;

    const values = [schoolId];

    if (academicLevelId) {
        values.push(academicLevelId);

        sql += `
            AND c.academic_level_id = $${values.length}
        `;
    }

    if (isActive !== null && isActive !== undefined) {
        values.push(isActive);

        sql += `
            AND c.is_active = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            COALESCE(al.level_name, '') ASC,
            c.class_order ASC,
            c.class_name ASC
    `;

    const result = await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Search Classes
|--------------------------------------------------------------------------
*/

async function searchClasses(searchTerm, schoolId) {
    const term = String(searchTerm || "").trim();

    const sql = `
        SELECT
            c.*,
            al.level_name,
            al.level_code
        FROM classes c
        LEFT JOIN academic_levels al
            ON al.id = c.academic_level_id
        WHERE c.school_id = $1
          AND (
              c.class_name ILIKE $2
              OR c.class_code ILIKE $2
              OR c.description ILIKE $2
              OR al.level_name ILIKE $2
              OR al.level_code ILIKE $2
          )
        ORDER BY
            COALESCE(al.level_name, '') ASC,
            c.class_order ASC,
            c.class_name ASC
        LIMIT 100
    `;

    const result = await query(sql, [
        schoolId,
        `%${term}%`
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Check Whether Class Exists
|--------------------------------------------------------------------------
*/

async function classExists(
    schoolId,
    className,
    excludeClassId = null
) {
    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM classes
            WHERE school_id = $1
              AND LOWER(class_name) = LOWER($2)
    `;

    const values = [
        schoolId,
        className
    ];

    if (excludeClassId) {
        values.push(excludeClassId);

        sql += `
            AND id <> $${values.length}
        `;
    }

    sql += `) AS exists`;

    const result = await query(sql, values);

    return result.rows[0].exists;
}

/*
|--------------------------------------------------------------------------
| Update Class
|--------------------------------------------------------------------------
*/

async function updateClass(
    classId,
    schoolId,
    data
) {
    const allowedFields = {
        className: "class_name",
        classCode: "class_code",
        academicLevelId: "academic_level_id",
        classOrder: "class_order",
        description: "description",
        isActive: "is_active"
    };

    const updates = [];
    const values = [];

    for (const key of Object.keys(data || {})) {
        if (
            allowedFields[key] &&
            data[key] !== undefined
        ) {
            let value = data[key];

            if (
                key === "className" &&
                typeof value === "string"
            ) {
                value = value.trim();
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

    values.push(classId);
    const classIdPosition = values.length;

    values.push(schoolId);
    const schoolIdPosition = values.length;

    const sql = `
        UPDATE classes
        SET
            ${updates.join(", ")},
            updated_at = NOW()
        WHERE id = $${classIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Activate / Deactivate Class
|--------------------------------------------------------------------------
*/

async function setClassActive(
    classId,
    schoolId,
    isActive
) {
    const sql = `
        UPDATE classes
        SET
            is_active = $1,
            updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result = await query(sql, [
        isActive,
        classId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Update Class Order
|--------------------------------------------------------------------------
*/

async function updateClassOrder(
    classId,
    schoolId,
    classOrder
) {
    const sql = `
        UPDATE classes
        SET
            class_order = $1,
            updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result = await query(sql, [
        classOrder,
        classId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Get Class Arms
|--------------------------------------------------------------------------
*/

async function getClassArms(
    classId,
    schoolId
) {
    const sql = `
        SELECT
            ca.*
        FROM class_arms ca
        WHERE ca.class_id = $1
          AND ca.school_id = $2
        ORDER BY ca.arm_name ASC
    `;

    const result = await query(sql, [
        classId,
        schoolId
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Find Class Arm By ID
|--------------------------------------------------------------------------
*/

async function findClassArmById(
    classArmId,
    schoolId
) {
    const sql = `
        SELECT
            ca.*,
            c.class_name,
            c.class_code,
            al.level_name,
            al.level_code
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
        LEFT JOIN academic_levels al
            ON al.id = c.academic_level_id
        WHERE ca.id = $1
          AND ca.school_id = $2
        LIMIT 1
    `;

    const result = await query(sql, [
        classArmId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Get Students In Class
|--------------------------------------------------------------------------
*/

async function getStudentsInClass({
    schoolId,
    classId,
    classArmId = null,
    sessionId,
    termId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!sessionId) {
        throw new Error("Academic session ID is required.");
    }

    let sql = `
        SELECT
            s.*,
            se.id AS enrollment_id,
            se.academic_session_id,
            se.enrollment_date,
            se.admission_status,
            se.department_id,
            ca.arm_name,
            ca.arm_code
        FROM student_enrollments se
        INNER JOIN students s
            ON s.id = se.student_id
        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id
        WHERE se.school_id = $1
          AND se.class_id = $2
          AND se.academic_session_id = $3
          AND se.admission_status IN (
              'Enrolled',
              'Promoted',
              'Repeated'
          )
          AND s.school_id = $1
          AND LOWER(s.status) = 'active'
    `;

    const values = [
        schoolId,
        classId,
        sessionId
    ];

    if (classArmId) {
        values.push(classArmId);

        sql += `
            AND se.class_arm_id = $${values.length}
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
| Count Students In Class
|--------------------------------------------------------------------------
*/

async function countStudentsInClass({
    schoolId,
    classId,
    classArmId = null,
    sessionId,
    termId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!sessionId) {
        throw new Error("Academic session ID is required.");
    }

    let sql = `
        SELECT COUNT(*) AS student_count
        FROM student_enrollments se
        INNER JOIN students s
            ON s.id = se.student_id
        WHERE se.school_id = $1
          AND se.class_id = $2
          AND se.academic_session_id = $3
          AND se.admission_status IN (
              'Enrolled',
              'Promoted',
              'Repeated'
          )
          AND s.school_id = $1
          AND LOWER(s.status) = 'active'
    `;

    const values = [
        schoolId,
        classId,
        sessionId
    ];

    if (classArmId) {
        values.push(classArmId);

        sql += `
            AND se.class_arm_id = $${values.length}
        `;
    }

    const result = await query(sql, values);

    return Number(result.rows[0].student_count);
}

/*
|--------------------------------------------------------------------------
| Class Statistics
|--------------------------------------------------------------------------
*/

async function getClassStatistics(schoolId) {
    const sql = `
        SELECT
            (
                SELECT COUNT(*)
                FROM classes
                WHERE school_id = $1
                  AND is_active = TRUE
            )::INTEGER AS total_classes,

            (
                SELECT COUNT(*)
                FROM class_arms
                WHERE school_id = $1
                  AND is_active = TRUE
            )::INTEGER AS total_arms,

            (
                SELECT COUNT(*)
                FROM student_enrollments se
                INNER JOIN students s
                    ON s.id = se.student_id
                WHERE se.school_id = $1
                  AND se.admission_status IN (
                      'Enrolled',
                      'Promoted',
                      'Repeated'
                  )
                  AND s.school_id = $1
                  AND LOWER(s.status) = 'active'
            )::INTEGER AS total_enrollments
    `;

    const result = await query(sql, [schoolId]);

    const row = result.rows[0];

    return {
        totalClasses: Number(row.total_classes),
        totalArms: Number(row.total_arms),
        totalEnrollments: Number(row.total_enrollments)
    };
}

/*
|--------------------------------------------------------------------------
| Get Class Details
|--------------------------------------------------------------------------
*/

async function getClassDetails(
    classId,
    schoolId
) {
    const sql = `
        SELECT
            c.*,
            al.level_name,
            al.level_code,

            (
                SELECT COUNT(*)
                FROM class_arms ca
                WHERE ca.class_id = c.id
                  AND ca.school_id = c.school_id
                  AND ca.is_active = TRUE
            )::INTEGER AS total_arms,

            (
                SELECT COUNT(*)
                FROM student_enrollments se
                INNER JOIN students s
                    ON s.id = se.student_id
                WHERE se.class_id = c.id
                  AND se.school_id = c.school_id
                  AND se.admission_status IN (
                      'Enrolled',
                      'Promoted',
                      'Repeated'
                  )
                  AND s.school_id = c.school_id
                  AND LOWER(s.status) = 'active'
            )::INTEGER AS total_students

        FROM classes c

        LEFT JOIN academic_levels al
            ON al.id = c.academic_level_id

        WHERE c.id = $1
          AND c.school_id = $2

        LIMIT 1
    `;

    const result = await query(sql, [
        classId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Delete Class
|--------------------------------------------------------------------------
*/

async function deleteClass(
    classId,
    schoolId
) {
    const sql = `
        DELETE FROM classes
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(sql, [
        classId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    createClass,
    findClassById,
    findClasses,
    searchClasses,
    classExists,
    updateClass,
    setClassActive,
    updateClassOrder,
    getClassArms,
    findClassArmById,
    getStudentsInClass,
    countStudentsInClass,
    getClassStatistics,
    getClassDetails,
    deleteClass
};