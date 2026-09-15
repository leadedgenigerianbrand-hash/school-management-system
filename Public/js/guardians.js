"use strict";

(function () {

```
const API_BASE = "/api";

let guardians = [];
let editingGuardianId = null;


/*
|--------------------------------------------------------------------------
| AUTHENTICATION
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

async function request(endpoint, options = {}) {

    let url = endpoint;

    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {

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

        response = await fetch(
            url,
            {
                ...options,
                headers
            }
        );

    } catch (error) {

        console.error(
            "Guardian API request failed:",
            error
        );

        throw new Error(
            "Unable to connect to the server. Please check your connection."
        );

    }


    if (response.status === 401) {

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


        if (
            !window.location.pathname.endsWith(
                "/login.html"
            )
        ) {

            window.location.href =
                "/pages/login.html";

        }


        throw new Error(
            "Authentication required."
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


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        data = await response.json();

    } else {

        data = await response.text();

    }


    if (!response.ok) {

        let message =
            "Request failed.";


        if (
            data &&
            typeof data === "object"
        ) {

            message =
                data.message ||
                data.error ||
                message;

        } else if (
            typeof data === "string" &&
            data.trim()
        ) {

            message =
                data;

        }


        throw new Error(message);

    }


    return data;

}


/*
|--------------------------------------------------------------------------
| INITIALIZATION
|--------------------------------------------------------------------------
*/

async function initialize() {

    setupEvents();

    await loadGuardians();

}


/*
|--------------------------------------------------------------------------
| EVENT HANDLERS
|--------------------------------------------------------------------------
*/

function setupEvents() {

    const form =
        document.querySelector(
            "#guardianForm"
        );


    if (
        form &&
        !form.dataset.guardianInitialized
    ) {

        form.addEventListener(
            "submit",
            handleSubmit
        );

        form.dataset.guardianInitialized =
            "true";

    }


    const searchInput =
        document.querySelector(
            "#searchInput"
        );


    if (
        searchInput &&
        !searchInput.dataset.guardianSearchInitialized
    ) {

        searchInput.addEventListener(
            "input",
            renderGuardians
        );

        searchInput.dataset.guardianSearchInitialized =
            "true";

    }


    const relationshipFilter =
        document.querySelector(
            "#relationshipFilter"
        );


    if (
        relationshipFilter &&
        !relationshipFilter.dataset.guardianFilterInitialized
    ) {

        relationshipFilter.addEventListener(
            "change",
            renderGuardians
        );

        relationshipFilter.dataset.guardianFilterInitialized =
            "true";

    }


    const refreshButton =
        document.querySelector(
            "#refreshButton"
        );


    if (
        refreshButton &&
        !refreshButton.dataset.guardianRefreshInitialized
    ) {

        refreshButton.addEventListener(
            "click",
            loadGuardians
        );

        refreshButton.dataset.guardianRefreshInitialized =
            "true";

    }


    const addGuardianButton =
        document.querySelector(
            "#addGuardianButton"
        );


    if (
        addGuardianButton &&
        !addGuardianButton.dataset.guardianAddInitialized
    ) {

        addGuardianButton.addEventListener(
            "click",
            function () {

                resetForm();

                openGuardianModal();

            }
        );

        addGuardianButton.dataset.guardianAddInitialized =
            "true";

    }


    const closeGuardianModal =
        document.querySelector(
            "#closeGuardianModal"
        );


    if (closeGuardianModal) {

        closeGuardianModal.addEventListener(
            "click",
            closeModal
        );

    }


    const cancelGuardianButton =
        document.querySelector(
            "#cancelGuardianButton"
        );


    if (cancelGuardianButton) {

        cancelGuardianButton.addEventListener(
            "click",
            closeModal
        );

    }


    const modal =
        document.querySelector(
            "#guardianModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeModal();

                }

            }
        );

    }


    const tableBody =
        document.querySelector(
            "#guardiansTableBody"
        );


    if (
        tableBody &&
        !tableBody.dataset.guardianActionsInitialized
    ) {

        tableBody.addEventListener(
            "click",
            handleTableAction
        );

        tableBody.dataset.guardianActionsInitialized =
            "true";

    }


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeModal();

            }

        }
    );

}


/*
|--------------------------------------------------------------------------
| LOAD GUARDIANS
|--------------------------------------------------------------------------
*/

async function loadGuardians() {

    showLoading();

    try {

        const data =
            await request(
                "/guardians"
            );


        guardians =
            extractRecords(data);


        renderGuardians();

        updateStatistics();

    } catch (error) {

        console.error(
            "Unable to load guardians:",
            error
        );

        guardians = [];

        updateStatistics();

        showError(
            error.message ||
            "Unable to load guardians."
        );

    }

}


/*
|--------------------------------------------------------------------------
| EXTRACT API RECORDS
|--------------------------------------------------------------------------
*/

function extractRecords(data) {

    if (Array.isArray(data)) {
        return data;
    }


    if (
        data &&
        Array.isArray(data.data)
    ) {

        return data.data;

    }


    if (
        data &&
        Array.isArray(data.guardians)
    ) {

        return data.guardians;

    }


    if (
        data &&
        Array.isArray(data.records)
    ) {

        return data.records;

    }


    return [];

}


/*
|--------------------------------------------------------------------------
| RENDER GUARDIANS
|--------------------------------------------------------------------------
*/

function renderGuardians() {

    const container =
        document.querySelector(
            "#guardiansTableBody"
        );


    if (!container) {
        return;
    }


    const searchInput =
        document.querySelector(
            "#searchInput"
        );


    const relationshipFilter =
        document.querySelector(
            "#relationshipFilter"
        );


    const search =
        String(
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    const relationship =
        String(
            relationshipFilter?.value || ""
        )
            .trim()
            .toLowerCase();


    const records =
        guardians.filter(
            function (guardian) {

                const guardianName =
                    getGuardianName(
                        guardian
                    ).toLowerCase();


                const phone =
                    String(
                        guardian.phone ||
                        ""
                    ).toLowerCase();


                const alternativePhone =
                    String(
                        guardian.alternative_phone ||
                        guardian.alternativePhone ||
                        ""
                    ).toLowerCase();


                const email =
                    String(
                        guardian.email ||
                        ""
                    ).toLowerCase();


                const guardianRelationship =
                    String(
                        guardian.relationship ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    guardianName.includes(
                        search
                    ) ||
                    phone.includes(
                        search
                    ) ||
                    alternativePhone.includes(
                        search
                    ) ||
                    email.includes(
                        search
                    ) ||
                    guardianRelationship.includes(
                        search
                    );


                const matchesRelationship =
                    !relationship ||
                    guardianRelationship ===
                        relationship;


                return (
                    matchesSearch &&
                    matchesRelationship
                );

            }
        );


    if (!records.length) {

        container.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <div class="text-secondary">
                        <i class="bi bi-person-x fs-2 d-block mb-2"></i>
                        <div class="fw-semibold">
                            No guardians found
                        </div>
                        <div class="small">
                            No parent or guardian records match the current search.
                        </div>
                    </div>
                </td>
            </tr>
        `;

        return;

    }


    container.innerHTML =
        records
            .map(
                renderGuardianRow
            )
            .join("");

}


