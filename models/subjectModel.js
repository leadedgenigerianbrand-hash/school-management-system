const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Subject Model
|--------------------------------------------------------------------------
|
| Handles subjects taught in the school.
|
| Supports:
|
| - Creating subjects
| - Updating subjects
| - Searching subjects
| - Listing subjects
| - Assigning subjects to classes
| - Finding class subjects
| - Subject statistics
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Subject
|--------------------------------------------------------------------------
*/

async function createSubject({
    schoolId,
    subjectName,
    subjectCode = null,
    description = null,
    departmentId = null,
    status = "active"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!subjectName) {
        throw new Error("Subject name is required.");
    }


    const sql = `
        INSERT INTO subjects (
            school_id,
            subject_name,
            subject_code,
            description,
            department_id,
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
            subjectName.trim(),
            subjectCode,
            description,
            departmentId,
            status
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Subject By ID
|--------------------------------------------------------------------------
*/

async function findSubjectById(
    subjectId,
    schoolId = null
) {

    let sql = `
        SELECT

            sub.*,

            d.department_name

        FROM subjects sub

        LEFT JOIN departments d
            ON d.id = sub.department_id

        WHERE sub.id = $1
    `;


    const values = [
        subjectId
    ];


    if (schoolId) {

        values.push(schoolId);

        sql += `
            AND sub.school_id = $${values.length}
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
| Find Subject By Code
|--------------------------------------------------------------------------
*/

async function findSubjectByCode(
    subjectCode,
    schoolId
) {

    const sql = `
        SELECT *

        FROM subjects

        WHERE subject_code = $1

          AND school_id = $2

        LIMIT 1
    `;


    const result = await query(
        sql,
        [
            subjectCode,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| List Subjects
|--------------------------------------------------------------------------
*/

async function findSubjects({
    schoolId,
    departmentId = null,
    status = null
}) {

    let sql = `
        SELECT

            sub.*,

            d.department_name

        FROM subjects sub

        LEFT JOIN departments d
            ON d.id = sub.department_id

        WHERE sub.school_id = $1
    `;


    const values = [
        schoolId
    ];


    if (departmentId) {

        values.push(departmentId);

        sql += `
            AND sub.department_id = $${values.length}
        `;
    }


    if (status) {

        values.push(status);

        sql += `
            AND sub.status = $${values.length}
        `;
    }


    sql += `
        ORDER BY

            sub.subject_name ASC
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Search Subjects
|--------------------------------------------------------------------------
*/

async function searchSubjects(
    searchTerm,
    schoolId
) {

    const sql = `
        SELECT

            sub.*,

            d.department_name

        FROM subjects sub

        LEFT JOIN departments d
            ON d.id = sub.department_id

        WHERE sub.school_id = $1

          AND (

              sub.subject_name ILIKE $2

              OR sub.subject_code ILIKE $2

              OR sub.description ILIKE $2

              OR d.department_name ILIKE $2

          )

        ORDER BY

            sub.subject_name ASC

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
| Update Subject
|--------------------------------------------------------------------------
*/

async function updateSubject(
    subjectId,
    schoolId,
    data
) {

    const allowedFields = {

        subjectName:
            "subject_name",

        subjectCode:
            "subject_code",

        description:
            "description",

        departmentId:
            "department_id",

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


    values.push(subjectId);

    const subjectIdPosition =
        values.length;


    values.push(schoolId);

    const schoolIdPosition =
        values.length;


    const sql = `
        UPDATE subjects

        SET

            ${updates.join(", ")},

            updated_at = NOW()

        WHERE id = $${subjectIdPosition}

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
| Delete Subject
|--------------------------------------------------------------------------
*/

async function deleteSubject(
    subjectId,
    schoolId
) {

    const sql = `
        DELETE FROM subjects

        WHERE id = $1

          AND school_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            subjectId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Assign Subject To Class
|--------------------------------------------------------------------------
*/

async function assignSubjectToClass({
    schoolId,
    classId,
    subjectId,
    teacherId = null,
    periodsPerWeek = null,
    status = "active"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!classId) {
        throw new Error("Class ID is required.");
    }

    if (!subjectId) {
        throw new Error("Subject ID is required.");
    }


    const sql = `
        INSERT INTO class_subjects (
            school_id,
            class_id,
            subject_id,
            teacher_id,
            periods_per_week,
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
            classId,
            subjectId,
            teacherId,
            periodsPerWeek,
            status
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Get Subjects For Class
|--------------------------------------------------------------------------
*/

async function getSubjectsForClass(
    classId,
    schoolId
) {

    const sql = `
        SELECT

            cs.*,

            sub.subject_name,

            sub.subject_code,

            st.first_name AS teacher_first_name,

            st.last_name AS teacher_last_name

        FROM class_subjects cs

        INNER JOIN subjects sub
            ON sub.id = cs.subject_id

        LEFT JOIN staff st
            ON st.id = cs.teacher_id

        WHERE cs.class_id = $1

          AND cs.school_id = $2

        ORDER BY

            sub.subject_name ASC
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
| Remove Subject From Class
|--------------------------------------------------------------------------
*/

async function removeSubjectFromClass(
    classSubjectId,
    schoolId
) {

    const sql = `
        DELETE FROM class_subjects

        WHERE id = $1

          AND school_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            classSubjectId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Subject Statistics
|--------------------------------------------------------------------------
*/

async function getSubjectStatistics(
    schoolId
) {

    const sql = `
        SELECT

            COUNT(*)::INTEGER
                AS total_subjects,

            COUNT(
                CASE
                    WHEN status = 'active'
                    THEN 1
                END
            )::INTEGER
                AS active_subjects,

            COUNT(
                DISTINCT department_id
            )::INTEGER
                AS departments_with_subjects

        FROM subjects

        WHERE school_id = $1
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


    const row = result.rows[0];


    return {

        totalSubjects:
            Number(row.total_subjects),

        activeSubjects:
            Number(row.active_subjects),

        departmentsWithSubjects:
            Number(
                row.departments_with_subjects
            )

    };
}


/*
|--------------------------------------------------------------------------
| Check Subject Code
|--------------------------------------------------------------------------
*/

async function subjectCodeExists(
    subjectCode,
    schoolId
) {

    if (!subjectCode) {
        return false;
    }


    const sql = `
        SELECT

            EXISTS (

                SELECT 1

                FROM subjects

                WHERE subject_code = $1

                  AND school_id = $2

            ) AS exists
    `;


    const result = await query(
        sql,
        [
            subjectCode,
            schoolId
        ]
    );


    return result.rows[0].exists;
}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    createSubject,

    findSubjectById,

    findSubjectByCode,

    findSubjects,

    searchSubjects,

    updateSubject,

    deleteSubject,

    assignSubjectToClass,

    getSubjectsForClass,

    removeSubjectFromClass,

    getSubjectStatistics,

    subjectCodeExists

};