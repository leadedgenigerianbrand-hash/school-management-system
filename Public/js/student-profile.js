```javascript
"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| STUDENT PROFILE JAVASCRIPT
|--------------------------------------------------------------------------
*/

const STUDENT_API = "/students";

document.addEventListener(
    "DOMContentLoaded",
    initializeStudentProfile,
    { once: true }
);

async function initializeStudentProfile() {
    if (typeof protectPage === "function") {
        const protectedResult = await protectPage();

        if (protectedResult === false) {
            return;
        }
    }

    const studentId = getStudentIdFromUrl();

    if (!studentId) {
        showProfileError("No student ID was supplied.");
        return;
    }

    initializeProfileButtons(studentId);

    await loadStudentProfile(studentId);
}

function getStudentIdFromUrl() {
    const params = new URLSearchParams(
        window.location.search
    );

    return (
        params.get("id") ||
        params.get("student_id") ||
        params.get("studentId")
    );
}

async function loadStudentProfile(studentId) {
    showProfileLoading();

    try {
        const data = await request(
            `${STUDENT_API}/${encodeURIComponent(studentId)}`
        );

        const student = extractStudent(data);

        if (!student) {
            throw new Error(
                "Student record was not found."
            );
        }

        renderStudentProfile(student);

        hideProfileLoading();
        showProfileContent();

    } catch (error) {
        console.error(
            "Load student profile error:",
            error
        );

        hideProfileLoading();

        showProfileError(
            error.message ||
            "Unable to load student profile."
        );
    }
}

async function request(endpoint, options = {}) {
    if (typeof window.apiRequest === "function") {
        return window.apiRequest(
            endpoint,
            options
        );
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
        localStorage.getItem(
            "school_management_token"
        ) ||
        sessionStorage.getItem(
            "school_management_token"
        ) ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        "";

    const headers = {
        Accept: "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers["Content-Type"] &&
        !headers["content-type"]
    ) {
        headers["Content-Type"] =
            "application/json";
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
            "Student profile API error:",
            error
        );

        throw new Error(
            "Unable to connect to the server."
        );
    }

    if (response.status === 401) {
        if (
            typeof window.clearApiAuthentication ===
            "function"
        ) {
            window.clearApiAuthentication();
        } else {
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
        }

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
            "You do not have permission to view this student."
        );
    }

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    const data =
        contentType.includes(
            "application/json"
        )
            ? await response.json()
            : await response.text();

    if (!response.ok) {
        throw new Error(
            typeof data === "object"
                ? data?.message ||
                  data?.error ||
                  "Unable to load student profile."
                : data ||
                  "Unable to load student profile."
        );
    }

    return data;
}

function extractStudent(response) {
    if (!response) {
        return null;
    }

    if (
        response.id ||
        response.student_id
    ) {
        return response;
    }

    if (response.student) {
        return response.student;
    }

    if (
        response.data &&
        !Array.isArray(response.data)
    ) {
        if (response.data.student) {
            return response.data.student;
        }

        return response.data;
    }

    return null;
}

function renderStudentProfile(student) {
    renderSummary(student);

    renderPersonalInformation(student);

    renderAcademicInformation(student);

    renderGuardians(
        getGuardians(student)
    );

    renderDocuments(
        getDocuments(student)
    );

    renderRecordInformation(student);
}

function renderSummary(student) {
    const name =
        getStudentName(student);

    const admissionNumber =
        getField(
            student,
            "admission_number",
            "admissionNumber"
        );

    const status =
        getField(
            student,
            "status",
            "status"
        ) || "active";

    setText(
        "studentName",
        name || "Unknown Student"
    );

    setText(
        "studentAdmissionNumber",
        valueOrDash(admissionNumber)
    );

    const statusElement =
        document.getElementById(
            "studentStatus"
        );

    if (statusElement) {
        statusElement.textContent =
            status;

        statusElement.className =
            `status ${getStatusClass(status)}`;
    }

    renderStudentPhoto(student);

    renderStudentInitials(name);
}

function renderPersonalInformation(student) {
    setText(
        "firstName",
        getField(
            student,
            "first_name",
            "firstName"
        )
    );

    setText(
        "middleName",
        getField(
            student,
            "middle_name",
            "middleName"
        )
    );

    setText(
        "lastName",
        getField(
            student,
            "last_name",
            "lastName"
        )
    );

    setText(
        "gender",
        getField(
            student,
            "gender",
            "gender"
        )
    );

    const dateOfBirth =
        getField(
            student,
            "date_of_birth",
            "dateOfBirth"
        );

    setText(
        "dateOfBirth",
        formatDate(dateOfBirth)
    );

    setText(
        "age",
        calculateAge(dateOfBirth)
    );

    setText(
        "phone",
        getField(
            student,
            "phone",
            "phone"
        )
    );

    setText(
        "email",
        getField(
            student,
            "email",
            "email"
        )
    );

    const address =
        getField(
            student,
            "residential_address",
            "residentialAddress"
        ) ||
        getField(
            student,
            "address",
            "address"
        ) ||
        getField(
            student,
            "home_address",
            "homeAddress"
        );

    setText(
        "address",
        address
    );

    setText(
        "stateOfOrigin",
        getField(
            student,
            "state_of_origin",
            "stateOfOrigin"
        )
    );

    setText(
        "localGovernment",
        getField(
            student,
            "local_government_area",
            "localGovernmentArea"
        ) ||
        getField(
            student,
            "lga",
            "lga"
        )
    );

    setText(
        "nationality",
        getField(
            student,
            "nationality",
            "nationality"
        )
    );

    setText(
        "religion",
        getField(
            student,
            "religion",
            "religion"
        )
    );

    setText(
        "bloodGroup",
        getField(
            student,
            "blood_group",
            "bloodGroup"
        )
    );

    setText(
        "genotype",
        getField(
            student,
            "genotype",
            "genotype"
        )
    );
}

function renderAcademicInformation(student) {
    setText(
        "academicAdmissionNumber",
        getField(
            student,
            "admission_number",
            "admissionNumber"
        )
    );

    const className =
        getField(
            student,
            "class_name",
            "className"
        ) ||
        getField(
            student,
            "class",
            "class"
        );

    setText(
        "className",
        className
    );

    const classArm =
        getField(
            student,
            "class_arm_name",
            "classArmName"
        ) ||
        getField(
            student,
            "class_arm",
            "classArm"
        );

    setText(
        "classArm",
        classArm
    );

    const session =
        getField(
            student,
            "academic_session_name",
            "academicSessionName"
        ) ||
        getField(
            student,
            "session_name",
            "sessionName"
        ) ||
        getField(
            student,
            "academic_session",
            "academicSession"
        );

    setText(
        "academicSession",
        session
    );

    const academicLevel =
        getField(
            student,
            "academic_level_name",
            "academicLevelName"
        ) ||
        getField(
            student,
            "level_name",
            "levelName"
        ) ||
        getField(
            student,
            "academic_level",
            "academicLevel"
        );

    setText(
        "academicLevel",
        academicLevel
    );

    const department =
        getField(
            student,
            "department_name",
            "departmentName"
        ) ||
        getField(
            student,
            "department",
            "department"
        );

    setText(
        "department",
        department
    );

    setText(
        "house",
        getField(
            student,
            "house",
            "house"
        )
    );

    const admissionDate =
        getField(
            student,
            "admission_date",
            "admissionDate"
        );

    setText(
        "admissionDate",
        formatDate(admissionDate)
    );
}

function getGuardians(student) {
    return (
        student.guardians ||
        student.guardian ||
        student.student_guardians ||
        []
    );
}

function renderGuardians(guardians) {
    const container =
        document.getElementById(
            "guardiansContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(guardians) ||
        guardians.length === 0
    ) {
        container.innerHTML = `
            <div class="empty-state">
                No guardian information available.
            </div>
        `;

        return;
    }

    guardians.forEach(
        (guardian) => {
            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "guardian-card";

            const name =
                guardian.full_name ||
                guardian.fullName ||
                guardian.name ||
                "Unknown Guardian";

            const relationship =
                guardian.relationship ||
                guardian.relationship_name ||
                "Guardian";

            const phone =
                guardian.phone ||
                guardian.phone_number ||
                guardian.phoneNumber;

            const email =
                guardian.email;

            const isPrimary =
                guardian.is_primary === true ||
                guardian.isPrimary === true;

            card.innerHTML = `
                <strong>
                    ${escapeHtml(name)}
                </strong>

                <span>
                    Relationship:
                    ${escapeHtml(
                        valueOrDash(
                            relationship
                        )
                    )}
                </span>

                <span>
                    Phone:
                    ${escapeHtml(
                        valueOrDash(phone)
                    )}
                </span>

                <span>
                    Email:
                    ${escapeHtml(
                        valueOrDash(email)
                    )}
                </span>

                ${
                    isPrimary
                        ? `
                            <span class="guardian-primary">
                                Primary Guardian
                            </span>
                        `
                        : ""
                }
            `;

            container.appendChild(card);
        }
    );
}

function getDocuments(student) {
    return (
        student.documents ||
        student.student_documents ||
        []
    );
}

function renderDocuments(documents) {
    const container =
        document.getElementById(
            "documentsContainer"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(documents) ||
        documents.length === 0
    ) {
        container.innerHTML = `
            <div class="empty-state">
                No documents available.
            </div>
        `;

        return;
    }

    documents.forEach(
        (documentItem) => {
            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "document-card";

            const name =
                documentItem.document_name ||
                documentItem.documentName ||
                documentItem.name ||
                documentItem.title ||
                "Student Document";

            const type =
                documentItem.document_type ||
                documentItem.documentType ||
                documentItem.type ||
                "Document";

            const url =
                documentItem.file_url ||
                documentItem.fileUrl ||
                documentItem.url ||
                documentItem.path;

            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "document-info";

            info.innerHTML = `
                <strong>
                    ${escapeHtml(name)}
                </strong>

                <span>
                    ${escapeHtml(type)}
                </span>
            `;

            card.appendChild(info);

            if (url) {
                const link =
                    document.createElement(
                        "a"
                    );

                link.href = normalizeFileUrl(
                    url
                );

                link.target = "_blank";

                link.rel =
                    "noopener noreferrer";

                link.className =
                    "document-link";

                link.textContent = "View";

                card.appendChild(link);
            }

            container.appendChild(card);
        }
    );
}

function normalizeFileUrl(url) {
    const value =
        String(url || "");

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:")
    ) {
        return value;
    }

    if (value.startsWith("/")) {
        return value;
    }

    return "/" + value;
}

function renderRecordInformation(student) {
    const studentId =
        getField(
            student,
            "id",
            "studentId"
        ) ||
        getField(
            student,
            "student_id",
            "studentId"
        );

    setText(
        "studentId",
        studentId
    );

    setText(
        "createdAt",
        formatDateTime(
            getField(
                student,
                "created_at",
                "createdAt"
            )
        )
    );

    setText(
        "updatedAt",
        formatDateTime(
            getField(
                student,
                "updated_at",
                "updatedAt"
            )
        )
    );
}

function renderStudentPhoto(student) {
    const image =
        document.getElementById(
            "studentPhoto"
        );

    if (!image) {
        return;
    }

    const photo =
        getField(
            student,
            "photo_url",
            "photoUrl"
        ) ||
        getField(
            student,
            "photo",
            "photo"
        ) ||
        getField(
            student,
            "profile_photo",
            "profilePhoto"
        ) ||
        getField(
            student,
            "image_url",
            "imageUrl"
        );

    if (!photo) {
        image.hidden = true;
        return;
    }

    image.src =
        normalizeFileUrl(photo);

    image.hidden = false;

    image.onerror = function () {
        image.hidden = true;
    };
}

function renderStudentInitials(name) {
    const element =
        document.getElementById(
            "studentInitials"
        );

    if (!element) {
        return;
    }

    const words =
        String(
            name || "Student"
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    let initials = "ST";

    if (words.length === 1) {
        initials =
            words[0]
                .substring(0, 2)
                .toUpperCase();
    } else if (words.length >= 2) {
        initials =
            (
                words[0][0] +
                words[words.length - 1][0]
            ).toUpperCase();
    }

    element.textContent =
        initials;
}

function initializeProfileButtons(studentId) {
    const encodedId =
        encodeURIComponent(studentId);

    const backButton =
        document.getElementById(
            "backButton"
        );

    if (backButton) {
        backButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    "/pages/students.html";
            },
            { once: true }
        );
    }

    const editButton =
        document.getElementById(
            "editStudentButton"
        );

    if (editButton) {
        editButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    `/pages/student-form.html?id=${encodedId}`;
            },
            { once: true }
        );
    }

    const attendanceButton =
        document.getElementById(
            "attendanceButton"
        );

    if (attendanceButton) {
        attendanceButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    `/pages/student-attendance.html?id=${encodedId}`;
            },
            { once: true }
        );
    }

    const feesButton =
        document.getElementById(
            "feesButton"
        );

    if (feesButton) {
        feesButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    `/pages/student-fees.html?id=${encodedId}`;
            },
            { once: true }
        );
    }

    const resultsButton =
        document.getElementById(
            "resultsButton"
        );

    if (resultsButton) {
        resultsButton.addEventListener(
            "click",
            () => {
                window.location.href =
                    `/pages/student-results.html?id=${encodedId}`;
            },
            { once: true }
        );
    }

    const retryButton =
        document.getElementById(
            "retryButton"
        );

    if (retryButton) {
        retryButton.addEventListener(
            "click",
            () => {
                loadStudentProfile(
                    studentId
                );
            }
        );
    }
}

function getStudentName(student) {
    if (student.name) {
        return student.name;
    }

    if (student.full_name) {
        return student.full_name;
    }

    if (student.fullName) {
        return student.fullName;
    }

    return [
        getField(
            student,
            "first_name",
            "firstName"
        ),

        getField(
            student,
            "middle_name",
            "middleName"
        ),

        getField(
            student,
            "last_name",
            "lastName"
        )
    ]
        .filter(Boolean)
        .join(" ");
}

function getField(
    object,
    snakeCase,
    camelCase
) {
    if (!object) {
        return null;
    }

    if (snakeCase === camelCase) {
        return object[snakeCase];
    }

    return (
        object[snakeCase] ??
        object[camelCase]
    );
}

function valueOrDash(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    return String(value);
}

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        valueOrDash(value);
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return new Intl.DateTimeFormat(
        "en-NG",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    ).format(date);
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return new Intl.DateTimeFormat(
        "en-NG",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(date);
}

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) {
        return "—";
    }

    const birth =
        new Date(dateOfBirth);

    if (
        Number.isNaN(
            birth.getTime()
        )
    ) {
        return "—";
    }

    const today =
        new Date();

    let age =
        today.getFullYear() -
        birth.getFullYear();

    const monthDifference =
        today.getMonth() -
        birth.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() <
            birth.getDate()
        )
    ) {
        age--;
    }

    return age >= 0
        ? age
        : "—";
}

function getStatusClass(status) {
    const normalized =
        String(
            status || "active"
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );

    const allowed = [
        "active",
        "inactive",
        "graduated",
        "withdrawn",
        "transferred",
        "suspended"
    ];

    if (
        allowed.includes(
            normalized
        )
    ) {
        return `status-${normalized}`;
    }

    return "status-pending";
}

function escapeHtml(value) {
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

function showProfileLoading() {
    const loading =
        document.getElementById(
            "profileLoading"
        );

    const content =
        document.getElementById(
            "profileContent"
        );

    const error =
        document.getElementById(
            "profileError"
        );

    if (loading) {
        loading.hidden = false;
    }

    if (content) {
        content.hidden = true;
    }

    if (error) {
        error.hidden = true;
    }
}

function hideProfileLoading() {
    const loading =
        document.getElementById(
            "profileLoading"
        );

    if (loading) {
        loading.hidden = true;
    }
}

function showProfileContent() {
    const content =
        document.getElementById(
            "profileContent"
        );

    const error =
        document.getElementById(
            "profileError"
        );

    if (content) {
        content.hidden = false;
    }

    if (error) {
        error.hidden = true;
    }
}

function showProfileError(message) {
    const loading =
        document.getElementById(
            "profileLoading"
        );

    const content =
        document.getElementById(
            "profileContent"
        );

    const error =
        document.getElementById(
            "profileError"
        );

    const errorMessage =
        document.getElementById(
            "profileErrorMessage"
        );

    if (loading) {
        loading.hidden = true;
    }

    if (content) {
        content.hidden = true;
    }

    if (errorMessage) {
        errorMessage.textContent =
            message ||
            "Unable to load student.";
    }

    if (error) {
        error.hidden = false;
    }

    showMessage(
        message ||
        "Unable to load student.",
        "error"
    );
}

function showMessage(
    message,
    type = "info"
) {
    const element =
        document.getElementById(
            "pageMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        `message ${type}`;

    if (type !== "error") {
        setTimeout(
            () => {
                element.className =
                    "message";
            },
            4000
        );
    }
}

window.initializeStudentProfile =
    initializeStudentProfile;

window.loadStudentProfile =
    loadStudentProfile;
