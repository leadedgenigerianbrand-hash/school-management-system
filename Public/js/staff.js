```javascript
"use strict";

(function () {
    let staff = [];
    let editingStaffId = null;

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
            console.error("Staff API error:", error);
            throw new Error(
                "Unable to connect to the server."
            );
        }

        if (response.status === 401) {
            if (typeof window.clearApiAuthentication === "function") {
                window.clearApiAuthentication();
            } else {
                localStorage.removeItem("school_management_token");
                localStorage.removeItem("school_management_user");
                sessionStorage.removeItem("school_management_token");
                sessionStorage.removeItem("school_management_user");
            }

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
                    ? data?.message ||
                      data?.error ||
                      "Request failed."
                    : data || "Request failed."
            );
        }

        return data;
    }

    async function initialize() {
        setupEvents();

        await loadStaff();

        updateSummary();
    }

    function setupEvents() {
        const form =
            document.querySelector("#staffForm") ||
            document.querySelector("form[data-staff-form]");

        if (form) {
            form.addEventListener(
                "submit",
                handleSubmit
            );
        }

        const search =
            document.querySelector("#staffSearch") ||
            document.querySelector("[name='staff_search']");

        if (search) {
            search.addEventListener(
                "input",
                renderStaff
            );
        }

        const departmentSelect =
            document.querySelector("#departmentId") ||
            document.querySelector("[name='department_id']");

        if (
            departmentSelect &&
            departmentSelect.options.length <= 1
        ) {
            loadDepartments();
        }

        document.addEventListener(
            "click",
            handleActionClick
        );
    }

    async function loadStaff() {
        showLoading();

        try {
            const data =
                await request("/staff");

            staff =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.staff)
                            ? data.staff
                            : Array.isArray(data?.records)
                                ? data.records
                                : [];

            renderStaff();
            updateSummary();
        } catch (error) {
            console.error(
                "Unable to load staff:",
                error
            );

            staff = [];

            showError(
                error.message ||
                "Unable to load staff."
            );

            updateSummary();
        }
    }

    async function loadDepartments() {
        try {
            const data =
                await request("/departments");

            const departments =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : Array.isArray(data?.departments)
                            ? data.departments
                            : [];

            populateDepartments(departments);
        } catch (error) {
            console.error(
                "Unable to load departments:",
                error
            );
        }
    }

    function populateDepartments(departments) {
        const select =
            document.querySelector("#departmentId") ||
            document.querySelector("[name='department_id']");

        if (!select) {
            return;
        }

        const currentValue =
            select.value;

        select.innerHTML =
            `<option value="">Select department</option>`;

        departments.forEach((department) => {
            const option =
                document.createElement("option");

            option.value =
                department.id ??
                department.department_id ??
                "";

            option.textContent =
                department.name ||
                department.department_name ||
                "Department";

            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    }

    function renderStaff() {
        const container =
            document.querySelector("#staffTableBody") ||
            document.querySelector("#staff-table-body") ||
            document.querySelector("tbody[data-staff-body]");

        if (!container) {
            return;
        }

        const search =
            getValue(
                "#staffSearch",
                "[name='staff_search']"
            )
                .trim()
                .toLowerCase();

        let records = staff;

        if (search) {
            records =
                staff.filter((member) => {
                    const name =
                        getStaffName(member)
                            .toLowerCase();

                    const email =
                        String(
                            member.email || ""
                        ).toLowerCase();

                    const phone =
                        String(
                            member.phone ||
                            member.phone_number ||
                            ""
                        ).toLowerCase();

                    const staffId =
                        String(
                            member.staff_id ||
                            member.employee_id ||
                            ""
                        ).toLowerCase();

                    const department =
                        String(
                            member.department_name ||
                            member.department ||
                            ""
                        ).toLowerCase();

                    return (
                        name.includes(search) ||
                        email.includes(search) ||
                        phone.includes(search) ||
                        staffId.includes(search) ||
                        department.includes(search)
                    );
                });
        }

        if (!records.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="10">
                        <div class="students-empty">
                            <div class="students-empty-icon">
                                S
                            </div>

                            <h3>No staff found</h3>

                            <p>
                                There are no staff records to display.
                            </p>
                        </div>
                    </td>
                </tr>
            `;

            return;
        }

        container.innerHTML =
            records
                .map(renderStaffRow)
                .join("");
    }

    function renderStaffRow(member) {
        const id =
            member.id ??
            member.staff_id ??
            "";

        const name =
            getStaffName(member);

        const role =
            member.role ||
            member.position ||
            member.job_title ||
            "-";

        const department =
            member.department_name ||
            member.department ||
            "-";

        const status =
            member.status ||
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
                    ${escapeHtml(
                        member.staff_id ||
                        member.employee_id ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        member.email ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        member.phone ||
                        member.phone_number ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(department)}
                </td>

                <td>
                    ${escapeHtml(role)}
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
                        member.created_at ||
                        member.createdAt
                    )}
                </td>

                <td>
                    <div class="student-actions">
                        <button
                            type="button"
                            class="student-action-btn"
                            data-action="edit-staff"
                            data-id="${escapeAttribute(id)}"
                            title="Edit"
                        >
                            ✎
                        </button>

                        <button
                            type="button"
                            class="student-action-btn delete"
                            data-action="delete-staff"
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

        if (
            !data.first_name &&
            !data.firstName
        ) {
            notify(
                "Please enter the staff first name.",
                "error"
            );
            return;
        }

        if (
            !data.last_name &&
            !data.lastName
        ) {
            notify(
                "Please enter the staff last name.",
                "error"
            );
            return;
        }

        try {
            if (editingStaffId) {
                await request(
                    `/staff/${encodeURIComponent(
                        editingStaffId
                    )}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(data)
                    }
                );

                notify(
                    "Staff record updated successfully.",
                    "success"
                );
            } else {
                await request(
                    "/staff",
                    {
                        method: "POST",
                        body: JSON.stringify(data)
                    }
                );

                notify(
                    "Staff member added successfully.",
                    "success"
                );
            }

            resetForm();

            await loadStaff();
        } catch (error) {
            console.error(
                "Staff save failed:",
                error
            );

            notify(
                error.message ||
                "Unable to save staff record.",
                "error"
            );
        }
    }

    function editStaff(id) {
        const member =
            staff.find((item) => {
                return String(
                    item.id ??
                    item.staff_id
                ) === String(id);
            });

        if (!member) {
            notify(
                "Staff record could not be found.",
                "error"
            );
            return;
        }

        editingStaffId = id;

        setFormValue(
            "#firstName",
            member.first_name ||
            member.firstName
        );

        setFormValue(
            "#lastName",
            member.last_name ||
            member.lastName
        );

        setFormValue(
            "#middleName",
            member.middle_name ||
            member.middleName
        );

        setFormValue(
            "#email",
            member.email
        );

        setFormValue(
            "#phone",
            member.phone ||
            member.phone_number
        );

        setFormValue(
            "#staffId",
            member.staff_id ||
            member.employee_id
        );

        setFormValue(
            "#gender",
            member.gender
        );

        setFormValue(
            "#dateOfBirth",
            member.date_of_birth ||
            member.dateOfBirth
        );

        setFormValue(
            "#departmentId",
            member.department_id ||
            member.departmentId
        );

        setFormValue(
            "#role",
            member.role ||
            member.position ||
            member.job_title
        );

        setFormValue(
            "#qualification",
            member.qualification
        );

        setFormValue(
            "#employmentDate",
            member.employment_date ||
            member.employmentDate
        );

        setFormValue(
            "#status",
            member.status ||
            "Active"
        );

        setFormValue(
            "#address",
            member.address ||
            member.residential_address
        );

        updateFormMode("Update Staff");

        scrollToForm();
    }

    async function deleteStaff(id) {
        if (
            !window.confirm(
                "Are you sure you want to delete this staff record?"
            )
        ) {
            return;
        }

        try {
            await request(
                `/staff/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            notify(
                "Staff record deleted successfully.",
                "success"
            );

            await loadStaff();
        } catch (error) {
            console.error(
                "Staff deletion failed:",
                error
            );

            notify(
                error.message ||
                "Unable to delete staff record.",
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

        if (action === "edit-staff") {
            editStaff(id);
            return;
        }

        if (action === "delete-staff") {
            await deleteStaff(id);
        }
    }

    function resetForm() {
        editingStaffId = null;

        const form =
            document.querySelector(
                "#staffForm"
            );

        if (form) {
            form.reset();
        }

        updateFormMode("Add Staff");
    }

    function updateFormMode(text) {
        const form =
            document.querySelector(
                "#staffForm"
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
            staff.length;

        const active =
            staff.filter((member) => {
                return String(
                    member.status ||
                    "Active"
                ).toLowerCase() === "active";
            }).length;

        const inactive =
            total - active;

        setSummary(
            [
                "#totalStaff",
                "#total-staff",
                "[data-total-staff]"
            ],
            total
        );

        setSummary(
            [
                "#activeStaff",
                "#active-staff",
                "[data-active-staff]"
            ],
            active
        );

        setSummary(
            [
                "#inactiveStaff",
                "#inactive-staff",
                "[data-inactive-staff]"
            ],
            inactive
        );
    }

    function setSummary(selectors, value) {
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

    function getStaffName(member) {
        return (
            member.full_name ||
            member.fullName ||
            member.name ||
            [
                member.first_name ||
                member.firstName ||
                "",

                member.middle_name ||
                member.middleName ||
                "",

                member.last_name ||
                member.lastName ||
                ""
            ]
                .filter(Boolean)
                .join(" ")
        ) || "Unknown Staff";
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
            .map(
                (word) =>
                    word.charAt(0).toUpperCase()
            )
            .join("");
    }

    function getStatusClass(status) {
        const value =
            String(status).toLowerCase();

        if (value === "active") {
            return "active";
        }

        if (value === "inactive") {
            return "inactive";
        }

        if (value === "suspended") {
            return "warning";
        }

        if (value === "disabled") {
            return "inactive";
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
        ).forEach((checkbox) => {
            data[checkbox.name] =
                checkbox.checked;
        });

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

    function setFormValue(selector, value) {
        const element =
            document.querySelector(
                selector
            );

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

    function scrollToForm() {
        const form =
            document.querySelector(
                "#staffForm"
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
            getStaffTableBody();

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="students-loading">
                        <div class="students-loading-spinner"></div>
                        <p>Loading staff...</p>
                    </div>
                </td>
            </tr>
        `;
    }

    function showError(message) {
        const container =
            getStaffTableBody();

        if (!container) {
            return;
        }

        container.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="students-empty">
                        <h3>Unable to load staff</h3>
                        <p>
                            ${escapeHtml(message)}
                        </p>
                    </div>
                </td>
            </tr>
        `;
    }

    function getStaffTableBody() {
        return (
            document.querySelector("#staffTableBody") ||
            document.querySelector("#staff-table-body") ||
            document.querySelector("tbody[data-staff-body]")
        );
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

        notification.className =
            `alert alert-${type}`;

        notification.textContent =
            message;

        notification.style.marginBottom =
            "10px";

        container.appendChild(
            notification
        );

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    function escapeHtml(value) {
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

    window.StaffPage = {
        initialize,
        loadStaff,
        loadDepartments,
        editStaff,
        deleteStaff,
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
