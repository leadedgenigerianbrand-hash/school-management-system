"use strict";

/* ==========================================================================
STUDENT PROFILE

Central aggregated view for one student.

Core student information comes from /api/students/:id.

Related information is loaded automatically using the student's
internal database ID:

- Enrollment
- Guardians
- Attendance
- Fees
- Payments
- Results
- Documents

This file does not create or duplicate related records.
It only reads the existing module relationships.
========================================================================== */

var API_BASE = "/api";

var currentStudent = null;
var currentEnrollment = null;
var currentTerms = [];
var currentTerm = null;
var currentGuardians = [];
var currentAttendance = null;
var currentFees = [];
var currentFeeSummary = null;
var currentPayments = [];
var currentResults = [];
var currentDocuments = [];
var profileInitialized = false;

/* ==========================================================================
INITIALIZATION
========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeStudentProfile
);

async function initializeStudentProfile() {
    if (profileInitialized) {
        return;
    }

    profileInitialized = true;

    setupMobileSidebar();
    setupProfileActions();
    setupProfileDataActions();

    await loadStudentProfile();
}

/* ==========================================================================
MAIN PROFILE LOADING
========================================================================== */

async function loadStudentProfile() {
    var studentId = getStudentIdFromUrl();

    if (!studentId) {
        showProfileError(
            "No student was specified. Please return to the Students page and select a student."
        );
        return;
    }

    showProfileLoading();

    try {
        var response = await apiRequest(
            "/students/" + encodeURIComponent(studentId),
            {
                method: "GET"
            }
        );

        var student = extractStudent(response);

        if (!student) {
            throw new Error("Student record was not found.");
        }

        currentStudent = student;

        populateStudentProfile(student);
        setupStudentLinks(student);

        var internalStudentId =
            student.id ||
            student.student_id ||
            studentId;

        /*
         * Enrollment is loaded first because the current academic session
         * is needed when displaying the student's results.
         */
        await loadEnrollment(internalStudentId);

        /*
         * Related modules are intentionally loaded independently.
         * A failure in one related module must not hide the core
         * student profile.
         */
        await Promise.allSettled([
            loadGuardians(internalStudentId),
            loadAttendance(internalStudentId),
            loadFees(internalStudentId),
            loadResults(internalStudentId),
            loadDocuments(internalStudentId)
        ]);

        renderAggregatedProfileSections();
        showProfileContent();
    } catch (error) {
        console.error(
            "Student profile loading error:",
            error
        );

        showProfileError(
            getErrorMessage(
                error,
                "Unable to load the student profile."
            )
        );
    }
}

/* ==========================================================================
STUDENT ID
========================================================================== */

function getStudentIdFromUrl() {
    var params = new URLSearchParams(
        window.location.search
    );

    return (
        params.get("id") ||
        params.get("studentId") ||
        params.get("student_id") ||
        ""
    ).trim();
}

/* ==========================================================================
STUDENT RESPONSE EXTRACTION
========================================================================== */

function extractStudent(response) {
    if (!response) {
        return null;
    }

    if (
        response.data &&
        response.data.student
    ) {
        return response.data.student;
    }

    if (response.data) {
        return response.data;
    }

    if (response.student) {
        return response.student;
    }

    return response;
}

/* ==========================================================================
STUDENT PROFILE POPULATION
========================================================================== */

function populateStudentProfile(student) {
    var fullName = buildFullName(
        student.first_name ??
            student.firstName,
        student.middle_name ??
            student.middleName,
        student.last_name ??
            student.lastName
    );

    var studentNumber =
        student.student_number ??
        student.studentNumber ??
        student.admission_number ??
        student.admissionNumber ??
        "—";

    var admissionNumber =
        student.admission_number ??
        student.admissionNumber ??
        "—";

    var status =
        student.status ??
        "Active";

    setText(
        "studentName",
        fullName || "Unnamed Student"
    );

    setText(
        "studentAdmissionNumber",
        admissionNumber
    );

    setText(
        "studentNumber",
        studentNumber
    );

    setText(
        "studentStatus",
        status
    );

    setText(
        "profileGender",
        valueOrDash(student.gender)
    );

    setText(
        "profileFirstName",
        valueOrDash(
            student.first_name ??
            student.firstName
        )
    );

    setText(
        "profileMiddleName",
        valueOrDash(
            student.middle_name ??
            student.middleName
        )
    );

    setText(
        "profileLastName",
        valueOrDash(
            student.last_name ??
            student.lastName
        )
    );

    setText(
        "profileOtherNames",
        valueOrDash(
            student.other_names ??
            student.otherNames
        )
    );

    setText(
        "profileDateOfBirth",
        formatDate(
            student.date_of_birth ??
            student.dateOfBirth
        )
    );

    setText(
        "profileAge",
        getStudentAge(student)
    );

    setText(
        "profileNationality",
        valueOrDash(student.nationality)
    );

    setText(
        "profileStateOfOrigin",
        valueOrDash(
            student.state_of_origin ??
            student.stateOfOrigin
        )
    );

    setText(
        "profileLga",
        valueOrDash(
            student.local_government_area ??
            student.localGovernmentArea ??
            student.lga
        )
    );

    setText(
        "profileReligion",
        valueOrDash(student.religion)
    );

    setText(
        "profileBloodGroup",
        valueOrDash(
            student.blood_group ??
            student.bloodGroup
        )
    );

    setText(
        "profileGenotype",
        valueOrDash(student.genotype)
    );

    setText(
        "profileAcademicLevel",
        valueOrDash(
            student.academic_level_name ??
            student.academicLevelName ??
            student.academic_level ??
            student.academicLevel
        )
    );

    setText(
        "profileClass",
        valueOrDash(
            student.class_name ??
            student.className
        )
    );

    setText(
        "profileClassArm",
        valueOrDash(
            student.arm_name ??
            student.armName ??
            student.class_arm_name ??
            student.classArmName
        )
    );

    setText(
        "profileSession",
        valueOrDash(
            student.session_name ??
            student.sessionName
        )
    );

    setText(
        "profileDepartment",
        valueOrDash(
            student.department_name ??
            student.departmentName
        )
    );

    setText(
        "profileHouse",
        valueOrDash(student.house)
    );

    setText(
        "profileAdmissionDate",
        formatDate(
            student.admission_date ??
            student.admissionDate
        )
    );

    setText(
        "profileEmail",
        valueOrDash(student.email)
    );

    setText(
        "profilePhone",
        valueOrDash(student.phone)
    );

    setText(
        "profileAddress",
        valueOrDash(
            student.residential_address ??
            student.residentialAddress ??
            student.address
        )
    );

    setText(
        "profileNotes",
        valueOrDash(student.notes)
    );

    setText(
        "profileCreatedAt",
        formatDateTime(
            student.created_at ??
            student.createdAt
        )
    );

    setText(
        "profileUpdatedAt",
        formatDateTime(
            student.updated_at ??
            student.updatedAt
        )
    );

    updateStudentStatus(status);
    updateStudentPhoto(student);
    updatePageTitle(fullName);
}

