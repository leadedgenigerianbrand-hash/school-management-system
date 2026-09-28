"use strict";

(function () {
let feeRecords = [];
let students = [];
let academicSessions = [];
let terms = [];
let feeStructures = [];
let editingFeeId = null;
let feeModal = null;

let currentUser = null;
let schoolInfo = null;


/* ==========================================================================
   API REQUEST
   ========================================================================== */

async function request(endpoint, options = {}) {
    if (
        window.apiRequest &&
        typeof window.apiRequest === "function"
    ) {
        return window.apiRequest(endpoint, options);
    }

    const token =
        localStorage.getItem("school_management_token") ||
        sessionStorage.getItem("school_management_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        "";

    let url = endpoint;

    if (!url.startsWith("/api/")) {
        if (!url.startsWith("/")) {
            url = "/" + url;
        }

        url = "/api" + url;
    }

    const headers = {
        Accept: "application/json",
        ...(options.headers || {})
    };

    if (
        options.body &&
        typeof options.body === "string" &&
        !headers["Content-Type"] &&
        !headers["content-type"]
    ) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = "Bearer " + token;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    const contentType =
        response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (response.status === 401) {
        clearAuthentication();

        window.location.replace("/pages/login.html");

        throw new Error("Authentication required.");
    }

    if (response.status === 403) {
        throw new Error(
            "You do not have permission to perform this action."
        );
    }

    if (!response.ok) {
        throw new Error(
            data &&
            typeof data === "object" &&
            data.message
                ? data.message
                : typeof data === "string" && data
                    ? data
                    : "Request failed."
        );
    }

    return data;
}


/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

async function initialize() {
    setupEvents();
    initializeModal();

    await Promise.all([
        loadStudents(),
        loadAcademicSessions(),
        loadTerms(),
        loadFeeStructures()
    ]);

    await loadFees();
}


/* ==========================================================================
   EVENTS
   ========================================================================== */

function setupEvents() {
    const form = document.querySelector("#feeForm");

    if (form) {
        form.addEventListener("submit", handleSubmit);
    }

    const searchInput =
        document.querySelector("#searchInput");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderFees
        );
    }

    const statusFilter =
        document.querySelector("#statusFilter");

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            function () {
                loadFees();
            }
        );
    }

    const refreshButton =
        document.querySelector("#refreshButton");

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            async function () {
                await loadFees();
            }
        );
    }

    const addFeeButton =
        document.querySelector("#addFeeButton");

    if (addFeeButton) {
        addFeeButton.addEventListener(
            "click",
            function () {
                resetForm();
                showFeeModal();
            }
        );
    }

    const studentInput =
        document.querySelector("#studentId");

    if (studentInput) {
        studentInput.addEventListener(
            "change",
            handleStudentChange
        );
    }

    const feeStructureInput =
        document.querySelector("#feeStructureId");

    if (feeStructureInput) {
        feeStructureInput.addEventListener(
            "change",
            handleFeeStructureChange
        );
    }

    const amountPaidInput =
        document.querySelector("#amountPaid");

    if (amountPaidInput) {
        amountPaidInput.addEventListener(
            "input",
            updateBalancePreview
        );
    }

    document.addEventListener(
        "click",
        handleActionClick
    );
}


function initializeModal() {
    const modalElement =
        document.querySelector("#feeModal");

    if (
        modalElement &&
        window.bootstrap &&
        window.bootstrap.Modal
    ) {
        feeModal =
            window.bootstrap.Modal.getOrCreateInstance(
                modalElement
            );
    }
}


/* ==========================================================================
   DATA LOADING
   ========================================================================== */

async function loadStudents() {
    try {
        const data = await request("/students");

        students = extractArray(data);

        populateStudentSelect();
    } catch (error) {
        console.error(
            "Unable to load students:",
            error
        );

        students = [];

        populateStudentSelect();
    }
}


async function loadAcademicSessions() {
    try {
        const data =
            await request("/academic-sessions");

        academicSessions = extractArray(data);

        populateSessionSelect();
    } catch (error) {
        console.error(
            "Unable to load academic sessions:",
            error
        );

        academicSessions = [];

        populateSessionSelect();
    }
}


async function loadTerms() {
    try {
        const data =
            await request("/terms");

        terms = extractArray(data);

        populateTermSelect();
    } catch (error) {
        console.error(
            "Unable to load terms:",
            error
        );

        terms = [];

        populateTermSelect();
    }
}


async function loadFeeStructures() {
    try {
        const data =
            await request("/fees/structures");

        feeStructures = extractArray(data);

        populateFeeStructureSelect();
    } catch (error) {
        console.error(
            "Unable to load fee structures:",
            error
        );

        feeStructures = [];

        populateFeeStructureSelect();
    }
}


async function loadFees() {
    showLoading();

    try {
        const searchInput =
            document.querySelector("#searchInput");

        const statusFilter =
            document.querySelector("#statusFilter");

        const params =
            new URLSearchParams();

        if (
            searchInput &&
            searchInput.value.trim()
        ) {
            params.set(
                "search",
                searchInput.value.trim()
            );
        }

        if (
            statusFilter &&
            statusFilter.value
        ) {
            params.set(
                "status",
                statusFilter.value
            );
        }

        const query =
            params.toString()
                ? "?" + params.toString()
                : "";

        const data =
            await request(
                "/fees/records" + query
            );

        feeRecords = extractArray(data);

        renderFees();
        updateSummary();
    } catch (error) {
        console.error(
            "Unable to load fees:",
            error
        );

        feeRecords = [];

        updateSummary();

        showError(
            error.message ||
            "Unable to load fee records."
        );
    }
}


/* ==========================================================================
   SELECT POPULATION
   ========================================================================== */

function populateStudentSelect() {
    const input =
        document.querySelector("#studentId");

    if (!input) {
        return;
    }

    const currentValue = input.value;

    input.innerHTML =
        '<option value="">Select student</option>';

    students.forEach(function (student) {
        const id =
            student.id ||
            student.student_id;

        if (!id) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = id;

        option.textContent =
            getStudentName(student) +
            getAdmissionText(student);

        input.appendChild(option);
    });

    if (currentValue) {
        input.value = currentValue;
    }
}


function populateSessionSelect() {
    const input =
        document.querySelector("#sessionId");

    if (!input) {
        return;
    }

    const currentValue = input.value;

    input.innerHTML =
        '<option value="">Select academic session</option>';

    academicSessions.forEach(function (session) {
        const id =
            session.id ||
            session.session_id;

        if (!id) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = id;

        option.textContent =
            session.session_name ||
            session.name ||
            session.sessionName ||
            "Academic Session";

        input.appendChild(option);
    });

    if (currentValue) {
        input.value = currentValue;
    }
}


function populateTermSelect() {
    const input =
        document.querySelector("#termId");

    if (!input) {
        return;
    }

    const currentValue = input.value;

    input.innerHTML =
        '<option value="">Select term</option>';

    terms.forEach(function (term) {
        const id =
            term.id ||
            term.term_id;

        if (!id) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = id;

        option.textContent =
            term.term_name ||
            term.name ||
            term.termName ||
            "Term";

        input.appendChild(option);
    });

    if (currentValue) {
        input.value = currentValue;
    }
}


function populateFeeStructureSelect() {
    const input =
        document.querySelector("#feeStructureId");

    if (!input) {
        return;
    }

    const currentValue = input.value;

    input.innerHTML =
        '<option value="">Select fee structure</option>';

    feeStructures.forEach(function (structure) {
        const id =
            structure.id ||
            structure.fee_structure_id;

        if (!id) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = id;

        option.textContent =
            getFeeStructureLabel(structure);

        option.dataset.feeName =
            structure.fee_name ||
            structure.feeName ||
            "";

        option.dataset.amount =
            structure.amount ||
            "";

        option.dataset.sessionId =
            structure.academic_session_id ||
            structure.session_id ||
            "";

        option.dataset.termId =
            structure.term_id ||
            "";

        input.appendChild(option);
    });

    if (currentValue) {
        input.value = currentValue;
    }
}


