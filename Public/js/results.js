"use strict";

(function () {
let results = [];
let students = [];
let subjects = [];
let sessions = [];
let terms = [];

```
let selectedStudent = null;
let editingResultId = null;

const PASS_MARK = 40;
const CA_MAX = 40;
const EXAM_MAX = 60;

async function request(endpoint, options = {}) {
    if (typeof window.apiRequest === "function") {
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

    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {
        if (!url.startsWith("/")) {
            url = "/" + url;
        }

        if (!url.startsWith("/api/")) {
            url = "/api" + url;
        }
    }

    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers["Content-Type"] &&
        !headers["content-type"]
    ) {
        headers["Content-Type"] = "application/json";
    }

    let response;

    try {
        response = await fetch(url, {
            ...options,
            headers
        });
    } catch (error) {
        console.error("Results API error:", error);
        throw new Error("Unable to connect to the server.");
    }

    if (response.status === 401) {
        localStorage.removeItem("school_management_token");
        localStorage.removeItem("school_management_user");
        sessionStorage.removeItem("school_management_token");
        sessionStorage.removeItem("school_management_user");

        if (!window.location.pathname.endsWith("/login.html")) {
            window.location.href = "/pages/login.html";
        }

        throw new Error("Authentication required.");
    }

    if (response.status === 403) {
        throw new Error(
            "You do not have permission to perform this action."
        );
    }

    const contentType =
        response.headers.get("content-type") || "";

    const data =
        contentType.includes("application/json")
            ? await response.json()
            : await response.text();

    if (!response.ok) {
        throw new Error(
            typeof data === "object"
                ? data.message ||
                  data.error ||
                  "Request failed."
                : data || "Request failed."
        );
    }

    return data;
}

async function initialize() {
    setupEvents();

    try {
        await Promise.all([
            loadStudents(),
            loadSubjects(),
            loadSessions(),
            loadTerms()
        ]);

        await loadResults();
        updateSummary();
    } catch (error) {
        console.error(
            "Results initialization error:",
            error
        );
    }
}

function setupEvents() {
    const addResultButton =
        document.querySelector("#addResultButton");

    if (addResultButton) {
        addResultButton.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                resetForm();
                openResultModal();
            }
        );
    }

    const findStudentButton =
        document.querySelector("#findStudentButton");

    if (findStudentButton) {
        findStudentButton.addEventListener(
            "click",
            findStudent
        );
    }

    const admissionNumber =
        document.querySelector("#admissionNumber");

    if (admissionNumber) {
        admissionNumber.addEventListener(
            "keydown",
            function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    findStudent();
                }
            }
        );
    }

    const addSubjectButton =
        document.querySelector("#addSubjectButton");

    if (addSubjectButton) {
        addSubjectButton.addEventListener(
            "click",
            addSubjectRow
        );
    }

    const saveButton =
        document.querySelector(
            "#saveCompleteResultButton"
        );

    if (saveButton) {
        saveButton.addEventListener(
            "click",
            saveCompleteResult
        );
    }

    const searchInput =
        document.querySelector("#searchInput");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderResults
        );
    }

    const sessionFilter =
        document.querySelector("#sessionFilter");

    if (sessionFilter) {
        sessionFilter.addEventListener(
            "change",
            loadResults
        );
    }

    const termFilter =
        document.querySelector("#termFilter");

    if (termFilter) {
        termFilter.addEventListener(
            "change",
            loadResults
        );
    }

    const refreshButton =
        document.querySelector("#refreshButton");

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            async function () {
                await loadResults();
            }
        );
    }

    document.addEventListener(
        "click",
        handleActionClick
    );

    document.addEventListener(
        "input",
        function (event) {
            if (
                event.target.matches(
                    ".subject-ca, .subject-exam"
                )
            ) {
                calculateSubjectRow(
                    event.target.closest("tr")
                );

                updateOverallSummary();
            }
        }
    );

    document.addEventListener(
        "click",
        function (event) {
            const button =
                event.target.closest(
                    ".remove-subject"
                );

            if (!button) {
                return;
            }

            const row =
                button.closest("tr");

            if (row) {
                row.remove();
            }

            updateSubjectMessage();
            updateOverallSummary();
        }
    );

    document.addEventListener(
        "click",
        function (event) {
            const closeButton =
                event.target.closest(
                    "[data-bs-dismiss='modal'], .btn-close"
                );

            if (closeButton) {
                closeResultModal();
            }
        }
    );
}

async function loadStudents() {
    try {
        const data =
            await request("/students");

        students =
            normalizeArray(data);

        console.log(
            "Students loaded:",
            students.length
        );
    } catch (error) {
        console.error(
            "Unable to load students:",
            error
        );

        students = [];

        notify(
            "Unable to load students.",
            "error"
        );
    }
}

async function loadSubjects() {
    try {
        const data =
            await request("/subjects");

        subjects =
            normalizeArray(data);

        console.log(
            "Subjects loaded:",
            subjects.length
        );
    } catch (error) {
        console.error(
            "Unable to load subjects:",
            error
        );

        subjects = [];

        notify(
            "Unable to load subjects.",
            "error"
        );
    }
}

async function loadSessions() {
    try {
        const data =
            await request(
                "/academic-sessions"
            );

        sessions =
            normalizeArray(data);

        populateSessions();
        populateSessionFilter();
    } catch (error) {
        console.error(
            "Unable to load academic sessions:",
            error
        );

        sessions = [];

        notify(
            "Unable to load academic sessions.",
            "error"
        );
    }
}

async function loadTerms() {
    try {
        const data =
            await request("/terms");

        terms =
            normalizeArray(data);

        populateTerms();
        populateTermFilter();
    } catch (error) {
        console.error(
            "Unable to load terms:",
            error
        );

        terms = [];

        notify(
            "Unable to load terms.",
            "error"
        );
    }
}

async function loadResults() {
    showLoading();

    try {
        const sessionId =
            getValue("#sessionFilter");

        const termId =
            getValue("#termFilter");

        const query =
            new URLSearchParams();

        if (sessionId) {
            query.set(
                "sessionId",
                sessionId
            );
        }

        if (termId) {
            query.set(
                "termId",
                termId
            );
        }

        const endpoint =
            query.toString()
                ? `/results?${query.toString()}`
                : "/results";

        const data =
            await request(endpoint);

        results =
            normalizeArray(data);

        renderResults();
        updateSummary();
    } catch (error) {
        console.error(
            "Unable to load results:",
            error
        );

        results = [];

        showError(
            error.message ||
            "Unable to load results."
        );

        updateSummary();
    }
}

function findStudent() {
    const input =
        document.querySelector(
            "#admissionNumber"
        );

    if (!input) {
        return;
    }

    const admissionNumber =
        input.value
            .trim()
            .toLowerCase();

    if (!admissionNumber) {
        showStudentMessage(
            "Please enter an admission number.",
            "error"
        );

        return;
    }

    const student =
        students.find(
            function (item) {
                const number =
                    getAdmissionNumber(
                        item
                    )
                        .trim()
                        .toLowerCase();

                return (
                    number ===
                    admissionNumber
                );
            }
        );

    if (!student) {
        selectedStudent = null;

        hideStudentSummary();

        showStudentMessage(
            "Student with this admission number was not found.",
            "error"
        );

        return;
    }

    selectedStudent =
        student;

    displayStudentSummary(
        student
    );

    showStudentMessage(
        "Student found successfully.",
        "success"
    );
}

function displayStudentSummary(student) {
    const summary =
        document.querySelector(
            "#studentSummary"
        );

    if (!summary) {
        return;
    }

    const studentName =
        document.querySelector(
            "#studentName"
        );

    const admission =
        document.querySelector(
            "#displayAdmissionNumber"
        );

    const studentClass =
        document.querySelector(
            "#studentClass"
        );

    if (studentName) {
        studentName.textContent =
            getStudentName(student);
    }

    if (admission) {
        admission.textContent =
            getAdmissionNumber(student);
    }

    if (studentClass) {
        studentClass.textContent =
            getStudentClassName(student);
    }

    summary.style.display =
        "block";
}

function hideStudentSummary() {
    const summary =
        document.querySelector(
            "#studentSummary"
        );

    if (summary) {
        summary.style.display =
            "none";
    }
}

function showStudentMessage(
    message,
    type
) {
    const element =
        document.querySelector(
            "#studentSearchMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    if (type === "error") {
        element.className =
            "form-text text-danger";
    } else if (type === "success") {
        element.className =
            "form-text text-success";
    } else {
        element.className =
            "form-text text-muted";
    }
}

function populateSessions() {
    const select =
        document.querySelector(
            "#sessionId"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select academic session
        </option>
    `;

    sessions.forEach(
        function (session) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                session.id ||
                session.session_id ||
                "";

            option.textContent =
                session.session_name ||
                session.name ||
                session.session ||
                session.title ||
                "Academic Session";

            select.appendChild(
                option
            );
        }
    );
}

