"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| CLASS ARMS PAGE
|--------------------------------------------------------------------------
*/

const API_BASE = "/api";

let classArms = [];
let classes = [];
let teachers = [];

const tableBody =
    document.getElementById("classArmsTableBody") ||
    document.getElementById("classArmTableBody") ||
    document.querySelector("#classArmsTable tbody");

const searchInput = document.getElementById("searchInput");
const classFilter = document.getElementById("classFilter");
const statusFilter = document.getElementById("statusFilter");
const messageContainer = document.getElementById("message");

/*
|--------------------------------------------------------------------------
| API
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

    let url = endpoint;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        if (!url.startsWith("/")) {
            url = `/${url}`;
        }

        if (!url.startsWith(`${API_BASE}/`)) {
            url = `${API_BASE}${url}`;
        }
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
| Helpers
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

function showLoading() {
    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center; padding:30px;">
                Loading class arms...
            </td>
        </tr>
    `;
}

function showEmpty(text) {
    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center; padding:30px;">
                ${escapeHtml(text)}
            </td>
        </tr>
    `;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJs(value) {
    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}

function getClassName(classId) {
    if (!classId) {
        return "";
    }

    const schoolClass = classes.find(
        item => String(item.id) === String(classId)
    );

    if (!schoolClass) {
        return "";
    }

    return (
        schoolClass.class_name ||
        schoolClass.className ||
        schoolClass.name ||
        ""
    );
}

function getTeacherName(teacherId) {
    if (!teacherId) {
        return "";
    }

    const teacher = teachers.find(
        item => String(item.id) === String(teacherId)
    );

    if (!teacher) {
        return "";
    }

    const firstName =
        teacher.first_name ||
        teacher.firstName ||
        "";

    const lastName =
        teacher.last_name ||
        teacher.lastName ||
        "";

    return (
        `${firstName} ${lastName}`.trim() ||
        teacher.staff_name ||
        teacher.staffName ||
        teacher.name ||
        ""
    );
}

function formatStatus(status) {
    const normalized = String(status || "active").toLowerCase();

    const labels = {
        active: "Active",
        inactive: "Inactive",
        archived: "Archived"
    };

    return (
        labels[normalized] ||
        normalized
            .replace(/_/g, " ")
            .replace(/\b\w/g, letter => letter.toUpperCase())
    );
}

/*
|--------------------------------------------------------------------------
| Load Classes
|--------------------------------------------------------------------------
*/

async function loadClasses() {
    try {
        const result = await apiRequest("/classes");

        classes =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.classes)
                    ? result.classes
                    : Array.isArray(result)
                        ? result
                        : [];

        populateClassFilter();
    } catch (error) {
        console.error("Load classes error:", error);
    }
}

function populateClassFilter() {
    if (!classFilter) {
        return;
    }

    classFilter.innerHTML = `
        <option value="">All Classes</option>
    `;

    classes.forEach(schoolClass => {
        const option = document.createElement("option");

        option.value = schoolClass.id;

        option.textContent =
            schoolClass.class_name ||
            schoolClass.className ||
            schoolClass.name ||
            `Class ${schoolClass.id}`;

        classFilter.appendChild(option);
    });
}

/*
|--------------------------------------------------------------------------
| Load Teachers
|--------------------------------------------------------------------------
*/

async function loadTeachers() {
    try {
        const result = await apiRequest("/staff");

        teachers =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.staff)
                    ? result.staff
                    : Array.isArray(result)
                        ? result
                        : [];
    } catch (error) {
        console.error("Load teachers error:", error);
    }
}

/*
|--------------------------------------------------------------------------
| Load Class Arms
|--------------------------------------------------------------------------
*/

async function loadClassArms() {
    try {
        showLoading();

        const result = await apiRequest("/class-arms");

        classArms =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.classArms)
                    ? result.classArms
                    : Array.isArray(result)
                        ? result
                        : [];

        renderClassArms();
    } catch (error) {
        console.error("Load class arms error:", error);

        showMessage(
            error.message || "Unable to load class arms.",
            "error"
        );

        showEmpty("Unable to load class arms.");
    }
}

/*
|--------------------------------------------------------------------------
| Render
|--------------------------------------------------------------------------
*/

