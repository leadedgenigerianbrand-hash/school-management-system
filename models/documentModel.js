const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Document Model
|--------------------------------------------------------------------------
|
| Handles student document records.
|
| Examples:
| - Birth certificate
| - Passport photograph
| - Previous school result
| - Transfer certificate
| - Medical record
| - Identification document
| - Other student documents
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Student Document
|--------------------------------------------------------------------------
*/

async function createDocument({
    schoolId,
    studentId,
    documentType,
    documentName,
    filePath,
    fileUrl = null,
    fileSize = null,
    mimeType = null,
    description = null,
    uploadedBy = null
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!documentType || !documentType.trim()) {
        throw new Error("Document type is required.");
    }

    if (!documentName || !documentName.trim()) {
        throw new Error("Document name is required.");
    }

    if (!filePath && !fileUrl) {
        throw new Error(
            "A document file path or URL is required."
        );
    }


    const sql = `
        INSERT INTO student_documents (
            school_id,
            student_id,
            document_type,
            document_name,
            file_path,
            file_url,
            file_size,
            mime_type,
            description,
            uploaded_by
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


    const result = await query(
        sql,
        [
            schoolId,
            studentId,
            documentType.trim(),
            documentName.trim(),
            filePath,
            fileUrl,
            fileSize,
            mimeType,
            description,
            uploadedBy
        ]
    );


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

    let sql = `
        SELECT

            d.*,

            s.admission_number,

            s.first_name,

            s.middle_name,

            s.last_name

        FROM student_documents d

        INNER JOIN students s
            ON s.id = d.student_id

        WHERE d.id = $1
    `;


    const values = [
        documentId
    ];


    if (schoolId) {

        sql += `
            AND d.school_id = $2
        `;

        values.push(
            schoolId
        );
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

    let sql = `
        SELECT

            d.*,

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

        values.push(documentType);

        sql += `
            AND d.document_type = $${values.length}
        `;
    }


    sql += `
        ORDER BY

            d.created_at DESC
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

    let sql = `
        SELECT

            d.*,

            s.admission_number,

            s.first_name,

            s.middle_name,

            s.last_name

        FROM student_documents d

        INNER JOIN students s
            ON s.id = d.student_id

        WHERE d.school_id = $1
    `;


    const values = [
        schoolId
    ];


    if (documentType) {

        values.push(documentType);

        sql += `
            AND d.document_type = $${values.length}
        `;
    }


    values.push(limit);

    sql += `
        ORDER BY

            d.created_at DESC

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
    {
        documentType,
        documentName,
        filePath = null,
        fileUrl = null,
        fileSize = null,
        mimeType = null,
        description = null
    }
) {

    const existing =
        await findDocumentById(
            documentId,
            schoolId
        );


    if (!existing) {
        return null;
    }


    const sql = `
        UPDATE student_documents

        SET

            document_type = $1,

            document_name = $2,

            file_path = COALESCE(
                $3,
                file_path
            ),

            file_url = COALESCE(
                $4,
                file_url
            ),

            file_size = COALESCE(
                $5,
                file_size
            ),

            mime_type = COALESCE(
                $6,
                mime_type
            ),

            description = $7,

            updated_at = NOW()

        WHERE id = $8

          AND school_id = $9

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            documentType,
            documentName,
            filePath,
            fileUrl,
            fileSize,
            mimeType,
            description,
            documentId,
            schoolId
        ]
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

    const sql = `
        SELECT

            d.*,

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

              OR d.description ILIKE $2

              OR s.admission_number ILIKE $2

              OR s.first_name ILIKE $2

              OR s.last_name ILIKE $2

          )

        ORDER BY

            d.created_at DESC
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
| Count Student Documents
|--------------------------------------------------------------------------
*/

async function countStudentDocuments(
    studentId,
    schoolId
) {

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
| Get Document Types
|--------------------------------------------------------------------------
*/

async function getDocumentTypes(
    schoolId
) {

    const sql = `
        SELECT DISTINCT

            document_type

        FROM student_documents

        WHERE school_id = $1

          AND document_type IS NOT NULL

          AND document_type <> ''

        ORDER BY

            document_type ASC
    `;


    const result = await query(
        sql,
        [
            schoolId
        ]
    );


    return result.rows.map(
        row => row.document_type
    );
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

    getDocumentTypes

};