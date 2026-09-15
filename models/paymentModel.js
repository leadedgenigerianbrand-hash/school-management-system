"use strict";

const { query } = require("../config/database");

function normalizePaymentMethod(paymentMethod) {
    if (
        paymentMethod === null ||
        paymentMethod === undefined
    ) {
        return null;
    }

    const value = String(paymentMethod).trim();

    if (!value) {
        return null;
    }

    return value;
}

function normalizePaymentDate(paymentDate) {
    if (!paymentDate) {
        return null;
    }

    const value = String(paymentDate).trim();

    return value || null;
}

function generateReceiptNumber() {
    const timestamp = Date.now();
    const random =
        Math.floor(1000 + Math.random() * 9000);

    return `RCT-${timestamp}-${random}`;
}

function normalizeLimit(
    limit,
    defaultValue = 50
) {
    const parsed =
        Number.parseInt(limit, 10);

    if (
        !Number.isFinite(parsed) ||
        parsed <= 0
    ) {
        return defaultValue;
    }

    return Math.min(parsed, 100);
}

function normalizeOffset(offset) {
    const parsed =
        Number.parseInt(offset, 10);

    if (
        !Number.isFinite(parsed) ||
        parsed < 0
    ) {
        return 0;
    }

    return parsed;
}

async function createPayment({
    schoolId,
    studentId,
    studentFeeId = null,
    amount,
    paymentMethod = "Cash",
    transactionReference = null,
    paymentDate = null,
    receivedBy = null,
    notes = null,
    receiptNumber = null
}) {
    if (!schoolId) {
        throw new Error("School ID is required.");
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

    const method =
        normalizePaymentMethod(paymentMethod);

    const date =
        normalizePaymentDate(paymentDate);

    const receipt =
        receiptNumber &&
        String(receiptNumber).trim()
            ? String(receiptNumber).trim()
            : generateReceiptNumber();

    const sql = `
        WITH valid_student AS (
            SELECT id
            FROM students
            WHERE id = $1
              AND school_id = $2
        ),

        valid_fee AS (
            SELECT sf.id
            FROM student_fees sf
            INNER JOIN valid_student s
                ON s.id = sf.student_id
            WHERE sf.id = $3
              AND sf.school_id = $2
        ),

        inserted_payment AS (
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
            SELECT
                $1,
                $2,
                CASE
                    WHEN $3::uuid IS NULL
                    THEN NULL
                    ELSE vf.id
                END,
                $4,
                $5,
                $6,
                $7,
                COALESCE(
                    $8::date,
                    CURRENT_DATE
                ),
                $9,
                $10
            FROM valid_student vs
            LEFT JOIN valid_fee vf
                ON TRUE
            WHERE $3::uuid IS NULL
               OR vf.id IS NOT NULL
            RETURNING *
        ),

        affected_fee AS (
            SELECT DISTINCT student_fee_id
            FROM inserted_payment
            WHERE student_fee_id IS NOT NULL
        ),

        recalculated_fee AS (
            UPDATE student_fees sf
            SET
                amount_paid = COALESCE(
                    (
                        SELECT SUM(p.amount)
                        FROM payments p
                        WHERE p.student_fee_id = sf.id
                          AND p.school_id = $2
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
                              AND p.school_id = $2
                        ),
                        0
                    ),
                    0
                ),

                payment_status = CASE
                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = $2
                        ),
                        0
                    ) > sf.amount_due
                    THEN 'Overpaid'

                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = $2
                        ),
                        0
                    ) = sf.amount_due
                    THEN 'Paid'

                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = $2
                        ),
                        0
                    ) > 0
                    THEN 'Partially Paid'

                    ELSE 'Unpaid'
                END,

                updated_at = CURRENT_TIMESTAMP

            WHERE sf.id IN (
                SELECT student_fee_id
                FROM affected_fee
            )
              AND sf.school_id = $2

            RETURNING sf.id
        )

        SELECT
            ip.id,
            ip.student_id,
            ip.school_id,
            ip.student_fee_id,
            ip.receipt_number,
            ip.amount,
            ip.payment_method,
            ip.transaction_reference,
            ip.payment_date,
            ip.received_by,
            ip.notes,
            ip.created_at
        FROM inserted_payment ip;
    `;

    const result = await query(sql, [
        studentId,
        schoolId,
        studentFeeId,
        receipt,
        paymentAmount,
        method,
        transactionReference,
        date,
        receivedBy,
        notes
    ]);

    if (!result.rows.length) {
        if (studentFeeId) {
            throw new Error(
                "Student fee account was not found for this student and school."
            );
        }

        throw new Error(
            "Student was not found in this school."
        );
    }

    return result.rows[0];
}

async function findPaymentById(
    paymentId,
    schoolId = null
) {
    if (!paymentId) {
        throw new Error(
            "Payment ID is required."
        );
    }

    const values = [paymentId];

    let schoolCondition = "";

    if (schoolId) {
        values.push(schoolId);

        schoolCondition =
            "AND p.school_id = $2";
    }

    const sql = `
        SELECT
            p.id,
            p.student_id,
            p.school_id,
            p.student_fee_id,
            p.receipt_number,
            p.amount,
            p.payment_method,
            p.transaction_reference,
            p.payment_date,
            p.received_by,
            p.notes,
            p.created_at,

            s.student_number,
            s.admission_number,
            s.first_name AS student_first_name,
            s.middle_name AS student_middle_name,
            s.last_name AS student_last_name,

            sf.amount_due,
            sf.amount_paid,
            sf.balance,
            sf.payment_status,

            u.first_name AS receiver_first_name,
            u.last_name AS receiver_last_name

        FROM payments p

        INNER JOIN students s
            ON s.id = p.student_id
           AND s.school_id = p.school_id

        LEFT JOIN student_fees sf
            ON sf.id = p.student_fee_id
           AND sf.school_id = p.school_id

        LEFT JOIN users u
            ON u.id = p.received_by
           AND u.school_id = p.school_id

        WHERE p.id = $1
        ${schoolCondition}

        LIMIT 1;
    `;

    const result =
        await query(sql, values);

    return result.rows[0] || null;
}

async function findPayments(
    schoolId,
    {
        studentId = null,
        studentFeeId = null,
        paymentMethod = null,
        paymentDate = null,
        fromDate = null,
        toDate = null,
        search = null,
        limit = 50,
        offset = 0
    } = {}
) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const values = [schoolId];

    const conditions = [
        "p.school_id = $1"
    ];

    if (studentId) {
        values.push(studentId);

        conditions.push(
            `p.student_id = $${values.length}`
        );
    }

    if (studentFeeId) {
        values.push(studentFeeId);

        conditions.push(
            `p.student_fee_id = $${values.length}`
        );
    }

    if (paymentMethod) {
        values.push(paymentMethod);

        conditions.push(
            `LOWER(p.payment_method) = LOWER($${values.length})`
        );
    }

    if (paymentDate) {
        values.push(paymentDate);

        conditions.push(
            `p.payment_date = $${values.length}`
        );
    }

    if (fromDate) {
        values.push(fromDate);

        conditions.push(
            `p.payment_date >= $${values.length}`
        );
    }

    if (toDate) {
        values.push(toDate);

        conditions.push(
            `p.payment_date <= $${values.length}`
        );
    }

    if (search) {
        values.push(
            `%${String(search).trim()}%`
        );

        const searchParameter =
            `$${values.length}`;

        conditions.push(`
            (
                p.receipt_number ILIKE ${searchParameter}
                OR p.transaction_reference ILIKE ${searchParameter}
                OR s.student_number ILIKE ${searchParameter}
                OR s.admission_number ILIKE ${searchParameter}
                OR s.first_name ILIKE ${searchParameter}
                OR s.middle_name ILIKE ${searchParameter}
                OR s.last_name ILIKE ${searchParameter}
            )
        `);
    }

    const safeLimit =
        normalizeLimit(limit);

    const safeOffset =
        normalizeOffset(offset);

    values.push(safeLimit);

    const limitPosition =
        values.length;

    values.push(safeOffset);

    const offsetPosition =
        values.length;

    const sql = `
        SELECT
            p.id,
            p.student_id,
            p.school_id,
            p.student_fee_id,
            p.receipt_number,
            p.amount,
            p.payment_method,
            p.transaction_reference,
            p.payment_date,
            p.received_by,
            p.notes,
            p.created_at,

            s.student_number,
            s.admission_number,
            s.first_name AS student_first_name,
            s.middle_name AS student_middle_name,
            s.last_name AS student_last_name,

            sf.amount_due,
            sf.amount_paid,
            sf.balance,
            sf.payment_status,

            u.first_name AS receiver_first_name,
            u.last_name AS receiver_last_name

        FROM payments p

        INNER JOIN students s
            ON s.id = p.student_id
           AND s.school_id = p.school_id

        LEFT JOIN student_fees sf
            ON sf.id = p.student_fee_id
           AND sf.school_id = p.school_id

        LEFT JOIN users u
            ON u.id = p.received_by
           AND u.school_id = p.school_id

        WHERE ${conditions.join("\nAND ")}

        ORDER BY
            p.payment_date DESC,
            p.created_at DESC

        LIMIT $${limitPosition}
        OFFSET $${offsetPosition};
    `;

    const result =
        await query(sql, values);

    return result.rows;
}

