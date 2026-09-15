"use strict";

const {
    query
} = require("../config/database");

async function createAcademicLevel({
    schoolId,
    levelName,
    levelOrder,
    description = null,
    isActive = true
}) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    if (
        typeof levelName !== "string" ||
        !levelName.trim()
    ) {
        throw new Error(
            "Academic level name is required."
        );
    }

    const order = Number(levelOrder);

    if (!Number.isInteger(order)) {
        throw new Error(
            "Academic level order must be a valid integer."
        );
    }

    const normalizedName =
        levelName.trim();

    const existingName =
        await findAcademicLevelByName(
            schoolId,
            normalizedName
        );

    if (existingName) {
        throw new Error(
            "An academic level with this name already exists."
        );
    }

    const existingOrder =
        await findAcademicLevelByOrder(
            schoolId,
            order
        );

    if (existingOrder) {
        throw new Error(
            "An academic level with this order already exists."
        );
    }

    const result =
        await query(
            `
            INSERT INTO academic_levels (
                school_id,
                level_name,
                level_order,
                description,
                is_active
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING *
            `,
            [
                schoolId,
                normalizedName,
                order,
                description,
                Boolean(isActive)
            ]
        );

    return result.rows[0];
}

async function findAcademicLevelById(
    levelId,
    schoolId = null
) {
    if (!levelId) {
        return null;
    }

    let sql = `
        SELECT
            id,
            school_id,
            level_name,
            level_order,
            description,
            is_active,
            created_at
        FROM academic_levels
        WHERE id = $1
    `;

    const values = [levelId];

    if (
        schoolId !== null &&
        schoolId !== undefined
    ) {
        values.push(schoolId);

        sql += `
            AND school_id = $${values.length}
        `;
    }

    sql += `
        LIMIT 1
    `;

    const result =
        await query(
            sql,
            values
        );

    return result.rows[0] || null;
}

async function findAcademicLevelByName(
    schoolId,
    levelName
) {
    if (
        !schoolId ||
        typeof levelName !== "string" ||
        !levelName.trim()
    ) {
        return null;
    }

    const result =
        await query(
            `
            SELECT
                id,
                school_id,
                level_name,
                level_order,
                description,
                is_active,
                created_at
            FROM academic_levels
            WHERE school_id = $1
              AND LOWER(level_name) = LOWER($2)
            LIMIT 1
            `,
            [
                schoolId,
                levelName.trim()
            ]
        );

    return result.rows[0] || null;
}

async function findAcademicLevelByOrder(
    schoolId,
    levelOrder
) {
    if (!schoolId) {
        return null;
    }

    const order =
        Number(levelOrder);

    if (!Number.isInteger(order)) {
        return null;
    }

    const result =
        await query(
            `
            SELECT
                id,
                school_id,
                level_name,
                level_order,
                description,
                is_active,
                created_at
            FROM academic_levels
            WHERE school_id = $1
              AND level_order = $2
            LIMIT 1
            `,
            [
                schoolId,
                order
            ]
        );

    return result.rows[0] || null;
}