/* ==========================================================================
ENROLLMENT
========================================================================== */

async function loadEnrollment(studentId) {
    currentEnrollment = null;

    try {
        var response = await apiRequest(
            "/enrollments/student/" +
                encodeURIComponent(studentId),
            {
                method: "GET"
            }
        );

        currentEnrollment =
            extractSingleRecord(response);

        renderEnrollment();
    } catch (error) {
        console.warn(
            "Unable to load student enrollment:",
            error
        );

        renderEnrollmentError();
    }
}

function renderEnrollment() {
    var enrollment = currentEnrollment;

    if (!enrollment) {
        renderEnrollmentError();
        return;
    }

    setText(
        "profileClass",
        valueOrDash(
            enrollment.class_name ??
            enrollment.className
        )
    );

    setText(
        "profileClassArm",
        valueOrDash(
            enrollment.arm_name ??
            enrollment.armName
        )
    );

    setText(
        "profileDepartment",
        valueOrDash(
            enrollment.department_name ??
            enrollment.departmentName
        )
    );

    setText(
        "profileSession",
        valueOrDash(
            enrollment.session_name ??
            enrollment.sessionName
        )
    );

    setText(
        "profileEnrollmentStatus",
        valueOrDash(
            enrollment.admission_status ??
            enrollment.admissionStatus
        )
    );

    setText(
        "profileEnrollmentDate",
        formatDate(
            enrollment.enrollment_date ??
            enrollment.enrollmentDate
        )
    );
}

function renderEnrollmentError() {
    setText(
        "profileEnrollmentStatus",
        "Not available"
    );

    setText(
        "profileEnrollmentDate",
        "—"
    );
}

/* ==========================================================================
GUARDIANS
========================================================================== */

async function loadGuardians(studentId) {
    currentGuardians = [];

    var container =
        document.getElementById(
            "guardiansContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        createLoadingState(
            "Loading guardian information..."
        );

    try {
        var response = await apiRequest(
            "/guardians/student/" +
                encodeURIComponent(studentId),
            {
                method: "GET"
            }
        );

        currentGuardians =
            extractCollection(response);

        renderGuardians();
    } catch (error) {
        console.warn(
            "Unable to load guardians:",
            error
        );

        currentGuardians = [];

        container.innerHTML =
            createErrorState(
                "Unable to load guardian information."
            );
    }
}

function renderGuardians() {
    var container =
        document.getElementById(
            "guardiansContainer"
        );

    if (!container) {
        return;
    }

    if (!currentGuardians.length) {
        container.innerHTML =
            createEmptyState(
                "No guardian information is linked to this student yet."
            );
        return;
    }

    container.innerHTML =
        currentGuardians
            .map(function (guardian) {
                return createGuardianCard(
                    guardian
                );
            })
            .join("");
}

function createGuardianCard(guardian) {
    var fullName = buildFullName(
        guardian.first_name ??
            guardian.firstName,
        guardian.middle_name ??
            guardian.middleName,
        guardian.last_name ??
            guardian.lastName
    );

    if (!fullName) {
        fullName =
            guardian.name ||
            guardian.guardian_name ||
            "Guardian";
    }

    var relationship =
        guardian.relationship ||
        guardian.relationship_type ||
        guardian.relationshipType ||
        "—";

    var phone =
        guardian.phone ||
        guardian.phone_number ||
        guardian.phoneNumber ||
        "—";

    var email =
        guardian.email ||
        "—";

    return (
        '<div class="border rounded-3 p-3 mb-3">' +
            '<div class="d-flex align-items-start justify-content-between gap-3">' +
                "<div>" +
                    '<h6 class="mb-1">' +
                        escapeHtml(fullName) +
                    "</h6>" +
                    '<div class="text-muted small">' +
                        escapeHtml(relationship) +
                    "</div>" +
                "</div>" +
                '<span class="badge text-bg-light border">' +
                    "Linked" +
                "</span>" +
            "</div>" +
            '<div class="row g-2 mt-2">' +
                '<div class="col-md-6">' +
                    '<div class="small text-muted">Phone</div>' +
                    "<div>" +
                        escapeHtml(phone) +
                    "</div>" +
                "</div>" +
                '<div class="col-md-6">' +
                    '<div class="small text-muted">Email</div>' +
                    "<div>" +
                        escapeHtml(email) +
                    "</div>" +
                "</div>" +
            "</div>" +
        "</div>"
    );
}

/* ==========================================================================
ATTENDANCE
========================================================================== */

