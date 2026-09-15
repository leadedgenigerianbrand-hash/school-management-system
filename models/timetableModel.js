"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| TIMETABLE MODEL
|--------------------------------------------------------------------------
|
| This model handles timetable database operations.
|
| Database table:
|
| timetable
|
| Expected fields:
| - id
| - school_id
| - academic_session_id
| - class_id
| - class_arm_id
| - subject_id
| - teacher_id
| - day_of_week
| - start_time
| - end_time
| - room
| - created_at
| - updated_at
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| VALIDATION HELPERS
|--------------------------------------------------------------------------
*/

function validateRequired(value, fieldName) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        throw new Error(`${fieldName} is required.`);
    }
}

function validateId(value, fieldName) {
    validateRequired(value, fieldName);

    const normalized = String(value).trim();

    if (!normalized) {
        throw new Error(`${fieldName} is invalid.`);
    }

    return normalized;
}

function normalizeDay(day) {
    if (
        day === undefined ||
        day === null ||
        day === ""
    ) {
        return null;
    }

    const normalized = String(day)
        .trim()
        .toLowerCase();

    const days = {
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday"
    };

    if (!days[normalized]) {
        throw new Error(
            "Invalid day_of_week. Use Monday, Tuesday, Wednesday, Thursday, Friday, Saturday or Sunday."
        );
    }

    return days[normalized];
}

function validateTime(value, fieldName) {
    validateRequired(value, fieldName);

    const time = String(value).trim();

    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
        throw new Error(
            `${fieldName} must be in HH:MM or HH:MM:SS format.`
        );
    }

    const parts = time.split(":");
    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    const second = parts[2] !== undefined
        ? Number(parts[2])
        : 0;

    if (
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59 ||
        second < 0 ||
        second > 59
    ) {
        throw new Error(
            `${fieldName} contains an invalid time.`
        );
    }

    return time;
}

function validateTimeRange(startTime, endTime) {
    const start = String(startTime).slice(0, 8);
    const end = String(endTime).slice(0, 8);

    if (start >= end) {
        throw new Error(
            "End time must be later than start time."
        );
    }
}

/*
|--------------------------------------------------------------------------
| SQL SELECT BUILDER
|--------------------------------------------------------------------------
*/

function buildTimetableSelect() {
    return `
        SELECT
            t.id,
            t.school_id,
            t.academic_session_id,
            t.class_id,
            t.class_arm_id,
            t.subject_id,
            t.teacher_id,
            t.day_of_week,
            t.start_time,
            t.end_time,
            t.room,
            t.created_at,
            t.updated_at,

            c.class_name,
            c.class_code,

            ca.arm_name,
            ca.arm_code,

            s.subject_name,
            s.subject_code,

            st.staff_number,
            st.first_name AS teacher_first_name,
            st.middle_name AS teacher_middle_name,
            st.last_name AS teacher_last_name,
            st.position AS teacher_position

        FROM timetable t

        LEFT JOIN classes c
            ON c.id = t.class_id
           AND c.school_id = t.school_id

        LEFT JOIN class_arms ca
            ON ca.id = t.class_arm_id
           AND ca.school_id = t.school_id

        LEFT JOIN subjects s
            ON s.id = t.subject_id
           AND s.school_id = t.school_id

        LEFT JOIN staff st
            ON st.id = t.teacher_id
           AND st.school_id = t.school_id
    `;
}

/*
|--------------------------------------------------------------------------
| CREATE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

async function createTimetableEntry({
    schoolId,
    academicSessionId,
    classId,
    classArmId = null,
    subjectId,
    teacherId = null,
    dayOfWeek,
    startTime,
    endTime,
    room = null
}) {
    const finalSchoolId =
        validateId(schoolId, "School ID");

    const finalSessionId =
        validateId(
            academicSessionId,
            "Academic session ID"
        );

    const finalClassId =
        validateId(classId, "Class ID");

    const finalSubjectId =
        validateId(subjectId, "Subject ID");

    const finalDay =
        normalizeDay(dayOfWeek);

    const finalStartTime =
        validateTime(
            startTime,
            "Start time"
        );

    const finalEndTime =
        validateTime(
            endTime,
            "End time"
        );

    validateTimeRange(
        finalStartTime,
        finalEndTime
    );

    const sql = `
        INSERT INTO timetable (
            school_id,
            academic_session_id,
            class_id,
            class_arm_id,
            subject_id,
            teacher_id,
            day_of_week,
            start_time,
            end_time,
            room
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
        RETURNING *
    `;

    const result = await query(sql, [
        finalSchoolId,
        finalSessionId,
        finalClassId,
        classArmId || null,
        finalSubjectId,
        teacherId || null,
        finalDay,
        finalStartTime,
        finalEndTime,
        room || null
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| GET TIMETABLE BY ID
|--------------------------------------------------------------------------
*/

