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
| Document Controller
|--------------------------------------------------------------------------
*/


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
            req.user.schoolId;

        const {
            studentId,
            documentType,
            documentName,
            filePath,
            fileUrl,
            fileSize,
            mimeType,
            description
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
            !documentType.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Document type is required."

            });

        }


        if (
            !documentName ||
            !documentName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Document name is required."

            });

        }


        const document =
            await createDocument({

                schoolId,

                studentId,

                documentType:
                    documentType.trim(),

                documentName:
                    documentName.trim(),

                filePath:
                    filePath || null,

                fileUrl:
                    fileUrl || null,

                fileSize:
                    fileSize || null,

                mimeType:
                    mimeType || null,

                description:
                    description || null

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
            req.user.schoolId;

        const documentId =
            req.params.id;


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
            req.user.schoolId;

        const studentId =
            req.params.studentId;


        const documents =
            await findStudentDocuments(
                studentId,
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
            "Get student documents error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get School Documents
|--------------------------------------------------------------------------
| GET /api/documents
|--------------------------------------------------------------------------
*/

async function getAll(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId;


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

                    limit:
                        Math.min(
                            Number(limit) || 100,
                            500
                        ),

                    offset:
                        Math.max(
                            Number(offset) || 0,
                            0
                        )
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
            req.user.schoolId;

        const documentId =
            req.params.id;


        const {

            documentType,

            documentName,

            filePath,

            fileUrl,

            fileSize,

            mimeType,

            description

        } = req.body;


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


        const data = {

            documentType:
                documentType !== undefined
                    ? documentType.trim()
                    : existing.document_type,

            documentName:
                documentName !== undefined
                    ? documentName.trim()
                    : existing.document_name,

            filePath:
                filePath !== undefined
                    ? filePath
                    : null,

            fileUrl:
                fileUrl !== undefined
                    ? fileUrl
                    : null,

            fileSize:
                fileSize !== undefined
                    ? fileSize
                    : null,

            mimeType:
                mimeType !== undefined
                    ? mimeType
                    : null,

            description:
                description !== undefined
                    ? description
                    : existing.description

        };


        if (!data.documentType) {

            return res.status(400).json({

                success: false,

                message:
                    "Document type cannot be empty."

            });

        }


        if (!data.documentName) {

            return res.status(400).json({

                success: false,

                message:
                    "Document name cannot be empty."

            });

        }


        const updatedDocument =
            await updateDocument(
                documentId,
                schoolId,
                data
            );


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
            req.user.schoolId;

        const documentId =
            req.params.id;


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
            req.user.schoolId;

        const searchTerm =
            (req.query.q || "").trim();


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
            req.user.schoolId;

        const studentId =
            req.params.studentId;


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
            req.user.schoolId;


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