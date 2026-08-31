const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

/*
|--------------------------------------------------------------------------
| Upload Middleware
|--------------------------------------------------------------------------
|
| Handles:
|
| 1. Student photographs
| 2. Staff photographs
| 3. Student/staff documents
|
| Files are stored on the server and their paths will be saved in
| PostgreSQL by the appropriate controllers/models.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Upload Directories
|--------------------------------------------------------------------------
*/

const studentUploadDirectory = path.join(
    process.cwd(),
    "uploads",
    "students"
);

const staffUploadDirectory = path.join(
    process.cwd(),
    "uploads",
    "staff"
);

const documentUploadDirectory = path.join(
    process.cwd(),
    "uploads",
    "documents"
);


/*
|--------------------------------------------------------------------------
| Create Directories If They Do Not Exist
|--------------------------------------------------------------------------
*/

function ensureUploadDirectories() {

    const directories = [
        studentUploadDirectory,
        staffUploadDirectory,
        documentUploadDirectory
    ];

    for (const directory of directories) {

        if (!fs.existsSync(directory)) {

            fs.mkdirSync(directory, {
                recursive: true
            });

        }

    }

}

ensureUploadDirectories();


/*
|--------------------------------------------------------------------------
| Allowed File Types
|--------------------------------------------------------------------------
*/

const allowedImageMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


const allowedDocumentMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
];


/*
|--------------------------------------------------------------------------
| Maximum File Size
|--------------------------------------------------------------------------
|
| 5 MB per uploaded file.
|--------------------------------------------------------------------------
*/

const maximumFileSize = 5 * 1024 * 1024;


/*
|--------------------------------------------------------------------------
| Generate Safe File Name
|--------------------------------------------------------------------------
*/

