const express = require("express");
const multer = require("multer");
const path = require("path");

const studentController = require("../controllers/studentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Multer configuration
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../Public/uploads/students"));
    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(file.originalname).toLowerCase();

        const filename =
            `student-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

        cb(null, filename);
    }

});

const upload = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
                )
            );
        }
    }

});


/*
|--------------------------------------------------------------------------
| GET ALL STUDENTS
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authMiddleware,
    studentController.getStudents
);


/*
|--------------------------------------------------------------------------
| GET STUDENT STATISTICS
|--------------------------------------------------------------------------
*/

router.get(
    "/statistics",
    authMiddleware,
    studentController.getStudentStatistics
);


/*
|--------------------------------------------------------------------------
| SEARCH STUDENTS
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    authMiddleware,
    studentController.searchStudents
);


/*
|--------------------------------------------------------------------------
| SEARCH STUDENT BY NAME
|--------------------------------------------------------------------------
*/

router.get(
    "/search-name",
    authMiddleware,
    studentController.searchStudentByName
);


/*
|--------------------------------------------------------------------------
| GET STUDENT BY ADMISSION NUMBER
|--------------------------------------------------------------------------
*/

router.get(
    "/admission/:admissionNumber",
    authMiddleware,
    studentController.getStudentByAdmissionNumber
);


/*
|--------------------------------------------------------------------------
| GET STUDENT ENROLLMENT
|--------------------------------------------------------------------------
*/

router.get(
    "/:id/enrollment",
    authMiddleware,
    studentController.getStudentEnrollment
);


/*
|--------------------------------------------------------------------------
| GET FULL STUDENT PROFILE
|--------------------------------------------------------------------------
*/

router.get(
    "/:id/profile",
    authMiddleware,
    studentController.getStudentProfile
);


/*
|--------------------------------------------------------------------------
| GET STUDENT BY ID
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    authMiddleware,
    studentController.getStudentById
);


/*
|--------------------------------------------------------------------------
| CREATE STUDENT
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authMiddleware,
    upload.single("photo"),
    studentController.createStudent
);


/*
|--------------------------------------------------------------------------
| ENROLL STUDENT
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/enrollment",
    authMiddleware,
    studentController.enrollStudent
);


/*
|--------------------------------------------------------------------------
| UPDATE STUDENT
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    authMiddleware,
    upload.single("photo"),
    studentController.updateStudent
);


/*
|--------------------------------------------------------------------------
| DELETE STUDENT
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    authMiddleware,
    studentController.deleteStudent
);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;