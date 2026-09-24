"use strict";

/* ==========================================================================
   GUARDIANS PAGE
   Stable frontend implementation
   ========================================================================== */

var API_BASE = "/api";

var guardians = [];
var editingGuardianId = null;
var initialized = false;

var selectedStudentId = "";
var selectedStudent = null;
var studentSearchTimer = null;

/* ==========================================================================
   AUTHENTICATION
   ========================================================================== */

function getToken() {
    return (
        localStorage.getItem("school_management_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("school_management_token") ||
        sessionStorage.getItem("token") ||
        ""
    );
}

function getCurrentUser() {
    var raw =
        localStorage.getItem("school_management_user") ||
        sessionStorage.getItem("school_management_user") ||
        "";

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        console.warn("Unable to parse current user:", error);
        return null;
    }
}

function clearAuthentication() {
    localStorage.removeItem("school_management_token");
    localStorage.removeItem("school_management_user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("school_management_token");
    sessionStorage.removeItem("school_management_user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
}

function redirectToLogin() {
    window.location.href = "/pages/login.html";
}

/* ==========================================================================
   API REQUEST
   ========================================================================== */

async function request(endpoint, options) {
    options = options || {};

    var headers = options.headers || {};

    if (!headers["Content-Type"] && options.body) {
        headers["Content-Type"] = "application/json";
    }

    var token = getToken();

    if (token) {
        headers.Authorization = "Bearer " + token;
    }

    options.headers = headers;

    var response;

    try {
        response = await fetch(API_BASE + endpoint, options);
    } catch (error) {
        console.error("Guardian API request failed:", error);

        throw new Error(
            "Unable to connect to the server. Please make sure the school management server is running."
        );
    }

    var contentType = response.headers.get("content-type") || "";
    var data;

    if (contentType.indexOf("application/json") !== -1) {
        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }
    } else {
        try {
            data = await response.text();
        } catch (error) {
            data = "";
        }
    }

    if (response.status === 401) {
        clearAuthentication();
        redirectToLogin();

        throw new Error("Your session has expired. Please log in again.");
    }

    if (response.status === 403) {
        throw new Error(
            "You do not have permission to perform this guardian operation."
        );
    }

    if (!response.ok) {
        var message = "Guardian request failed.";

        if (data && typeof data === "object") {
            message =
                data.message ||
                data.error ||
                data.details ||
                message;
        } else if (typeof data === "string" && data.trim()) {
            message = data;
        }

        throw new Error(message);
    }

    return data;
}

/* ==========================================================================
   DOM HELPERS
   ========================================================================== */

function getElement(id) {
    return document.getElementById(id);
}

function showMessage(message, type) {
    type = type || "info";

    if (typeof window.showToast === "function") {
        window.showToast(message, type);
        return;
    }

    if (typeof window.showNotification === "function") {
        window.showNotification(message, type);
        return;
    }

    if (type === "error" || type === "danger") {
        console.error(message);
        alert(message);
        return;
    }

    console.log(message);
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

/* ==========================================================================
   GUARDIAN HELPERS
   ========================================================================== */

function getGuardianId(guardian) {
    if (!guardian) {
        return "";
    }

    return (
        guardian.id ||
        guardian.guardianId ||
        guardian.guardian_id ||
        ""
    );
}

function getGuardianFirstName(guardian) {
    return (
        guardian.firstName ||
        guardian.first_name ||
        ""
    );
}

function getGuardianMiddleName(guardian) {
    return (
        guardian.middleName ||
        guardian.middle_name ||
        ""
    );
}

function getGuardianLastName(guardian) {
    return (
        guardian.lastName ||
        guardian.last_name ||
        ""
    );
}

function getGuardianName(guardian) {
    var parts = [
        getGuardianFirstName(guardian),
        getGuardianMiddleName(guardian),
        getGuardianLastName(guardian)
    ].filter(function (value) {
        return String(value || "").trim() !== "";
    });

    return parts.join(" ");
}

function getGuardianRelationship(guardian) {
    return (
        guardian.relationship ||
        guardian.relationship_type ||
        guardian.relationshipType ||
        ""
    );
}

function getGuardianPhone(guardian) {
    return (
        guardian.phone ||
        guardian.phone_number ||
        ""
    );
}

function getGuardianEmail(guardian) {
    return guardian.email || "";
}

function getGuardianOccupation(guardian) {
    return guardian.occupation || "";
}

function getGuardianAddress(guardian) {
    return guardian.address || "";
}

function getGuardianEmergencyContact(guardian) {
    return (
        guardian.emergencyContact ||
        guardian.emergency_contact ||
        ""
    );
}

function getGuardianStudentCount(guardian) {
    if (!guardian) {
        return 0;
    }

    var count =
        guardian.studentCount ??
        guardian.student_count ??
        guardian.linkedStudents ??
        guardian.linked_students ??
        guardian.studentsCount ??
        guardian.students_count ??
        0;

    var numericCount = Number(count);

    if (!Number.isFinite(numericCount)) {
        return 0;
    }

    return numericCount;
}

function guardianHasLinkedStudent(guardian) {
    return getGuardianStudentCount(guardian) > 0;
}

/* ==========================================================================
   STUDENT HELPERS
   ========================================================================== */

function getStudentId(student) {
    if (!student) {
        return "";
    }

    return (
        student.id ||
        student.studentId ||
        student.student_id ||
        ""
    );
}

function getStudentNumber(student) {
    if (!student) {
        return "";
    }

    return (
        student.studentNumber ||
        student.student_number ||
        student.admissionNumber ||
        student.admission_number ||
        ""
    );
}

function getStudentFirstName(student) {
    return (
        student.firstName ||
        student.first_name ||
        ""
    );
}

function getStudentMiddleName(student) {
    return (
        student.middleName ||
        student.middle_name ||
        ""
    );
}

function getStudentLastName(student) {
    return (
        student.lastName ||
        student.last_name ||
        ""
    );
}

function getStudentName(student) {
    if (!student) {
        return "";
    }

    if (student.name) {
        return String(student.name).trim();
    }

    var parts = [
        getStudentFirstName(student),
        getStudentMiddleName(student),
        getStudentLastName(student)
    ].filter(function (value) {
        return String(value || "").trim() !== "";
    });

    return parts.join(" ");
}

function getStudentLevel(student) {
    if (!student) {
        return "";
    }

    return (
        student.levelName ||
        student.level_name ||
        student.academicLevel ||
        student.academic_level ||
        student.className ||
        student.class_name ||
        student.level ||
        ""
    );
}

function normalizeStudentList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (!data || typeof data !== "object") {
        return [];
    }

    if (Array.isArray(data.students)) {
        return data.students;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    if (data.data && Array.isArray(data.data.students)) {
        return data.data.students;
    }

    if (Array.isArray(data.rows)) {
        return data.rows;
    }

    return [];
}

/* ==========================================================================
   MODAL
   ========================================================================== */

function getGuardianModal() {
    return getElement("guardianModal");
}

function ensureModalClosed() {
    var modal = getGuardianModal();

    if (!modal) {
        return;
    }

    modal.hidden = true;
    modal.style.display = "none";
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    modal.removeAttribute("aria-modal");

    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
}

function openGuardianModal() {
    var modal = getGuardianModal();

    if (!modal) {
        console.error("Guardian modal was not found.");
        return;
    }

    modal.hidden = false;
    modal.style.display = "block";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    modal.setAttribute("aria-modal", "true");

    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";

    var firstName = getElement("firstName");

    if (firstName) {
        setTimeout(function () {
            firstName.focus();
        }, 50);
    }
}

function closeGuardianModal() {
    var modal = getGuardianModal();

    if (!modal) {
        return;
    }

    modal.hidden = true;
    modal.style.display = "none";
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    modal.removeAttribute("aria-modal");

    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");

    editingGuardianId = null;

    var form = getElement("guardianForm");

    if (form) {
        form.reset();
    }

    clearSelectedStudent();
    setFormMode("add");
}

function setFormMode(mode) {
    var title = getElement("guardianModalTitle");
    var saveButton = getElement("saveGuardianButton");
    var studentSection = getElement("guardianStudentSelection");

    if (title) {
        title.textContent =
            mode === "edit"
                ? "Edit Guardian"
                : "Add Guardian";
    }

    if (saveButton) {
        saveButton.textContent =
            mode === "edit"
                ? "Update Guardian"
                : "Save Guardian";
    }

    if (studentSection) {
        studentSection.style.display =
            mode === "edit"
                ? "none"
                : "";
    }
}

function resetForm() {
    var form = getElement("guardianForm");

    if (form) {
        form.reset();
    }

    var guardianId = getElement("guardianId");

    if (guardianId) {
        guardianId.value = "";
    }

    editingGuardianId = null;

    clearSelectedStudent();
    setFormMode("add");
}

function openAddGuardianModal() {
    resetForm();
    ensureStudentSearchControl();
    openGuardianModal();
}

function openEditGuardianModal(guardian) {
    if (!guardian) {
        return;
    }

    var id = getGuardianId(guardian);

    if (!id) {
        showMessage(
            "The selected guardian does not have a valid ID.",
            "error"
        );
        return;
    }

    editingGuardianId = id;

    var guardianId = getElement("guardianId");
    var firstName = getElement("firstName");
    var middleName = getElement("middleName");
    var lastName = getElement("lastName");
    var relationship = getElement("relationship");
    var phone = getElement("phone");
    var alternativePhone = getElement("alternativePhone");
    var email = getElement("email");
    var occupation = getElement("occupation");
    var employer = getElement("employer");
    var address = getElement("address");
    var emergencyContact = getElement("emergencyContact");

    if (guardianId) {
        guardianId.value = id;
    }

    if (firstName) {
        firstName.value = getGuardianFirstName(guardian);
    }

    if (middleName) {
        middleName.value = getGuardianMiddleName(guardian);
    }

    if (lastName) {
        lastName.value = getGuardianLastName(guardian);
    }

    if (relationship) {
        relationship.value = getGuardianRelationship(guardian);
    }

    if (phone) {
        phone.value = getGuardianPhone(guardian);
    }

    if (alternativePhone) {
        alternativePhone.value =
            guardian.alternativePhone ||
            guardian.alternative_phone ||
            "";
    }

    if (email) {
        email.value = getGuardianEmail(guardian);
    }

    if (occupation) {
        occupation.value = getGuardianOccupation(guardian);
    }

    if (employer) {
        employer.value = guardian.employer || "";
    }

    if (address) {
        address.value = getGuardianAddress(guardian);
    }

    if (emergencyContact) {
        emergencyContact.value =
            getGuardianEmergencyContact(guardian);
    }

    clearSelectedStudent();
    setFormMode("edit");
    openGuardianModal();
}

/* ==========================================================================
   STUDENT SEARCH CONTROL
   ========================================================================== */

function ensureStudentSearchControl() {
    var studentSelect = getElement("studentId");

    if (!studentSelect) {
        console.warn(
            "studentId select was not found. Student linking will remain unavailable."
        );
        return;
    }

    if (getElement("studentSearchInput")) {
        return;
    }

    var wrapper = studentSelect.parentElement;

    if (!wrapper) {
        return;
    }

    var searchLabel = document.createElement("label");
    searchLabel.className = "form-label mt-2";
    searchLabel.setAttribute(
        "for",
        "studentSearchInput"
    );
    searchLabel.textContent =
        "Search Student by Student Number";

    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "form-control";
    searchInput.id = "studentSearchInput";
    searchInput.placeholder =
        "Enter student number e.g. LMC001";
    searchInput.autocomplete = "off";
    searchInput.setAttribute(
        "aria-describedby",
        "studentSearchHelp"
    );

    var helpText = document.createElement("div");
    helpText.className = "form-text";
    helpText.id = "studentSearchHelp";
    helpText.textContent =
        "Type the student's number to find the student.";

    wrapper.insertBefore(searchLabel, studentSelect);
    wrapper.insertBefore(helpText, studentSelect);
    wrapper.insertBefore(searchInput, helpText);

    var existingHelp = wrapper.querySelector(
        ".form-text:not(#studentSearchHelp)"
    );

    if (existingHelp) {
        existingHelp.style.marginTop = "4px";
    }

    searchInput.addEventListener(
        "input",
        handleStudentSearchInput
    );

    studentSelect.addEventListener(
        "change",
        handleStudentSelection
    );
}

function getStudentSearchInput() {
    return getElement("studentSearchInput");
}

function getStudentSelect() {
    return getElement("studentId");
}

function clearStudentSearchResults() {
    var select = getStudentSelect();

    if (!select) {
        return;
    }

    while (select.options.length > 1) {
        select.remove(1);
    }

    select.value = "";
}

function clearSelectedStudent() {
    selectedStudentId = "";
    selectedStudent = null;

    var searchInput = getStudentSearchInput();
    var select = getStudentSelect();

    if (searchInput) {
        searchInput.value = "";
    }

    if (select) {
        clearStudentSearchResults();
        select.value = "";
    }
}

function showStudentSearchStatus(message, type) {
    var select = getStudentSelect();

    if (!select) {
        return;
    }

    clearStudentSearchResults();

    var option = document.createElement("option");
    option.value = "";
    option.disabled = true;
    option.textContent = message;

    if (type === "error") {
        option.className = "text-danger";
    }

    select.appendChild(option);
    select.value = "";
}

function populateStudentResults(students) {
    var select = getStudentSelect();

    if (!select) {
        return;
    }

    clearStudentSearchResults();

    if (!students.length) {
        showStudentSearchStatus(
            "No matching student found.",
            "error"
        );
        return;
    }

    var placeholder = select.options[0];

    if (placeholder) {
        placeholder.textContent =
            students.length === 1
                ? "Select matching student"
                : "Select a student";
    }

    students.forEach(function (student) {
        var id = getStudentId(student);
        var number = getStudentNumber(student);
        var name = getStudentName(student);
        var level = getStudentLevel(student);

        if (!id) {
            return;
        }

        var option = document.createElement("option");

        option.value = id;

        option.textContent =
            (number ? number + " — " : "") +
            (name || "Unnamed Student") +
            (level ? " (" + level + ")" : "");

        option.dataset.studentId = id;
        option.dataset.studentNumber = number;

        select.appendChild(option);
    });

    if (students.length === 1) {
        select.selectedIndex = 1;
        handleStudentSelection();
    }
}

async function searchStudents(searchTerm) {
    var term = String(searchTerm || "").trim();

    if (!term) {
        clearSelectedStudent();
        return;
    }

    if (term.length < 2) {
        showStudentSearchStatus(
            "Enter at least 2 characters to search."
        );
        return;
    }

    showStudentSearchStatus("Searching students...");

    try {
        var encodedTerm = encodeURIComponent(term);

        var data = await request(
            "/students/search?q=" + encodedTerm,
            {
                method: "GET"
            }
        );

        var students = normalizeStudentList(data);

        populateStudentResults(students);

        console.log(
            "Student search completed:",
            term,
            students.length
        );
    } catch (error) {
        console.error(
            "Unable to search students:",
            error
        );

        showStudentSearchStatus(
            "Unable to search students.",
            "error"
        );

        showMessage(error.message, "error");
    }
}

function handleStudentSearchInput(event) {
    var input = event.target;
    var value = String(input.value || "").trim();

    selectedStudentId = "";
    selectedStudent = null;

    if (studentSearchTimer) {
        clearTimeout(studentSearchTimer);
    }

    if (!value) {
        clearSelectedStudent();
        return;
    }

    studentSearchTimer = setTimeout(function () {
        searchStudents(value);
    }, 350);
}

function handleStudentSelection(event) {
    var select =
        event && event.target
            ? event.target
            : getStudentSelect();

    if (!select) {
        return;
    }

    var value = String(select.value || "").trim();

    if (!value) {
        selectedStudentId = "";
        selectedStudent = null;
        return;
    }

    var option = select.options[select.selectedIndex];

    selectedStudentId = value;

    selectedStudent = {
        id: value,
        student_number: option
            ? option.dataset.studentNumber || ""
            : ""
    };

    console.log(
        "Guardian student selected:",
        selectedStudentId
    );
}

function getSelectedStudentId() {
    var select = getStudentSelect();

    if (select && select.value) {
        return String(select.value).trim();
    }

    return String(selectedStudentId || "").trim();
}

function validateSelectedStudent() {
    if (editingGuardianId) {
        return true;
    }

    var studentId = getSelectedStudentId();

    if (!studentId) {
        showMessage(
            "Please search for and select the student this guardian belongs to.",
            "error"
        );

        var searchInput = getStudentSearchInput();

        if (searchInput) {
            searchInput.focus();
        }

        return false;
    }

    return true;
}

async function linkGuardianToStudent(
    guardianId,
    studentId
) {
    if (!guardianId) {
        throw new Error(
            "The new guardian does not have a valid ID."
        );
    }

    if (!studentId) {
        throw new Error(
            "No student was selected for this guardian."
        );
    }

    return request(
        "/guardians/link-student",
        {
            method: "POST",
            body: JSON.stringify({
                guardianId: guardianId,
                studentId: studentId,
                isPrimary: false
            })
        }
    );
}

/* ==========================================================================
   DATA NORMALIZATION
   ========================================================================== */

function normalizeGuardianList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (!data || typeof data !== "object") {
        return [];
    }

    if (Array.isArray(data.guardians)) {
        return data.guardians;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    if (
        data.data &&
        Array.isArray(data.data.guardians)
    ) {
        return data.data.guardians;
    }

    if (Array.isArray(data.rows)) {
        return data.rows;
    }

    return [];
}

function normalizeGuardianResponse(data) {
    if (!data) {
        return null;
    }

    if (data.guardian) {
        return data.guardian;
    }

    if (
        data.data &&
        data.data.guardian
    ) {
        return data.data.guardian;
    }

    if (
        data.data &&
        !Array.isArray(data.data)
    ) {
        return data.data;
    }

    if (data.id) {
        return data;
    }

    return null;
}

/* ==========================================================================
   LOAD GUARDIANS
   ========================================================================== */

async function loadGuardians() {
    var tableBody = getElement("guardiansTableBody");

    if (tableBody) {
        tableBody.innerHTML =
            '<tr>' +
            '<td colspan="8" class="text-center py-4">' +
            "Loading guardians..." +
            "</td>" +
            "</tr>";
    }

    try {
        var data = await request(
            "/guardians",
            {
                method: "GET"
            }
        );

        guardians = normalizeGuardianList(data);

        renderGuardians();
        updateSummary();

        console.log(
            "Guardians loaded:",
            guardians.length
        );
    } catch (error) {
        console.error(
            "Unable to load guardians:",
            error
        );

        guardians = [];

        renderGuardians();
        updateSummary();

        if (tableBody) {
            tableBody.innerHTML =
                '<tr>' +
                '<td colspan="8" class="text-center text-danger py-4">' +
                escapeHtml(error.message) +
                "</td>" +
                "</tr>";
        }
    }
}

/* ==========================================================================
   SEARCH AND FILTER
   ========================================================================== */

function getSearchValue() {
    var input = getElement("searchInput");

    if (!input) {
        return "";
    }

    return String(input.value || "")
        .trim()
        .toLowerCase();
}

function getRelationshipFilterValue() {
    var select = getElement(
        "relationshipFilter"
    );

    if (!select) {
        return "";
    }

    return String(select.value || "")
        .trim()
        .toLowerCase();
}

function filterGuardians() {
    var search = getSearchValue();
    var relationship =
        getRelationshipFilterValue();

    return guardians.filter(function (guardian) {
        var searchableText = [
            getGuardianName(guardian),
            getGuardianRelationship(guardian),
            getGuardianPhone(guardian),
            getGuardianEmail(guardian),
            getGuardianOccupation(guardian),
            guardian.employer || "",
            getGuardianAddress(guardian),
            getGuardianEmergencyContact(guardian)
        ]
            .join(" ")
            .toLowerCase();

        var matchesSearch =
            !search ||
            searchableText.indexOf(search) !== -1;

        var guardianRelationship =
            getGuardianRelationship(guardian)
                .trim()
                .toLowerCase();

        var matchesRelationship =
            !relationship ||
            guardianRelationship === relationship;

        return (
            matchesSearch &&
            matchesRelationship
        );
    });
}

/* ==========================================================================
   SUMMARY
   ========================================================================== */

function updateSummary() {
    var totalElement =
        getElement("totalGuardians");

    var linkedElement =
        getElement("linkedGuardians");

    var primaryElement =
        getElement("primaryGuardians");

    var studentsElement =
        getElement("linkedStudents");

    var total = guardians.length;

    /*
       IMPORTANT:
       We only use relationship information that the existing
       /api/guardians response actually provides.

       We do NOT assume that Father/Mother/Guardian automatically
       means "primary".
    */

    var linked = guardians.filter(
        function (guardian) {
            return guardianHasLinkedStudent(
                guardian
            );
        }
    ).length;

    var primary = guardians.filter(
        function (guardian) {
            return (
                guardian.isPrimary === true ||
                guardian.is_primary === true ||
                guardian.primary === true
            );
        }
    ).length;

    var linkedStudents = guardians.reduce(
        function (totalCount, guardian) {
            return (
                totalCount +
                getGuardianStudentCount(
                    guardian
                )
            );
        },
        0
    );

    if (totalElement) {
        totalElement.textContent =
            String(total);
    }

    if (linkedElement) {
        linkedElement.textContent =
            String(linked);
    }

    if (primaryElement) {
        primaryElement.textContent =
            String(primary);
    }

    if (studentsElement) {
        studentsElement.textContent =
            String(linkedStudents);
    }

    console.log(
        "Guardian summary updated:",
        {
            totalGuardians: total,
            linkedGuardians: linked,
            primaryGuardians: primary,
            linkedStudents: linkedStudents
        }
    );
}

/* ==========================================================================
   TABLE RENDERING
   ========================================================================== */

function renderGuardians() {
    var tableBody =
        getElement("guardiansTableBody");

    if (!tableBody) {
        console.error(
            "guardiansTableBody was not found."
        );
        return;
    }

    var filteredGuardians =
        filterGuardians();

    if (filteredGuardians.length === 0) {
        tableBody.innerHTML =
            '<tr>' +
            '<td colspan="8" class="text-center py-4 text-muted">' +
            "No guardians found." +
            "</td>" +
            "</tr>";

        return;
    }

    tableBody.innerHTML =
        filteredGuardians
            .map(function (guardian) {
                return renderGuardianRow(
                    guardian
                );
            })
            .join("");
}

function renderGuardianRow(guardian) {
    var id = getGuardianId(guardian);

    var name =
        getGuardianName(guardian) ||
        "Unnamed Guardian";

    var relationship =
        getGuardianRelationship(guardian) ||
        "—";

    var phone =
        getGuardianPhone(guardian) ||
        "—";

    var email =
        getGuardianEmail(guardian) ||
        "—";

    var occupation =
        getGuardianOccupation(guardian) ||
        "—";

    var studentCount =
        getGuardianStudentCount(
            guardian
        );

    var status =
        guardian.status ||
        (
            studentCount > 0
                ? "Linked"
                : "Unlinked"
        );

    var photo =
        guardian.profilePhotoUrl ||
        guardian.profile_photo_url ||
        guardian.photoUrl ||
        guardian.photo_url ||
        "";

    var avatarHtml;

    if (photo) {
        avatarHtml =
            '<img src="' +
            escapeHtml(photo) +
            '" alt="' +
            escapeHtml(name) +
            '" class="rounded-circle" width="42" height="42" style="object-fit:cover;">';
    } else {
        var initials = name
            .split(/\s+/)
            .filter(function (part) {
                return part;
            })
            .slice(0, 2)
            .map(function (part) {
                return part
                    .charAt(0)
                    .toUpperCase();
            })
            .join("");

        avatarHtml =
            '<div class="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" ' +
            'style="width:42px;height:42px;">' +
            escapeHtml(initials || "G") +
            "</div>";
    }

    return (
        '<tr data-guardian-id="' +
        escapeHtml(id) +
        '">' +

        "<td>" +

        '<div class="d-flex align-items-center gap-2">' +

        avatarHtml +

        "<div>" +

        '<div class="fw-semibold">' +
        escapeHtml(name) +
        "</div>" +

        "</div>" +

        "</div>" +

        "</td>" +

        "<td>" +
        escapeHtml(relationship) +
        "</td>" +

        "<td>" +
        escapeHtml(phone) +
        "</td>" +

        "<td>" +
        escapeHtml(email) +
        "</td>" +

        "<td>" +
        escapeHtml(occupation) +
        "</td>" +

        "<td>" +
        escapeHtml(
            String(studentCount)
        ) +
        "</td>" +

        "<td>" +

        '<span class="badge ' +
        (
            studentCount > 0
                ? "bg-success"
                : "bg-secondary"
        ) +
        '">' +

        escapeHtml(status) +

        "</span>" +

        "</td>" +

        "<td>" +

        '<div class="btn-group btn-group-sm" role="group">' +

        '<button type="button" class="btn btn-outline-primary guardian-edit-button" ' +
        'data-id="' +
        escapeHtml(id) +
        '" title="Edit Guardian">' +

        '<i class="bi bi-pencil"></i>' +

        "</button>" +

        '<button type="button" class="btn btn-outline-danger guardian-delete-button" ' +
        'data-id="' +
        escapeHtml(id) +
        '" title="Delete Guardian">' +

        '<i class="bi bi-trash"></i>' +

        "</button>" +

        "</div>" +

        "</td>" +

        "</tr>"
    );
}

/* ==========================================================================
   FORM DATA
   ========================================================================== */

function collectGuardianFormData() {
    var firstName =
        getElement("firstName");

    var middleName =
        getElement("middleName");

    var lastName =
        getElement("lastName");

    var relationship =
        getElement("relationship");

    var phone =
        getElement("phone");

    var alternativePhone =
        getElement("alternativePhone");

    var email =
        getElement("email");

    var occupation =
        getElement("occupation");

    var employer =
        getElement("employer");

    var address =
        getElement("address");

    var emergencyContact =
        getElement("emergencyContact");

    return {
        firstName: firstName
            ? firstName.value.trim()
            : "",

        middleName: middleName
            ? middleName.value.trim()
            : "",

        lastName: lastName
            ? lastName.value.trim()
            : "",

        relationship: relationship
            ? relationship.value.trim()
            : "",

        phone: phone
            ? phone.value.trim()
            : "",

        alternativePhone: alternativePhone
            ? alternativePhone.value.trim()
            : "",

        email: email
            ? email.value.trim()
            : "",

        occupation: occupation
            ? occupation.value.trim()
            : "",

        employer: employer
            ? employer.value.trim()
            : "",

        address: address
            ? address.value.trim()
            : "",

        emergencyContact: emergencyContact
            ? emergencyContact.value.trim()
            : ""
    };
}

function validateGuardianForm(data) {
    if (!data.firstName) {
        showMessage(
            "Please enter the guardian's first name.",
            "error"
        );

        var firstName =
            getElement("firstName");

        if (firstName) {
            firstName.focus();
        }

        return false;
    }

    if (!data.lastName) {
        showMessage(
            "Please enter the guardian's last name.",
            "error"
        );

        var lastName =
            getElement("lastName");

        if (lastName) {
            lastName.focus();
        }

        return false;
    }

    if (!data.relationship) {
        showMessage(
            "Please select the guardian relationship.",
            "error"
        );

        var relationship =
            getElement("relationship");

        if (relationship) {
            relationship.focus();
        }

        return false;
    }

    if (!validateSelectedStudent()) {
        return false;
    }

    return true;
}

/* ==========================================================================
   CREATE / UPDATE
   ========================================================================== */

async function handleSubmit(event) {
    if (event) {
        event.preventDefault();
    }

    var data =
        collectGuardianFormData();

    if (!validateGuardianForm(data)) {
        return;
    }

    var saveButton =
        getElement("saveGuardianButton");

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.dataset.originalText =
            saveButton.textContent;

        saveButton.textContent =
            editingGuardianId
                ? "Updating..."
                : "Saving...";
    }

    var wasEditing =
        Boolean(editingGuardianId);

    try {
        var endpoint = "/guardians";
        var method = "POST";

        if (editingGuardianId) {
            endpoint +=
                "/" +
                encodeURIComponent(
                    editingGuardianId
                );

            method = "PUT";
        }

        var response =
            await request(
                endpoint,
                {
                    method: method,
                    body: JSON.stringify(data)
                }
            );

        var savedGuardian =
            normalizeGuardianResponse(
                response
            );

        if (wasEditing) {
            guardians =
                guardians.map(
                    function (guardian) {
                        return getGuardianId(
                            guardian
                        ) ===
                            editingGuardianId
                            ? (
                                savedGuardian ||
                                Object.assign(
                                    {},
                                    guardian,
                                    data
                                )
                            )
                            : guardian;
                    }
                );

            showMessage(
                "Guardian updated successfully.",
                "success"
            );
        } else {
            var guardianId =
                savedGuardian
                    ? getGuardianId(
                        savedGuardian
                    )
                    : "";

            if (!guardianId) {
                throw new Error(
                    "Guardian was created, but the server did not return the new guardian ID. The student could not be linked."
                );
            }

            var studentId =
                getSelectedStudentId();

            await linkGuardianToStudent(
                guardianId,
                studentId
            );

            showMessage(
                "Guardian added and linked to the selected student successfully.",
                "success"
            );
        }

        closeGuardianModal();

        await loadGuardians();
    } catch (error) {
        console.error(
            "Unable to save guardian:",
            error
        );

        showMessage(
            error.message ||
                "Unable to save guardian.",
            "error"
        );
    } finally {
        if (saveButton) {
            saveButton.disabled = false;

            saveButton.textContent =
                saveButton.dataset.originalText ||
                (
                    wasEditing
                        ? "Update Guardian"
                        : "Save Guardian"
                );
        }
    }
}

/* ==========================================================================
   DELETE
   ========================================================================== */

async function deleteGuardian(id) {
    if (!id) {
        return;
    }

    var guardian =
        guardians.find(
            function (item) {
                return (
                    getGuardianId(item) ===
                    id
                );
            }
        );

    var name =
        guardian
            ? getGuardianName(guardian)
            : "this guardian";

    var confirmed = window.confirm(
        "Are you sure you want to delete " +
        (name || "this guardian") +
        "?"
    );

    if (!confirmed) {
        return;
    }

    try {
        await request(
            "/guardians/" +
                encodeURIComponent(id),
            {
                method: "DELETE"
            }
        );

        guardians =
            guardians.filter(
                function (item) {
                    return (
                        getGuardianId(item) !==
                        id
                    );
                }
            );

        renderGuardians();
        updateSummary();

        showMessage(
            "Guardian deleted successfully.",
            "success"
        );
    } catch (error) {
        console.error(
            "Unable to delete guardian:",
            error
        );

        showMessage(
            error.message,
            "error"
        );
    }
}

/* ==========================================================================
   EVENT HANDLERS
   ========================================================================== */

function handleTableClick(event) {
    var editButton =
        event.target.closest(
            ".guardian-edit-button"
        );

    if (editButton) {
        var editId =
            editButton.getAttribute(
                "data-id"
            );

        var editGuardian =
            guardians.find(
                function (guardian) {
                    return (
                        getGuardianId(
                            guardian
                        ) === editId
                    );
                }
            );

        if (editGuardian) {
            openEditGuardianModal(
                editGuardian
            );
        }

        return;
    }

    var deleteButton =
        event.target.closest(
            ".guardian-delete-button"
        );

    if (deleteButton) {
        var deleteId =
            deleteButton.getAttribute(
                "data-id"
            );

        if (deleteId) {
            deleteGuardian(deleteId);
        }
    }
}

function handleModalClick(event) {
    var modal = getGuardianModal();

    if (!modal) {
        return;
    }

    if (event.target === modal) {
        closeGuardianModal();
    }
}

function handleEscape(event) {
    if (event.key !== "Escape") {
        return;
    }

    var modal = getGuardianModal();

    if (modal && !modal.hidden) {
        closeGuardianModal();
    }
}

/* ==========================================================================
   EVENTS SETUP
   ========================================================================== */

function setupEvents() {
    var addButton =
        getElement("addGuardianButton");

    var cancelButton =
        getElement("cancelGuardianButton");

    var closeButton =
        getElement(
            "closeGuardianModalButton"
        );

    var form =
        getElement("guardianForm");

    var searchInput =
        getElement("searchInput");

    var relationshipFilter =
        getElement(
            "relationshipFilter"
        );

    var refreshButton =
        getElement("refreshButton");

    var tableBody =
        getElement(
            "guardiansTableBody"
        );

    var modal =
        getGuardianModal();

    ensureStudentSearchControl();

    if (
        addButton &&
        !addButton.dataset.guardianEventsAttached
    ) {
        addButton.addEventListener(
            "click",
            openAddGuardianModal
        );

        addButton.dataset.guardianEventsAttached =
            "true";
    }

    if (
        cancelButton &&
        !cancelButton.dataset.guardianEventsAttached
    ) {
        cancelButton.addEventListener(
            "click",
            closeGuardianModal
        );

        cancelButton.dataset.guardianEventsAttached =
            "true";
    }

    if (
        closeButton &&
        !closeButton.dataset.guardianEventsAttached
    ) {
        closeButton.addEventListener(
            "click",
            closeGuardianModal
        );

        closeButton.dataset.guardianEventsAttached =
            "true";
    }

    if (
        form &&
        !form.dataset.guardianEventsAttached
    ) {
        form.addEventListener(
            "submit",
            handleSubmit
        );

        form.dataset.guardianEventsAttached =
            "true";
    }

    if (
        searchInput &&
        !searchInput.dataset.guardianEventsAttached
    ) {
        searchInput.addEventListener(
            "input",
            renderGuardians
        );

        searchInput.dataset.guardianEventsAttached =
            "true";
    }

    if (
        relationshipFilter &&
        !relationshipFilter.dataset.guardianEventsAttached
    ) {
        relationshipFilter.addEventListener(
            "change",
            renderGuardians
        );

        relationshipFilter.dataset.guardianEventsAttached =
            "true";
    }

    if (
        refreshButton &&
        !refreshButton.dataset.guardianEventsAttached
    ) {
        refreshButton.addEventListener(
            "click",
            loadGuardians
        );

        refreshButton.dataset.guardianEventsAttached =
            "true";
    }

    if (
        tableBody &&
        !tableBody.dataset.guardianEventsAttached
    ) {
        tableBody.addEventListener(
            "click",
            handleTableClick
        );

        tableBody.dataset.guardianEventsAttached =
            "true";
    }

    if (
        modal &&
        !modal.dataset.guardianEventsAttached
    ) {
        modal.addEventListener(
            "click",
            handleModalClick
        );

        modal.dataset.guardianEventsAttached =
            "true";
    }

    if (
        !document.body.dataset.guardianEscapeAttached
    ) {
        document.addEventListener(
            "keydown",
            handleEscape
        );

        document.body.dataset.guardianEscapeAttached =
            "true";
    }
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

async function initialize() {
    if (initialized) {
        return;
    }

    initialized = true;

    console.log(
        "Initializing Guardian module..."
    );

    ensureModalClosed();

    setupEvents();

    await loadGuardians();

    console.log(
        "Guardian module initialized successfully."
    );
}

/* ==========================================================================
   PUBLIC API
   ========================================================================== */

window.GuardiansPage = {
    initialize: initialize,
    loadGuardians: loadGuardians,
    renderGuardians: renderGuardians,
    updateSummary: updateSummary,
    openGuardianModal: openGuardianModal,
    closeGuardianModal: closeGuardianModal,
    openAddGuardianModal: openAddGuardianModal,
    openEditGuardianModal: openEditGuardianModal,
    resetForm: resetForm,
    searchStudents: searchStudents,
    linkGuardianToStudent: linkGuardianToStudent
};

/* ==========================================================================
   START
   ========================================================================== */

if (document.readyState === "loading") {
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