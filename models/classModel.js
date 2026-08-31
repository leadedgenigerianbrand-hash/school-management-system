const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Class Model
|--------------------------------------------------------------------------
|
| Handles school classes and class arms.
|
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
    status = "active"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!className) {
        throw new Error("Class name is required.");
    }


    const sql = `
        INSERT INTO classes (
            school_id,
            class_name,
            class_code,
            academic_level_id,
            description,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
        )
        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            className.trim(),
            classCode,
            academicLevelId,
            description,
            status
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Class By ID
|--------------------------------------------------------------------------
*/

async function findClassById(
    classId,
    schoolId = null
) {

    let sql = `
        SELECT

            c.*,

            al.level_name

        FROM classes c

        LEFT JOIN academic_levels al
            ON al.id = c.academic_level_id

        WHERE c.id = $1
    `;


    const values = [
        classId
    ];


    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND c.school_id = $${values.length}
        `;
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
| List Classes
|--------------------------------------------------------------------------
*/

async function findClasses({
    schoolId,
    academicLevelId = null,
    status = null
}) {

    let sql = `
        SELECT

            c.*,

            al.level_name

        FROM classes c

        LEFT JOIN academic_levels al
            ON al.id = c.academic_level_id

        WHERE c.school_id = $1
    `;


    const values = [
        schoolId
    ];


    if (academicLevelId) {

        values.push(
            academicLevelId
        );

        sql += `
            AND c.academic_level_id =
                $${values.length}
        `;
    }


    if (status) {

        values.push(status);

        sql += `
            AND c.status = $${values.length}
        `;
    }


    sql += `
        ORDER BY

            al.level_name ASC,

            c.class_name ASC
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Search Classes
|--------------------------------------------------------------------------
*/

async function searchClasses(
    searchTerm,
    schoolId
) {

    const sql = `
        SELECT

            c.*,

            al.level_name

        FROM classes c

        LEFT JOIN academic_levels al
            ON al.id = c.academic_level_id

        WHERE c.school_id = $1

          AND (

              c.class_name ILIKE $2

              OR c.class_code ILIKE $2

              OR c.description ILIKE $2

              OR al.level_name ILIKE $2

          )

        ORDER BY

            c.class_name ASC

        LIMIT 100
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
| Update Class
|--------------------------------------------------------------------------
*/

async function updateClass(
    classId,
    schoolId,
    data
) {

    const allowedFields = {

        className:
            "class_name",

        classCode:
            "class_code",

        academicLevelId:
            "academic_level_id",

        description:
            "description",

        status:
            "status"

    };


    const updates = [];

    const values = [];


    for (
        const key of Object.keys(data)
    ) {

        if (
            allowedFields[key] &&
            data[key] !== undefined
        ) {

            values.push(
                data[key]
            );


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

    const classIdPosition =
        values.length;


    values.push(schoolId);

    const schoolIdPosition =
        values.length;


    const sql = `
        UPDATE classes

        SET

            ${updates.join(", ")},

            updated_at = NOW()

        WHERE id = $${classIdPosition}

          AND school_id = $${schoolIdPosition}

        RETURNING *
    `;


    const result = await query(
        sql,
        values
    );


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


    const result = await query(
        sql,
        [
            classId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


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
    classTeacherId = null,
    capacity = null,
    status = "active"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!armName) {
        throw new Error("Class arm name is required.");
    }


    const sql = `
        INSERT INTO class_arms (
            school_id,
            class_id,
            arm_name,
            arm_code,
            class_teacher_id,
            capacity,
            status
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
            classTeacherId,
            capacity,
            status
        ]
    );


    return result.rows[0];
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

            ca.*,

            st.first_name AS teacher_first_name,

            st.last_name AS teacher_last_name

        FROM class_arms ca

        LEFT JOIN staff st
            ON st.id = ca.class_teacher_id

        WHERE ca.class_id = $1

          AND ca.school_id = $2

        ORDER BY

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

            st.first_name AS teacher_first_name,

            st.last_name AS teacher_last_name

        FROM class_arms ca

        INNER JOIN classes c
            ON c.id = ca.class_id

        LEFT JOIN staff st
            ON st.id = ca.class_teacher_id

        WHERE ca.id = $1

          AND ca.school_id = $2

        LIMIT 1
    `;


    const result = await query(
        sql,
        [
            classArmId,
            schoolId
        ]
    );


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
    termId
}) {

    let sql = `
        SELECT

            s.*,

            se.id AS enrollment_id,

            se.enrollment_date,

            ca.arm_name

        FROM student_enrollments se

        INNER JOIN students s
            ON s.id = se.student_id

        LEFT JOIN class_arms ca
            ON ca.id = se.class_arm_id

        WHERE se.school_id = $1

          AND se.class_id = $2

          AND se.session_id = $3

          AND se.term_id = $4

          AND s.status = 'active'
    `;


    const values = [
        schoolId,
        classId,
        sessionId,
        termId
    ];


    if (classArmId) {

        values.push(classArmId);

        sql += `
            AND se.class_arm_id =
                $${values.length}
        `;
    }


    sql += `
        ORDER BY

            s.last_name ASC,

            s.first_name ASC
    `;


    const result = await query(
        sql,
        values
    );


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
    termId
}) {

    let sql = `
        SELECT

            COUNT(*) AS student_count

        FROM student_enrollments se

        INNER JOIN students s
            ON s.id = se.student_id

        WHERE se.school_id = $1

          AND se.class_id = $2

          AND se.session_id = $3

          AND se.term_id = $4

          AND s.status = 'active'
    `;


    const values = [
        schoolId,
        classId,
        sessionId,
        termId
    ];


    if (classArmId) {

        values.push(classArmId);

        sql += `
            AND se.class_arm_id =
                $${values.length}
        `;
    }


    const result = await query(
        sql,
        values
    );


    return Number(
        result.rows[0].student_count
    );
}


/*
|--------------------------------------------------------------------------
| Class Statistics
|--------------------------------------------------------------------------
*/

async function getClassStatistics(
    schoolId
) {

    const sql = `
        SELECT

            (
                SELECT COUNT(*)

                FROM classes

                WHERE school_id = $1

                  AND status = 'active'
            )::INTEGER
                AS total_classes,


            (
                SELECT COUNT(*)

                FROM class_arms

                WHERE school_id = $1

                  AND status = 'active'
            )::INTEGER
                AS total_arms,


            (
                SELECT COUNT(*)

                FROM student_enrollments

                WHERE school_id = $1

                  AND status = 'active'
            )::INTEGER
                AS total_enrollments
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


    const row = result.rows[0];


    return {

        totalClasses:
            Number(row.total_classes),

        totalArms:
            Number(row.total_arms),

        totalEnrollments:
            Number(row.total_enrollments)

    };
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

    updateClass,

    deleteClass,

    createClassArm,

    getClassArms,

    findClassArmById,

    getStudentsInClass,

    countStudentsInClass,

    getClassStatistics

};