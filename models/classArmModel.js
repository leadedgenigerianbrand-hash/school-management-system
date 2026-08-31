const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Class Arm Model
|--------------------------------------------------------------------------
|
| A class arm is a subdivision of a class.
|
| Examples:
|
| JSS 1
|   ├── A
|   ├── B
|   └── C
|
| OR
|
| JSS 1
|   ├── Rose
|   ├── Yellow
|   └── Pink
|
| OR
|
| SSS 1
|   ├── Science
|   ├── Arts
|   └── Commercial
|
| The names are completely controlled by the school.
|
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
    capacity = null,
    displayOrder = 0
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
            capacity,
            display_order
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
        )
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            schoolId,
            classId,
            armName.trim(),
            armCode,
            description,
            capacity,
            displayOrder
        ]
    );

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Class Arm By ID
|--------------------------------------------------------------------------
*/

async function findClassArmById(
    armId,
    schoolId = null
) {

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

    const values = [
        armId
    ];


    if (schoolId) {

        sql += `
            AND ca.school_id = $2
        `;

        values.push(
            schoolId
        );
    }


    sql += `
        LIMIT 1
    `;


    const result = await query(
        sql,
        values
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Find All Class Arms For A Class
|--------------------------------------------------------------------------
*/

async function findClassArmsByClass(
    classId,
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

        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id

        WHERE ca.class_id = $1
          AND ca.school_id = $2

        ORDER BY

            ca.display_order ASC,

            ca.arm_name ASC
    `;

    const result = await query(
        sql,
        [
            classId,
            schoolId
        ]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Find All Class Arms For A School
|--------------------------------------------------------------------------
*/

async function findClassArmsBySchool(
    schoolId
) {

    const sql = `
        SELECT

            ca.id,
            ca.school_id,
            ca.class_id,
            ca.arm_name,
            ca.arm_code,
            ca.description,
            ca.capacity,
            ca.display_order,
            ca.created_at,
            ca.updated_at,

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

            al.display_order ASC,

            c.display_order ASC,

            ca.display_order ASC,

            ca.arm_name ASC
    `;

    const result = await query(
        sql,
        [schoolId]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Find Class Arm By Name
|--------------------------------------------------------------------------
*/

async function findClassArmByName(
    classId,
    armName,
    schoolId
) {

    const sql = `
        SELECT

            ca.*,

            c.class_name,

            al.level_name

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

    const result = await query(
        sql,
        [
            classId,
            schoolId,
            armName
        ]
    );

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

        sql += `
            AND id <> $4
        `;

        values.push(
            excludeArmId
        );
    }


    sql += `
        ) AS exists
    `;


    const result = await query(
        sql,
        values
    );

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
        capacity = null,
        displayOrder = 0
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

            capacity = $5,

            display_order = $6,

            updated_at = NOW()

        WHERE id = $7

          AND school_id = $8

        RETURNING *
    `;

    const result = await query(
        sql,
        [
            classId,
            armName.trim(),
            armCode,
            description,
            capacity,
            displayOrder,
            armId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Update Only Class Arm Name
|--------------------------------------------------------------------------
|
| Useful when a school wants to rename:
|
| A → Rose
|
| or
|
| Science → STEM
|
|--------------------------------------------------------------------------
*/

async function renameClassArm(
    armId,
    schoolId,
    newName
) {

    if (!newName || !newName.trim()) {
        throw new Error(
            "New class arm name is required."
        );
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

    const result = await query(
        sql,
        [
            newName.trim(),
            armId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Update Class Arm Capacity
|--------------------------------------------------------------------------
*/

async function updateClassArmCapacity(
    armId,
    schoolId,
    capacity
) {

    if (
        capacity !== null &&
        (
            Number.isNaN(Number(capacity)) ||
            Number(capacity) < 0
        )
    ) {
        throw new Error(
            "Invalid class arm capacity."
        );
    }


    const sql = `
        UPDATE class_arms

        SET

            capacity = $1,

            updated_at = NOW()

        WHERE id = $2

          AND school_id = $3

        RETURNING *
    `;

    const result = await query(
        sql,
        [
            capacity,
            armId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Update Display Order
|--------------------------------------------------------------------------
*/

async function updateClassArmOrder(
    armId,
    schoolId,
    displayOrder
) {

    const sql = `
        UPDATE class_arms

        SET

            display_order = $1,

            updated_at = NOW()

        WHERE id = $2

          AND school_id = $3

        RETURNING *
    `;

    const result = await query(
        sql,
        [
            displayOrder,
            armId,
            schoolId
        ]
    );

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
        SELECT

            COUNT(*) AS total_students

        FROM student_enrollments se

        INNER JOIN students s
            ON s.id = se.student_id

        WHERE se.class_arm_id = $1

          AND s.school_id = $2

          AND se.status = 'active'

          AND s.status = 'active'
    `;

    const result = await query(
        sql,
        [
            armId,
            schoolId
        ]
    );

    return Number(
        result.rows[0].total_students
    );
}


/*
|--------------------------------------------------------------------------
| Get Class Arm Details
|--------------------------------------------------------------------------
|
| Returns the class arm together with the number of students.
|--------------------------------------------------------------------------
*/

async function getClassArmDetails(
    armId,
    schoolId
) {

    const sql = `
        SELECT

            ca.id,

            ca.school_id,

            ca.class_id,

            ca.arm_name,

            ca.arm_code,

            ca.description,

            ca.capacity,

            ca.display_order,

            ca.created_at,

            ca.updated_at,

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

                  AND se.status = 'active'

                  AND s.status = 'active'

                  AND s.school_id = ca.school_id

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

    const result = await query(
        sql,
        [
            armId,
            schoolId
        ]
    );

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

            s.first_name,

            s.middle_name,

            s.last_name,

            s.gender,

            s.date_of_birth,

            s.email,

            s.phone,

            s.photo_url,

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

          AND s.school_id = $2

          AND se.status = 'active'

        ORDER BY

            s.first_name ASC,

            s.last_name ASC

        LIMIT $3

        OFFSET $4
    `;

    const result = await query(
        sql,
        [
            armId,
            schoolId,
            limit,
            offset
        ]
    );

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

            al.level_name,

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
              OR c.class_name ILIKE $2
              OR al.level_name ILIKE $2
          )

        ORDER BY

            al.display_order ASC,

            c.display_order ASC,

            ca.display_order ASC,

            ca.arm_name ASC
    `;

    const result = await query(
        sql,
        [
            schoolId,
            `%${searchTerm}%`
        ]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Move Class Arm To Another Class
|--------------------------------------------------------------------------
|
| This allows an administrator to move an arm from one class to
| another when necessary.
|--------------------------------------------------------------------------
*/

async function moveClassArm(
    armId,
    schoolId,
    newClassId
) {

    const sql = `
        UPDATE class_arms

        SET

            class_id = $1,

            updated_at = NOW()

        WHERE id = $2

          AND school_id = $3

        RETURNING *
    `;

    const result = await query(
        sql,
        [
            newClassId,
            armId,
            schoolId
        ]
    );

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

    const result = await query(
        sql,
        [
            armId,
            schoolId
        ]
    );

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

    updateClassArmCapacity,

    updateClassArmOrder,

    getStudentCount,

    getClassArmDetails,

    getStudents,

    searchClassArms,

    moveClassArm,

    deleteClassArm

};