function renderClassArms() {
    if (!tableBody) {
        return;
    }

    const searchTerm =
        searchInput?.value.trim().toLowerCase() || "";

    const selectedClass =
        classFilter?.value || "";

    const selectedStatus =
        statusFilter?.value.toLowerCase() || "";

    const filtered = classArms.filter(arm => {
        const armName = String(
            arm.arm_name ||
            arm.armName ||
            ""
        ).toLowerCase();

        const armCode = String(
            arm.arm_code ||
            arm.armCode ||
            ""
        ).toLowerCase();

        const className = String(
            arm.class_name ||
            arm.className ||
            getClassName(
                arm.class_id ||
                arm.classId
            ) ||
            ""
        ).toLowerCase();

        const status = String(
            arm.status || "active"
        ).toLowerCase();

        const matchesSearch =
            !searchTerm ||
            armName.includes(searchTerm) ||
            armCode.includes(searchTerm) ||
            className.includes(searchTerm);

        const matchesClass =
            !selectedClass ||
            String(
                arm.class_id ||
                arm.classId ||
                ""
            ) === String(selectedClass);

        const matchesStatus =
            !selectedStatus ||
            status === selectedStatus;

        return (
            matchesSearch &&
            matchesClass &&
            matchesStatus
        );
    });

    if (filtered.length === 0) {
        showEmpty("No class arms found.");
        return;
    }

    tableBody.innerHTML = filtered
        .map(createRow)
        .join("");
}

/*
|--------------------------------------------------------------------------
| Create Row
|--------------------------------------------------------------------------
*/

function createRow(arm) {
    const id = arm.id;

    const className =
        arm.class_name ||
        arm.className ||
        getClassName(
            arm.class_id ||
            arm.classId
        ) ||
        "-";

    const armName =
        arm.arm_name ||
        arm.armName ||
        "-";

    const armCode =
        arm.arm_code ||
        arm.armCode ||
        "-";

    const capacity =
        arm.capacity ?? "-";

    const teacher =
        getTeacherName(
            arm.class_teacher_id ||
            arm.classTeacherId ||
            arm.teacher_id ||
            arm.teacherId
        ) ||
        arm.teacher_name ||
        arm.teacherName ||
        "-";

    const status =
        String(
            arm.status || "active"
        ).toLowerCase();

    return `
        <tr>
            <td>${escapeHtml(className)}</td>
            <td>${escapeHtml(armName)}</td>
            <td>${escapeHtml(armCode)}</td>
            <td>${escapeHtml(capacity)}</td>
            <td>${escapeHtml(teacher)}</td>
            <td>
                <span class="status-badge status-${escapeHtml(status)}">
                    ${escapeHtml(formatStatus(status))}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button
                        type="button"
                        class="btn btn-sm btn-primary"
                        onclick="editClassArm('${escapeJs(id)}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        onclick="deleteClassArm('${escapeJs(id)}')"
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
| Navigation
|--------------------------------------------------------------------------
*/

function addClassArm() {
    window.location.href = "class-arm-form.html";
}

function editClassArm(id) {
    window.location.href =
        `class-arm-form.html?id=${encodeURIComponent(id)}`;
}

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

async function deleteClassArm(id) {
    const arm = classArms.find(
        item => String(item.id) === String(id)
    );

    const armName =
        arm?.arm_name ||
        arm?.armName ||
        "this class arm";

    const confirmed = window.confirm(
        `Are you sure you want to delete "${armName}"?`
    );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(
            `/class-arms/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        showMessage(
            "Class arm deleted successfully.",
            "success"
        );

        await loadClassArms();
    } catch (error) {
        console.error(
            "Delete class arm error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to delete class arm.",
            "error"
        );
    }
}

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

if (searchInput) {
    searchInput.addEventListener(
        "input",
        renderClassArms
    );
}

if (classFilter) {
    classFilter.addEventListener(
        "change",
        renderClassArms
    );
}

if (statusFilter) {
    statusFilter.addEventListener(
        "change",
        renderClassArms
    );
}

/*
|--------------------------------------------------------------------------
| Global Functions
|--------------------------------------------------------------------------
*/

window.loadClassArms = loadClassArms;
window.addClassArm = addClassArm;
window.editClassArm = editClassArm;
window.deleteClassArm = deleteClassArm;

/*
|--------------------------------------------------------------------------
| Initialisation
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    async function () {
        await Promise.all([
            loadClasses(),
            loadTeachers()
        ]);

        await loadClassArms();
    }
);