/* ==========================================================================
   FORM HANDLING
   ========================================================================== */

function handleStudentChange(event) {
    const studentId =
        event.target.value;

    const student =
        students.find(function (item) {
            return String(
                item.id ||
                item.student_id
            ) === String(studentId);
        });

    if (student) {
        fillStudentDetails(student);
    }
}


function handleFeeStructureChange(event) {
    const selectedOption =
        event.target.options[
            event.target.selectedIndex
        ];

    if (
        !selectedOption ||
        !selectedOption.value
    ) {
        setFormValue("#feeType", "");
        setFormValue("#amount", "");
        updateBalancePreview();

        return;
    }

    const structure =
        feeStructures.find(function (item) {
            return String(
                item.id ||
                item.fee_structure_id
            ) === String(
                selectedOption.value
            );
        });

    if (!structure) {
        return;
    }

    const feeName =
        structure.fee_name ||
        structure.feeName ||
        "";

    const amount =
        structure.amount ||
        "";

    const sessionId =
        structure.academic_session_id ||
        structure.session_id ||
        "";

    const termId =
        structure.term_id ||
        "";

    setFormValue(
        "#feeType",
        feeName
    );

    setFormValue(
        "#amount",
        amount
    );

    if (sessionId) {
        setFormValue(
            "#sessionId",
            sessionId
        );
    }

    if (termId) {
        setFormValue(
            "#termId",
            termId
        );
    }

    const existingFee =
        findExistingFeeRecord(
            getValue("#studentId"),
            selectedOption.value
        );

    if (existingFee) {
        const currentBalance =
            getRecordBalance(existingFee);

        setFormValue(
            "#amountPaid",
            currentBalance > 0
                ? ""
                : "0"
        );
    } else {
        setFormValue(
            "#amountPaid",
            "0"
        );
    }

    updateBalancePreview();
}


async function handleSubmit(event) {
    event.preventDefault();

    const studentId =
        getValue("#studentId");

    const feeStructureId =
        getValue("#feeStructureId");

    const sessionId =
        getValue("#sessionId");

    const termId =
        getValue("#termId");

    const feeType =
        getValue("#feeType");

    const amount =
        Number(
            getValue("#amount")
        );

    const amountPaid =
        Number(
            getValue("#amountPaid") || 0
        );

    const paymentMethod =
        getValue("#paymentMethod");

    const notes =
        getValue("#notes");

    if (!studentId) {
        notify(
            "Please select a student.",
            "danger"
        );
        return;
    }

    if (!feeStructureId) {
        notify(
            "Please select a fee structure.",
            "danger"
        );
        return;
    }

    if (!sessionId) {
        notify(
            "Please select an academic session.",
            "danger"
        );
        return;
    }

    if (!termId) {
        notify(
            "Please select a term.",
            "danger"
        );
        return;
    }

    if (!feeType) {
        notify(
            "The selected fee structure has no fee name.",
            "danger"
        );
        return;
    }

    if (
        Number.isNaN(amount) ||
        amount <= 0
    ) {
        notify(
            "The selected fee structure has no valid amount.",
            "danger"
        );
        return;
    }

    if (
        Number.isNaN(amountPaid) ||
        amountPaid < 0
    ) {
        notify(
            "Please enter a valid amount paid.",
            "danger"
        );
        return;
    }

    const existingFee =
        findExistingFeeRecord(
            studentId,
            feeStructureId
        );

    const outstandingBalance =
        existingFee
            ? getRecordBalance(existingFee)
            : amount;

    if (
        amountPaid > outstandingBalance
    ) {
        notify(
            "Amount paid cannot be greater than the current outstanding balance.",
            "danger"
        );
        return;
    }

    if (
        amountPaid > 0 &&
        !paymentMethod
    ) {
        notify(
            "Please select a payment method.",
            "danger"
        );
        return;
    }

    const submitButton =
        event.submitter;

    setSubmitState(
        submitButton,
        true
    );

    try {
        if (editingFeeId) {
            notify(
                "Editing an existing student fee record is not enabled. Use the payment option to record additional payments.",
                "danger"
            );

            return;
        }

        let studentFeeId =
            existingFee
                ? (
                    existingFee.id ||
                    existingFee.student_fee_id
                )
                : null;

        if (!existingFee) {
            const assignment =
                await request(
                    "/fees/assign",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            schoolId: undefined,
                            studentId:
                                studentId,
                            feeStructureId:
                                feeStructureId,
                            amount:
                                amount
                        })
                    }
                );

            const assignedFee =
                extractObject(assignment);

            studentFeeId =
                assignedFee.id ||
                assignedFee.student_fee_id ||
                assignedFee.studentFeeId;

            if (!studentFeeId) {
                throw new Error(
                    "Fee was assigned, but the student fee ID was not returned."
                );
            }
        }

        if (amountPaid > 0) {
            await request(
                "/fees/payment",
                {
                    method: "POST",
                    body: JSON.stringify({
                        studentFeeId:
                            studentFeeId,
                        studentId:
                            studentId,
                        amount:
                            amountPaid,
                        paymentMethod:
                            paymentMethod,
                        notes:
                            notes || null
                    })
                }
            );

            notify(
                existingFee
                    ? "Payment recorded successfully."
                    : "Fee assigned and payment recorded successfully.",
                "success"
            );
        } else {
            notify(
                existingFee
                    ? "The fee is already assigned to this student."
                    : "Fee assigned successfully.",
                existingFee
                    ? "info"
                    : "success"
            );
        }

        resetForm();

        hideFeeModal();

        await loadFees();
    } catch (error) {
        console.error(
            "Unable to save fee:",
            error
        );

        notify(
            error.message ||
            "Unable to save fee.",
            "danger"
        );
    } finally {
        setSubmitState(
            submitButton,
            false
        );
    }
}


/* ==========================================================================
   FEE RECORD SEARCH
   ========================================================================== */

function findExistingFeeRecord(
    studentId,
    feeStructureId
) {
    if (
        !studentId ||
        !feeStructureId
    ) {
        return null;
    }

    return feeRecords.find(function (record) {
        const recordStudentId =
            record.student_id ||
            record.studentId;

        const recordFeeStructureId =
            record.fee_structure_id ||
            record.feeStructureId;

        return (
            String(recordStudentId) ===
            String(studentId) &&
            String(recordFeeStructureId) ===
            String(feeStructureId)
        );
    }) || null;
}


/* ==========================================================================
   FEE TABLE
   ========================================================================== */

function renderFees() {
    const container =
        document.querySelector(
            "#feesTableBody"
        );

    if (!container) {
        return;
    }

    const searchInput =
        document.querySelector(
            "#searchInput"
        );

    const statusFilter =
        document.querySelector(
            "#statusFilter"
        );

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "";

    let records =
        feeRecords.slice();

    if (search) {
        records =
            records.filter(function (record) {
                const studentName =
                    getStudentName(
                        record
                    ).toLowerCase();

                const admission =
                    String(
                        record.admission_number ||
                        record.admissionNumber ||
                        ""
                    ).toLowerCase();

                const feeName =
                    String(
                        record.fee_name ||
                        record.feeName ||
                        ""
                    ).toLowerCase();

                return (
                    studentName.includes(search) ||
                    admission.includes(search) ||
                    feeName.includes(search)
                );
            });
    }

    if (selectedStatus) {
        records =
            records.filter(function (record) {
                return normalizeStatus(
                    record.payment_status ||
                    record.paymentStatus
                ) === selectedStatus;
            });
    }

    if (!records.length) {
        showNoRecords(container);
        return;
    }

    container.innerHTML =
        records
            .map(renderFeeRow)
            .join("");
}