async function getStudentPayments(
    schoolIdOrOptions,
    studentId,
    options = {}
) {
    let schoolId;
    let finalStudentId;
    let finalOptions;

    if (
        schoolIdOrOptions &&
        typeof schoolIdOrOptions === "object"
    ) {
        schoolId =
            schoolIdOrOptions.schoolId;

        finalStudentId =
            schoolIdOrOptions.studentId;

        finalOptions = {
            fromDate:
                schoolIdOrOptions.fromDate ||
                null,

            toDate:
                schoolIdOrOptions.toDate ||
                null,

            paymentMethod:
                schoolIdOrOptions.paymentMethod ||
                null,

            studentFeeId:
                schoolIdOrOptions.studentFeeId ||
                null,

            limit:
                schoolIdOrOptions.limit ||
                100,

            offset:
                schoolIdOrOptions.offset ||
                0
        };
    } else {
        schoolId = schoolIdOrOptions;
        finalStudentId = studentId;
        finalOptions = options || {};
    }

    return findPayments(
        schoolId,
        {
            studentId: finalStudentId,
            studentFeeId:
                finalOptions.studentFeeId ||
                null,
            fromDate:
                finalOptions.fromDate ||
                null,
            toDate:
                finalOptions.toDate ||
                null,
            paymentMethod:
                finalOptions.paymentMethod ||
                null,
            limit:
                finalOptions.limit ||
                100,
            offset:
                finalOptions.offset ||
                0
        }
    );
}

