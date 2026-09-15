"use strict";

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
createPayment,
getPaymentById,
getStudentPayments,
getStudentFeePayments,
getRecentPayments,
getPaymentHistory,
getPaymentSummary,
getSchoolPaymentSummary,
searchPayments,
deletePayment
} = require("../controllers/paymentController");

router.use(authMiddleware);

/*
SCHOOL PAYMENT SUMMARY
GET /api/payments/summary
*/

router.get(
"/summary",
getSchoolPaymentSummary
);

/*
SEARCH PAYMENTS
GET /api/payments/search?q=
*/

router.get(
"/search",
searchPayments
);

/*
RECENT PAYMENTS
GET /api/payments/recent
*/

router.get(
"/recent",
getRecentPayments
);

/*
PAYMENT HISTORY
GET /api/payments/history
*/

router.get(
"/history",
getPaymentHistory
);

/*
STUDENT PAYMENTS
GET /api/payments/student/:studentId
*/

router.get(
"/student/:studentId",
getStudentPayments
);

/*
STUDENT FEE PAYMENT SUMMARY
GET /api/payments/student-fee/:studentFeeId/summary
*/

router.get(
"/student-fee/:studentFeeId/summary",
getPaymentSummary
);

/*
PAYMENTS FOR A STUDENT FEE
GET /api/payments/student-fee/:studentFeeId
*/

router.get(
"/student-fee/:studentFeeId",
getStudentFeePayments
);

/*
CREATE PAYMENT
POST /api/payments
*/

router.post(
"/",
createPayment
);

/*
GET PAYMENT BY ID
GET /api/payments/:id
*/

router.get(
"/:id",
getPaymentById
);

/*
DELETE PAYMENT
DELETE /api/payments/:id
*/

router.delete(
"/:id",
deletePayment
);

module.exports = router;
