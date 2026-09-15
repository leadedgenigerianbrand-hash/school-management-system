"use strict";

const TermsPage = (() => {
    const state = {
        terms: [],
        filteredTerms: [],
        editingId: null
    };

    const elements = {};

    function cacheElements() {
        elements.addTermButton = document.getElementById("addTermButton");
        elements.alertMessage = document.getElementById("alertMessage");

        elements.totalTerms = document.getElementById("totalTerms");
        elements.activeTerms = document.getElementById("activeTerms");
        elements.upcomingTerms = document.getElementById("upcomingTerms");
        elements.completedTerms = document.getElementById("completedTerms");

        elements.searchInput = document.getElementById("searchInput");
        elements.statusFilter = document.getElementById("statusFilter");
        elements.refreshTermsButton = document.getElementById("refreshTermsButton");

        elements.tableCount = document.getElementById("tableCount");
        elements.termsTableBody = document.getElementById("termsTableBody");

        elements.termModal = document.getElementById("termModal");
        elements.modalTitle = document.getElementById("modalTitle");
        elements.termForm = document.getElementById("termForm");

        elements.termName = document.getElementById("termName");
        elements.termOrder = document.getElementById("termOrder");
        elements.startDate = document.getElementById("startDate");
        elements.endDate = document.getElementById("endDate");
        elements.isCurrent = document.getElementById("isCurrent");
        elements.isActive = document.getElementById("isActive");

        elements.cancelTermButton = document.getElementById("cancelTermButton");
        elements.saveTermButton = document.getElementById("saveTermButton");
    }

    function showMessage(message, type = "success") {
        if (!elements.alertMessage) {
            return;
        }

        elements.alertMessage.className = `alert alert-${type}`;
        elements.alertMessage.textContent = message;
        elements.alertMessage.classList.remove("d-none");

        window.setTimeout(() => {
            elements.alertMessage.classList.add("d-none");
        }, 5000);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(value) {
        if (!value) {
            return "—";
        }

        const date = new Date(`${value}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getToday() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function getTermStatus(term) {
        if (!term.is_active) {
            return "inactive";
        }

        const today = getToday();
        const startDate = term.start_date;
        const endDate = term.end_date;

        if (term.is_current) {
            return "active";
        }

        if (startDate && today < startDate) {
            return "upcoming";
        }

        if (endDate && today > endDate) {
            return "completed";
        }

        return "active";
    }

    function getStatusLabel(status) {
        const labels = {
            active: "Active",
            upcoming: "Upcoming",
            completed: "Completed",
            inactive: "Inactive"
        };

        return labels[status] || "Unknown";
    }

    function getStatusClass(status) {
        const classes = {
            active: "bg-success",
            upcoming: "bg-info",
            completed: "bg-secondary",
            inactive: "bg-danger"
        };

        return classes[status] || "bg-secondary";
    }

    function updateStatistics() {
        let active = 0;
        let upcoming = 0;
        let completed = 0;

        state.terms.forEach(term => {
            const status = getTermStatus(term);

            if (status === "active") {
                active += 1;
            } else if (status === "upcoming") {
                upcoming += 1;
            } else if (status === "completed") {
                completed += 1;
            }
        });

        elements.totalTerms.textContent = state.terms.length;
        elements.activeTerms.textContent = active;
        elements.upcomingTerms.textContent = upcoming;
        elements.completedTerms.textContent = completed;
    }

    function applyFilters() {
        const searchTerm = elements.searchInput.value.trim().toLowerCase();
        const selectedStatus = elements.statusFilter.value;

        state.filteredTerms = state.terms.filter(term => {
            const status = getTermStatus(term);

            const matchesSearch =
                !searchTerm ||
                String(term.term_name || "")
                    .toLowerCase()
                    .includes(searchTerm);

            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        renderTerms();
    }

    function renderTerms() {
        if (!state.filteredTerms.length) {
            elements.termsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        No academic terms found.
                    </td>
                </tr>
            `;

            elements.tableCount.textContent = "0 terms";
            return;
        }

        elements.tableCount.textContent =
            `${state.filteredTerms.length} term${state.filteredTerms.length === 1 ? "" : "s"}`;

        elements.termsTableBody.innerHTML = state.filteredTerms.map(term => {
            const status = getTermStatus(term);
            const statusLabel = getStatusLabel(status);
            const statusClass = getStatusClass(status);

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(term.term_name)}</strong>
                    </td>
                    <td>
                        ${escapeHtml(term.term_order)}
                    </td>
                    <td>
                        ${formatDate(term.start_date)}
                    </td>
                    <td>
                        ${formatDate(term.end_date)}
                    </td>
                    <td>
                        ${term.is_current
                            ? '<span class="badge bg-primary">Current</span>'
                            : '<span class="text-muted">No</span>'}
                    </td>
                    <td>
                        <span class="badge ${statusClass}">
                            ${statusLabel}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button
                                type="button"
                                class="btn btn-outline-primary"
                                onclick="TermsPage.editTerm('${escapeHtml(term.id)}')"
                                title="Edit term">
                                Edit
                            </button>
                            <button
                                type="button"
                                class="btn btn-outline-danger"
                                onclick="TermsPage.deleteTerm('${escapeHtml(term.id)}')"
                                title="Delete term">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    async function loadTerms() {
        try {
            elements.termsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        Loading terms...
                    </td>
                </tr>
            `;

            const response = await apiGet("/terms");

            state.terms = Array.isArray(response)
                ? response
                : Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.terms)
                        ? response.terms
                        : [];

            updateStatistics();
            applyFilters();
        } catch (error) {
            console.error("Failed to load academic terms:", error);

            state.terms = [];
            state.filteredTerms = [];

            updateStatistics();

            elements.termsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger py-4">
                        Failed to load academic terms.
                    </td>
                </tr>
            `;

            elements.tableCount.textContent = "0 terms";

            showMessage(
                error.message || "Failed to load academic terms.",
                "danger"
            );
        }
    }

    function openCreateModal() {
        state.editingId = null;

        elements.modalTitle.textContent = "Add Academic Term";
        elements.termForm.reset();

        elements.termOrder.value = "1";
        elements.isCurrent.checked = false;
        elements.isActive.checked = true;

        const modal = bootstrap.Modal.getOrCreateInstance(
            elements.termModal
        );

        modal.show();
    }

    function openEditModal(term) {
        state.editingId = term.id;

        elements.modalTitle.textContent = "Edit Academic Term";

        elements.termName.value = term.term_name || "";
        elements.termOrder.value = term.term_order || "";
        elements.startDate.value = term.start_date || "";
        elements.endDate.value = term.end_date || "";
        elements.isCurrent.checked = Boolean(term.is_current);
        elements.isActive.checked = Boolean(term.is_active);

        const modal = bootstrap.Modal.getOrCreateInstance(
            elements.termModal
        );

        modal.show();
    }

    function editTerm(id) {
        const term = state.terms.find(item => item.id === id);

        if (!term) {
            showMessage("Academic term not found.", "danger");
            return;
        }

        openEditModal(term);
    }

    async function saveTerm(event) {
        event.preventDefault();

        const termName = elements.termName.value.trim();
        const termOrder = Number(elements.termOrder.value);
        const startDate = elements.startDate.value;
        const endDate = elements.endDate.value;
        const isCurrent = elements.isCurrent.checked;
        const isActive = elements.isActive.checked;

        if (!termName) {
            showMessage("Term name is required.", "danger");
            return;
        }

        if (!Number.isInteger(termOrder) || termOrder < 1) {
            showMessage(
                "Term order must be a whole number greater than zero.",
                "danger"
            );
            return;
        }

        if (!startDate || !endDate) {
            showMessage(
                "Start date and end date are required.",
                "danger"
            );
            return;
        }

        if (startDate > endDate) {
            showMessage(
                "Start date cannot be after end date.",
                "danger"
            );
            return;
        }

        const payload = {
            term_name: termName,
            term_order: termOrder,
            start_date: startDate,
            end_date: endDate,
            is_current: isCurrent,
            is_active: isActive
        };

        const originalButtonText =
            elements.saveTermButton.textContent;

        try {
            elements.saveTermButton.disabled = true;
            elements.saveTermButton.textContent = "Saving...";

            if (state.editingId) {
                await apiPut(
                    `/terms/${encodeURIComponent(state.editingId)}`,
                    payload
                );

                showMessage(
                    "Academic term updated successfully.",
                    "success"
                );
            } else {
                await apiPost(
                    "/terms",
                    payload
                );

                showMessage(
                    "Academic term created successfully.",
                    "success"
                );
            }

            const modal = bootstrap.Modal.getInstance(
                elements.termModal
            );

            if (modal) {
                modal.hide();
            }

            await loadTerms();
        } catch (error) {
            console.error("Failed to save academic term:", error);

            showMessage(
                error.message || "Failed to save academic term.",
                "danger"
            );
        } finally {
            elements.saveTermButton.disabled = false;
            elements.saveTermButton.textContent = originalButtonText;
        }
    }

    async function deleteTerm(id) {
        const term = state.terms.find(item => item.id === id);

        if (!term) {
            showMessage("Academic term not found.", "danger");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${term.term_name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            await apiDelete(
                `/terms/${encodeURIComponent(id)}`
            );

            showMessage(
                "Academic term deleted successfully.",
                "success"
            );

            await loadTerms();
        } catch (error) {
            console.error("Failed to delete academic term:", error);

            showMessage(
                error.message || "Failed to delete academic term.",
                "danger"
            );
        }
    }

    function setupEvents() {
        elements.addTermButton.addEventListener(
            "click",
            openCreateModal
        );

        elements.refreshTermsButton.addEventListener(
            "click",
            loadTerms
        );

        elements.searchInput.addEventListener(
            "input",
            applyFilters
        );

        elements.statusFilter.addEventListener(
            "change",
            applyFilters
        );

        elements.termForm.addEventListener(
            "submit",
            saveTerm
        );

        elements.cancelTermButton.addEventListener(
            "click",
            () => {
                const modal = bootstrap.Modal.getInstance(
                    elements.termModal
                );

                if (modal) {
                    modal.hide();
                }
            }
        );

        elements.termModal.addEventListener(
            "hidden.bs.modal",
            () => {
                state.editingId = null;
                elements.termForm.reset();
            }
        );
    }

    async function init() {
        cacheElements();
        setupEvents();
        await loadTerms();
    }

    return {
        init,
        loadTerms,
        editTerm,
        deleteTerm
    };
})();

document.addEventListener(
    "DOMContentLoaded",
    () => {
        TermsPage.init();
    }
);