function generateFileName(originalName) {

    const extension =
        path.extname(originalName).toLowerCase();

    const uniqueName =
        `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;

    return `${uniqueName}${extension}`;

}


/*
|--------------------------------------------------------------------------
| Student Photo Storage
|--------------------------------------------------------------------------
*/

const studentPhotoStorage =
    multer.diskStorage({

        destination: function (req, file, callback) {

            callback(
                null,
                studentUploadDirectory
            );

        },

        filename: function (req, file, callback) {

            callback(
                null,
                generateFileName(file.originalname)
            );

        }

    });


/*
|--------------------------------------------------------------------------
| Staff Photo Storage
|--------------------------------------------------------------------------
*/

const staffPhotoStorage =
    multer.diskStorage({

        destination: function (req, file, callback) {

            callback(
                null,
                staffUploadDirectory
            );

        },

        filename: function (req, file, callback) {

            callback(
                null,
                generateFileName(file.originalname)
            );

        }

    });


/*
|--------------------------------------------------------------------------
| Document Storage
|--------------------------------------------------------------------------
*/

const documentStorage =
    multer.diskStorage({

        destination: function (req, file, callback) {

            callback(
                null,
                documentUploadDirectory
            );

        },

        filename: function (req, file, callback) {

            callback(
                null,
                generateFileName(file.originalname)
            );

        }

    });


/*
|--------------------------------------------------------------------------
| Image File Filter
|--------------------------------------------------------------------------
*/

function imageFileFilter(req, file, callback) {

    if (
        allowedImageMimeTypes.includes(
            file.mimetype
        )
    ) {

        return callback(null, true);

    }


    const error = new Error(
        "Only JPG, JPEG, PNG and WEBP image files are allowed."
    );

    error.code = "INVALID_IMAGE_TYPE";

    return callback(error, false);

}


/*
|--------------------------------------------------------------------------
| Document File Filter
|--------------------------------------------------------------------------
*/

function documentFileFilter(req, file, callback) {

    if (
        allowedDocumentMimeTypes.includes(
            file.mimetype
        )
    ) {

        return callback(null, true);

    }


    const error = new Error(
        "Only PDF, JPG, JPEG and PNG documents are allowed."
    );

    error.code = "INVALID_DOCUMENT_TYPE";

    return callback(error, false);

}


/*
|--------------------------------------------------------------------------
| Student Photo Upload
|--------------------------------------------------------------------------
|
| Frontend field name:
|
| photo
|--------------------------------------------------------------------------
*/

const uploadStudentPhoto =
    multer({

        storage: studentPhotoStorage,

        limits: {
            fileSize: maximumFileSize,
            files: 1
        },

        fileFilter: imageFileFilter

    }).single("photo");


/*
|--------------------------------------------------------------------------
| Staff Photo Upload
|--------------------------------------------------------------------------
*/

const uploadStaffPhoto =
    multer({

        storage: staffPhotoStorage,

        limits: {
            fileSize: maximumFileSize,
            files: 1
        },

        fileFilter: imageFileFilter

    }).single("photo");


/*
|--------------------------------------------------------------------------
| Student Document Upload
|--------------------------------------------------------------------------
|
| Frontend field name:
|
| document
|--------------------------------------------------------------------------
*/

const uploadDocument =
    multer({

        storage: documentStorage,

        limits: {
            fileSize: maximumFileSize,
            files: 1
        },

        fileFilter: documentFileFilter

    }).single("document");


/*
|--------------------------------------------------------------------------
| Multiple Student Documents
|--------------------------------------------------------------------------
|
| Allows up to 10 documents in one request.
|--------------------------------------------------------------------------
*/

const uploadMultipleDocuments =
    multer({

        storage: documentStorage,

        limits: {
            fileSize: maximumFileSize,
            files: 10
        },

        fileFilter: documentFileFilter

    }).array("documents", 10);


/*
|--------------------------------------------------------------------------
| Upload Error Middleware
|--------------------------------------------------------------------------
|
| Converts Multer errors into clean API responses.
|--------------------------------------------------------------------------
*/

function handleUploadErrors(error, req, res, next) {

    if (!error) {

        return next();

    }


    /*
    |--------------------------------------------------------------------------
    | Multer Errors
    |--------------------------------------------------------------------------
    */

    if (error instanceof multer.MulterError) {

        if (error.code === "LIMIT_FILE_SIZE") {

            return res.status(400).json({

                success: false,

                message:
                    "File is too large. Maximum allowed size is 5 MB."

            });

        }


        if (error.code === "LIMIT_FILE_COUNT") {

            return res.status(400).json({

                success: false,

                message:
                    "Too many files were uploaded."

            });

        }


        if (error.code === "LIMIT_UNEXPECTED_FILE") {

            return res.status(400).json({

                success: false,

                message:
                    "Unexpected file field."

            });

        }


        return res.status(400).json({

            success: false,

            message:
                "File upload failed."

        });

    }


    /*
    |--------------------------------------------------------------------------
    | Custom File Type Errors
    |--------------------------------------------------------------------------
    */

    if (
        error.code === "INVALID_IMAGE_TYPE" ||
        error.code === "INVALID_DOCUMENT_TYPE"
    ) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }


    /*
    |--------------------------------------------------------------------------
    | Unknown Upload Error
    |--------------------------------------------------------------------------
    */

    return next(error);

}


/*
|--------------------------------------------------------------------------
| Delete Uploaded File
|--------------------------------------------------------------------------
|
| Used when replacing or deleting student/staff photographs or documents.
|--------------------------------------------------------------------------
*/

function deleteUploadedFile(relativeFilePath) {

    if (!relativeFilePath) {

        return false;

    }


    /*
    |--------------------------------------------------------------------------
    | Convert Database Path To Absolute Path
    |--------------------------------------------------------------------------
    */

    const normalizedPath =
        relativeFilePath
            .replace(/^[/\\]+/, "")
            .replace(/\//g, path.sep);


    const absolutePath =
        path.join(
            process.cwd(),
            normalizedPath
        );


    /*
    |--------------------------------------------------------------------------
    | Security Check
    |--------------------------------------------------------------------------
    |
    | Prevent paths from escaping the uploads directory.
    |--------------------------------------------------------------------------
    */

    const uploadsRoot =
        path.resolve(
            process.cwd(),
            "uploads"
        );

    const resolvedPath =
        path.resolve(
            absolutePath
        );


    if (
        !resolvedPath.startsWith(
            uploadsRoot + path.sep
        )
    ) {

        return false;

    }


    /*
    |--------------------------------------------------------------------------
    | Delete File
    |--------------------------------------------------------------------------
    */

    if (fs.existsSync(resolvedPath)) {

        fs.unlinkSync(resolvedPath);

        return true;

    }


    return false;

}


/*
|--------------------------------------------------------------------------
| Get Public File Path
|--------------------------------------------------------------------------
|
| Converts:
|
| uploads/students/photo.jpg
|
| into:
|
| /uploads/students/photo.jpg
|--------------------------------------------------------------------------
*/

function getPublicFilePath(filePath) {

    if (!filePath) {

        return null;

    }


    return "/" +
        filePath
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");

}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    uploadStudentPhoto,

    uploadStaffPhoto,

    uploadDocument,

    uploadMultipleDocuments,

    handleUploadErrors,

    deleteUploadedFile,

    getPublicFilePath,

    studentUploadDirectory,

    staffUploadDirectory,

    documentUploadDirectory

};