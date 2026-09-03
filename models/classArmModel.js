```javascript
const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Class Arm Model
|--------------------------------------------------------------------------
| Compatible with the current PostgreSQL schema.
|
| class_arms:
| id, school_id, class_id, arm_name, arm_code, description,
| is_active, created_at, updated_at
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Create Class Arm
|--------------------------------------------------------------------------
*/

async function createClassArm({
    schoolId,
    classId,
    armName,
    armCode = null,
    description = null,
    isActive = true
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!armName || !armName.trim()) {
        throw new Error("Class arm name is required.");
    }

    const sql = `
        INSERT INTO class_arms (
            school_id,
            class_id,
            arm_name,
            arm_code,
            description,
            is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        classId,
        armName.trim(),
        armCode,
        description,
        isActive
    ]);

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Find Class Arm By ID
|--------------------------------------------------------------------------
*/

async function findClassArmById(armId, schoolId = null) {
    let sql = `
        SELECT
            ca.*,
            c.class_name,
            c.class_code,
            al.id AS academic_level_id,
            al.level_name,
            al.level_code
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
        WHERE ca.id = $1
    `;

    const values = [armId];

    if (schoolId) {
        sql += ` AND ca.school_id = $2`;
        values.push(schoolId);
    }

    sql += ` LIMIT 1`;

    const result = await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Find All Class Arms For A Class
|--------------------------------------------------------------------------
*/

async function findClassArmsByClass(classId, schoolId) {
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
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
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
| Find All Class Arms For A School
|--------------------------------------------------------------------------
*/

async function findClassArmsBySchool(schoolId) {
    const sql = `
        SELECT
            ca.*,
            c.class_name,
            c.class_code,
            al.id AS academic_level_id,
            al.level_name,
            al.level_code
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
        WHERE ca.school_id = $1
        ORDER BY
            al.level_name ASC,
            c.class_name ASC,
            ca.arm_name ASC
    `;

    const result = await query(sql, [schoolId]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Find Class Arm By Name
|--------------------------------------------------------------------------
*/

async function findClassArmByName(classId, armName, schoolId) {
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
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
        WHERE ca.class_id = $1
          AND ca.school_id = $2
          AND LOWER(ca.arm_name) = LOWER($3)
        LIMIT 1
    `;

    const result = await query(sql, [
        classId,
        schoolId,
        armName
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Check Whether Class Arm Exists
|--------------------------------------------------------------------------
*/

async function classArmExists(
    classId,
    armName,
    schoolId,
    excludeArmId = null
) {
    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM class_arms
            WHERE class_id = $1
              AND school_id = $2
              AND LOWER(arm_name) = LOWER($3)
    `;

    const values = [
        classId,
        schoolId,
        armName
    ];

    if (excludeArmId) {
        sql += ` AND id <> $4`;
        values.push(excludeArmId);
    }

    sql += `) AS exists`;

    const result = await query(sql, values);

    return result.rows[0].exists;
}

/*
|--------------------------------------------------------------------------
| Update Class Arm
|--------------------------------------------------------------------------
*/

async function updateClassArm(
    armId,
    schoolId,
    {
        classId,
        armName,
        armCode = null,
        description = null,
        isActive = true
    }
) {
    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!armName || !armName.trim()) {
        throw new Error("Class arm name is required.");
    }

    const sql = `
        UPDATE class_arms
        SET
            class_id = $1,
            arm_name = $2,
            arm_code = $3,
            description = $4,
            is_active = $5,
            updated_at = NOW()
        WHERE id = $6
          AND school_id = $7
        RETURNING *
    `;

    const result = await query(sql, [
        classId,
        armName.trim(),
        armCode,
        description,
        isActive,
        armId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Rename Class Arm
|--------------------------------------------------------------------------
*/

async function renameClassArm(
    armId,
    schoolId,
    newName
) {
    if (!newName || !newName.trim()) {
        throw new Error("New class arm name is required.");
    }

    const sql = `
        UPDATE class_arms
        SET
            arm_name = $1,
            updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result = await query(sql, [
        newName.trim(),
        armId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Activate / Deactivate Class Arm
|--------------------------------------------------------------------------
*/

async function setClassArmActive(
    armId,
    schoolId,
    isActive
) {
    const sql = `
        UPDATE class_arms
        SET
            is_active = $1,
            updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result = await query(sql, [
        isActive,
        armId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Get Class Arm Student Count
|--------------------------------------------------------------------------
*/

async function getStudentCount(
    armId,
    schoolId
) {
    const sql = `
        SELECT COUNT(*) AS total_students
        FROM student_enrollments se
        INNER JOIN students s
            ON s.id = se.student_id
        WHERE se.class_arm_id = $1
          AND se.school_id = $2
          AND se.admission_status IN (
              'Enrolled',
              'Promoted',
              'Repeated'
          )
          AND s.school_id = $2
          AND LOWER(s.status) = 'active'
    `;

    const result = await query(sql, [
        armId,
        schoolId
    ]);

    return Number(result.rows[0].total_students);
}

/*
|--------------------------------------------------------------------------
| Get Class Arm Details
|--------------------------------------------------------------------------
*/

async function getClassArmDetails(
    armId,
    schoolId
) {
    const sql = `
        SELECT
            ca.*,
            c.class_name,
            c.class_code,
            al.id AS academic_level_id,
            al.level_name,
            al.level_code,
            (
                SELECT COUNT(*)
                FROM student_enrollments se
                INNER JOIN students s
                    ON s.id = se.student_id
                WHERE se.class_arm_id = ca.id
                  AND se.school_id = ca.school_id
                  AND se.admission_status IN (
                      'Enrolled',
                      'Promoted',
                      'Repeated'
                  )
                  AND s.school_id = ca.school_id
                  AND LOWER(s.status) = 'active'
            ) AS total_students
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
        WHERE ca.id = $1
          AND ca.school_id = $2
        LIMIT 1
    `;

    const result = await query(sql, [
        armId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Get Students In Class Arm
|--------------------------------------------------------------------------
*/

async function getStudents(
    armId,
    schoolId,
    {
        limit = 100,
        offset = 0
    } = {}
) {
    const sql = `
        SELECT
            s.id,
            s.student_number,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name,
            s.gender,
            s.date_of_birth,
            s.email,
            s.phone,
            s.student_photo_url,
            s.status,
            CONCAT_WS(
                ' ',
                s.first_name,
                s.middle_name,
                s.last_name
            ) AS full_name
        FROM student_enrollments se
        INNER JOIN students s
            ON s.id = se.student_id
        WHERE se.class_arm_id = $1
          AND se.school_id = $2
          AND se.admission_status IN (
              'Enrolled',
              'Promoted',
              'Repeated'
          )
          AND s.school_id = $2
          AND LOWER(s.status) = 'active'
        ORDER BY
            s.first_name ASC,
            s.last_name ASC
        LIMIT $3
        OFFSET $4
    `;

    const result = await query(sql, [
        armId,
        schoolId,
        limit,
        offset
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Search Class Arms
|--------------------------------------------------------------------------
*/

async function searchClassArms(
    searchTerm,
    schoolId
) {
    const sql = `
        SELECT
            ca.*,
            c.class_name,
            c.class_code,
            al.level_name,
            al.level_code,
            CONCAT(
                al.level_name,
                ' - ',
                c.class_name,
                ' - ',
                ca.arm_name
            ) AS display_name
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
        WHERE ca.school_id = $1
          AND (
              ca.arm_name ILIKE $2
              OR ca.arm_code ILIKE $2
              OR ca.description ILIKE $2
              OR c.class_name ILIKE $2
              OR al.level_name ILIKE $2
          )
        ORDER BY
            al.level_name ASC,
            c.class_name ASC,
            ca.arm_name ASC
    `;

    const result = await query(sql, [
        schoolId,
        `%${searchTerm}%`
    ]);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Move Class Arm To Another Class
|--------------------------------------------------------------------------
*/

async function moveClassArm(
    armId,
    schoolId,
    newClassId
) {
    if (!newClassId) {
        throw new Error("New class ID is required.");
    }

    const sql = `
        UPDATE class_arms
        SET
            class_id = $1,
            updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result = await query(sql, [
        newClassId,
        armId,
        schoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Delete Class Arm
|--------------------------------------------------------------------------
*/

async function deleteClassArm(
    armId,
    schoolId
) {
    const sql = `
        DELETE FROM class_arms
        WHERE id = $1
          AND school_id = $2
        RETURNING
            id,
            class_id,
            arm_name
    `;

    const result = await query(sql, [
        armId,
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
    createClassArm,
    findClassArmById,
    findClassArmsByClass,
    findClassArmsBySchool,
    findClassArmByName,
    classArmExists,
    updateClassArm,
    renameClassArm,
    setClassArmActive,
    getStudentCount,
    getClassArmDetails,
    getStudents,
    searchClassArms,
    moveClassArm,
    deleteClassArm
};