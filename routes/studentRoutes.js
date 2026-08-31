const express = require("express");

const studentController = require("../controllers/studentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| STUDENT ROUTES
|--------------------------------------------------------------------------
| Base URL:
| /api/students
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET ALL STUDENTS
|--------------------------------------------------------------------------
| GET /api/students
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
| GET /api/students/statistics
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
| GET /api/students/search?q=John
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
| GET /api/students/search-name?name=John
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
| GET /api/students/admission/:admissionNumber
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
| GET /api/students/:id/enrollment
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
| GET /api/students/:id/profile
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
| GET /api/students/:id
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
| POST /api/students
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authMiddleware,
    studentController.createStudent
);


/*
|--------------------------------------------------------------------------
| ENROLL STUDENT
|--------------------------------------------------------------------------
| POST /api/students/:id/enrollment
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
| PUT /api/students/:id
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    authMiddleware,
    studentController.updateStudent
);


/*
|--------------------------------------------------------------------------
| DELETE STUDENT
|--------------------------------------------------------------------------
| DELETE /api/students/:id
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