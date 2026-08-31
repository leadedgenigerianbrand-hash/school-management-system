const { query } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Fee Model
|--------------------------------------------------------------------------
|
| Handles:
|
| - Fee structures
| - Student fee assignments
| - Payments
| - Outstanding balances
| - Payment history
| - Fee summaries
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Create Fee Structure
|--------------------------------------------------------------------------
*/

async function createFeeStructure({
    schoolId,
    sessionId,
    termId,
    classId = null,
    feeName,
    amount,
    description = null,
    dueDate = null,
    status = "active"
}) {

    if (!schoolId) {
        throw new Error("School ID is required.");
    }

    if (!sessionId) {
        throw new Error("Academic session ID is required.");
    }

    if (!termId) {
        throw new Error("Term ID is required.");
    }

    if (!feeName || !feeName.trim()) {
        throw new Error("Fee name is required.");
    }

    if (amount === undefined || amount === null) {
        throw new Error("Fee amount is required.");
    }


    const sql = `
        INSERT INTO fee_structures (
            school_id,
            session_id,
            term_id,
            class_id,
            fee_name,
            amount,
            description,
            due_date,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
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
            sessionId,
            termId,
            classId,
            feeName.trim(),
            amount,
            description,
            dueDate,
            status
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Fee Structure By ID
|--------------------------------------------------------------------------
*/

async function findFeeStructureById(
    feeStructureId,
    schoolId = null
) {

    let sql = `
        SELECT

            fs.*,

            c.class_name,

            s.session_name,

            t.term_name

        FROM fee_structures fs

        LEFT JOIN classes c
            ON c.id = fs.class_id

        INNER JOIN academic_sessions s
            ON s.id = fs.session_id

        INNER JOIN terms t
            ON t.id = fs.term_id

        WHERE fs.id = $1
    `;


    const values = [
        feeStructureId
    ];


    if (schoolId) {

        sql += `
            AND fs.school_id = $2
        `;

        values.push(
            schoolId
        );
    }


    sql += `
        LIMIT 1
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Find Fee Structures
|--------------------------------------------------------------------------
*/

async function findFeeStructures(
    schoolId,
    {
        sessionId = null,
        termId = null,
        classId = null,
        status = null
    } = {}
) {

    let sql = `
        SELECT

            fs.*,

            c.class_name,

            s.session_name,

            t.term_name

        FROM fee_structures fs

        LEFT JOIN classes c
            ON c.id = fs.class_id

        INNER JOIN academic_sessions s
            ON s.id = fs.session_id

        INNER JOIN terms t
            ON t.id = fs.term_id

        WHERE fs.school_id = $1
    `;


    const values = [
        schoolId
    ];


    if (sessionId) {

        values.push(sessionId);

        sql += `
            AND fs.session_id = $${values.length}
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


    if (status) {

        values.push(status);

        sql += `
            AND fs.status = $${values.length}
        `;
    }


    sql += `
        ORDER BY

            fs.fee_name ASC
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Update Fee Structure
|--------------------------------------------------------------------------
*/

async function updateFeeStructure(
    feeStructureId,
    schoolId,
    {
        feeName,
        amount,
        description = null,
        dueDate = null,
        status = "active"
    }
) {

    const sql = `
        UPDATE fee_structures

        SET

            fee_name = $1,

            amount = $2,

            description = $3,

            due_date = $4,

            status = $5,

            updated_at = NOW()

        WHERE id = $6

          AND school_id = $7

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            feeName.trim(),
            amount,
            description,
            dueDate,
            status,
            feeStructureId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Delete Fee Structure
|--------------------------------------------------------------------------
*/

async function deleteFeeStructure(
    feeStructureId,
    schoolId
) {

    const sql = `
        DELETE FROM fee_structures

        WHERE id = $1

          AND school_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            feeStructureId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Assign Fee To Student
|--------------------------------------------------------------------------
*/

async function assignFeeToStudent({
    schoolId,
    studentId,
    feeStructureId,
    amount = null,
    dueDate = null,
    status = "unpaid"
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


    /*
    | If amount is not supplied, get it
    | from the fee structure.
    */

    let feeAmount = amount;


    if (feeAmount === null) {

        const fee =
            await findFeeStructureById(
                feeStructureId,
                schoolId
            );


        if (!fee) {
            throw new Error(
                "Fee structure not found."
            );
        }


        feeAmount = fee.amount;


        if (!dueDate) {
            dueDate = fee.due_date;
        }
    }


    const sql = `
        INSERT INTO student_fees (
            school_id,
            student_id,
            fee_structure_id,
            amount,
            amount_paid,
            balance,
            due_date,
            status
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            0,
            $4,
            $5,
            $6
        )
        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            studentId,
            feeStructureId,
            feeAmount,
            dueDate,
            status
        ]
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Find Student Fee
|--------------------------------------------------------------------------
*/

async function findStudentFeeById(
    studentFeeId,
    schoolId = null
) {

    let sql = `
        SELECT

            sf.*,

            s.admission_number,

            s.first_name,

            s.middle_name,

            s.last_name,

            fs.fee_name

        FROM student_fees sf

        INNER JOIN students s
            ON s.id = sf.student_id

        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id

        WHERE sf.id = $1
    `;


    const values = [
        studentFeeId
    ];


    if (schoolId) {

        sql += `
            AND sf.school_id = $2
        `;

        values.push(
            schoolId
        );
    }


    sql += `
        LIMIT 1
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Find Student Fees
|--------------------------------------------------------------------------
*/

async function findStudentFees({
    schoolId,
    studentId,
    sessionId = null,
    termId = null,
    status = null
}) {

    let sql = `
        SELECT

            sf.*,

            fs.fee_name,

            fs.description,

            fs.session_id,

            fs.term_id

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
            AND fs.session_id = $${values.length}
        `;
    }


    if (termId) {

        values.push(termId);

        sql += `
            AND fs.term_id = $${values.length}
        `;
    }


    if (status) {

        values.push(status);

        sql += `
            AND sf.status = $${values.length}
        `;
    }


    sql += `
        ORDER BY

            sf.due_date ASC NULLS LAST
    `;


    const result = await query(
        sql,
        values
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Record Payment
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
    notes = null
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

    if (!amount || Number(amount) <= 0) {
        throw new Error(
            "Payment amount must be greater than zero."
        );
    }


    const sql = `
        INSERT INTO payments (
            school_id,
            student_fee_id,
            student_id,
            amount,
            payment_method,
            reference,
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
            COALESCE($7, CURRENT_DATE),
            $8,
            $9
        )
        RETURNING *
    `;


    const result = await query(
        sql,
        [
            schoolId,
            studentFeeId,
            studentId,
            amount,
            paymentMethod,
            reference,
            paymentDate,
            receivedBy,
            notes
        ]
    );


    /*
    | Update the student fee after payment.
    */

    await updateStudentFeeBalance(
        studentFeeId,
        schoolId
    );


    return result.rows[0];
}


/*
|--------------------------------------------------------------------------
| Update Student Fee Balance
|--------------------------------------------------------------------------
*/

async function updateStudentFeeBalance(
    studentFeeId,
    schoolId
) {

    const sql = `
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

            balance = sf.amount -
                COALESCE(
                    (
                        SELECT SUM(p.amount)

                        FROM payments p

                        WHERE p.student_fee_id = sf.id

                          AND p.school_id = sf.school_id
                    ),
                    0
                ),

            status =
                CASE

                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)

                            FROM payments p

                            WHERE p.student_fee_id = sf.id

                              AND p.school_id = sf.school_id
                        ),
                        0
                    ) >= sf.amount

                    THEN 'paid'

                    WHEN COALESCE(
                        (
                            SELECT SUM(p.amount)

                            FROM payments p

                            WHERE p.student_fee_id = sf.id

                              AND p.school_id = sf.school_id
                        ),
                        0
                    ) > 0

                    THEN 'partial'

                    ELSE 'unpaid'

                END,

            updated_at = NOW()

        WHERE sf.id = $1

          AND sf.school_id = $2

        RETURNING *
    `;


    const result = await query(
        sql,
        [
            studentFeeId,
            schoolId
        ]
    );


    return result.rows[0] || null;
}


/*
|--------------------------------------------------------------------------
| Get Payment History
|--------------------------------------------------------------------------
*/

async function getPaymentHistory({
    schoolId,
    studentId,
    studentFeeId = null
}) {

    let sql = `
        SELECT

            p.*,

            s.admission_number,

            s.first_name,

            s.middle_name,

            s.last_name,

            sf.amount AS fee_amount,

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


    const result = await query(
        sql,
        values
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Get Student Fee Summary
|--------------------------------------------------------------------------
*/

async function getStudentFeeSummary({
    schoolId,
    studentId,
    sessionId = null,
    termId = null
}) {

    let sql = `
        SELECT

            COALESCE(
                SUM(sf.amount),
                0
            ) AS total_fees,

            COALESCE(
                SUM(sf.amount_paid),
                0
            ) AS total_paid,

            COALESCE(
                SUM(sf.balance),
                0
            ) AS total_balance,

            COUNT(sf.id)::INTEGER
                AS fee_count,

            COUNT(
                CASE
                    WHEN sf.status = 'paid'
                    THEN 1
                END
            )::INTEGER AS paid_count,

            COUNT(
                CASE
                    WHEN sf.status = 'partial'
                    THEN 1
                END
            )::INTEGER AS partial_count,

            COUNT(
                CASE
                    WHEN sf.status = 'unpaid'
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
            AND fs.session_id = $${values.length}
        `;
    }


    if (termId) {

        values.push(termId);

        sql += `
            AND fs.term_id = $${values.length}
        `;
    }


    const result = await query(
        sql,
        values
    );


    const row = result.rows[0];


    return {

        totalFees:
            Number(row.total_fees),

        totalPaid:
            Number(row.total_paid),

        totalBalance:
            Number(row.total_balance),

        feeCount:
            Number(row.fee_count),

        paidCount:
            Number(row.paid_count),

        partialCount:
            Number(row.partial_count),

        unpaidCount:
            Number(row.unpaid_count)

    };
}


/*
|--------------------------------------------------------------------------
| Get School Fee Summary
|--------------------------------------------------------------------------
*/

async function getSchoolFeeSummary(
    schoolId,
    {
        sessionId = null,
        termId = null
    } = {}
) {

    let sql = `
        SELECT

            COALESCE(
                SUM(sf.amount),
                0
            ) AS total_expected,

            COALESCE(
                SUM(sf.amount_paid),
                0
            ) AS total_collected,

            COALESCE(
                SUM(sf.balance),
                0
            ) AS total_outstanding,

            COUNT(sf.id)::INTEGER
                AS total_fee_records,

            COUNT(
                CASE
                    WHEN sf.status = 'paid'
                    THEN 1
                END
            )::INTEGER AS paid_records,

            COUNT(
                CASE
                    WHEN sf.status = 'partial'
                    THEN 1
                END
            )::INTEGER AS partial_records,

            COUNT(
                CASE
                    WHEN sf.status = 'unpaid'
                    THEN 1
                END
            )::INTEGER AS unpaid_records

        FROM student_fees sf

        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id

        WHERE sf.school_id = $1
    `;


    const values = [
        schoolId
    ];


    if (sessionId) {

        values.push(sessionId);

        sql += `
            AND fs.session_id = $${values.length}
        `;
    }


    if (termId) {

        values.push(termId);

        sql += `
            AND fs.term_id = $${values.length}
        `;
    }


    const result = await query(
        sql,
        values
    );


    const row = result.rows[0];


    return {

        totalExpected:
            Number(row.total_expected),

        totalCollected:
            Number(row.total_collected),

        totalOutstanding:
            Number(row.total_outstanding),

        totalFeeRecords:
            Number(row.total_fee_records),

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
| Search Student Fees
|--------------------------------------------------------------------------
*/

async function searchStudentFees(
    searchTerm,
    schoolId
) {

    const sql = `
        SELECT

            sf.*,

            s.admission_number,

            s.first_name,

            s.middle_name,

            s.last_name,

            fs.fee_name

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

              OR sf.status ILIKE $2

          )

        ORDER BY

            s.last_name ASC,

            s.first_name ASC
    `;


    const result = await query(
        sql,
        [
            schoolId,
            `%${searchTerm}%`
        ]
    );


    return result.rows;
}


/*
|--------------------------------------------------------------------------
| Export
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