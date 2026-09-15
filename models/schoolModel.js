"use strict";

const { query } = require("../config/database");

function normalizeText(value) {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value !== "string") {
        return String(value).trim();
    }

    const trimmed = value.trim();

    return trimmed || null;
}

function validateSchoolId(schoolId) {
    if (
        schoolId === undefined ||
        schoolId === null ||
        schoolId === "" ||
        Number.isNaN(Number(schoolId))
    ) {
        const error = new Error(
            "Valid school ID is required."
        );

        error.statusCode = 400;

        throw error;
    }

    return Number(schoolId);
}

function validateSchoolCode(schoolCode) {
    const normalized =
        normalizeText(schoolCode);

    if (!normalized) {
        const error = new Error(
            "School code is required."
        );

        error.statusCode = 400;

        throw error;
    }

    if (normalized.length > 50) {
        const error = new Error(
            "School code must not exceed 50 characters."
        );

        error.statusCode = 400;

        throw error;
    }

    return normalized.toUpperCase();
}

function validateSchoolName(schoolName) {
    const normalized =
        normalizeText(schoolName);

    if (!normalized) {
        const error = new Error(
            "School name is required."
        );

        error.statusCode = 400;

        throw error;
    }

    if (normalized.length > 255) {
        const error = new Error(
            "School name must not exceed 255 characters."
        );

        error.statusCode = 400;

        throw error;
    }

    return normalized;
}

async function createSchool({
    schoolCode,
    schoolName,
    registrationNumber = null,
    address = null,
    city = null,
    state = null,
    country = "Nigeria",
    phone = null,
    email = null,
    website = null,
    logoUrl = null,
    motto = null,
    principalName = null,
    schoolType = "Secondary School",
    status = "Active"
}) {
    const normalizedSchoolCode =
        validateSchoolCode(schoolCode);

    const normalizedSchoolName =
        validateSchoolName(schoolName);

    const existingSchool =
        await findSchoolByCode(
            normalizedSchoolCode
        );

    if (existingSchool) {
        const error = new Error(
            "School code already exists."
        );

        error.statusCode = 409;

        throw error;
    }

    const sql = `
        INSERT INTO schools (
            school_code,
            school_name,
            registration_number,
            address,
            city,
            state,
            country,
            phone,
            email,
            website,
            logo_url,
            motto,
            principal_name,
            school_type,
            status
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
            $10,
            $11,
            $12,
            $13,
            $14,
            $15
        )
        RETURNING *
    `;

    const values = [
        normalizedSchoolCode,
        normalizedSchoolName,
        normalizeText(registrationNumber),
        normalizeText(address),
        normalizeText(city),
        normalizeText(state),
        normalizeText(country) || "Nigeria",
        normalizeText(phone),
        normalizeText(email),
        normalizeText(website),
        normalizeText(logoUrl),
        normalizeText(motto),
        normalizeText(principalName),
        normalizeText(schoolType) || "Secondary School",
        normalizeText(status) || "Active"
    ];

    const result =
        await query(
            sql,
            values
        );

    return result.rows[0] || null;
}

async function findSchoolById(
    schoolId
) {
    const id =
        validateSchoolId(schoolId);

    const sql = `
        SELECT *
        FROM schools
        WHERE id = $1
        LIMIT 1
    `;

    const result =
        await query(
            sql,
            [id]
        );

    return result.rows[0] || null;
}

async function findSchoolByCode(
    schoolCode
) {
    const normalizedSchoolCode =
        validateSchoolCode(schoolCode);

    const sql = `
        SELECT *
        FROM schools
        WHERE school_code = $1
        LIMIT 1
    `;

    const result =
        await query(
            sql,
            [normalizedSchoolCode]
        );

    return result.rows[0] || null;
}

