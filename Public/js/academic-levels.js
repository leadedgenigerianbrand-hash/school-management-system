"use strict";

const ACADEMIC_LEVELS_ENDPOINT = "/academic-levels";

let academicLevels = [];
let levelModal = null;

document.addEventListener("DOMContentLoaded", initializeAcademicLevels);

async function initializeAcademicLevels() {
    const modalElement = document.getElementById("levelModal");

    if (modalElement && typeof bootstrap !== "undefined") {
        levelModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    }

    setupAcademicLevelEvents();

    await loadAcademicLevels();
}

function setupAcademicLevelEvents() {
    const addButton = document.getElementById("addLevelBtn");

    if (addButton) {
        addButton.addEventListener("click", openAddLevelModal);
    }

    const form = document.getElementById("levelForm");

    if (form) {
        form.addEventListener("submit", saveAcademicLevel);
    }

    const searchInput = document.getElementById("searchInput");

    if (searchInput) {
        searchInput.addEventListener("input", renderAcademicLevels);
    }

    const tableBody = document.getElementById("levelsTableBody");

    if (tableBody) {
        tableBody.addEventListener("click", handleTableAction);
    }
}

async function loadAcademicLevels() {
    showLoadingState();

    try {
        const response = await apiGet(ACADEMIC_LEVELS_ENDPOINT);

        academicLevels = extractAcademicLevels(response);

        academicLevels.sort((first, second) => {
            const firstOrder = Number(
                first.level_order ??
                first.levelOrder ??
                0
            );

            const secondOrder = Number(
                second.level_order ??
                second.levelOrder ??
                0
            );

            return firstOrder - secondOrder;
        });

        updateStatistics();
        renderAcademicLevels();
    } catch (error) {
        console.error(
            "Failed to load academic levels:",
            error
        );

        academicLevels = [];

        updateStatistics();

        showAlert(
            error.message ||
            "Unable to load academic levels.",
            "danger"
        );

        showEmptyState(
            "Unable to load academic levels."
        );
    }
}

function extractAcademicLevels(response) {
    if (Array.isArray(response)) {
        return response;
    }

    if (
        response &&
        Array.isArray(response.data)
    ) {
        return response.data;
    }

    if (
        response &&
        response.data &&
        Array.isArray(response.data.levels)
    ) {
        return response.data.levels;
    }

    if (
        response &&
        Array.isArray(response.levels)
    ) {
        return response.levels;
    }

    if (
        response &&
        response.success &&
        response.data &&
        response.data.levels &&
        Array.isArray(response.data.levels)
    ) {
        return response.data.levels;
    }

    return [];
}