/*
|--------------------------------------------------------------------------
| RENDER GUARDIAN ROW
|--------------------------------------------------------------------------
*/

function renderGuardianRow(guardian) {

    const id =
        guardian.id ||
        guardian.guardian_id;


    const guardianName =
        getGuardianName(
            guardian
        );


    const relationship =
        guardian.relationship ||
        "-";


    const phone =
        guardian.phone ||
        "-";


    const email =
        guardian.email ||
        "-";


    const studentCount =
        getStudentCount(
            guardian
        );


    const primary =
        isPrimaryGuardian(
            guardian
        );


    return `
        <tr>

            <td>
                <div class="guardian-name">
                    ${escapeHtml(
                        guardianName
                    )}
                </div>

                ${
                    guardian.occupation
                        ? `
                            <div class="guardian-meta">
                                ${escapeHtml(
                                    guardian.occupation
                                )}
                            </div>
                        `
                        : ""
                }
            </td>


            <td>
                <span class="relationship-badge">
                    ${escapeHtml(
                        relationship
                    )}
                </span>
            </td>


            <td>
                ${escapeHtml(
                    phone
                )}
            </td>


            <td>
                ${escapeHtml(
                    email
                )}
            </td>


            <td>
                ${
                    studentCount > 0
                        ? `
                            <span class="fw-semibold">
                                ${studentCount}
                            </span>
                            <span class="text-secondary small">
                                ${studentCount === 1 ? "student" : "students"}
                            </span>
                        `
                        : `
                            <span class="text-secondary">
                                Not linked
                            </span>
                        `
                }
            </td>


            <td>
                ${
                    primary
                        ? `
                            <span class="primary-badge">
                                <i class="bi bi-star-fill me-1"></i>
                                Primary
                            </span>
                        `
                        : `
                            <span class="text-secondary">
                                —
                            </span>
                        `
                }
            </td>


            <td class="text-end">

                <div class="btn-group btn-group-sm">

                    <button
                        type="button"
                        class="btn btn-outline-primary"
                        data-action="edit"
                        data-id="${escapeAttribute(id)}"
                        title="Edit Guardian"
                    >
                        <i class="bi bi-pencil"></i>
                    </button>


                    <button
                        type="button"
                        class="btn btn-outline-danger"
                        data-action="delete"
                        data-id="${escapeAttribute(id)}"
                        title="Delete Guardian"
                    >
                        <i class="bi bi-trash"></i>
                    </button>

                </div>

            </td>

        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| SUBMIT GUARDIAN
|--------------------------------------------------------------------------
*/

async function handleSubmit(event) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const data =
        collectGuardianFormData(
            form
        );


    if (!data.firstName) {

        notify(
            "Please enter the guardian's first name.",
            "error"
        );

        return;

    }


    if (!data.lastName) {

        notify(
            "Please enter the guardian's last name.",
            "error"
        );

        return;

    }


    if (!data.relationship) {

        notify(
            "Please select the guardian's relationship.",
            "error"
        );

        return;

    }


    if (!data.phone) {

        notify(
            "Please enter the guardian's phone number.",
            "error"
        );

        return;

    }


    const saveButton =
        document.querySelector(
            "#saveGuardianButton"
        );


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.innerHTML =
            `
                <span class="spinner-border spinner-border-sm me-2"></span>
                Saving...
            `;

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

        closeModal();

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

    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                `
                    <i class="bi bi-check2 me-2"></i>
                    Save Guardian
                `;

        }

    }

}


/*
|--------------------------------------------------------------------------
| COLLECT GUARDIAN FORM DATA
|--------------------------------------------------------------------------
*/

function collectGuardianFormData(form) {

    const get =
        function (selector) {

            const element =
                form.querySelector(
                    selector
                );

            return element
                ? String(
                    element.value || ""
                ).trim()
                : "";

        };


    return {

        firstName:
            get("#firstName"),

        middleName:
            get("#middleName"),

        lastName:
            get("#lastName"),

        relationship:
            get("#relationship"),

        phone:
            get("#phone"),

        alternativePhone:
            get("#alternativePhone"),

        email:
            get("#email"),

        address:
            get("#address"),

        occupation:
            get("#occupation"),

        employer:
            get("#employer"),

        emergencyContact:
            get("#emergencyContact")

    };

}


/*
|--------------------------------------------------------------------------
| EDIT GUARDIAN
|--------------------------------------------------------------------------
*/

function editGuardian(id) {

    const guardian =
        guardians.find(
            function (item) {

                return String(
                    item.id ||
                    item.guardian_id
                ) === String(id);

            }
        );


    if (!guardian) {

        notify(
            "Guardian record could not be found.",
            "error"
        );

        return;

    }


    editingGuardianId =
        id;


    setFormValue(
        "#guardianId",
        id
    );


    setFormValue(
        "#firstName",
        guardian.first_name ||
        guardian.firstName ||
        ""
    );


    setFormValue(
        "#middleName",
        guardian.middle_name ||
        guardian.middleName ||
        ""
    );


    setFormValue(
        "#lastName",
        guardian.last_name ||
        guardian.lastName ||
        ""
    );


    setFormValue(
        "#relationship",
        guardian.relationship ||
        ""
    );


    setFormValue(
        "#phone",
        guardian.phone ||
        ""
    );


    setFormValue(
        "#alternativePhone",
        guardian.alternative_phone ||
        guardian.alternativePhone ||
        ""
    );


    setFormValue(
        "#email",
        guardian.email ||
        ""
    );


    setFormValue(
        "#address",
        guardian.address ||
        ""
    );


    setFormValue(
        "#occupation",
        guardian.occupation ||
        ""
    );


    setFormValue(
        "#employer",
        guardian.employer ||
        ""
    );


    setFormValue(
        "#emergencyContact",
        guardian.emergency_contact ||
        guardian.emergencyContact ||
        ""
    );


    updateFormMode(
        "Update Guardian"
    );


    openGuardianModal();

}


/*
|--------------------------------------------------------------------------
| DELETE GUARDIAN
|--------------------------------------------------------------------------
*/

async function deleteGuardian(id) {

    const guardian =
        guardians.find(
            function (item) {

                return String(
                    item.id ||
                    item.guardian_id
                ) === String(id);

            }
        );


    const name =
        guardian
            ? getGuardianName(
                guardian
            )
            : "this guardian";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await request(
            `/guardians/${encodeURIComponent(
                id
            )}`,
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


/*
|--------------------------------------------------------------------------
| TABLE ACTIONS
|--------------------------------------------------------------------------
*/

async function handleTableAction(event) {

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


    if (action === "edit") {

        editGuardian(id);

        return;

    }


    if (action === "delete") {

        await deleteGuardian(id);

    }

}


/*
|--------------------------------------------------------------------------
| FORM RESET
|--------------------------------------------------------------------------
*/

function resetForm() {

    editingGuardianId =
        null;


    const form =
        document.querySelector(
            "#guardianForm"
        );


    if (form) {
        form.reset();
    }


    setFormValue(
        "#guardianId",
        ""
    );


    updateFormMode(
        "Add Guardian"
    );

}


/*
|--------------------------------------------------------------------------
| FORM MODE
|--------------------------------------------------------------------------
*/

function updateFormMode(text) {

    const title =
        document.querySelector(
            "#guardianModalTitle"
        );


    if (title) {

        title.textContent =
            text;

    }


    const button =
        document.querySelector(
            "#saveGuardianButton"
        );


    if (button) {

        button.innerHTML =
            `
                <i class="bi bi-check2 me-2"></i>
                ${escapeHtml(text)}
            `;

    }

}


/*
|--------------------------------------------------------------------------
| MODAL
|--------------------------------------------------------------------------
*/

function openGuardianModal() {

    const modal =
        document.querySelector(
            "#guardianModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden =
        false;


    document.body.classList.add(
        "modal-open"
    );


    document.body.style.overflow =
        "hidden";


    const firstName =
        document.querySelector(
            "#firstName"
        );


    if (firstName) {

        setTimeout(
            function () {
                firstName.focus();
            },
            50
        );

    }

}


function closeModal() {

    const modal =
        document.querySelector(
            "#guardianModal"
        );


    if (!modal) {
        return;
    }


    modal.hidden =
        true;


    document.body.classList.remove(
        "modal-open"
    );


    document.body.style.overflow =
        "";

}


/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
*/

function updateStatistics() {

    const total =
        guardians.length;


    const linked =
        guardians.filter(
            function (guardian) {

                return (
                    getStudentCount(
                        guardian
                    ) > 0
                );

            }
        ).length;


    const primary =
        guardians.filter(
            function (guardian) {

                return isPrimaryGuardian(
                    guardian
                );

            }
        ).length;


    const linkedStudents =
        guardians.reduce(
            function (totalCount, guardian) {

                return (
                    totalCount +
                    getStudentCount(
                        guardian
                    )
                );

            },
            0
        );


    setText(
        "#totalGuardians",
        total
    );


    setText(
        "#linkedGuardians",
        linked
    );


    setText(
        "#primaryGuardians",
        primary
    );


    setText(
        "#linkedStudents",
        linkedStudents
    );

}


/*
|--------------------------------------------------------------------------
| RELATIONSHIP DATA HELPERS
|--------------------------------------------------------------------------
*/

function getStudentCount(guardian) {

    if (
        Array.isArray(
            guardian.students
        )
    ) {

        return guardian.students.length;

    }


    if (
        Array.isArray(
            guardian.studentIds
        )
    ) {

        return guardian.studentIds.length;

    }


    if (
        Array.isArray(
            guardian.student_ids
        )
    ) {

        return guardian.student_ids.length;

    }


    const count =
        Number(
            guardian.student_count ??
            guardian.studentCount ??
            0
        );


    return Number.isFinite(count)
        ? count
        : 0;

}


function isPrimaryGuardian(guardian) {

    return (
        guardian.is_primary === true ||
        guardian.isPrimary === true ||
        guardian.is_primary === "true" ||
        guardian.isPrimary === "true"
    );

}


/*
|--------------------------------------------------------------------------
| GUARDIAN NAME
|--------------------------------------------------------------------------
*/

function getGuardianName(guardian) {

    const fullName =
        guardian.name ||
        guardian.full_name ||
        guardian.guardian_name;


    if (fullName) {

        return String(
            fullName
        );

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


/*
|--------------------------------------------------------------------------
| FORM VALUE
|--------------------------------------------------------------------------
*/

function setFormValue(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {
        return;
    }


    element.value =
        value ?? "";

}


/*
|--------------------------------------------------------------------------
| TEXT VALUE
|--------------------------------------------------------------------------
*/

function setText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (element) {

        element.textContent =
            String(
                value ?? 0
            );

    }

}


/*
|--------------------------------------------------------------------------
| LOADING STATE
|--------------------------------------------------------------------------
*/

function showLoading() {

    const container =
        document.querySelector(
            "#guardiansTableBody"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-5 text-secondary">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                Loading guardians...
            </td>
        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| ERROR STATE
|--------------------------------------------------------------------------
*/

function showError(message) {

    const container =
        document.querySelector(
            "#guardiansTableBody"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-5">
                <div class="text-danger mb-2">
                    <i class="bi bi-exclamation-triangle fs-3"></i>
                </div>

                <div class="fw-semibold">
                    Unable to load guardians
                </div>

                <div class="small text-secondary mt-1">
                    ${escapeHtml(message)}
                </div>

                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary mt-3"
                    onclick="window.GuardiansPage.loadGuardians()"
                >
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Try Again
                </button>
            </td>
        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| NOTIFICATIONS
|--------------------------------------------------------------------------
*/

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
            "99999";

        container.style.maxWidth =
            "380px";


        document.body.appendChild(
            container
        );

    }


    const alert =
        document.createElement(
            "div"
        );


    alert.className =
        `alert alert-${
            type === "error"
                ? "danger"
                : type
        } shadow-sm`;


    alert.textContent =
        message;


    container.appendChild(
        alert
    );


    setTimeout(
        function () {

            alert.remove();

        },
        4000
    );

}


/*
|--------------------------------------------------------------------------
| HTML ESCAPING
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {

    if (
        window.App &&
        typeof window.App.escapeHtml ===
            "function"
    ) {

        return window.App.escapeHtml(
            value
        );

    }


    return String(
        value ?? ""
    )
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


/*
|--------------------------------------------------------------------------
| ATTRIBUTE ESCAPING
|--------------------------------------------------------------------------
*/

function escapeAttribute(value) {

    return escapeHtml(
        value
    );

}


/*
|--------------------------------------------------------------------------
| PUBLIC API
|--------------------------------------------------------------------------
*/

window.GuardiansPage = {

    initialize,

    loadGuardians,

    editGuardian,

    deleteGuardian,

    resetForm,

    openGuardianModal,

    closeModal

};


/*
|--------------------------------------------------------------------------
| START APPLICATION
|--------------------------------------------------------------------------
*/

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize,
        {
            once: true
        }
    );

} else {

    initialize();

}
```

})();
