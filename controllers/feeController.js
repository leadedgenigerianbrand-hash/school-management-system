const {
    createFeeStructure,
    findFeeStructureById,
    findFeeStructures,
    updateFeeStructure,
    deleteFeeStructure,
    assignFeeToStudent,
    findStudentFeeById,
    findStudentFees,
    recordPayment,
    updateStudentFeeBalance,
    getPaymentHistory,
    getStudentFeeSummary,
    getSchoolFeeSummary,
    searchStudentFees
} = require("../models/feeModel");


/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

function getSchoolId(req) {

    if (!req.user || !req.user.schoolId) {

        const error = new Error(
            "Authenticated school information is required."
        );

        error.statusCode = 401;

        throw error;
    }

    return req.user.schoolId;
}


/*
|--------------------------------------------------------------------------
| Create Fee Structure
|--------------------------------------------------------------------------
| POST /api/fees/structures
|--------------------------------------------------------------------------
*/

async function createFeeStructureController(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const {
            sessionId,
            termId,
            classId,
            feeName,
            amount,
            description,
            dueDate,
            status
        } = req.body;


        if (!sessionId) {

            return res.status(400).json({
                success: false,
                message:
                    "Academic session is required."
            });
        }


        if (!termId) {

            return res.status(400).json({
                success: false,
                message:
                    "Term is required."
            });
        }


        if (!feeName) {

            return res.status(400).json({
                success: false,
                message:
                    "Fee name is required."
            });
        }


        if (
            amount === undefined ||
            amount === null ||
            Number(amount) < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "A valid fee amount is required."
            });
        }


        const fee =
            await createFeeStructure({

                schoolId,

                sessionId,

                termId,

                classId:
                    classId || null,

                feeName,

                amount,

                description:
                    description || null,

                dueDate:
                    dueDate || null,

                status:
                    status || "active"

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
| Get Fee Structures
|--------------------------------------------------------------------------
| GET /api/fees/structures
|--------------------------------------------------------------------------
*/

async function getFeeStructures(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const {
            sessionId,
            termId,
            classId,
            status
        } = req.query;


        const fees =
            await findFeeStructures(

                schoolId,

                {
                    sessionId:
                        sessionId || null,

                    termId:
                        termId || null,

                    classId:
                        classId || null,

                    status:
                        status || null
                }

            );


        return res.status(200).json({

            success: true,

            count:
                fees.length,

            data: fees

        });

    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Fee Structure By ID
|--------------------------------------------------------------------------
| GET /api/fees/structures/:id
|--------------------------------------------------------------------------
*/

async function getFeeStructureById(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const feeId =
            req.params.id;


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
| Update Fee Structure
|--------------------------------------------------------------------------
| PUT /api/fees/structures/:id
|--------------------------------------------------------------------------
*/

async function updateFeeStructureController(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const feeId =
            req.params.id;

        const {
            feeName,
            amount,
            description,
            dueDate,
            status
        } = req.body;


        if (!feeName) {

            return res.status(400).json({

                success: false,

                message:
                    "Fee name is required."

            });

        }


        if (
            amount === undefined ||
            amount === null ||
            Number(amount) < 0
        ) {

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
                    feeName,

                    amount,

                    description:
                        description || null,

                    dueDate:
                        dueDate || null,

                    status:
                        status || "active"
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
| Delete Fee Structure
|--------------------------------------------------------------------------
| DELETE /api/fees/structures/:id
|--------------------------------------------------------------------------
*/

async function deleteFeeStructureController(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const feeId =
            req.params.id;


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
| Assign Fee To Student
|--------------------------------------------------------------------------
| POST /api/fees/student
|--------------------------------------------------------------------------
*/

async function assignFee(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const {
            studentId,
            feeStructureId,
            amount,
            dueDate,
            status
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


        const fee =
            await assignFeeToStudent({

                schoolId,

                studentId,

                feeStructureId,

                amount:
                    amount !== undefined
                        ? amount
                        : null,

                dueDate:
                    dueDate || null,

                status:
                    status || "unpaid"

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
| Get Student Fees
|--------------------------------------------------------------------------
| GET /api/fees/student/:studentId
|--------------------------------------------------------------------------
*/

async function getStudentFeesController(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const studentId =
            req.params.studentId;


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
                    sessionId || null,

                termId:
                    termId || null,

                status:
                    status || null

            });


        return res.status(200).json({

            success: true,

            count:
                fees.length,

            data: fees

        });

    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Student Fee By ID
|--------------------------------------------------------------------------
| GET /api/fees/student-records/:id
|--------------------------------------------------------------------------
*/

async function getStudentFeeByIdController(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const studentFeeId =
            req.params.id;


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
| Record Payment
|--------------------------------------------------------------------------
| POST /api/fees/payments
|--------------------------------------------------------------------------
*/

async function recordPaymentController(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const {
            studentFeeId,
            studentId,
            amount,
            paymentMethod,
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


        if (
            amount === undefined ||
            amount === null ||
            Number(amount) <= 0
        ) {

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

                amount,

                paymentMethod:
                    paymentMethod || "cash",

                reference:
                    reference || null,

                paymentDate:
                    paymentDate || null,

                receivedBy:
                    req.user.id,

                notes:
                    notes || null

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
| Refresh Student Fee Balance
|--------------------------------------------------------------------------
| PATCH /api/fees/student-records/:id/balance
|--------------------------------------------------------------------------
*/

async function refreshStudentFeeBalance(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const studentFeeId =
            req.params.id;


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
| Payment History
|--------------------------------------------------------------------------
| GET /api/fees/payments/:studentId
|--------------------------------------------------------------------------
*/

async function getPaymentHistoryController(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const studentId =
            req.params.studentId;

        const {
            studentFeeId
        } = req.query;


        const payments =
            await getPaymentHistory({

                schoolId,

                studentId,

                studentFeeId:
                    studentFeeId || null

            });


        return res.status(200).json({

            success: true,

            count:
                payments.length,

            data: payments

        });

    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Student Fee Summary
|--------------------------------------------------------------------------
| GET /api/fees/summary/student/:studentId
|--------------------------------------------------------------------------
*/

async function getStudentFeeSummaryController(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const studentId =
            req.params.studentId;

        const {
            sessionId,
            termId
        } = req.query;


        const summary =
            await getStudentFeeSummary({

                schoolId,

                studentId,

                sessionId:
                    sessionId || null,

                termId:
                    termId || null

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
| School Fee Summary
|--------------------------------------------------------------------------
| GET /api/fees/summary
|--------------------------------------------------------------------------
*/

async function getSchoolFeeSummaryController(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

        const {
            sessionId,
            termId
        } = req.query;


        const summary =
            await getSchoolFeeSummary(

                schoolId,

                {
                    sessionId:
                        sessionId || null,

                    termId:
                        termId || null
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
| Search Student Fees
|--------------------------------------------------------------------------
| GET /api/fees/search?q=
|--------------------------------------------------------------------------
*/

async function searchStudentFeesController(
    req,
    res,
    next
) {

    try {

        const schoolId =
            getSchoolId(req);

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

            count:
                results.length,

            data: results

        });

    } catch (error) {

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

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

    getStudentFees:
        getStudentFeesController,

    getStudentFeeById:
        getStudentFeeByIdController,

    recordPayment:
        recordPaymentController,

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