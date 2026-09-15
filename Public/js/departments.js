"use strict";

| /*                                                                         |
| -------------------------------------------------------------------------- |
| SCHOOL MANAGEMENT SYSTEM                                                   |
| DEPARTMENTS.JS                                                             |
| -------------------------------------------------------------------------- |
|                                                                            |
| Department management frontend.                                            |
|                                                                            |
| API:                                                                       |
| GET    /api/departments                                                    |
| GET    /api/departments/search                                             |
| POST   /api/departments                                                    |
| PUT    /api/departments/:id                                                |
| DELETE /api/departments/:id                                                |
|                                                                            |
| */                                                                         |

(function () {

```
const API_BASE = "/api";
const DEPARTMENTS_API = `${API_BASE}/departments`;

let departments = [];
let departmentModal = null;
let editingDepartmentId = null;

/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
|--------------------------------------------------------------------------
*/

const table = document.getElementById("departmentsTable");
const tableBody = document.getElementById("departmentsTableBody");

const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

const alertMessage = document.getElementById("alertMessage");

const totalDepartments = document.getElementById("totalDepartments");
const activeDepartments = document.getElementById("activeDepartments");
const inactiveDepartments = document.getElementById("inactiveDepartments");

const addDepartmentBtn = document.getElementById("addDepartmentBtn");

const departmentModalElement = document.getElementById("departmentModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");

const departmentForm = document.getElementById("departmentForm");
const modalTitle = document.getElementById("modalTitle");

const departmentName = document.getElementById("departmentName");
const departmentCode = document.getElementById("departmentCode");
const description = document.getElementById("description");
const departmentStatus = document.getElementById("departmentStatus");

const saveDepartmentBtn = document.getElementById("saveDepartmentBtn");

/*
|--------------------------------------------------------------------------
| TOKEN
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| API REQUEST
|--------------------------------------------------------------------------
*/

async function apiRequest(endpoint, options = {}) {

    let url = endpoint;

    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {

        if (!url.startsWith("/")) {
            url = `/${url}`;
        }

        if (!url.startsWith(`${API_BASE}/`)) {
            url = `${API_BASE}${url}`;
        }
    }

    const token = getToken();

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

        console.error("Department API request failed:", error);

        throw new Error(
            "Unable to connect to the server. Please check your connection."
        );
    }

    if (response.status === 401) {

        clearAuthentication();

        throw new Error(
            "Your session has expired. Please log in again."
        );
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
                data.details ||
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

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

function clearAuthentication() {

    localStorage.removeItem("school_management_token");
    localStorage.removeItem("school_management_user");

    sessionStorage.removeItem("school_management_token");
    sessionStorage.removeItem("school_management_user");
}

/*
|--------------------------------------------------------------------------
| RESPONSE ARRAY
|--------------------------------------------------------------------------
*/

function extractDepartments(result) {

    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result?.data)) {
        return result.data;
    }

    if (Array.isArray(result?.departments)) {
        return result.departments;
    }

    if (Array.isArray(result?.data?.departments)) {
        return result.data.departments;
    }

    return [];
}

/*
|--------------------------------------------------------------------------
| DEPARTMENT VALUES
|--------------------------------------------------------------------------
*/

function getDepartmentId(department) {

    return (
        department?.id ??
        department?.departmentId ??
        department?.department_id ??
        ""
    );
}

function getDepartmentName(department) {

    return (
        department?.departmentName ??
        department?.department_name ??
        department?.name ??
        ""
    );
}

function getDepartmentCode(department) {

    return (
        department?.departmentCode ??
        department?.department_code ??
        department?.code ??
        ""
    );
}

function getDepartmentDescription(department) {

    return department?.description ?? "";
}

function getDepartmentIsActive(department) {

    if (typeof department?.isActive === "boolean") {
        return department.isActive;
    }

    if (typeof department?.is_active === "boolean") {
        return department.is_active;
    }

    if (typeof department?.status === "string") {

        return department.status.toLowerCase() === "active";
    }

    if (typeof department?.status === "boolean") {
        return department.status;
    }

    return true;
}

function getCreatedAt(department) {

    return (
        department?.createdAt ??
        department?.created_at ??
        null
    );
}

/*
|--------------------------------------------------------------------------
| MESSAGE
|--------------------------------------------------------------------------
*/

function showMessage(message, type = "success") {

    if (!alertMessage) {
        return;
    }

    alertMessage.textContent = message;

    alertMessage.className = "alert";

    if (type === "success") {
        alertMessage.classList.add("alert-success");
    } else if (type === "warning") {
        alertMessage.classList.add("alert-warning");
    } else {
        alertMessage.classList.add("alert-danger");
    }

    alertMessage.classList.remove("d-none");

    window.clearTimeout(showMessage.timeout);

    showMessage.timeout = window.setTimeout(() => {

        alertMessage.classList.add("d-none");

    }, 4500);
}

/*
|--------------------------------------------------------------------------
| HTML ESCAPING
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
| DATE FORMAT
|--------------------------------------------------------------------------
*/

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function formatStatus(isActive) {

    return isActive ? "Active" : "Inactive";
}

function getStatusClass(isActive) {

    return isActive
        ? "status-active"
        : "status-inactive";
}

/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
*/

function updateStatistics() {

    const total = departments.length;

    const active = departments.filter(
        department => getDepartmentIsActive(department)
    ).length;

    const inactive = total - active;

    if (totalDepartments) {
        totalDepartments.textContent = total;
    }

    if (activeDepartments) {
        activeDepartments.textContent = active;
    }

    if (inactiveDepartments) {
        inactiveDepartments.textContent = inactive;
    }
}

/*
|--------------------------------------------------------------------------
| LOADING STATE
|--------------------------------------------------------------------------
*/

function showLoading() {

    if (loadingState) {
        loadingState.style.display = "block";
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (table) {
        table.style.display = "none";
    }
}

function hideLoading() {

    if (loadingState) {
        loadingState.style.display = "none";
    }
}

/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

function showEmptyState(message = "No Departments Found") {

    hideLoading();

    if (table) {
        table.style.display = "none";
    }

    if (emptyState) {

        const heading =
            emptyState.querySelector("h3");

        const paragraph =
            emptyState.querySelector("p");

        if (heading) {
            heading.textContent = message;
        }

        if (paragraph) {

            paragraph.textContent =
                message === "No Departments Found"
                    ? "Create a department to get started."
                    : "Try changing your search or filter.";
        }

        emptyState.style.display = "block";
    }
}

/*
|--------------------------------------------------------------------------
| TABLE STATE
|--------------------------------------------------------------------------
*/

function showTable() {

    hideLoading();

    if (emptyState) {
        emptyState.style.display = "none";
    }

    if (table) {
        table.style.display = "table";
    }
}

/*
|--------------------------------------------------------------------------
| CREATE TABLE ROW
|--------------------------------------------------------------------------
*/

function createDepartmentRow(department) {

    const id = getDepartmentId(department);
    const name = getDepartmentName(department);
    const code = getDepartmentCode(department);
    const departmentDescription =
        getDepartmentDescription(department);

    const isActive =
        getDepartmentIsActive(department);

    const createdAt =
        getCreatedAt(department);

    return `
        <tr data-department-id="${escapeHtml(id)}">

            <td>
                <div class="department-name">
                    ${escapeHtml(name || "-")}
                </div>
            </td>

            <td>
                <span class="department-code">
                    ${escapeHtml(code || "-")}
                </span>
            </td>

            <td>
                <div class="department-description">
                    ${escapeHtml(departmentDescription || "-")}
                </div>
            </td>

            <td>
                <span class="status ${getStatusClass(isActive)}">
                    ${formatStatus(isActive)}
                </span>
            </td>

            <td>
                <div class="actions">

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        data-action="edit"
                        data-id="${escapeHtml(id)}"
                        title="Edit department"
                    >
                        <i class="bi bi-pencil me-1"></i>
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        data-action="delete"
                        data-id="${escapeHtml(id)}"
                        title="Delete department"
                    >
                        <i class="bi bi-trash me-1"></i>
                        Delete
                    </button>

                </div>
            </td>

        </tr>
    `;
}

/*
|--------------------------------------------------------------------------
| FILTER DEPARTMENTS
|--------------------------------------------------------------------------
*/

function getFilteredDepartments() {

    const searchTerm =
        searchInput?.value
            ?.trim()
            .toLowerCase() || "";

    const selectedStatus =
        statusFilter?.value
            ?.trim()
            .toLowerCase() || "";

    return departments.filter(department => {

        const name =
            String(getDepartmentName(department))
                .toLowerCase();

        const code =
            String(getDepartmentCode(department))
                .toLowerCase();

        const departmentDescription =
            String(getDepartmentDescription(department))
                .toLowerCase();

        const isActive =
            getDepartmentIsActive(department);

        const status =
            isActive
                ? "active"
                : "inactive";

        const matchesSearch =
            !searchTerm ||
            name.includes(searchTerm) ||
            code.includes(searchTerm) ||
            departmentDescription.includes(searchTerm);

        const matchesStatus =
            !selectedStatus ||
            status === selectedStatus;

        return (
            matchesSearch &&
            matchesStatus
        );
    });
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

    const filteredDepartments =
        getFilteredDepartments();

    if (!filteredDepartments.length) {

        showEmptyState();

        tableBody.innerHTML = "";

        return;
    }

    tableBody.innerHTML =
        filteredDepartments
            .map(createDepartmentRow)
            .join("");

    showTable();

    attachRowActions();
}

/*
|--------------------------------------------------------------------------
| ROW ACTIONS
|--------------------------------------------------------------------------
*/

function attachRowActions() {

    if (!tableBody) {
        return;
    }

    const actionButtons =
        tableBody.querySelectorAll("[data-action]");

    actionButtons.forEach(button => {

        button.addEventListener("click", () => {

            const action =
                button.dataset.action;

            const id =
                button.dataset.id;

            if (!id) {
                return;
            }

            if (action === "edit") {
                editDepartment(id);
            }

            if (action === "delete") {
                deleteDepartment(id);
            }
        });
    });
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
            await apiRequest(DEPARTMENTS_API);

        departments =
            extractDepartments(result);

        updateStatistics();

        renderDepartments();

    } catch (error) {

        console.error(
            "Load departments error:",
            error
        );

        departments = [];

        updateStatistics();

        if (
            error.message ===
            "Your session has expired. Please log in again."
        ) {

            window.location.replace(
                "/pages/login.html"
            );

            return;
        }

        showEmptyState(
            "Unable to Load Departments"
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
| RESET FORM
|--------------------------------------------------------------------------
*/

function resetForm() {

    editingDepartmentId = null;

    if (departmentForm) {
        departmentForm.reset();
    }

    if (departmentStatus) {
        departmentStatus.checked = true;
    }

    if (modalTitle) {

        modalTitle.innerHTML = `
            <i class="bi bi-diagram-3 me-2 text-primary"></i>
            Add Department
        `;
    }

    if (saveDepartmentBtn) {

        saveDepartmentBtn.innerHTML = `
            <i class="bi bi-check-lg me-2"></i>
            Save Department
        `;
    }
}

/*
|--------------------------------------------------------------------------
| OPEN MODAL
|--------------------------------------------------------------------------
*/

function openDepartmentModal() {

    if (!departmentModal) {

        if (departmentModalElement) {

            departmentModal =
                bootstrap.Modal.getOrCreateInstance(
                    departmentModalElement
                );
        }
    }

    if (departmentModal) {
        departmentModal.show();
    }
}

/*
|--------------------------------------------------------------------------
| CLOSE MODAL
|--------------------------------------------------------------------------
*/

function closeDepartmentModal() {

    if (!departmentModal) {

        if (departmentModalElement) {

            departmentModal =
                bootstrap.Modal.getOrCreateInstance(
                    departmentModalElement
                );
        }
    }

    if (departmentModal) {
        departmentModal.hide();
    }
}

/*
|--------------------------------------------------------------------------
| ADD DEPARTMENT
|--------------------------------------------------------------------------
*/

function addDepartment() {

    resetForm();
    openDepartmentModal();
}

/*
|--------------------------------------------------------------------------
| EDIT DEPARTMENT
|--------------------------------------------------------------------------
*/

function editDepartment(id) {

    const department =
        departments.find(
            item =>
                String(getDepartmentId(item)) ===
                String(id)
        );

    if (!department) {

        showMessage(
            "Department could not be found.",
            "error"
        );

        return;
    }

    editingDepartmentId =
        getDepartmentId(department);

    if (departmentName) {

        departmentName.value =
            getDepartmentName(department);
    }

    if (departmentCode) {

        departmentCode.value =
            getDepartmentCode(department);
    }

    if (description) {

        description.value =
            getDepartmentDescription(department);
    }

    if (departmentStatus) {

        departmentStatus.checked =
            getDepartmentIsActive(department);
    }

    if (modalTitle) {

        modalTitle.innerHTML = `
            <i class="bi bi-pencil-square me-2 text-primary"></i>
            Edit Department
        `;
    }

    if (saveDepartmentBtn) {

        saveDepartmentBtn.innerHTML = `
            <i class="bi bi-check-lg me-2"></i>
            Update Department
        `;
    }

    openDepartmentModal();
}

/*
|--------------------------------------------------------------------------
| DELETE DEPARTMENT
|--------------------------------------------------------------------------
*/

async function deleteDepartment(id) {

    const department =
        departments.find(
            item =>
                String(getDepartmentId(item)) ===
                String(id)
        );

    if (!department) {

        showMessage(
            "Department could not be found.",
            "error"
        );

        return;
    }

    const name =
        getDepartmentName(department) ||
        "this department";

    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${name}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        await apiRequest(
            `${DEPARTMENTS_API}/${encodeURIComponent(id)}`,
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
| VALIDATE FORM
|--------------------------------------------------------------------------
*/

function validateForm() {

    if (!departmentName) {
        return false;
    }

    const name =
        departmentName.value.trim();

    if (!name) {

        showMessage(
            "Department name is required.",
            "error"
        );

        departmentName.focus();

        return false;
    }

    if (name.length > 150) {

        showMessage(
            "Department name cannot exceed 150 characters.",
            "error"
        );

        departmentName.focus();

        return false;
    }

    if (
        departmentCode &&
        departmentCode.value.trim().length > 50
    ) {

        showMessage(
            "Department code cannot exceed 50 characters.",
            "error"
        );

        departmentCode.focus();

        return false;
    }

    if (
        description &&
        description.value.trim().length > 1000
    ) {

        showMessage(
            "Description cannot exceed 1000 characters.",
            "error"
        );

        description.focus();

        return false;
    }

    return true;
}

/*
|--------------------------------------------------------------------------
| SAVE DEPARTMENT
|--------------------------------------------------------------------------
*/

async function saveDepartment(event) {

    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const payload = {

        departmentName:
            departmentName
                ? departmentName.value.trim()
                : "",

        departmentCode:
            departmentCode
                ? departmentCode.value.trim()
                : "",

        description:
            description
                ? description.value.trim()
                : "",

        isActive:
            departmentStatus
                ? departmentStatus.checked
                : true
    };

    const isEditing =
        Boolean(editingDepartmentId);

    const endpoint =
        isEditing
            ? `${DEPARTMENTS_API}/${encodeURIComponent(editingDepartmentId)}`
            : DEPARTMENTS_API;

    const method =
        isEditing
            ? "PUT"
            : "POST";

    const originalButtonText =
        saveDepartmentBtn
            ? saveDepartmentBtn.innerHTML
            : "";

    try {

        if (saveDepartmentBtn) {

            saveDepartmentBtn.disabled = true;

            saveDepartmentBtn.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                ></span>
                ${isEditing ? "Updating..." : "Saving..."}
            `;
        }

        await apiRequest(
            endpoint,
            {
                method,
                body: JSON.stringify(payload)
            }
        );

        closeDepartmentModal();

        showMessage(
            isEditing
                ? "Department updated successfully."
                : "Department created successfully.",
            "success"
        );

        resetForm();

        await loadDepartments();

    } catch (error) {

        console.error(
            "Save department error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to save department.",
            "error"
        );

    } finally {

        if (saveDepartmentBtn) {

            saveDepartmentBtn.disabled = false;

            saveDepartmentBtn.innerHTML =
                originalButtonText ||
                `
                    <i class="bi bi-check-lg me-2"></i>
                    Save Department
                `;
        }
    }
}

/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

if (addDepartmentBtn) {

    addDepartmentBtn.addEventListener(
        "click",
        addDepartment
    );
}

if (departmentForm) {

    departmentForm.addEventListener(
        "submit",
        saveDepartment
    );
}

if (closeModalBtn) {

    closeModalBtn.addEventListener(
        "click",
        closeDepartmentModal
    );
}

if (cancelModalBtn) {

    cancelModalBtn.addEventListener(
        "click",
        closeDepartmentModal
    );
}

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

if (departmentModalElement) {

    departmentModalElement.addEventListener(
        "hidden.bs.modal",
        resetForm
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

/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

function initialize() {

    if (
        typeof bootstrap !== "undefined" &&
        departmentModalElement
    ) {

        departmentModal =
            bootstrap.Modal.getOrCreateInstance(
                departmentModalElement
            );
    }

    loadDepartments();
}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initialize,
        { once: true }
    );

} else {

    initialize();
}
```

})();
