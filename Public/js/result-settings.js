"use strict";

(function () {
const API_BASE = "/api";
const RESULT_SETTINGS_API = `${API_BASE}/result-settings`;
const LOGIN_PAGE = "/pages/login.html";

```
let settings = [];
let editingSettingId = null;
let settingModal = null;

function getStoredToken() {
    const storageKeys = [
        "school_management_token",
        "token",
        "authToken",
        "accessToken"
    ];

    for (const key of storageKeys) {
        const localValue = localStorage.getItem(key);

        if (localValue) {
            return localValue;
        }

        const sessionValue = sessionStorage.getItem(key);

        if (sessionValue) {
            return sessionValue;
        }
    }

    return null;
}

function redirectToLogin() {
    window.location.href = LOGIN_PAGE;
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

function normalizeSetting(setting) {
    if (!setting || typeof setting !== "object") {
        return {};
    }

    return {
        id: setting.id || setting.settingId || setting.setting_id || "",
        settingName:
            setting.settingName ||
            setting.setting_name ||
            setting.name ||
            "",
        minimumScore:
            setting.minimumScore ??
            setting.minimum_score ??
            "",
        maximumScore:
            setting.maximumScore ??
            setting.maximum_score ??
            "",
        grade: setting.grade || "",
        remark: setting.remark || "",
        gradePoint:
            setting.gradePoint ??
            setting.grade_point ??
            ""
    };
}

function normalizeArray(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (!payload || typeof payload !== "object") {
        return [];
    }

    if (Array.isArray(payload.data)) {
        return payload.data;
    }

    if (Array.isArray(payload.settings)) {
        return payload.settings;
    }

    if (Array.isArray(payload.resultSettings)) {
        return payload.resultSettings;
    }

    if (Array.isArray(payload.result_settings)) {
        return payload.result_settings;
    }

    if (payload.data && typeof payload.data === "object") {
        if (Array.isArray(payload.data.settings)) {
            return payload.data.settings;
        }

        if (Array.isArray(payload.data.resultSettings)) {
            return payload.data.resultSettings;
        }

        if (Array.isArray(payload.data.result_settings)) {
            return payload.data.result_settings;
        }
    }

    return [];
}

async function apiRequest(url, options = {}) {
    if (
        typeof window.apiRequest === "function" &&
        options.useGlobalApi !== false
    ) {
        const globalOptions = { ...options };
        delete globalOptions.useGlobalApi;

        return window.apiRequest(url, globalOptions);
    }

    const token = getStoredToken();

    const headers = {
        Accept: "application/json",
        ...(options.headers || {})
    };

    if (options.body !== undefined && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    const contentType = response.headers.get("content-type") || "";

    let payload;

    if (contentType.includes("application/json")) {
        payload = await response.json().catch(() => ({}));
    } else {
        const text = await response.text().catch(() => "");
        payload = text ? { message: text } : {};
    }

    if (response.status === 401) {
        redirectToLogin();
        throw new Error("Your session has expired. Please log in again.");
    }

    if (response.status === 403) {
        throw new Error(
            payload.message ||
            payload.error ||
            "You do not have permission to perform this action."
        );
    }

    if (!response.ok) {
        throw new Error(
            payload.message ||
            payload.error ||
            `Request failed with status ${response.status}.`
        );
    }

    return payload;
}

function showMessage(message, type = "success") {
    const container = document.getElementById("messageContainer");

    if (!container) {
        return;
    }

    const alert = document.createElement("div");

    alert.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
    alert.setAttribute("role", "alert");

    alert.innerHTML = `
        ${escapeHtml(message)}
        <button
            type="button"
            class="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
        ></button>
    `;

    container.innerHTML = "";
    container.appendChild(alert);

    window.setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

function getNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

function formatScore(value) {
    const number = getNumber(value);

    if (number === null) {
        return "—";
    }

    if (Number.isInteger(number)) {
        return String(number);
    }

    return number.toFixed(2).replace(/\.?0+$/, "");
}

function formatGradePoint(value) {
    const number = getNumber(value);

    if (number === null) {
        return "—";
    }

    return number.toFixed(2);
}

function getSettingName(setting) {
    return (
        setting.settingName ||
        setting.setting_name ||
        "Unnamed Setting"
    );
}

function getMinimumScore(setting) {
    return getNumber(
        setting.minimumScore ??
        setting.minimum_score
    );
}

function getMaximumScore(setting) {
    return getNumber(
        setting.maximumScore ??
        setting.maximum_score
    );
}

function getGrade(setting) {
    return setting.grade || "—";
}

function getRemark(setting) {
    return setting.remark || "—";
}

function getGradePoint(setting) {
    return getNumber(
        setting.gradePoint ??
        setting.grade_point
    );
}

function renderSettings() {
    const tableBody = document.getElementById("settingsTableBody");

    if (!tableBody) {
        return;
    }

    if (!settings.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="bi bi-award d-block"></i>
                        <div class="fw-semibold mb-1">
                            No grading settings found
                        </div>
                        <div>
                            Add the school's grading scale to begin processing results.
                        </div>
                    </div>
                </td>
            </tr>
        `;

        updateStatistics();
        return;
    }

    tableBody.innerHTML = settings
        .map((rawSetting, index) => {
            const setting = normalizeSetting(rawSetting);

            const minimumScore = getMinimumScore(setting);
            const maximumScore = getMaximumScore(setting);

            const scoreRange =
                minimumScore !== null && maximumScore !== null
                    ? `${formatScore(minimumScore)} - ${formatScore(maximumScore)}`
                    : "—";

            return `
                <tr>
                    <td>${index + 1}</td>

                    <td>
                        <div class="fw-semibold">
                            ${escapeHtml(getSettingName(setting))}
                        </div>
                    </td>

                    <td>
                        <span class="score-range">
                            ${escapeHtml(scoreRange)}
                        </span>
                    </td>

                    <td>
                        <span class="grade-badge">
                            ${escapeHtml(getGrade(setting))}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(getRemark(setting))}
                    </td>

                    <td>
                        ${escapeHtml(formatGradePoint(getGradePoint(setting)))}
                    </td>

                    <td>
                        <div class="action-buttons">

                            <button
                                type="button"
                                class="btn btn-sm btn-outline-primary edit-setting-button"
                                data-id="${escapeHtml(setting.id)}"
                                title="Edit setting"
                            >
                                <i class="bi bi-pencil"></i>
                            </button>

                            <button
                                type="button"
                                class="btn btn-sm btn-outline-danger delete-setting-button"
                                data-id="${escapeHtml(setting.id)}"
                                title="Delete setting"
                            >
                                <i class="bi bi-trash"></i>
                            </button>

                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");

    updateStatistics();
    attachRowActions();
}

function updateStatistics() {
    const totalSettingsElement = document.getElementById("totalSettings");
    const lowestScoreElement = document.getElementById("lowestScore");
    const highestScoreElement = document.getElementById("highestScore");
    const gradePointCountElement = document.getElementById("gradePointCount");

    const normalizedSettings = settings.map(normalizeSetting);

    const minimumScores = normalizedSettings
        .map(getMinimumScore)
        .filter((value) => value !== null);

    const maximumScores = normalizedSettings
        .map(getMaximumScore)
        .filter((value) => value !== null);

    const gradePointSettings = normalizedSettings.filter(
        (setting) => getGradePoint(setting) !== null
    );

    if (totalSettingsElement) {
        totalSettingsElement.textContent = normalizedSettings.length;
    }

    if (lowestScoreElement) {
        lowestScoreElement.textContent = minimumScores.length
            ? formatScore(Math.min(...minimumScores))
            : "0";
    }

    if (highestScoreElement) {
        highestScoreElement.textContent = maximumScores.length
            ? formatScore(Math.max(...maximumScores))
            : "0";
    }

    if (gradePointCountElement) {
        gradePointCountElement.textContent = gradePointSettings.length;
    }
}

async function loadSettings() {
    const tableBody = document.getElementById("settingsTableBody");

    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-row">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    Loading result settings...
                </td>
            </tr>
        `;
    }

    try {
        const response = await apiRequest(RESULT_SETTINGS_API);

        settings = normalizeArray(response).map(normalizeSetting);

        settings.sort((a, b) => {
            const aMinimum = getMinimumScore(a);
            const bMinimum = getMinimumScore(b);

            if (aMinimum === null && bMinimum === null) {
                return 0;
            }

            if (aMinimum === null) {
                return 1;
            }

            if (bMinimum === null) {
                return -1;
            }

            return bMinimum - aMinimum;
        });

        renderSettings();

        return settings;
    } catch (error) {
        console.error("Failed to load result settings:", error);

        settings = [];

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="bi bi-exclamation-triangle d-block text-danger"></i>
                            <div class="fw-semibold mb-1">
                                Unable to load result settings
                            </div>
                            <div>
                                ${escapeHtml(error.message || "An unexpected error occurred.")}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }

        updateStatistics();

        showMessage(
            error.message || "Unable to load result settings.",
            "danger"
        );

        throw error;
    }
}