async function getTimetableById(
    timetableId,
    schoolId
) {
    const finalTimetableId =
        validateId(
            timetableId,
            "Timetable ID"
        );

    const finalSchoolId =
        validateId(
            schoolId,
            "School ID"
        );

    const sql = `
        ${buildTimetableSelect()}

        WHERE t.id = $1
          AND t.school_id = $2

        LIMIT 1
    `;

    const result = await query(sql, [
        finalTimetableId,
        finalSchoolId
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| GET ALL TIMETABLE ENTRIES
|--------------------------------------------------------------------------
|
| Supports both:
|
| getTimetable(schoolId, filters, pagination)
|
| and the original object-style call:
|
| getTimetable({
|     schoolId,
|     academicSessionId,
|     classId,
|     ...
| })
|
|--------------------------------------------------------------------------
*/

async function getTimetable(
    schoolIdOrOptions,
    filters = {},
    pagination = {}
) {
    let schoolId;
    let effectiveFilters;
    let effectivePagination;

    if (
        schoolIdOrOptions &&
        typeof schoolIdOrOptions === "object" &&
        !Array.isArray(schoolIdOrOptions)
    ) {
        const options = schoolIdOrOptions;

        schoolId = options.schoolId;

        effectiveFilters = {
            academicSessionId:
                options.academicSessionId || null,

            classId:
                options.classId || null,

            classArmId:
                options.classArmId || null,

            subjectId:
                options.subjectId || null,

            teacherId:
                options.teacherId || null,

            dayOfWeek:
                options.dayOfWeek || null,

            search:
                options.search || null
        };

        effectivePagination = {
            page:
                Number(options.page) > 0
                    ? Number(options.page)
                    : 1,

            limit:
                Number(options.limit) > 0
                    ? Math.min(Number(options.limit), 200)
                    : 50
        };
    } else {
        schoolId = schoolIdOrOptions;

        effectiveFilters = {
            academicSessionId:
                filters?.academicSessionId || null,

            classId:
                filters?.classId || null,

            classArmId:
                filters?.classArmId || null,

            subjectId:
                filters?.subjectId || null,

            teacherId:
                filters?.teacherId || null,

            dayOfWeek:
                filters?.dayOfWeek || null,

            search:
                filters?.search || null
        };

        effectivePagination = {
            page:
                Number(pagination?.page) > 0
                    ? Number(pagination.page)
                    : 1,

            limit:
                Number(pagination?.limit) > 0
                    ? Math.min(Number(pagination.limit), 200)
                    : 50
        };
    }

    const finalSchoolId =
        validateId(
            schoolId,
            "School ID"
        );

    const values = [
        finalSchoolId
    ];

    let sql = `
        ${buildTimetableSelect()}

        WHERE t.school_id = $1
    `;

    if (effectiveFilters.academicSessionId) {
        values.push(
            validateId(
                effectiveFilters.academicSessionId,
                "Academic session ID"
            )
        );

        sql += `
            AND t.academic_session_id = $${values.length}
        `;
    }

    if (effectiveFilters.classId) {
        values.push(
            validateId(
                effectiveFilters.classId,
                "Class ID"
            )
        );

        sql += `
            AND t.class_id = $${values.length}
        `;
    }

    if (effectiveFilters.classArmId) {
        values.push(
            validateId(
                effectiveFilters.classArmId,
                "Class arm ID"
            )
        );

        sql += `
            AND t.class_arm_id = $${values.length}
        `;
    }

    if (effectiveFilters.subjectId) {
        values.push(
            validateId(
                effectiveFilters.subjectId,
                "Subject ID"
            )
        );

        sql += `
            AND t.subject_id = $${values.length}
        `;
    }

    if (effectiveFilters.teacherId) {
        values.push(
            validateId(
                effectiveFilters.teacherId,
                "Teacher ID"
            )
        );

        sql += `
            AND t.teacher_id = $${values.length}
        `;
    }

    if (effectiveFilters.dayOfWeek) {
        values.push(
            normalizeDay(
                effectiveFilters.dayOfWeek
            )
        );

        sql += `
            AND t.day_of_week = $${values.length}
        `;
    }

    if (effectiveFilters.search) {
        const searchValue =
            `%${String(
                effectiveFilters.search
            ).trim()}%`;

        values.push(searchValue);

        const searchParameter =
            `$${values.length}`;

        sql += `
            AND (
                c.class_name ILIKE ${searchParameter}
                OR c.class_code ILIKE ${searchParameter}
                OR ca.arm_name ILIKE ${searchParameter}
                OR ca.arm_code ILIKE ${searchParameter}
                OR s.subject_name ILIKE ${searchParameter}
                OR s.subject_code ILIKE ${searchParameter}
                OR st.staff_number ILIKE ${searchParameter}
                OR st.first_name ILIKE ${searchParameter}
                OR st.last_name ILIKE ${searchParameter}
                OR t.room ILIKE ${searchParameter}
            )
        `;
    }

    sql += `
        ORDER BY
            CASE t.day_of_week
                WHEN 'Monday' THEN 1
                WHEN 'Tuesday' THEN 2
                WHEN 'Wednesday' THEN 3
                WHEN 'Thursday' THEN 4
                WHEN 'Friday' THEN 5
                WHEN 'Saturday' THEN 6
                WHEN 'Sunday' THEN 7
                ELSE 8
            END,
            t.start_time ASC,
            c.class_name ASC,
            ca.arm_name ASC
    `;

    const page =
        Math.max(
            Number(effectivePagination.page) || 1,
            1
        );

    const limit =
        Math.min(
            Math.max(
                Number(effectivePagination.limit) || 50,
                1
            ),
            200
        );

    const offset =
        (page - 1) * limit;

    values.push(limit);
    const limitParameter = `$${values.length}`;

    values.push(offset);
    const offsetParameter = `$${values.length}`;

    sql += `
        LIMIT ${limitParameter}
        OFFSET ${offsetParameter}
    `;

    const result =
        await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET TIMETABLE BY CLASS
|--------------------------------------------------------------------------
|
| Supports:
|
| getTimetableByClass(classId, schoolId, sessionId, classArmId)
|
| as used by the controller.
|
|--------------------------------------------------------------------------
*/

async function getTimetableByClass(
    classIdOrSchoolId,
    schoolIdOrClassId,
    academicSessionId = null,
    classArmId = null
) {
    return getTimetable(
        schoolIdOrClassId,
        {
            classId: classIdOrSchoolId,
            classArmId,
            academicSessionId
        },
        {}
    );
}

/*
|--------------------------------------------------------------------------
| GET TIMETABLE BY CLASS ARM
|--------------------------------------------------------------------------
*/

async function getTimetableByClassArm(
    classArmIdOrSchoolId,
    schoolIdOrClassArmId,
    academicSessionId = null
) {
    return getTimetable(
        schoolIdOrClassArmId,
        {
            classArmId: classArmIdOrSchoolId,
            academicSessionId
        },
        {}
    );
}

/*
|--------------------------------------------------------------------------
| GET TIMETABLE BY TEACHER
|--------------------------------------------------------------------------
*/

async function getTimetableByTeacher(
    teacherIdOrSchoolId,
    schoolIdOrTeacherId,
    academicSessionId = null
) {
    return getTimetable(
        schoolIdOrTeacherId,
        {
            teacherId: teacherIdOrSchoolId,
            academicSessionId
        },
        {}
    );
}

/*
|--------------------------------------------------------------------------
| GET TIMETABLE BY SUBJECT
|--------------------------------------------------------------------------
*/

async function getTimetableBySubject(
    subjectIdOrSchoolId,
    schoolIdOrSubjectId,
    academicSessionId = null
) {
    return getTimetable(
        schoolIdOrSubjectId,
        {
            subjectId: subjectIdOrSchoolId,
            academicSessionId
        },
        {}
    );
}

/*
|--------------------------------------------------------------------------
| CHECK CLASS CONFLICT
|--------------------------------------------------------------------------
|
| Supports the positional controller call:
|
| checkClassConflict(
|     schoolId,
|     academicSessionId,
|     classId,
|     classArmId,
|     dayOfWeek,
|     startTime,
|     endTime,
|     excludeId
| )
|
| and object-style calls.
|
|--------------------------------------------------------------------------
*/

async function checkClassConflict(
    schoolIdOrOptions,
    academicSessionId,
    classId,
    classArmId = null,
    dayOfWeek,
    startTime,
    endTime,
    excludeId = null
) {
    let options;

    if (
        schoolIdOrOptions &&
        typeof schoolIdOrOptions === "object" &&
        !Array.isArray(schoolIdOrOptions)
    ) {
        options = schoolIdOrOptions;
    } else {
        options = {
            schoolId: schoolIdOrOptions,
            academicSessionId,
            classId,
            classArmId,
            dayOfWeek,
            startTime,
            endTime,
            excludeId
        };
    }

    const finalSchoolId =
        validateId(
            options.schoolId,
            "School ID"
        );

    const finalSessionId =
        validateId(
            options.academicSessionId,
            "Academic session ID"
        );

    const finalClassId =
        validateId(
            options.classId,
            "Class ID"
        );

    const finalDay =
        normalizeDay(options.dayOfWeek);

    const finalStartTime =
        validateTime(
            options.startTime,
            "Start time"
        );

    const finalEndTime =
        validateTime(
            options.endTime,
            "End time"
        );

    validateTimeRange(
        finalStartTime,
        finalEndTime
    );

    const finalClassArmId =
        options.classArmId || null;

    const values = [
        finalSchoolId,
        finalSessionId,
        finalClassId,
        finalClassArmId,
        finalDay,
        finalStartTime,
        finalEndTime
    ];

    let sql = `
        SELECT
            t.id,
            t.subject_id,
            t.teacher_id,
            t.day_of_week,
            t.start_time,
            t.end_time
        FROM timetable t

        WHERE t.school_id = $1
          AND t.academic_session_id = $2
          AND t.class_id = $3
          AND (
                t.class_arm_id = $4
                OR (
                    t.class_arm_id IS NULL
                    AND $4 IS NULL
                )
          )
          AND t.day_of_week = $5
          AND t.start_time < $7
          AND t.end_time > $6
    `;

    if (options.excludeId) {
        values.push(
            validateId(
                options.excludeId,
                "Timetable ID"
            )
        );

        sql += `
            AND t.id <> $${values.length}
        `;
    }

    sql += `
        LIMIT 1
    `;

    const result =
        await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| CHECK TEACHER CONFLICT
|--------------------------------------------------------------------------
*/

async function checkTeacherConflict(
    schoolIdOrOptions,
    academicSessionId,
    teacherId,
    dayOfWeek,
    startTime,
    endTime,
    excludeId = null
) {
    let options;

    if (
        schoolIdOrOptions &&
        typeof schoolIdOrOptions === "object" &&
        !Array.isArray(schoolIdOrOptions)
    ) {
        options = schoolIdOrOptions;
    } else {
        options = {
            schoolId: schoolIdOrOptions,
            academicSessionId,
            teacherId,
            dayOfWeek,
            startTime,
            endTime,
            excludeId
        };
    }

    if (!options.teacherId) {
        return null;
    }

    const finalSchoolId =
        validateId(
            options.schoolId,
            "School ID"
        );

    const finalSessionId =
        validateId(
            options.academicSessionId,
            "Academic session ID"
        );

    const finalTeacherId =
        validateId(
            options.teacherId,
            "Teacher ID"
        );

    const finalDay =
        normalizeDay(options.dayOfWeek);

    const finalStartTime =
        validateTime(
            options.startTime,
            "Start time"
        );

    const finalEndTime =
        validateTime(
            options.endTime,
            "End time"
        );

    validateTimeRange(
        finalStartTime,
        finalEndTime
    );

    const values = [
        finalSchoolId,
        finalSessionId,
        finalTeacherId,
        finalDay,
        finalStartTime,
        finalEndTime
    ];

    let sql = `
        SELECT
            t.id,
            t.class_id,
            t.class_arm_id,
            t.subject_id,
            t.day_of_week,
            t.start_time,
            t.end_time
        FROM timetable t

        WHERE t.school_id = $1
          AND t.academic_session_id = $2
          AND t.teacher_id = $3
          AND t.day_of_week = $4
          AND t.start_time < $6
          AND t.end_time > $5
    `;

    if (options.excludeId) {
        values.push(
            validateId(
                options.excludeId,
                "Timetable ID"
            )
        );

        sql += `
            AND t.id <> $${values.length}
        `;
    }

    sql += `
        LIMIT 1
    `;

    const result =
        await query(sql, values);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| UPDATE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

async function updateTimetable(
    timetableId,
    schoolId,
    {
        academicSessionId,
        classId,
        classArmId = null,
        subjectId,
        teacherId = null,
        dayOfWeek,
        startTime,
        endTime,
        room = null
    }
) {
    const finalTimetableId =
        validateId(
            timetableId,
            "Timetable ID"
        );

    const finalSchoolId =
        validateId(
            schoolId,
            "School ID"
        );

    const finalSessionId =
        validateId(
            academicSessionId,
            "Academic session ID"
        );

    const finalClassId =
        validateId(
            classId,
            "Class ID"
        );

    const finalSubjectId =
        validateId(
            subjectId,
            "Subject ID"
        );

    const finalDay =
        normalizeDay(dayOfWeek);

    const finalStartTime =
        validateTime(
            startTime,
            "Start time"
        );

    const finalEndTime =
        validateTime(
            endTime,
            "End time"
        );

    validateTimeRange(
        finalStartTime,
        finalEndTime
    );

    const sql = `
        UPDATE timetable

        SET
            academic_session_id = $1,
            class_id = $2,
            class_arm_id = $3,
            subject_id = $4,
            teacher_id = $5,
            day_of_week = $6,
            start_time = $7,
            end_time = $8,
            room = $9,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $10
          AND school_id = $11

        RETURNING *
    `;

    const result =
        await query(sql, [
            finalSessionId,
            finalClassId,
            classArmId || null,
            finalSubjectId,
            teacherId || null,
            finalDay,
            finalStartTime,
            finalEndTime,
            room || null,
            finalTimetableId,
            finalSchoolId
        ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| DELETE TIMETABLE ENTRY
|--------------------------------------------------------------------------
*/

async function deleteTimetable(
    timetableId,
    schoolId
) {
    const finalTimetableId =
        validateId(
            timetableId,
            "Timetable ID"
        );

    const finalSchoolId =
        validateId(
            schoolId,
            "School ID"
        );

    const sql = `
        DELETE FROM timetable

        WHERE id = $1
          AND school_id = $2

        RETURNING *
    `;

    const result =
        await query(sql, [
            finalTimetableId,
            finalSchoolId
        ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| COUNT TIMETABLE ENTRIES
|--------------------------------------------------------------------------
*/

async function countTimetable(
    schoolId,
    filters = {}
) {
    const finalSchoolId =
        validateId(
            schoolId,
            "School ID"
        );

    const values = [
        finalSchoolId
    ];

    let sql = `
        SELECT COUNT(*)::INTEGER AS count
        FROM timetable t
        WHERE t.school_id = $1
    `;

    if (filters.academicSessionId) {
        values.push(
            validateId(
                filters.academicSessionId,
                "Academic session ID"
            )
        );

        sql += `
            AND t.academic_session_id = $${values.length}
        `;
    }

    if (filters.classId) {
        values.push(
            validateId(
                filters.classId,
                "Class ID"
            )
        );

        sql += `
            AND t.class_id = $${values.length}
        `;
    }

    if (filters.classArmId) {
        values.push(
            validateId(
                filters.classArmId,
                "Class arm ID"
            )
        );

        sql += `
            AND t.class_arm_id = $${values.length}
        `;
    }

    if (filters.subjectId) {
        values.push(
            validateId(
                filters.subjectId,
                "Subject ID"
            )
        );

        sql += `
            AND t.subject_id = $${values.length}
        `;
    }

    if (filters.teacherId) {
        values.push(
            validateId(
                filters.teacherId,
                "Teacher ID"
            )
        );

        sql += `
            AND t.teacher_id = $${values.length}
        `;
    }

    if (filters.dayOfWeek) {
        values.push(
            normalizeDay(
                filters.dayOfWeek
            )
        );

        sql += `
            AND t.day_of_week = $${values.length}
        `;
    }

    const result =
        await query(sql, values);

    return Number(
        result.rows[0]?.count || 0
    );
}

/*
|--------------------------------------------------------------------------
| COMPATIBILITY ALIASES
|--------------------------------------------------------------------------
*/

const getAllTimetable = getTimetable;
const getTimetableEntries = getTimetable;
const getTimetableEntryById = getTimetableById;
const createTimetable = createTimetableEntry;

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    createTimetableEntry,
    createTimetable,

    getTimetableById,
    getTimetableEntryById,

    getTimetable,
    getAllTimetable,
    getTimetableEntries,

    getTimetableByClass,
    getTimetableByClassArm,
    getTimetableByTeacher,
    getTimetableBySubject,

    checkClassConflict,
    checkTeacherConflict,

    updateTimetable,
    deleteTimetable,

    countTimetable
};