function renderFeeRow(record) {
    const id =
        record.id ||
        record.student_fee_id ||
        "";

    const studentName =
        getStudentName(record);

    const admission =
        record.admission_number ||
        record.admissionNumber ||
        "-";

    const feeType =
        record.fee_name ||
        record.feeName ||
        "-";

    const session =
        record.session_name ||
        record.sessionName ||
        "-";

    const term =
        record.term_name ||
        record.termName ||
        "-";

    const amount =
        Number(
            record.amount_due || 0
        );

    const paid =
        Number(
            record.amount_paid || 0
        );

    const balance =
        getRecordBalance(record);

    const status =
        normalizeStatus(
            record.payment_status ||
            record.paymentStatus
        );

    return `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div
                        class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-semibold"
                        style="width:38px;height:38px;"
                    >
                        ${escapeHtml(
                            getInitials(
                                studentName
                            )
                        )}
                    </div>

                    <div>
                        <div class="student-name">
                            ${escapeHtml(
                                studentName
                            )}
                        </div>

                        <div class="student-meta">
                            Student Fee Record
                        </div>
                    </div>
                </div>
            </td>

            <td>
                ${escapeHtml(admission)}
            </td>

            <td>
                ${escapeHtml(feeType)}
            </td>

            <td>
                ${escapeHtml(session)}
            </td>

            <td>
                ${escapeHtml(term)}
            </td>

            <td class="amount-cell">
                ${formatCurrency(amount)}
            </td>

            <td class="amount-cell text-success">
                ${formatCurrency(paid)}
            </td>

            <td class="amount-cell ${balance > 0 ? "text-danger" : "text-success"}">
                ${formatCurrency(balance)}
            </td>

            <td>
                <span class="badge status-badge ${getStatusClass(status)}">
                    ${escapeHtml(
                        getStatusLabel(status)
                    )}
                </span>
            </td>

            <td>
                <div class="d-flex gap-1 flex-wrap">

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        data-action="view-fee"
                        data-id="${escapeAttribute(id)}"
                    >
                        <i class="bi bi-eye me-1"></i>
                        View
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-success"
                        data-action="print-receipt"
                        data-id="${escapeAttribute(id)}"
                    >
                        <i class="bi bi-receipt me-1"></i>
                        Receipt
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        data-action="print-statement"
                        data-id="${escapeAttribute(id)}"
                    >
                        <i class="bi bi-printer me-1"></i>
                        Statement
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        data-action="delete-fee"
                        data-id="${escapeAttribute(id)}"
                    >
                        <i class="bi bi-trash me-1"></i>
                        Delete
                    </button>

                </div>
            </td>
        </tr>
    `;
}


/* ==========================================================================
   STATUS
   ========================================================================== */

function normalizeStatus(status) {
    const value =
        String(status || "")
            .trim()
            .toLowerCase();

    if (value === "paid") {
        return "Paid";
    }

    if (
        value === "partially paid" ||
        value === "partial"
    ) {
        return "Partially Paid";
    }

    if (value === "overpaid") {
        return "Overpaid";
    }

    return "Unpaid";
}


function getStatusLabel(status) {
    if (status === "Paid") {
        return "Paid";
    }

    if (status === "Partially Paid") {
        return "Partially Paid";
    }

    if (status === "Overpaid") {
        return "Overpaid";
    }

    return "Unpaid";
}


function getStatusClass(status) {
    if (status === "Paid") {
        return "text-bg-success";
    }

    if (status === "Partially Paid") {
        return "text-bg-warning";
    }

    if (status === "Overpaid") {
        return "text-bg-info";
    }

    return "text-bg-secondary";
}


/* ==========================================================================
   ACTION HANDLING
   ========================================================================== */

function handleActionClick(event) {
    const button =
        event.target.closest(
            "[data-action]"
        );

    if (!button) {
        return;
    }

    const action =
        button.getAttribute(
            "data-action"
        );

    const id =
        button.getAttribute(
            "data-id"
        );

    if (
        action === "view-fee" &&
        id
    ) {
        viewFee(id);
        return;
    }

    if (
        action === "print-receipt" &&
        id
    ) {
        printFeeReceipt(id);
        return;
    }

    if (
        action === "print-statement" &&
        id
    ) {
        printFeeStatement(id);
        return;
    }

    if (
        action === "delete-fee" &&
        id
    ) {
        deleteFee(id, button);
    }
}


/* ==========================================================================
   VIEW FEE
   ========================================================================== */

function viewFee(id) {
    const record =
        feeRecords.find(function (item) {
            return String(
                item.id ||
                item.student_fee_id
            ) === String(id);
        });

    if (!record) {
        notify(
            "Fee record could not be found.",
            "danger"
        );

        return;
    }

    const studentId =
        record.student_id ||
        record.studentId ||
        "";

    const feeStructureId =
        record.fee_structure_id ||
        record.feeStructureId ||
        "";

    const currentBalance =
        getRecordBalance(record);

    resetForm();

    setFormValue(
        "#studentId",
        studentId
    );

    setFormValue(
        "#feeStructureId",
        feeStructureId
    );

    setFormValue(
        "#feeType",
        record.fee_name ||
        record.feeName ||
        ""
    );

    setFormValue(
        "#sessionId",
        record.academic_session_id ||
        record.session_id ||
        ""
    );

    setFormValue(
        "#termId",
        record.term_id ||
        ""
    );

    setFormValue(
        "#amount",
        record.amount_due ||
        ""
    );

    setFormValue(
        "#amountPaid",
        currentBalance > 0
            ? ""
            : "0"
    );

    updateBalancePreview();

    notify(
        currentBalance > 0
            ? "Fee record loaded. Enter the amount you want to pay."
            : "This fee has no outstanding balance.",
        "info"
    );

    showFeeModal();
}


/* ==========================================================================
   DELETE FEE
   ========================================================================== */

async function deleteFee(
    id,
    button
) {
    const record =
        feeRecords.find(function (item) {
            return String(
                item.id ||
                item.student_fee_id
            ) === String(id);
        });

    if (!record) {
        notify(
            "Fee record could not be found.",
            "danger"
        );

        return;
    }

    const studentName =
        getStudentName(record);

    const feeName =
        record.fee_name ||
        record.feeName ||
        "Fee";

    const amountPaid =
        Number(
            record.amount_paid || 0
        );

    let message =
        "Delete the fee record for " +
        studentName +
        " (" +
        feeName +
        ")?";

    if (amountPaid > 0) {
        message +=
            "\n\nThis record has " +
            formatCurrency(amountPaid) +
            " in payments. Deleting the fee record may also delete its associated payment records according to the configured database relationship.";
    }

    message +=
        "\n\nThis action cannot be undone.";

    const confirmed =
        window.confirm(message);

    if (!confirmed) {
        return;
    }

    if (button) {
        button.disabled = true;

        button.dataset.originalHtml =
            button.innerHTML;

        button.innerHTML =
            '<span class="spinner-border spinner-border-sm me-1"></span>Deleting...';
    }

    try {
        await request(
            "/fees/student-records/" +
            encodeURIComponent(id),
            {
                method: "DELETE"
            }
        );

        notify(
            "Fee record deleted successfully.",
            "success"
        );

        await loadFees();
    } catch (error) {
        console.error(
            "Unable to delete fee record:",
            error
        );

        notify(
            error.message ||
            "Unable to delete fee record.",
            "danger"
        );
    } finally {
        if (button) {
            button.disabled = false;

            if (
                button.dataset.originalHtml
            ) {
                button.innerHTML =
                    button.dataset.originalHtml;
            }
        }
    }
}


