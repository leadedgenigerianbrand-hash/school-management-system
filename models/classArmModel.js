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
        normalized === "active" ||
        normalized === "enabled"
    ) {
        return true;
    }

    if (
        normalized === "false" ||
        normalized === "0" ||
        normalized === "no" ||
        normalized === "inactive" ||
        normalized === "disabled"
    ) {
        return false;
    }

    return defaultValue;
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

function normalizePositiveInteger(
    value,
    defaultValue = 100
) {
    const number =
        Number(value);

    if (
        !Number.isInteger(number) ||
        number < 0
    ) {
        return defaultValue;
    }

    return number;
}

async function verifyClassBelongsToSchool(
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

    const result =
        await query(
            `
                SELECT
                    c.id
                FROM classes c
                WHERE c.id = $1
                  AND c.school_id = $2
                LIMIT 1
            `,
            [
                classId,
                schoolId
            ]
        );

    if (
        result.rows.length === 0
    ) {
        throw new Error(
            "Class not found."
        );
    }

    return true;
}

async function createClassArm({
    schoolId,
    classId,
    armName,
    armCode = null,
    description = null,
    isActive = true
}) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    await verifyClassBelongsToSchool(
        classId,
        schoolId
    );

    const normalizedArmName =
        normalizeText(armName);

    if (!normalizedArmName) {
        throw new Error(
            "Class arm name is required."
        );
    }

    const exists =
        await classArmExists(
            classId,
            normalizedArmName,
            schoolId
        );

    if (exists) {
        throw new Error(
            "A class arm with this name already exists in this class."
        );
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

    const result =
        await query(
            sql,
            [
                schoolId,
                classId,
                normalizedArmName,
                normalizeText(armCode),
                normalizeText(description),
                normalizeBoolean(
                    isActive,
                    true
                )
            ]
        );

    return result.rows[0];
}