async function getStudentFeePayments(
    schoolIdOrOptions,
    studentFeeId,
    options = {}
) {
    let schoolId;
    let finalStudentFeeId;
    let finalOptions;

    if (
        schoolIdOrOptions &&
        typeof schoolIdOrOptions === "object"
    ) {
        schoolId =
            schoolIdOrOptions.schoolId;

        finalStudentFeeId =
            schoolIdOrOptions.studentFeeId;

        finalOptions = {
            limit:
                schoolIdOrOptions.limit ||
                100,

            offset:
                schoolIdOrOptions.offset ||
                0
        };
    } else {
        schoolId = schoolIdOrOptions;
        finalStudentFeeId = studentFeeId;
        finalOptions = options || {};
    }

    return findPayments(
        schoolId,
        {
            studentFeeId: finalStudentFeeId,
            limit:
                finalOptions.limit ||
                100,
            offset:
                finalOptions.offset ||
                0
        }
    );
}

async function updatePayment(
    paymentId,
    schoolId,
    {
        amount = undefined,
        paymentMethod = undefined,
        transactionReference = undefined,
        paymentDate = undefined,
        notes = undefined,
        receiptNumber = undefined
    } = {}
) {
    if (!paymentId) {
        throw new Error(
            "Payment ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const updates = [];

    const values = [
        paymentId,
        schoolId
    ];

    if (amount !== undefined) {
        const paymentAmount =
            Number(amount);

        if (
            !Number.isFinite(paymentAmount) ||
            paymentAmount <= 0
        ) {
            throw new Error(
                "Payment amount must be greater than zero."
            );
        }

        values.push(paymentAmount);

        updates.push(
            `amount = $${values.length}`
        );
    }

    if (paymentMethod !== undefined) {
        values.push(
            normalizePaymentMethod(
                paymentMethod
            )
        );

        updates.push(
            `payment_method = $${values.length}`
        );
    }

    if (
        transactionReference !==
        undefined
    ) {
        values.push(
            transactionReference
        );

        updates.push(
            `transaction_reference = $${values.length}`
        );
    }

    if (paymentDate !== undefined) {
        values.push(
            normalizePaymentDate(
                paymentDate
            )
        );

        updates.push(
            `payment_date = $${values.length}`
        );
    }

    if (notes !== undefined) {
        values.push(notes);

        updates.push(
            `notes = $${values.length}`
        );
    }

    if (receiptNumber !== undefined) {
        const receipt =
            String(receiptNumber).trim();

        if (!receipt) {
            throw new Error(
                "Receipt number cannot be empty."
            );
        }

        values.push(receipt);

        updates.push(
            `receipt_number = $${values.length}`
        );
    }

    if (!updates.length) {
        return findPaymentById(
            paymentId,
            schoolId
        );
    }

    const sql = `
        WITH updated_payment AS (
            UPDATE payments
            SET
                ${updates.join(",\n                ")}
            WHERE id = $1
              AND school_id = $2
            RETURNING *
        ),

        affected_fee AS (
            SELECT DISTINCT student_fee_id
            FROM updated_payment
            WHERE student_fee_id IS NOT NULL
        ),

        recalculated_fee AS (
            UPDATE student_fees sf
            SET
                amount_paid = COALESCE(
                    (
                        SELECT SUM(p.amount)
                        FROM payments p
                        WHERE p.student_fee_id = sf.id
                          AND p.school_id = $2
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
                              AND p.school_id = $2
                        ),
                        0
                    ),
                    0
                ),

                payment_status = CASE
                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = $2
                        ),
                        0
                    ) > sf.amount_due
                    THEN 'Overpaid'

                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = $2
                        ),
                        0
                    ) = sf.amount_due
                    THEN 'Paid'

                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = $2
                        ),
                        0
                    ) > 0
                    THEN 'Partially Paid'

                    ELSE 'Unpaid'
                END,

                updated_at = CURRENT_TIMESTAMP

            WHERE sf.id IN (
                SELECT student_fee_id
                FROM affected_fee
            )
              AND sf.school_id = $2

            RETURNING sf.id
        )

        SELECT *
        FROM updated_payment;
    `;

    const result =
        await query(sql, values);

    if (!result.rows.length) {
        return null;
    }

    return findPaymentById(
        paymentId,
        schoolId
    );
}

async function deletePayment(
    paymentId,
    schoolId
) {
    if (!paymentId) {
        throw new Error(
            "Payment ID is required."
        );
    }

    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const sql = `
        WITH deleted_payment AS (
            DELETE FROM payments
            WHERE id = $1
              AND school_id = $2
            RETURNING *
        ),

        affected_fee AS (
            SELECT DISTINCT student_fee_id
            FROM deleted_payment
            WHERE student_fee_id IS NOT NULL
        ),

        recalculated_fee AS (
            UPDATE student_fees sf
            SET
                amount_paid = COALESCE(
                    (
                        SELECT SUM(p.amount)
                        FROM payments p
                        WHERE p.student_fee_id = sf.id
                          AND p.school_id = $2
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
                              AND p.school_id = $2
                        ),
                        0
                    ),
                    0
                ),

                payment_status = CASE
                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = $2
                        ),
                        0
                    ) > sf.amount_due
                    THEN 'Overpaid'

                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = $2
                        ),
                        0
                    ) = sf.amount_due
                    THEN 'Paid'

                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)
                            FROM payments p
                            WHERE p.student_fee_id = sf.id
                              AND p.school_id = $2
                        ),
                        0
                    ) > 0
                    THEN 'Partially Paid'

                    ELSE 'Unpaid'
                END,

                updated_at = CURRENT_TIMESTAMP

            WHERE sf.id IN (
                SELECT student_fee_id
                FROM affected_fee
            )
              AND sf.school_id = $2

            RETURNING sf.id
        )

        SELECT *
        FROM deleted_payment;
    `;

    const result =
        await query(
            sql,
            [
                paymentId,
                schoolId
            ]
        );

    return result.rows[0] || null;
}

async function getPaymentHistory({
    schoolId,
    studentId = null,
    studentFeeId = null,
    fromDate = null,
    toDate = null,
    limit = 100,
    offset = 0
}) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    return findPayments(
        schoolId,
        {
            studentId,
            studentFeeId,
            fromDate,
            toDate,
            limit,
            offset
        }
    );
}

async function getRecentPayments(
    schoolId,
    limit = 10
) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    return findPayments(
        schoolId,
        {
            limit:
                normalizeLimit(
                    limit,
                    10
                ),
            offset: 0
        }
    );
}