async function loadAttendance(studentId) {
    currentAttendance = null;

    try {
        var summaryResponse =
            await apiRequest(
                "/attendance/student/" +
                    encodeURIComponent(studentId) +
                    "/summary",
                {
                    method: "GET"
                }
            );

        currentAttendance =
            extractSingleRecord(
                summaryResponse
            );

        renderAttendance();
    } catch (error) {
        console.warn(
            "Unable to load attendance summary:",
            error
        );

        currentAttendance = null;
        renderAttendance();
    }
}

function renderAttendance() {
    var container =
        document.getElementById(
            "attendanceSummaryContainer"
        );

    if (!container) {
        return;
    }

    if (!currentAttendance) {
        container.innerHTML =
            createEmptyState(
                "Attendance information is not available yet."
            );
        return;
    }

    var total =
        getRecordValue(
            currentAttendance,
            [
                "total",
                "total_days",
                "totalDays",
                "total_attendance"
            ]
        );

    var present =
        getRecordValue(
            currentAttendance,
            [
                "present",
                "present_days",
                "presentDays"
            ]
        );

    var absent =
        getRecordValue(
            currentAttendance,
            [
                "absent",
                "absent_days",
                "absentDays"
            ]
        );

    var late =
        getRecordValue(
            currentAttendance,
            [
                "late",
                "late_days",
                "lateDays"
            ]
        );

    var percentage =
        getRecordValue(
            currentAttendance,
            [
                "attendance_percentage",
                "attendancePercentage",
                "percentage"
            ]
        );

    container.innerHTML =
        createSummaryCards(
            [
                {
                    label: "Total",
                    value: valueOrDash(total)
                },
                {
                    label: "Present",
                    value: valueOrDash(present)
                },
                {
                    label: "Absent",
                    value: valueOrDash(absent)
                },
                {
                    label: "Late",
                    value: valueOrDash(late)
                },
                {
                    label: "Attendance",
                    value:
                        percentage === null ||
                        percentage === undefined ||
                        percentage === ""
                            ? "—"
                            : String(percentage) + "%"
                }
            ]
        );
}

/* ==========================================================================
FEES
========================================================================== */

async function loadFees(studentId) {
    currentFees = [];
    currentFeeSummary = null;
    currentPayments = [];

    await Promise.all([
        loadFeeSummary(studentId),
        loadFeeRecords(studentId),
        loadPayments(studentId)
    ]);

    renderFees();
    renderPayments();
}

async function loadFeeSummary(studentId) {
    try {
        var response =
            await apiRequest(
                "/fees/student/" +
                    encodeURIComponent(studentId) +
                    "/summary",
                {
                    method: "GET"
                }
            );

        currentFeeSummary =
            extractSingleRecord(response);
    } catch (error) {
        console.warn(
            "Unable to load student fee summary:",
            error
        );

        currentFeeSummary = null;
    }
}

async function loadFeeRecords(studentId) {
    try {
        var response =
            await apiRequest(
                "/fees/student/" +
                    encodeURIComponent(studentId),
                {
                    method: "GET"
                }
            );

        currentFees =
            extractCollection(response);
    } catch (error) {
        console.warn(
            "Unable to load student fees:",
            error
        );

        currentFees = [];
    }
}

async function loadPayments(studentId) {
    try {
        var response =
            await apiRequest(
                "/payments/student/" +
                    encodeURIComponent(studentId),
                {
                    method: "GET"
                }
            );

        currentPayments =
            extractCollection(response);
    } catch (error) {
        console.warn(
            "Unable to load student payments:",
            error
        );

        currentPayments = [];
    }
}

function renderFees() {
    var summaryContainer =
        document.getElementById(
            "feesSummaryContainer"
        );

    if (summaryContainer) {
        if (currentFeeSummary) {
          var due =
    getRecordValue(
        currentFeeSummary,
        [
            "amount_due",
            "amountDue",
            "total_due",
            "totalDue",
            "totalFees"
        ]
    );

var paid =
    getRecordValue(
        currentFeeSummary,
        [
            "amount_paid",
            "amountPaid",
            "total_paid",
            "totalPaid"
        ]
    );

var balance =
    getRecordValue(
        currentFeeSummary,
        [
            "balance",
            "outstanding",
            "amount_balance",
            "amountBalance",
            "totalBalance"
        ]
    );

            summaryContainer.innerHTML =
                createSummaryCards(
                    [
                        {
                            label: "Amount Due",
                            value: formatCurrency(due)
                        },
                        {
                            label: "Amount Paid",
                            value: formatCurrency(paid)
                        },
                        {
                            label: "Balance",
                            value: formatCurrency(balance)
                        }
                    ]
                );
        } else if (currentFees.length) {
            summaryContainer.innerHTML =
                createSummaryCards(
                    [
                        {
                            label: "Fee Records",
                            value: currentFees.length
                        }
                    ]
                );
        } else {
            summaryContainer.innerHTML =
                createEmptyState(
                    "No fee information is available yet."
                );
        }
    }

    var recordsContainer =
        document.getElementById(
            "feesRecordsContainer"
        );

    if (!recordsContainer) {
        return;
    }

    if (!currentFees.length) {
        recordsContainer.innerHTML =
            createEmptyState(
                "No student fee records are available yet."
            );
        return;
    }

    recordsContainer.innerHTML =
        createFeeRecordsTable(
            currentFees
        );
}

function renderPayments() {
    var container =
        document.getElementById(
            "paymentsContainer"
        );

    if (!container) {
        return;
    }

    if (!currentPayments.length) {
        container.innerHTML =
            createEmptyState(
                "No payment records are available yet."
            );
        return;
    }

    container.innerHTML =
        createPaymentsTable(
            currentPayments
        );
}

