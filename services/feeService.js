"use strict";

const { query } = require("../config/database");
const paymentModel = require("../models/paymentModel");

| /*                                                                         |
| -------------------------------------------------------------------------- |
| FEE SERVICE                                                                |
| -------------------------------------------------------------------------- |
|                                                                            |
| Business layer for:                                                        |
| - Student fee accounts                                                     |
| - Fee structures                                                           |
| - Payment coordination                                                     |
| - Fee balances                                                             |
| - Fee statistics                                                           |
|                                                                            |
| Responsibilities:                                                          |
| - Validate business input                                                  |
| - Enforce school ownership                                                 |
| - Coordinate fee and payment operations                                    |
| - Keep fee balances consistent with payment records                        |
|                                                                            |
| Payment persistence is handled by:                                         |
| models/paymentModel.js                                                     |
|                                                                            |
| -------------------------------------------------------------------------- |
| */                                                                         |

| /*                                                                         |
| -------------------------------------------------------------------------- |
| HELPERS                                                                    |
| -------------------------------------------------------------------------- |
| */                                                                         |

function normalizePaymentStatus(status) {
const value = String(status || "")
.trim()
.toLowerCase();

```
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
```

}

function validateAmount(amount, allowZero = true) {
const value = Number(amount);

```
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
```

}