async function findAcademicLevelsBySchool(
    schoolId,
    {
        isActive = null
    } = {}
) {
    if (!schoolId) {
        return [];
    }

    let sql = `
        SELECT
            id,
            school_id,
            level_name,
            level_order,
            description,
            is_active,
            created_at
        FROM academic_levels
        WHERE school_id = $1
    `;

    const values = [schoolId];

    if (
        isActive !== null &&
        isActive !== undefined
    ) {
        values.push(Boolean(isActive));

        sql += `
            AND is_active = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            level_order ASC,
            level_name ASC,
            id ASC
    `;

    const result =
        await query(
            sql,
            values
        );

    return result.rows;
}

async function getActiveAcademicLevels(
    schoolId
) {
    return findAcademicLevelsBySchool(
        schoolId,
        {
            isActive: true
        }
    );
}

async function academicLevelExists(
    schoolId,
    levelName,
    excludeLevelId = null
) {
    if (
        !schoolId ||
        typeof levelName !== "string" ||
        !levelName.trim()
    ) {
        return false;
    }

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM academic_levels
            WHERE school_id = $1
              AND LOWER(level_name) = LOWER($2)
    `;

    const values = [
        schoolId,
        levelName.trim()
    ];

    if (
        excludeLevelId !== null &&
        excludeLevelId !== undefined
    ) {
        values.push(excludeLevelId);

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
        result.rows[0]?.exists
    );
}

async function academicLevelOrderExists(
    schoolId,
    levelOrder,
    excludeLevelId = null
) {
    if (!schoolId) {
        return false;
    }

    const order =
        Number(levelOrder);

    if (!Number.isInteger(order)) {
        return false;
    }

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM academic_levels
            WHERE school_id = $1
              AND level_order = $2
    `;

    const values = [
        schoolId,
        order
    ];

    if (
        excludeLevelId !== null &&
        excludeLevelId !== undefined
    ) {
        values.push(excludeLevelId);

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
        result.rows[0]?.exists
    );
}

async function updateAcademicLevel(
    levelId,
    schoolId,
    {
        levelName,
        levelOrder,
        description = null,
        isActive = true
    }
) {
    if (!levelId) {
        throw new Error(
            "Academic level ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    if (
        typeof levelName !== "string" ||
        !levelName.trim()
    ) {
        throw new Error(
            "Academic level name is required."
        );
    }

    const order =
        Number(levelOrder);

    if (!Number.isInteger(order)) {
        throw new Error(
            "Academic level order must be a valid integer."
        );
    }

    const existing =
        await findAcademicLevelById(
            levelId,
            schoolId
        );

    if (!existing) {
        return null;
    }

    const duplicateName =
        await academicLevelExists(
            schoolId,
            levelName,
            levelId
        );

    if (duplicateName) {
        throw new Error(
            "Another academic level with this name already exists."
        );
    }

    const duplicateOrder =
        await academicLevelOrderExists(
            schoolId,
            order,
            levelId
        );

    if (duplicateOrder) {
        throw new Error(
            "Another academic level with this order already exists."
        );
    }

    const result =
        await query(
            `
            UPDATE academic_levels
            SET
                level_name = $1,
                level_order = $2,
                description = $3,
                is_active = $4
            WHERE id = $5
              AND school_id = $6
            RETURNING *
            `,
            [
                levelName.trim(),
                order,
                description,
                Boolean(isActive),
                levelId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function renameAcademicLevel(
    levelId,
    schoolId,
    newName
) {
    if (
        typeof newName !== "string" ||
        !newName.trim()
    ) {
        throw new Error(
            "New academic level name is required."
        );
    }

    const existing =
        await findAcademicLevelById(
            levelId,
            schoolId
        );

    if (!existing) {
        return null;
    }

    const duplicate =
        await academicLevelExists(
            schoolId,
            newName,
            levelId
        );

    if (duplicate) {
        throw new Error(
            "Another academic level with this name already exists."
        );
    }

    const result =
        await query(
            `
            UPDATE academic_levels
            SET level_name = $1
            WHERE id = $2
              AND school_id = $3
            RETURNING *
            `,
            [
                newName.trim(),
                levelId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function activateAcademicLevel(
    levelId,
    schoolId
) {
    const result =
        await query(
            `
            UPDATE academic_levels
            SET is_active = TRUE
            WHERE id = $1
              AND school_id = $2
            RETURNING *
            `,
            [
                levelId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function deactivateAcademicLevel(
    levelId,
    schoolId
) {
    const result =
        await query(
            `
            UPDATE academic_levels
            SET is_active = FALSE
            WHERE id = $1
              AND school_id = $2
            RETURNING *
            `,
            [
                levelId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function deleteAcademicLevel(
    levelId,
    schoolId
) {
    const existing =
        await findAcademicLevelById(
            levelId,
            schoolId
        );

    if (!existing) {
        return null;
    }

    const classesUsingLevel =
        await query(
            `
            SELECT COUNT(*) AS total
            FROM classes
            WHERE academic_level_id = $1
              AND school_id = $2
            `,
            [
                levelId,
                schoolId
            ]
        );

    const totalClasses =
        Number(
            classesUsingLevel.rows[0].total
        );

    if (totalClasses > 0) {
        throw new Error(
            "This academic level cannot be deleted because classes are using it. Deactivate it instead."
        );
    }

    const result =
        await query(
            `
            DELETE FROM academic_levels
            WHERE id = $1
              AND school_id = $2
            RETURNING *
            `,
            [
                levelId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function searchAcademicLevels(
    searchTerm,
    schoolId
) {
    if (!schoolId) {
        return [];
    }

    const term =
        String(
            searchTerm || ""
        ).trim();

    const result =
        await query(
            `
            SELECT
                id,
                school_id,
                level_name,
                level_order,
                description,
                is_active,
                created_at
            FROM academic_levels
            WHERE school_id = $1
              AND (
                  level_name ILIKE $2
                  OR COALESCE(
                      description,
                      ''
                  ) ILIKE $2
              )
            ORDER BY
                level_order ASC,
                level_name ASC,
                id ASC
            `,
            [
                schoolId,
                `%${term}%`
            ]
        );

    return result.rows;
}

async function getAcademicLevelWithClasses(
    levelId,
    schoolId
) {
    const level =
        await findAcademicLevelById(
            levelId,
            schoolId
        );

    if (!level) {
        return null;
    }

    const classesResult =
        await query(
            `
            SELECT
                c.id,
                c.school_id,
                c.academic_level_id,
                c.class_name,
                c.class_code,
                c.class_order,
                c.description,
                c.is_active,
                c.created_at,
                c.updated_at
            FROM classes c
            WHERE c.academic_level_id = $1
              AND c.school_id = $2
            ORDER BY
                c.class_order ASC NULLS LAST,
                c.class_name ASC,
                c.id ASC
            `,
            [
                levelId,
                schoolId
            ]
        );

    return {
        ...level,
        classes: classesResult.rows
    };
}

async function getAcademicLevelStatistics(
    levelId,
    schoolId
) {
    const level =
        await findAcademicLevelById(
            levelId,
            schoolId
        );

    if (!level) {
        return null;
    }

    const classesResult =
        await query(
            `
            SELECT COUNT(*) AS total
            FROM classes
            WHERE academic_level_id = $1
              AND school_id = $2
            `,
            [
                levelId,
                schoolId
            ]
        );

    let totalStudents = 0;

    const enrollmentTable =
        await query(
            `
            SELECT to_regclass(
                current_schema() || '.student_enrollments'
            ) AS table_name
            `
        );

    if (
        enrollmentTable.rows[0]?.table_name
    ) {
        const studentsResult =
            await query(
                `
                SELECT COUNT(
                    DISTINCT se.student_id
                ) AS total
                FROM student_enrollments se
                INNER JOIN classes c
                    ON c.id = se.class_id
                WHERE c.academic_level_id = $1
                  AND c.school_id = $2
                  AND se.school_id = $2
                `,
                [
                    levelId,
                    schoolId
                ]
            );

        totalStudents =
            Number(
                studentsResult.rows[0]?.total || 0
            );
    }

    return {
        totalClasses:
            Number(
                classesResult.rows[0]?.total || 0
            ),
        totalStudents
    };
}

module.exports = {
    createAcademicLevel,
    findAcademicLevelById,
    findAcademicLevelByName,
    findAcademicLevelByOrder,
    findAcademicLevelsBySchool,
    getActiveAcademicLevels,
    academicLevelExists,
    academicLevelOrderExists,
    updateAcademicLevel,
    renameAcademicLevel,
    activateAcademicLevel,
    deactivateAcademicLevel,
    deleteAcademicLevel,
    searchAcademicLevels,
    getAcademicLevelWithClasses,
    getAcademicLevelStatistics
};