const express = require("express");

const {
    createFeeStructure,
    getFeeStructures,
    getFeeStructureById,
    updateFeeStructure,
    deleteFeeStructure,
    assignFee,
    getStudentFees,
    getStudentFeeById,
    recordPayment,
    refreshStudentFeeBalance,
    getPaymentHistory,
    getStudentFeeSummary,
    getSchoolFeeSummary,
    searchStudentFees
} = require("../controllers/feeController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| FEE ROUTES
|--------------------------------------------------------------------------
| Base URL: /api/fees
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| SCHOOL FEE SUMMARY
|--------------------------------------------------------------------------
| GET /api/fees/summary
|--------------------------------------------------------------------------
*/

router.get(
    "/summary",
    authMiddleware,
    getSchoolFeeSummary
);


/*
|--------------------------------------------------------------------------
| SEARCH STUDENT FEES
|--------------------------------------------------------------------------
| GET /api/fees/search?q=
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    authMiddleware,
    searchStudentFees
);


/*
|--------------------------------------------------------------------------
| STUDENT FEE SUMMARY
|--------------------------------------------------------------------------
| GET /api/fees/student/:studentId/summary
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId/summary",
    authMiddleware,
    getStudentFeeSummary
);


/*
|--------------------------------------------------------------------------
| STUDENT FEE LIST
|--------------------------------------------------------------------------
| GET /api/fees/student/:studentId
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId",
    authMiddleware,
    getStudentFees
);


/*
|--------------------------------------------------------------------------
| PAYMENT HISTORY
|--------------------------------------------------------------------------
| GET /api/fees/student/:studentId/payments
|--------------------------------------------------------------------------
*/

router.get(
    "/student/:studentId/payments",
    authMiddleware,
    getPaymentHistory
);


/*
|--------------------------------------------------------------------------
| FEE STRUCTURES
|--------------------------------------------------------------------------
| GET /api/fees/structures
|--------------------------------------------------------------------------
*/

router.get(
    "/structures",
    authMiddleware,
    getFeeStructures
);


/*
|--------------------------------------------------------------------------
| FEE STRUCTURE BY ID
|--------------------------------------------------------------------------
| GET /api/fees/structures/:id
|--------------------------------------------------------------------------
*/

router.get(
    "/structures/:id",
    authMiddleware,
    getFeeStructureById
);


/*
|--------------------------------------------------------------------------
| STUDENT FEE BY ID
|--------------------------------------------------------------------------
| GET /api/fees/:id
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    authMiddleware,
    getStudentFeeById
);


/*
|--------------------------------------------------------------------------
| CREATE FEE STRUCTURE
|--------------------------------------------------------------------------
| POST /api/fees/structures
|--------------------------------------------------------------------------
*/

router.post(
    "/structures",
    authMiddleware,
    createFeeStructure
);


/*
|--------------------------------------------------------------------------
| ASSIGN FEE TO STUDENT
|--------------------------------------------------------------------------
| POST /api/fees/assign
|--------------------------------------------------------------------------
*/

router.post(
    "/assign",
    authMiddleware,
    assignFee
);


/*
|--------------------------------------------------------------------------
| RECORD PAYMENT
|--------------------------------------------------------------------------
| POST /api/fees/payment
|--------------------------------------------------------------------------
*/

router.post(
    "/payment",
    authMiddleware,
    recordPayment
);


/*
|--------------------------------------------------------------------------
| REFRESH STUDENT FEE BALANCE
|--------------------------------------------------------------------------
| PATCH /api/fees/student/:studentId/balance
|--------------------------------------------------------------------------
*/

router.patch(
    "/student/:studentId/balance",
    authMiddleware,
    refreshStudentFeeBalance
);


/*
|--------------------------------------------------------------------------
| UPDATE FEE STRUCTURE
|--------------------------------------------------------------------------
| PUT /api/fees/structures/:id
|--------------------------------------------------------------------------
*/

router.put(
    "/structures/:id",
    authMiddleware,
    updateFeeStructure
);


/*
|--------------------------------------------------------------------------
| DELETE FEE STRUCTURE
|--------------------------------------------------------------------------
| DELETE /api/fees/structures/:id
|--------------------------------------------------------------------------
*/

router.delete(
    "/structures/:id",
    authMiddleware,
    deleteFeeStructure
);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;