function normalizeOptionalId(value) {
if (
value === undefined ||
value === null ||
String(value).trim() === ""
) {
return null;
}

```
return value;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| VERIFY STUDENT                                                             |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function verifyStudent(studentId, schoolId) {
const result = await query(
`         SELECT
            id,
            school_id
        FROM students
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
        `,
[studentId, schoolId]
);

```
return result.rows[0] || null;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| VERIFY ACADEMIC SESSION                                                    |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function verifyAcademicSession(sessionId, schoolId) {
if (!sessionId) {
return null;
}

```
const result = await query(
    `
    SELECT
        id,
        school_id,
        session_name,
        is_active,
        is_current
    FROM academic_sessions
    WHERE id = $1
      AND school_id = $2
    LIMIT 1
    `,
    [sessionId, schoolId]
);

return result.rows[0] || null;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| VERIFY TERM                                                                |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function verifyTerm(termId, schoolId) {
if (!termId) {
return null;
}

```
const result = await query(
    `
    SELECT
        t.id,
        t.academic_session_id,
        s.school_id
    FROM terms t
    INNER JOIN academic_sessions s
        ON s.id = t.academic_session_id
    WHERE t.id = $1
      AND s.school_id = $2
    LIMIT 1
    `,
    [termId, schoolId]
);

return result.rows[0] || null;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| VERIFY CLASS                                                               |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function verifyClass(classId, schoolId) {
if (!classId) {
return null;
}

```
const result = await query(
    `
    SELECT
        id,
        school_id,
        class_name
    FROM classes
    WHERE id = $1
      AND school_id = $2
    LIMIT 1
    `,
    [classId, schoolId]
);

return result.rows[0] || null;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| VERIFY FEE STRUCTURE                                                       |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getFeeStructure(
feeStructureId,
schoolId
) {
if (!feeStructureId) {
return null;
}

```
const result = await query(
    `
    SELECT
        fs.id,
        fs.school_id,
        fs.academic_session_id,
        fs.term_id,
        fs.class_id,
        fs.fee_name,
        fs.description,
        fs.amount,
        fs.compulsory,
        fs.created_at
    FROM fee_structures fs
    WHERE fs.id = $1
      AND fs.school_id = $2
    LIMIT 1
    `,
    [feeStructureId, schoolId]
);

return result.rows[0] || null;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET STUDENT FEES                                                           |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getStudentFees(studentId, schoolId) {
if (!studentId) {
throw new Error("Student ID is required.");
}

```
if (!schoolId) {
    throw new Error("School ID is required.");
}

const student = await verifyStudent(
    studentId,
    schoolId
);

if (!student) {
    throw new Error("Student not found in this school.");
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
        fs.compulsory,

        s.first_name,
        s.middle_name,
        s.last_name,
        s.student_number,
        s.admission_number

    FROM student_fees sf

    INNER JOIN fee_structures fs
        ON fs.id = sf.fee_structure_id
       AND fs.school_id = sf.school_id

    INNER JOIN students s
        ON s.id = sf.student_id
       AND s.school_id = sf.school_id

    WHERE sf.student_id = $1
      AND sf.school_id = $2

    ORDER BY
        sf.created_at DESC
    `,
    [studentId, schoolId]
);

return result.rows;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET FEE BY ID                                                              |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getFeeById(feeId, schoolId) {
if (!feeId) {
throw new Error("Fee ID is required.");
}

```
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
        fs.compulsory,

        s.first_name,
        s.middle_name,
        s.last_name,
        s.student_number,
        s.admission_number

    FROM student_fees sf

    INNER JOIN fee_structures fs
        ON fs.id = sf.fee_structure_id
       AND fs.school_id = sf.school_id

    INNER JOIN students s
        ON s.id = sf.student_id
       AND s.school_id = sf.school_id

    WHERE sf.id = $1
      AND sf.school_id = $2

    LIMIT 1
    `,
    [feeId, schoolId]
);

return result.rows[0] || null;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| CREATE FEE                                                                 |
| -------------------------------------------------------------------------- |
| */                                                                         |

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

```
if (!studentId) {
    throw new Error("Student ID is required.");
}

const feeAmount = validateAmount(amount);

const student = await verifyStudent(
    studentId,
    schoolId
);

if (!student) {
    throw new Error("Student not found in this school.");
}

const normalizedSessionId =
    normalizeOptionalId(sessionId);

const normalizedTermId =
    normalizeOptionalId(termId);

const normalizedStructureId =
    normalizeOptionalId(feeStructureId);

if (normalizedSessionId) {
    const session =
        await verifyAcademicSession(
            normalizedSessionId,
            schoolId
        );

    if (!session) {
        throw new Error(
            "Academic session not found in this school."
        );
    }
}

if (normalizedTermId) {
    const term =
        await verifyTerm(
            normalizedTermId,
            schoolId
        );

    if (!term) {
        throw new Error(
            "Term not found in this school."
        );
    }

    if (
        normalizedSessionId &&
        String(term.academic_session_id) !==
        String(normalizedSessionId)
    ) {
        throw new Error(
            "The selected term does not belong to the selected academic session."
        );
    }
}

let structureId =
    normalizedStructureId;

/*
|----------------------------------------------------------------------
| Use supplied fee structure
|----------------------------------------------------------------------
*/

if (structureId) {
    const structure =
        await getFeeStructure(
            structureId,
            schoolId
        );

    if (!structure) {
        throw new Error(
            "Fee structure not found in this school."
        );
    }

    if (
        normalizedSessionId &&
        String(structure.academic_session_id) !==
        String(normalizedSessionId)
    ) {
        throw new Error(
            "Fee structure does not belong to the selected academic session."
        );
    }

    if (
        normalizedTermId &&
        structure.term_id &&
        String(structure.term_id) !==
        String(normalizedTermId)
    ) {
        throw new Error(
            "Fee structure does not belong to the selected term."
        );
    }

    if (
        structure.class_id
    ) {
        const enrolledClass =
            await verifyStudentClassForFee(
                studentId,
                schoolId,
                structure.class_id,
                structure.academic_session_id
            );

        if (!enrolledClass) {
            throw new Error(
                "The fee structure class does not match the student's current enrollment."
            );
        }
    }
}


/*
|----------------------------------------------------------------------
| Find existing structure by fee name
|----------------------------------------------------------------------
*/

if (!structureId && feeType) {
    const structureResult =
        await query(
            `
            SELECT
                fs.id
            FROM fee_structures fs
            WHERE fs.school_id = $1
              AND fs.fee_name ILIKE $2
              AND (
                    $3::UUID IS NULL
                    OR fs.academic_session_id = $3
                  )
              AND (
                    $4::UUID IS NULL
                    OR fs.term_id = $4
                  )
            ORDER BY
                fs.created_at DESC
            LIMIT 1
            `,
            [
                schoolId,
                String(feeType).trim(),
                normalizedSessionId,
                normalizedTermId
            ]
        );

    structureId =
        structureResult.rows[0]?.id ||
        null;
}


/*
|----------------------------------------------------------------------
| Create fee structure when necessary
|----------------------------------------------------------------------
*/

if (!structureId) {
    if (!normalizedSessionId) {
        throw new Error(
            "Academic session is required to create a fee structure."
        );
    }

    if (
        !feeType ||
        !String(feeType).trim()
    ) {
        throw new Error(
            "Fee name is required."
        );
    }

    const structureResult =
        await query(
            `
            INSERT INTO fee_structures (
                school_id,
                academic_session_id,
                term_id,
                fee_name,
                description,
                amount
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING *
            `,
            [
                schoolId,
                normalizedSessionId,
                normalizedTermId,
                String(feeType).trim(),
                description,
                feeAmount
            ]
        );

    structureId =
        structureResult.rows[0].id;
}


/*
|----------------------------------------------------------------------
| Create student fee account
|----------------------------------------------------------------------
*/

const normalizedStatus =
    normalizePaymentStatus(status);

const result =
    await query(
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
            $5
        )
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
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| VERIFY STUDENT CLASS FOR FEE                                               |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function verifyStudentClassForFee(
studentId,
schoolId,
classId,
sessionId
) {
if (!classId || !sessionId) {
return true;
}

```
const result = await query(
    `
    SELECT
        se.id
    FROM student_enrollments se
    WHERE se.student_id = $1
      AND se.school_id = $2
      AND se.class_id = $3
      AND se.academic_session_id = $4
    LIMIT 1
    `,
    [
        studentId,
        schoolId,
        classId,
        sessionId
    ]
);

return Boolean(result.rows[0]);
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| RECORD PAYMENT                                                             |
| -------------------------------------------------------------------------- |
| */                                                                         |

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

```
if (!schoolId) {
    throw new Error("School ID is required.");
}

const paymentAmount =
    validateAmount(amount, false);

const feeResult =
    await query(
        `
        SELECT
            sf.id,
            sf.student_id,
            sf.school_id,
            sf.amount_due,
            sf.amount_paid,
            sf.balance,
            sf.payment_status
        FROM student_fees sf
        WHERE sf.id = $1
          AND sf.school_id = $2
        LIMIT 1
        `,
        [feeId, schoolId]
    );

const fee =
    feeResult.rows[0];

if (!fee) {
    return null;
}

const student =
    await verifyStudent(
        fee.student_id,
        schoolId
    );

if (!student) {
    throw new Error(
        "Student associated with this fee was not found in this school."
    );
}

/*
|----------------------------------------------------------------------
| Delegate actual payment persistence to paymentModel
|----------------------------------------------------------------------
*/

const payment =
    await paymentModel.createPayment({
        schoolId,
        studentId: fee.student_id,
        studentFeeId: feeId,
        amount: paymentAmount,
        paymentMethod,
        transactionReference: reference,
        paymentDate,
        receivedBy,
        notes,
        receiptNumber
    });

return payment;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET PAYMENT HISTORY                                                        |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getPaymentHistory(
feeId,
schoolId
) {
if (!feeId) {
throw new Error("Fee ID is required.");
}

```
if (!schoolId) {
    throw new Error("School ID is required.");
}

const fee =
    await getFeeById(
        feeId,
        schoolId
    );

if (!fee) {
    return [];
}

return paymentModel.getStudentFeePayments(
    schoolId,
    feeId
);
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET STUDENT FEE BALANCE                                                    |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getStudentFeeBalance(
studentId,
schoolId
) {
if (!studentId) {
throw new Error("Student ID is required.");
}

```
if (!schoolId) {
    throw new Error("School ID is required.");
}

const student =
    await verifyStudent(
        studentId,
        schoolId
    );

if (!student) {
    throw new Error(
        "Student not found in this school."
    );
}

const result =
    await query(
        `
        SELECT
            COALESCE(
                SUM(amount_due),
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

        FROM student_fees

        WHERE student_id = $1
          AND school_id = $2
        `,
        [
            studentId,
            schoolId
        ]
    );

const row =
    result.rows[0] || {};

return {
    totalAmount:
        Number(row.total_amount || 0),

    totalPaid:
        Number(row.total_paid || 0),

    totalBalance:
        Number(row.total_balance || 0)
};
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET OUTSTANDING FEES                                                       |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getOutstandingFees(
schoolId
) {
if (!schoolId) {
throw new Error("School ID is required.");
}

```
const result =
    await query(
        `
        SELECT
            sf.*,

            fs.fee_name,
            fs.description AS fee_description,
            fs.academic_session_id,
            fs.term_id,
            fs.class_id,

            s.first_name,
            s.middle_name,
            s.last_name,
            s.student_number,
            s.admission_number

        FROM student_fees sf

        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id
           AND fs.school_id = sf.school_id

        INNER JOIN students s
            ON s.id = sf.student_id
           AND s.school_id = sf.school_id

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
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET FEE STATISTICS                                                         |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getFeeStatistics(
schoolId,
sessionId = null,
termId = null
) {
if (!schoolId) {
throw new Error("School ID is required.");
}

```
let sql = `
    SELECT
        COUNT(*)::INTEGER AS total_records,

        COALESCE(
            SUM(sf.amount_due),
            0
        ) AS total_amount,

        COALESCE(
            SUM(sf.amount_paid),
            0
        ) AS total_paid,

        COALESCE(
            SUM(sf.balance),
            0
        ) AS total_balance,

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
        )::INTEGER AS unpaid_records,

        COUNT(
            CASE
                WHEN sf.payment_status = 'Overpaid'
                THEN 1
            END
        )::INTEGER AS overpaid_records

    FROM student_fees sf

    INNER JOIN fee_structures fs
        ON fs.id = sf.fee_structure_id
       AND fs.school_id = sf.school_id

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
    await query(
        sql,
        values
    );

const row =
    result.rows[0] || {};

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
        Number(row.unpaid_records || 0),

    overpaidRecords:
        Number(row.overpaid_records || 0)
};
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| GET FEE SUMMARY BY TYPE                                                    |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function getFeeSummaryByType(
schoolId,
sessionId = null,
termId = null
) {
if (!schoolId) {
throw new Error("School ID is required.");
}

```
let sql = `
    SELECT
        fs.fee_name AS fee_type,

        COUNT(sf.id)::INTEGER
            AS record_count,

        COALESCE(
            SUM(sf.amount_due),
            0
        ) AS total_amount,

        COALESCE(
            SUM(sf.amount_paid),
            0
        ) AS total_paid,

        COALESCE(
            SUM(sf.balance),
            0
        ) AS total_balance

    FROM student_fees sf

    INNER JOIN fee_structures fs
        ON fs.id = sf.fee_structure_id
       AND fs.school_id = sf.school_id

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
    GROUP BY
        fs.fee_name

    ORDER BY
        fs.fee_name ASC
`;

const result =
    await query(
        sql,
        values
    );

return result.rows.map(row => ({
    feeType:
        row.fee_type,

    recordCount:
        Number(row.record_count || 0),

    totalAmount:
        Number(row.total_amount || 0),

    totalPaid:
        Number(row.total_paid || 0),

    totalBalance:
        Number(row.total_balance || 0)
}));
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| SEARCH FEES                                                                |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function searchFees(
searchTerm,
schoolId
) {
if (!schoolId) {
throw new Error("School ID is required.");
}

```
const term =
    String(searchTerm || "").trim();

if (!term) {
    return [];
}

const result =
    await query(
        `
        SELECT
            sf.*,

            fs.fee_name,
            fs.description AS fee_description,
            fs.academic_session_id,
            fs.term_id,
            fs.class_id,

            s.first_name,
            s.middle_name,
            s.last_name,
            s.student_number,
            s.admission_number

        FROM student_fees sf

        INNER JOIN fee_structures fs
            ON fs.id = sf.fee_structure_id
           AND fs.school_id = sf.school_id

        INNER JOIN students s
            ON s.id = sf.student_id
           AND s.school_id = sf.school_id

        WHERE sf.school_id = $1
          AND (
                s.first_name ILIKE $2
                OR s.middle_name ILIKE $2
                OR s.last_name ILIKE $2
                OR s.student_number ILIKE $2
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
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| UPDATE FEE                                                                 |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function updateFee(
feeId,
schoolId,
data
) {
if (!feeId) {
throw new Error("Fee ID is required.");
}

```
if (!schoolId) {
    throw new Error("School ID is required.");
}

if (
    !data ||
    typeof data !== "object"
) {
    throw new Error(
        "Fee update data is required."
    );
}

const existingFee =
    await getFeeById(
        feeId,
        schoolId
    );

if (!existingFee) {
    return null;
}

const allowedFields = {
    amountDue: "amount_due",
    amount: "amount_due",
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
        "amount_due"
    ) {
        value =
            validateAmount(value);
    }

    if (
        allowedFields[key] ===
        "fee_structure_id"
    ) {
        const structure =
            await getFeeStructure(
                value,
                schoolId
            );

        if (!structure) {
            throw new Error(
                "Fee structure not found in this school."
            );
        }

        value =
            structure.id;
    }

    values.push(value);

    updates.push(
        `${allowedFields[key]} = $${values.length}`
    );
}

if (!updates.length) {
    return existingFee;
}

values.push(feeId);
const feeIdPosition =
    values.length;

values.push(schoolId);
const schoolIdPosition =
    values.length;

const result =
    await query(
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

if (!result.rows[0]) {
    return null;
}

/*
|----------------------------------------------------------------------
| Recalculate fee account from actual payments
|----------------------------------------------------------------------
*/

const updatedFee =
    result.rows[0];

const paymentSummary =
    await paymentModel.getPaymentSummary(
        schoolId,
        {
            studentFeeId: feeId
        }
    );

const amountPaid =
    Number(
        paymentSummary?.total_amount || 0
    );

const amountDue =
    Number(
        updatedFee.amount_due || 0
    );

let paymentStatus =
    "Unpaid";

if (amountPaid > amountDue) {
    paymentStatus = "Overpaid";
} else if (
    amountPaid === amountDue &&
    amountDue > 0
) {
    paymentStatus = "Paid";
} else if (amountPaid > 0) {
    paymentStatus = "Partially Paid";
}

const balance =
    Math.max(
        amountDue - amountPaid,
        0
    );

const balanceResult =
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
        RETURNING *
        `,
        [
            amountPaid,
            balance,
            paymentStatus,
            feeId,
            schoolId
        ]
    );

return (
    balanceResult.rows[0] ||
    updatedFee
);
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| DELETE FEE                                                                 |
| -------------------------------------------------------------------------- |
| */                                                                         |

async function deleteFee(
feeId,
schoolId
) {
if (!feeId) {
throw new Error("Fee ID is required.");
}

```
if (!schoolId) {
    throw new Error("School ID is required.");
}

const existingFee =
    await getFeeById(
        feeId,
        schoolId
    );

if (!existingFee) {
    return null;
}

const paymentSummary =
    await paymentModel.getPaymentSummary(
        schoolId,
        {
            studentFeeId: feeId
        }
    );

const paymentCount =
    Number(
        paymentSummary?.payment_count || 0
    );

/*
|----------------------------------------------------------------------
| The database intentionally keeps payment history when a student fee
| account is deleted because payments.student_fee_id uses ON DELETE
| SET NULL.
|----------------------------------------------------------------------
*/

const result =
    await query(
        `
        DELETE FROM student_fees
        WHERE id = $1
          AND school_id = $2
        RETURNING *
        `,
        [
            feeId,
            schoolId
        ]
    );

const deletedFee =
    result.rows[0] || null;

if (deletedFee) {
    deletedFee.paymentCount =
        paymentCount;
}

return deletedFee;
```

}

| /*                                                                         |
| -------------------------------------------------------------------------- |
| EXPORTS                                                                    |
| -------------------------------------------------------------------------- |
| */                                                                         |

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
