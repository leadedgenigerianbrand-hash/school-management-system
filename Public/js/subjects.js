/*
|--------------------------------------------------------------------------
| SUBJECTS.JS
|--------------------------------------------------------------------------
| Handles subject listing, searching, adding, editing and deleting.
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";

    let subjects = [];
    let editingSubjectId = null;

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

        await loadSubjects();

        updateSummary();
    }

    /*
    |--------------------------------------------------------------------------
    | EVENTS
    |--------------------------------------------------------------------------
    */

    function setupEvents() {

        const form =
            document.querySelector("#subjectForm") ||
            document.querySelector(
                "form[data-subject-form]"
            );

        if (form) {
            form.addEventListener(
                "submit",
                handleSubmit
            );
        }

        const search =
            document.querySelector("#subjectSearch") ||
            document.querySelector(
                "[name='subject_search']"
            );

        if (search) {

            search.addEventListener(
                "input",
                renderSubjects
            );
        }

        document.addEventListener(
            "click",
            handleActionClick
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD SUBJECTS
    |--------------------------------------------------------------------------
    */

    async function loadSubjects() {

        showLoading();

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
                        data?.records ||
                        []
                    );

            renderSubjects();

            updateSummary();

        } catch (error) {

            console.error(
                "Unable to load subjects:",
                error
            );

            subjects = [];

            showError(
                error.message ||
                "Unable to load subjects."
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RENDER SUBJECTS
    |--------------------------------------------------------------------------
    */

    function renderSubjects() {

        const container =
            document.querySelector(
                "#subjectsTableBody"
            ) ||
            document.querySelector(
                "#subjectTableBody"
            ) ||
            document.querySelector(
                "#subjects-table-body"
            ) ||
            document.querySelector(
                "tbody[data-subjects-body]"
            );

        if (!container) {
            return;
        }

        const search =
            getValue(
                "#subjectSearch",
                "[name='subject_search']"
            ).toLowerCase();

        let records =
            subjects;

        if (search) {

            records =
                subjects.filter(
                    function (subject) {

                        const name =
                            String(
                                subject.name ||
                                subject.subject_name ||
                                ""
                            ).toLowerCase();

                        const code =
                            String(
                                subject.code ||
                                subject.subject_code ||
                                ""
                            ).toLowerCase();

                        const description =
                            String(
                                subject.description ||
                                ""
                            ).toLowerCase();

                        return (
                            name.includes(search) ||
                            code.includes(search) ||
                            description.includes(search)
                        );
                    }
                );
        }

        if (!records.length) {

            container.innerHTML = `
                <tr>
                    <td colspan="8">

                        <div class="students-empty">

                            <div class="students-empty-icon">
                                S
                            </div>

                            <h3>
                                No subjects found
                            </h3>

                            <p>
                                There are no subject records to display.
                            </p>

                        </div>

                    </td>
                </tr>
            `;

            return;
        }

        container.innerHTML =
            records
                .map(renderSubjectRow)
                .join("");
    }

    /*
    |--------------------------------------------------------------------------
    | SUBJECT ROW
    |--------------------------------------------------------------------------
    */

    function renderSubjectRow(subject) {

        const id =
            subject.id ||
            subject.subject_id;

        const name =
            subject.name ||
            subject.subject_name ||
            "-";

        const code =
            subject.code ||
            subject.subject_code ||
            "-";

        const description =
            subject.description ||
            "-";

        const department =
            subject.department_name ||
            subject.department ||
            "-";

        const className =
            subject.class_name ||
            subject.class ||
            "-";

        const status =
            subject.status ||
            "Active";

        return `
            <tr>

                <td>
                    <div class="student-name">

                        <div class="student-avatar">
                            ${getInitials(name)}
                        </div>

                        <div class="student-name-text">

                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                        </div>

                    </div>
                </td>

                <td>
                    ${escapeHtml(code)}
                </td>

                <td>
                    ${escapeHtml(description)}
                </td>

                <td>
                    ${escapeHtml(department)}
                </td>

                <td>
                    ${escapeHtml(className)}
                </td>

                <td>
                    <span class="status-badge ${getStatusClass(status)}">
                        ${escapeHtml(status)}
                    </span>
                </td>

                <td>
                    ${formatDate(
                        subject.created_at ||
                        subject.createdAt
                    )}
                </td>

                <td>

                    <div class="student-actions">

                        <button
                            type="button"
                            class="student-action-btn"
                            data-action="edit-subject"
                            data-id="${escapeAttribute(id)}"
                            title="Edit"
                        >
                            ✎
                        </button>

                        <button
                            type="button"
                            class="student-action-btn delete"
                            data-action="delete-subject"
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
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    async function handleSubmit(event) {

        event.preventDefault();

        const form =
            event.currentTarget;

        const data =
            formToObject(form);

        const name =
            data.name ||
            data.subject_name;

        if (!name) {

            notify(
                "Please enter the subject name.",
                "error"
            );

            return;
        }

        try {

            if (editingSubjectId) {

                await request(
                    `/api/subjects/${editingSubjectId}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Subject updated successfully.",
                    "success"
                );

            } else {

                await request(
                    "/api/subjects",
                    {
                        method: "POST",
                        body:
                            JSON.stringify(data)
                    }
                );

                notify(
                    "Subject added successfully.",
                    "success"
                );
            }

            resetForm();

            await loadSubjects();

        } catch (error) {

            console.error(
                "Subject save failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save subject.",
                "error"
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EDIT SUBJECT
    |--------------------------------------------------------------------------
    */

    function editSubject(id) {

        const subject =
            subjects.find(
                function (item) {

                    return String(
                        item.id ||
                        item.subject_id
                    ) === String(id);
                }
            );

        if (!subject) {
            return;
        }

        editingSubjectId =
            id;

        setFormValue(
            "#subjectName",
            subject.name ||
            subject.subject_name
        );

        setFormValue(
            "#subjectCode",
            subject.code ||
            subject.subject_code
        );

        setFormValue(
            "#description",
            subject.description
        );

        setFormValue(
            "#departmentId",
            subject.department_id ||
            subject.departmentId
        );

        setFormValue(
            "#classId",
            subject.class_id ||
            subject.classId
        );

        setFormValue(
            "#status",
            subject.status ||
            "Active"
        );

        updateFormMode(
            "Update Subject"
        );

        scrollToForm();
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE SUBJECT
    |--------------------------------------------------------------------------
    */

    async function deleteSubject(id) {

        if (
            !window.confirm(
                "Are you sure you want to delete this subject?"
            )
        ) {
            return;
        }

        try {

            await request(
                `/api/subjects/${id}`,
                {
                    method: "DELETE"
                }
            );

            notify(
                "Subject deleted successfully.",
                "success"
            );

            await loadSubjects();

        } catch (error) {

            console.error(
                "Subject deletion failed:",
                error
            );

            notify(
                error.message ||
                "Unable to delete subject.",
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
            "edit-subject"
        ) {

            editSubject(id);

            return;
        }

        if (
            action ===
            "delete-subject"
        ) {

            await deleteSubject(id);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESET FORM
    |--------------------------------------------------------------------------
    */

    function resetForm() {

        editingSubjectId =
            null;

        const form =
            document.querySelector(
                "#subjectForm"
            );

        if (form) {
            form.reset();
        }

        updateFormMode(
            "Add Subject"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FORM MODE
    |--------------------------------------------------------------------------
    */

    function updateFormMode(text) {

        const form =
            document.querySelector(
                "#subjectForm"
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
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    function updateSummary() {

        const total =
            subjects.length;

        const active =
            subjects.filter(
                function (subject) {

                    return String(
                        subject.status ||
                        "Active"
                    ).toLowerCase() ===
                    "active";
                }
            ).length;

        const inactive =
            total - active;

        setSummary(
            [
                "#totalSubjects",
                "#total-subjects",
                "[data-total-subjects]"
            ],
            total
        );

        setSummary(
            [
                "#activeSubjects",
                "#active-subjects",
                "[data-active-subjects]"
            ],
            active
        );

        setSummary(
            [
                "#inactiveSubjects",
                "#inactive-subjects",
                "[data-inactive-subjects]"
            ],
            inactive
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
    | STATUS CLASS
    |--------------------------------------------------------------------------
    */

    function getStatusClass(status) {

        const value =
            String(status)
                .toLowerCase();

        if (
            value === "active"
        ) {
            return "active";
        }

        if (
            value === "inactive"
        ) {
            return "inactive";
        }

        if (
            value === "suspended"
        ) {
            return "warning";
        }

        return "";
    }

    /*
    |--------------------------------------------------------------------------
    | DATE
    |--------------------------------------------------------------------------
    */

    function formatDate(value) {

        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return escapeHtml(value);
        }

        return date.toLocaleDateString(
            "en-NG",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
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
    | SCROLL TO FORM
    |--------------------------------------------------------------------------
    */

    function scrollToForm() {

        const form =
            document.querySelector(
                "#subjectForm"
            );

        if (form) {

            form.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    function showLoading() {

        const container =
            document.querySelector(
                "#subjectsTableBody"
            ) ||
            document.querySelector(
                "#subjectTableBody"
            ) ||
            document.querySelector(
                "#subjects-table-body"
            ) ||
            document.querySelector(
                "tbody[data-subjects-body]"
            );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="8">

                    <div class="students-loading">

                        <div class="students-loading-spinner"></div>

                        <p>
                            Loading subjects...
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
                "#subjectsTableBody"
            ) ||
            document.querySelector(
                "#subjectTableBody"
            ) ||
            document.querySelector(
                "#subjects-table-body"
            ) ||
            document.querySelector(
                "tbody[data-subjects-body]"
            );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="8">

                    <div class="students-empty">

                        <h3>
                            Unable to load subjects
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

    window.SubjectsPage = {
        initialize,
        loadSubjects,
        renderSubjects,
        editSubject,
        deleteSubject,
        resetForm
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