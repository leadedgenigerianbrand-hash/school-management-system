"use strict";

(function () {
let feeRecords = [];
let students = [];
let academicSessions = [];
let terms = [];
let feeStructures = [];
let editingFeeId = null;
let feeModal = null;

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


function setupEvents() {
    const form = document.querySelector("#feeForm");

    if (form) {
        form.addEventListener("submit", handleSubmit);
    }

    const searchInput =
        document.querySelector("#searchInput");

    if (searchInput) {
        searchInput.addEventListener("input", renderFees);
    }

    const statusFilter =
        document.querySelector("#statusFilter");

    if (statusFilter) {
        statusFilter.addEventListener("change", function () {
            loadFees();
        });
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
        const data = await request("/terms");

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

    setFormValue("#feeType", feeName);
    setFormValue("#amount", amount);

    if (sessionId) {
        setFormValue("#sessionId", sessionId);
    }

    if (termId) {
        setFormValue("#termId", termId);
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
        setFormValue("#amountPaid", "0");
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
                            studentId: studentId,
                            feeStructureId: feeStructureId,
                            amount: amount
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
        action === "delete-fee" &&
        id
    ) {
        deleteFee(id, button);
    }
}


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
                <h5>No fee records found</h5>
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
                <h5>Unable to load fees</h5>
                <p class="text-secondary mb-0">
                    ${escapeHtml(message)}
                </p>
            </td>
        </tr>
    `;
}


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


window.FeesPage = {
    initialize,
    loadFees,
    loadStudents,
    loadAcademicSessions,
    loadTerms,
    loadFeeStructures,
    resetForm
};


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