function createFeeRecordsTable(records) {
    var rows =
        records
            .map(function (record) {
                var due =
                    getRecordValue(
                        record,
                        [
                            "amount_due",
                            "amountDue"
                        ]
                    );

                var paid =
                    getRecordValue(
                        record,
                        [
                            "amount_paid",
                            "amountPaid"
                        ]
                    );

                var balance =
                    getRecordValue(
                        record,
                        [
                            "balance"
                        ]
                    );

                var status =
                    getRecordValue(
                        record,
                        [
                            "payment_status",
                            "paymentStatus",
                            "status"
                        ]
                    );

                return (
                    "<tr>" +
                        "<td>" +
                            escapeHtml(
                                getRecordValue(
                                    record,
                                    [
                                        "fee_name",
                                        "feeName",
                                        "name",
                                        "description"
                                    ]
                                ) || "Fee"
                            ) +
                        "</td>" +
                        "<td>" +
                            formatCurrency(due) +
                        "</td>" +
                        "<td>" +
                            formatCurrency(paid) +
                        "</td>" +
                        "<td>" +
                            formatCurrency(balance) +
                        "</td>" +
                        "<td>" +
                            escapeHtml(
                                valueOrDash(status)
                            ) +
                        "</td>" +
                    "</tr>"
                );
            })
            .join("");

    return (
        '<div class="table-responsive">' +
            '<table class="table table-sm align-middle mb-0">' +
                "<thead>" +
                    "<tr>" +
                        "<th>Fee</th>" +
                        "<th>Due</th>" +
                        "<th>Paid</th>" +
                        "<th>Balance</th>" +
                        "<th>Status</th>" +
                    "</tr>" +
                "</thead>" +
                "<tbody>" +
                    rows +
                "</tbody>" +
            "</table>" +
        "</div>"
    );
}

function createPaymentsTable(records) {
    var rows =
        records
            .map(function (record) {
                var amount =
                    getRecordValue(
                        record,
                        [
                            "amount",
                            "payment_amount",
                            "paymentAmount"
                        ]
                    );

                var date =
                    getRecordValue(
                        record,
                        [
                            "payment_date",
                            "paymentDate",
                            "created_at",
                            "createdAt"
                        ]
                    );

                var method =
                    getRecordValue(
                        record,
                        [
                            "payment_method",
                            "paymentMethod",
                            "method"
                        ]
                    );

                var reference =
                    getRecordValue(
                        record,
                        [
                            "reference",
                            "payment_reference",
                            "paymentReference",
                            "receipt_number",
                            "receiptNumber"
                        ]
                    );

                return (
                    "<tr>" +
                        "<td>" +
                            escapeHtml(
                                formatDate(date)
                            ) +
                        "</td>" +
                        "<td>" +
                            formatCurrency(amount) +
                        "</td>" +
                        "<td>" +
                            escapeHtml(
                                valueOrDash(method)
                            ) +
                        "</td>" +
                        "<td>" +
                            escapeHtml(
                                valueOrDash(reference)
                            ) +
                        "</td>" +
                    "</tr>"
                );
            })
            .join("");

    return (
        '<div class="table-responsive">' +
            '<table class="table table-sm align-middle mb-0">' +
                "<thead>" +
                    "<tr>" +
                        "<th>Date</th>" +
                        "<th>Amount</th>" +
                        "<th>Method</th>" +
                        "<th>Reference</th>" +
                    "</tr>" +
                "</thead>" +
                "<tbody>" +
                    rows +
                "</tbody>" +
            "</table>" +
        "</div>"
    );
}

/* ==========================================================================
RESULTS
========================================================================== */

async function loadResults(studentId) {
    currentResults = [];
    currentTerms = [];
    currentTerm = null;

    try {
        await loadTerms();

        var sessionId =
            getCurrentSessionId();

        var termId =
            getCurrentTermId();

        if (!sessionId || !termId) {
            renderResults();
            return;
        }

        var query =
            "?sessionId=" +
            encodeURIComponent(sessionId) +
            "&termId=" +
            encodeURIComponent(termId);

        var response =
            await apiRequest(
                "/results/student/" +
                    encodeURIComponent(studentId) +
                    query,
                {
                    method: "GET"
                }
            );

        currentResults =
            extractCollection(response);

        renderResults();
    } catch (error) {
        console.warn(
            "Unable to load student results:",
            error
        );

        currentResults = [];
        renderResultsError();
    }
}

async function loadTerms() {
    try {
        var response =
            await apiRequest(
                "/terms",
                {
                    method: "GET"
                }
            );

        currentTerms =
            extractCollection(response);

        currentTerm =
            findCurrentTerm(
                currentTerms
            );
    } catch (error) {
        console.warn(
            "Unable to load academic terms:",
            error
        );

        currentTerms = [];
        currentTerm = null;
    }
}

function getCurrentSessionId() {
    if (!currentEnrollment) {
        return "";
    }

    return (
        currentEnrollment.academic_session_id ??
        currentEnrollment.academicSessionId ??
        ""
    );
}

function getCurrentTermId() {
    if (!currentTerm) {
        return "";
    }

    return (
        currentTerm.id ||
        currentTerm.term_id ||
        ""
    );
}

function findCurrentTerm(terms) {
    if (
        !Array.isArray(terms) ||
        !terms.length
    ) {
        return null;
    }

    var active =
        terms.find(function (term) {
            return (
                term.is_current === true ||
                term.isCurrent === true
            );
        });

    if (active) {
        return active;
    }

    var activeStatus =
        terms.find(function (term) {
            var status =
                String(
                    term.status || ""
                ).toLowerCase();

            return (
                status === "current" ||
                status === "active"
            );
        });

    if (activeStatus) {
        return activeStatus;
    }

    return (
        terms
            .slice()
            .sort(function (a, b) {
                return (
                    Number(
                        b.term_order ??
                        b.termOrder ??
                        0
                    ) -
                    Number(
                        a.term_order ??
                        a.termOrder ??
                        0
                    )
                );
            })[0] || null
    );
}

