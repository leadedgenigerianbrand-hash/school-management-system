"use strict";

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadsRootDirectory = path.resolve(
    process.cwd(),
    "uploads"
);

const studentUploadDirectory = path.join(
    uploadsRootDirectory,
    "students"
);

const staffUploadDirectory = path.join(
    uploadsRootDirectory,
    "staff"
);

const documentUploadDirectory = path.join(
    uploadsRootDirectory,
    "documents"
);

function ensureUploadDirectories() {
    const directories = [
        uploadsRootDirectory,
        studentUploadDirectory,
        staffUploadDirectory,
        documentUploadDirectory
    ];

    for (const directory of directories) {
        fs.mkdirSync(directory, {
            recursive: true
        });
    }
}

ensureUploadDirectories();

const allowedImageMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
]);

const allowedDocumentMimeTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png"
]);

const maximumFileSize = 5 * 1024 * 1024;

function generateFileName(originalName) {
    const extension =
        path.extname(
            String(originalName || "")
        ).toLowerCase();

    const safeExtension =
        /^[.][a-z0-9]+$/.test(extension)
            ? extension
            : "";

    const uniqueName =
        `${Date.now()}-${crypto.randomBytes(16).toString("hex")}`;

    return `${uniqueName}${safeExtension}`;
}

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
                generateFileName(
                    file.originalname
                )
            );
        }
    });

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
                generateFileName(
                    file.originalname
                )
            );
        }
    });

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
                generateFileName(
                    file.originalname
                )
            );
        }
    });

function imageFileFilter(req, file, callback) {
    if (
        allowedImageMimeTypes.has(
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

function documentFileFilter(req, file, callback) {
    if (
        allowedDocumentMimeTypes.has(
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

const uploadStudentPhoto =
    multer({
        storage: studentPhotoStorage,
        limits: {
            fileSize: maximumFileSize,
            files: 1
        },
        fileFilter: imageFileFilter
    }).single("photo");

const uploadStaffPhoto =
    multer({
        storage: staffPhotoStorage,
        limits: {
            fileSize: maximumFileSize,
            files: 1
        },
        fileFilter: imageFileFilter
    }).single("photo");

const uploadDocument =
    multer({
        storage: documentStorage,
        limits: {
            fileSize: maximumFileSize,
            files: 1
        },
        fileFilter: documentFileFilter
    }).single("document");

const uploadMultipleDocuments =
    multer({
        storage: documentStorage,
        limits: {
            fileSize: maximumFileSize,
            files: 10
        },
        fileFilter: documentFileFilter
    }).array("documents", 10);

function handleUploadErrors(error, req, res, next) {
    if (!error) {
        return next();
    }

    if (
        error instanceof multer.MulterError
    ) {
        if (
            error.code === "LIMIT_FILE_SIZE"
        ) {
            error.statusCode = 400;
            error.message =
                "File is too large. Maximum allowed size is 5 MB.";
            return next(error);
        }

        if (
            error.code === "LIMIT_FILE_COUNT"
        ) {
            error.statusCode = 400;
            error.message =
                "Too many files were uploaded.";
            return next(error);
        }

        if (
            error.code === "LIMIT_UNEXPECTED_FILE"
        ) {
            error.statusCode = 400;
            error.message =
                "Unexpected file field.";
            return next(error);
        }

        if (
            error.code === "LIMIT_FIELD_COUNT"
        ) {
            error.statusCode = 400;
            error.message =
                "Too many form fields were submitted.";
            return next(error);
        }

        return next(error);
    }

    if (
        error.code === "INVALID_IMAGE_TYPE" ||
        error.code === "INVALID_DOCUMENT_TYPE"
    ) {
        error.statusCode = 400;
        return next(error);
    }

    return next(error);
}

function deleteUploadedFile(relativeFilePath) {
    if (!relativeFilePath) {
        return false;
    }

    const normalizedInput =
        String(relativeFilePath)
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");

    const absolutePath =
        path.resolve(
            process.cwd(),
            normalizedInput
        );

    const uploadsRoot =
        path.resolve(
            uploadsRootDirectory
        );

    const uploadsPrefix =
        `${uploadsRoot}${path.sep}`;

    if (
        absolutePath !== uploadsRoot &&
        !absolutePath.startsWith(
            uploadsPrefix
        )
    ) {
        return false;
    }

    if (!fs.existsSync(absolutePath)) {
        return false;
    }

    const fileStats =
        fs.statSync(absolutePath);

    if (!fileStats.isFile()) {
        return false;
    }

    fs.unlinkSync(absolutePath);

    return true;
}

function getPublicFilePath(filePath) {
    if (!filePath) {
        return null;
    }

    const normalizedPath =
        String(filePath)
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");

    if (
        !normalizedPath.startsWith(
            "uploads/"
        )
    ) {
        return null;
    }

    const absolutePath =
        path.resolve(
            process.cwd(),
            normalizedPath
        );

    const uploadsPrefix =
        `${uploadsRootDirectory}${path.sep}`;

    if (
        !absolutePath.startsWith(
            uploadsPrefix
        )
    ) {
        return null;
    }

    return `/${normalizedPath}`;
}

module.exports = {
    uploadStudentPhoto,
    uploadStaffPhoto,
    uploadDocument,
    uploadMultipleDocuments,
    handleUploadErrors,
    deleteUploadedFile,
    getPublicFilePath,
    uploadsRootDirectory,
    studentUploadDirectory,
    staffUploadDirectory,
    documentUploadDirectory
};