async function getPaymentSummary(
    schoolId,
    {
        studentId = null,
        studentFeeId = null,
        fromDate = null,
        toDate = null
    } = {}
) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    const values = [schoolId];

    const conditions = [
        "p.school_id = $1"
    ];

    if (studentId) {
        values.push(studentId);

        conditions.push(
            `p.student_id = $${values.length}`
        );
    }

    if (studentFeeId) {
        values.push(studentFeeId);

        conditions.push(
            `p.student_fee_id = $${values.length}`
        );
    }

    if (fromDate) {
        values.push(fromDate);

        conditions.push(
            `p.payment_date >= $${values.length}`
        );
    }

    if (toDate) {
        values.push(toDate);

        conditions.push(
            `p.payment_date <= $${values.length}`
        );
    }

    const sql = `
        SELECT
            COUNT(*)::INTEGER
                AS payment_count,

            COALESCE(
                SUM(p.amount),
                0
            ) AS total_amount,

            COALESCE(
                AVG(p.amount),
                0
            ) AS average_payment,

            COALESCE(
                SUM(
                    CASE
                        WHEN LOWER(
                            COALESCE(
                                p.payment_method,
                                ''
                            )
                        ) = 'cash'
                        THEN p.amount
                        ELSE 0
                    END
                ),
                0
            ) AS cash_total,

            COALESCE(
                SUM(
                    CASE
                        WHEN LOWER(
                            COALESCE(
                                p.payment_method,
                                ''
                            )
                        ) IN (
                            'transfer',
                            'bank transfer'
                        )
                        THEN p.amount
                        ELSE 0
                    END
                ),
                0
            ) AS transfer_total,

            COALESCE(
                SUM(
                    CASE
                        WHEN LOWER(
                            COALESCE(
                                p.payment_method,
                                ''
                            )
                        ) IN (
                            'card',
                            'pos'
                        )
                        THEN p.amount
                        ELSE 0
                    END
                ),
                0
            ) AS card_total

        FROM payments p

        WHERE ${conditions.join("\nAND ")};
    `;

    const result =
        await query(sql, values);

    return result.rows[0];
}

async function getSchoolPaymentSummary(
    schoolId,
    {
        fromDate = null,
        toDate = null
    } = {}
) {
    return getPaymentSummary(
        schoolId,
        {
            fromDate,
            toDate
        }
    );
}

async function searchPayments(
    searchTerm,
    schoolId,
    limit = 50
) {
    if (!schoolId) {
        throw new Error(
            "School ID is required."
        );
    }

    if (
        !searchTerm ||
        !String(searchTerm).trim()
    ) {
        return findPayments(
            schoolId,
            {
                limit,
                offset: 0
            }
        );
    }

    return findPayments(
        schoolId,
        {
            search:
                String(searchTerm).trim(),
            limit,
            offset: 0
        }
    );
}

module.exports = {
    createPayment,
    findPaymentById,
    findPayments,
    getStudentPayments,
    getStudentFeePayments,
    updatePayment,
    deletePayment,
    getPaymentHistory,
    getRecentPayments,
    getPaymentSummary,
    getSchoolPaymentSummary,
    searchPayments
};