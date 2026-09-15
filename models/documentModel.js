"use strict";

const { query } = require("../config/database");

function requireValue(value, message) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        throw new Error(message);
    }

    return String(value).trim();
}

function validatePositiveInteger(value, fallback) {
    const number = Number(value);

    if (!Number.isInteger(number) || number < 0) {
        return fallback;
    }

    return number;
}

function validateLimit(value) {
    const limit = Number(value);

    if (!Number.isInteger(limit) || limit <= 0) {
        return 100;
    }

    return Math.min(limit, 500);
}

function validateOffset(value) {
    const offset = Number(value);

    if (!Number.isInteger(offset) || offset < 0) {
        return 0;
    }

    return offset;
}

function cleanOptionalString(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const cleaned = String(value).trim();

    return cleaned || null;
}

/*
|--------------------------------------------------------------------------
| Create Student Document
|--------------------------------------------------------------------------
*/

async function createDocument({
    schoolId,
    studentId,
    documentType = null,
    documentName,
    fileUrl,
    fileSize = null,
    mimeType = null,
    uploadedBy = null
}) {
    schoolId = requireValue(
        schoolId,
        "School ID is required."
    );

    studentId = requireValue(
        studentId,
        "Student ID is required."
    );

    documentName = requireValue(
        documentName,
        "Document name is required."
    );

    fileUrl = requireValue(
        fileUrl,
        "Document file URL is required."
    );

    const sql = `
        INSERT INTO student_documents (
            student_id,
            school_id,
            document_name,
            document_type,
            file_url,
            file_size,
            mime_type,
            uploaded_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;

    const result = await query(sql, [
        studentId,
        schoolId,
        documentName,
        cleanOptionalString(documentType),
        fileUrl,
        fileSize,
        cleanOptionalString(mimeType),
        cleanOptionalString(uploadedBy)
    ]);

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Find Document By ID
|--------------------------------------------------------------------------
*/

async function findDocumentById(
    documentId,
    schoolId = null
) {
    documentId = requireValue(
        documentId,
        "Document ID is required."
    );

    let sql = `
        SELECT
            d.*,
            s.student_number,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name
        FROM student_documents d
        INNER JOIN students s
            ON s.id = d.student_id
        WHERE d.id = $1
    `;

    const values = [documentId];

    if (schoolId) {
        schoolId = requireValue(
            schoolId,
            "School ID is required."
        );

        values.push(schoolId);

        sql += `
            AND d.school_id = $${values.length}
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
| Find Student Documents
|--------------------------------------------------------------------------
*/

async function findStudentDocuments({
    schoolId,
    studentId,
    documentType = null
}) {
    schoolId = requireValue(
        schoolId,
        "School ID is required."
    );

    studentId = requireValue(
        studentId,
        "Student ID is required."
    );

    let sql = `
        SELECT
            d.*,
            s.student_number,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name
        FROM student_documents d
        INNER JOIN students s
            ON s.id = d.student_id
        WHERE d.school_id = $1
          AND d.student_id = $2
    `;

    const values = [
        schoolId,
        studentId
    ];

    if (documentType) {
        values.push(
            String(documentType).trim()
        );

        sql += `
            AND LOWER(d.document_type) =
                LOWER($${values.length})
        `;
    }

    sql += `
        ORDER BY d.created_at DESC
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Find School Documents
|--------------------------------------------------------------------------
*/

async function findSchoolDocuments(
    schoolId,
    {
        documentType = null,
        limit = 100,
        offset = 0
    } = {}
) {
    schoolId = requireValue(
        schoolId,
        "School ID is required."
    );

    limit = validateLimit(limit);
    offset = validateOffset(offset);

    let sql = `
        SELECT
            d.*,
            s.student_number,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name
        FROM student_documents d
        INNER JOIN students s
            ON s.id = d.student_id
        WHERE d.school_id = $1
    `;

    const values = [schoolId];

    if (documentType) {
        values.push(
            String(documentType).trim()
        );

        sql += `
            AND LOWER(d.document_type) =
                LOWER($${values.length})
        `;
    }

    values.push(limit);

    sql += `
        ORDER BY d.created_at DESC
        LIMIT $${values.length}
    `;

    values.push(offset);

    sql += `
        OFFSET $${values.length}
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Update Document
|--------------------------------------------------------------------------
*/

async function updateDocument(
    documentId,
    schoolId,
    data
) {
    documentId = requireValue(
        documentId,
        "Document ID is required."
    );

    schoolId = requireValue(
        schoolId,
        "School ID is required."
    );

    if (
        !data ||
        typeof data !== "object"
    ) {
        throw new Error(
            "Document update data is required."
        );
    }

    const allowedFields = {
        documentName: "document_name",
        documentType: "document_type",
        fileUrl: "file_url",
        fileSize: "file_size",
        mimeType: "mime_type"
    };

    const updates = [];
    const values = [];

    for (const key of Object.keys(data)) {
        if (
            !allowedFields[key] ||
            data[key] === undefined
        ) {
            continue;
        }

        let value = data[key];

        if (
            key === "documentName" ||
            key === "documentType" ||
            key === "fileUrl" ||
            key === "mimeType"
        ) {
            value = cleanOptionalString(value);
        }

        if (
            key === "documentName" &&
            !value
        ) {
            throw new Error(
                "Document name cannot be empty."
            );
        }

        if (
            key === "fileUrl" &&
            !value
        ) {
            throw new Error(
                "Document file URL cannot be empty."
            );
        }

        values.push(value);

        updates.push(
            `${allowedFields[key]} = $${values.length}`
        );
    }

    if (updates.length === 0) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }

    values.push(documentId);

    const documentIdPosition =
        values.length;

    values.push(schoolId);

    const schoolIdPosition =
        values.length;

    const sql = `
        UPDATE student_documents
        SET
            ${updates.join(", ")}
        WHERE id = $${documentIdPosition}
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
| Delete Document
|--------------------------------------------------------------------------
*/

async function deleteDocument(
    documentId,
    schoolId
) {
    documentId = requireValue(
        documentId,
        "Document ID is required."
    );

    schoolId = requireValue(
        schoolId,
        "School ID is required."
    );

    const sql = `
        DELETE FROM student_documents
        WHERE id = $1
          AND school_id = $2
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            documentId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Search Documents
|--------------------------------------------------------------------------
*/

async function searchDocuments(
    searchTerm,
    schoolId
) {
    schoolId = requireValue(
        schoolId,
        "School ID is required."
    );

    const term =
        String(searchTerm || "").trim();

    if (!term) {
        return findSchoolDocuments(
            schoolId
        );
    }

    const sql = `
        SELECT
            d.*,
            s.student_number,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name
        FROM student_documents d
        INNER JOIN students s
            ON s.id = d.student_id
        WHERE d.school_id = $1
          AND (
              d.document_name ILIKE $2
              OR d.document_type ILIKE $2
              OR s.student_number ILIKE $2
              OR s.admission_number ILIKE $2
              OR s.first_name ILIKE $2
              OR s.middle_name ILIKE $2
              OR s.last_name ILIKE $2
          )
        ORDER BY d.created_at DESC
        LIMIT 100
    `;

    const result = await query(
        sql,
        [
            schoolId,
            `%${term}%`
        ]
    );

    return result.rows;
}

/*
|--------------------------------------------------------------------------
| Count Student Documents
|--------------------------------------------------------------------------
*/

async function countStudentDocuments(
    studentId,
    schoolId
) {
    studentId = requireValue(
        studentId,
        "Student ID is required."
    );

    schoolId = requireValue(
        schoolId,
        "School ID is required."
    );

    const sql = `
        SELECT
            COUNT(*) AS document_count
        FROM student_documents
        WHERE student_id = $1
          AND school_id = $2
    `;

    const result = await query(
        sql,
        [
            studentId,
            schoolId
        ]
    );

    return Number(
        result.rows[0].document_count
    );
}

/*
|--------------------------------------------------------------------------
| Count School Documents
|--------------------------------------------------------------------------
*/

async function countSchoolDocuments(
    schoolId,
    documentType = null
) {
    schoolId = requireValue(
        schoolId,
        "School ID is required."
    );

    let sql = `
        SELECT
            COUNT(*) AS document_count
        FROM student_documents
        WHERE school_id = $1
    `;

    const values = [schoolId];

    if (documentType) {
        values.push(
            String(documentType).trim()
        );

        sql += `
            AND LOWER(document_type) =
                LOWER($${values.length})
        `;
    }

    const result = await query(
        sql,
        values
    );

    return Number(
        result.rows[0].document_count
    );
}

/*
|--------------------------------------------------------------------------
| Get Document Types
|--------------------------------------------------------------------------
*/

async function getDocumentTypes(
    schoolId
) {
    schoolId = requireValue(
        schoolId,
        "School ID is required."
    );

    const sql = `
        SELECT DISTINCT
            document_type
        FROM student_documents
        WHERE school_id = $1
          AND document_type IS NOT NULL
          AND TRIM(document_type) <> ''
        ORDER BY document_type ASC
    `;

    const result = await query(
        sql,
        [schoolId]
    );

    return result.rows.map(
        row => row.document_type
    );
}

/*
|--------------------------------------------------------------------------
| Get Student Document Summary
|--------------------------------------------------------------------------
*/

async function getStudentDocumentSummary(
    studentId,
    schoolId
) {
    studentId = requireValue(
        studentId,
        "Student ID is required."
    );

    schoolId = requireValue(
        schoolId,
        "School ID is required."
    );

    const sql = `
        SELECT
            COUNT(*)::INTEGER AS total_documents,

            COUNT(
                CASE
                    WHEN LOWER(mime_type) =
                        'application/pdf'
                    THEN 1
                END
            )::INTEGER AS pdf_documents,

            COUNT(
                CASE
                    WHEN mime_type ILIKE 'image/%'
                    THEN 1
                END
            )::INTEGER AS image_documents

        FROM student_documents
        WHERE student_id = $1
          AND school_id = $2
    `;

    const result = await query(
        sql,
        [
            studentId,
            schoolId
        ]
    );

    return result.rows[0];
}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    createDocument,
    findDocumentById,
    findStudentDocuments,
    findSchoolDocuments,
    updateDocument,
    deleteDocument,
    searchDocuments,
    countStudentDocuments,
    countSchoolDocuments,
    getDocumentTypes,
    getStudentDocumentSummary
};