async function loadSettingById(id) {
    if (!id) {
        throw new Error("A valid result setting ID is required.");
    }

    const response = await apiRequest(
        `${RESULT_SETTINGS_API}/${encodeURIComponent(id)}`
    );

    let setting = response;

    if (response && response.data) {
        setting = response.data;
    }

    if (setting && setting.setting) {
        setting = setting.setting;
    }

    return normalizeSetting(setting);
}

function resetForm() {
    const form = document.getElementById("settingForm");

    if (form) {
        form.reset();
    }

    const settingId = document.getElementById("settingId");

    if (settingId) {
        settingId.value = "";
    }

    editingSettingId = null;

    const modalTitle = document.getElementById("settingModalLabel");

    if (modalTitle) {
        modalTitle.textContent = "Add Grading Setting";
    }

    const saveButton = document.getElementById("saveSettingButton");

    if (saveButton) {
        saveButton.innerHTML = `
            <i class="bi bi-check-lg me-1"></i>
            Save Setting
        `;
    }
}

function fillForm(setting) {
    const normalized = normalizeSetting(setting);

    const settingId = document.getElementById("settingId");
    const settingName = document.getElementById("settingName");
    const minimumScore = document.getElementById("minimumScore");
    const maximumScore = document.getElementById("maximumScore");
    const grade = document.getElementById("grade");
    const gradePoint = document.getElementById("gradePoint");
    const remark = document.getElementById("remark");

    if (settingId) {
        settingId.value = normalized.id || "";
    }

    if (settingName) {
        settingName.value = normalized.settingName || "";
    }

    if (minimumScore) {
        minimumScore.value =
            normalized.minimumScore !== ""
                ? normalized.minimumScore
                : "";
    }

    if (maximumScore) {
        maximumScore.value =
            normalized.maximumScore !== ""
                ? normalized.maximumScore
                : "";
    }

    if (grade) {
        grade.value = normalized.grade || "";
    }

    if (gradePoint) {
        gradePoint.value =
            normalized.gradePoint !== ""
                ? normalized.gradePoint
                : "";
    }

    if (remark) {
        remark.value = normalized.remark || "";
    }
}

