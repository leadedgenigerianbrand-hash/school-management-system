"use strict";

(function () {
    const API_BASE = "/api";

    let guardians = [];
    let students = [];
    let editingGuardianId = null;

    function getToken() {
        return (
            localStorage.getItem("school_management_token") ||
            sessionStorage.getItem("school_management_token") ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            ""
        );
    }

    async function request(endpoint, options = {}) {
        let url = endpoint;

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            if (!url.startsWith("/")) {
                url = "/" + url;
            }

            if (!url.startsWith(API_BASE + "/")) {
                url = API_BASE + url;
            }
        }

        const headers = {
            ...(options.headers || {})
        };

        const token = getToken();

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
            console.error("Guardian API request failed:", error);
            throw new Error(
                "Unable to connect to the server. Please check your connection."
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

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            let message = "Request failed.";

            if (data && typeof data === "object") {
                message =
                    data.message ||
                    data.error ||
                    message;
            } else if (
                typeof data === "string" &&
                data.trim()
            ) {
                message = data;
            }

            throw new Error(message);
        }

        return data;
    }

    async function initialize() {
        setupEvents();

        await loadStudents();
        await loadGuardians();
    }

    function setupEvents() {
        const form =
            document.querySelector("#guardianForm") ||
            document.querySelector(
                "form[data-guardian-form]"
            );

        if (form && !form.dataset.guardianInitialized) {
            form.addEventListener(
                "submit",
                handleSubmit
            );

            form.dataset.guardianInitialized = "true";
        }

        const search =
            document.querySelector("#guardianSearch") ||
            document.querySelector(
                "[name='guardian_search']"
            );

        if (search && !search.dataset.guardianSearchInitialized) {
            const handler =
                window.App &&
                typeof window.App.debounce === "function"
                    ? window.App.debounce(
                        renderGuardians,
                        300
                    )
                    : renderGuardians;

            search.addEventListener(
                "input",
                handler
            );

            search.dataset.guardianSearchInitialized = "true";
        }

        if (!document.body.dataset.guardianActionsInitialized) {
            document.addEventListener(
                "click",
                handleActionClick
            );

            document.body.dataset.guardianActionsInitialized = "true";
        }
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

    async function loadGuardians() {
        showLoading();

        try {
            const data = await request("/guardians");

            guardians =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.guardians)
                            ? data.guardians
                            : Array.isArray(data?.records)
                                ? data.records
                                : [];

            renderGuardians();
        } catch (error) {
            console.error(
                "Unable to load guardians:",
                error
            );

            guardians = [];

            showError(
                error.message ||
                "Unable to load guardians."
            );
        }
    }

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

        const currentValue = select.value;

        select.innerHTML =
            `<option value="">Select student</option>`;

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
                getStudentName(student);

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    }

    function renderGuardians() {
        const container =
            document.querySelector("#guardiansTableBody") ||
            document.querySelector("#guardianTableBody") ||
            document.querySelector(
                "tbody[data-guardians-body]"
            );

        if (!container) {
            return;
        }

        const search =
            getValue(
                "#guardianSearch",
                "[name='guardian_search']"
            )
                .trim()
                .toLowerCase();

        const records =
            search
                ? guardians.filter(function (guardian) {
                    const guardianName =
                        getGuardianName(
                            guardian
                        ).toLowerCase();

                    const phone =
                        String(
                            guardian.phone ||
                            guardian.phone_number ||
                            ""
                        ).toLowerCase();

                    const email =
                        String(
                            guardian.email ||
                            ""
                        ).toLowerCase();

                    const studentName =
                        getStudentName(
                            guardian
                        ).toLowerCase();

                    const admissionNumber =
                        String(
                            guardian.admission_number ||
                            guardian.admissionNumber ||
                            ""
                        ).toLowerCase();

                    return (
                        guardianName.includes(search) ||
                        phone.includes(search) ||
                        email.includes(search) ||
                        studentName.includes(search) ||
                        admissionNumber.includes(search)
                    );
                })
                : guardians;

        if (!records.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="students-empty">
                            <div class="students-empty-icon">👤</div>
                            <h3>No guardians found</h3>
                            <p>
                                No parent or guardian records are available.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        container.innerHTML =
            records
                .map(renderGuardianRow)
                .join("");
    }

    function renderGuardianRow(guardian) {
        const id =
            guardian.id ||
            guardian.guardian_id;

        const guardianName =
            getGuardianName(guardian);

        const studentName =
            getStudentName(guardian);

        const relationship =
            guardian.relationship ||
            guardian.relation ||
            "-";

        const phone =
            guardian.phone ||
            guardian.phone_number ||
            "-";

        const email =
            guardian.email ||
            "-";

        const occupation =
            guardian.occupation ||
            "-";

        const address =
            guardian.address ||
            guardian.residential_address ||
            "-";

        const status =
            String(
                guardian.status ||
                "active"
            ).toLowerCase();

        return `
            <tr>
                <td>
                    <div class="student-name">
                        <div class="student-avatar">
                            ${escapeHtml(
                                getInitials(
                                    guardianName
                                )
                            )}
                        </div>

                        <div class="student-name-text">
                            <strong>
                                ${escapeHtml(
                                    guardianName
                                )}
                            </strong>
                        </div>
                    </div>
                </td>

                <td>
                    ${escapeHtml(studentName)}
                </td>

                <td>
                    ${escapeHtml(relationship)}
                </td>

                <td>
                    ${escapeHtml(phone)}
                </td>

                <td>
                    ${escapeHtml(email)}
                </td>

                <td>
                    ${escapeHtml(occupation)}
                </td>

                <td>
                    ${escapeHtml(address)}
                </td>

                <td>
                    <span class="student-status ${escapeAttribute(status)}">
                        ${escapeHtml(
                            formatStatus(status)
                        )}
                    </span>
                </td>

                <td>
                    <div class="student-actions">
                        <button
                            type="button"
                            class="student-action-btn"
                            data-action="edit-guardian"
                            data-id="${escapeAttribute(id)}"
                            title="Edit"
                        >
                            ✎
                        </button>

                        <button
                            type="button"
                            class="student-action-btn delete"
                            data-action="delete-guardian"
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

        const firstName =
            data.first_name ||
            data.firstname ||
            "";

        const lastName =
            data.last_name ||
            data.lastname ||
            "";

        const guardianName =
            data.name ||
            data.full_name ||
            "";

        if (
            !firstName &&
            !lastName &&
            !guardianName
        ) {
            notify(
                "Please enter the guardian's name.",
                "error"
            );
            return;
        }

        try {
            if (editingGuardianId) {
                await request(
                    `/guardians/${encodeURIComponent(
                        editingGuardianId
                    )}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(data)
                    }
                );

                notify(
                    "Guardian updated successfully.",
                    "success"
                );
            } else {
                await request(
                    "/guardians",
                    {
                        method: "POST",
                        body: JSON.stringify(data)
                    }
                );

                notify(
                    "Guardian added successfully.",
                    "success"
                );
            }

            resetForm();
            await loadGuardians();
        } catch (error) {
            console.error(
                "Guardian save failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save guardian.",
                "error"
            );
        }
    }

    function editGuardian(id) {
        const guardian =
            guardians.find(function (item) {
                return String(
                    item.id ||
                    item.guardian_id
                ) === String(id);
            });

        if (!guardian) {
            return;
        }

        editingGuardianId = id;

        setFormValue(
            "#studentId",
            guardian.student_id ||
            guardian.studentId
        );

        setFormValue(
            "#firstName",
            guardian.first_name ||
            guardian.firstName
        );

        setFormValue(
            "#middleName",
            guardian.middle_name ||
            guardian.middleName
        );

        setFormValue(
            "#lastName",
            guardian.last_name ||
            guardian.lastName
        );

        setFormValue(
            "#name",
            guardian.name ||
            guardian.full_name ||
            guardian.guardian_name
        );

        setFormValue(
            "#relationship",
            guardian.relationship ||
            guardian.relation
        );

        setFormValue(
            "#phone",
            guardian.phone ||
            guardian.phone_number
        );

        setFormValue(
            "#email",
            guardian.email
        );

        setFormValue(
            "#occupation",
            guardian.occupation
        );

        setFormValue(
            "#address",
            guardian.address ||
            guardian.residential_address
        );

        setFormValue(
            "#isPrimary",
            guardian.is_primary ??
            guardian.isPrimary ??
            false
        );

        updateFormMode(
            "Update Guardian"
        );
    }

    async function deleteGuardian(id) {
        const guardian =
            guardians.find(function (item) {
                return String(
                    item.id ||
                    item.guardian_id
                ) === String(id);
            });

        const name =
            guardian
                ? getGuardianName(guardian)
                : "this guardian";

        if (
            !window.confirm(
                `Are you sure you want to delete "${name}"?`
            )
        ) {
            return;
        }

        try {
            await request(
                `/guardians/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            notify(
                "Guardian deleted successfully.",
                "success"
            );

            await loadGuardians();
        } catch (error) {
            console.error(
                "Guardian deletion failed:",
                error
            );

            notify(
                error.message ||
                "Unable to delete guardian.",
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

        if (action === "edit-guardian") {
            editGuardian(id);
            return;
        }

        if (action === "delete-guardian") {
            await deleteGuardian(id);
        }
    }

    function resetForm() {
        editingGuardianId = null;

        const form =
            document.querySelector(
                "#guardianForm"
            );

        if (form) {
            form.reset();
        }

        updateFormMode(
            "Add Guardian"
        );
    }

    function updateFormMode(text) {
        const form =
            document.querySelector(
                "#guardianForm"
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

    function getGuardianName(guardian) {
        const fullName =
            guardian.name ||
            guardian.full_name ||
            guardian.guardian_name;

        if (fullName) {
            return String(fullName);
        }

        return [
            guardian.first_name ||
            guardian.firstName ||
            "",

            guardian.middle_name ||
            guardian.middleName ||
            "",

            guardian.last_name ||
            guardian.lastName ||
            ""
        ]
            .filter(Boolean)
            .join(" ") ||
            "Unknown Guardian";
    }

    function getStudentName(record) {
        if (record.student_name) {
            return String(
                record.student_name
            );
        }

        if (record.studentName) {
            return String(
                record.studentName
            );
        }

        return [
            record.student_first_name ||
            record.studentFirstName ||
            "",

            record.student_middle_name ||
            record.studentMiddleName ||
            "",

            record.student_last_name ||
            record.studentLastName ||
            ""
        ]
            .filter(Boolean)
            .join(" ") ||
            "Unknown Student";
    }

    function getInitials(name) {
        if (
            window.App &&
            typeof window.App.getInitials === "function"
        ) {
            return window.App.getInitials(name);
        }

        return String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(function (word) {
                return word
                    .charAt(0)
                    .toUpperCase();
            })
            .join("");
    }

    function formToObject(form) {
        const formData =
            new FormData(form);

        const data = {};

        formData.forEach(function (value, key) {
            data[key] = value;
        });

        form.querySelectorAll(
            "input[type='checkbox']"
        ).forEach(function (checkbox) {
            data[checkbox.name] =
                checkbox.checked;
        });

        return data;
    }

    function setFormValue(selector, value) {
        const element =
            document.querySelector(selector);

        if (!element) {
            return;
        }

        if (element.type === "checkbox") {
            element.checked =
                Boolean(value);
        } else {
            element.value =
                value ?? "";
        }
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

    function showLoading() {
        const container =
            document.querySelector(
                "#guardiansTableBody"
            ) ||
            document.querySelector(
                "#guardianTableBody"
            ) ||
            document.querySelector(
                "tbody[data-guardians-body]"
            );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="students-loading">
                        <div class="students-loading-spinner"></div>
                        <p>Loading guardians...</p>
                    </div>
                </td>
            </tr>
        `;
    }

    function showError(message) {
        const container =
            document.querySelector(
                "#guardiansTableBody"
            ) ||
            document.querySelector(
                "#guardianTableBody"
            ) ||
            document.querySelector(
                "tbody[data-guardians-body]"
            );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="students-empty">
                        <h3>Unable to load guardians</h3>
                        <p>${escapeHtml(message)}</p>
                    </div>
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

            container.style.position = "fixed";
            container.style.top = "20px";
            container.style.right = "20px";
            container.style.zIndex = "9999";

            document.body.appendChild(
                container
            );
        }

        const notification =
            document.createElement("div");

        notification.className =
            `alert alert-${type}`;

        notification.textContent =
            message;

        notification.style.marginBottom =
            "10px";

        container.appendChild(
            notification
        );

        setTimeout(function () {
            notification.remove();
        }, 4000);
    }

    function escapeHtml(value) {
        if (
            window.App &&
            typeof window.App.escapeHtml === "function"
        ) {
            return window.App.escapeHtml(value);
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }

    function formatStatus(status) {
        const normalized =
            String(status || "active")
                .replace(/_/g, " ")
                .trim();

        if (!normalized) {
            return "Active";
        }

        return normalized
            .charAt(0)
            .toUpperCase() +
            normalized
                .slice(1)
                .toLowerCase();
    }

    window.GuardiansPage = {
        initialize,
        loadGuardians,
        loadStudents,
        editGuardian,
        deleteGuardian,
        resetForm
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