function populateTerms() {
    const select =
        document.querySelector(
            "#termId"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select term
        </option>
    `;

    const sortedTerms =
        [...terms].sort(
            function (a, b) {
                return (
                    Number(
                        a.term_order ??
                        a.order ??
                        999
                    ) -
                    Number(
                        b.term_order ??
                        b.order ??
                        999
                    )
                );
            }
        );

    sortedTerms.forEach(
        function (term) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                term.id ||
                term.term_id ||
                "";

            option.textContent =
                term.term_name ||
                term.name ||
                term.term ||
                term.title ||
                "Term";

            select.appendChild(
                option
            );
        }
    );
}

function populateSessionFilter() {
    const select =
        document.querySelector(
            "#sessionFilter"
        );

    if (!select) {
        return;
    }

    const currentValue =
        select.value;

    select.innerHTML = `
        <option value="">
            All sessions
        </option>
    `;

    sessions.forEach(
        function (session) {
            const id =
                session.id ||
                session.session_id ||
                "";

            if (!id) {
                return;
            }

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                id;

            option.textContent =
                session.session_name ||
                session.name ||
                session.session ||
                session.title ||
                "Academic Session";

            select.appendChild(
                option
            );
        }
    );

    if (currentValue) {
        select.value =
            currentValue;
    }
}

function populateTermFilter() {
    const select =
        document.querySelector(
            "#termFilter"
        );

    if (!select) {
        return;
    }

    const currentValue =
        select.value;

    select.innerHTML = `
        <option value="">
            All terms
        </option>
    `;

    const sortedTerms =
        [...terms].sort(
            function (a, b) {
                return (
                    Number(
                        a.term_order ??
                        a.order ??
                        999
                    ) -
                    Number(
                        b.term_order ??
                        b.order ??
                        999
                    )
                );
            }
        );

    sortedTerms.forEach(
        function (term) {
            const id =
                term.id ||
                term.term_id ||
                "";

            if (!id) {
                return;
            }

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                id;

            option.textContent =
                term.term_name ||
                term.name ||
                term.term ||
                term.title ||
                "Term";

            select.appendChild(
                option
            );
        }
    );

    if (currentValue) {
        select.value =
            currentValue;
    }
}

function addSubjectRow(existingResult = null) {
    const body =
        document.querySelector(
            "#subjectResultsBody"
        );

    if (!body) {
        return;
    }

    const row =
        document.createElement(
            "tr"
        );

    row.innerHTML = `
        <td>
            <select
                class="form-select subject-select"
                data-field="subject"
                required
            >
                <option value="">
                    Select subject
                </option>

                ${subjects
                    .map(
                        function (subject) {
                            const id =
                                subject.id ||
                                subject.subject_id ||
                                "";

                            const name =
                                subject.subject_name ||
                                subject.name ||
                                subject.title ||
                                "Subject";

                            return `
                                <option value="${escapeAttribute(id)}">
                                    ${escapeHtml(name)}
                                </option>
                            `;
                        }
                    )
                    .join("")}
            </select>
        </td>

        <td>
            <input
                type="number"
                class="form-control score-input subject-ca"
                data-field="ca"
                min="0"
                max="40"
                step="0.01"
                inputmode="decimal"
                placeholder="0"
                required
            >
        </td>

        <td>
            <input
                type="number"
                class="form-control score-input subject-exam"
                data-field="exam"
                min="0"
                max="60"
                step="0.01"
                inputmode="decimal"
                placeholder="0"
                required
            >
        </td>

        <td>
            <input
                type="text"
                class="form-control calculated-field subject-total"
                data-field="total"
                value="0"
                readonly
            >
        </td>

        <td>
            <input
                type="text"
                class="form-control calculated-field subject-grade"
                data-field="grade"
                value="-"
                readonly
            >
        </td>

        <td>
            <input
                type="text"
                class="form-control calculated-field subject-remark"
                data-field="remark"
                value="-"
                readonly
            >
        </td>

        <td>
            <button
                type="button"
                class="btn btn-outline-danger btn-sm remove-subject"
                title="Remove subject"
            >
                Remove
            </button>
        </td>
    `;

    body.appendChild(
        row
    );

    if (existingResult) {
        setFormValueOnRow(
            row,
            ".subject-select",
            existingResult.subject_id ||
            existingResult.subjectId ||
            ""
        );

        setFormValueOnRow(
            row,
            ".subject-ca",
            existingResult.ca_score ??
            existingResult.ca ??
            ""
        );

        setFormValueOnRow(
            row,
            ".subject-exam",
            existingResult.exam_score ??
            existingResult.exam ??
            ""
        );

        calculateSubjectRow(
            row
        );
    }

    updateSubjectMessage();

    const caInput =
        row.querySelector(
            ".subject-ca"
        );

    if (caInput && !existingResult) {
        setTimeout(
            function () {
                caInput.focus();
            },
            50
        );
    }
}

function calculateSubjectRow(row) {
    if (!row) {
        return;
    }

    const caInput =
        row.querySelector(
            ".subject-ca"
        );

    const examInput =
        row.querySelector(
            ".subject-exam"
        );

    const totalInput =
        row.querySelector(
            ".subject-total"
        );

    const gradeInput =
        row.querySelector(
            ".subject-grade"
        );

    const remarkInput =
        row.querySelector(
            ".subject-remark"
        );

    let ca =
        Number(
            caInput?.value || 0
        );

    let exam =
        Number(
            examInput?.value || 0
        );

    if (ca > CA_MAX) {
        ca = CA_MAX;

        if (caInput) {
            caInput.value =
                CA_MAX;
        }
    }

    if (ca < 0) {
        ca = 0;

        if (caInput) {
            caInput.value =
                0;
        }
    }

    if (exam > EXAM_MAX) {
        exam = EXAM_MAX;

        if (examInput) {
            examInput.value =
                EXAM_MAX;
        }
    }

    if (exam < 0) {
        exam = 0;

        if (examInput) {
            examInput.value =
                0;
        }
    }

    const total =
        ca + exam;

    if (totalInput) {
        totalInput.value =
            total.toFixed(2);
    }

    if (gradeInput) {
        gradeInput.value =
            calculateGrade(total);
    }

    if (remarkInput) {
        remarkInput.value =
            getRemark(total);
    }
}

function updateOverallSummary() {
    const rows =
        getSubjectRows();

    let overallTotal =
        0;

    let passed =
        0;

    rows.forEach(
        function (row) {
            calculateSubjectRow(
                row
            );

            const total =
                Number(
                    row.querySelector(
                        ".subject-total"
                    )?.value || 0
                );

            overallTotal +=
                total;

            if (total >= PASS_MARK) {
                passed++;
            }
        }
    );

    const count =
        rows.length;

    const average =
        count > 0
            ? overallTotal / count
            : 0;

    const countInput =
        document.querySelector(
            "#subjectCount"
        );

    const totalInput =
        document.querySelector(
            "#overallTotal"
        );

    const averageInput =
        document.querySelector(
            "#overallAverage"
        );

    const statusInput =
        document.querySelector(
            "#overallStatus"
        );

    if (countInput) {
        countInput.value =
            count;
    }

    if (totalInput) {
        totalInput.value =
            overallTotal.toFixed(2);
    }

    if (averageInput) {
        averageInput.value =
            average.toFixed(2);
    }

    if (statusInput) {
        if (count === 0) {
            statusInput.value =
                "-";
        } else {
            const failed =
                count - passed;

            statusInput.value =
                failed === 0
                    ? "PASSED"
                    : passed > 0
                        ? "PARTIAL PASS"
                        : "FAILED";
        }
    }
}

async function saveCompleteResult() {
    clearValidation();

    if (!selectedStudent) {
        showValidation(
            "Please enter a valid Admission Number and find the student."
        );

        return;
    }

    const studentId =
        getStudentId(
            selectedStudent
        );

    if (!studentId) {
        showValidation(
            "The selected student does not have a valid student ID."
        );

        return;
    }

    const academicSessionId =
        getValue(
            "#sessionId"
        );

    if (!academicSessionId) {
        showValidation(
            "Please select the Academic Session."
        );

        return;
    }

    const termId =
        getValue(
            "#termId"
        );

    if (!termId) {
        showValidation(
            "Please select the Term."
        );

        return;
    }

    const classId =
        getStudentClassId(
            selectedStudent
        );

    if (!classId) {
        showValidation(
            "This student does not have a class assigned. Please assign the student to a class before entering the result."
        );

        return;
    }

    const rows =
        getSubjectRows();

    if (!rows.length) {
        showValidation(
            "Please add at least one subject."
        );

        return;
    }

    const subjectResults = [];

    for (
        let index = 0;
        index < rows.length;
        index++
    ) {
        const row =
            rows[index];

        const subjectId =
            row.querySelector(
                ".subject-select"
            )?.value;

        const ca =
            Number(
                row.querySelector(
                    ".subject-ca"
                )?.value
            );

        const exam =
            Number(
                row.querySelector(
                    ".subject-exam"
                )?.value
            );

        if (!subjectId) {
            showValidation(
                `Please select a subject for row ${index + 1}.`
            );

            return;
        }

        if (
            !Number.isFinite(ca) ||
            ca < 0 ||
            ca > CA_MAX
        ) {
            showValidation(
                `CA score for row ${index + 1} must be between 0 and ${CA_MAX}.`
            );

            return;
        }

        if (
            !Number.isFinite(exam) ||
            exam < 0 ||
            exam > EXAM_MAX
        ) {
            showValidation(
                `Exam score for row ${index + 1} must be between 0 and ${EXAM_MAX}.`
            );

            return;
        }

        const total =
            ca + exam;

        subjectResults.push({
            studentId,
            academicSessionId,
            termId,
            classId,
            subjectId,
            caScore: ca,
            examScore: exam,
            totalScore: total
        });
    }

    const subjectIds =
        subjectResults.map(
            function (item) {
                return item.subjectId;
            }
        );

    const duplicate =
        subjectIds.find(
            function (id, index) {
                return (
                    subjectIds.indexOf(id) !==
                    index
                );
            }
        );

    if (duplicate) {
        showValidation(
            "The same subject has been added more than once. Please remove the duplicate."
        );

        return;
    }

    const teacherRemark =
        getValue(
            "#teacherComment"
        ).trim();

    const saveButton =
        document.querySelector(
            "#saveCompleteResultButton"
        );

    if (saveButton) {
        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving Results...";
    }

    try {
        if (editingResultId) {
            if (
                subjectResults.length !==
                1
            ) {
                throw new Error(
                    "Edit mode supports one result record at a time."
                );
            }

            const item =
                subjectResults[0];

            await request(
                `/results/${encodeURIComponent(editingResultId)}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        academicSessionId:
                            item.academicSessionId,
                        termId:
                            item.termId,
                        classId:
                            item.classId,
                        subjectId:
                            item.subjectId,
                        caScore:
                            item.caScore,
                        examScore:
                            item.examScore,
                        totalScore:
                            item.totalScore,
                        teacherRemark
                    })
                }
            );

            notify(
                "Result updated successfully.",
                "success"
            );
        } else {
            for (
                const item
                of subjectResults
            ) {
                await request(
                    "/results",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            studentId:
                                item.studentId,
                            academicSessionId:
                                item.academicSessionId,
                            termId:
                                item.termId,
                            classId:
                                item.classId,
                            subjectId:
                                item.subjectId,
                            caScore:
                                item.caScore,
                            examScore:
                                item.examScore,
                            totalScore:
                                item.totalScore,
                            teacherRemark
                        })
                    }
                );
            }

            notify(
                `Complete result saved for ${getStudentName(selectedStudent)}.`,
                "success"
            );
        }

        closeResultModal();
        resetForm();
        await loadResults();
    } catch (error) {
        console.error(
            "Complete result save failed:",
            error
        );

        showValidation(
            error.message ||
            "Unable to save the complete result."
        );
    } finally {
        if (saveButton) {
            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Complete Result";
        }
    }
}