/* ==========================================================================
   PAYMENT HISTORY
   ========================================================================== */

async function loadPaymentHistory(
    record
) {
    const studentId =
        record.student_id ||
        record.studentId;

    const studentFeeId =
        record.id ||
        record.student_fee_id;

    if (!studentId) {
        throw new Error(
            "The fee record does not contain a student ID."
        );
    }

    if (!studentFeeId) {
        throw new Error(
            "The fee record does not contain a student fee ID."
        );
    }

    const endpoint =
        "/fees/student/" +
        encodeURIComponent(studentId) +
        "/payments?studentFeeId=" +
        encodeURIComponent(studentFeeId);

    const data =
        await request(endpoint);

    return extractArray(data);
}


/* ==========================================================================
   SCHOOL INFORMATION
   ========================================================================== */

async function loadCurrentUserAndSchool() {
    if (schoolInfo) {
        return schoolInfo;
    }

    let user =
        getStoredCurrentUser();

    try {
        const authData =
            await request("/auth/me");

        const authenticatedUser =
            extractAuthenticatedUser(
                authData
            );

        if (authenticatedUser) {
            user = authenticatedUser;
        }
    } catch (error) {
        console.warn(
            "Unable to refresh authenticated user for printing:",
            error
        );
    }

    currentUser = user || {};

    const schoolId =
        currentUser.school_id ||
        currentUser.schoolId ||
        currentUser.schoolID ||
        null;

    if (!schoolId) {
        throw new Error(
            "The current user is not connected to a school."
        );
    }

    const schoolData =
        await request(
            "/schools/" +
            encodeURIComponent(schoolId)
        );

    schoolInfo =
        extractObject(schoolData);

    return schoolInfo;
}


function getStoredCurrentUser() {
    const stored =
        sessionStorage.getItem(
            "school_management_user"
        ) ||
        localStorage.getItem(
            "school_management_user"
        );

    if (!stored) {
        return {};
    }

    try {
        return JSON.parse(stored) || {};
    } catch (error) {
        console.warn(
            "Unable to parse stored user:",
            error
        );

        return {};
    }
}


function extractAuthenticatedUser(data) {
    if (
        data &&
        data.user &&
        typeof data.user === "object"
    ) {
        return data.user;
    }

    if (
        data &&
        data.data &&
        data.data.user &&
        typeof data.data.user === "object"
    ) {
        return data.data.user;
    }

    return null;
}


/* ==========================================================================
   PRINT RECEIPT
   ========================================================================== */

async function printFeeReceipt(id) {
    const printWindow =
        openPrintWindow();

    if (!printWindow) {
        notify(
            "The receipt window was blocked by the browser. Please allow pop-ups for this site and try again.",
            "danger"
        );

        return;
    }

    printWindow.document.write(
        buildPrintLoadingDocument(
            "Preparing fee receipt..."
        )
    );

    printWindow.document.close();

    try {
        const record =
            findFeeRecordById(id);

        if (!record) {
            throw new Error(
                "Fee record could not be found."
            );
        }

        const payments =
            await loadPaymentHistory(
                record
            );

        if (!payments.length) {
            throw new Error(
                "No payment transaction has been recorded for this fee yet."
            );
        }

        const school =
            await loadCurrentUserAndSchool();

        const latestPayment =
            payments[0];

        const html =
            buildReceiptDocument(
                record,
                latestPayment,
                payments,
                school
            );

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();

        notify(
            "Fee receipt prepared for printing.",
            "success"
        );
    } catch (error) {
        console.error(
            "Unable to prepare fee receipt:",
            error
        );

        printWindow.document.open();
        printWindow.document.write(
            buildPrintErrorDocument(
                "Unable to prepare fee receipt.",
                error.message
            )
        );
        printWindow.document.close();

        notify(
            error.message ||
            "Unable to prepare fee receipt.",
            "danger"
        );
    }
}


/* ==========================================================================
   PRINT STATEMENT
   ========================================================================== */

async function printFeeStatement(id) {
    const printWindow =
        openPrintWindow();

    if (!printWindow) {
        notify(
            "The statement window was blocked by the browser. Please allow pop-ups for this site and try again.",
            "danger"
        );

        return;
    }

    printWindow.document.write(
        buildPrintLoadingDocument(
            "Preparing fee statement..."
        )
    );

    printWindow.document.close();

    try {
        const record =
            findFeeRecordById(id);

        if (!record) {
            throw new Error(
                "Fee record could not be found."
            );
        }

        const payments =
            await loadPaymentHistory(
                record
            );

        const school =
            await loadCurrentUserAndSchool();

        const html =
            buildStatementDocument(
                record,
                payments,
                school
            );

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();

        notify(
            "Fee statement prepared for printing.",
            "success"
        );
    } catch (error) {
        console.error(
            "Unable to prepare fee statement:",
            error
        );

        printWindow.document.open();
        printWindow.document.write(
            buildPrintErrorDocument(
                "Unable to prepare fee statement.",
                error.message
            )
        );
        printWindow.document.close();

        notify(
            error.message ||
            "Unable to prepare fee statement.",
            "danger"
        );
    }
}


/* ==========================================================================
   PRINT WINDOW
   ========================================================================== */

function openPrintWindow() {
    return window.open(
        "",
        "_blank",
        "width=900,height=1000,resizable=yes,scrollbars=yes"
    );
}


function buildPrintLoadingDocument(
    message
) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Preparing Print</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 60px;
            text-align: center;
            color: #333;
        }

        .spinner {
            width: 36px;
            height: 36px;
            border: 4px solid #ddd;
            border-top-color: #333;
            border-radius: 50%;
            margin: 0 auto 20px;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }
    </style>
</head>
<body>
    <div class="spinner"></div>
    <h3>${escapeHtml(message)}</h3>
    <p>Please wait...</p>
</body>
</html>
    `;
}


function buildPrintErrorDocument(
    title,
    message
) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(title)}</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 60px;
            text-align: center;
            color: #333;
        }

        .error {
            max-width: 650px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 30px;
            border-radius: 8px;
        }

        button {
            padding: 10px 18px;
            border: 0;
            background: #333;
            color: #fff;
            border-radius: 5px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="error">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(message || "Unknown error.")}</p>
        <button onclick="window.close()">Close</button>
    </div>
</body>
</html>
    `;
}


/* ==========================================================================
   RECEIPT DOCUMENT
   ========================================================================== */

