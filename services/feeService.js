```javascript
"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| FEE SERVICE
|--------------------------------------------------------------------------
| Business logic for:
| - Student fees
| - Fee structures
| - Payments
| - Balances
| - Fee statistics
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizePaymentStatus(status) {
    const value = String(status || "")
        .trim()
        .toLowerCase();

    if (value === "paid") {
        return "Paid";
    }

    if (
        value === "partial" ||
        value === "partially paid" ||
        value === "partially_paid"
    ) {
        return "Partially Paid";
    }

    if (value === "overpaid") {
        return "Overpaid";
    }

    return "Unpaid";
}


function validateAmount(amount, allowZero = true) {
    const value = Number(amount);

    if (
        !Number.isFinite(value) ||
        (allowZero ? value < 0 : value <= 0)
    ) {
        throw new Error(
            allowZero
                ? "A valid fee amount is required."
                : "Payment amount must be greater than zero."
        );
    }

    return value;
}


/*
|--------------------------------------------------------------------------
| Get Student Fees
|--------------------------------------------------------------------------
*/

async function getStudentFees(studentId, schoolId) {
    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const result = await query(
        `
        SELECT
            sf.*,
            fs.fee_name,
            fs.description AS fee_description,
            fs.amount AS structure_amount,
            fs.academic_session_id,
            fs.term_id,
            fs.class_id,
            s.first_name,
            s.last_name,
            s.admission_number
        FROM student_fees sf
        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id
        INNER JOIN students s
            ON s.id = sf.student_id
        WHERE sf.student_id = $1
          AND sf.school_id = $2
        ORDER BY sf.created_at DESC
        `,
        [studentId, schoolId]
    );

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Fee By ID
|--------------------------------------------------------------------------
*/

async function getFeeById(feeId, schoolId) {
    if (!feeId) {
        throw new Error("Fee ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const result = await query(
        `
        SELECT
            sf.*,
            fs.fee_name,
            fs.description AS fee_description,
            fs.amount AS structure_amount,
            fs.academic_session_id,
            fs.term_id,
            fs.class_id,
            s.first_name,
            s.last_name,
            s.admission_number
        FROM student_fees sf
        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id
        INNER JOIN students s
            ON s.id = sf.student_id
        WHERE sf.id = $1
          AND sf.school_id = $2
        LIMIT 1
        `,
        [feeId, schoolId]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Create Fee
|--------------------------------------------------------------------------
*/

async function createFee({
    schoolId,
    studentId,
    sessionId = null,
    termId = null,
    feeStructureId = null,
    feeType = null,
    amount,
    dueDate = null,
    description = null,
    status = "Unpaid"
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    const feeAmount = validateAmount(amount);

    let structureId = feeStructureId;

    /*
    |----------------------------------------------------------------------
    | Verify supplied fee structure
    |----------------------------------------------------------------------
    */

    if (structureId) {
        const structureResult = await query(
            `
            SELECT id
            FROM fee_structures
            WHERE id = $1
              AND school_id = $2
            LIMIT 1
            `,
            [structureId, schoolId]
        );

        if (!structureResult.rows[0]) {
            throw new Error("Fee structure not found.");
        }
    }


    /*
    |----------------------------------------------------------------------
    | Find structure by fee name
    |----------------------------------------------------------------------
    */

    if (!structureId && feeType) {
        const structureResult = await query(
            `
            SELECT id
            FROM fee_structures
            WHERE school_id = $1
              AND fee_name ILIKE $2
              AND (
                    $3::UUID IS NULL
                    OR academic_session_id = $3
                  )
              AND (
                    $4::UUID IS NULL
                    OR term_id = $4
                  )
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [
                schoolId,
                String(feeType).trim(),
                sessionId,
                termId
            ]
        );

        structureId =
            structureResult.rows[0]?.id || null;
    }


    /*
    |----------------------------------------------------------------------
    | Create structure when necessary
    |----------------------------------------------------------------------
    */

    if (!structureId) {
        if (!sessionId) {
            throw new Error(
                "Academic session is required to create a fee structure."
            );
        }

        if (!feeType || !String(feeType).trim()) {
            throw new Error("Fee name is required.");
        }

        const structureResult = await query(
            `
            INSERT INTO fee_structures (
                school_id,
                academic_session_id,
                term_id,
                fee_name,
                description,
                amount
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            `,
            [
                schoolId,
                sessionId,
                termId,
                String(feeType).trim(),
                description,
                feeAmount
            ]
        );

        structureId = structureResult.rows[0].id;
    }


    /*
    |----------------------------------------------------------------------
    | Create student fee
    |----------------------------------------------------------------------
    */

    const normalizedStatus =
        normalizePaymentStatus(status);

    const result = await query(
        `
        INSERT INTO student_fees (
            student_id,
            school_id,
            fee_structure_id,
            amount_due,
            amount_paid,
            balance,
            payment_status
        )
        VALUES ($1, $2, $3, $4, 0, $4, $5)
        RETURNING *
        `,
        [
            studentId,
            schoolId,
            structureId,
            feeAmount,
            normalizedStatus
        ]
    );

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Record Payment
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
    receivedBy = null,
    receiptNumber = null
}) {
    if (!feeId) {
        throw new Error("Fee ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const paymentAmount =
        validateAmount(amount, false);

    const feeResult = await query(
        `
        SELECT
            id,
            student_id,
            amount_due,
            amount_paid,
            balance
        FROM student_fees
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
        `,
        [feeId, schoolId]
    );

    const fee = feeResult.rows[0];

    if (!fee) {
        return null;
    }

    const currentBalance =
        Number(fee.balance || 0);

    if (paymentAmount > currentBalance) {
        throw new Error(
            "Payment amount cannot be greater than the outstanding balance."
        );
    }

    const newAmountPaid =
        Number(fee.amount_paid || 0) +
        paymentAmount;

    const newBalance =
        Math.max(
            Number(fee.amount_due || 0) -
            newAmountPaid,
            0
        );

    const paymentStatus =
        newBalance <= 0
            ? "Paid"
            : newAmountPaid > 0
                ? "Partially Paid"
                : "Unpaid";

    const finalReceiptNumber =
        receiptNumber ||
        `RCT-${Date.now()}-${Math.floor(
            Math.random() * 1000
        )}`;

    const paymentResult = await query(
        `
        INSERT INTO payments (
            student_id,
            school_id,
            student_fee_id,
            receipt_number,
            amount,
            payment_method,
            transaction_reference,
            payment_date,
            received_by,
            notes
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            COALESCE($8, CURRENT_DATE),
            $9,
            $10
        )
        RETURNING *
        `,
        [
            fee.student_id,
            schoolId,
            feeId,
            finalReceiptNumber,
            paymentAmount,
            paymentMethod,
            reference,
            paymentDate,
            receivedBy,
            notes
        ]
    );

    await query(
        `
        UPDATE student_fees
        SET
            amount_paid = $1,
            balance = $2,
            payment_status = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
          AND school_id = $5
        `,
        [
            newAmountPaid,
            newBalance,
            paymentStatus,
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

async function getPaymentHistory(feeId, schoolId) {
    if (!feeId) {
        throw new Error("Fee ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const result = await query(
        `
        SELECT
            p.*,
            u.username AS received_by_username
        FROM payments p
        LEFT JOIN users u
            ON u.id = p.received_by
        WHERE p.student_fee_id = $1
          AND p.school_id = $2
        ORDER BY
            p.payment_date DESC,
            p.created_at DESC
        `,
        [feeId, schoolId]
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

    const result = await query(
        `
        SELECT
            COALESCE(SUM(amount_due), 0) AS total_amount,
            COALESCE(SUM(amount_paid), 0) AS total_paid,
            COALESCE(SUM(balance), 0) AS total_balance
        FROM student_fees
        WHERE student_id = $1
          AND school_id = $2
        `,
        [studentId, schoolId]
    );

    const row = result.rows[0];

    return {
        totalAmount: Number(row.total_amount || 0),
        totalPaid: Number(row.total_paid || 0),
        totalBalance: Number(row.total_balance || 0)
    };
}


/*
|--------------------------------------------------------------------------
| Get Outstanding Fees
|--------------------------------------------------------------------------
*/

async function getOutstandingFees(schoolId) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const result = await query(
        `
        SELECT
            sf.*,
            fs.fee_name,
            fs.description AS fee_description,
            fs.academic_session_id,
            fs.term_id,
            fs.class_id,
            s.first_name,
            s.last_name,
            s.admission_number
        FROM student_fees sf
        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id
        INNER JOIN students s
            ON s.id = sf.student_id
        WHERE sf.school_id = $1
          AND sf.balance > 0
        ORDER BY
            s.last_name ASC,
            s.first_name ASC,
            sf.created_at DESC
        `,
        [schoolId]
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
            COUNT(*)::INTEGER AS total_records,

            COALESCE(SUM(sf.amount_due), 0)
                AS total_amount,

            COALESCE(SUM(sf.amount_paid), 0)
                AS total_paid,

            COALESCE(SUM(sf.balance), 0)
                AS total_balance,

            COUNT(
                CASE
                    WHEN sf.payment_status = 'Paid'
                    THEN 1
                END
            )::INTEGER AS paid_records,

            COUNT(
                CASE
                    WHEN sf.payment_status = 'Partially Paid'
                    THEN 1
                END
            )::INTEGER AS partial_records,

            COUNT(
                CASE
                    WHEN sf.payment_status = 'Unpaid'
                    THEN 1
                END
            )::INTEGER AS unpaid_records

        FROM student_fees sf

        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id

        WHERE sf.school_id = $1
    `;

    const values = [schoolId];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND fs.academic_session_id = $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND fs.term_id = $${values.length}
        `;
    }

    const result =
        await query(sql, values);

    const row = result.rows[0] || {};

    return {
        totalRecords:
            Number(row.total_records || 0),

        totalAmount:
            Number(row.total_amount || 0),

        totalPaid:
            Number(row.total_paid || 0),

        totalBalance:
            Number(row.total_balance || 0),

        paidRecords:
            Number(row.paid_records || 0),

        partialRecords:
            Number(row.partial_records || 0),

        unpaidRecords:
            Number(row.unpaid_records || 0)
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
            fs.fee_name AS fee_type,

            COUNT(sf.id)::INTEGER
                AS record_count,

            COALESCE(SUM(sf.amount_due), 0)
                AS total_amount,

            COALESCE(SUM(sf.amount_paid), 0)
                AS total_paid,

            COALESCE(SUM(sf.balance), 0)
                AS total_balance

        FROM student_fees sf

        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id

        WHERE sf.school_id = $1
    `;

    const values = [schoolId];

    if (sessionId) {
        values.push(sessionId);

        sql += `
            AND fs.academic_session_id = $${values.length}
        `;
    }

    if (termId) {
        values.push(termId);

        sql += `
            AND fs.term_id = $${values.length}
        `;
    }

    sql += `
        GROUP BY fs.fee_name
        ORDER BY fs.fee_name ASC
    `;

    const result =
        await query(sql, values);

    return result.rows.map(row => ({
        feeType: row.fee_type,
        recordCount:
            Number(row.record_count || 0),
        totalAmount:
            Number(row.total_amount || 0),
        totalPaid:
            Number(row.total_paid || 0),
        totalBalance:
            Number(row.total_balance || 0)
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

    const result = await query(
        `
        SELECT
            sf.*,
            fs.fee_name,
            fs.description AS fee_description,
            fs.academic_session_id,
            fs.term_id,
            fs.class_id,
            s.first_name,
            s.last_name,
            s.admission_number
        FROM student_fees sf
        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id
        INNER JOIN students s
            ON s.id = sf.student_id
        WHERE sf.school_id = $1
          AND (
                s.first_name ILIKE $2
                OR s.last_name ILIKE $2
                OR s.admission_number ILIKE $2
                OR fs.fee_name ILIKE $2
              )
        ORDER BY
            s.last_name ASC,
            s.first_name ASC
        LIMIT 100
        `,
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

    if (!data || typeof data !== "object") {
        throw new Error("Fee update data is required.");
    }

    const allowedFields = {
        amountDue: "amount_due",
        amount: "amount_due",
        paymentStatus: "payment_status",
        status: "payment_status",
        feeStructureId: "fee_structure_id"
    };

    const updates = [];
    const values = [];

    for (const key of Object.keys(data)) {
        if (
            !allowedFields[key] ||
            data[key] === undefined
        ) {
            continue;
        }

        let value = data[key];

        if (
            allowedFields[key] ===
            "payment_status"
        ) {
            value =
                normalizePaymentStatus(value);
        }

        if (
            allowedFields[key] ===
            "amount_due"
        ) {
            value = validateAmount(value);
        }

        values.push(value);

        updates.push(
            `${allowedFields[key]} = $${values.length}`
        );
    }

    if (!updates.length) {
        throw new Error(
            "No valid fields supplied for update."
        );
    }

    /*
    |----------------------------------------------------------------------
    | If amount_due changes, recalculate balance.
    |----------------------------------------------------------------------
    */

    const amountIndex =
        updates.findIndex(
            item => item.startsWith("amount_due =")
        );

    if (amountIndex !== -1) {
        const amountValue =
            values[amountIndex];

        updates.push(
            `balance = GREATEST($${values.length + 1} - amount_paid, 0)`
        );

        values.push(amountValue);
    }

    values.push(feeId);
    const feeIdPosition = values.length;

    values.push(schoolId);
    const schoolIdPosition = values.length;

    const result = await query(
        `
        UPDATE student_fees
        SET
            ${updates.join(", ")},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $${feeIdPosition}
          AND school_id = $${schoolIdPosition}
        RETURNING *
        `,
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

    const result = await query(
        `
        DELETE FROM student_fees
        WHERE id = $1
          AND school_id = $2
        RETURNING *
        `,
        [feeId, schoolId]
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