"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| DEPARTMENTS.JS
|--------------------------------------------------------------------------
*/

(function () {
    const API_BASE = "/api";

    let departments = [];

    const tableBody =
        document.getElementById("departmentsTableBody") ||
        document.getElementById("departmentTableBody") ||
        document.querySelector("#departmentsTable tbody");

    const searchInput =
        document.getElementById("searchInput") ||
        document.getElementById("departmentSearch");

    const statusFilter =
        document.getElementById("statusFilter");

    const messageContainer =
        document.getElementById("message") ||
        document.getElementById("messageContainer");

    /*
    |--------------------------------------------------------------------------
    | API REQUEST
    |--------------------------------------------------------------------------
    */

    async function apiRequest(endpoint, options = {}) {
        const token =
            localStorage.getItem("school_management_token") ||
            sessionStorage.getItem("school_management_token") ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            "";

        let url = endpoint;

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            if (!url.startsWith("/")) {
                url = `/${url}`;
            }

            if (!url.startsWith(`${API_BASE}/`)) {
                url = `${API_BASE}${url}`;
            }
        }

        const headers = {
            Accept: "application/json",
            ...(options.headers || {})
        };

        if (
            options.body &&
            !(options.body instanceof FormData) &&
            !headers["Content-Type"] &&
            !headers["content-type"]
        ) {
            headers["Content-Type"] = "application/json";
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        let response;

        try {
            response = await fetch(url, {
                ...options,
                headers
            });
        } catch (error) {
            console.error("API request failed:", error);
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
                window.location.replace("/pages/login.html");
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
            } else if (typeof data === "string" && data.trim()) {
                message = data;
            }

            throw new Error(message);
        }

        return data;
    }

    /*
    |--------------------------------------------------------------------------
    | MESSAGE
    |--------------------------------------------------------------------------
    */

    function showMessage(text, type = "success") {
        if (!messageContainer) {
            return;
        }

        messageContainer.textContent = text;
        messageContainer.className = `message ${type}`;

        setTimeout(() => {
            messageContainer.textContent = "";
            messageContainer.className = "message";
        }, 4000);
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD DEPARTMENTS
    |--------------------------------------------------------------------------
    */

    async function loadDepartments() {
        try {
            showLoading();

            const result =
                await apiRequest("/departments");

            departments =
                Array.isArray(result?.data)
                    ? result.data
                    : Array.isArray(result?.departments)
                        ? result.departments
                        : Array.isArray(result)
                            ? result
                            : [];

            renderDepartments();
        } catch (error) {
            console.error(
                "Load departments error:",
                error
            );

            showEmpty(
                "Unable to load departments."
            );

            showMessage(
                error.message ||
                "Unable to load departments.",
                "error"
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RENDER DEPARTMENTS
    |--------------------------------------------------------------------------
    */

    function renderDepartments() {
        if (!tableBody) {
            return;
        }

        const searchTerm =
            searchInput?.value
                .trim()
                .toLowerCase() || "";

        const selectedStatus =
            statusFilter?.value
                .trim()
                .toLowerCase() || "";

        const filteredDepartments =
            departments.filter(department => {
                const name =
                    String(
                        department.department_name ||
                        department.departmentName ||
                        department.name ||
                        ""
                    ).toLowerCase();

                const code =
                    String(
                        department.department_code ||
                        department.departmentCode ||
                        department.code ||
                        ""
                    ).toLowerCase();

                const description =
                    String(
                        department.description ||
                        ""
                    ).toLowerCase();

                const status =
                    String(
                        department.status ||
                        "active"
                    ).toLowerCase();

                const matchesSearch =
                    !searchTerm ||
                    name.includes(searchTerm) ||
                    code.includes(searchTerm) ||
                    description.includes(searchTerm);

                const matchesStatus =
                    !selectedStatus ||
                    status === selectedStatus;

                return (
                    matchesSearch &&
                    matchesStatus
                );
            });

        if (!filteredDepartments.length) {
            showEmpty("No departments found.");
            return;
        }

        tableBody.innerHTML =
            filteredDepartments
                .map(createDepartmentRow)
                .join("");
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE ROW
    |--------------------------------------------------------------------------
    */

    function createDepartmentRow(department) {
        const id =
            department.id;

        const name =
            department.department_name ||
            department.departmentName ||
            department.name ||
            "-";

        const code =
            department.department_code ||
            department.departmentCode ||
            department.code ||
            "-";

        const description =
            department.description ||
            "-";

        const status =
            String(
                department.status ||
                "active"
            ).toLowerCase();

        const createdAt =
            department.created_at ||
            department.createdAt;

        return `
            <tr>
                <td>
                    ${escapeHtml(name)}
                </td>

                <td>
                    ${escapeHtml(code)}
                </td>

                <td>
                    ${escapeHtml(description)}
                </td>

                <td>
                    <span class="status-badge status-${escapeHtml(status)}">
                        ${escapeHtml(formatStatus(status))}
                    </span>
                </td>

                <td>
                    ${escapeHtml(formatDate(createdAt))}
                </td>

                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="btn btn-sm btn-primary"
                            onclick="editDepartment('${escapeJs(id)}')"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-danger"
                            onclick="deleteDepartment('${escapeJs(id)}')"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | ADD
    |--------------------------------------------------------------------------
    */

    function addDepartment() {
        window.location.href =
            "department-form.html";
    }

    /*
    |--------------------------------------------------------------------------
    | EDIT
    |--------------------------------------------------------------------------
    */

    function editDepartment(id) {
        window.location.href =
            `department-form.html?id=${encodeURIComponent(id)}`;
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    async function deleteDepartment(id) {
        const department =
            departments.find(
                item =>
                    String(item.id) === String(id)
            );

        const departmentName =
            department
                ? (
                    department.department_name ||
                    department.departmentName ||
                    department.name ||
                    "this department"
                )
                : "this department";

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${departmentName}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            await apiRequest(
                `/departments/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            showMessage(
                "Department deleted successfully.",
                "success"
            );

            await loadDepartments();
        } catch (error) {
            console.error(
                "Delete department error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to delete department.",
                "error"
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW
    |--------------------------------------------------------------------------
    */

    function viewDepartment(id) {
        window.location.href =
            `department-profile.html?id=${encodeURIComponent(id)}`;
    }

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    function showLoading() {
        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center; padding:30px;"
                >
                    Loading departments...
                </td>
            </tr>
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY
    |--------------------------------------------------------------------------
    */

    function showEmpty(text) {
        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center; padding:30px;"
                >
                    ${escapeHtml(text)}
                </td>
            </tr>
        `;
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    function formatStatus(status) {
        const normalized =
            String(status || "active")
                .toLowerCase();

        const labels = {
            active: "Active",
            inactive: "Inactive",
            archived: "Archived"
        };

        return (
            labels[normalized] ||
            normalized
                .replace(/_/g, " ")
                .replace(/\b\w/g, letter =>
                    letter.toUpperCase()
                )
        );
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

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString(
            "en-NG",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ESCAPE HTML
    |--------------------------------------------------------------------------
    */

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /*
    |--------------------------------------------------------------------------
    | ESCAPE JAVASCRIPT
    |--------------------------------------------------------------------------
    */

    function escapeJs(value) {
        return String(value ?? "")
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'");
    }

    /*
    |--------------------------------------------------------------------------
    | EVENTS
    |--------------------------------------------------------------------------
    */

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderDepartments
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            renderDepartments
        );
    }

    /*
    |--------------------------------------------------------------------------
    | GLOBAL FUNCTIONS
    |--------------------------------------------------------------------------
    */

    window.loadDepartments =
        loadDepartments;

    window.addDepartment =
        addDepartment;

    window.editDepartment =
        editDepartment;

    window.deleteDepartment =
        deleteDepartment;

    window.viewDepartment =
        viewDepartment;

    /*
    |--------------------------------------------------------------------------
    | INITIALIZE
    |--------------------------------------------------------------------------
    */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            loadDepartments,
            { once: true }
        );
    } else {
        loadDepartments();
    }
})();