async function findSchools({
    status = null,
    state = null,
    schoolType = null,
    limit = 100,
    offset = 0
} = {}) {
    let sql = `
        SELECT *
        FROM schools
        WHERE 1 = 1
    `;

    const values = [];

    const normalizedStatus =
        normalizeText(status);

    const normalizedState =
        normalizeText(state);

    const normalizedSchoolType =
        normalizeText(schoolType);

    if (normalizedStatus) {
        values.push(
            normalizedStatus
        );

        sql += `
            AND status = $${values.length}
        `;
    }

    if (normalizedState) {
        values.push(
            normalizedState
        );

        sql += `
            AND state = $${values.length}
        `;
    }

    if (normalizedSchoolType) {
        values.push(
            normalizedSchoolType
        );

        sql += `
            AND school_type = $${values.length}
        `;
    }

    const parsedLimit =
        Number(limit);

    const parsedOffset =
        Number(offset);

    const safeLimit =
        Number.isFinite(parsedLimit)
            ? Math.min(
                Math.max(
                    Math.trunc(parsedLimit),
                    1
                ),
                100
            )
            : 100;

    const safeOffset =
        Number.isFinite(parsedOffset)
            ? Math.max(
                Math.trunc(parsedOffset),
                0
            )
            : 0;

    values.push(
        safeLimit
    );

    sql += `
        ORDER BY school_name ASC
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

async function searchSchools(
    searchTerm
) {
    const normalizedSearchTerm =
        normalizeText(searchTerm);

    if (!normalizedSearchTerm) {
        return [];
    }

    const searchValue =
        `%${normalizedSearchTerm}%`;

    const sql = `
        SELECT *
        FROM schools
        WHERE
            school_code ILIKE $1
            OR school_name ILIKE $1
            OR registration_number ILIKE $1
            OR address ILIKE $1
            OR city ILIKE $1
            OR state ILIKE $1
            OR phone ILIKE $1
            OR email ILIKE $1
            OR principal_name ILIKE $1
        ORDER BY school_name ASC
        LIMIT 100
    `;

    const result =
        await query(
            sql,
            [searchValue]
        );

    return result.rows;
}

async function updateSchool(
    schoolId,
    data = {}
) {
    const id =
        validateSchoolId(schoolId);

    const allowedFields = {
        schoolCode: "school_code",
        schoolName: "school_name",
        registrationNumber: "registration_number",
        address: "address",
        city: "city",
        state: "state",
        country: "country",
        phone: "phone",
        email: "email",
        website: "website",
        logoUrl: "logo_url",
        motto: "motto",
        principalName: "principal_name",
        schoolType: "school_type",
        status: "status"
    };

    const updates = [];
    const values = [];

    for (
        const key of Object.keys(
            data || {}
        )
    ) {
        if (
            !allowedFields[key] ||
            data[key] === undefined
        ) {
            continue;
        }

        let value =
            normalizeText(
                data[key]
            );

        if (key === "schoolCode") {
            value =
                validateSchoolCode(
                    data[key]
                );
        }

        if (key === "schoolName") {
            value =
                validateSchoolName(
                    data[key]
                );
        }

        values.push(value);

        updates.push(
            `${allowedFields[key]} = $${values.length}`
        );
    }

    if (!updates.length) {
        const error = new Error(
            "No valid fields supplied for update."
        );

        error.statusCode = 400;

        throw error;
    }

    if (
        data.schoolCode !== undefined
    ) {
        const existingSchool =
            await findSchoolByCode(
                data.schoolCode
            );

        if (
            existingSchool &&
            Number(existingSchool.id) !== id
        ) {
            const error = new Error(
                "School code already exists."
            );

            error.statusCode = 409;

            throw error;
        }
    }

    values.push(id);

    const schoolIdPosition =
        values.length;

    const sql = `
        UPDATE schools
        SET
            ${updates.join(", ")},
            updated_at = NOW()
        WHERE id = $${schoolIdPosition}
        RETURNING *
    `;

    const result =
        await query(
            sql,
            values
        );

    return result.rows[0] || null;
}

async function deleteSchool(
    schoolId
) {
    const id =
        validateSchoolId(schoolId);

    const sql = `
        DELETE FROM schools
        WHERE id = $1
        RETURNING *
    `;

    const result =
        await query(
            sql,
            [id]
        );

    return result.rows[0] || null;
}

async function countSchools(
    status = null
) {
    let sql = `
        SELECT COUNT(*) AS school_count
        FROM schools
    `;

    const values = [];

    const normalizedStatus =
        normalizeText(status);

    if (normalizedStatus) {
        values.push(
            normalizedStatus
        );

        sql += `
            WHERE status = $1
        `;
    }

    const result =
        await query(
            sql,
            values
        );

    return Number(
        result.rows[0]?.school_count || 0
    );
}

async function schoolCodeExists(
    schoolCode,
    excludeSchoolId = null
) {
    const normalizedSchoolCode =
        validateSchoolCode(schoolCode);

    let sql = `
        SELECT EXISTS (
            SELECT 1
            FROM schools
            WHERE school_code = $1
    `;

    const values = [
        normalizedSchoolCode
    ];

    if (
        excludeSchoolId !== null &&
        excludeSchoolId !== undefined &&
        excludeSchoolId !== ""
    ) {
        const id =
            validateSchoolId(
                excludeSchoolId
            );

        values.push(id);

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

async function getSchoolStatistics(
    schoolId
) {
    const id =
        validateSchoolId(schoolId);

    const sql = `
        SELECT
            (
                SELECT COUNT(*)
                FROM students
                WHERE school_id = $1
            )::INTEGER AS total_students,
            (
                SELECT COUNT(*)
                FROM staff
                WHERE school_id = $1
            )::INTEGER AS total_staff,
            (
                SELECT COUNT(*)
                FROM classes
                WHERE school_id = $1
            )::INTEGER AS total_classes,
            (
                SELECT COUNT(*)
                FROM subjects
                WHERE school_id = $1
            )::INTEGER AS total_subjects,
            (
                SELECT COUNT(*)
                FROM users
                WHERE school_id = $1
            )::INTEGER AS total_users
    `;

    const result =
        await query(
            sql,
            [id]
        );

    const row =
        result.rows[0] || {};

    return {
        totalStudents:
            Number(
                row.total_students || 0
            ),
        totalStaff:
            Number(
                row.total_staff || 0
            ),
        totalClasses:
            Number(
                row.total_classes || 0
            ),
        totalSubjects:
            Number(
                row.total_subjects || 0
            ),
        totalUsers:
            Number(
                row.total_users || 0
            )
    };
}

async function getSchoolDashboard(
    schoolId
) {
    const id =
        validateSchoolId(schoolId);

    const sql = `
        SELECT
            (
                SELECT COUNT(*)
                FROM students
                WHERE school_id = $1
                AND status = 'Active'
            )::INTEGER AS active_students,
            (
                SELECT COUNT(*)
                FROM staff
                WHERE school_id = $1
                AND status = 'Active'
            )::INTEGER AS active_staff,
            (
                SELECT COUNT(*)
                FROM classes
                WHERE school_id = $1
                AND status = 'Active'
            )::INTEGER AS active_classes,
            (
                SELECT COUNT(*)
                FROM subjects
                WHERE school_id = $1
                AND is_active = TRUE
            )::INTEGER AS active_subjects,
            (
                SELECT COALESCE(
                    SUM(amount),
                    0
                )
                FROM payments
                WHERE school_id = $1
            ) AS total_payments
    `;

    const result =
        await query(
            sql,
            [id]
        );

    const row =
        result.rows[0] || {};

    return {
        activeStudents:
            Number(
                row.active_students || 0
            ),
        activeStaff:
            Number(
                row.active_staff || 0
            ),
        activeClasses:
            Number(
                row.active_classes || 0
            ),
        activeSubjects:
            Number(
                row.active_subjects || 0
            ),
        totalPayments:
            Number(
                row.total_payments || 0
            )
    };
}

module.exports = {
    createSchool,
    findSchoolById,
    findSchoolByCode,
    findSchools,
    searchSchools,
    updateSchool,
    deleteSchool,
    countSchools,
    schoolCodeExists,
    getSchoolStatistics,
    getSchoolDashboard
};