function renderResults() {
    var container =
        document.getElementById(
            "resultsContainer"
        );

    if (!container) {
        return;
    }

    updateResultTermLabel();

    if (!currentResults.length) {
        var termName =
            currentTerm
                ? (
                    currentTerm.term_name ??
                    currentTerm.termName ??
                    ""
                )
                : "";

        var message =
            termName
                ? "No results are available for " +
                    termName +
                    " yet."
                : "No results are available yet.";

        container.innerHTML =
            createEmptyState(
                message
            );

        return;
    }

    container.innerHTML =
        createResultsTable(
            currentResults
        );
}

function renderResultsError() {
    var container =
        document.getElementById(
            "resultsContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        createErrorState(
            "Unable to load student results."
        );
}

function updateResultTermLabel() {
    var element =
        document.getElementById(
            "resultsTermLabel"
        );

    if (!element) {
        return;
    }

    if (!currentTerm) {
        element.textContent =
            "Current term";

        return;
    }

    element.textContent =
        currentTerm.term_name ??
        currentTerm.termName ??
        "Current term";
}

function createResultsTable(records) {
    var rows =
        records
            .map(function (record) {
                var subject =
                    getRecordValue(
                        record,
                        [
                            "subject_name",
                            "subjectName"
                        ]
                    ) ||
                    getRecordValue(
                        record,
                        [
                            "subject_code",
                            "subjectCode"
                        ]
                    ) ||
                    "Subject";

                var ca =
                    getRecordValue(
                        record,
                        [
                            "ca_score",
                            "caScore",
                            "continuous_assessment",
                            "continuousAssessment"
                        ]
                    );

                var exam =
                    getRecordValue(
                        record,
                        [
                            "exam_score",
                            "examScore"
                        ]
                    );

                var total =
                    getRecordValue(
                        record,
                        [
                            "total_score",
                            "totalScore",
                            "score"
                        ]
                    );

                var grade =
                    getRecordValue(
                        record,
                        [
                            "grade"
                        ]
                    );

                var position =
                    getRecordValue(
                        record,
                        [
                            "position"
                        ]
                    );

                var remark =
                    getRecordValue(
                        record,
                        [
                            "teacher_remark",
                            "teacherRemark",
                            "remark"
                        ]
                    );

                return (
                    "<tr>" +
                        "<td>" +
                            escapeHtml(
                                subject
                            ) +
                        "</td>" +
                        "<td>" +
                            escapeHtml(
                                valueOrDash(ca)
                            ) +
                        "</td>" +
                        "<td>" +
                            escapeHtml(
                                valueOrDash(exam)
                            ) +
                        "</td>" +
                        "<td>" +
                            escapeHtml(
                                valueOrDash(total)
                            ) +
                        "</td>" +
                        "<td>" +
                            escapeHtml(
                                valueOrDash(grade)
                            ) +
                        "</td>" +
                        "<td>" +
                            escapeHtml(
                                valueOrDash(position)
                            ) +
                        "</td>" +
                        "<td>" +
                            escapeHtml(
                                valueOrDash(remark)
                            ) +
                        "</td>" +
                    "</tr>"
                );
            })
            .join("");

    return (
        '<div class="table-responsive">' +
            '<table class="table table-sm align-middle mb-0">' +
                "<thead>" +
                    "<tr>" +
                        "<th>Subject</th>" +
                        "<th>CA</th>" +
                        "<th>Exam</th>" +
                        "<th>Total</th>" +
                        "<th>Grade</th>" +
                        "<th>Position</th>" +
                        "<th>Remark</th>" +
                    "</tr>" +
                "</thead>" +
                "<tbody>" +
                    rows +
                "</tbody>" +
            "</table>" +
        "</div>"
    );
}

/* ==========================================================================
DOCUMENTS
========================================================================== */

async function loadDocuments(studentId) {
    currentDocuments = [];

    var container =
        document.getElementById(
            "documentsContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        createLoadingState(
            "Loading student documents..."
        );

    try {
        var response =
            await apiRequest(
                "/documents/student/" +
                    encodeURIComponent(studentId),
                {
                    method: "GET"
                }
            );

        currentDocuments =
            extractCollection(response);

        renderDocuments();
    } catch (error) {
        console.warn(
            "Unable to load student documents:",
            error
        );

        currentDocuments = [];

        container.innerHTML =
            createErrorState(
                "Unable to load student documents."
            );
    }
}

function renderDocuments() {
    var container =
        document.getElementById(
            "documentsContainer"
        );

    if (!container) {
        return;
    }

    if (!currentDocuments.length) {
        container.innerHTML =
            createEmptyState(
                "No student documents are available yet."
            );

        return;
    }

    container.innerHTML =
        currentDocuments
            .map(function (documentRecord) {
                return createDocumentCard(
                    documentRecord
                );
            })
            .join("");
}

function createDocumentCard(documentRecord) {
    var name =
        documentRecord.document_name ??
        documentRecord.documentName ??
        documentRecord.file_name ??
        documentRecord.fileName ??
        documentRecord.name ??
        "Document";

    var type =
        documentRecord.document_type ??
        documentRecord.documentType ??
        documentRecord.type ??
        "";

    var url =
        documentRecord.file_url ??
        documentRecord.fileUrl ??
        documentRecord.document_url ??
        documentRecord.documentUrl ??
        documentRecord.url ??
        "";

    var link =
        url
            ? (
                '<a href="' +
                escapeAttribute(
                    normalizeFileUrl(url)
                ) +
                '" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary">' +
                    '<i class="bi bi-box-arrow-up-right me-1"></i>' +
                    "Open" +
                "</a>"
            )
            : "";

    return (
        '<div class="border rounded-3 p-3 mb-2">' +
            '<div class="d-flex align-items-center justify-content-between gap-3">' +
                "<div>" +
                    '<div class="fw-semibold">' +
                        escapeHtml(name) +
                    "</div>" +
                    (
                        type
                            ? (
                                '<div class="small text-muted">' +
                                    escapeHtml(type) +
                                "</div>"
                            )
                            : ""
                    ) +
                "</div>" +
                link +
            "</div>" +
        "</div>"
    );
}

