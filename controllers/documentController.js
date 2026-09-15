"use strict";

const {
    createDocument,
    findDocumentById,
    findStudentDocuments,
    findSchoolDocuments,
    updateDocument,
    deleteDocument,
    searchDocuments,
    countStudentDocuments,
    getDocumentTypes
} = require("../models/documentModel");

/*
|--------------------------------------------------------------------------
| DOCUMENT CONTROLLER
|--------------------------------------------------------------------------
|
| HTTP/API layer for student document management.
|
| Responsibilities:
| - Validate incoming requests
| - Obtain school ID from authenticated user
| - Call the document model
| - Return consistent JSON responses
| - Pass unexpected errors to error middleware
|
| Database table:
| student_documents
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Resolve School ID
|--------------------------------------------------------------------------
*/

function getSchoolId(req) {
    const schoolId =
        req.user &&
        req.user.schoolId;

    if (!schoolId) {
        const error =
            new Error(
                "Authenticated school ID is required."
            );

        error.status = 401;

        throw error;
    }

    return schoolId;
}

/*
|--------------------------------------------------------------------------
| Create Document
|--------------------------------------------------------------------------
| POST /api/documents
|--------------------------------------------------------------------------
*/

async function create(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            studentId,
            documentType,
            documentName,
            fileUrl,
            fileSize,
            mimeType,
            uploadedBy
        } = req.body;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student ID is required."
            });
        }

        if (
            !documentType ||
            !String(documentType).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Document type is required."
            });
        }

        if (
            !documentName ||
            !String(documentName).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Document name is required."
            });
        }

        if (
            !fileUrl ||
            !String(fileUrl).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Document file URL is required."
            });
        }

        const document =
            await createDocument({
                schoolId,
                studentId,
                documentType:
                    String(documentType).trim(),
                documentName:
                    String(documentName).trim(),
                fileUrl:
                    String(fileUrl).trim(),
                fileSize:
                    fileSize !== undefined
                        ? fileSize
                        : null,
                mimeType:
                    mimeType !== undefined
                        ? mimeType
                        : null,
                uploadedBy:
                    uploadedBy !== undefined
                        ? uploadedBy
                        : (
                            req.user.id ||
                            req.user.userId ||
                            null
                        )
            });

        return res.status(201).json({
            success: true,
            message:
                "Student document created successfully.",
            data:
                document
        });
    } catch (error) {
        console.error(
            "Create document error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get Document By ID
|--------------------------------------------------------------------------
| GET /api/documents/:id
|--------------------------------------------------------------------------
*/

async function getById(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const documentId =
            req.params.id;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Document ID is required."
            });
        }

        const document =
            await findDocumentById(
                documentId,
                schoolId
            );

        if (!document) {
            return res.status(404).json({
                success: false,
                message:
                    "Document not found."
            });
        }

        return res.status(200).json({
            success: true,
            data:
                document
        });
    } catch (error) {
        console.error(
            "Get document error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get Student Documents
|--------------------------------------------------------------------------
| GET /api/documents/student/:studentId
|--------------------------------------------------------------------------
*/

async function getStudentDocuments(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const studentId =
            req.params.studentId;

        const documentType =
            req.query.documentType || null;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student ID is required."
            });
        }

        const documents =
            await findStudentDocuments({
                schoolId,
                studentId,
                documentType
            });

        return res.status(200).json({
            success: true,
            count:
                documents.length,
            data:
                documents
        });
    } catch (error) {
        console.error(
            "Get student documents error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get All School Documents
|--------------------------------------------------------------------------
| GET /api/documents
|--------------------------------------------------------------------------
*/

async function getAll(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            documentType = null,
            limit = 100,
            offset = 0
        } = req.query;

        const documents =
            await findSchoolDocuments(
                schoolId,
                {
                    documentType,
                    limit,
                    offset
                }
            );

        return res.status(200).json({
            success: true,
            count:
                documents.length,
            data:
                documents
        });
    } catch (error) {
        console.error(
            "Get school documents error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Update Document
|--------------------------------------------------------------------------
| PUT /api/documents/:id
|--------------------------------------------------------------------------
*/

async function update(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const documentId =
            req.params.id;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Document ID is required."
            });
        }

        const existing =
            await findDocumentById(
                documentId,
                schoolId
            );

        if (!existing) {
            return res.status(404).json({
                success: false,
                message:
                    "Document not found."
            });
        }

        const {
            documentType,
            documentName,
            fileUrl,
            fileSize,
            mimeType
        } = req.body;

        const data = {};

        if (
            documentType !== undefined
        ) {
            if (
                !documentType ||
                !String(documentType).trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Document type cannot be empty."
                });
            }

            data.documentType =
                String(documentType).trim();
        }

        if (
            documentName !== undefined
        ) {
            if (
                !documentName ||
                !String(documentName).trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Document name cannot be empty."
                });
            }

            data.documentName =
                String(documentName).trim();
        }

        if (
            fileUrl !== undefined
        ) {
            if (
                !fileUrl ||
                !String(fileUrl).trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Document file URL cannot be empty."
                });
            }

            data.fileUrl =
                String(fileUrl).trim();
        }

        if (
            fileSize !== undefined
        ) {
            data.fileSize =
                fileSize;
        }

        if (
            mimeType !== undefined
        ) {
            data.mimeType =
                mimeType;
        }

        if (
            Object.keys(data).length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "No document fields were supplied for update."
            });
        }

        const updatedDocument =
            await updateDocument(
                documentId,
                schoolId,
                data
            );

        if (!updatedDocument) {
            return res.status(404).json({
                success: false,
                message:
                    "Document not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Document updated successfully.",
            data:
                updatedDocument
        });
    } catch (error) {
        console.error(
            "Update document error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Delete Document
|--------------------------------------------------------------------------
| DELETE /api/documents/:id
|--------------------------------------------------------------------------
*/

async function remove(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const documentId =
            req.params.id;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Document ID is required."
            });
        }

        const document =
            await deleteDocument(
                documentId,
                schoolId
            );

        if (!document) {
            return res.status(404).json({
                success: false,
                message:
                    "Document not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Document deleted successfully.",
            data:
                document
        });
    } catch (error) {
        console.error(
            "Delete document error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Search Documents
|--------------------------------------------------------------------------
| GET /api/documents/search?q=...
|--------------------------------------------------------------------------
*/

async function search(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const searchTerm =
            String(
                req.query.q || ""
            ).trim();

        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message:
                    "Search term is required."
            });
        }

        const documents =
            await searchDocuments(
                searchTerm,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count:
                documents.length,
            data:
                documents
        });
    } catch (error) {
        console.error(
            "Search documents error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Count Student Documents
|--------------------------------------------------------------------------
| GET /api/documents/student/:studentId/count
|--------------------------------------------------------------------------
*/

async function count(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const studentId =
            req.params.studentId;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student ID is required."
            });
        }

        const documentCount =
            await countStudentDocuments(
                studentId,
                schoolId
            );

        return res.status(200).json({
            success: true,
            studentId,
            documentCount
        });
    } catch (error) {
        console.error(
            "Count student documents error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Get Document Types
|--------------------------------------------------------------------------
| GET /api/documents/types
|--------------------------------------------------------------------------
*/

async function types(req, res, next) {
    try {
        const schoolId =
            getSchoolId(req);

        const documentTypes =
            await getDocumentTypes(
                schoolId
            );

        return res.status(200).json({
            success: true,
            count:
                documentTypes.length,
            data:
                documentTypes
        });
    } catch (error) {
        console.error(
            "Get document types error:",
            error
        );

        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {
    create,
    getById,
    getStudentDocuments,
    getAll,
    update,
    remove,
    search,
    count,
    types
};