async function findClassArmById(
    armId,
    schoolId
) {
    if (!armId) {
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
            al.level_order,
            al.description AS level_description
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
                armId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function findClassArms({
    schoolId,
    classId = null,
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

    let sql = `
        SELECT
            ca.*,
            c.class_name,
            c.class_code,
            c.academic_level_id,
            al.level_name,
            al.level_order,
            al.description AS level_description,
            CONCAT_WS(
                ' - ',
                al.level_name,
                c.class_name,
                ca.arm_name
            ) AS display_name
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
           AND c.school_id = ca.school_id
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id
        WHERE ca.school_id = $1
    `;

    const values = [
        schoolId
    ];

    if (classId) {
        values.push(
            classId
        );

        sql += `
            AND ca.class_id = $${values.length}
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
            AND ca.is_active = $${values.length}
        `;
    }

    const searchTerm =
        normalizeText(
            search,
            ""
        );

    if (searchTerm) {
        values.push(
            `%${searchTerm}%`
        );

        sql += `
            AND (
                ca.arm_name ILIKE $${values.length}
                OR ca.arm_code ILIKE $${values.length}
                OR ca.description ILIKE $${values.length}
                OR c.class_name ILIKE $${values.length}
                OR c.class_code ILIKE $${values.length}
                OR al.level_name ILIKE $${values.length}
            )
        `;
    }

    values.push(
        safeLimit
    );

    sql += `
        ORDER BY
            al.level_order ASC,
            c.class_order ASC,
            c.class_name ASC,
            ca.arm_name ASC
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

async function findClassArmsByClass(
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

    await verifyClassBelongsToSchool(
        classId,
        schoolId
    );

    const sql = `
        SELECT
            ca.*,
            c.class_name,
            c.class_code,
            c.academic_level_id,
            al.level_name,
            al.level_order,
            al.description AS level_description
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
           AND c.school_id = ca.school_id
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id
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

async function findClassArmsBySchool(
    schoolId
) {
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
            al.level_order,
            al.description AS level_description
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
           AND c.school_id = ca.school_id
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id
        WHERE ca.school_id = $1
        ORDER BY
            al.level_order ASC,
            c.class_order ASC,
            c.class_name ASC,
            ca.arm_name ASC
    `;

    const result =
        await query(
            sql,
            [
                schoolId
            ]
        );

    return result.rows;
}

async function findClassArmByName(
    classId,
    armName,
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

    const normalizedArmName =
        normalizeText(armName);

    if (!normalizedArmName) {
        throw new Error(
            "Class arm name is required."
        );
    }

    const sql = `
        SELECT
            ca.*,
            c.class_name,
            c.class_code,
            c.academic_level_id,
            al.level_name,
            al.level_order,
            al.description AS level_description
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
           AND c.school_id = ca.school_id
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id
        WHERE ca.class_id = $1
          AND ca.school_id = $2
          AND LOWER(ca.arm_name) = LOWER($3)
        LIMIT 1
    `;

    const result =
        await query(
            sql,
            [
                classId,
                schoolId,
                normalizedArmName
            ]
        );

    return result.rows[0] || null;
}

async function classArmExists(
    classId,
    armName,
    schoolId,
    excludeArmId = null
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

    const normalizedArmName =
        normalizeText(armName);

    if (!normalizedArmName) {
        return false;
    }

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
        normalizedArmName
    ];

    if (excludeArmId) {
        values.push(
            excludeArmId
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

async function updateClassArm(
    armId,
    schoolId,
    data = {}
) {
    if (!armId) {
        throw new Error(
            "Class arm ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    if (
        data.classId !== undefined
    ) {
        await verifyClassBelongsToSchool(
            data.classId,
            schoolId
        );
    }

    if (
        data.armName !== undefined
    ) {
        const normalizedArmName =
            normalizeText(
                data.armName
            );

        if (!normalizedArmName) {
            throw new Error(
                "Class arm name cannot be empty."
            );
        }

        const currentArm =
            await findClassArmById(
                armId,
                schoolId
            );

        if (!currentArm) {
            throw new Error(
                "Class arm not found."
            );
        }

        const targetClassId =
            data.classId ??
            currentArm.class_id;

        const exists =
            await classArmExists(
                targetClassId,
                normalizedArmName,
                schoolId,
                armId
            );

        if (exists) {
            throw new Error(
                "A class arm with this name already exists in this class."
            );
        }
    }

    const fieldValues = [];

    if (
        data.classId !== undefined
    ) {
        fieldValues.push({
            field: "class_id",
            value: data.classId
        });
    }

    if (
        data.armName !== undefined
    ) {
        fieldValues.push({
            field: "arm_name",
            value: normalizeText(
                data.armName
            )
        });
    }

    if (
        data.armCode !== undefined
    ) {
        fieldValues.push({
            field: "arm_code",
            value: normalizeText(
                data.armCode
            )
        });
    }

    if (
        data.description !== undefined
    ) {
        fieldValues.push({
            field: "description",
            value: normalizeText(
                data.description
            )
        });
    }

    if (
        data.isActive !== undefined
    ) {
        fieldValues.push({
            field: "is_active",
            value: normalizeBoolean(
                data.isActive
            )
        });
    }

    if (
        fieldValues.length === 0
    ) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }

    const values = [];

    const assignments =
        fieldValues.map(
            item => {
                values.push(
                    item.value
                );

                return `${item.field} = $${values.length}`;
            }
        );

    values.push(
        armId
    );

    const armIdPosition =
        values.length;

    values.push(
        schoolId
    );

    const schoolIdPosition =
        values.length;

    const sql = `
        UPDATE class_arms
        SET
            ${assignments.join(", ")},
            updated_at = NOW()
        WHERE id = $${armIdPosition}
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

async function renameClassArm(
    armId,
    schoolId,
    newName
) {
    if (!armId) {
        throw new Error(
            "Class arm ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const normalizedName =
        normalizeText(newName);

    if (!normalizedName) {
        throw new Error(
            "New class arm name is required."
        );
    }

    const currentArm =
        await findClassArmById(
            armId,
            schoolId
        );

    if (!currentArm) {
        throw new Error(
            "Class arm not found."
        );
    }

    const exists =
        await classArmExists(
            currentArm.class_id,
            normalizedName,
            schoolId,
            armId
        );

    if (exists) {
        throw new Error(
            "A class arm with this name already exists in this class."
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

    const result =
        await query(
            sql,
            [
                normalizedName,
                armId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function setClassArmActive(
    armId,
    schoolId,
    isActive
) {
    if (!armId) {
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
        UPDATE class_arms
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
                armId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function getClassArmDetails(
    armId,
    schoolId
) {
    if (!armId) {
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
            c.class_order,
            c.academic_level_id,
            al.level_name,
            al.level_order,
            al.description AS level_description
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
                armId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function searchClassArms(
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
        return [];
    }

    const sql = `
        SELECT
            ca.*,
            c.class_name,
            c.class_code,
            c.academic_level_id,
            al.level_name,
            al.level_order,
            al.description AS level_description,
            CONCAT_WS(
                ' - ',
                al.level_name,
                c.class_name,
                ca.arm_name
            ) AS display_name
        FROM class_arms ca
        INNER JOIN classes c
            ON c.id = ca.class_id
           AND c.school_id = ca.school_id
        INNER JOIN academic_levels al
            ON al.id = c.academic_level_id
           AND al.school_id = c.school_id
        WHERE ca.school_id = $1
          AND (
              ca.arm_name ILIKE $2
              OR ca.arm_code ILIKE $2
              OR ca.description ILIKE $2
              OR c.class_name ILIKE $2
              OR c.class_code ILIKE $2
              OR al.level_name ILIKE $2
          )
        ORDER BY
            al.level_order ASC,
            c.class_order ASC,
            c.class_name ASC,
            ca.arm_name ASC
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

async function moveClassArm(
    armId,
    schoolId,
    newClassId
) {
    if (!armId) {
        throw new Error(
            "Class arm ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    await verifyClassBelongsToSchool(
        newClassId,
        schoolId
    );

    const currentArm =
        await findClassArmById(
            armId,
            schoolId
        );

    if (!currentArm) {
        throw new Error(
            "Class arm not found."
        );
    }

    const exists =
        await classArmExists(
            newClassId,
            currentArm.arm_name,
            schoolId,
            armId
        );

    if (exists) {
        throw new Error(
            "A class arm with this name already exists in the destination class."
        );
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

    const result =
        await query(
            sql,
            [
                newClassId,
                armId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function deleteClassArm(
    armId,
    schoolId
) {
    if (!armId) {
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
        DELETE FROM class_arms
        WHERE id = $1
          AND school_id = $2
        RETURNING
            id,
            class_id,
            arm_name
    `;

    const result =
        await query(
            sql,
            [
                armId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

module.exports = {
    createClassArm,
    findClassArmById,
    findClassArms,
    findClassArmsByClass,
    findClassArmsBySchool,
    findClassArmByName,
    classArmExists,
    updateClassArm,
    renameClassArm,
    setClassArmActive,
    getClassArmDetails,
    searchClassArms,
    moveClassArm,
    deleteClassArm
};