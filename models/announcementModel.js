"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| ANNOUNCEMENT MODEL
|--------------------------------------------------------------------------
|
| Database table expected:
|
| announcements
|
| Expected columns:
|
| id
| school_id
| title
| content
| type
| priority
| audience
| is_published
| published_at
| start_date
| end_date
| created_by
| created_at
| updated_at
|
|--------------------------------------------------------------------------
*/

function validateRequired(value, fieldName) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        throw new Error(`${fieldName} is required`);
    }
}

function validateId(value, fieldName) {
    validateRequired(value, fieldName);

    const id = String(value).trim();

    if (!/^[0-9a-fA-F-]{8,}$/.test(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return id;
}

function normalizeBoolean(value, defaultValue = false) {
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

    if (
        value === "true" ||
        value === "1" ||
        value === 1
    ) {
        return true;
    }

    if (
        value === "false" ||
        value === "0" ||
        value === 0
    ) {
        return false;
    }

    return Boolean(value);
}

function normalizeDate(value) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    return String(value).trim();
}

function buildAnnouncementSelect() {
    return `
        SELECT
            a.id,
            a.school_id,
            a.title,
            a.content,
            a.type,
            a.priority,
            a.audience,
            a.is_published,
            a.published_at,
            a.start_date,
            a.end_date,
            a.created_by,
            a.created_at,
            a.updated_at,
            CONCAT_WS(
                ' ',
                s.first_name,
                s.last_name
            ) AS created_by_name
        FROM announcements a
        LEFT JOIN staff s
            ON s.id = a.created_by
    `;
}

/*
|--------------------------------------------------------------------------
| CREATE ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

async function createAnnouncement(data = {}) {
    validateId(data.schoolId, "schoolId");
    validateRequired(data.title, "title");
    validateRequired(data.content, "content");

    const schoolId = String(data.schoolId).trim();
    const title = String(data.title).trim();
    const content = String(data.content).trim();

    const type = data.type
        ? String(data.type).trim()
        : "General";

    const priority = data.priority
        ? String(data.priority).trim()
        : "Normal";

    const audience = data.audience
        ? String(data.audience).trim()
        : "All";

    const isPublished = normalizeBoolean(
        data.isPublished,
        false
    );

    const publishedAt = isPublished
        ? normalizeDate(data.publishedAt) ||
          new Date().toISOString()
        : null;

    const startDate = normalizeDate(data.startDate);
    const endDate = normalizeDate(data.endDate);

    const createdBy = data.createdBy
        ? validateId(data.createdBy, "createdBy")
        : null;

    const sql = `
        INSERT INTO announcements (
            school_id,
            title,
            content,
            type,
            priority,
            audience,
            is_published,
            published_at,
            start_date,
            end_date,
            created_by
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
            $11
        )
        RETURNING *
    `;

    const result = await query(sql, [
        schoolId,
        title,
        content,
        type,
        priority,
        audience,
        isPublished,
        publishedAt,
        startDate,
        endDate,
        createdBy
    ]);

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| GET ANNOUNCEMENT BY ID
|--------------------------------------------------------------------------
*/

async function getAnnouncementById(
    announcementId,
    schoolId
) {
    const id = validateId(
        announcementId,
        "announcementId"
    );

    const school = validateId(
        schoolId,
        "schoolId"
    );

    const sql = `
        ${buildAnnouncementSelect()}
        WHERE a.id = $1
          AND a.school_id = $2
        LIMIT 1
    `;

    const result = await query(sql, [
        id,
        school
    ]);

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| GET ANNOUNCEMENTS
|--------------------------------------------------------------------------
*/

async function getAnnouncements(
    schoolId,
    filters = {}
) {
    const school = validateId(
        schoolId,
        "schoolId"
    );

    const values = [school];
    const conditions = [
        "a.school_id = $1"
    ];

    if (filters.type) {
        values.push(
            String(filters.type).trim()
        );

        conditions.push(
            `a.type = $${values.length}`
        );
    }

    if (filters.priority) {
        values.push(
            String(filters.priority).trim()
        );

        conditions.push(
            `a.priority = $${values.length}`
        );
    }

    if (filters.audience) {
        values.push(
            String(filters.audience).trim()
        );

        conditions.push(
            `a.audience = $${values.length}`
        );
    }

    if (
        filters.isPublished !== undefined &&
        filters.isPublished !== null &&
        filters.isPublished !== ""
    ) {
        values.push(
            normalizeBoolean(
                filters.isPublished
            )
        );

        conditions.push(
            `a.is_published = $${values.length}`
        );
    }

    if (filters.search) {
        values.push(
            `%${String(filters.search).trim()}%`
        );

        conditions.push(`
            (
                a.title ILIKE $${values.length}
                OR a.content ILIKE $${values.length}
            )
        `);
    }

    if (filters.fromDate) {
        values.push(
            String(filters.fromDate).trim()
        );

        conditions.push(
            `a.start_date >= $${values.length}`
        );
    }

    if (filters.toDate) {
        values.push(
            String(filters.toDate).trim()
        );

        conditions.push(
            `a.end_date <= $${values.length}`
        );
    }

    const limit = Math.min(
        Math.max(
            parseInt(filters.limit, 10) || 50,
            1
        ),
        200
    );

    const offset = Math.max(
        parseInt(filters.offset, 10) || 0,
        0
    );

    values.push(limit);

    const limitPlaceholder =
        `$${values.length}`;

    values.push(offset);

    const offsetPlaceholder =
        `$${values.length}`;

    const sql = `
        ${buildAnnouncementSelect()}
        WHERE ${conditions.join(" AND ")}
        ORDER BY
            a.is_published DESC,
            a.priority DESC,
            COALESCE(
                a.published_at,
                a.created_at
            ) DESC
        LIMIT ${limitPlaceholder}
        OFFSET ${offsetPlaceholder}
    `;

    const result = await query(sql, values);

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| GET PUBLISHED ANNOUNCEMENTS
|--------------------------------------------------------------------------
*/

async function getPublishedAnnouncements(
    schoolId,
    filters = {}
) {
    return getAnnouncements(
        schoolId,
        {
            ...filters,
            isPublished: true
        }
    );
}

/*
|--------------------------------------------------------------------------
| UPDATE ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

async function updateAnnouncement(
    announcementId,
    schoolId,
    data = {}
) {
    const id = validateId(
        announcementId,
        "announcementId"
    );

    const school = validateId(
        schoolId,
        "schoolId"
    );

    const allowedFields = {
        title: "title",
        content: "content",
        type: "type",
        priority: "priority",
        audience: "audience",
        isPublished: "is_published",
        publishedAt: "published_at",
        startDate: "start_date",
        endDate: "end_date",
        createdBy: "created_by"
    };

    const updates = [];
    const values = [];

    for (
        const [inputField, databaseField]
        of Object.entries(allowedFields)
    ) {
        if (data[inputField] === undefined) {
            continue;
        }

        let value = data[inputField];

        if (inputField === "isPublished") {
            value = normalizeBoolean(value);
        }

        if (
            inputField === "publishedAt" ||
            inputField === "startDate" ||
            inputField === "endDate"
        ) {
            value = normalizeDate(value);
        }

        if (
            inputField === "createdBy" &&
            value
        ) {
            value = validateId(
                value,
                "createdBy"
            );
        }

        if (
            inputField === "title" ||
            inputField === "content" ||
            inputField === "type" ||
            inputField === "priority" ||
            inputField === "audience"
        ) {
            value = String(value).trim();
        }

        values.push(value);

        updates.push(
            `${databaseField} = $${values.length}`
        );
    }

    if (updates.length === 0) {
        throw new Error(
            "No announcement fields were provided for update"
        );
    }

    if (
        data.isPublished !== undefined &&
        normalizeBoolean(data.isPublished) === true &&
        data.publishedAt === undefined
    ) {
        values.push(
            new Date().toISOString()
        );

        updates.push(
            `published_at = $${values.length}`
        );
    }

    values.push(id);

    const idPlaceholder =
        `$${values.length}`;

    values.push(school);

    const schoolPlaceholder =
        `$${values.length}`;

    const sql = `
        UPDATE announcements
        SET
            ${updates.join(", ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${idPlaceholder}
          AND school_id = ${schoolPlaceholder}
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
| PUBLISH ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

async function publishAnnouncement(
    announcementId,
    schoolId
) {
    const id = validateId(
        announcementId,
        "announcementId"
    );

    const school = validateId(
        schoolId,
        "schoolId"
    );

    const sql = `
        UPDATE announcements
        SET
            is_published = TRUE,
            published_at = COALESCE(
                published_at,
                CURRENT_TIMESTAMP
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(
        sql,
        [id, school]
    );

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| UNPUBLISH ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

async function unpublishAnnouncement(
    announcementId,
    schoolId
) {
    const id = validateId(
        announcementId,
        "announcementId"
    );

    const school = validateId(
        schoolId,
        "schoolId"
    );

    const sql = `
        UPDATE announcements
        SET
            is_published = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(
        sql,
        [id, school]
    );

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| DELETE ANNOUNCEMENT
|--------------------------------------------------------------------------
*/

async function deleteAnnouncement(
    announcementId,
    schoolId
) {
    const id = validateId(
        announcementId,
        "announcementId"
    );

    const school = validateId(
        schoolId,
        "schoolId"
    );

    const sql = `
        DELETE FROM announcements
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(
        sql,
        [id, school]
    );

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| COUNT ANNOUNCEMENTS
|--------------------------------------------------------------------------
*/

async function countAnnouncements(
    schoolId,
    filters = {}
) {
    const school = validateId(
        schoolId,
        "schoolId"
    );

    const values = [school];
    const conditions = [
        "school_id = $1"
    ];

    if (
        filters.isPublished !== undefined &&
        filters.isPublished !== null
    ) {
        values.push(
            normalizeBoolean(
                filters.isPublished
            )
        );

        conditions.push(
            `is_published = $${values.length}`
        );
    }

    if (filters.type) {
        values.push(
            String(filters.type).trim()
        );

        conditions.push(
            `type = $${values.length}`
        );
    }

    const sql = `
        SELECT COUNT(*)::INTEGER AS count
        FROM announcements
        WHERE ${conditions.join(" AND ")}
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows[0]?.count || 0;
}

/*
|--------------------------------------------------------------------------
| COMPATIBILITY ALIASES
|--------------------------------------------------------------------------
*/

const getAllAnnouncements =
    getAnnouncements;

const getAnnouncement =
    getAnnouncementById;

const createAnnouncementRecord =
    createAnnouncement;

const updateAnnouncementRecord =
    updateAnnouncement;

const deleteAnnouncementRecord =
    deleteAnnouncement;

/*
|--------------------------------------------------------------------------
| BULK CREATE
|--------------------------------------------------------------------------
*/

async function createBulkAnnouncements(
    announcements = []
) {
    if (
        !Array.isArray(announcements) ||
        announcements.length === 0
    ) {
        throw new Error(
            "announcements must be a non-empty array"
        );
    }

    const createdAnnouncements = [];

    for (
        const announcement of announcements
    ) {
        const created =
            await createAnnouncement(
                announcement
            );

        createdAnnouncements.push(created);
    }

    return createdAnnouncements;
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
    createAnnouncement,
    createBulkAnnouncements,

    getAnnouncementById,
    getAnnouncement,

    getAnnouncements,
    getAllAnnouncements,
    getPublishedAnnouncements,

    updateAnnouncement,
    updateAnnouncementRecord,

    publishAnnouncement,
    unpublishAnnouncement,

    deleteAnnouncement,
    deleteAnnouncementRecord,

    countAnnouncements,

    createAnnouncementRecord
};