function renderResults() {
    const container =
        document.querySelector(
            "#resultsTableBody"
        );

    if (!container) {
        return;
    }

    const search =
        getValue(
            "#searchInput"
        )
            .trim()
            .toLowerCase();

    let records =
        results;

    if (search) {
        records =
            results.filter(
                function (result) {
                    const student =
                        getStudentName(
                            result
                        )
                            .toLowerCase();

                    const admission =
                        getAdmissionNumber(
                            result
                        )
                            .toLowerCase();

                    const subject =
                        getSubjectName(
                            result
                        )
                            .toLowerCase();

                    return (
                        student.includes(search) ||
                        admission.includes(search) ||
                        subject.includes(search)
                    );
                }
            );
    }

    if (!records.length) {
        showEmpty(
            "No academic result records are available."
        );

        return;
    }

    container.innerHTML =
        records
            .map(
                renderResultRow
            )
            .join("");
}

function renderResultRow(result) {
    const id =
        result.id ||
        result.result_id ||
        "";

    const studentName =
        getStudentName(
            result
        );

    const admissionNumber =
        getAdmissionNumber(
            result
        );

    const subjectName =
        getSubjectName(
            result
        );

    const className =
        result.class_name ||
        result.className ||
        "-";

    const sessionName =
        result.session_name ||
        result.academic_session ||
        result.session ||
        "-";

    const termName =
        result.term_name ||
        result.term ||
        "-";

    const ca =
        Number(
            result.ca_score ??
            result.ca ??
            0
        );

    const exam =
        Number(
            result.exam_score ??
            result.exam ??
            0
        );

    const total =
        Number(
            result.total_score ??
            ca + exam
        );

    const grade =
        result.grade ||
        calculateGrade(total);

    const published =
        result.is_published === true ||
        result.is_published === 1 ||
        result.isPublished === true;

    const status =
        total >= PASS_MARK
            ? "Passed"
            : "Failed";

    const approveButton =
        published
            ? `
                <button
                    type="button"
                    class="btn btn-sm btn-outline-success"
                    disabled
                >
                    Published
                </button>
            `
            : `
                <button
                    type="button"
                    class="btn btn-sm btn-outline-warning"
                    data-action="publish-result"
                    data-id="${escapeAttribute(id)}"
                >
                    Publish
                </button>
            `;

    return `
        <tr>
            <td>
                <strong>
                    ${escapeHtml(
                        admissionNumber
                    )}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    studentName
                )}
            </td>

            <td>
                ${escapeHtml(
                    className
                )}
            </td>

            <td>
                ${escapeHtml(
                    subjectName
                )}
            </td>

            <td>
                ${escapeHtml(
                    sessionName
                )}
            </td>

            <td>
                ${escapeHtml(
                    termName
                )}
            </td>

            <td>
                ${total.toFixed(2)}
            </td>

            <td>
                <strong>
                    ${escapeHtml(
                        grade
                    )}
                </strong>
            </td>

            <td>
                <span
                    class="badge ${
                        total >= PASS_MARK
                            ? "bg-success"
                            : "bg-danger"
                    }"
                >
                    ${status}
                </span>
            </td>

            <td>
                <div class="d-flex gap-1 flex-wrap">
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        data-action="edit-result"
                        data-id="${escapeAttribute(id)}"
                    >
                        Edit
                    </button>

                    ${approveButton}

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        data-action="delete-result"
                        data-id="${escapeAttribute(id)}"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function editResult(id) {
    const result =
        results.find(
            function (item) {
                return String(
                    item.id ||
                    item.result_id
                ) === String(id);
            }
        );

    if (!result) {
        notify(
            "Result record not found.",
            "error"
        );

        return;
    }

    editingResultId =
        id;

    const studentId =
        result.student_id ||
        result.studentId;

    selectedStudent =
        students.find(
            function (student) {
                return String(
                    getStudentId(
                        student
                    )
                ) === String(
                    studentId
                );
            }
        ) || null;

    if (selectedStudent) {
        setFormValue(
            "#admissionNumber",
            getAdmissionNumber(
                selectedStudent
            )
        );

        displayStudentSummary(
            selectedStudent
        );
    } else {
        selectedStudent = {
            id: studentId,
            student_id: studentId,
            admission_number:
                result.admission_number ||
                result.admissionNumber ||
                "",
            student_name:
                result.student_name ||
                result.studentName ||
                ""
        };

        setFormValue(
            "#admissionNumber",
            getAdmissionNumber(
                selectedStudent
            )
        );

        displayStudentSummary(
            selectedStudent
        );
    }

    setFormValue(
        "#sessionId",
        result.academic_session_id ||
        result.session_id ||
        result.sessionId ||
        ""
    );

    setFormValue(
        "#termId",
        result.term_id ||
        result.termId ||
        ""
    );

    const body =
        document.querySelector(
            "#subjectResultsBody"
        );

    if (body) {
        body.innerHTML =
            "";

        addSubjectRow(
            result
        );
    }

    setFormValue(
        "#teacherComment",
        result.teacher_remark ||
        result.teacherRemark ||
        result.teacher_comment ||
        result.teacherComment ||
        ""
    );

    const title =
        document.querySelector(
            "#resultModalTitle"
        );

    if (title) {
        title.textContent =
            "Edit Student Result";
    }

    updateSubjectMessage();
    updateOverallSummary();
    clearValidation();
    openResultModal();
}

async function deleteResult(id) {
    const confirmed =
        window.confirm(
            "Are you sure you want to delete this result?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await request(
            `/results/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        notify(
            "Result deleted successfully.",
            "success"
        );

        await loadResults();
    } catch (error) {
        console.error(
            "Result deletion failed:",
            error
        );

        notify(
            error.message ||
            "Unable to delete result.",
            "error"
        );
    }
}

