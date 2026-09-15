"use strict";

const {
    createFeeStructure,
    findFeeStructureById,
    findFeeStructures,
    updateFeeStructure,
    deleteFeeStructure,
    assignFeeToStudent,
    findStudentFeeById,
    deleteStudentFeeRecord,
    findStudentFees,
    findSchoolFeeRecords,
    recordPayment,
    updateStudentFeeBalance,
    getPaymentHistory,
    getRecentPayments,
    getStudentFeeSummary,
    getSchoolFeeSummary,
    searchStudentFees
} = require("../models/feeModel");

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

function isValidAmount(value, allowZero = true) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return false;
    }

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return false;
    }

    if (allowZero) {
        return amount >= 0;
    }

    return amount > 0;
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
|--------------------------------------------------------------------------
| CREATE FEE STRUCTURE
|--------------------------------------------------------------------------
| POST /api/fees/structures
*/

async function createFeeStructureController(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const {
            sessionId,
            termId,
            classId,
            feeName,
            amount,
            description,
            compulsory
        } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Academic session is required."
            });
        }

        if (!termId) {
            return res.status(400).json({
                success: false,
                message: "Term is required."
            });
        }

        if (
            !feeName ||
            !String(feeName).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Fee name is required."
            });
        }

        if (!isValidAmount(amount, true)) {
            return res.status(400).json({
                success: false,
                message: "A valid fee amount is required."
            });
        }

        const fee =
            await createFeeStructure({
                schoolId,
                sessionId,
                termId,
                classId:
                    normalizeOptionalId(classId),
                feeName:
                    String(feeName).trim(),
                amount: Number(amount),
                description:
                    description
                        ? String(description).trim()
                        : null,
                compulsory:
                    compulsory === undefined
                        ? true
                        : Boolean(compulsory)
            });

        return res.status(201).json({
            success: true,
            message:
                "Fee structure created successfully.",
            data: fee
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET FEE STRUCTURES
|--------------------------------------------------------------------------
| GET /api/fees/structures
*/

async function getFeeStructures(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const {
            sessionId,
            termId,
            classId
        } = req.query;

        const fees =
            await findFeeStructures(
                schoolId,
                {
                    sessionId:
                        normalizeOptionalId(sessionId),

                    termId:
                        normalizeOptionalId(termId),

                    classId:
                        normalizeOptionalId(classId)
                }
            );

        return res.status(200).json({
            success: true,
            count: fees.length,
            data: fees
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET FEE STRUCTURE BY ID
|--------------------------------------------------------------------------
| GET /api/fees/structures/:id
*/

async function getFeeStructureById(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const feeId = req.params.id;

        if (!feeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Fee structure ID is required."
            });
        }

        const fee =
            await findFeeStructureById(
                feeId,
                schoolId
            );

        if (!fee) {
            return res.status(404).json({
                success: false,
                message:
                    "Fee structure not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: fee
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| UPDATE FEE STRUCTURE
|--------------------------------------------------------------------------
| PUT /api/fees/structures/:id
*/

async function updateFeeStructureController(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const feeId = req.params.id;

        const {
            feeName,
            amount,
            description,
            compulsory
        } = req.body;

        if (!feeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Fee structure ID is required."
            });
        }

        if (
            feeName === undefined ||
            feeName === null ||
            !String(feeName).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Fee name is required."
            });
        }

        if (!isValidAmount(amount, true)) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid fee amount is required."
            });
        }

        const fee =
            await updateFeeStructure(
                feeId,
                schoolId,
                {
                    feeName:
                        String(feeName).trim(),

                    amount:
                        Number(amount),

                    description:
                        description
                            ? String(description).trim()
                            : null,

                    compulsory:
                        compulsory === undefined
                            ? true
                            : Boolean(compulsory)
                }
            );

        if (!fee) {
            return res.status(404).json({
                success: false,
                message:
                    "Fee structure not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Fee structure updated successfully.",
            data: fee
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| DELETE FEE STRUCTURE
|--------------------------------------------------------------------------
| DELETE /api/fees/structures/:id
*/

async function deleteFeeStructureController(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const feeId = req.params.id;

        if (!feeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Fee structure ID is required."
            });
        }

        const fee =
            await deleteFeeStructure(
                feeId,
                schoolId
            );

        if (!fee) {
            return res.status(404).json({
                success: false,
                message:
                    "Fee structure not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Fee structure deleted successfully.",
            data: fee
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| ASSIGN FEE TO STUDENT
|--------------------------------------------------------------------------
| POST /api/fees/assign
*/

async function assignFee(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const {
            studentId,
            feeStructureId,
            amount
        } = req.body;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student ID is required."
            });
        }

        if (!feeStructureId) {
            return res.status(400).json({
                success: false,
                message:
                    "Fee structure ID is required."
            });
        }

        if (
            amount !== undefined &&
            amount !== null &&
            amount !== "" &&
            !isValidAmount(amount, true)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A valid fee amount is required."
            });
        }

        const fee =
            await assignFeeToStudent({
                schoolId,
                studentId,
                feeStructureId,
                amount:
                    amount === undefined ||
                    amount === null ||
                    amount === ""
                        ? null
                        : Number(amount)
            });

        return res.status(201).json({
            success: true,
            message:
                "Fee assigned to student successfully.",
            data: fee
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET ALL SCHOOL FEE RECORDS
|--------------------------------------------------------------------------
| GET /api/fees/records
*/

async function getSchoolFeeRecordsController(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const {
            search,
            status,
            sessionId,
            termId
        } = req.query;

        const records =
            await findSchoolFeeRecords(
                schoolId,
                {
                    search:
                        search
                            ? String(search).trim()
                            : null,

                    paymentStatus:
                        status
                            ? String(status).trim()
                            : null,

                    sessionId:
                        normalizeOptionalId(sessionId),

                    termId:
                        normalizeOptionalId(termId)
                }
            );

        return res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET STUDENT FEES
|--------------------------------------------------------------------------
| GET /api/fees/student/:studentId
*/

async function getStudentFeesController(
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
            sessionId,
            termId,
            status
        } = req.query;

        const fees =
            await findStudentFees({
                schoolId,
                studentId,

                sessionId:
                    normalizeOptionalId(sessionId),

                termId:
                    normalizeOptionalId(termId),

                paymentStatus:
                    status
                        ? String(status).trim()
                        : null
            });

        return res.status(200).json({
            success: true,
            count: fees.length,
            data: fees
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| GET STUDENT FEE BY ID
|--------------------------------------------------------------------------
| GET /api/fees/:id
*/

async function getStudentFeeByIdController(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const studentFeeId = req.params.id;

        if (!studentFeeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student fee ID is required."
            });
        }

        const fee =
            await findStudentFeeById(
                studentFeeId,
                schoolId
            );

        if (!fee) {
            return res.status(404).json({
                success: false,
                message:
                    "Student fee record not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: fee
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| DELETE STUDENT FEE RECORD
|--------------------------------------------------------------------------
| DELETE /api/fees/student-records/:id
*/

async function deleteStudentFeeRecordController(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const studentFeeId = req.params.id;

        if (!studentFeeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student fee ID is required."
            });
        }

        const fee =
            await deleteStudentFeeRecord(
                studentFeeId,
                schoolId
            );

        if (!fee) {
            return res.status(404).json({
                success: false,
                message:
                    "Student fee record not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Student fee record deleted successfully.",
            data: fee
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| RECORD PAYMENT
|--------------------------------------------------------------------------
| POST /api/fees/payment
*/

async function recordPaymentController(
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
            reference,
            transactionReference,
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

        if (!isValidAmount(amount, false)) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment amount must be greater than zero."
            });
        }

        const payment =
            await recordPayment({
                schoolId,
                studentFeeId,
                studentId,
                amount: Number(amount),

                paymentMethod:
                    paymentMethod
                        ? String(paymentMethod).trim()
                        : "cash",

                reference:
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
|--------------------------------------------------------------------------
| GET RECENT PAYMENTS
|--------------------------------------------------------------------------
| GET /api/fees/payments/recent
*/

async function getRecentPaymentsController(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        let requestedLimit =
            Number(req.query.limit || 5);

        if (
            !Number.isFinite(requestedLimit) ||
            requestedLimit < 1
        ) {
            requestedLimit = 5;
        }

        requestedLimit =
            Math.min(
                Math.floor(requestedLimit),
                100
            );

        const payments =
            await getRecentPayments(
                schoolId,
                requestedLimit
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
|--------------------------------------------------------------------------
| REFRESH STUDENT FEE BALANCE
|--------------------------------------------------------------------------
| PATCH /api/fees/student-records/:id/balance
*/

async function refreshStudentFeeBalance(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);
        const studentFeeId = req.params.id;

        if (!studentFeeId) {
            return res.status(400).json({
                success: false,
                message:
                    "Student fee ID is required."
            });
        }

        const fee =
            await updateStudentFeeBalance(
                studentFeeId,
                schoolId
            );

        if (!fee) {
            return res.status(404).json({
                success: false,
                message:
                    "Student fee record not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Student fee balance updated successfully.",
            data: fee
        });
    } catch (error) {
        next(error);
    }
}

/*
|--------------------------------------------------------------------------
| PAYMENT HISTORY
|--------------------------------------------------------------------------
| GET /api/fees/student/:studentId/payments
*/

async function getPaymentHistoryController(
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
            studentFeeId
        } = req.query;

        const payments =
            await getPaymentHistory({
                schoolId,
                studentId,

                studentFeeId:
                    normalizeOptionalId(
                        studentFeeId
                    )
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
|--------------------------------------------------------------------------
| STUDENT FEE SUMMARY
|--------------------------------------------------------------------------
| GET /api/fees/student/:studentId/summary
*/

async function getStudentFeeSummaryController(
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
            sessionId,
            termId
        } = req.query;

        const summary =
            await getStudentFeeSummary({
                schoolId,
                studentId,

                sessionId:
                    normalizeOptionalId(sessionId),

                termId:
                    normalizeOptionalId(termId)
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
|--------------------------------------------------------------------------
| SCHOOL FEE SUMMARY
|--------------------------------------------------------------------------
| GET /api/fees/summary
*/

async function getSchoolFeeSummaryController(
    req,
    res,
    next
) {
    try {
        const schoolId = getSchoolId(req);

        const {
            sessionId,
            termId
        } = req.query;

        const summary =
            await getSchoolFeeSummary(
                schoolId,
                {
                    sessionId:
                        normalizeOptionalId(
                            sessionId
                        ),

                    termId:
                        normalizeOptionalId(
                            termId
                        )
                }
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
|--------------------------------------------------------------------------
| SEARCH STUDENT FEES
|--------------------------------------------------------------------------
| GET /api/fees/search?q=
*/

async function searchStudentFeesController(
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

        const results =
            await searchStudentFees(
                searchTerm,
                schoolId
            );

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createFeeStructure:
        createFeeStructureController,

    getFeeStructures,

    getFeeStructureById,

    updateFeeStructure:
        updateFeeStructureController,

    deleteFeeStructure:
        deleteFeeStructureController,

    assignFee,

    getSchoolFeeRecords:
        getSchoolFeeRecordsController,

    getStudentFees:
        getStudentFeesController,

    getStudentFeeById:
        getStudentFeeByIdController,

    deleteStudentFeeRecord:
        deleteStudentFeeRecordController,

    recordPayment:
        recordPaymentController,

    getRecentPayments:
        getRecentPaymentsController,

    refreshStudentFeeBalance,

    getPaymentHistory:
        getPaymentHistoryController,

    getStudentFeeSummary:
        getStudentFeeSummaryController,

    getSchoolFeeSummary:
        getSchoolFeeSummaryController,

    searchStudentFees:
        searchStudentFeesController
};