function showLoadingState() {
    const tableBody =
        document.getElementById("levelsTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-5 text-muted">
                Loading academic levels...
            </td>
        </tr>
    `;
}

function showEmptyState(message) {
    const tableBody =
        document.getElementById("levelsTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-5 text-muted">
                ${escapeHtml(message)}
            </td>
        </tr>
    `;
}

function updateStatistics() {
    const total = academicLevels.length;

    const active = academicLevels.filter(
        level => isLevelActive(level)
    ).length;

    const inactive = total - active;

    const totalElement =
        document.getElementById("totalLevels");

    const activeElement =
        document.getElementById("activeLevels");

    const inactiveElement =
        document.getElementById("inactiveLevels");

    const countElement =
        document.getElementById("levelCount");

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (activeElement) {
        activeElement.textContent = active;
    }

    if (inactiveElement) {
        inactiveElement.textContent = inactive;
    }

    if (countElement) {
        countElement.textContent =
            `${total} ${total === 1 ? "level" : "levels"}`;
    }
}

function renderAcademicLevels() {
    const tableBody =
        document.getElementById("levelsTableBody");

    if (!tableBody) {
        return;
    }

    const searchInput =
        document.getElementById("searchInput");

    const searchTerm = (
        searchInput?.value ||
        ""
    )
        .trim()
        .toLowerCase();

    const filteredLevels =
        academicLevels.filter(level => {
            const name = String(
                level.level_name ??
                level.levelName ??
                ""
            ).toLowerCase();

            const description = String(
                level.description ??
                ""
            ).toLowerCase();

            return (
                !searchTerm ||
                name.includes(searchTerm) ||
                description.includes(searchTerm)
            );
        });

    const countElement =
        document.getElementById("levelCount");

    if (countElement) {
        countElement.textContent =
            `${filteredLevels.length} ${
                filteredLevels.length === 1
                    ? "level"
                    : "levels"
            }`;
    }

    if (filteredLevels.length === 0) {
        showEmptyState(
            searchTerm
                ? "No academic levels match your search."
                : "No academic levels have been created yet."
        );

        return;
    }

    tableBody.innerHTML = filteredLevels
        .map((level, index) => {
            const id = level.id;

            const name =
                level.level_name ??
                level.levelName ??
                "—";

            const order =
                level.level_order ??
                level.levelOrder ??
                "—";

            const description =
                level.description ||
                "—";

            const active =
                isLevelActive(level);

            return `
                <tr>
                    <td>
                        ${index + 1}
                    </td>
                    <td>
                        <strong>
                            ${escapeHtml(name)}
                        </strong>
                    </td>
                    <td>
                        ${escapeHtml(String(order))}
                    </td>
                    <td>
                        ${escapeHtml(String(description))}
                    </td>
                    <td>
                        ${
                            active
                                ? `
                                    <span class="badge text-bg-success">
                                        Active
                                    </span>
                                `
                                : `
                                    <span class="badge text-bg-secondary">
                                        Inactive
                                    </span>
                                `
                        }
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button
                                type="button"
                                class="btn btn-outline-primary"
                                data-action="edit"
                                data-id="${escapeHtml(String(id))}"
                            >
                                Edit
                            </button>

                            ${
                                active
                                    ? `
                                        <button
                                            type="button"
                                            class="btn btn-outline-warning"
                                            data-action="deactivate"
                                            data-id="${escapeHtml(String(id))}"
                                        >
                                            Deactivate
                                        </button>
                                    `
                                    : `
                                        <button
                                            type="button"
                                            class="btn btn-outline-success"
                                            data-action="activate"
                                            data-id="${escapeHtml(String(id))}"
                                        >
                                            Activate
                                        </button>
                                    `
                            }

                            <button
                                type="button"
                                class="btn btn-outline-danger"
                                data-action="delete"
                                data-id="${escapeHtml(String(id))}"
                            >
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function isLevelActive(level) {
    if (
        typeof level.is_active === "boolean"
    ) {
        return level.is_active;
    }

    if (
        typeof level.isActive === "boolean"
    ) {
        return level.isActive;
    }

    if (
        typeof level.status === "string"
    ) {
        return (
            level.status.toLowerCase() ===
            "active"
        );
    }

    return true;
}

function openAddLevelModal() {
    const form =
        document.getElementById("levelForm");

    if (form) {
        form.reset();
    }

    const levelId =
        document.getElementById("levelId");

    const levelStatus =
        document.getElementById("levelStatus");

    const modalTitle =
        document.getElementById("modalTitle");

    const saveButton =
        document.getElementById("saveLevelBtn");

    if (levelId) {
        levelId.value = "";
    }

    if (modalTitle) {
        modalTitle.textContent =
            "Add Academic Level";
    }

    if (saveButton) {
        saveButton.textContent =
            "Save Academic Level";
    }

    if (levelStatus) {
        levelStatus.checked = true;
    }

    if (levelModal) {
        levelModal.show();
    }
}

function openEditLevelModal(level) {
    const levelId =
        document.getElementById("levelId");

    const levelName =
        document.getElementById("levelName");

    const levelOrder =
        document.getElementById("levelOrder");

    const levelDescription =
        document.getElementById("levelDescription");

    const levelStatus =
        document.getElementById("levelStatus");

    const modalTitle =
        document.getElementById("modalTitle");

    const saveButton =
        document.getElementById("saveLevelBtn");

    if (levelId) {
        levelId.value = level.id || "";
    }

    if (levelName) {
        levelName.value =
            level.level_name ??
            level.levelName ??
            "";
    }

    if (levelOrder) {
        levelOrder.value =
            level.level_order ??
            level.levelOrder ??
            "";
    }

    if (levelDescription) {
        levelDescription.value =
            level.description || "";
    }

    if (levelStatus) {
        levelStatus.checked =
            isLevelActive(level);
    }

    if (modalTitle) {
        modalTitle.textContent =
            "Edit Academic Level";
    }

    if (saveButton) {
        saveButton.textContent =
            "Update Academic Level";
    }

    if (levelModal) {
        levelModal.show();
    }
}

async function saveAcademicLevel(event) {
    event.preventDefault();

    const saveButton =
        document.getElementById("saveLevelBtn");

    const id =
        document.getElementById("levelId")?.value.trim() ||
        "";

    const levelName =
        document.getElementById("levelName")?.value.trim() ||
        "";

    const levelOrder =
        document.getElementById("levelOrder")?.value.trim() ||
        "";

    const description =
        document.getElementById("levelDescription")?.value.trim() ||
        "";

    const levelStatus =
        document.getElementById("levelStatus");

    const isActive =
        levelStatus
            ? levelStatus.checked
            : true;

    if (!levelName) {
        showAlert(
            "Level name is required.",
            "danger"
        );

        return;
    }

    if (!levelOrder) {
        showAlert(
            "Level order is required.",
            "danger"
        );

        return;
    }

    const orderNumber =
        Number(levelOrder);

    if (
        !Number.isInteger(orderNumber) ||
        orderNumber < 1
    ) {
        showAlert(
            "Level order must be a positive whole number.",
            "danger"
        );

        return;
    }

    const payload = {
        levelName,
        levelOrder: orderNumber,
        description,
        isActive
    };

    try {
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent =
                id
                    ? "Updating..."
                    : "Saving...";
        }

        if (id) {
            await apiPut(
                `${ACADEMIC_LEVELS_ENDPOINT}/${encodeURIComponent(id)}`,
                payload
            );

            showAlert(
                "Academic level updated successfully.",
                "success"
            );
        } else {
            await apiPost(
                ACADEMIC_LEVELS_ENDPOINT,
                payload
            );

            showAlert(
                "Academic level created successfully.",
                "success"
            );
        }

        if (levelModal) {
            levelModal.hide();
        }

        await loadAcademicLevels();
    } catch (error) {
        console.error(
            "Failed to save academic level:",
            error
        );

        showAlert(
            error.message ||
            "Unable to save academic level.",
            "danger"
        );
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent =
                id
                    ? "Update Academic Level"
                    : "Save Academic Level";
        }
    }
}

function handleTableAction(event) {
    const button =
        event.target.closest(
            "button[data-action]"
        );

    if (!button) {
        return;
    }

    const action =
        button.dataset.action;

    const id =
        button.dataset.id;

    const level =
        academicLevels.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!level) {
        return;
    }

    if (action === "edit") {
        openEditLevelModal(level);
        return;
    }

    if (action === "activate") {
        changeLevelStatus(
            id,
            "activate"
        );
        return;
    }

    if (action === "deactivate") {
        changeLevelStatus(
            id,
            "deactivate"
        );
        return;
    }

    if (action === "delete") {
        deleteAcademicLevel(id);
    }
}

async function changeLevelStatus(
    id,
    action
) {
    const actionText =
        action === "activate"
            ? "activate"
            : "deactivate";

    const confirmed =
        window.confirm(
            `Are you sure you want to ${actionText} this academic level?`
        );

    if (!confirmed) {
        return;
    }

    try {
        await apiPatch(
            `${ACADEMIC_LEVELS_ENDPOINT}/${encodeURIComponent(id)}/${action}`
        );

        showAlert(
            `Academic level ${actionText}d successfully.`,
            "success"
        );

        await loadAcademicLevels();
    } catch (error) {
        console.error(
            `Failed to ${actionText} academic level:`,
            error
        );

        showAlert(
            error.message ||
            `Unable to ${actionText} academic level.`,
            "danger"
        );
    }
}

async function deleteAcademicLevel(id) {
    const confirmed =
        window.confirm(
            "Are you sure you want to delete this academic level?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await apiDelete(
            `${ACADEMIC_LEVELS_ENDPOINT}/${encodeURIComponent(id)}`
        );

        showAlert(
            "Academic level deleted successfully.",
            "success"
        );

        await loadAcademicLevels();
    } catch (error) {
        console.error(
            "Failed to delete academic level:",
            error
        );

        showAlert(
            error.message ||
            "Unable to delete academic level.",
            "danger"
        );
    }
}

function showAlert(
    message,
    type = "info"
) {
    const alertElement =
        document.getElementById("alertMessage");

    if (!alertElement) {
        return;
    }

    alertElement.className =
        `alert alert-${type}`;

    alertElement.textContent =
        message;

    window.setTimeout(() => {
        alertElement.classList.add("d-none");
    }, 5000);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}