async function publishResult(id) {
    const confirmed =
        window.confirm(
            "Are you sure you want to publish this result?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await request(
            `/results/${encodeURIComponent(id)}/approve`,
            {
                method: "PATCH"
            }
        );

        notify(
            "Result published successfully.",
            "success"
        );

        await loadResults();
    } catch (error) {
        console.error(
            "Result publishing failed:",
            error
        );

        notify(
            error.message ||
            "Unable to publish result.",
            "error"
        );
    }
}

async function handleActionClick(event) {
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

    if (!id) {
        return;
    }

    if (
        action ===
        "edit-result"
    ) {
        editResult(id);
        return;
    }

    if (
        action ===
        "delete-result"
    ) {
        await deleteResult(id);
        return;
    }

    if (
        action ===
        "publish-result"
    ) {
        await publishResult(id);
    }
}

function openResultModal() {
    const modalElement =
        document.querySelector(
            "#resultModal"
        );

    if (!modalElement) {
        console.error(
            "Result modal was not found."
        );

        return;
    }

    if (
        window.bootstrap &&
        typeof window.bootstrap.Modal ===
            "function"
    ) {
        const modal =
            window.bootstrap.Modal
                .getOrCreateInstance(
                    modalElement
                );

        modal.show();

        return;
    }

    modalElement.classList.add(
        "show"
    );

    modalElement.style.display =
        "block";

    modalElement.removeAttribute(
        "aria-hidden"
    );

    modalElement.setAttribute(
        "aria-modal",
        "true"
    );

    document.body.classList.add(
        "modal-open"
    );
}

