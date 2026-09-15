"use strict";

const { query } = require("../config/database");

/* ==========================================================================
   RESULT SETTINGS MODEL
   ==========================================================================

   Database table:
   result_settings

   Purpose:
   Stores school-specific grading rules used by the Results module.

   Database columns:
   id
   school_id
   setting_name
   minimum_score
   maximum_score
   grade
   remark
   grade_point
   created_at

   IMPORTANT:
   This model intentionally uses only columns that exist in the
   result_settings table.

   ========================================================================== */

/* ==========================================================================
   VALIDATION HELPERS
   ========================================================================== */

function requireSchoolId(schoolId) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    return schoolId;
}

function normalizeOptionalNumber(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error("Score values must be valid numbers.");
    }

    return number;
}

function validateScoreRange(
    minimumScore,
    maximumScore
) {
    const minimum =
        normalizeOptionalNumber(minimumScore);

    const maximum =
        normalizeOptionalNumber(maximumScore);

    if (
        minimum !== null &&
        (minimum < 0 || minimum > 100)
    ) {
        throw new Error(
            "Minimum score must be between 0 and 100."
        );
    }

    if (
        maximum !== null &&
        (maximum < 0 || maximum > 100)
    ) {
        throw new Error(
            "Maximum score must be between 0 and 100."
        );
    }

    if (
        minimum !== null &&
        maximum !== null &&
        minimum > maximum
    ) {
        throw new Error(
            "Minimum score cannot be greater than maximum score."
        );
    }

    return {
        minimum,
        maximum
    };
}

function normalizeSettingName(settingName) {
    if (
        settingName === undefined ||
        settingName === null
    ) {
        return null;
    }

    const value =
        String(settingName).trim();

    return value || null;
}

function normalizeGrade(grade) {
    if (
        grade === undefined ||
        grade === null
    ) {
        return null;
    }

    const value =
        String(grade).trim();

    return value || null;
}

function normalizeRemark(remark) {
    if (
        remark === undefined ||
        remark === null
    ) {
        return null;
    }

    const value =
        String(remark).trim();

    return value || null;
}

function normalizeGradePoint(gradePoint) {
    if (
        gradePoint === undefined ||
        gradePoint === null ||
        gradePoint === ""
    ) {
        return null;
    }

    const value =
        Number(gradePoint);

    if (!Number.isFinite(value)) {
        throw new Error(
            "Grade point must be a valid number."
        );
    }

    return value;
}

/* ==========================================================================
   CREATE RESULT SETTING
   ========================================================================== */

