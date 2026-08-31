const studentModel = require("../models/studentModel");

/*
|--------------------------------------------------------------------------
| Student Controller
|--------------------------------------------------------------------------
|
| Connects HTTP requests to the existing student model.
|
| Authentication is handled by authMiddleware.
| The authenticated user's schoolId is used to enforce school isolation.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Helper: Get School ID
|--------------------------------------------------------------------------
*/

function getSchoolId(req) {

    const schoolId = req.user?.schoolId;

    if (!schoolId) {
        throw new Error(
            "Authenticated user's school ID is missing."
        );
    }

    return schoolId;
}


/*
|--------------------------------------------------------------------------
| Create Student
|--------------------------------------------------------------------------
*/

async function createStudent(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            admissionNumber,
            firstName,
            middleName,
            lastName,
            gender,
            dateOfBirth,
            phone,
            email,
            address,
            stateOfOrigin,
            lga,
            nationality,
            religion,
            bloodGroup,
            genotype,
            admissionDate,
            status
        } = req.body;


        /*
        |----------------------------------------------------------------------
        | Check admission number
        |----------------------------------------------------------------------
        */

        const exists =
            await studentModel.admissionNumberExists(
                admissionNumber,
                schoolId
            );


        if (exists) {

            return res.status(409).json({

                success: false,

                message:
                    "Admission number already exists."

            });
        }


        /*
        |----------------------------------------------------------------------
        | Create student
        |----------------------------------------------------------------------
        */

        const student =
            await studentModel.createStudent({

                schoolId,

                admissionNumber,

                firstName,

                middleName,

                lastName,

                gender,

                dateOfBirth,

                phone,

                email,

                address,

                stateOfOrigin,

                lga,

                nationality,

                religion,

                bloodGroup,

                genotype,

                admissionDate,

                status

            });


        return res.status(201).json({

            success: true,

            message:
                "Student created successfully.",

            data: student

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get All Students
|--------------------------------------------------------------------------
*/

async function getStudents(req, res, next) {

    try {

        const schoolId = getSchoolId(req);


        const {
            status,
            gender,
            limit = 100,
            offset = 0
        } = req.query;


        const students =
            await studentModel.findStudents({

                schoolId,

                status:
                    status || null,

                gender:
                    gender || null,

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

            });


        const total =
            await studentModel.countStudents(
                schoolId,
                status || null
            );


        return res.json({

            success: true,

            data: students,

            pagination: {

                total,

                limit:
                    Number(limit) || 100,

                offset:
                    Number(offset) || 0,

                returned:
                    students.length

            }

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Student By ID
|--------------------------------------------------------------------------
*/

async function getStudentById(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        const student =
            await studentModel.findStudentById(
                id,
                schoolId
            );


        if (!student) {

            return res.status(404).json({

                success: false,

                message:
                    "Student not found."

            });

        }


        return res.json({

            success: true,

            data: student

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Full Student Profile
|--------------------------------------------------------------------------
*/

async function getStudentProfile(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        const student =
            await studentModel.getStudentProfile(
                id,
                schoolId
            );


        if (!student) {

            return res.status(404).json({

                success: false,

                message:
                    "Student profile not found."

            });

        }


        const enrollment =
            await studentModel.getStudentEnrollment(
                id,
                schoolId
            );


        const guardians =
            await studentModel.getStudentGuardians(
                id,
                schoolId
            );


        const documents =
            await studentModel.getStudentDocuments(
                id,
                schoolId
            );


        return res.json({

            success: true,

            data: {

                student,

                enrollment,

                guardians,

                documents

            }

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Search Students
|--------------------------------------------------------------------------
*/

async function searchStudents(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

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


        const students =
            await studentModel.searchStudents(
                searchTerm,
                schoolId
            );


        return res.json({

            success: true,

            data: students,

            count:
                students.length

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Search Student By Name
|--------------------------------------------------------------------------
*/

async function searchStudentByName(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const name =
            String(
                req.query.name || ""
            ).trim();


        if (!name) {

            return res.status(400).json({

                success: false,

                message:
                    "Student name is required."

            });

        }


        const students =
            await studentModel.searchStudentByName(
                name,
                schoolId
            );


        return res.json({

            success: true,

            data: students,

            count:
                students.length

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Student By Admission Number
|--------------------------------------------------------------------------
*/

async function getStudentByAdmissionNumber(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            admissionNumber
        } = req.params;


        const student =
            await studentModel.findStudentByAdmissionNumber(
                admissionNumber,
                schoolId
            );


        if (!student) {

            return res.status(404).json({

                success: false,

                message:
                    "Student not found."

            });

        }


        return res.json({

            success: true,

            data: student

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Update Student
|--------------------------------------------------------------------------
*/

async function updateStudent(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        const student =
            await studentModel.updateStudent(
                id,
                schoolId,
                req.body
            );


        if (!student) {

            return res.status(404).json({

                success: false,

                message:
                    "Student not found."

            });

        }


        return res.json({

            success: true,

            message:
                "Student updated successfully.",

            data: student

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Delete Student
|--------------------------------------------------------------------------
*/

async function deleteStudent(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        const student =
            await studentModel.deleteStudent(
                id,
                schoolId
            );


        if (!student) {

            return res.status(404).json({

                success: false,

                message:
                    "Student not found."

            });

        }


        return res.json({

            success: true,

            message:
                "Student deleted successfully.",

            data: student

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Student Statistics
|--------------------------------------------------------------------------
*/

async function getStudentStatistics(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);


        const statistics =
            await studentModel.getStudentStatistics(
                schoolId
            );


        return res.json({

            success: true,

            data: statistics

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Student Enrollment
|--------------------------------------------------------------------------
*/

async function getStudentEnrollment(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        const enrollment =
            await studentModel.getStudentEnrollment(
                id,
                schoolId
            );


        if (!enrollment) {

            return res.status(404).json({

                success: false,

                message:
                    "Student enrollment not found."

            });

        }


        return res.json({

            success: true,

            data: enrollment

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Enroll Student
|--------------------------------------------------------------------------
*/

async function enrollStudent(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        const {
            classId,
            classArmId,
            sessionId,
            termId,
            enrollmentDate,
            status
        } = req.body;


        const enrollment =
            await studentModel.enrollStudent({

                schoolId,

                studentId: id,

                classId,

                classArmId,

                sessionId,

                termId,

                enrollmentDate,

                status

            });


        return res.status(201).json({

            success: true,

            message:
                "Student enrolled successfully.",

            data: enrollment

        });


    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Export Controller
|--------------------------------------------------------------------------
*/

module.exports = {

    createStudent,

    getStudents,

    getStudentById,

    getStudentProfile,

    searchStudents,

    searchStudentByName,

    getStudentByAdmissionNumber,

    updateStudent,

    deleteStudent,

    getStudentStatistics,

    getStudentEnrollment,

    enrollStudent

};