"use strict";

(function () {
const API_BASE = "/api";
const SUBJECTS_API = "/api/subjects";

```
let editingSubjectId = null;

const subjectForm = document.getElementById("subjectForm");
const subjectNameInput = document.getElementById("subjectName");
const subjectCodeInput = document.getElementById("subjectCode");
const isCompulsoryInput = document.getElementById("isCompulsory");
const isActiveInput = document.getElementById("isActive");
const descriptionInput = document.getElementById("description");

const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");

const messageBox = document.getElementById("message");
const loadingBox = document.getElementById("loading");

const pageTitle = document.getElementById("pageTitle");
const modeBadge = document.getElementById("modeBadge");

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const logoutButton = document.getElementById("logoutButton");
const userNameElement = document.getElementById("userName");

function getToken() {
    return (
        localStorage.getItem("school_management_token") ||
        sessionStorage.getItem("school_management_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken") ||
        null
    );
}

function getStoredUser() {
    const possibleKeys = [
        "school_management_user",
        "user",
        "currentUser",
        "schoolUser"
    ];

    for (const key of possibleKeys) {
        const localValue = localStorage.getItem(key);
        const sessionValue = sessionStorage.getItem(key);
        const value = localValue || sessionValue;

        if (!value) {
            continue;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            return {
                name: value
            };
        }
    }

    return null;
}

function getHeaders() {
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

async function apiRequest(url, options = {}) {
    const requestOptions = {
        ...options,
        headers: {
            ...getHeaders(),
            ...(options.headers || {})
        }
    };

    let response;

    try {
        response = await fetch(`${API_BASE}${url}`, requestOptions);
    } catch (error) {
        const networkError = new Error(
            "Unable to connect to the server. Please check that the school management server is running."
        );

        networkError.status = 0;
        networkError.originalError = error;

        throw networkError;
    }

    let data = null;

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }
    } else {
        try {
            const text = await response.text();

            data = text
                ? {
                      message: text
                  }
                : null;
        } catch (error) {
            data = null;
        }
    }

    if (response.status === 401) {
        clearAuthentication();

        const error = new Error(
            data?.message ||
            "Your session has expired. Please log in again."
        );

        error.status = 401;
        error.data = data;

        throw error;
    }

    if (response.status === 403) {
        const error = new Error(
            data?.message ||
            "You do not have permission to manage subjects."
        );

        error.status = 403;
        error.data = data;

        throw error;
    }

    if (!response.ok) {
        const error = new Error(
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}.`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}

function clearAuthentication() {
    const keys = [
        "school_management_token",
        "school_management_user",
        "token",
        "accessToken",
        "authToken",
        "user",
        "currentUser",
        "schoolUser"
    ];

    keys.forEach(function (key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

function getDataObject(result) {
    if (!result || typeof result !== "object") {
        return null;
    }

    if (result.data && typeof result.data === "object") {
        if (!Array.isArray(result.data)) {
            return result.data;
        }
    }

    if (result.subject && typeof result.subject === "object") {
        return result.subject;
    }

    return result;
}

function getSubjectIdFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return (
        params.get("id") ||
        params.get("subjectId") ||
        null
    );
}

function getSubjectId(subject) {
    if (!subject || typeof subject !== "object") {
        return null;
    }

    return (
        subject.id ??
        subject.subject_id ??
        subject.subjectId ??
        null
    );
}

function getSubjectName(subject) {
    if (!subject || typeof subject !== "object") {
        return "";
    }

    return (
        subject.subject_name ??
        subject.subjectName ??
        subject.name ??
        ""
    );
}

function getSubjectCode(subject) {
    if (!subject || typeof subject !== "object") {
        return "";
    }

    return (
        subject.subject_code ??
        subject.subjectCode ??
        subject.code ??
        ""
    );
}

function getDescription(subject) {
    if (!subject || typeof subject !== "object") {
        return "";
    }

    return subject.description ?? "";
}

function getIsCompulsory(subject) {
    if (!subject || typeof subject !== "object") {
        return false;
    }

    if (
        subject.is_compulsory !== undefined &&
        subject.is_compulsory !== null
    ) {
        return normalizeBoolean(subject.is_compulsory);
    }

    if (
        subject.isCompulsory !== undefined &&
        subject.isCompulsory !== null
    ) {
        return normalizeBoolean(subject.isCompulsory);
    }

    if (
        subject.compulsory !== undefined &&
        subject.compulsory !== null
    ) {
        return normalizeBoolean(subject.compulsory);
    }

    return false;
}

function getIsActive(subject) {
    if (!subject || typeof subject !== "object") {
        return true;
    }

    if (
        subject.is_active !== undefined &&
        subject.is_active !== null
    ) {
        return normalizeBoolean(subject.is_active);
    }

    if (
        subject.isActive !== undefined &&
        subject.isActive !== null
    ) {
        return normalizeBoolean(subject.isActive);
    }

    if (
        subject.status !== undefined &&
        subject.status !== null
    ) {
        return String(subject.status).toLowerCase() === "active";
    }

    return true;
}

function normalizeBoolean(value) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (
            normalized === "true" ||
            normalized === "1" ||
            normalized === "yes" ||
            normalized === "active" ||
            normalized === "on"
        ) {
            return true;
        }

        if (
            normalized === "false" ||
            normalized === "0" ||
            normalized === "no" ||
            normalized === "inactive" ||
            normalized === "off" ||
            normalized === ""
        ) {
            return false;
        }
    }

    return Boolean(value);
}

function showMessage(message, type = "error") {
    if (!messageBox) {
        return;
    }

    messageBox.textContent = message || "";

    if (type === "success") {
        messageBox.className = "alert alert-success mb-4";
    } else if (type === "warning") {
        messageBox.className = "alert alert-warning mb-4";
    } else {
        messageBox.className = "alert alert-danger mb-4";
    }

    messageBox.style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function clearMessage() {
    if (!messageBox) {
        return;
    }

    messageBox.textContent = "";
    messageBox.className = "alert mb-4";
    messageBox.style.display = "none";
}

function setLoading(loading, message) {
    if (submitButton) {
        submitButton.disabled = loading;

        if (loading) {
            submitButton.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                ></span>
                ${editingSubjectId ? "Updating..." : "Saving..."}
            `;
        } else {
            submitButton.innerHTML = `
                <i class="bi bi-check-circle me-1"></i>
                ${editingSubjectId ? "Update Subject" : "Save Subject"}
            `;
        }
    }

    if (cancelButton) {
        cancelButton.disabled = loading;
    }

    if (loadingBox) {
        loadingBox.style.display = loading ? "block" : "none";

        if (message) {
            loadingBox.innerHTML = `
                <div
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                ></div>
                ${message}
            `;
        } else {
            loadingBox.innerHTML = `
                <div
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                ></div>
                ${editingSubjectId ? "Updating subject..." : "Saving subject..."}
            `;
        }
    }
}

function setEditMode() {
    if (pageTitle) {
        pageTitle.textContent = "Edit Subject";
    }

    if (modeBadge) {
        modeBadge.style.display = "inline-block";
    }

    if (submitButton) {
        submitButton.innerHTML = `
            <i class="bi bi-check-circle me-1"></i>
            Update Subject
        `;
    }

    document.title = "Edit Subject | School Management System";
}

function setCreateMode() {
    if (pageTitle) {
        pageTitle.textContent = "Add Subject";
    }

    if (modeBadge) {
        modeBadge.style.display = "none";
    }

    if (submitButton) {
        submitButton.innerHTML = `
            <i class="bi bi-check-circle me-1"></i>
            Save Subject
        `;
    }

    document.title = "Subject Form | School Management System";
}

function populateForm(subject) {
    if (!subject) {
        throw new Error("Subject data was not returned.");
    }

    if (subjectNameInput) {
        subjectNameInput.value = getSubjectName(subject);
    }

    if (subjectCodeInput) {
        subjectCodeInput.value = getSubjectCode(subject);
    }

    if (isCompulsoryInput) {
        isCompulsoryInput.checked = getIsCompulsory(subject);
    }

    if (isActiveInput) {
        isActiveInput.value = getIsActive(subject)
            ? "true"
            : "false";
    }

    if (descriptionInput) {
        descriptionInput.value = getDescription(subject);
    }

    setEditMode();
}

async function loadSubject(subjectId) {
    try {
        setLoading(true, "Loading subject...");

        const result = await apiRequest(
            `/subjects/${encodeURIComponent(subjectId)}`
        );

        const subject = getDataObject(result);

        if (!subject) {
            throw new Error(
                "Subject information could not be loaded."
            );
        }

        populateForm(subject);
    } catch (error) {
        console.error("Load subject error:", error);

        if (error.status === 401) {
            showMessage(
                "Your session has expired. Please log in again."
            );
            return;
        }

        if (error.status === 403) {
            showMessage(
                "You do not have permission to view this subject."
            );
            return;
        }

        showMessage(
            error.message ||
            "Unable to load subject information."
        );
    } finally {
        setLoading(false);
    }
}

function validateForm() {
    clearMessage();

    const subjectName = subjectNameInput
        ? subjectNameInput.value.trim()
        : "";

    const subjectCode = subjectCodeInput
        ? subjectCodeInput.value.trim()
        : "";

    const description = descriptionInput
        ? descriptionInput.value.trim()
        : "";

    if (!subjectName) {
        showMessage("Subject name is required.");

        if (subjectNameInput) {
            subjectNameInput.focus();
        }

        return false;
    }

    if (subjectName.length > 150) {
        showMessage(
            "Subject name cannot exceed 150 characters."
        );

        subjectNameInput.focus();

        return false;
    }

    if (subjectCode.length > 50) {
        showMessage(
            "Subject code cannot exceed 50 characters."
        );

        subjectCodeInput.focus();

        return false;
    }

    if (description.length > 1000) {
        showMessage(
            "Description cannot exceed 1000 characters."
        );

        descriptionInput.focus();

        return false;
    }

    return true;
}

function buildPayload() {
    return {
        subjectName: subjectNameInput
            ? subjectNameInput.value.trim()
            : "",

        subjectCode: subjectCodeInput
            ? subjectCodeInput.value.trim() || null
            : null,

        description: descriptionInput
            ? descriptionInput.value.trim() || null
            : null,

        isCompulsory: isCompulsoryInput
            ? Boolean(isCompulsoryInput.checked)
            : false,

        isActive: isActiveInput
            ? isActiveInput.value === "true"
            : true
    };
}

async function saveSubject(event) {
    if (event) {
        event.preventDefault();
    }

    if (!validateForm()) {
        return;
    }

    const payload = buildPayload();

    try {
        setLoading(
            true,
            editingSubjectId
                ? "Updating subject..."
                : "Saving subject..."
        );

        let result;

        if (editingSubjectId) {
            result = await apiRequest(
                `/subjects/${encodeURIComponent(editingSubjectId)}`,
                {
                    method: "PUT",
                    body: JSON.stringify(payload)
                }
            );
        } else {
            result = await apiRequest(
                "/subjects",
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );
        }

        const successMessage =
            result?.message ||
            (
                editingSubjectId
                    ? "Subject updated successfully."
                    : "Subject created successfully."
            );

        showMessage(successMessage, "success");

        setTimeout(function () {
            window.location.href = "subjects.html";
        }, 900);
    } catch (error) {
        console.error("Save subject error:", error);

        if (error.status === 401) {
            showMessage(
                "Your session has expired. Please log in again."
            );
            return;
        }

        if (error.status === 403) {
            showMessage(
                "You do not have permission to manage subjects."
            );
            return;
        }

        if (error.status === 409) {
            showMessage(
                error.message ||
                "A subject with the same code or name already exists."
            );
            return;
        }

        showMessage(
            error.message ||
            "Unable to save subject."
        );
    } finally {
        setLoading(false);
    }
}

function cancelForm() {
    window.location.href = "subjects.html";
}

function closeSidebar() {
    if (sidebar) {
        sidebar.classList.remove("show");
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("show");
    }
}

function toggleSidebar() {
    if (!sidebar || !sidebarOverlay) {
        return;
    }

    sidebar.classList.toggle("show");
    sidebarOverlay.classList.toggle("show");
}

function displayUserName() {
    if (!userNameElement) {
        return;
    }

    const user = getStoredUser();

    if (!user) {
        return;
    }

    const name =
        user.name ||
        user.fullName ||
        user.full_name ||
        user.username ||
        user.email ||
        user.userName ||
        user.user_name;

    if (name) {
        userNameElement.textContent = name;
    }
}

function logout() {
    clearAuthentication();

    window.location.href = "/pages/login.html";
}

function initializeSidebar() {
    if (sidebarToggle) {
        sidebarToggle.addEventListener(
            "click",
            toggleSidebar
        );
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );
    }

    document
        .querySelectorAll(".sidebar a")
        .forEach(function (link) {
            link.addEventListener(
                "click",
                closeSidebar
            );
        });
}

function initializeForm() {
    if (!subjectForm) {
        return;
    }

    subjectForm.addEventListener(
        "submit",
        saveSubject
    );

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            cancelForm
        );
    }
}

async function initialize() {
    displayUserName();
    initializeSidebar();
    initializeForm();

    editingSubjectId =
        getSubjectIdFromUrl();

    if (editingSubjectId) {
        setEditMode();
        await loadSubject(editingSubjectId);
    } else {
        setCreateMode();
    }
}

if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        logout
    );
}

document.addEventListener(
    "DOMContentLoaded",
    async function () {
        if (typeof protectPage === "function") {
            try {
                await protectPage();
            } catch (error) {
                console.error(
                    "Page protection error:",
                    error
                );
            }
        }

        await initialize();
    }
);

window.SubjectFormPage = {
    initialize,
    loadSubject,
    saveSubject,
    cancelForm
};
```

})();