/* ==========================================================================
AGGREGATED PROFILE SECTIONS
========================================================================== */

function renderAggregatedProfileSections() {
    renderEnrollment();
    renderGuardians();
    renderAttendance();
    renderFees();
    renderPayments();
    renderResults();
    renderDocuments();

    updateAggregationCounters();
}

function updateAggregationCounters() {
    setText(
        "guardianCount",
        currentGuardians.length
    );

    setText(
        "documentCount",
        currentDocuments.length
    );

    setText(
        "resultCount",
        currentResults.length
    );

    setText(
        "feeRecordCount",
        currentFees.length
    );

    setText(
        "paymentCount",
        currentPayments.length
    );
}

/* ==========================================================================
PROFILE LINKS
========================================================================== */

function setupStudentLinks(student) {
    var studentId =
        student.id ??
        student.student_id;

    if (!studentId) {
        return;
    }

    var encodedId =
        encodeURIComponent(studentId);

    setHref(
        "attendanceLink",
        "/pages/student-attendance.html?id=" +
            encodedId
    );

    setHref(
        "feesLink",
        "/pages/fees.html?studentId=" +
            encodedId
    );

    setHref(
        "resultsLink",
        "/pages/student-results.html?id=" +
            encodedId
    );

    setHref(
        "editLink",
        "/pages/student-form.html?id=" +
            encodedId
    );

    setHref(
        "photoEditLink",
        "/pages/student-form.html?id=" +
            encodedId
    );
}

/* ==========================================================================
PROFILE ACTIONS
========================================================================== */

function setupProfileActions() {
    var retryButton =
        document.getElementById(
            "retryProfileButton"
        );

    if (retryButton) {
        retryButton.addEventListener(
            "click",
            function () {
                loadStudentProfile();
            }
        );
    }

    var editButton =
        document.getElementById(
            "editStudentButton"
        );

    if (editButton) {
        editButton.addEventListener(
            "click",
            function () {
                if (
                    currentStudent &&
                    (
                        currentStudent.id ||
                        currentStudent.student_id
                    )
                ) {
                    window.location.href =
                        "/pages/student-form.html?id=" +
                        encodeURIComponent(
                            currentStudent.id ||
                            currentStudent.student_id
                        );
                }
            }
        );
    }

    var deleteButton =
        document.getElementById(
            "deleteStudentButton"
        );

    if (deleteButton) {
        deleteButton.addEventListener(
            "click",
            deleteCurrentStudent
        );
    }
}

function setupProfileDataActions() {
    var excelButton =
        document.getElementById(
            "exportProfileExcelButton"
        );

    if (excelButton) {
        excelButton.addEventListener(
            "click",
            function () {
                prepareExport("Excel");
            }
        );
    }

    var pdfButton =
        document.getElementById(
            "exportReportCardButton"
        );

    if (pdfButton) {
        pdfButton.addEventListener(
            "click",
            function () {
                prepareExport("PDF");
            }
        );
    }
}

function prepareExport(type) {
    if (!currentStudent) {
        showTemporaryMessage(
            "Student profile data is not loaded yet.",
            "warning"
        );

        return;
    }

    /*
     * Export services are deliberately prepared here but not implemented
     * against a new dependency yet. This prevents the profile from
     * generating incomplete or fake files.
     */

    if (type === "Excel") {
        showTemporaryMessage(
            "Full Profile Excel export is prepared for the export service stage.",
            "info"
        );

        return;
    }

    if (type === "PDF") {
        showTemporaryMessage(
            "Report Card PDF export is prepared for the report-card service stage.",
            "info"
        );
    }
}

/* ==========================================================================
DELETE STUDENT
========================================================================== */

async function deleteCurrentStudent() {
    if (!currentStudent) {
        return;
    }

    var studentId =
        currentStudent.id ||
        currentStudent.student_id;

    if (!studentId) {
        return;
    }

    var name =
        buildFullName(
            currentStudent.first_name ??
                currentStudent.firstName,
            currentStudent.middle_name ??
                currentStudent.middleName,
            currentStudent.last_name ??
                currentStudent.lastName
        ) ||
        "this student";

    var confirmed =
        window.confirm(
            "Are you sure you want to delete " +
            name +
            "? This action cannot be undone."
        );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(
            "/students/" +
                encodeURIComponent(studentId),
            {
                method: "DELETE"
            }
        );

        window.location.href =
            "/pages/students.html";
    } catch (error) {
        console.error(
            "Unable to delete student:",
            error
        );

        showTemporaryMessage(
            getErrorMessage(
                error,
                "Unable to delete the student."
            ),
            "danger"
        );
    }
}

/* ==========================================================================
PHOTO
========================================================================== */

function updateStudentPhoto(student) {
    var image =
        document.getElementById(
            "studentPhoto"
        );

    var initialsElement =
        document.getElementById(
            "studentInitials"
        );

    if (!image && !initialsElement) {
        return;
    }

    var photo =
        student.student_photo_url ??
        student.studentPhotoUrl ??
        student.photo_url ??
        student.photoUrl ??
        student.photo ??
        "";

    var fullName =
        buildFullName(
            student.first_name ??
                student.firstName,
            student.middle_name ??
                student.middleName,
            student.last_name ??
                student.lastName
        );

    if (initialsElement) {
        initialsElement.textContent =
            getInitials(fullName);
    }

    if (!image) {
        return;
    }

    if (photo) {
        image.src =
            normalizeFileUrl(photo);

        image.alt =
            fullName ||
            "Student photo";

        image.classList.remove(
            "d-none"
        );

        if (initialsElement) {
            initialsElement.classList.add(
                "d-none"
            );
        }

        image.onerror =
            function () {
                image.classList.add(
                    "d-none"
                );

                if (initialsElement) {
                    initialsElement.classList.remove(
                        "d-none"
                    );
                }
            };
    } else {
        image.classList.add(
            "d-none"
        );

        if (initialsElement) {
            initialsElement.classList.remove(
                "d-none"
            );
        }
    }
}

