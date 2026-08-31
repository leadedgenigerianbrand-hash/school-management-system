const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Fee Service
|--------------------------------------------------------------------------
|
| Handles fee-related business logic for the school management system.
|
| Responsibilities:
|
| - Get student fee records
| - Calculate student fee balances
| - Get school fee statistics
| - Record payments
| - Get payment history
| - Get outstanding fees
| - Get fee summaries
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Get Student Fees
|--------------------------------------------------------------------------
*/

async function getStudentFees(
    studentId,
    schoolId
) {

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT
            f.*,

            s.first_name,
            s.last_name,
            s.admission_number

        FROM fees f

        INNER JOIN students s
            ON s.id = f.student_id

        WHERE f.student_id = $1

          AND f.school_id = $2

        ORDER BY
            f.created_at DESC
    `;

    const result = await query(
        sql,
        [
            studentId,
            schoolId
        ]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Fee By ID
|--------------------------------------------------------------------------
*/

async function getFeeById(
    feeId,
    schoolId
) {

    if (!feeId) {
        throw new Error("Fee ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT
            f.*,

            s.first_name,
            s.last_name,
            s.admission_number

        FROM fees f

        INNER JOIN students s
            ON s.id = f.student_id

        WHERE f.id = $1

          AND f.school_id = $2

        LIMIT 1
    `;

    const result = await query(
        sql,
        [
            feeId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Create Fee Record
|--------------------------------------------------------------------------
*/

async function createFee({
    schoolId,
    studentId,
    sessionId,
    termId = null,
    feeType,
    amount,
    dueDate = null,
    description = null,
    status = "unpaid"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!feeType || !feeType.trim()) {
        throw new Error("Fee type is required.");
    }

    if (
        amount === undefined ||
        amount === null ||
        Number(amount) < 0
    ) {
        throw new Error("A valid fee amount is required.");
    }

    const sql = `
        INSERT INTO fees (
            school_id,
            student_id,
            session_id,
            term_id,
            fee_type,
            amount,
            amount_paid,
            balance,
            due_date,
            description,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            0,
            $6,
            $7,
            $8,
            $9
        )
        RETURNING *
    `;

    const result = await query(
        sql,
        [
            schoolId,
            studentId,
            sessionId || null,
            termId || null,
            feeType.trim(),
            Number(amount),
            dueDate,
            description,
            status
        ]
    );

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Record Fee Payment
|--------------------------------------------------------------------------
*/

async function recordPayment({
    feeId,
    schoolId,
    amount,
    paymentMethod = "cash",
    reference = null,
    paymentDate = null,
    notes = null,
    receivedBy = null
}) {

    if (!feeId) {
        throw new Error("Fee ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (
        amount === undefined ||
        amount === null ||
        Number(amount) <= 0
    ) {
        throw new Error("Payment amount must be greater than zero.");
    }

    const clientResult = await query(
        `
            SELECT
                id,
                amount,
                amount_paid,
                balance

            FROM fees

            WHERE id = $1

              AND school_id = $2

            LIMIT 1
        `,
        [
            feeId,
            schoolId
        ]
    );

    const fee = clientResult.rows[0];

    if (!fee) {
        return null;
    }

    const paymentAmount = Number(amount);
    const currentBalance = Number(fee.balance);

    if (paymentAmount > currentBalance) {
        throw new Error(
            "Payment amount cannot be greater than the outstanding balance."
        );
    }

    const newAmountPaid =
        Number(fee.amount_paid) + paymentAmount;

    const newBalance =
        Number(fee.amount) - newAmountPaid;

    let newStatus = "partial";

    if (newBalance <= 0) {
        newStatus = "paid";
    }

    const paymentSql = `
        INSERT INTO fee_payments (
            fee_id,
            school_id,
            amount,
            payment_method,
            reference,
            payment_date,
            notes,
            received_by
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            COALESCE($6, CURRENT_DATE),
            $7,
            $8
        )
        RETURNING *
    `;

    const paymentResult = await query(
        paymentSql,
        [
            feeId,
            schoolId,
            paymentAmount,
            paymentMethod,
            reference,
            paymentDate,
            notes,
            receivedBy
        ]
    );

    await query(
        `
            UPDATE fees

            SET
                amount_paid = $1,
                balance = $2,
                status = $3,
                updated_at = NOW()

            WHERE id = $4

              AND school_id = $5
        `,
        [
            newAmountPaid,
            newBalance,
            newStatus,
            feeId,
            schoolId
        ]
    );

    return paymentResult.rows[0];
}


/*
|--------------------------------------------------------------------------
| Get Payment History
|--------------------------------------------------------------------------
*/

async function getPaymentHistory(
    feeId,
    schoolId
) {

    if (!feeId) {
        throw new Error("Fee ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT *

        FROM fee_payments

        WHERE fee_id = $1

          AND school_id = $2

        ORDER BY
            payment_date DESC,
            created_at DESC
    `;

    const result = await query(
        sql,
        [
            feeId,
            schoolId
        ]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Student Fee Balance
|--------------------------------------------------------------------------
*/

async function getStudentFeeBalance(
    studentId,
    schoolId
) {

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT

            COALESCE(
                SUM(amount),
                0
            ) AS total_amount,

            COALESCE(
                SUM(amount_paid),
                0
            ) AS total_paid,

            COALESCE(
                SUM(balance),
                0
            ) AS total_balance

        FROM fees

        WHERE student_id = $1

          AND school_id = $2
    `;

    const result = await query(
        sql,
        [
            studentId,
            schoolId
        ]
    );

    const row = result.rows[0];

    return {
        totalAmount: Number(row.total_amount),
        totalPaid: Number(row.total_paid),
        totalBalance: Number(row.total_balance)
    };
}


/*
|--------------------------------------------------------------------------
| Get Outstanding Fees
|--------------------------------------------------------------------------
*/

async function getOutstandingFees(
    schoolId
) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        SELECT

            f.*,

            s.first_name,
            s.last_name,
            s.admission_number

        FROM fees f

        INNER JOIN students s
            ON s.id = f.student_id

        WHERE f.school_id = $1

          AND f.balance > 0

        ORDER BY
            f.due_date ASC NULLS LAST,
            s.last_name ASC,
            s.first_name ASC
    `;

    const result = await query(
        sql,
        [
            schoolId
        ]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Fee Statistics
|--------------------------------------------------------------------------
*/

async function getFeeStatistics(
    schoolId,
    sessionId = null,
    termId = null
) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT

            COUNT(*)::INTEGER
                AS total_records,

            COALESCE(
                SUM(amount),
                0
            ) AS total_amount,

            COALESCE(
                SUM(amount_paid),
                0
            ) AS total_paid,

            COALESCE(
                SUM(balance),
                0
            ) AS total_balance,

            COUNT(
                CASE
                    WHEN status = 'paid'
                    THEN 1
                END
            )::INTEGER AS paid_records,

            COUNT(
                CASE
                    WHEN status = 'partial'
                    THEN 1
                END
            )::INTEGER AS partial_records,

            COUNT(
                CASE
                    WHEN status = 'unpaid'
                    THEN 1
                END
            )::INTEGER AS unpaid_records

        FROM fees

        WHERE school_id = $1
    `;

    const values = [
        schoolId
    ];

    if (sessionId) {

        values.push(sessionId);

        sql += `
            AND session_id = $${values.length}
        `;
    }

    if (termId) {

        values.push(termId);

        sql += `
            AND term_id = $${values.length}
        `;
    }

    const result = await query(
        sql,
        values
    );

    const row = result.rows[0];

    return {
        totalRecords:
            Number(row.total_records),

        totalAmount:
            Number(row.total_amount),

        totalPaid:
            Number(row.total_paid),

        totalBalance:
            Number(row.total_balance),

        paidRecords:
            Number(row.paid_records),

        partialRecords:
            Number(row.partial_records),

        unpaidRecords:
            Number(row.unpaid_records)
    };
}


/*
|--------------------------------------------------------------------------
| Get Fee Summary By Type
|--------------------------------------------------------------------------
*/

async function getFeeSummaryByType(
    schoolId,
    sessionId = null,
    termId = null
) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT

            fee_type,

            COUNT(*)::INTEGER
                AS record_count,

            COALESCE(
                SUM(amount),
                0
            ) AS total_amount,

            COALESCE(
                SUM(amount_paid),
                0
            ) AS total_paid,

            COALESCE(
                SUM(balance),
                0
            ) AS total_balance

        FROM fees

        WHERE school_id = $1
    `;

    const values = [
        schoolId
    ];

    if (sessionId) {

        values.push(sessionId);

        sql += `
            AND session_id = $${values.length}
        `;
    }

    if (termId) {

        values.push(termId);

        sql += `
            AND term_id = $${values.length}
        `;
    }

    sql += `
        GROUP BY fee_type

        ORDER BY fee_type ASC
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows.map(row => ({
        feeType: row.fee_type,
        recordCount: Number(row.record_count),
        totalAmount: Number(row.total_amount),
        totalPaid: Number(row.total_paid),
        totalBalance: Number(row.total_balance)
    }));
}


/*
|--------------------------------------------------------------------------
| Search Fees
|--------------------------------------------------------------------------
*/

async function searchFees(
    searchTerm,
    schoolId
) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const term =
        String(searchTerm || "").trim();

    if (!term) {
        return [];
    }

    const sql = `
        SELECT

            f.*,

            s.first_name,
            s.last_name,
            s.admission_number

        FROM fees f

        INNER JOIN students s
            ON s.id = f.student_id

        WHERE f.school_id = $1

          AND (
                s.first_name ILIKE $2
                OR s.last_name ILIKE $2
                OR s.admission_number ILIKE $2
                OR f.fee_type ILIKE $2
              )

        ORDER BY
            s.last_name ASC,
            s.first_name ASC

        LIMIT 100
    `;

    const result = await query(
        sql,
        [
            schoolId,
            `%${term}%`
        ]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Update Fee
|--------------------------------------------------------------------------
*/

async function updateFee(
    feeId,
    schoolId,
    data
) {

    if (!feeId) {
        throw new Error("Fee ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const allowedFields = {
        feeType: "fee_type",
        amount: "amount",
        dueDate: "due_date",
        description: "description",
        status: "status",
        sessionId: "session_id",
        termId: "term_id"
    };

    const updates = [];
    const values = [];

    for (const key of Object.keys(data || {})) {

        if (
            allowedFields[key] &&
            data[key] !== undefined
        ) {

            values.push(data[key]);

            updates.push(
                `${allowedFields[key]} = $${values.length}`
            );
        }
    }

    if (updates.length === 0) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }

    values.push(feeId);

    const feeIdPosition = values.length;

    values.push(schoolId);

    const schoolIdPosition = values.length;

    const sql = `
        UPDATE fees

        SET
            ${updates.join(", ")},
            updated_at = NOW()

        WHERE id = $${feeIdPosition}

          AND school_id = $${schoolIdPosition}

        RETURNING *
    `;

    const result = await query(
        sql,
        values
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Delete Fee
|--------------------------------------------------------------------------
*/

async function deleteFee(
    feeId,
    schoolId
) {

    if (!feeId) {
        throw new Error("Fee ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const sql = `
        DELETE FROM fees

        WHERE id = $1

          AND school_id = $2

        RETURNING *
    `;

    const result = await query(
        sql,
        [
            feeId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    getStudentFees,

    getFeeById,

    createFee,

    recordPayment,

    getPaymentHistory,

    getStudentFeeBalance,

    getOutstandingFees,

    getFeeStatistics,

    getFeeSummaryByType,

    searchFees,

    updateFee,

    deleteFee

};