function closeResultModal() {
    const modalElement =
        document.querySelector(
            "#resultModal"
        );

    if (!modalElement) {
        return;
    }

    if (
        window.bootstrap &&
        typeof window.bootstrap.Modal ===
            "function"
    ) {
        const modal =
            window.bootstrap.Modal
                .getInstance(
                    modalElement
                );

        if (modal) {
            modal.hide();
            return;
        }
    }

    modalElement.classList.remove(
        "show"
    );

    modalElement.style.display =
        "none";

    modalElement.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );
}

function resetForm() {
    editingResultId =
        null;

    selectedStudent =
        null;

    const form =
        document.querySelector(
            "#resultForm"
        );

    if (form) {
        form.reset();
    }

    hideStudentSummary();

    showStudentMessage(
        "Enter the student's admission number.",
        "normal"
    );

    const title =
        document.querySelector(
            "#resultModalTitle"
        );

    if (title) {
        title.textContent =
            "Enter Student Result";
    }

    const body =
        document.querySelector(
            "#subjectResultsBody"
        );

    if (body) {
        body.innerHTML =
            "";
    }

    updateSubjectMessage();
    updateOverallSummary();
    clearValidation();
}

function updateSubjectMessage() {
    const body =
        document.querySelector(
            "#subjectResultsBody"
        );

    const message =
        document.querySelector(
            "#noSubjectMessage"
        );

    if (!message) {
        return;
    }

    const hasRows =
        body &&
        body.children.length > 0;

    message.style.display =
        hasRows
            ? "none"
            : "block";
}

