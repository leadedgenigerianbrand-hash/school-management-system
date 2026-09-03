```javascript
"use strict";

(function () {
    let subjects = [];
    let editingSubjectId = null;

    async function request(endpoint, options = {}) {
        if (typeof window.apiRequest === "function") {
            return window.apiRequest(endpoint, options);
        }

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

        const token =
            localStorage.getItem("school_management_token") ||
            sessionStorage.getItem("school_management_token") ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            "";

        const headers = {
            Accept: "application/json",
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
            console.error("Subjects API error:", error);

            throw new Error(
                "Unable to connect to the server."
            );
        }

        if (response.status === 401) {
            if (
                typeof window.clearApiAuthentication ===
                "function"
            ) {
                window.clearApiAuthentication();
            } else {
                localStorage.removeItem(
                    "school_management_token"
                );
                localStorage.removeItem(
                    "school_management_user"
                );
                sessionStorage.removeItem(
                    "school_management_token"
                );
                sessionStorage.removeItem(
                    "school_management_user"
                );
            }

            if (
                !window.location.pathname.endsWith(
                    "/login.html"
                )
            ) {
                window.location.href =
                    "/pages/login.html";
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
                    ? data?.message ||
                      data?.error ||
                      "Request failed."
                    : data ||
                      "Request failed."
            );
        }

        return data;
    }

    async function initialize() {
        setupEvents();
        await loadSubjects();
        updateSummary();
    }

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

    async function loadSubjects() {
        showLoading();

        try {
            const data =
                await request("/subjects");

            subjects =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.subjects)
                            ? data.subjects
                            : Array.isArray(data?.records)
                                ? data.records
                                : [];

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

            updateSummary();
        }
    }

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
            )
                .trim()
                .toLowerCase();

        let records = subjects;

        if (search) {
            records = subjects.filter(
                (subject) => {
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

                    const department =
                        String(
                            subject.department_name ||
                            subject.department ||
                            ""
                        ).toLowerCase();

                    const className =
                        String(
                            subject.class_name ||
                            subject.class ||
                            ""
                        ).toLowerCase();

                    return (
                        name.includes(search) ||
                        code.includes(search) ||
                        description.includes(search) ||
                        department.includes(search) ||
                        className.includes(search)
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

    function renderSubjectRow(subject) {
        const id =
            subject.id ??
            subject.subject_id ??
            "";

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
                            ${escapeHtml(
                                getInitials(name)
                            )}
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
                    <span class="status-badge ${escapeAttribute(
                        getStatusClass(status)
                    )}">
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
                    `/subjects/${encodeURIComponent(
                        editingSubjectId
                    )}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(data)
                    }
                );

                notify(
                    "Subject updated successfully.",
                    "success"
                );
            } else {
                await request(
                    "/subjects",
                    {
                        method: "POST",
                        body: JSON.stringify(data)
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

    function editSubject(id) {
        const subject =
            subjects.find(
                (item) =>
                    String(
                        item.id ??
                        item.subject_id
                    ) === String(id)
            );

        if (!subject) {
            notify(
                "Subject record could not be found.",
                "error"
            );

            return;
        }

        editingSubjectId = id;

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
                `/subjects/${encodeURIComponent(id)}`,
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
            action === "edit-subject"
        ) {
            editSubject(id);
            return;
        }

        if (
            action === "delete-subject"
        ) {
            await deleteSubject(id);
        }
    }

    function resetForm() {
        editingSubjectId = null;

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
            button.textContent = text;
        }
    }

    function updateSummary() {
        const total =
            subjects.length;

        const active =
            subjects.filter(
                (subject) =>
                    String(
                        subject.status ||
                        "Active"
                    ).toLowerCase() ===
                    "active"
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

    function setSummary(
        selectors,
        value
    ) {
        for (const selector of selectors) {
            const element =
                document.querySelector(
                    selector
                );

            if (element) {
                element.textContent = value;
                return;
            }
        }
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
            .trim()
            .split(/\s+/)
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

    function getStatusClass(status) {
        const value =
            String(status || "active")
                .toLowerCase();

        if (value === "active") {
            return "active";
        }

        if (value === "inactive") {
            return "inactive";
        }

        if (value === "suspended") {
            return "warning";
        }

        return "";
    }

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

    function formToObject(form) {
        const formData =
            new FormData(form);

        const data = {};

        formData.forEach(
            (value, key) => {
                data[key] = value;
            }
        );

        form.querySelectorAll(
            'input[type="checkbox"]'
        ).forEach(
            (checkbox) => {
                data[checkbox.name] =
                    checkbox.checked;
            }
        );

        return data;
    }

    function getValue(...selectors) {
        for (const selector of selectors) {
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

    function showLoading() {
        const container =
            getSubjectsTableBody();

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

    function showError(message) {
        const container =
            getSubjectsTableBody();

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

    function getSubjectsTableBody() {
        return (
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
            )
        );
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

        notification.style.marginBottom =
            "10px";

        container.appendChild(
            notification
        );

        setTimeout(
            () => {
                notification.remove();
            },
            4000
        );
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
        return escapeHtml(value);
    }

    window.SubjectsPage = {
        initialize,
        loadSubjects,
        renderSubjects,
        editSubject,
        deleteSubject,
        resetForm
    };

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();
```