function buildReceiptDocument(
    record,
    payment,
    payments,
    school
) {
    const schoolName =
        getSchoolName(school);

    const schoolAddress =
        getSchoolAddress(school);

    const schoolPhone =
        getSchoolPhone(school);

    const schoolEmail =
        getSchoolEmail(school);

    const schoolLogo =
        getSchoolLogo(school);

    const studentName =
        getStudentName(
            payment
        ) !== "Unknown Student"
            ? getStudentName(payment)
            : getStudentName(record);

    const admissionNumber =
        payment.admission_number ||
        payment.admissionNumber ||
        record.admission_number ||
        record.admissionNumber ||
        "-";

    const feeName =
        payment.fee_name ||
        payment.feeName ||
        record.fee_name ||
        record.feeName ||
        "School Fee";

    const session =
        record.session_name ||
        record.sessionName ||
        getSessionName(
            record.academic_session_id ||
            record.session_id
        );

    const term =
        record.term_name ||
        record.termName ||
        getTermName(
            record.term_id
        );

    const amountDue =
        getPaymentAmountDue(
            payment,
            record
        );

    const totalPaid =
        getPaymentTotalPaid(
            payment,
            record,
            payments
        );

    const balance =
        getPaymentBalance(
            payment,
            record,
            amountDue,
            totalPaid
        );

    const paymentAmount =
        Number(
            payment.amount || 0
        );

    const receiptNumber =
        payment.receipt_number ||
        payment.receiptNumber ||
        payment.transaction_reference ||
        payment.transactionReference ||
        "Payment Receipt";

    const paymentMethod =
        formatPaymentMethod(
            payment.payment_method ||
            payment.paymentMethod
        );

    const paymentDate =
        formatDate(
            payment.payment_date ||
            payment.paymentDate ||
            payment.created_at ||
            payment.createdAt
        );

    const notes =
        payment.notes ||
        "";

    return buildPrintShell(
        "Fee Payment Receipt",
        schoolLogo,
        schoolName,
        schoolAddress,
        schoolPhone,
        schoolEmail,
        `
        <div class="document-header">
            <div>
                <div class="document-label">
                    OFFICIAL PAYMENT RECEIPT
                </div>

                <h2>
                    Fee Payment Receipt
                </h2>
            </div>

            <div class="receipt-number">
                <div class="small-label">
                    Receipt No.
                </div>

                <strong>
                    ${escapeHtml(receiptNumber)}
                </strong>
            </div>
        </div>

        <div class="section-title">
            Student Information
        </div>

        <div class="info-grid">
            <div class="info-item">
                <span>Student Name</span>
                <strong>${escapeHtml(studentName)}</strong>
            </div>

            <div class="info-item">
                <span>Admission No.</span>
                <strong>${escapeHtml(admissionNumber)}</strong>
            </div>

            <div class="info-item">
                <span>Academic Session</span>
                <strong>${escapeHtml(session || "-")}</strong>
            </div>

            <div class="info-item">
                <span>Term</span>
                <strong>${escapeHtml(term || "-")}</strong>
            </div>
        </div>

        <div class="section-title">
            Payment Information
        </div>

        <table class="details-table">
            <tbody>
                <tr>
                    <td>Fee Type</td>
                    <td>${escapeHtml(feeName)}</td>
                </tr>

                <tr>
                    <td>Payment Date</td>
                    <td>${escapeHtml(paymentDate)}</td>
                </tr>

                <tr>
                    <td>Payment Method</td>
                    <td>${escapeHtml(paymentMethod)}</td>
                </tr>

                <tr>
                    <td>Amount Due</td>
                    <td class="money">${formatCurrency(amountDue)}</td>
                </tr>

                <tr class="highlight-row">
                    <td>Amount Paid</td>
                    <td class="money">${formatCurrency(paymentAmount)}</td>
                </tr>

                <tr>
                    <td>Total Paid To Date</td>
                    <td class="money">${formatCurrency(totalPaid)}</td>
                </tr>

                <tr>
                    <td>Outstanding Balance</td>
                    <td class="money">${formatCurrency(balance)}</td>
                </tr>
            </tbody>
        </table>

        ${
            notes
                ? `
        <div class="notes">
            <strong>Payment Notes:</strong>
            ${escapeHtml(notes)}
        </div>
        `
                : ""
        }

        <div class="payment-confirmation">
            <div class="confirmation-title">
                PAYMENT RECEIVED
            </div>

            <div class="confirmation-amount">
                ${formatCurrency(paymentAmount)}
            </div>

            <p>
                This receipt acknowledges the payment recorded
                for the student and fee stated above.
            </p>
        </div>

        <div class="signature-area">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div>Authorized Officer</div>
            </div>

            <div class="signature-box">
                <div class="signature-line"></div>
                <div>Parent / Guardian</div>
            </div>
        </div>

        <div class="footer-note">
            Generated from the School Management System on
            ${escapeHtml(formatDate(new Date()))}.
        </div>
        `
    );
}


/* ==========================================================================
   STATEMENT DOCUMENT
   ========================================================================== */

function buildStatementDocument(
    record,
    payments,
    school
) {
    const schoolName =
        getSchoolName(school);

    const schoolAddress =
        getSchoolAddress(school);

    const schoolPhone =
        getSchoolPhone(school);

    const schoolEmail =
        getSchoolEmail(school);

    const schoolLogo =
        getSchoolLogo(school);

    const studentName =
        payments.length &&
        getStudentName(payments[0]) !== "Unknown Student"
            ? getStudentName(payments[0])
            : getStudentName(record);

    const admissionNumber =
        payments.length
            ? (
                payments[0].admission_number ||
                payments[0].admissionNumber ||
                record.admission_number ||
                record.admissionNumber ||
                "-"
            )
            : (
                record.admission_number ||
                record.admissionNumber ||
                "-"
            );

    const feeName =
        payments.length
            ? (
                payments[0].fee_name ||
                payments[0].feeName ||
                record.fee_name ||
                record.feeName ||
                "School Fee"
            )
            : (
                record.fee_name ||
                record.feeName ||
                "School Fee"
            );

    const session =
        record.session_name ||
        record.sessionName ||
        getSessionName(
            record.academic_session_id ||
            record.session_id
        );

    const term =
        record.term_name ||
        record.termName ||
        getTermName(
            record.term_id
        );

    const amountDue =
        payments.length
            ? getPaymentAmountDue(
                payments[0],
                record
            )
            : Number(
                record.amount_due || 0
            );

    const totalPaid =
        payments.length
            ? getPaymentTotalPaid(
                payments[0],
                record,
                payments
            )
            : Number(
                record.amount_paid || 0
            );

    const balance =
        payments.length
            ? getPaymentBalance(
                payments[0],
                record,
                amountDue,
                totalPaid
            )
            : getRecordBalance(record);

    const paymentRows =
        payments.length
            ? payments
                .map(function (payment, index) {
                    const receiptNumber =
                        payment.receipt_number ||
                        payment.receiptNumber ||
                        payment.transaction_reference ||
                        payment.transactionReference ||
                        "-";

                    const date =
                        formatDate(
                            payment.payment_date ||
                            payment.paymentDate ||
                            payment.created_at ||
                            payment.createdAt
                        );

                    const method =
                        formatPaymentMethod(
                            payment.payment_method ||
                            payment.paymentMethod
                        );

                    const amount =
                        Number(
                            payment.amount || 0
                        );

                    return `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${escapeHtml(date)}</td>
                            <td>${escapeHtml(receiptNumber)}</td>
                            <td>${escapeHtml(method)}</td>
                            <td class="money">
                                ${formatCurrency(amount)}
                            </td>
                        </tr>
                    `;
                })
                .join("")
            : `
                <tr>
                    <td colspan="5" class="empty-cell">
                        No payment transactions have been recorded.
                    </td>
                </tr>
            `;

    return buildPrintShell(
        "School Fee Statement",
        schoolLogo,
        schoolName,
        schoolAddress,
        schoolPhone,
        schoolEmail,
        `
        <div class="document-header">
            <div>
                <div class="document-label">
                    OFFICIAL FEE STATEMENT
                </div>

                <h2>
                    School Fee Statement
                </h2>
            </div>

            <div class="statement-date">
                <div class="small-label">
                    Statement Date
                </div>

                <strong>
                    ${escapeHtml(
                        formatDate(new Date())
                    )}
                </strong>
            </div>
        </div>

        <div class="section-title">
            Student Information
        </div>

        <div class="info-grid">
            <div class="info-item">
                <span>Student Name</span>
                <strong>${escapeHtml(studentName)}</strong>
            </div>

            <div class="info-item">
                <span>Admission No.</span>
                <strong>${escapeHtml(admissionNumber)}</strong>
            </div>

            <div class="info-item">
                <span>Academic Session</span>
                <strong>${escapeHtml(session || "-")}</strong>
            </div>

            <div class="info-item">
                <span>Term</span>
                <strong>${escapeHtml(term || "-")}</strong>
            </div>
        </div>

        <div class="section-title">
            Fee Summary
        </div>

        <div class="summary-grid">
            <div class="summary-box">
                <span>Fee Amount</span>
                <strong>
                    ${formatCurrency(amountDue)}
                </strong>
            </div>

            <div class="summary-box paid">
                <span>Total Paid</span>
                <strong>
                    ${formatCurrency(totalPaid)}
                </strong>
            </div>

            <div class="summary-box balance">
                <span>Outstanding</span>
                <strong>
                    ${formatCurrency(balance)}
                </strong>
            </div>
        </div>

        <div class="section-title">
            Payment History
        </div>

        <table class="payments-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Receipt No.</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                </tr>
            </thead>

            <tbody>
                ${paymentRows}
            </tbody>

            <tfoot>
                <tr>
                    <td colspan="4">
                        <strong>Total Paid</strong>
                    </td>

                    <td class="money">
                        <strong>
                            ${formatCurrency(totalPaid)}
                        </strong>
                    </td>
                </tr>
            </tfoot>
        </table>

        <div class="balance-summary">
            <div>
                <span>Total Fee</span>
                <strong>
                    ${formatCurrency(amountDue)}
                </strong>
            </div>

            <div>
                <span>Total Paid</span>
                <strong>
                    ${formatCurrency(totalPaid)}
                </strong>
            </div>

            <div>
                <span>Outstanding Balance</span>
                <strong>
                    ${formatCurrency(balance)}
                </strong>
            </div>
        </div>

        <div class="statement-note">
            <strong>Important:</strong>
            This statement reflects payment transactions recorded
            in the school's fee management system for the selected
            student fee record.
        </div>

        <div class="signature-area">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div>Authorized Officer</div>
            </div>

            <div class="signature-box">
                <div class="signature-line"></div>
                <div>Parent / Guardian</div>
            </div>
        </div>

        <div class="footer-note">
            Generated from the School Management System on
            ${escapeHtml(formatDate(new Date()))}.
        </div>
        `
    );
}