function getSubjectRows() {
    const body =
        document.querySelector(
            "#subjectResultsBody"
        );

    if (!body) {
        return [];
    }

    return Array.from(
        body.querySelectorAll(
            "tr"
        )
    );
}

function calculateGrade(score) {
    const value =
        Number(score) || 0;

    if (value >= 75) {
        return "A";
    }

    if (value >= 65) {
        return "B";
    }

    if (value >= 55) {
        return "C";
    }

    if (value >= 45) {
        return "D";
    }

    if (value >= 40) {
        return "E";
    }

    return "F";
}

function getRemark(score) {
    const value =
        Number(score) || 0;

    if (value >= 75) {
        return "Excellent";
    }

    if (value >= 65) {
        return "Very Good";
    }

    if (value >= 55) {
        return "Good";
    }

    if (value >= 45) {
        return "Fair";
    }

    if (value >= 40) {
        return "Pass";
    }

    return "Fail";
}

function updateSummary() {
    const count =
        results.length;

    let total =
        0;

    let passed =
        0;

    let failed =
        0;

    results.forEach(
        function (result) {
            const ca =
                Number(
                    result.ca_score ??
                    result.ca ??
                    0
                );

            const exam =
                Number(
                    result.exam_score ??
                    result.exam ??
                    0
                );

            const score =
                Number(
                    result.total_score ??
                    ca + exam
                );

            total +=
                score;

            if (score >= PASS_MARK) {
                passed++;
            } else {
                failed++;
            }
        }
    );

    const average =
        count > 0
            ? total / count
            : 0;

    setSummary(
        "#totalResults",
        count
    );

    setSummary(
        "#passedResults",
        passed
    );

    setSummary(
        "#failedResults",
        failed
    );

    setSummary(
        "#averageScore",
        average.toFixed(2)
    );
}

