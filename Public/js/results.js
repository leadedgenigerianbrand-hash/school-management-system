"use strict";

(function () {
    let results = [];
    let students = [];
    let subjects = [];
    let editingResultId = null;

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
            throw new Error(
                "Unable to connect to the server."
            );
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

        const data = contentType.includes("application/json")
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

        await Promise.all([
            loadStudents(),
            loadSubjects()
        ]);

        await loadResults();
        updateSummary();
    }

    function setupEvents() {
        const form =
            document.querySelector("#resultForm") ||
            document.querySelector("form[data-result-form]");

        if (form) {
            form.addEventListener(
                "submit",
                handleSubmit
            );
        }

        const search =
            document.querySelector("#resultSearch") ||
            document.querySelector("[name='result_search']");

        if (search) {
            const handler =
                window.App &&
                typeof window.App.debounce === "function"
                    ? window.App.debounce(
                        renderResults,
                        300
                    )
                    : renderResults;

            search.addEventListener(
                "input",
                handler
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
                        "[data-score], .score-input, #ca, #exam"
                    )
                ) {
                    calculatePreview();
                }
            }
        );
    }

    async function loadStudents() {
        try {
            const data = await request("/students");

            students =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.students)
                            ? data.students
                            : [];

            populateStudentSelect();
        } catch (error) {
            console.error(
                "Unable to load students:",
                error
            );

            students = [];
        }
    }

    async function loadSubjects() {
        try {
            const data = await request("/subjects");

            subjects =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.subjects)
                            ? data.subjects
                            : [];

            populateSubjectSelect();
        } catch (error) {
            console.error(
                "Unable to load subjects:",
                error
            );

            subjects = [];
        }
    }

    async function loadResults() {
        showLoading();

        try {
            const data = await request("/results");

            results =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.results)
                            ? data.results
                            : Array.isArray(data?.records)
                                ? data.records
                                : [];

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
        }
    }

    function populateStudentSelect() {
        const select =
            document.querySelector("#studentId") ||
            document.querySelector("#student-id") ||
            document.querySelector("[name='student_id']");

        if (!select) {
            return;
        }

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">
                Select student
            </option>
        `;

        students.forEach((student) => {
            const option =
                document.createElement("option");

            option.value =
                student.id ??
                student.student_id ??
                "";

            option.textContent =
                getStudentName(student);

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    }

    function populateSubjectSelect() {
        const select =
            document.querySelector("#subjectId") ||
            document.querySelector("#subject-id") ||
            document.querySelector("[name='subject_id']");

        if (!select) {
            return;
        }

        const currentValue = select.value;

        select.innerHTML = `
            <option value="">
                Select subject
            </option>
        `;

        subjects.forEach((subject) => {
            const option =
                document.createElement("option");

            option.value =
                subject.id ??
                subject.subject_id ??
                "";

            option.textContent =
                subject.name ||
                subject.subject_name ||
                subject.title ||
                "Subject";

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    }

    function renderResults() {
        const container =
            document.querySelector("#resultsTableBody") ||
            document.querySelector("#resultTableBody") ||
            document.querySelector(
                "tbody[data-results-body]"
            );

        if (!container) {
            return;
        }

        const search =
            getValue(
                "#resultSearch",
                "[name='result_search']"
            )
                .trim()
                .toLowerCase();

        const records = search
            ? results.filter((result) => {
                const student =
                    getStudentName(result)
                        .toLowerCase();

                const subject =
                    getSubjectName(result)
                        .toLowerCase();

                const grade =
                    String(
                        result.grade || ""
                    ).toLowerCase();

                return (
                    student.includes(search) ||
                    subject.includes(search) ||
                    grade.includes(search)
                );
            })
            : results;

        if (!records.length) {
            showEmpty("No academic result records are available.");
            return;
        }

        container.innerHTML =
            records.map(renderResultRow).join("");
    }

    function renderResultRow(result) {
        const id =
            result.id ??
            result.result_id ??
            "";

        const studentName =
            getStudentName(result);

        const subjectName =
            getSubjectName(result);

        const ca =
            Number(
                result.ca ??
                result.continuous_assessment ??
                result.continuousAssessment ??
                0
            );

        const exam =
            Number(
                result.exam ??
                result.exam_score ??
                result.examination ??
                0
            );

        let total =
            Number(result.total);

        if (!Number.isFinite(total)) {
            total = ca + exam;
        }

        const grade =
            result.grade ||
            calculateGrade(total);

        const remark =
            result.remark ||
            getRemark(total);

        return `
            <tr>
                <td>
                    <div class="student-name">
                        <div class="student-avatar">
                            ${escapeHtml(
                                getInitials(studentName)
                            )}
                        </div>

                        <div class="student-name-text">
                            <strong>
                                ${escapeHtml(studentName)}
                            </strong>
                        </div>
                    </div>
                </td>

                <td>
                    ${escapeHtml(subjectName)}
                </td>

                <td>
                    ${formatNumber(ca)}
                </td>

                <td>
                    ${formatNumber(exam)}
                </td>

                <td>
                    <strong>
                        ${formatNumber(total)}
                    </strong>
                </td>

                <td>
                    <strong>
                        ${escapeHtml(grade)}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(remark)}
                </td>

                <td>
                    ${escapeHtml(
                        result.session_name ||
                        result.session ||
                        result.academic_session ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        result.term_name ||
                        result.term ||
                        "-"
                    )}
                </td>

                <td>
                    <div class="student-actions">
                        <button
                            type="button"
                            class="student-action-btn"
                            data-action="edit-result"
                            data-id="${escapeAttribute(id)}"
                            title="Edit"
                        >
                            ✎
                        </button>

                        <button
                            type="button"
                            class="student-action-btn delete"
                            data-action="delete-result"
                            data-id="${escapeAttribute(id)}"
                            title="Delete"
                        >
                            ×
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = formToObject(form);

        if (!data.student_id) {
            notify(
                "Please select a student.",
                "error"
            );
            return;
        }

        if (!data.subject_id) {
            notify(
                "Please select a subject.",
                "error"
            );
            return;
        }

        const ca = Number(
            data.ca ??
            data.continuous_assessment ??
            0
        );

        const exam = Number(
            data.exam ??
            data.exam_score ??
            data.examination ??
            0
        );

        if (!Number.isFinite(ca) || !Number.isFinite(exam)) {
            notify(
                "Please enter valid scores.",
                "error"
            );
            return;
        }

        if (ca < 0 || exam < 0) {
            notify(
                "Scores cannot be negative.",
                "error"
            );
            return;
        }

        if (ca > 40) {
            notify(
                "Continuous assessment cannot exceed 40.",
                "error"
            );
            return;
        }

        if (exam > 60) {
            notify(
                "Examination score cannot exceed 60.",
                "error"
            );
            return;
        }

        const total = ca + exam;

        data.ca = ca;
        data.exam = exam;
        data.total = total;
        data.grade = calculateGrade(total);
        data.remark = getRemark(total);

        try {
            if (editingResultId) {
                await request(
                    `/results/${encodeURIComponent(
                        editingResultId
                    )}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(data)
                    }
                );

                notify(
                    "Result updated successfully.",
                    "success"
                );
            } else {
                await request(
                    "/results",
                    {
                        method: "POST",
                        body: JSON.stringify(data)
                    }
                );

                notify(
                    "Result saved successfully.",
                    "success"
                );
            }

            resetForm();
            await loadResults();
        } catch (error) {
            console.error(
                "Result save failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save result.",
                "error"
            );
        }
    }

    function editResult(id) {
        const result = results.find(
            (item) =>
                String(
                    item.id ??
                    item.result_id
                ) === String(id)
        );

        if (!result) {
            return;
        }

        editingResultId = id;

        setFormValue(
            "#studentId",
            result.student_id ??
            result.studentId
        );

        setFormValue(
            "#subjectId",
            result.subject_id ??
            result.subjectId
        );

        setFormValue(
            "#ca",
            result.ca ??
            result.continuous_assessment ??
            result.continuousAssessment
        );

        setFormValue(
            "#exam",
            result.exam ??
            result.exam_score ??
            result.examination
        );

        setFormValue(
            "#session",
            result.session_id ??
            result.session
        );

        setFormValue(
            "#term",
            result.term_id ??
            result.term
        );

        updateFormMode("Update Result");
        calculatePreview();
    }

    async function deleteResult(id) {
        if (
            !window.confirm(
                "Are you sure you want to delete this result?"
            )
        ) {
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

    async function handleActionClick(event) {
        const button =
            event.target.closest("[data-action]");

        if (!button) {
            return;
        }

        const action =
            button.getAttribute("data-action");

        const id =
            button.getAttribute("data-id");

        if (!id) {
            return;
        }

        if (action === "edit-result") {
            editResult(id);
            return;
        }

        if (action === "delete-result") {
            await deleteResult(id);
        }
    }

    function calculatePreview() {
        const ca =
            Number(
                getValue(
                    "#ca",
                    "[name='ca']",
                    "[name='continuous_assessment']"
                ) || 0
            );

        const exam =
            Number(
                getValue(
                    "#exam",
                    "[name='exam']",
                    "[name='exam_score']"
                ) || 0
            );

        const total = ca + exam;
        const grade = calculateGrade(total);
        const remark = getRemark(total);

        const totalElement =
            document.querySelector("#total") ||
            document.querySelector("#resultTotal");

        if (totalElement) {
            totalElement.textContent =
                formatNumber(total);
        }

        const gradeElement =
            document.querySelector("#grade") ||
            document.querySelector("#resultGrade");

        if (gradeElement) {
            gradeElement.textContent = grade;
        }

        const remarkElement =
            document.querySelector("#remark") ||
            document.querySelector("#resultRemark");

        if (remarkElement) {
            remarkElement.textContent = remark;
        }
    }

    function calculateGrade(score) {
        const value = Number(score) || 0;

        if (value >= 75) return "A";
        if (value >= 65) return "B";
        if (value >= 55) return "C";
        if (value >= 45) return "D";
        if (value >= 40) return "E";

        return "F";
    }

    function getRemark(score) {
        const value = Number(score) || 0;

        if (value >= 75) return "Excellent";
        if (value >= 65) return "Very Good";
        if (value >= 55) return "Good";
        if (value >= 45) return "Fair";
        if (value >= 40) return "Pass";

        return "Fail";
    }

    function updateSummary() {
        const count = results.length;

        let total = 0;

        results.forEach((result) => {
            let value = Number(result.total);

            if (!Number.isFinite(value)) {
                value =
                    Number(
                        result.ca ??
                        result.continuous_assessment ??
                        0
                    ) +
                    Number(
                        result.exam ??
                        result.exam_score ??
                        0
                    );
            }

            total += value;
        });

        const average =
            count > 0
                ? total / count
                : 0;

        setSummary(
            [
                "#totalResults",
                "#total-results",
                "[data-total-results]"
            ],
            count
        );

        setSummary(
            [
                "#averageScore",
                "#average-score",
                "[data-average-score]"
            ],
            formatNumber(average)
        );
    }

    function setSummary(selectors, value) {
        for (const selector of selectors) {
            const element =
                document.querySelector(selector);

            if (element) {
                element.textContent = value;
                return;
            }
        }
    }

    function resetForm() {
        editingResultId = null;

        const form =
            document.querySelector("#resultForm");

        if (form) {
            form.reset();
        }

        updateFormMode("Add Result");
        calculatePreview();
    }

    function updateFormMode(text) {
        const form =
            document.querySelector("#resultForm");

        if (!form) {
            return;
        }

        const button =
            form.querySelector(
                "button[type='submit']"
            );

        if (button) {
            button.textContent = text;
        }
    }

    function getStudentName(record) {
        return (
            record.student_name ||
            record.studentName ||
            [
                record.student_first_name ||
                record.studentFirstName ||
                record.first_name ||
                record.firstName ||
                "",

                record.student_middle_name ||
                record.studentMiddleName ||
                record.middle_name ||
                record.middleName ||
                "",

                record.student_last_name ||
                record.studentLastName ||
                record.last_name ||
                record.lastName ||
                ""
            ]
                .filter(Boolean)
                .join(" ")
        ) || "Unknown Student";
    }

    function getSubjectName(record) {
        return (
            record.subject_name ||
            record.subjectName ||
            record.subject ||
            record.title ||
            "Unknown Subject"
        );
    }

    function getInitials(name) {
        if (
            window.App &&
            typeof window.App.getInitials === "function"
        ) {
            return window.App.getInitials(name);
        }

        return String(name)
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                (word) =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");
    }

    function formToObject(form) {
        const formData = new FormData(form);
        const data = {};

        formData.forEach((value, key) => {
            data[key] = value;
        });

        return data;
    }

    function setFormValue(selector, value) {
        const element =
            document.querySelector(selector);

        if (element) {
            element.value = value ?? "";
        }
    }

    function getValue(...selectors) {
        for (const selector of selectors) {
            const element =
                document.querySelector(selector);

            if (element) {
                return element.value || "";
            }
        }

        return "";
    }

    function formatNumber(value) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number.toFixed(2)
            : "0.00";
    }

    function getTableBody() {
        return (
            document.querySelector("#resultsTableBody") ||
            document.querySelector("#resultTableBody") ||
            document.querySelector(
                "tbody[data-results-body]"
            )
        );
    }

    function showLoading() {
        const container = getTableBody();

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="students-loading">
                        <div class="students-loading-spinner"></div>
                        <p>Loading results...</p>
                    </div>
                </td>
            </tr>
        `;
    }

    function showEmpty(message) {
        const container = getTableBody();

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="students-empty">
                        <div class="students-empty-icon">
                            A
                        </div>

                        <h3>
                            No results found
                        </h3>

                        <p>
                            ${escapeHtml(message)}
                        </p>
                    </div>
                </td>
            </tr>
        `;
    }

    function showError(message) {
        const container = getTableBody();

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="students-empty">
                        <h3>
                            Unable to load results
                        </h3>

                        <p>
                            ${escapeHtml(message)}
                        </p>
                    </div>
                </td>
            </tr>
        `;
    }

    function notify(message, type = "success") {
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

            container.style.position = "fixed";
            container.style.top = "20px";
            container.style.right = "20px";
            container.style.zIndex = "9999";

            document.body.appendChild(container);
        }

        const notification =
            document.createElement("div");

        notification.className =
            `alert alert-${type}`;

        notification.textContent = message;
        notification.style.marginBottom = "10px";

        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
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

    window.ResultsPage = {
        initialize,
        loadResults,
        loadStudents,
        loadSubjects,
        editResult,
        deleteResult,
        resetForm,
        calculateGrade,
        getRemark
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();