/* ==========================================================================
   PRINT SHELL
   ========================================================================== */

function buildPrintShell(
    title,
    schoolLogo,
    schoolName,
    schoolAddress,
    schoolPhone,
    schoolEmail,
    content
) {
    const contactParts = [];

    if (schoolPhone) {
        contactParts.push(
            escapeHtml(schoolPhone)
        );
    }

    if (schoolEmail) {
        contactParts.push(
            escapeHtml(schoolEmail)
        );
    }

    const contactLine =
        contactParts.join(" &nbsp; | &nbsp; ");

    const logoHtml =
        schoolLogo
            ? `
                <img
                    src="${escapeAttribute(schoolLogo)}"
                    alt="School Logo"
                    class="school-logo"
                >
            `
            : `
                <div class="school-logo-placeholder">
                    SCHOOL
                </div>
            `;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>${escapeHtml(title)}</title>

    <style>
        * {
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 12mm;
        }

        body {
            margin: 0;
            background: #f1f3f5;
            color: #212529;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
            font-size: 13px;
            line-height: 1.5;
        }

        .print-page {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            background: #fff;
            padding: 18mm;
            box-shadow:
                0 2px 12px
                rgba(0, 0, 0, 0.12);
        }

        .school-header {
            display: flex;
            align-items: center;
            gap: 18px;
            padding-bottom: 16px;
            border-bottom: 2px solid #212529;
        }

        .school-logo {
            width: 82px;
            height: 82px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .school-logo-placeholder {
            width: 82px;
            height: 82px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #ced4da;
            font-size: 11px;
            font-weight: 700;
            color: #6c757d;
            flex-shrink: 0;
        }

        .school-details {
            flex: 1;
        }

        .school-name {
            margin: 0;
            font-size: 23px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .school-address {
            margin-top: 5px;
            color: #495057;
        }

        .school-contact {
            margin-top: 3px;
            color: #495057;
            font-size: 12px;
        }

        .document-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-top: 22px;
            padding-bottom: 12px;
            border-bottom: 1px solid #dee2e6;
        }

        .document-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.5px;
            color: #6c757d;
            margin-bottom: 4px;
        }

        .document-header h2 {
            margin: 0;
            font-size: 21px;
        }

        .receipt-number,
        .statement-date {
            text-align: right;
            min-width: 150px;
        }

        .small-label {
            font-size: 10px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .section-title {
            margin-top: 22px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #dee2e6;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-grid {
            display: grid;
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
            gap: 10px 18px;
        }

        .info-item {
            padding: 9px 11px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
        }

        .info-item span {
            display: block;
            color: #6c757d;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .details-table,
        .payments-table {
            width: 100%;
            border-collapse: collapse;
        }

        .details-table td {
            padding: 10px 11px;
            border-bottom: 1px solid #e9ecef;
        }

        .details-table td:first-child {
            width: 42%;
            font-weight: 600;
            color: #495057;
        }

        .details-table td:last-child {
            text-align: right;
        }

        .money {
            white-space: nowrap;
            text-align: right;
        }

        .highlight-row td {
            background: #f8f9fa;
            font-weight: 700;
        }

        .payment-confirmation {
            margin-top: 24px;
            padding: 20px;
            text-align: center;
            border: 1px solid #ced4da;
            border-radius: 6px;
        }

        .confirmation-title {
            font-size: 11px;
            letter-spacing: 1.5px;
            font-weight: 700;
        }

        .confirmation-amount {
            margin: 5px 0;
            font-size: 25px;
            font-weight: 800;
        }

        .payment-confirmation p {
            margin: 0;
            color: #6c757d;
        }

        .notes {
            margin-top: 14px;
            padding: 10px;
            background: #f8f9fa;
            border-left: 3px solid #6c757d;
        }

        .summary-grid {
            display: grid;
            grid-template-columns:
                repeat(3, minmax(0, 1fr));
            gap: 10px;
        }

        .summary-box {
            padding: 13px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
        }

        .summary-box span {
            display: block;
            color: #6c757d;
            font-size: 10px;
            text-transform: uppercase;
        }

        .summary-box strong {
            display: block;
            margin-top: 4px;
            font-size: 17px;
        }

        .payments-table th,
        .payments-table td {
            padding: 9px 8px;
            border: 1px solid #dee2e6;
        }

        .payments-table th {
            background: #f1f3f5;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: left;
        }

        .payments-table td:first-child {
            text-align: center;
            width: 35px;
        }

        .payments-table tfoot td {
            background: #f8f9fa;
        }

        .empty-cell {
            text-align: center;
            color: #6c757d;
            padding: 20px !important;
        }

        .balance-summary {
            margin-top: 18px;
            display: flex;
            justify-content: flex-end;
            gap: 28px;
            border-top: 2px solid #212529;
            padding-top: 12px;
        }

        .balance-summary > div {
            text-align: right;
        }

        .balance-summary span {
            display: block;
            font-size: 10px;
            color: #6c757d;
            text-transform: uppercase;
        }

        .balance-summary strong {
            font-size: 15px;
        }

        .statement-note {
            margin-top: 20px;
            padding: 11px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            font-size: 11px;
        }

        .signature-area {
            display: flex;
            justify-content: space-between;
            gap: 70px;
            margin-top: 60px;
        }

        .signature-box {
            flex: 1;
            text-align: center;
            font-size: 11px;
        }

        .signature-line {
            height: 1px;
            background: #212529;
            margin-bottom: 7px;
        }

        .footer-note {
            margin-top: 35px;
            padding-top: 10px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 9px;
        }

        .print-controls {
            position: fixed;
            top: 15px;
            right: 15px;
            z-index: 1000;
            display: flex;
            gap: 8px;
        }

        .print-controls button {
            border: 0;
            border-radius: 5px;
            padding: 9px 14px;
            cursor: pointer;
            font-weight: 600;
            background: #212529;
            color: #fff;
        }

        .print-controls button.close {
            background: #6c757d;
        }

        @media print {
            body {
                background: #fff;
            }

            .print-page {
                width: auto;
                min-height: auto;
                margin: 0;
                padding: 0;
                box-shadow: none;
            }

            .print-controls {
                display: none !important;
            }
        }

        @media screen and (max-width: 850px) {
            .print-page {
                width: auto;
                min-height: auto;
                margin: 0;
                padding: 20px;
            }

            .school-header,
            .document-header {
                flex-direction: column;
            }

            .receipt-number,
            .statement-date {
                text-align: left;
            }

            .summary-grid,
            .info-grid {
                grid-template-columns: 1fr;
            }

            .balance-summary {
                flex-direction: column;
                gap: 8px;
            }

            .balance-summary > div {
                text-align: left;
            }

            .signature-area {
                gap: 25px;
            }
        }
    </style>
</head>

<body>

    <div class="print-controls">
        <button onclick="window.print()">
            Print / Save as PDF
        </button>

        <button
            class="close"
            onclick="window.close()"
        >
            Close
        </button>
    </div>

    <main class="print-page">

        <header class="school-header">

            ${logoHtml}

            <div class="school-details">

                <h1 class="school-name">
                    ${escapeHtml(
                        schoolName ||
                        "School Name"
                    )}
                </h1>

                ${
                    schoolAddress
                        ? `
                            <div class="school-address">
                                ${escapeHtml(
                                    schoolAddress
                                )}
                            </div>
                        `
                        : ""
                }

                ${
                    contactLine
                        ? `
                            <div class="school-contact">
                                ${contactLine}
                            </div>
                        `
                        : ""
                }

            </div>

        </header>

        ${content}

    </main>

    <script>
        window.addEventListener(
            "load",
            function () {
                const images =
                    Array.from(
                        document.images
                    );

                if (!images.length) {
                    return;
                }

                let loaded = 0;

                function checkImages() {
                    loaded++;

                    if (
                        loaded >=
                        images.length
                    ) {
                        setTimeout(
                            function () {
                                window.focus();
                            },
                            200
                        );
                    }
                }

                images.forEach(
                    function (image) {
                        if (image.complete) {
                            checkImages();
                        } else {
                            image.addEventListener(
                                "load",
                                checkImages,
                                {
                                    once: true
                                }
                            );

                            image.addEventListener(
                                "error",
                                checkImages,
                                {
                                    once: true
                                }
                            );
                        }
                    }
                );
            }
        );
    </script>

</body>
</html>
    `;
}


/* ==========================================================================
   PRINT DATA HELPERS
   ========================================================================== */

function findFeeRecordById(id) {
    return feeRecords.find(function (item) {
        return String(
            item.id ||
            item.student_fee_id
        ) === String(id);
    }) || null;
}


function getSchoolName(school) {
    return (
        school.school_name ||
        school.schoolName ||
        school.name ||
        ""
    );
}


function getSchoolAddress(school) {
    return (
        school.address ||
        school.school_address ||
        school.schoolAddress ||
        ""
    );
}


function getSchoolPhone(school) {
    return (
        school.phone ||
        school.school_phone ||
        school.schoolPhone ||
        ""
    );
}


function getSchoolEmail(school) {
    return (
        school.email ||
        school.school_email ||
        school.schoolEmail ||
        ""
    );
}


function getSchoolLogo(school) {
    let logo =
        school.logo ||
        school.logo_url ||
        school.logoUrl ||
        "";

    if (!logo) {
        logo =
            localStorage.getItem(
                "school_logo"
            ) ||
            localStorage.getItem(
                "schoolLogo"
            ) ||
            localStorage.getItem(
                "school_logo_url"
            ) ||
            localStorage.getItem(
                "schoolLogoUrl"
            ) ||
            "";
    }

    if (!logo) {
        return "";
    }

    logo = String(logo).trim();

    if (
        logo.startsWith("data:") ||
        logo.startsWith("http://") ||
        logo.startsWith("https://") ||
        logo.startsWith("/")
    ) {
        return logo;
    }

    return "/" + logo;
}


function getSessionName(id) {
    if (!id) {
        return "";
    }

    const session =
        academicSessions.find(function (item) {
            return String(
                item.id ||
                item.session_id
            ) === String(id);
        });

    if (!session) {
        return "";
    }

    return (
        session.session_name ||
        session.name ||
        session.sessionName ||
        ""
    );
}


function getTermName(id) {
    if (!id) {
        return "";
    }

    const term =
        terms.find(function (item) {
            return String(
                item.id ||
                item.term_id
            ) === String(id);
        });

    if (!term) {
        return "";
    }

    return (
        term.term_name ||
        term.name ||
        term.termName ||
        ""
    );
}


function getPaymentAmountDue(
    payment,
    record
) {
    const paymentAmountDue =
        Number(
            payment &&
            (
                payment.fee_amount ||
                payment.amount_due
            )
        );

    if (
        Number.isFinite(paymentAmountDue) &&
        paymentAmountDue > 0
    ) {
        return paymentAmountDue;
    }

    return Number(
        record &&
        record.amount_due
            ? record.amount_due
            : 0
    );
}


function getPaymentTotalPaid(
    payment,
    record,
    payments
) {
    if (
        payment &&
        payment.amount_paid !== undefined &&
        payment.amount_paid !== null
    ) {
        return Number(
            payment.amount_paid
        ) || 0;
    }

    if (
        record &&
        record.amount_paid !== undefined &&
        record.amount_paid !== null
    ) {
        return Number(
            record.amount_paid
        ) || 0;
    }

    return payments.reduce(
        function (sum, item) {
            return (
                sum +
                Number(
                    item.amount || 0
                )
            );
        },
        0
    );
}


function getPaymentBalance(
    payment,
    record,
    amountDue,
    totalPaid
) {
    if (
        payment &&
        payment.balance !== undefined &&
        payment.balance !== null &&
        payment.balance !== ""
    ) {
        return Number(
            payment.balance
        ) || 0;
    }

    if (
        record &&
        record.balance !== undefined &&
        record.balance !== null &&
        record.balance !== ""
    ) {
        return Number(
            record.balance
        ) || 0;
    }

    return (
        Number(amountDue || 0) -
        Number(totalPaid || 0)
    );
}


function formatPaymentMethod(method) {
    if (!method) {
        return "Not specified";
    }

    return String(method)
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
}


function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat(
        "en-NG",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(date);
}


/* ==========================================================================
   FORM / SUMMARY HELPERS
   ========================================================================== */

function fillStudentDetails(student) {
    const studentId =
        student.id ||
        student.student_id;

    if (studentId) {
        setFormValue(
            "#studentId",
            studentId
        );
    }
}


function updateBalancePreview() {
    const amount =
        Number(
            getValue("#amount") || 0
        );

    const paid =
        Number(
            getValue("#amountPaid") || 0
        );

    const balance =
        Math.max(
            amount - paid,
            0
        );

    const element =
        document.querySelector("#feeBalance") ||
        document.querySelector("#balance") ||
        document.querySelector("[data-fee-balance]");

    if (element) {
        element.textContent =
            formatCurrency(balance);
    }
}


function updateSummary() {
    const totalRecords =
        feeRecords.length;

    const totalAmount =
        feeRecords.reduce(
            function (sum, record) {
                return (
                    sum +
                    Number(
                        record.amount_due || 0
                    )
                );
            },
            0
        );

    const totalPaid =
        feeRecords.reduce(
            function (sum, record) {
                return (
                    sum +
                    Number(
                        record.amount_paid || 0
                    )
                );
            },
            0
        );

    const totalBalance =
        feeRecords.reduce(
            function (sum, record) {
                return (
                    sum +
                    getRecordBalance(record)
                );
            },
            0
        );

    setText(
        "#totalRecords",
        String(totalRecords)
    );

    setText(
        "#totalAmount",
        formatCurrency(totalAmount)
    );

    setText(
        "#totalPaid",
        formatCurrency(totalPaid)
    );

    setText(
        "#totalBalance",
        formatCurrency(totalBalance)
    );
}


function getRecordBalance(record) {
    if (
        record &&
        record.balance !== null &&
        record.balance !== undefined &&
        record.balance !== ""
    ) {
        return Number(record.balance) || 0;
    }

    const amount =
        Number(
            record &&
            record.amount_due
                ? record.amount_due
                : 0
        );

    const paid =
        Number(
            record &&
            record.amount_paid
                ? record.amount_paid
                : 0
        );

    return amount - paid;
}


function resetForm() {
    editingFeeId = null;

    const form =
        document.querySelector("#feeForm");

    if (form) {
        form.reset();
    }

    populateStudentSelect();
    populateSessionSelect();
    populateTermSelect();
    populateFeeStructureSelect();

    updateBalancePreview();
}


function showFeeModal() {
    if (feeModal) {
        feeModal.show();
    }
}


function hideFeeModal() {
    if (feeModal) {
        feeModal.hide();
    }
}


function setSubmitState(
    button,
    loading
) {
    if (!button) {
        return;
    }

    if (loading) {
        button.dataset.originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        return;
    }

    button.disabled = false;

    if (button.dataset.originalText) {
        button.innerHTML =
            button.dataset.originalText;
    }
}


function setFormValue(
    selector,
    value
) {
    const element =
        document.querySelector(selector);

    if (element) {
        element.value =
            value === null ||
            value === undefined
                ? ""
                : value;
    }
}


function getValue(selector) {
    const element =
        document.querySelector(selector);

    if (!element) {
        return "";
    }

    return element.value || "";
}


function setText(
    selector,
    value
) {
    const element =
        document.querySelector(selector);

    if (element) {
        element.textContent = value;
    }
}


/* ==========================================================================
   GENERAL HELPERS
   ========================================================================== */

function getStudentName(record) {
    const directName =
        record.student_name ||
        record.studentName;

    if (directName) {
        return directName;
    }

    return [
        record.first_name ||
        record.firstName ||
        "",

        record.middle_name ||
        record.middleName ||
        "",

        record.last_name ||
        record.lastName ||
        ""
    ]
        .filter(Boolean)
        .join(" ") ||
        "Unknown Student";
}


function getAdmissionText(student) {
    const admission =
        student.admission_number ||
        student.admissionNumber ||
        "";

    if (!admission) {
        return "";
    }

    return " - " + admission;
}


function getFeeStructureLabel(structure) {
    const name =
        structure.fee_name ||
        structure.feeName ||
        "Fee Structure";

    const amount =
        Number(
            structure.amount || 0
        );

    if (amount > 0) {
        return (
            name +
            " - " +
            formatCurrency(amount)
        );
    }

    return name;
}


function getInitials(name) {
    if (
        window.App &&
        typeof window.App.getInitials ===
            "function"
    ) {
        return window.App.getInitials(name);
    }

    return String(name)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(function (word) {
            return word
                .charAt(0)
                .toUpperCase();
        })
        .join("");
}


function formatCurrency(amount) {
    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }
    ).format(
        Number(amount) || 0
    );
}


function extractArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.data)
    ) {
        return data.data;
    }

    if (
        data &&
        Array.isArray(data.rows)
    ) {
        return data.rows;
    }

    if (
        data &&
        data.data &&
        Array.isArray(data.data.rows)
    ) {
        return data.data.rows;
    }

    return [];
}


function extractObject(data) {
    if (
        data &&
        data.data &&
        !Array.isArray(data.data)
    ) {
        return data.data;
    }

    if (
        data &&
        data.record
    ) {
        return data.record;
    }

    if (
        data &&
        data.studentFee
    ) {
        return data.studentFee;
    }

    if (
        data &&
        data.payment
    ) {
        return data.payment;
    }

    if (
        data &&
        typeof data === "object"
    ) {
        return data;
    }

    return {};
}


/* ==========================================================================
   LOADING / EMPTY STATES
   ========================================================================== */

function showLoading() {
    const container =
        document.querySelector(
            "#feesTableBody"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <tr>
            <td colspan="10" class="text-center py-5 text-secondary">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Loading fee records...
            </td>
        </tr>
    `;
}


function showNoRecords(container) {
    container.innerHTML = `
        <tr>
            <td colspan="10" class="text-center py-5 text-secondary">
                <div class="fs-1 mb-2">₦</div>

                <h5>
                    No fee records found
                </h5>

                <p class="mb-0">
                    No student fee records match the current search or status filter.
                </p>
            </td>
        </tr>
    `;
}


function showError(message) {
    const container =
        document.querySelector(
            "#feesTableBody"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <tr>
            <td colspan="10" class="text-center py-5">
                <h5>
                    Unable to load fees
                </h5>

                <p class="text-secondary mb-0">
                    ${escapeHtml(message)}
                </p>
            </td>
        </tr>
    `;
}


/* ==========================================================================
   NOTIFICATIONS
   ========================================================================== */

function notify(
    message,
    type = "success"
) {
    if (
        typeof window.showNotification ===
        "function"
    ) {
        window.showNotification(
            message,
            type
        );

        return;
    }

    let container =
        document.querySelector(
            "#notification-container"
        );

    if (!container) {
        container =
            document.createElement("div");

        container.id =
            "notification-container";

        container.style.position =
            "fixed";

        container.style.top =
            "20px";

        container.style.right =
            "20px";

        container.style.zIndex =
            "9999";

        document.body.appendChild(
            container
        );
    }

    const notification =
        document.createElement("div");

    let bootstrapType = type;

    if (type === "error") {
        bootstrapType = "danger";
    }

    notification.className =
        "alert alert-" +
        bootstrapType;

    notification.textContent =
        message;

    notification.style.marginBottom =
        "10px";

    container.appendChild(
        notification
    );

    setTimeout(
        function () {
            notification.remove();
        },
        4000
    );
}


/* ==========================================================================
   AUTHENTICATION
   ========================================================================== */

function clearAuthentication() {
    localStorage.removeItem(
        "school_management_token"
    );

    localStorage.removeItem(
        "school_management_user"
    );

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "accessToken"
    );

    sessionStorage.removeItem(
        "school_management_token"
    );

    sessionStorage.removeItem(
        "school_management_user"
    );

    sessionStorage.removeItem(
        "token"
    );

    sessionStorage.removeItem(
        "accessToken"
    );
}


/* ==========================================================================
   ESCAPING
   ========================================================================== */

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        window.App &&
        typeof window.App.escapeHtml ===
            "function"
    ) {
        return window.App.escapeHtml(value);
    }

    return String(value)
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
   PUBLIC API
   ========================================================================== */

window.FeesPage = {
    initialize,
    loadFees,
    loadStudents,
    loadAcademicSessions,
    loadTerms,
    loadFeeStructures,
    resetForm,
    printFeeReceipt,
    printFeeStatement
};


/* ==========================================================================
   START
   ========================================================================== */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initialize,
        {
            once: true
        }
    );
} else {
    initialize();
}

})();