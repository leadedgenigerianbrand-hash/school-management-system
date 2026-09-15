"use strict";

const paymentModel = require("../models/paymentModel");

function getSchoolId(req) {
    const schoolId =
        req.user?.schoolId ||
        req.user?.school_id;

    if (!schoolId) {
        const error = new Error(
            "Authenticated school information is required."
        );

        error.statusCode = 401;

        throw error;
    }

    return schoolId;
}

function getUserId(req) {
    const userId =
        req.user?.id ||
        req.user?.userId ||
        req.user?.user_id;

    if (!userId) {
        const error = new Error(
            "Authenticated user information is required."
        );

        error.statusCode = 401;

        throw error;
    }

    return userId;
}

function isValidAmount(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return false;
    }

    const amount = Number(value);

    return (
        Number.isFinite(amount) &&
        amount > 0
    );
}

function normalizeOptionalId(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    return value;
}

/*
CREATE PAYMENT
POST /api/payments
*/

async function createPayment(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const receivedBy = getUserId(req);

        const {
            studentFeeId,
            studentId,
            amount,
            paymentMethod,
            transactionReference,
            reference,
            paymentDate,
            notes
        } = req.body;

        if (!studentFeeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student fee ID is required."
            });
        }

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student ID is required."
            });
        }

        if (!isValidAmount(amount)) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment amount must be greater than zero."
            });
        }

        const payment =
            await paymentModel.createPayment({
                schoolId,
                studentFeeId,
                studentId,
                amount: Number(amount),

                paymentMethod:
                    paymentMethod
                        ? String(paymentMethod).trim()
                        : "cash",

                transactionReference:
                    transactionReference ||
                    reference ||
                    null,

                paymentDate:
                    paymentDate || null,

                receivedBy,

                notes:
                    notes
                        ? String(notes).trim()
                        : null
            });

        return res.status(201).json({
            success: true,
            message:
                "Payment recorded successfully.",
            data: payment
        });
    } catch (error) {
        next(error);
    }
}

/*
GET PAYMENT BY ID
GET /api/payments/:id
*/

async function getPaymentById(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const paymentId = req.params.id;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment ID is required."
            });
        }

        const payment =
            await paymentModel.findPaymentById(
                paymentId,
                schoolId
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message:
                    "Payment not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
}

/*
GET STUDENT PAYMENTS
GET /api/payments/student/:studentId
*/

async function getStudentPayments(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const studentId = req.params.studentId;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student ID is required."
            });
        }

        const {
            studentFeeId,
            paymentMethod,
            fromDate,
            toDate
        } = req.query;

        const payments =
            await paymentModel.getStudentPayments({
                schoolId,
                studentId,

                studentFeeId:
                    normalizeOptionalId(
                        studentFeeId
                    ),

                paymentMethod:
                    paymentMethod
                        ? String(paymentMethod).trim()
                        : null,

                fromDate:
                    fromDate || null,

                toDate:
                    toDate || null
            });

        return res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
}

/*
GET PAYMENTS FOR A STUDENT FEE
GET /api/payments/student-fee/:studentFeeId
*/

async function getStudentFeePayments(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const studentFeeId =
            req.params.studentFeeId;

        if (!studentFeeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student fee ID is required."
            });
        }

        const payments =
            await paymentModel.getStudentFeePayments(
                studentFeeId,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
}

/*
GET RECENT PAYMENTS
GET /api/payments/recent
*/

async function getRecentPayments(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        let limit =
            Number(req.query.limit || 10);

        if (
            !Number.isFinite(limit) ||
            limit < 1
        ) {
            limit = 10;
        }

        limit =
            Math.min(
                Math.floor(limit),
                100
            );

        const payments =
            await paymentModel.getRecentPayments(
                schoolId,
                limit
            );

        return res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
}

/*
GET PAYMENT HISTORY
GET /api/payments/history
*/

async function getPaymentHistory(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const {
            studentId,
            studentFeeId,
            fromDate,
            toDate
        } = req.query;

        const payments =
            await paymentModel.getPaymentHistory({
                schoolId,

                studentId:
                    normalizeOptionalId(
                        studentId
                    ),

                studentFeeId:
                    normalizeOptionalId(
                        studentFeeId
                    ),

                fromDate:
                    fromDate || null,

                toDate:
                    toDate || null
            });

        return res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
}

/*
PAYMENT SUMMARY FOR STUDENT FEE
GET /api/payments/student-fee/:studentFeeId/summary
*/

async function getPaymentSummary(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const studentFeeId =
            req.params.studentFeeId;

        if (!studentFeeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student fee ID is required."
            });
        }

        const summary =
            await paymentModel.getPaymentSummary(
                studentFeeId,
                schoolId
            );

        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
}

/*
GET SCHOOL PAYMENT SUMMARY
GET /api/payments/summary
*/

async function getSchoolPaymentSummary(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const {
            fromDate,
            toDate
        } = req.query;

        const summary =
            await paymentModel.getSchoolPaymentSummary({
                schoolId,

                fromDate:
                    fromDate || null,

                toDate:
                    toDate || null
            });

        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
}

/*
SEARCH PAYMENTS
GET /api/payments/search?q=
*/

async function searchPayments(
    req,
    res,
    next
) {
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

        const payments =
            await paymentModel.searchPayments(
                searchTerm,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
}

/*
DELETE PAYMENT
DELETE /api/payments/:id
*/

async function deletePayment(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const paymentId = req.params.id;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment ID is required."
            });
        }

        const payment =
            await paymentModel.deletePayment(
                paymentId,
                schoolId
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message:
                    "Payment not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Payment deleted successfully.",
            data: payment
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
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
};