function setSummary(
    selector,
    value
) {
    const element =
        document.querySelector(
            selector
        );

    if (element) {
        element.textContent =
            value;
    }
}

function getStudentId(student) {
    return (
        student?.id ||
        student?.student_id ||
        student?.studentId ||
        ""
    );
}

function getAdmissionNumber(student) {
    return (
        student?.admission_number ||
        student?.admissionNumber ||
        student?.admission_no ||
        student?.admissionNo ||
        student?.student_number ||
        student?.studentNumber ||
        ""
    );
}

function getStudentName(student) {
    if (!student) {
        return "Unknown Student";
    }

    return (
        student.student_name ||
        student.studentName ||
        [
            student.first_name ||
            student.firstName ||
            "",

            student.middle_name ||
            student.middleName ||
            "",

            student.last_name ||
            student.lastName ||
            ""
        ]
            .filter(Boolean)
            .join(" ")
    ) || "Unknown Student";
}

function getStudentClassId(student) {
    return (
        student?.class_id ||
        student?.classId ||
        student?.current_class_id ||
        student?.currentClassId ||
        student?.class?.id ||
        student?.class?.class_id ||
        student?.enrollment?.class_id ||
        student?.enrollment?.classId ||
        ""
    );
}

function getStudentClassName(student) {
    return (
        student?.class_name ||
        student?.className ||
        student?.current_class_name ||
        student?.currentClassName ||
        student?.class?.class_name ||
        student?.class?.name ||
        student?.enrollment?.class_name ||
        student?.enrollment?.className ||
        "-"
    );
}

