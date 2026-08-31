/*
|--------------------------------------------------------------------------
| RESULTS.JS
|--------------------------------------------------------------------------
| Handles student academic results.
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";

    let results = [];
    let students = [];
    let subjects = [];
    let editingResultId = null;

    /*
    |--------------------------------------------------------------------------
    | API HELPER
    |--------------------------------------------------------------------------
    */

    async function request(url, options = {}) {

        if (
            window.API &&
            typeof window.API.request === "function"
        ) {
            return window.API.request(url, options);
        }

        const response = await fetch(url, {
            credentials: "include",
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        const contentType =
            response.headers.get("content-type") || "";

        const data =
            contentType.includes("application/json")
                ? await response.json()
                : await response.text();

        if (!response.ok) {
            throw new Error(
                data?.message ||
                data?.error ||
                "Request failed."
            );
        }

        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | INITIALIZE
    |--------------------------------------------------------------------------
    */

    async function initialize() {

        setupEvents();

        await Promise.all([
            loadStudents(),
            loadSubjects()
        ]);

        await loadResults();

        updateSummary();
    }


    /*
    |--------------------------------------------------------------------------
    | EVENTS
    |--------------------------------------------------------------------------
    */

    function setupEvents() {

        const form =
            document.querySelector("#resultForm") ||
            document.querySelector(
                "form[data-result-form]"
            );

        if (form) {
            form.addEventListener(
                "submit",
                handleSubmit
            );
        }


        const search =
            document.querySelector("#resultSearch") ||
            document.querySelector(
                "[name='result_search']"
            );

        if (search) {

            const handler =
                window.App &&
                typeof App.debounce === "function"
                    ? App.debounce(
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


        const scoreInputs =
            document.querySelectorAll(
                "[data-score], .score-input"
            );


        scoreInputs.forEach(function (input) {

            input.addEventListener(
                "input",
                calculatePreview
            );
        });
    }


    /*
    |--------------------------------------------------------------------------
    | LOAD STUDENTS
    |--------------------------------------------------------------------------
    */

    async function loadStudents() {

        try {

            const data =
                await request(
                    "/api/students"
                );

            students =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.students ||
                        []
                    );

            populateStudentSelect();

        } catch (error) {

            console.error(
                "Unable to load students:",
                error
            );

            students = [];
        }
    }


    /*
    |--------------------------------------------------------------------------
    | LOAD SUBJECTS
    |--------------------------------------------------------------------------
    */

    async function loadSubjects() {

        try {

            const data =
                await request(
                    "/api/subjects"
                );

            subjects =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.subjects ||
                        []
                    );

            populateSubjectSelect();

        } catch (error) {

            console.error(
                "Unable to load subjects:",
                error
            );

            subjects = [];
        }
    }


    /*
    |--------------------------------------------------------------------------
    | LOAD RESULTS
    |--------------------------------------------------------------------------
    */

    async function loadResults() {

        showLoading();

        try {

            const data =
                await request(
                    "/api/results"
                );

            results =
                Array.isArray(data)
                    ? data
                    : (
                        data?.data ||
                        data?.results ||
                        data?.records ||
                        []
                    );

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


    /*
    |--------------------------------------------------------------------------
    | POPULATE STUDENT SELECT
    |--------------------------------------------------------------------------
    */

    function populateStudentSelect() {

        const select =
            document.querySelector("#studentId") ||
            document.querySelector("#student-id") ||
            document.querySelector(
                "[name='student_id']"
            );

        if (!select) {
            return;
        }


        const currentValue =
            select.value;


        select.innerHTML =
            `<option value="">
                Select student
            </option>`;


        students.forEach(function (student) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                student.id ||
                student.student_id;


            option.textContent =
                getStudentName(student);


            select.appendChild(
                option
            );
        });


        if (currentValue) {
            select.value =
                currentValue;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | POPULATE SUBJECT SELECT
    |--------------------------------------------------------------------------
    */

    function populateSubjectSelect() {

        const select =
            document.querySelector("#subjectId") ||
            document.querySelector("#subject-id") ||
            document.querySelector(
                "[name='subject_id']"
            );

        if (!select) {
            return;
        }


        const currentValue =
            select.value;


        select.innerHTML =
            `<option value="">
                Select subject
            </option>`;


        subjects.forEach(function (subject) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                subject.id ||
                subject.subject_id;


            option.textContent =
                subject.name ||
                subject.subject_name ||
                subject.title ||
                "Subject";


            select.appendChild(
                option
            );
        });


        if (currentValue) {
            select.value =
                currentValue;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RENDER RESULTS
    |--------------------------------------------------------------------------
    */

    function renderResults() {

        const container =
            document.querySelector(
                "#resultsTableBody"
            ) ||
            document.querySelector(
                "#resultTableBody"
            ) ||
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
            ).toLowerCase();


        let records =
            results;


        if (search) {

            records =
                results.filter(
                    function (result) {

                        const student =
                            getStudentName(
                                result
                            ).toLowerCase();


                        const subject =
                            getSubjectName(
                                result
                            ).toLowerCase();


                        const grade =
                            String(
                                result.grade ||
                                ""
                            ).toLowerCase();


                        return (
                            student.includes(search) ||
                            subject.includes(search) ||
                            grade.includes(search)
                        );
                    }
                );
        }


        if (!records.length) {

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
                                No academic result records are available.
                            </p>

                        </div>
                    </td>
                </tr>
            `;

            return;
        }


        container.innerHTML =
            records
                .map(renderResultRow)
                .join("");
    }


    /*
    |--------------------------------------------------------------------------
    | RESULT ROW
    |--------------------------------------------------------------------------
    */

    function renderResultRow(result) {

        const id =
            result.id ||
            result.result_id;


        const studentName =
            getStudentName(result);


        const subjectName =
            getSubjectName(result);


        const ca =
            Number(
                result.ca ||
                result.continuous_assessment ||
                result.continuousAssessment ||
                0
            );


        const exam =
            Number(
                result.exam ||
                result.exam_score ||
                result.examination ||
                0
            );


        let total =
            Number(
                result.total
            );


        if (
            !Number.isFinite(total)
        ) {
            total =
                ca + exam;
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
                            ${getInitials(studentName)}
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


    /*
    |--------------------------------------------------------------------------
    | SUBMIT RESULT
    |--------------------------------------------------------------------------
    */

    async function handleSubmit(event) {

        event.preventDefault();


        const form =
            event.currentTarget;


        const data =
            formToObject(form);


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


        const ca =
            Number(
                data.ca ||
                data.continuous_assessment ||
                0
            );


        const exam =
            Number(
                data.exam ||
                data.exam_score ||
                data.examination ||
                0
            );


        if (
            ca < 0 ||
            exam < 0
        ) {

            notify(
                "Scores cannot be negative.",
                "error"
            );

            return;
        }


        const total =
            ca + exam;


        if (
            total > 100
        ) {

            notify(
                "The total score cannot exceed 100.",
                "error"
            );

            return;
        }


        data.total =
            total;


        data.grade =
            calculateGrade(total);


        data.remark =
            getRemark(total);


        try {

            if (editingResultId) {

                await request(
                    `/api/results/${editingResultId}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Result updated successfully.",
                    "success"
                );

            } else {

                await request(
                    "/api/results",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(data)
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


    /*
    |--------------------------------------------------------------------------
    | EDIT RESULT
    |--------------------------------------------------------------------------
    */

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
            return;
        }


        editingResultId =
            id;


        setFormValue(
            "#studentId",
            result.student_id ||
            result.studentId
        );


        setFormValue(
            "#subjectId",
            result.subject_id ||
            result.subjectId
        );


        setFormValue(
            "#ca",
            result.ca ||
            result.continuous_assessment ||
            result.continuousAssessment
        );


        setFormValue(
            "#exam",
            result.exam ||
            result.exam_score ||
            result.examination
        );


        setFormValue(
            "#session",
            result.session_id ||
            result.session
        );


        setFormValue(
            "#term",
            result.term_id ||
            result.term
        );


        updateFormMode(
            "Update Result"
        );


        calculatePreview();
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE RESULT
    |--------------------------------------------------------------------------
    */

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
                `/api/results/${id}`,
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


    /*
    |--------------------------------------------------------------------------
    | ACTION CLICK
    |--------------------------------------------------------------------------
    */

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
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CALCULATE PREVIEW
    |--------------------------------------------------------------------------
    */

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


        const total =
            ca + exam;


        const grade =
            calculateGrade(total);


        const remark =
            getRemark(total);


        const totalElement =
            document.querySelector(
                "#total"
            ) ||
            document.querySelector(
                "#resultTotal"
            );


        if (totalElement) {
            totalElement.textContent =
                formatNumber(total);
        }


        const gradeElement =
            document.querySelector(
                "#grade"
            ) ||
            document.querySelector(
                "#resultGrade"
            );


        if (gradeElement) {
            gradeElement.textContent =
                grade;
        }


        const remarkElement =
            document.querySelector(
                "#remark"
            ) ||
            document.querySelector(
                "#resultRemark"
            );


        if (remarkElement) {
            remarkElement.textContent =
                remark;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | GRADE CALCULATION
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | REMARK
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    function updateSummary() {

        const count =
            results.length;


        let total =
            0;


        results.forEach(
            function (result) {

                let value =
                    Number(
                        result.total
                    );


                if (
                    !Number.isFinite(value)
                ) {

                    value =
                        Number(
                            result.ca ||
                            result.continuous_assessment ||
                            0
                        ) +
                        Number(
                            result.exam ||
                            result.exam_score ||
                            0
                        );
                }


                total += value;
            }
        );


        const average =
            count
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


    /*
    |--------------------------------------------------------------------------
    | SET SUMMARY
    |--------------------------------------------------------------------------
    */

    function setSummary(
        selectors,
        value
    ) {

        for (
            const selector of selectors
        ) {

            const element =
                document.querySelector(
                    selector
                );


            if (element) {

                element.textContent =
                    value;

                return;
            }
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RESET FORM
    |--------------------------------------------------------------------------
    */

    function resetForm() {

        editingResultId =
            null;


        const form =
            document.querySelector(
                "#resultForm"
            );


        if (form) {
            form.reset();
        }


        updateFormMode(
            "Add Result"
        );


        calculatePreview();
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE FORM MODE
    |--------------------------------------------------------------------------
    */

    function updateFormMode(text) {

        const form =
            document.querySelector(
                "#resultForm"
            );


        if (!form) {
            return;
        }


        const button =
            form.querySelector(
                "button[type='submit']"
            );


        if (button) {
            button.textContent =
                text;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | GET STUDENT NAME
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | GET SUBJECT NAME
    |--------------------------------------------------------------------------
    */

    function getSubjectName(record) {

        return (
            record.subject_name ||
            record.subjectName ||
            record.subject ||
            record.title ||
            "Unknown Subject"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | INITIALS
    |--------------------------------------------------------------------------
    */

    function getInitials(name) {

        if (
            window.App &&
            typeof App.getInitials ===
            "function"
        ) {
            return App.getInitials(name);
        }


        return String(name)
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                word =>
                    word
                        .charAt(0)
                        .toUpperCase()
            )
            .join("");
    }


    /*
    |--------------------------------------------------------------------------
    | FORM TO OBJECT
    |--------------------------------------------------------------------------
    */

    function formToObject(form) {

        const formData =
            new FormData(form);


        const data = {};


        formData.forEach(
            function (value, key) {

                data[key] =
                    value;
            }
        );


        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | SET FORM VALUE
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | GET VALUE
    |--------------------------------------------------------------------------
    */

    function getValue(...selectors) {

        for (
            const selector of selectors
        ) {

            const element =
                document.querySelector(
                    selector
                );


            if (element) {
                return element.value || "";
            }
        }


        return "";
    }


    /*
    |--------------------------------------------------------------------------
    | NUMBER FORMAT
    |--------------------------------------------------------------------------
    */

    function formatNumber(value) {

        return Number(
            value || 0
        ).toFixed(2);
    }


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    function showLoading() {

        const container =
            document.querySelector(
                "#resultsTableBody"
            ) ||
            document.querySelector(
                "#resultTableBody"
            ) ||
            document.querySelector(
                "tbody[data-results-body]"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="students-loading">
                        <div class="students-loading-spinner"></div>
                        <p>
                            Loading results...
                        </p>
                    </div>
                </td>
            </tr>
        `;
    }


    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    function showError(message) {

        const container =
            document.querySelector(
                "#resultsTableBody"
            ) ||
            document.querySelector(
                "#resultTableBody"
            ) ||
            document.querySelector(
                "tbody[data-results-body]"
            );


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


    /*
    |--------------------------------------------------------------------------
    | NOTIFICATION
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | ESCAPE HTML
    |--------------------------------------------------------------------------
    */

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }


        if (
            window.App &&
            typeof App.escapeHtml ===
            "function"
        ) {
            return App.escapeHtml(value);
        }


        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /*
    |--------------------------------------------------------------------------
    | ESCAPE ATTRIBUTE
    |--------------------------------------------------------------------------
    */

    function escapeAttribute(value) {

        return escapeHtml(value);
    }


    /*
    |--------------------------------------------------------------------------
    | EXPORT
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | START
    |--------------------------------------------------------------------------
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();
    }

})();