function normalizeFileUrl(value) {
    if (!value) {
        return "";
    }

    var url =
        String(value)
            .trim()
            .replace(/\\/g, "/");

    if (!url) {
        return "";
    }

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    ) {
        return url;
    }

    if (url.startsWith("/")) {
        return url;
    }

    if (url.startsWith("uploads/")) {
        return "/" + url;
    }

    if (url.startsWith("students/")) {
        return "/uploads/" + url;
    }

    return "/uploads/" + url;
}

/* ==========================================================================
STATUS
========================================================================== */

function updateStudentStatus(status) {
    var badge =
        document.getElementById(
            "studentStatusBadge"
        );

    if (!badge) {
        return;
    }

    var normalized =
        String(
            status || "Active"
        )
            .trim()
            .toLowerCase();

    badge.textContent =
        status || "Active";

    badge.classList.remove(
        "text-bg-success",
        "text-bg-secondary",
        "text-bg-warning",
        "text-bg-danger",
        "text-bg-info"
    );

    if (
        normalized === "active" ||
        normalized === "enrolled"
    ) {
        badge.classList.add(
            "text-bg-success"
        );

        return;
    }

    if (
        normalized === "inactive" ||
        normalized === "graduated"
    ) {
        badge.classList.add(
            "text-bg-secondary"
        );

        return;
    }

    if (normalized === "suspended") {
        badge.classList.add(
            "text-bg-warning"
        );

        return;
    }

    if (
        normalized === "withdrawn" ||
        normalized === "deleted"
    ) {
        badge.classList.add(
            "text-bg-danger"
        );

        return;
    }

    badge.classList.add(
        "text-bg-info"
    );
}

/* ==========================================================================
PAGE TITLE
========================================================================== */

function updatePageTitle(name) {
    if (!name) {
        return;
    }

    document.title =
        name +
        " - Student Profile";
}

/* ==========================================================================
PAGE STATES
========================================================================== */

function showProfileLoading() {
    var loading =
        document.getElementById(
            "profileLoading"
        );

    var error =
        document.getElementById(
            "profileError"
        );

    var content =
        document.getElementById(
            "profileContent"
        );

    if (loading) {
        loading.classList.remove(
            "d-none"
        );
    }

    if (error) {
        error.classList.add(
            "d-none"
        );
    }

    if (content) {
        content.classList.add(
            "d-none"
        );
    }
}

function showProfileContent() {
    var loading =
        document.getElementById(
            "profileLoading"
        );

    var error =
        document.getElementById(
            "profileError"
        );

    var content =
        document.getElementById(
            "profileContent"
        );

    if (loading) {
        loading.classList.add(
            "d-none"
        );
    }

    if (error) {
        error.classList.add(
            "d-none"
        );
    }

    if (content) {
        content.classList.remove(
            "d-none"
        );
    }
}

function showProfileError(message) {
    var loading =
        document.getElementById(
            "profileLoading"
        );

    var error =
        document.getElementById(
            "profileError"
        );

    var content =
        document.getElementById(
            "profileContent"
        );

    if (loading) {
        loading.classList.add(
            "d-none"
        );
    }

    if (content) {
        content.classList.add(
            "d-none"
        );
    }

    if (error) {
        error.classList.remove(
            "d-none"
        );

        var messageElement =
            document.getElementById(
                "profileErrorMessage"
            );

        if (messageElement) {
            messageElement.textContent =
                message;
        }
    }
}

/* ==========================================================================
MOBILE SIDEBAR
========================================================================== */

function setupMobileSidebar() {
    var toggle =
        document.getElementById(
            "sidebarToggle"
        );

    var sidebar =
        document.getElementById(
            "appSidebar"
        );

    var overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (!toggle || !sidebar) {
        return;
    }

    toggle.addEventListener(
        "click",
        function () {
            sidebar.classList.toggle(
                "show"
            );

            if (overlay) {
                overlay.classList.toggle(
                    "show"
                );
            }
        }
    );

    if (overlay) {
        overlay.addEventListener(
            "click",
            function () {
                sidebar.classList.remove(
                    "show"
                );

                overlay.classList.remove(
                    "show"
                );
            }
        );
    }
}

/* ==========================================================================
GENERIC API RESPONSE HELPERS
========================================================================== */

function extractCollection(response) {
    if (!response) {
        return [];
    }

    if (Array.isArray(response)) {
        return response;
    }

    if (
        response.data &&
        Array.isArray(response.data)
    ) {
        return response.data;
    }

    if (
        response.data &&
        Array.isArray(response.data.rows)
    ) {
        return response.data.rows;
    }

    if (
        response.data &&
        Array.isArray(response.data.results)
    ) {
        return response.data.results;
    }

    if (
        response.data &&
        Array.isArray(response.data.guardians)
    ) {
        return response.data.guardians;
    }

    if (
        response.data &&
        Array.isArray(response.data.documents)
    ) {
        return response.data.documents;
    }

    if (
        response.data &&
        Array.isArray(response.data.payments)
    ) {
        return response.data.payments;
    }

    if (
        response.data &&
        Array.isArray(response.data.fees)
    ) {
        return response.data.fees;
    }

    if (
        response.rows &&
        Array.isArray(response.rows)
    ) {
        return response.rows;
    }

    if (
        response.results &&
        Array.isArray(response.results)
    ) {
        return response.results;
    }

    if (
        response.guardians &&
        Array.isArray(response.guardians)
    ) {
        return response.guardians;
    }

    if (
        response.documents &&
        Array.isArray(response.documents)
    ) {
        return response.documents;
    }

    if (
        response.payments &&
        Array.isArray(response.payments)
    ) {
        return response.payments;
    }

    if (
        response.fees &&
        Array.isArray(response.fees)
    ) {
        return response.fees;
    }

    return [];
}