function getSubjectName(result) {
    return (
        result?.subject_name ||
        result?.subjectName ||
        result?.subject ||
        result?.title ||
        "Unknown Subject"
    );
}

function showValidation(message) {
    const element =
        document.querySelector(
            "#resultValidationMessage"
        );

    if (!element) {
        notify(
            message,
            "error"
        );

        return;
    }

    element.textContent =
        message;

    element.style.display =
        "block";

    element.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function clearValidation() {
    const element =
        document.querySelector(
            "#resultValidationMessage"
        );

    if (element) {
        element.textContent =
            "";

        element.style.display =
            "none";
    }
}

function normalizeArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (
        Array.isArray(
            data?.data
        )
    ) {
        return data.data;
    }

    if (
        Array.isArray(
            data?.students
        )
    ) {
        return data.students;
    }

    if (
        Array.isArray(
            data?.subjects
        )
    ) {
        return data.subjects;
    }

    if (
        Array.isArray(
            data?.sessions
        )
    ) {
        return data.sessions;
    }

    if (
        Array.isArray(
            data?.terms
        )
    ) {
        return data.terms;
    }

    if (
        Array.isArray(
            data?.results
        )
    ) {
        return data.results;
    }

    if (
        Array.isArray(
            data?.records
        )
    ) {
        return data.records;
    }

    return [];
}

function getValue(selector) {
    const element =
        document.querySelector(
            selector
        );

    return element
        ? element.value || ""
        : "";
}

function setFormValue(
    selector,
    value
) {
    const element =
        document.querySelector(
            selector
        );

    if (element) {
        element.value =
            value ?? "";
    }
}

function setFormValueOnRow(
    row,
    selector,
    value
) {
    const element =
        row.querySelector(
            selector
        );

    if (element) {
        element.value =
            value ?? "";
    }
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
            document.createElement(
                "div"
            );

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
        document.createElement(
            "div"
        );

    notification.className =
        `alert alert-${type}`;

    notification.textContent =
        message;

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

function showLoading() {
    const container =
        document.querySelector(
            "#resultsTableBody"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <tr>
            <td colspan="10">
                <div class="text-center p-4">
                    Loading results...
                </div>
            </td>
        </tr>
    `;
}

function showEmpty(message) {
    const container =
        document.querySelector(
            "#resultsTableBody"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <tr>
            <td colspan="10">
                <div class="empty-result-message">
                    <h5>No results found</h5>
                    <p class="mb-0">
                        ${escapeHtml(message)}
                    </p>
                </div>
            </td>
        </tr>
    `;
}

function showError(message) {
    const container =
        document.querySelector(
            "#resultsTableBody"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <tr>
            <td colspan="10">
                <div class="alert alert-danger m-3">
                    ${escapeHtml(message)}
                </div>
            </td>
        </tr>
    `;
}

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function escapeAttribute(value) {
    return escapeHtml(
        value
    );
}

window.ResultsPage = {
    initialize,
    loadResults,
    loadStudents,
    loadSubjects,
    loadSessions,
    loadTerms,
    findStudent,
    resetForm,
    calculateGrade,
    getRemark
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
```

})();
