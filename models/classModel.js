"use strict";

const { query } = require("../config/database");

function normalizeBoolean(value, defaultValue = true) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    const normalized =
        String(value)
            .trim()
            .toLowerCase();

    if (
        normalized === "true" ||
        normalized === "1" ||
        normalized === "yes" ||
        normalized === "active"
    ) {
        return true;
    }

    if (
        normalized === "false" ||
        normalized === "0" ||
        normalized === "no" ||
        normalized === "inactive"
    ) {
        return false;
    }

    return defaultValue;
}

function normalizePositiveInteger(
    value,
    defaultValue = 0
) {
    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number < 0
    ) {
        return defaultValue;
    }

    return number;
}

function normalizeText(
    value,
    defaultValue = null
) {
    if (
        value === undefined ||
        value === null
    ) {
        return defaultValue;
    }

    const text =
        String(value).trim();

    return text || defaultValue;
}

async function createClass({
    schoolId,
    academicLevelId,
    className,
    classCode = null,
    classOrder = 0,
    description = null,
    isActive = true
}) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    if (!academicLevelId) {
        throw new Error(
            "Academic level ID is required."
        );
    }

    const normalizedClassName =
        normalizeText(className);

    if (!normalizedClassName) {
        throw new Error(
            "Class name is required."
        );
    }

    const levelExistsQuery = `
        SELECT id
        FROM academic_levels
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
    `;

    const levelResult =
        await query(
            levelExistsQuery,
            [
                academicLevelId,
                schoolId
            ]
        );

    if (
        levelResult.rows.length === 0
    ) {
        throw new Error(
            "Academic level not found."
        );
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

    const result =
        await query(
            sql,
            [
                schoolId,
                academicLevelId,
                normalizedClassName,
                normalizeText(classCode),
                normalizePositiveInteger(
                    classOrder
                ),
                normalizeText(description),
                normalizeBoolean(
                    isActive,
                    true
                )
            ]
        );

    return result.rows[0];
}