function extractSingleRecord(response) {
    if (!response) {
        return null;
    }

    if (
        response.data &&
        !Array.isArray(response.data)
    ) {
        return response.data;
    }

    if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length
    ) {
        return response.data[0];
    }

    if (response.record) {
        return response.record;
    }

    if (response.summary) {
        return response.summary;
    }

    if (response.enrollment) {
        return response.enrollment;
    }

    if (response.term) {
        return response.term;
    }

    return null;
}

/* ==========================================================================
GENERIC VALUE HELPERS
========================================================================== */

function getRecordValue(record, keys) {
    if (
        !record ||
        !Array.isArray(keys)
    ) {
        return null;
    }

    for (
        var index = 0;
        index < keys.length;
        index += 1
    ) {
        var key = keys[index];

        if (
            record[key] !== undefined &&
            record[key] !== null
        ) {
            return record[key];
        }
    }

    return null;
}

function valueOrDash(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    return String(value);
}

function setText(id, value) {
    var element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        valueOrDash(value);
}

function setHref(id, href) {
    var element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.href = href;
}

/* ==========================================================================
NAME / AGE HELPERS
========================================================================== */

function buildFullName(
    firstName,
    middleName,
    lastName
) {
    return [
        firstName,
        middleName,
        lastName
    ]
        .filter(function (value) {
            return (
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
            );
        })
        .map(function (value) {
            return String(value).trim();
        })
        .join(" ");
}

function getStudentAge(student) {
    var explicitAge =
        student.age;

    if (
        explicitAge !== null &&
        explicitAge !== undefined &&
        explicitAge !== ""
    ) {
        return String(explicitAge);
    }

    var dateOfBirth =
        student.date_of_birth ??
        student.dateOfBirth;

    if (!dateOfBirth) {
        return "—";
    }

    var birthDate =
        new Date(dateOfBirth);

    if (
        Number.isNaN(
            birthDate.getTime()
        )
    ) {
        return "—";
    }

    var today =
        new Date();

    var age =
        today.getFullYear() -
        birthDate.getFullYear();

    var monthDifference =
        today.getMonth() -
        birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() <
                birthDate.getDate()
        )
    ) {
        age -= 1;
    }

    return age >= 0
        ? String(age)
        : "—";
}

function getInitials(name) {
    if (!name) {
        return "ST";
    }

    var parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) {
        return "ST";
    }

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
}

/* ==========================================================================
DATE / CURRENCY
========================================================================== */

function formatDate(value) {
    if (!value) {
        return "—";
    }

    var date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return valueOrDash(value);
    }

    return new Intl.DateTimeFormat(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    var date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return valueOrDash(value);
    }

    return new Intl.DateTimeFormat(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);
}

function formatCurrency(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "₦0.00";
    }

    var numericValue =
        Number(value);

    if (
        Number.isNaN(
            numericValue
        )
    ) {
        return "₦0.00";
    }

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(numericValue);
}

/* ==========================================================================
UI HELPERS
========================================================================== */

function createLoadingState(message) {
    return (
        '<div class="text-muted py-3">' +
            '<div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>' +
            escapeHtml(
                message ||
                "Loading..."
            ) +
        "</div>"
    );
}

function createEmptyState(message) {
    return (
        '<div class="text-muted py-3">' +
            '<i class="bi bi-info-circle me-2"></i>' +
            escapeHtml(
                message ||
                "No records available."
            ) +
        "</div>"
    );
}

function createErrorState(message) {
    return (
        '<div class="text-danger py-3">' +
            '<i class="bi bi-exclamation-triangle me-2"></i>' +
            escapeHtml(
                message ||
                "Unable to load this information."
            ) +
        "</div>"
    );
}

function createSummaryCards(items) {
    return (
        '<div class="row g-3">' +
            items
                .map(function (item) {
                    return (
                        '<div class="col-6 col-md-4 col-lg">' +
                            '<div class="border rounded-3 p-3 h-100">' +
                                '<div class="small text-muted mb-1">' +
                                    escapeHtml(
                                        item.label
                                    ) +
                                "</div>" +
                                '<div class="fs-5 fw-semibold">' +
                                    escapeHtml(
                                        String(
                                            item.value
                                        )
                                    ) +
                                "</div>" +
                            "</div>" +
                        "</div>"
                    );
                })
                .join("") +
        "</div>"
    );
}

function showTemporaryMessage(
    message,
    type
) {
    var existing =
        document.getElementById(
            "studentProfileMessage"
        );

    if (existing) {
        existing.remove();
    }

    var alert =
        document.createElement(
            "div"
        );

    alert.id =
        "studentProfileMessage";

    alert.className =
        "alert alert-" +
        (
            type ||
            "info"
        ) +
        " alert-dismissible fade show position-fixed top-0 end-0 m-3 shadow";

    alert.style.zIndex =
        "2000";

    alert.innerHTML =
        escapeHtml(message) +
        '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

    document.body.appendChild(
        alert
    );

    window.setTimeout(
        function () {
            if (
                alert &&
                alert.parentNode
            ) {
                alert.remove();
            }
        },
        5000
    );
}

/* ==========================================================================
ERROR / SECURITY HELPERS
========================================================================== */

function getErrorMessage(
    error,
    fallback
) {
    if (!error) {
        return fallback;
    }

    if (
        error.message &&
        typeof error.message === "string"
    ) {
        return error.message;
    }

    return fallback;
}

function escapeHtml(value) {
    return String(
        value === null ||
        value === undefined
            ? ""
            : value
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

/* ==========================================================================
PUBLIC FUNCTIONS
========================================================================== */

window.loadStudentProfile =
    loadStudentProfile;

window.initializeStudentProfile =
    initializeStudentProfile;