function openModalForCreate() {
    resetForm();

    if (!settingModal) {
        return;
    }

    settingModal.show();
}

async function openModalForEdit(id) {
    if (!id) {
        return;
    }

    try {
        const setting = await loadSettingById(id);

        resetForm();

        editingSettingId = setting.id;

        fillForm(setting);

        const modalTitle = document.getElementById("settingModalLabel");

        if (modalTitle) {
            modalTitle.textContent = "Edit Grading Setting";
        }

        const saveButton = document.getElementById("saveSettingButton");

        if (saveButton) {
            saveButton.innerHTML = `
                <i class="bi bi-check-lg me-1"></i>
                Update Setting
            `;
        }

        if (settingModal) {
            settingModal.show();
        }
    } catch (error) {
        console.error("Failed to load result setting:", error);

        showMessage(
            error.message || "Unable to load the selected setting.",
            "danger"
        );
    }
}

function getFormData() {
    const settingName = document
        .getElementById("settingName")
        ?.value
        .trim();

    const minimumScoreValue = document
        .getElementById("minimumScore")
        ?.value;

    const maximumScoreValue = document
        .getElementById("maximumScore")
        ?.value;

    const grade = document
        .getElementById("grade")
        ?.value
        .trim();

    const gradePointValue = document
        .getElementById("gradePoint")
        ?.value;

    const remark = document
        .getElementById("remark")
        ?.value
        .trim();

    const minimumScore = Number(minimumScoreValue);
    const maximumScore = Number(maximumScoreValue);

    let gradePoint = null;

    if (
        gradePointValue !== undefined &&
        gradePointValue !== null &&
        String(gradePointValue).trim() !== ""
    ) {
        gradePoint = Number(gradePointValue);
    }

    if (!settingName) {
        throw new Error("Setting name is required.");
    }

    if (
        minimumScoreValue === undefined ||
        minimumScoreValue === null ||
        String(minimumScoreValue).trim() === ""
    ) {
        throw new Error("Minimum score is required.");
    }

    if (!Number.isFinite(minimumScore)) {
        throw new Error("Minimum score must be a valid number.");
    }

    if (minimumScore < 0 || minimumScore > 100) {
        throw new Error("Minimum score must be between 0 and 100.");
    }

    if (
        maximumScoreValue === undefined ||
        maximumScoreValue === null ||
        String(maximumScoreValue).trim() === ""
    ) {
        throw new Error("Maximum score is required.");
    }

    if (!Number.isFinite(maximumScore)) {
        throw new Error("Maximum score must be a valid number.");
    }

    if (maximumScore < 0 || maximumScore > 100) {
        throw new Error("Maximum score must be between 0 and 100.");
    }

    if (minimumScore > maximumScore) {
        throw new Error(
            "Minimum score cannot be greater than maximum score."
        );
    }

    if (!grade) {
        throw new Error("Grade is required.");
    }

    if (gradePoint !== null) {
        if (!Number.isFinite(gradePoint)) {
            throw new Error("Grade point must be a valid number.");
        }

        if (gradePoint < 0) {
            throw new Error("Grade point cannot be negative.");
        }
    }

    return {
        settingName,
        minimumScore,
        maximumScore,
        grade,
        remark: remark || null,
        gradePoint
    };
}

