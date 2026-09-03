"use strict";

const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| FEE MODEL
|--------------------------------------------------------------------------
| Handles:
| - Fee structures
| - Student fee assignments
| - Payments
| - Fee balances
| - Payment history
| - Student fee summaries
| - School fee summaries
| - Fee searching
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CREATE FEE STRUCTURE
|--------------------------------------------------------------------------
*/

async function createFeeStructure({
    schoolId,
    sessionId,
    termId,
    classId = null,
    feeName,
    amount,
    description = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!sessionId) {
        throw new Error("Academic session ID is required.");
    }

    if (!feeName || !String(feeName).trim()) {
        throw new Error("Fee name is required.");
    }

    const feeAmount = Number(amount);

    if (!Number.isFinite(feeAmount) || feeAmount < 0) {
        throw new Error("A valid fee amount is required.");
    }

    const result = await query(
        `
        INSERT INTO fee_structures (
            school_id,
            academic_session_id,
            term_id,
            class_id,
            fee_name,
            amount,
            description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [
            schoolId,
            sessionId,
            termId,
            classId,
            String(feeName).trim(),
            feeAmount,
            description
        ]
    );

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| FIND FEE STRUCTURE BY ID
|--------------------------------------------------------------------------
*/

async function findFeeStructureById(
    feeStructureId,
    schoolId = null
) {
    if (!feeStructureId) {
        throw new Error("Fee structure ID is required.");
    }

    let sql = `
        SELECT
            fs.*,
            c.class_name,
            s.session_name,
            t.term_name
        FROM fee_structures fs
        LEFT JOIN classes c
            ON c.id = fs.class_id
        LEFT JOIN academic_sessions s
            ON s.id = fs.academic_session_id
        LEFT JOIN terms t
            ON t.id = fs.term_id
        WHERE fs.id = $1
    `;

    const values = [feeStructureId];

    if (schoolId) {
        values.push(schoolId);

        sql += `
            AND fs.school_id = $${values.length}
        `;
    }

    sql += `
        LIMIT 1
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| FIND FEE STRUCTURES
|--------------------------------------------------------------------------
*/

async function findFeeStructures(
    schoolId,
    {
        sessionId = null,
        termId = null,
        classId = null
    } = {}
) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            fs.*,
            c.class_name,
            s.session_name,
            t.term_name
        FROM fee_structures fs
        LEFT JOIN classes c
            ON c.id = fs.class_id
        LEFT JOIN academic_sessions s
            ON s.id = fs.academic_session_id
        LEFT JOIN terms t
            ON t.id = fs.term_id
        WHERE fs.school_id = $1
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

    if (classId) {
        values.push(classId);

        sql += `
            AND fs.class_id = $${values.length}
        `;
    }

    sql += `
        ORDER BY fs.fee_name ASC
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| UPDATE FEE STRUCTURE
|--------------------------------------------------------------------------
*/

async function updateFeeStructure(
    feeStructureId,
    schoolId,
    {
        feeName,
        amount,
        description = null
    }
) {
    if (!feeStructureId) {
        throw new Error("Fee structure ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const feeAmount = Number(amount);

    if (!Number.isFinite(feeAmount) || feeAmount < 0) {
        throw new Error("A valid fee amount is required.");
    }

    if (!feeName || !String(feeName).trim()) {
        throw new Error("Fee name is required.");
    }

    const result = await query(
        `
        UPDATE fee_structures
        SET
            fee_name = $1,
            amount = $2,
            description = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
          AND school_id = $5
        RETURNING *
        `,
        [
            String(feeName).trim(),
            feeAmount,
            description,
            feeStructureId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| DELETE FEE STRUCTURE
|--------------------------------------------------------------------------
*/

async function deleteFeeStructure(
    feeStructureId,
    schoolId
) {
    if (!feeStructureId) {
        throw new Error("Fee structure ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const result = await query(
        `
        DELETE FROM fee_structures
        WHERE id = $1
          AND school_id = $2
        RETURNING *
        `,
        [
            feeStructureId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| ASSIGN FEE TO STUDENT
|--------------------------------------------------------------------------
*/

async function assignFeeToStudent({
    schoolId,
    studentId,
    feeStructureId,
    amount = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    if (!feeStructureId) {
        throw new Error("Fee structure ID is required.");
    }

    let feeAmount = amount;

    if (feeAmount === null || feeAmount === undefined) {
        const fee = await findFeeStructureById(
            feeStructureId,
            schoolId
        );

        if (!fee) {
            throw new Error("Fee structure not found.");
        }

        feeAmount = fee.amount;
    }

    feeAmount = Number(feeAmount);

    if (!Number.isFinite(feeAmount) || feeAmount < 0) {
        throw new Error("A valid fee amount is required.");
    }

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
        VALUES (
            $1,
            $2,
            $3,
            $4,
            0,
            $4,
            'Unpaid'
        )
        RETURNING *
        `,
        [
            studentId,
            schoolId,
            feeStructureId,
            feeAmount
        ]
    );

    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| FIND STUDENT FEE BY ID
|--------------------------------------------------------------------------
*/

async function findStudentFeeById(
    studentFeeId,
    schoolId = null
) {
    if (!studentFeeId) {
        throw new Error("Student fee ID is required.");
    }

    let sql = `
        SELECT
            sf.*,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name,
            fs.fee_name,
            fs.description AS fee_description,
            fs.amount AS structure_amount,
            fs.academic_session_id,
            fs.term_id,
            fs.class_id
        FROM student_fees sf
        INNER JOIN students s
            ON s.id = sf.student_id
        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id
        WHERE sf.id = $1
    `;

    const values = [studentFeeId];

    if (schoolId) {
        values.push(schoolId);

        sql += `
            AND sf.school_id = $${values.length}
        `;
    }

    sql += `
        LIMIT 1
    `;

    const result = await query(sql, values);

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| FIND STUDENT FEES
|--------------------------------------------------------------------------
*/

async function findStudentFees({
    schoolId,
    studentId,
    sessionId = null,
    termId = null,
    paymentStatus = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    let sql = `
        SELECT
            sf.*,
            fs.fee_name,
            fs.description,
            fs.academic_session_id,
            fs.term_id,
            fs.class_id
        FROM student_fees sf
        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id
        WHERE sf.school_id = $1
          AND sf.student_id = $2
    `;

    const values = [
        schoolId,
        studentId
    ];

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

    if (paymentStatus) {
        values.push(
            normalizePaymentStatus(paymentStatus)
        );

        sql += `
            AND sf.payment_status = $${values.length}
        `;
    }

    sql += `
        ORDER BY sf.created_at DESC
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| RECORD PAYMENT
|--------------------------------------------------------------------------
*/

async function recordPayment({
    schoolId,
    studentFeeId,
    studentId,
    amount,
    paymentMethod = "cash",
    reference = null,
    paymentDate = null,
    receivedBy = null,
    notes = null,
    receiptNumber = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentFeeId) {
        throw new Error("Student fee ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    const paymentAmount = Number(amount);

    if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount <= 0
    ) {
        throw new Error(
            "Payment amount must be greater than zero."
        );
    }

    const fee = await findStudentFeeById(
        studentFeeId,
        schoolId
    );

    if (!fee) {
        throw new Error("Student fee record not found.");
    }

    if (String(fee.student_id) !== String(studentId)) {
        throw new Error(
            "Student does not match the selected fee."
        );
    }

    const currentBalance =
        Number(fee.balance || 0);

    if (paymentAmount > currentBalance) {
        throw new Error(
            "Payment amount cannot be greater than the outstanding balance."
        );
    }

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
            studentId,
            schoolId,
            studentFeeId,
            finalReceiptNumber,
            paymentAmount,
            paymentMethod,
            reference,
            paymentDate,
            receivedBy,
            notes
        ]
    );

    await updateStudentFeeBalance(
        studentFeeId,
        schoolId
    );

    return paymentResult.rows[0];
}


/*
|--------------------------------------------------------------------------
| UPDATE STUDENT FEE BALANCE
|--------------------------------------------------------------------------
*/

async function updateStudentFeeBalance(
    studentFeeId,
    schoolId
) {
    if (!studentFeeId) {
        throw new Error("Student fee ID is required.");
    }

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    const result = await query(
        `
        UPDATE student_fees sf
        SET
            amount_paid = COALESCE(
                (
                    SELECT SUM(p.amount)
                    FROM payments p
                    WHERE p.student_fee_id = sf.id
                      AND p.school_id = sf.school_id
                ),
                0
            ),

            balance = GREATEST(
                sf.amount_due -
                COALESCE(
                    (
                        SELECT SUM(p.amount)
                        FROM payments p
                        WHERE p.student_fee_id = sf.id
                          AND p.school_id = sf.school_id
                    ),
                    0
                ),
                0
            ),

            payment_status =
                CASE
                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = sf.school_id
                        ),
                        0
                    ) >= sf.amount_due
                    THEN 'Paid'

                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = sf.school_id
                        ),
                        0
                    ) > 0
                    THEN 'Partially Paid'

                    ELSE 'Unpaid'
                END,

            updated_at = CURRENT_TIMESTAMP

        WHERE sf.id = $1
          AND sf.school_id = $2

        RETURNING *
        `,
        [
            studentFeeId,
            schoolId
        ]
    );

    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| GET PAYMENT HISTORY
|--------------------------------------------------------------------------
*/

async function getPaymentHistory({
    schoolId,
    studentId,
    studentFeeId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    let sql = `
        SELECT
            p.*,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name,
            sf.amount_due AS fee_amount,
            sf.amount_paid,
            sf.balance,
            sf.payment_status,
            fs.fee_name
        FROM payments p
        INNER JOIN students s
            ON s.id = p.student_id
        INNER JOIN student_fees sf
            ON sf.id = p.student_fee_id
        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id
        WHERE p.school_id = $1
          AND p.student_id = $2
    `;

    const values = [
        schoolId,
        studentId
    ];

    if (studentFeeId) {
        values.push(studentFeeId);

        sql += `
            AND p.student_fee_id = $${values.length}
        `;
    }

    sql += `
        ORDER BY
            p.payment_date DESC,
            p.created_at DESC
    `;

    const result = await query(sql, values);

    return result.rows;
}


/*
|--------------------------------------------------------------------------
| GET STUDENT FEE SUMMARY
|--------------------------------------------------------------------------
*/

async function getStudentFeeSummary({
    schoolId,
    studentId,
    sessionId = null,
    termId = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!studentId) {
        throw new Error("Student ID is required.");
    }

    let sql = `
        SELECT
            COALESCE(SUM(sf.amount_due), 0)
                AS total_fees,

            COALESCE(SUM(sf.amount_paid), 0)
                AS total_paid,

            COALESCE(SUM(sf.balance), 0)
                AS total_balance,

            COUNT(sf.id)::INTEGER
                AS fee_count,

            COUNT(
                CASE
                    WHEN sf.payment_status = 'Paid'
                    THEN 1
                END
            )::INTEGER AS paid_count,

            COUNT(
                CASE
                    WHEN sf.payment_status = 'Partially Paid'
                    THEN 1
                END
            )::INTEGER AS partial_count,

            COUNT(
                CASE
                    WHEN sf.payment_status = 'Unpaid'
                    THEN 1
                END
            )::INTEGER AS unpaid_count

        FROM student_fees sf

        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id

        WHERE sf.school_id = $1
          AND sf.student_id = $2
    `;

    const values = [
        schoolId,
        studentId
    ];

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

    const result = await query(sql, values);

    const row = result.rows[0] || {};

    return {
        totalFees: Number(row.total_fees || 0),
        totalPaid: Number(row.total_paid || 0),
        totalBalance: Number(row.total_balance || 0),
        feeCount: Number(row.fee_count || 0),
        paidCount: Number(row.paid_count || 0),
        partialCount: Number(row.partial_count || 0),
        unpaidCount: Number(row.unpaid_count || 0)
    };
}


/*
|--------------------------------------------------------------------------
| GET SCHOOL FEE SUMMARY
|--------------------------------------------------------------------------
*/

async function getSchoolFeeSummary(
    schoolId,
    {
        sessionId = null,
        termId = null
    } = {}
) {
    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    let sql = `
        SELECT
            COALESCE(SUM(sf.amount_due), 0)
                AS total_expected,

            COALESCE(SUM(sf.amount_paid), 0)
                AS total_collected,

            COALESCE(SUM(sf.balance), 0)
                AS total_outstanding,

            COUNT(sf.id)::INTEGER
                AS total_fee_records,

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

    const result = await query(sql, values);

    const row = result.rows[0] || {};

    return {
        totalExpected:
            Number(row.total_expected || 0),

        totalCollected:
            Number(row.total_collected || 0),

        totalOutstanding:
            Number(row.total_outstanding || 0),

        totalFeeRecords:
            Number(row.total_fee_records || 0),

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
| SEARCH STUDENT FEES
|--------------------------------------------------------------------------
*/

async function searchStudentFees(
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
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name,
            fs.fee_name,
            fs.academic_session_id,
            fs.term_id
        FROM student_fees sf
        INNER JOIN students s
            ON s.id = sf.student_id
        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id
        WHERE sf.school_id = $1
          AND (
                s.admission_number ILIKE $2
                OR s.first_name ILIKE $2
                OR s.middle_name ILIKE $2
                OR s.last_name ILIKE $2
                OR fs.fee_name ILIKE $2
                OR sf.payment_status ILIKE $2
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
| NORMALIZE PAYMENT STATUS
|--------------------------------------------------------------------------
*/

function normalizePaymentStatus(status) {
    const value =
        String(status || "")
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

    return "Unpaid";
}


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
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
};