async function createResultSetting({
    schoolId,
    settingName,
    minimumScore,
    maximumScore,
    grade,
    remark,
    gradePoint
}) {
    requireSchoolId(schoolId);

    const normalizedSettingName =
        normalizeSettingName(settingName);

    if (!normalizedSettingName) {
        throw new Error("Setting name is required.");
    }

    const {
        minimum,
        maximum
    } = validateScoreRange(
        minimumScore,
        maximumScore
    );

    const normalizedGrade =
        normalizeGrade(grade);

    const normalizedRemark =
        normalizeRemark(remark);

    const normalizedGradePoint =
        normalizeGradePoint(gradePoint);

    const sql = `
        INSERT INTO result_settings (
            school_id,
            setting_name,
            minimum_score,
            maximum_score,
            grade,
            remark,
            grade_point
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

    const values = [
        schoolId,
        normalizedSettingName,
        minimum,
        maximum,
        normalizedGrade,
        normalizedRemark,
        normalizedGradePoint
    ];

    try {
        const result =
            await query(sql, values);

        return result.rows[0] || null;
    } catch (error) {
        if (error.code === "23505") {
            const duplicateError =
                new Error(
                    "A result setting with the same school, setting name and score range already exists."
                );

            duplicateError.code =
                "RESULT_SETTING_DUPLICATE";

            throw duplicateError;
        }

        throw error;
    }
}

/* ==========================================================================
   GET RESULT SETTING BY ID
   ========================================================================== */

async function findResultSettingById(
    settingId,
    schoolId
) {
    requireSchoolId(schoolId);

    if (!settingId) {
        throw new Error(
            "Result setting ID is required."
        );
    }

    const sql = `
        SELECT
            id,
            school_id,
            setting_name,
            minimum_score,
            maximum_score,
            grade,
            remark,
            grade_point,
            created_at
        FROM result_settings
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
    `;

    const result =
        await query(sql, [
            settingId,
            schoolId
        ]);

    return result.rows[0] || null;
}

/* ==========================================================================
   GET ALL RESULT SETTINGS
   ========================================================================== */

async function findResultSettings(
    schoolId,
    filters = {}
) {
    requireSchoolId(schoolId);

    const {
        settingName = null,
        grade = null,
        minimumScore = null,
        maximumScore = null,
        limit = 100,
        offset = 0
    } = filters || {};

    const values = [schoolId];

    let sql = `
        SELECT
            id,
            school_id,
            setting_name,
            minimum_score,
            maximum_score,
            grade,
            remark,
            grade_point,
            created_at
        FROM result_settings
        WHERE school_id = $1
    `;

    if (settingName) {
        values.push(
            `%${String(settingName).trim()}%`
        );

        sql += `
            AND setting_name ILIKE $${values.length}
        `;
    }

    if (grade) {
        values.push(
            String(grade).trim()
        );

        sql += `
            AND grade = $${values.length}
        `;
    }

    if (
        minimumScore !== null &&
        minimumScore !== undefined &&
        minimumScore !== ""
    ) {
        const minimum =
            normalizeOptionalNumber(
                minimumScore
            );

        values.push(minimum);

        sql += `
            AND minimum_score >= $${values.length}
        `;
    }

    if (
        maximumScore !== null &&
        maximumScore !== undefined &&
        maximumScore !== ""
    ) {
        const maximum =
            normalizeOptionalNumber(
                maximumScore
            );

        values.push(maximum);

        sql += `
            AND maximum_score <= $${values.length}
        `;
    }

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 100,
                1
            ),
            100
        );

    const safeOffset =
        Math.max(
            Number(offset) || 0,
            0
        );

    values.push(safeLimit);

    sql += `
        ORDER BY
            minimum_score ASC NULLS FIRST,
            maximum_score ASC NULLS FIRST,
            setting_name ASC
        LIMIT $${values.length}
    `;

    values.push(safeOffset);

    sql += `
        OFFSET $${values.length}
    `;

    const result =
        await query(sql, values);

    return result.rows;
}

/* ==========================================================================
   GET GRADING SCALE
   ==========================================================================

   Returns all grading rules ordered from the lowest score range upward.

   ========================================================================== */

async function getGradingScale(schoolId) {
    requireSchoolId(schoolId);

    const sql = `
        SELECT
            id,
            school_id,
            setting_name,
            minimum_score,
            maximum_score,
            grade,
            remark,
            grade_point,
            created_at
        FROM result_settings
        WHERE school_id = $1
        ORDER BY
            minimum_score ASC NULLS FIRST,
            maximum_score ASC NULLS FIRST,
            setting_name ASC
    `;

    const result =
        await query(sql, [
            schoolId
        ]);

    return result.rows;
}

/* ==========================================================================
   FIND GRADING SETTING FOR A SCORE
   ==========================================================================

   Finds the grading rule whose score range contains the supplied score.

   Example:
   minimum_score = 70
   maximum_score = 100

   A score of 85 matches this rule.

   ========================================================================== */

async function findSettingForScore(
    schoolId,
    score
) {
    requireSchoolId(schoolId);

    const numericScore =
        Number(score);

    if (
        !Number.isFinite(numericScore)
    ) {
        throw new Error(
            "Score must be a valid number."
        );
    }

    if (
        numericScore < 0 ||
        numericScore > 100
    ) {
        throw new Error(
            "Score must be between 0 and 100."
        );
    }

    const sql = `
        SELECT
            id,
            school_id,
            setting_name,
            minimum_score,
            maximum_score,
            grade,
            remark,
            grade_point,
            created_at
        FROM result_settings
        WHERE school_id = $1
          AND (
                minimum_score IS NULL
                OR minimum_score <= $2
          )
          AND (
                maximum_score IS NULL
                OR maximum_score >= $2
          )
        ORDER BY
            minimum_score DESC NULLS LAST,
            maximum_score ASC NULLS LAST
        LIMIT 1
    `;

    const result =
        await query(sql, [
            schoolId,
            numericScore
        ]);

    return result.rows[0] || null;
}

/* ==========================================================================
   UPDATE RESULT SETTING
   ========================================================================== */

async function updateResultSetting(
    settingId,
    schoolId,
    updates = {}
) {
    requireSchoolId(schoolId);

    if (!settingId) {
        throw new Error(
            "Result setting ID is required."
        );
    }

    const values = [];
    const setParts = [];

    if (
        Object.prototype.hasOwnProperty.call(
            updates,
            "settingName"
        )
    ) {
        const value =
            normalizeSettingName(
                updates.settingName
            );

        if (!value) {
            throw new Error(
                "Setting name cannot be empty."
            );
        }

        values.push(value);

        setParts.push(
            `setting_name = $${values.length}`
        );
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updates,
            "minimumScore"
        ) ||
        Object.prototype.hasOwnProperty.call(
            updates,
            "maximumScore"
        )
    ) {
        const current =
            await findResultSettingById(
                settingId,
                schoolId
            );

        if (!current) {
            return null;
        }

        const minimum =
            Object.prototype.hasOwnProperty.call(
                updates,
                "minimumScore"
            )
                ? updates.minimumScore
                : current.minimum_score;

        const maximum =
            Object.prototype.hasOwnProperty.call(
                updates,
                "maximumScore"
            )
                ? updates.maximumScore
                : current.maximum_score;

        const validated =
            validateScoreRange(
                minimum,
                maximum
            );

        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "minimumScore"
            )
        ) {
            values.push(
                validated.minimum
            );

            setParts.push(
                `minimum_score = $${values.length}`
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(
                updates,
                "maximumScore"
            )
        ) {
            values.push(
                validated.maximum
            );

            setParts.push(
                `maximum_score = $${values.length}`
            );
        }
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updates,
            "grade"
        )
    ) {
        values.push(
            normalizeGrade(
                updates.grade
            )
        );

        setParts.push(
            `grade = $${values.length}`
        );
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updates,
            "remark"
        )
    ) {
        values.push(
            normalizeRemark(
                updates.remark
            )
        );

        setParts.push(
            `remark = $${values.length}`
        );
    }

    if (
        Object.prototype.hasOwnProperty.call(
            updates,
            "gradePoint"
        )
    ) {
        values.push(
            normalizeGradePoint(
                updates.gradePoint
            )
        );

        setParts.push(
            `grade_point = $${values.length}`
        );
    }

    if (setParts.length === 0) {
        return findResultSettingById(
            settingId,
            schoolId
        );
    }

    values.push(settingId);

    const settingIdPosition =
        values.length;

    values.push(schoolId);

    const schoolIdPosition =
        values.length;

    const sql = `
        UPDATE result_settings
        SET
            ${setParts.join(", ")}
        WHERE id = $${settingIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
    `;

    try {
        const result =
            await query(
                sql,
                values
            );

        return result.rows[0] || null;
    } catch (error) {
        if (error.code === "23505") {
            const duplicateError =
                new Error(
                    "A result setting with the same school, setting name and score range already exists."
                );

            duplicateError.code =
                "RESULT_SETTING_DUPLICATE";

            throw duplicateError;
        }

        throw error;
    }
}

/* ==========================================================================
   DELETE RESULT SETTING
   ========================================================================== */

async function deleteResultSetting(
    settingId,
    schoolId
) {
    requireSchoolId(schoolId);

    if (!settingId) {
        throw new Error(
            "Result setting ID is required."
        );
    }

    const sql = `
        DELETE FROM result_settings
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result =
        await query(sql, [
            settingId,
            schoolId
        ]);

    return result.rows[0] || null;
}

/* ==========================================================================
   COUNT RESULT SETTINGS
   ========================================================================== */

async function countResultSettings(
    schoolId
) {
    requireSchoolId(schoolId);

    const sql = `
        SELECT COUNT(*)::INTEGER AS setting_count
        FROM result_settings
        WHERE school_id = $1
    `;

    const result =
        await query(sql, [
            schoolId
        ]);

    return Number(
        result.rows[0]?.setting_count || 0
    );
}

/* ==========================================================================
   FIND SETTINGS BY GRADE
   ========================================================================== */

async function findSettingsByGrade(
    schoolId,
    grade
) {
    requireSchoolId(schoolId);

    const normalizedGrade =
        normalizeGrade(grade);

    if (!normalizedGrade) {
        return [];
    }

    const sql = `
        SELECT
            id,
            school_id,
            setting_name,
            minimum_score,
            maximum_score,
            grade,
            remark,
            grade_point,
            created_at
        FROM result_settings
        WHERE school_id = $1
          AND grade = $2
        ORDER BY
            minimum_score ASC NULLS FIRST,
            maximum_score ASC NULLS FIRST
    `;

    const result =
        await query(sql, [
            schoolId,
            normalizedGrade
        ]);

    return result.rows;
}

/* ==========================================================================
   COMPATIBILITY ALIASES
   ==========================================================================

   These aliases allow the Results controller/service layer to use clear,
   conventional method names without requiring another model rewrite.

   ========================================================================== */

const getResultSettings =
    findResultSettings;

const getResultSettingById =
    findResultSettingById;

const getSettingById =
    findResultSettingById;

const getSettingsByGrade =
    findSettingsByGrade;

const getSettingForScore =
    findSettingForScore;

/* ==========================================================================
   EXPORTS
   ========================================================================== */

module.exports = {
    createResultSetting,

    findResultSettingById,
    getResultSettingById,
    getSettingById,

    findResultSettings,
    getResultSettings,

    getGradingScale,

    findSettingForScore,
    getSettingForScore,

    updateResultSetting,

    deleteResultSetting,

    countResultSettings,

    findSettingsByGrade,
    getSettingsByGrade
};