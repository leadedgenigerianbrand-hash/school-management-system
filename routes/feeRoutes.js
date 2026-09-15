"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createFeeStructure,
    getFeeStructures,
    getFeeStructureById,
    updateFeeStructure,
    deleteFeeStructure,
    assignFee,
    getSchoolFeeRecords,
    getStudentFees,
    getStudentFeeById,
    deleteStudentFeeRecord,
    refreshStudentFeeBalance,
    getStudentFeeSummary,
    getSchoolFeeSummary,
    searchStudentFees
} = require("../controllers/feeController");

const {
    createPayment,
    getStudentFeePayments,
    getRecentPayments
} = require("../controllers/paymentController");

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| SCHOOL FEE SUMMARY
|--------------------------------------------------------------------------
|
| GET /api/fees/summary
|
|--------------------------------------------------------------------------
*/

router.get(
    "/summary",
    getSchoolFeeSummary
);

/*
|--------------------------------------------------------------------------
| SEARCH STUDENT FEES
|--------------------------------------------------------------------------
|
| GET /api/fees/search?q=
|
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    searchStudentFees
);

/*
|--------------------------------------------------------------------------
| GET ALL SCHOOL FEE RECORDS
|--------------------------------------------------------------------------
|
| GET /api/fees/records
|
|--------------------------------------------------------------------------
*/

router.get(
    "/records",
    getSchoolFeeRecords
);

/*
|--------------------------------------------------------------------------
| STUDENT FEE SUMMARY
|--------------------------------------------------------------------------
|
| GET /api/fees/student/:studentId/summary
|
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId/summary",
    getStudentFeeSummary
);

/*
|--------------------------------------------------------------------------
| STUDENT PAYMENT HISTORY
|--------------------------------------------------------------------------
|
| GET /api/fees/student/:studentId/payments
|
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId/payments",
    async (req, res, next) => {
        try {
            const studentId =
                req.params.studentId;

            if (!studentId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Student ID is required."
                });
            }

            req.query.studentId = studentId;

            return getStudentFeePayments(
                req,
                res,
                next
            );
        } catch (error) {
            next(error);
        }
    }
);

/*
|--------------------------------------------------------------------------
| GET STUDENT FEES
|--------------------------------------------------------------------------
|
| GET /api/fees/student/:studentId
|
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId",
    getStudentFees
);

/*
|--------------------------------------------------------------------------
| RECENT PAYMENTS
|--------------------------------------------------------------------------
|
| GET /api/fees/payments/recent
|
|--------------------------------------------------------------------------
*/

router.get(
    "/payments/recent",
    getRecentPayments
);

/*
|--------------------------------------------------------------------------
| GET FEE STRUCTURES
|--------------------------------------------------------------------------
|
| GET /api/fees/structures
|
|--------------------------------------------------------------------------
*/

router.get(
    "/structures",
    getFeeStructures
);

/*
|--------------------------------------------------------------------------
| GET FEE STRUCTURE BY ID
|--------------------------------------------------------------------------
|
| GET /api/fees/structures/:id
|
|--------------------------------------------------------------------------
*/

router.get(
    "/structures/:id",
    getFeeStructureById
);

/*
|--------------------------------------------------------------------------
| CREATE FEE STRUCTURE
|--------------------------------------------------------------------------
|
| POST /api/fees/structures
|
|--------------------------------------------------------------------------
*/

router.post(
    "/structures",
    createFeeStructure
);

/*
|--------------------------------------------------------------------------
| ASSIGN FEE TO STUDENT
|--------------------------------------------------------------------------
|
| POST /api/fees/assign
|
|--------------------------------------------------------------------------
*/

router.post(
    "/assign",
    assignFee
);

/*
|--------------------------------------------------------------------------
| RECORD PAYMENT
|--------------------------------------------------------------------------
|
| POST /api/fees/payment
|
|--------------------------------------------------------------------------
*/

router.post(
    "/payment",
    createPayment
);

/*
|--------------------------------------------------------------------------
| REFRESH STUDENT FEE BALANCE
|--------------------------------------------------------------------------
|
| PATCH /api/fees/student-records/:id/balance
|
|--------------------------------------------------------------------------
*/

router.patch(
    "/student-records/:id/balance",
    refreshStudentFeeBalance
);

/*
|--------------------------------------------------------------------------
| UPDATE FEE STRUCTURE
|--------------------------------------------------------------------------
|
| PUT /api/fees/structures/:id
|
|--------------------------------------------------------------------------
*/

router.put(
    "/structures/:id",
    updateFeeStructure
);

/*
|--------------------------------------------------------------------------
| DELETE FEE STRUCTURE
|--------------------------------------------------------------------------
|
| DELETE /api/fees/structures/:id
|
|--------------------------------------------------------------------------
*/

router.delete(
    "/structures/:id",
    deleteFeeStructure
);

/*
|--------------------------------------------------------------------------
| DELETE STUDENT FEE RECORD
|--------------------------------------------------------------------------
|
| DELETE /api/fees/student-records/:id
|
|--------------------------------------------------------------------------
*/

router.delete(
    "/student-records/:id",
    deleteStudentFeeRecord
);

/*
|--------------------------------------------------------------------------
| GET STUDENT FEE BY ID
|--------------------------------------------------------------------------
|
| GET /api/fees/:id
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    getStudentFeeById
);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;