async function saveSetting(event) {
    event.preventDefault();

    const form = document.getElementById("settingForm");

    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    let formData;

    try {
        formData = getFormData();
    } catch (error) {
        showMessage(error.message, "danger");
        return;
    }

    const saveButton = document.getElementById("saveSettingButton");
    const originalButtonText = saveButton
        ? saveButton.innerHTML
        : "";

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
            ></span>
            Saving...
        `;
    }

    try {
        const isEditing = Boolean(editingSettingId);

        const url = isEditing
            ? `${RESULT_SETTINGS_API}/${encodeURIComponent(editingSettingId)}`
            : RESULT_SETTINGS_API;

        const method = isEditing ? "PUT" : "POST";

        await apiRequest(url, {
            method,
            body: JSON.stringify(formData)
        });

        if (settingModal) {
            settingModal.hide();
        }

        resetForm();

        await loadSettings();

        showMessage(
            isEditing
                ? "Result setting updated successfully."
                : "Result setting created successfully.",
            "success"
        );
    } catch (error) {
        console.error("Failed to save result setting:", error);

        showMessage(
            error.message || "Unable to save result setting.",
            "danger"
        );
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML =
                originalButtonText ||
                `
                    <i class="bi bi-check-lg me-1"></i>
                    Save Setting
                `;
        }
    }
}

async function deleteSetting(id) {
    if (!id) {
        return;
    }

    const setting = settings.find(
        (item) => String(item.id) === String(id)
    );

    const settingName = setting
        ? getSettingName(setting)
        : "this grading setting";

    const confirmed = window.confirm(
        `Are you sure you want to delete "${settingName}"?`
    );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(
            `${RESULT_SETTINGS_API}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await loadSettings();

        showMessage(
            "Result setting deleted successfully.",
            "success"
        );
    } catch (error) {
        console.error("Failed to delete result setting:", error);

        showMessage(
            error.message || "Unable to delete result setting.",
            "danger"
        );
    }
}

function attachRowActions() {
    const editButtons = document.querySelectorAll(
        ".edit-setting-button"
    );

    editButtons.forEach((button) => {
        button.addEventListener("click", () => {
            openModalForEdit(button.dataset.id);
        });
    });

    const deleteButtons = document.querySelectorAll(
        ".delete-setting-button"
    );

    deleteButtons.forEach((button) => {
        button.addEventListener("click", () => {
            deleteSetting(button.dataset.id);
        });
    });
}

function setupEventListeners() {
    const addButton = document.getElementById("addSettingButton");

    if (addButton) {
        addButton.addEventListener("click", openModalForCreate);
    }

    const refreshButton = document.getElementById("refreshButton");

    if (refreshButton) {
        refreshButton.addEventListener("click", async () => {
            refreshButton.disabled = true;

            try {
                await loadSettings();
                showMessage(
                    "Result settings refreshed successfully.",
                    "success"
                );
            } catch (error) {
                console.error(error);
            } finally {
                refreshButton.disabled = false;
            }
        });
    }

    const settingForm = document.getElementById("settingForm");

    if (settingForm) {
        settingForm.addEventListener("submit", saveSetting);
    }

    const settingModalElement =
        document.getElementById("settingModal");

    if (
        settingModalElement &&
        typeof bootstrap !== "undefined" &&
        bootstrap.Modal
    ) {
        settingModal = bootstrap.Modal.getOrCreateInstance(
            settingModalElement
        );

        settingModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                resetForm();
            }
        );
    }
}

function checkAuthentication() {
    const token = getStoredToken();

    if (!token) {
        redirectToLogin();
        return false;
    }

    return true;
}

async function initializePage() {
    if (!checkAuthentication()) {
        return;
    }

    setupEventListeners();

    try {
        await loadSettings();
    } catch (error) {
        console.error("Result Settings initialization failed:", error);
    }
}

window.ResultSettingsPage = {
    loadSettings,
    loadSettingById,
    renderSettings,
    updateStatistics,
    openModalForCreate,
    openModalForEdit,
    saveSetting,
    deleteSetting
};

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);
```

})();