async function findClassById(
    classId,
    schoolId
) {
    if (!classId) {
        throw new Error(
            "Class ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const sql = `
        SELECT
            c.*,
            al.level_name,
            al.level_order,
            al.description AS level_description
        FROM classes c
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id
        WHERE c.id = $1
          AND c.school_id = $2
        LIMIT 1
    `;

    const result =
        await query(
            sql,
            [
                classId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function findClasses({
    schoolId,
    academicLevelId = null,
    isActive = null,
    search = null,
    limit = 100,
    offset = 0
}) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const values = [
        schoolId
    ];

    let sql = `
        SELECT
            c.*,
            al.level_name,
            al.level_order,
            al.description AS level_description
        FROM classes c
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id
        WHERE c.school_id = $1
    `;

    if (academicLevelId) {
        values.push(
            academicLevelId
        );

        sql += `
            AND c.academic_level_id = $${values.length}
        `;
    }

    if (
        isActive !== null &&
        isActive !== undefined &&
        isActive !== ""
    ) {
        values.push(
            normalizeBoolean(
                isActive
            )
        );

        sql += `
            AND c.is_active = $${values.length}
        `;
    }

    const searchTerm =
        normalizeText(search, "");

    if (searchTerm) {
        values.push(
            `%${searchTerm}%`
        );

        sql += `
            AND (
                c.class_name ILIKE $${values.length}
                OR c.class_code ILIKE $${values.length}
                OR c.description ILIKE $${values.length}
                OR al.level_name ILIKE $${values.length}
            )
        `;
    }

    const safeLimit =
        Math.min(
            Math.max(
                normalizePositiveInteger(
                    limit,
                    100
                ),
                1
            ),
            500
        );

    const safeOffset =
        Math.max(
            normalizePositiveInteger(
                offset,
                0
            ),
            0
        );

    values.push(
        safeLimit
    );

    sql += `
        ORDER BY
            al.level_order ASC,
            c.class_order ASC,
            c.class_name ASC
        LIMIT $${values.length}
    `;

    values.push(
        safeOffset
    );

    sql += `
        OFFSET $${values.length}
    `;

    const result =
        await query(
            sql,
            values
        );

    return result.rows;
}

async function searchClasses(
    searchTerm,
    schoolId
) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const term =
        normalizeText(
            searchTerm,
            ""
        );

    if (!term) {
        return findClasses({
            schoolId
        });
    }

    const sql = `
        SELECT
            c.*,
            al.level_name,
            al.level_order,
            al.description AS level_description
        FROM classes c
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id
        WHERE c.school_id = $1
          AND (
              c.class_name ILIKE $2
              OR c.class_code ILIKE $2
              OR c.description ILIKE $2
              OR al.level_name ILIKE $2
          )
        ORDER BY
            al.level_order ASC,
            c.class_order ASC,
            c.class_name ASC
        LIMIT 100
    `;

    const result =
        await query(
            sql,
            [
                schoolId,
                `%${term}%`
            ]
        );

    return result.rows;
}

async function classExists(
    schoolId,
    className,
    excludeClassId = null
) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const normalizedClassName =
        normalizeText(className);

    if (!normalizedClassName) {
        return false;
    }

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM classes
            WHERE school_id = $1
              AND LOWER(class_name) = LOWER($2)
    `;

    const values = [
        schoolId,
        normalizedClassName
    ];

    if (excludeClassId) {
        values.push(
            excludeClassId
        );

        sql += `
            AND id <> $${values.length}
        `;
    }

    sql += `
        ) AS exists
    `;

    const result =
        await query(
            sql,
            values
        );

    return Boolean(
        result.rows[0].exists
    );
}

async function updateClass(
    classId,
    schoolId,
    data = {}
) {
    if (!classId) {
        throw new Error(
            "Class ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const allowedFields = {
        academicLevelId:
            "academic_level_id",
        className:
            "class_name",
        classCode:
            "class_code",
        classOrder:
            "class_order",
        description:
            "description",
        isActive:
            "is_active"
    };

    const updates = [];
    const values = [];

    for (
        const key of Object.keys(data)
    ) {
        if (
            !Object.prototype.hasOwnProperty.call(
                allowedFields,
                key
            )
        ) {
            continue;
        }

        if (
            data[key] === undefined
        ) {
            continue;
        }

        let value =
            data[key];

        if (
            key === "academicLevelId"
        ) {
            value =
                normalizeText(value);

            if (!value) {
                throw new Error(
                    "Academic level ID is required."
                );
            }
        }

        if (
            key === "className"
        ) {
            value =
                normalizeText(value);

            if (!value) {
                throw new Error(
                    "Class name is required."
                );
            }
        }

        if (
            key === "classCode"
        ) {
            value =
                normalizeText(value);
        }

        if (
            key === "classOrder"
        ) {
            value =
                normalizePositiveInteger(
                    value
                );
        }

        if (
            key === "description"
        ) {
            value =
                normalizeText(value);
        }

        if (
            key === "isActive"
        ) {
            value =
                normalizeBoolean(
                    value
                );
        }

        values.push(value);

        updates.push(
            `${allowedFields[key]} = $${values.length}`
        );
    }

    if (
        updates.length === 0
    ) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }

    if (
        data.academicLevelId !== undefined
    ) {
        const levelResult =
            await query(
                `
                    SELECT id
                    FROM academic_levels
                    WHERE id = $1
                      AND school_id = $2
                    LIMIT 1
                `,
                [
                    data.academicLevelId,
                    schoolId
                ]
            );

        if (
            levelResult.rows.length === 0
        ) {
            throw new Error(
                "Academic level not found."
            );
        }
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

    const result =
        await query(
            sql,
            values
        );

    return result.rows[0] || null;
}

async function setClassActive(
    classId,
    schoolId,
    isActive
) {
    if (!classId) {
        throw new Error(
            "Class ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const sql = `
        UPDATE classes
        SET
            is_active = $1,
            updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result =
        await query(
            sql,
            [
                normalizeBoolean(
                    isActive
                ),
                classId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function updateClassOrder(
    classId,
    schoolId,
    classOrder
) {
    if (!classId) {
        throw new Error(
            "Class ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const normalizedOrder =
        normalizePositiveInteger(
            classOrder
        );

    const sql = `
        UPDATE classes
        SET
            class_order = $1,
            updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
        RETURNING *
    `;

    const result =
        await query(
            sql,
            [
                normalizedOrder,
                classId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function getClassArms(
    classId,
    schoolId
) {
    if (!classId) {
        throw new Error(
            "Class ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const sql = `
        SELECT
            ca.*
        FROM class_arms ca
        WHERE ca.class_id = $1
          AND ca.school_id = $2
        ORDER BY
            ca.arm_name ASC
    `;

    const result =
        await query(
            sql,
            [
                classId,
                schoolId
            ]
        );

    return result.rows;
}

async function findClassArmById(
    classArmId,
    schoolId
) {
    if (!classArmId) {
        throw new Error(
            "Class arm ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const sql = `
        SELECT
            ca.*,
            c.class_name,
            c.class_code,
            c.academic_level_id,
            al.level_name,
            al.level_order
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
           AND c.school_id = ca.school_id
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id
        WHERE ca.id = $1
          AND ca.school_id = $2
        LIMIT 1
    `;

    const result =
        await query(
            sql,
            [
                classArmId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function getClassStatistics(
    schoolId
) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const sql = `
        SELECT
            (
                SELECT COUNT(*)
                FROM classes
                WHERE school_id = $1
            )::INTEGER AS total_classes,

            (
                SELECT COUNT(*)
                FROM classes
                WHERE school_id = $1
                  AND is_active = TRUE
            )::INTEGER AS active_classes,

            (
                SELECT COUNT(*)
                FROM classes
                WHERE school_id = $1
                  AND is_active = FALSE
            )::INTEGER AS inactive_classes,

            (
                SELECT COUNT(*)
                FROM class_arms
                WHERE school_id = $1
            )::INTEGER AS total_arms,

            (
                SELECT COUNT(*)
                FROM class_arms
                WHERE school_id = $1
                  AND is_active = TRUE
            )::INTEGER AS active_arms
    `;

    const result =
        await query(
            sql,
            [
                schoolId
            ]
        );

    const row =
        result.rows[0];

    return {
        totalClasses:
            Number(row.total_classes),

        activeClasses:
            Number(row.active_classes),

        inactiveClasses:
            Number(row.inactive_classes),

        totalArms:
            Number(row.total_arms),

        activeArms:
            Number(row.active_arms)
    };
}

async function getClassDetails(
    classId,
    schoolId
) {
    if (!classId) {
        throw new Error(
            "Class ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const sql = `
        SELECT
            c.*,
            al.level_name,
            al.level_order,
            al.description AS level_description,

            (
                SELECT COUNT(*)
                FROM class_arms ca
                WHERE ca.class_id = c.id
                  AND ca.school_id = c.school_id
            )::INTEGER AS total_arms,

            (
                SELECT COUNT(*)
                FROM class_arms ca
                WHERE ca.class_id = c.id
                  AND ca.school_id = c.school_id
                  AND ca.is_active = TRUE
            )::INTEGER AS active_arms

        FROM classes c

        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id

        WHERE c.id = $1
          AND c.school_id = $2

        LIMIT 1
    `;

    const result =
        await query(
            sql,
            [
                classId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function deleteClass(
    classId,
    schoolId
) {
    if (!classId) {
        throw new Error(
            "Class ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const sql = `
        DELETE FROM classes
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result =
        await query(
            sql,
            [
                classId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

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
    getClassStatistics,
    getClassDetails,
    deleteClass
};