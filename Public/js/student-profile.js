"use strict";

document.addEventListener("DOMContentLoaded", initializeStudentProfile);

/*
|--------------------------------------------------------------------------
| STUDENT PROFILE INITIALIZATION
|--------------------------------------------------------------------------
*/

async function initializeStudentProfile() {
    setupMobileSidebar();
    setupProfileActions();
    await loadStudentProfile();
}

/*
|--------------------------------------------------------------------------
| LOAD STUDENT PROFILE
|--------------------------------------------------------------------------
*/

async function loadStudentProfile() {
    showProfileLoading();

    const studentId = getStudentIdFromUrl();

    if (!studentId) {
        showProfileError(
            "No student ID was provided. Open the profile from the Students page."
        );
        return;
    }

    try {
        const response = await apiRequest(
            "/students/" + encodeURIComponent(studentId),
            {
                method: "GET"
            }
        );

        if (!response || response.success === false) {
            throw new Error(
                response && response.message
                    ? response.message
                    : "Unable to load student profile."
            );
        }

        const student = extractStudent(response);

        if (!student) {
            throw new Error("Student record was not found.");
        }

        populateStudentProfile(student);

        /*
         * Guardian and document information are supplementary.
         * If either request fails, the main student profile can still load.
         */
        await loadGuardians(studentId);
        await loadDocuments(studentId);

        showProfileContent();
    } catch (error) {
        console.error("Student profile loading error:", error);
        showProfileError(getErrorMessage(error));
    }
}

/*
|--------------------------------------------------------------------------
| GET STUDENT ID FROM URL
|--------------------------------------------------------------------------
*/

function getStudentIdFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const id =
        params.get("id") ||
        params.get("studentId") ||
        params.get("student_id");

    if (!id) {
        return null;
    }

    return String(id).trim();
}

/*
|--------------------------------------------------------------------------
| EXTRACT STUDENT FROM API RESPONSE
|--------------------------------------------------------------------------
*/

function extractStudent(response) {
    if (!response) {
        return null;
    }

    if (
        response.id ||
        response.student_id ||
        response.studentId
    ) {
        return response;
    }

    if (response.data) {
        if (
            response.data.id ||
            response.data.student_id ||
            response.data.studentId
        ) {
            return response.data;
        }

        if (response.data.student) {
            return response.data.student;
        }
    }

    if (response.student) {
        return response.student;
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| POPULATE STUDENT PROFILE
|--------------------------------------------------------------------------
*/

function populateStudentProfile(student) {
    const firstName = getValue(
        student,
        ["firstName", "first_name"]
    );

    const middleName = getValue(
        student,
        ["middleName", "middle_name"]
    );

    const lastName = getValue(
        student,
        ["lastName", "last_name"]
    );

    const fullName = getStudentName(student);

    const admissionNumber = getValue(
        student,
        [
            "admissionNumber",
            "admission_number",
            "studentNumber",
            "student_number"
        ],
        "—"
    );

    const gender = getValue(
        student,
        ["gender"],
        "—"
    );

    const status = getValue(
        student,
        ["status"],
        "Active"
    );

    setText("studentName", fullName);
    setText("studentAdmissionNumber", admissionNumber);

    setText(
        "studentId",
        getValue(
            student,
            ["id", "studentId", "student_id"],
            "—"
        )
    );

    setText("academicStatus", status);
    setText("gender", gender);

    setText("firstName", firstName || "—");
    setText("middleName", middleName || "—");
    setText("lastName", lastName || "—");
    setText("genderPersonal", gender);

    const dateOfBirth = getValue(
        student,
        ["dateOfBirth", "date_of_birth", "dob"]
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
        "nationality",
        getValue(
            student,
            ["nationality"],
            "—"
        )
    );

    setText(
        "stateOfOrigin",
        getValue(
            student,
            ["stateOfOrigin", "state_of_origin"],
            "—"
        )
    );

    setText(
        "localGovernment",
        getValue(
            student,
            [
                "localGovernment",
                "local_government",
                "lga"
            ],
            "—"
        )
    );

    setText(
        "religion",
        getValue(
            student,
            ["religion"],
            "—"
        )
    );

    setText(
        "bloodGroup",
        getValue(
            student,
            ["bloodGroup", "blood_group"],
            "—"
        )
    );

    setText(
        "genotype",
        getValue(
            student,
            ["genotype"],
            "—"
        )
    );

    setText(
        "academicAdmissionNumber",
        admissionNumber
    );

    setText(
        "academicLevel",
        getAcademicLevel(student)
    );

    setText(
        "classNameAcademic",
        getClassName(student)
    );

    setText(
        "classArm",
        getClassArm(student)
    );

    setText(
        "academicSession",
        getAcademicSession(student)
    );

    setText(
        "department",
        getDepartment(student)
    );

    setText(
        "house",
        getValue(
            student,
            ["house"],
            "—"
        )
    );

    setText(
        "admissionDate",
        formatDate(
            getValue(
                student,
                ["admissionDate", "admission_date"]
            )
        )
    );

    setText(
        "email",
        getValue(
            student,
            ["email"],
            "—"
        )
    );

    setText(
        "phone",
        getValue(
            student,
            ["phone"],
            "—"
        )
    );

    setText(
        "address",
        getValue(
            student,
            ["address"],
            "—"
        )
    );

    setText(
        "notes",
        getValue(
            student,
            ["notes"],
            "—"
        )
    );

    setText(
        "createdAt",
        formatDateTime(
            getValue(
                student,
                ["createdAt", "created_at"]
            )
        )
    );

    setText(
        "updatedAt",
        formatDateTime(
            getValue(
                student,
                ["updatedAt", "updated_at"]
            )
        )
    );

    updateStudentStatus(status);
    updateStudentPhoto(student);
    setupStudentLinks(student);

    document.title =
        fullName && fullName !== "Unnamed Student"
            ? fullName + " - Student Profile"
            : "Student Profile";
}

/*
|--------------------------------------------------------------------------
| SAFE TEXT SETTER
|--------------------------------------------------------------------------
*/

function setText(elementId, value) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        element.textContent = "—";
        return;
    }

    element.textContent = String(value);
}

/*
|--------------------------------------------------------------------------
| STUDENT NAME
|--------------------------------------------------------------------------
*/

function getStudentName(student) {
    const directName = getValue(
        student,
        [
            "name",
            "fullName",
            "full_name",
            "studentName",
            "student_name"
        ]
    );

    if (directName) {
        return String(directName).trim();
    }

    const parts = [
        getValue(
            student,
            ["firstName", "first_name"]
        ),
        getValue(
            student,
            ["middleName", "middle_name"]
        ),
        getValue(
            student,
            ["lastName", "last_name"]
        )
    ].filter(Boolean);

    return parts.join(" ").trim() || "Unnamed Student";
}

/*
|--------------------------------------------------------------------------
| ACADEMIC INFORMATION
|--------------------------------------------------------------------------
*/

function getAcademicLevel(student) {
    return getNestedOrDirect(
        student,
        [
            "academicLevel",
            "academic_level",
            "level",
            "levelName",
            "level_name"
        ],
        [
            "academicLevel",
            "academic_level",
            "level",
            "name"
        ]
    );
}

function getClassName(student) {
    return getNestedOrDirect(
        student,
        [
            "className",
            "class_name",
            "class"
        ],
        [
            "class",
            "className",
            "class_name",
            "name"
        ]
    );
}

function getClassArm(student) {
    return getNestedOrDirect(
        student,
        [
            "classArm",
            "class_arm",
            "arm",
            "classArmName",
            "class_arm_name"
        ],
        [
            "classArm",
            "class_arm",
            "arm",
            "name"
        ]
    );
}

function getAcademicSession(student) {
    return getNestedOrDirect(
        student,
        [
            "academicSession",
            "academic_session",
            "session",
            "sessionName",
            "session_name"
        ],
        [
            "academicSession",
            "academic_session",
            "session",
            "name"
        ]
    );
}

function getDepartment(student) {
    return getNestedOrDirect(
        student,
        [
            "department",
            "departmentName",
            "department_name"
        ],
        [
            "department",
            "departmentName",
            "department_name",
            "name"
        ]
    );
}

function getNestedOrDirect(
    object,
    directKeys,
    nestedKeys
) {
    const direct = getValue(
        object,
        directKeys
    );

    if (
        direct !== null &&
        direct !== undefined &&
        direct !== ""
    ) {
        if (typeof direct === "object") {
            return getValue(
                direct,
                nestedKeys,
                "—"
            );
        }

        return String(direct);
    }

    return "—";
}

/*
|--------------------------------------------------------------------------
| STUDENT PHOTO
|--------------------------------------------------------------------------
|
| IMPORTANT:
| The database field is student_photo_url.
|
| The student API returns s.* from the students table, so this field
| is expected to be available on the student object.
|
*/

function updateStudentPhoto(student) {
    const image = document.getElementById("studentPhoto");
    const initials = document.getElementById("studentInitials");

    if (!image) {
        return;
    }

    /*
     * student_photo_url is the primary field.
     * The remaining fields provide compatibility with older records
     * or future API response naming.
     */
    const photoUrl = getValue(
        student,
        [
            "student_photo_url",
            "studentPhotoUrl",
            "photoUrl",
            "photo_url",
            "profilePhotoUrl",
            "profile_photo_url",
            "profilePhoto",
            "profile_photo",
            "photo",
            "imageUrl",
            "image_url"
        ]
    );

    const studentName = getStudentName(student);
    const studentInitials = getInitials(studentName);

    if (initials) {
        initials.textContent = studentInitials;
    }

    /*
     * Always reset the image before attempting to load a new photo.
     */
    image.hidden = true;
    image.removeAttribute("src");

    if (initials) {
        initials.hidden = false;
    }

    if (!photoUrl) {
        console.info(
            "Student has no photo URL:",
            student
        );
        return;
    }

    const normalizedUrl = normalizePhotoUrl(photoUrl);

    if (!normalizedUrl) {
        return;
    }

    image.onload = function () {
        image.hidden = false;

        if (initials) {
            initials.hidden = true;
        }

        console.info(
            "Student photo loaded:",
            normalizedUrl
        );
    };

    image.onerror = function () {
        console.error(
            "Student photo could not be loaded:",
            normalizedUrl
        );

        image.hidden = true;

        if (initials) {
            initials.hidden = false;
        }
    };

    image.alt =
        studentName + " photograph";

    /*
     * Cache-busting helps when the student uploads a new photo
     * using the same filename or URL.
     */
    const separator =
        normalizedUrl.indexOf("?") >= 0
            ? "&"
            : "?";

    image.src =
        normalizedUrl +
        separator +
        "v=" +
        Date.now();
}

/*
|--------------------------------------------------------------------------
| NORMALIZE PHOTO URL
|--------------------------------------------------------------------------
*/

function normalizePhotoUrl(photoUrl) {
    if (
        photoUrl === undefined ||
        photoUrl === null
    ) {
        return "";
    }

    let value = String(photoUrl).trim();

    if (!value) {
        return "";
    }

    /*
     * Remove surrounding quotation marks if a value was stored
     * accidentally with quotes.
     */
    value = value.replace(/^["']|["']$/g, "");

    /*
     * Absolute URLs.
     */
    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:")
    ) {
        return value;
    }

    /*
     * If the database already contains a root-relative path,
     * use it exactly as stored.
     */
    if (value.startsWith("/")) {
        return value;
    }

    /*
     * If the stored value begins with uploads/, convert it to
     * /uploads/... for the Express static uploads route.
     */
    if (
        value.startsWith("uploads/") ||
        value.startsWith("uploads\\")
    ) {
        value = value
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");

        return "/" + value;
    }

    /*
     * If the stored value is students/filename.jpg, it belongs
     * under the public uploads directory.
     */
    if (
        value.startsWith("students/") ||
        value.startsWith("students\\")
    ) {
        value = value
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");

        return "/uploads/" + value;
    }

    /*
     * If only the filename was stored, use the known student
     * upload directory.
     */
    if (
        !value.includes("/") &&
        !value.includes("\\")
    ) {
        return "/uploads/students/" + value;
    }

    /*
     * Normalize Windows-style separators.
     */
    value = value
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

    /*
     * Avoid accidentally producing /public/... URLs.
     */
    if (value.startsWith("public/")) {
        value = value.substring("public/".length);
    }

    /*
     * If the path already contains uploads/, serve it from root.
     */
    const uploadsIndex = value.indexOf("uploads/");

    if (uploadsIndex >= 0) {
        return "/" + value.substring(uploadsIndex);
    }

    /*
     * Otherwise treat the path as a student upload path.
     */
    return "/uploads/students/" + value;
}

/*
|--------------------------------------------------------------------------
| STUDENT STATUS
|--------------------------------------------------------------------------
*/

function updateStudentStatus(status) {
    const statusElement = document.getElementById(
        "studentStatus"
    );

    if (!statusElement) {
        return;
    }

    const normalized = String(
        status || "Active"
    )
        .trim()
        .toLowerCase();

    const classes = [
        "status-active",
        "status-inactive",
        "status-graduated",
        "status-withdrawn",
        "status-transferred",
        "status-suspended"
    ];

    statusElement.classList.remove(...classes);

    const classMap = {
        active: "status-active",
        inactive: "status-inactive",
        graduated: "status-graduated",
        withdrawn: "status-withdrawn",
        transferred: "status-transferred",
        suspended: "status-suspended"
    };

    statusElement.classList.add(
        classMap[normalized] || "status-active"
    );

    statusElement.textContent =
        status || "Active";
}

/*
|--------------------------------------------------------------------------
| GUARDIAN INFORMATION
|--------------------------------------------------------------------------
*/

async function loadGuardians(studentId) {
    const container = document.getElementById(
        "guardiansContainer"
    );

    if (!container) {
        return;
    }

    try {
        const response = await apiRequest(
            "/guardians/student/" +
                encodeURIComponent(studentId),
            {
                method: "GET"
            }
        );

        if (
            !response ||
            response.success === false
        ) {
            renderGuardianFallback(container);
            return;
        }

        const guardians = extractCollection(
            response,
            [
                "guardians",
                "data",
                "results",
                "rows"
            ]
        );

        renderGuardians(
            container,
            guardians
        );
    } catch (error) {
        console.warn(
            "Guardian information could not be loaded:",
            error
        );

        renderGuardianFallback(container);
    }
}

function renderGuardians(container, guardians) {
    container.innerHTML = "";

    if (
        !Array.isArray(guardians) ||
        guardians.length === 0
    ) {
        renderGuardianFallback(container);
        return;
    }

    guardians.forEach(function (guardian) {
        const name =
            getValue(
                guardian,
                [
                    "name",
                    "fullName",
                    "full_name",
                    "guardianName",
                    "guardian_name"
                ]
            ) ||
            [
                getValue(
                    guardian,
                    ["firstName", "first_name"]
                ),
                getValue(
                    guardian,
                    ["lastName", "last_name"]
                )
            ]
                .filter(Boolean)
                .join(" ") ||
            "Guardian";

        const relationship = getValue(
            guardian,
            [
                "relationship",
                "relationshipType",
                "relationship_type"
            ],
            "Guardian"
        );

        const phone = getValue(
            guardian,
            [
                "phone",
                "phoneNumber",
                "phone_number"
            ],
            "—"
        );

        const email = getValue(
            guardian,
            ["email"],
            "—"
        );

        const item = document.createElement("div");

        item.className =
            "border rounded-3 p-3 mb-2";

        item.innerHTML =
            '<div class="fw-semibold">' +
            escapeHtml(name) +
            "</div>" +
            '<div class="small text-muted mt-1">' +
            escapeHtml(relationship) +
            "</div>" +
            '<div class="small mt-2">' +
            '<i class="bi bi-telephone me-1"></i>' +
            escapeHtml(phone) +
            "</div>" +
            '<div class="small mt-1">' +
            '<i class="bi bi-envelope me-1"></i>' +
            escapeHtml(email) +
            "</div>";

        container.appendChild(item);
    });
}

function renderGuardianFallback(container) {
    container.innerHTML =
        '<div class="text-muted small">' +
        "No guardian information available." +
        "</div>";
}

/*
|--------------------------------------------------------------------------
| STUDENT DOCUMENTS
|--------------------------------------------------------------------------
*/

async function loadDocuments(studentId) {
    const container = document.getElementById(
        "documentsContainer"
    );

    if (!container) {
        return;
    }

    try {
        const response = await apiRequest(
            "/documents/student/" +
                encodeURIComponent(studentId),
            {
                method: "GET"
            }
        );

        if (
            !response ||
            response.success === false
        ) {
            renderDocumentsFallback(container);
            return;
        }

        const documents = extractCollection(
            response,
            [
                "documents",
                "data",
                "results",
                "rows"
            ]
        );

        renderDocuments(
            container,
            documents
        );
    } catch (error) {
        console.warn(
            "Student documents could not be loaded:",
            error
        );

        renderDocumentsFallback(container);
    }
}

function renderDocuments(container, documents) {
    container.innerHTML = "";

    if (
        !Array.isArray(documents) ||
        documents.length === 0
    ) {
        renderDocumentsFallback(container);
        return;
    }

    documents.forEach(function (documentRecord) {
        const name = getValue(
            documentRecord,
            [
                "documentName",
                "document_name",
                "name",
                "title",
                "fileName",
                "file_name"
            ],
            "Student Document"
        );

        const documentUrl = getValue(
            documentRecord,
            [
                "documentUrl",
                "document_url",
                "fileUrl",
                "file_url",
                "url",
                "path"
            ]
        );

        const item = document.createElement("div");

        item.className =
            "border rounded-3 p-3 mb-2 d-flex align-items-center justify-content-between gap-3";

        let actionHtml =
            '<span class="text-muted small">' +
            "No file link" +
            "</span>";

        if (documentUrl) {
            actionHtml =
                '<a href="' +
                escapeAttribute(
                    normalizePhotoUrl(documentUrl)
                ) +
                '" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm">' +
                '<i class="bi bi-eye me-1"></i>' +
                "View" +
                "</a>";
        }

        item.innerHTML =
            '<div class="d-flex align-items-center gap-2 min-w-0">' +
            '<i class="bi bi-file-earmark-text text-primary"></i>' +
            '<span class="small fw-semibold text-break">' +
            escapeHtml(name) +
            "</span>" +
            "</div>" +
            actionHtml;

        container.appendChild(item);
    });
}

function renderDocumentsFallback(container) {
    container.innerHTML =
        '<div class="text-muted small">' +
        "No student documents available." +
        "</div>";
}

/*
|--------------------------------------------------------------------------
| STUDENT RECORD LINKS
|--------------------------------------------------------------------------
*/

function setupStudentLinks(student) {
    const studentId = getValue(
        student,
        [
            "id",
            "studentId",
            "student_id"
        ]
    );

    if (!studentId) {
        return;
    }

    const encodedId =
        encodeURIComponent(studentId);

    const attendanceLink =
        document.getElementById(
            "attendanceLink"
        );

    const feesLink =
        document.getElementById(
            "feesLink"
        );

    const resultsLink =
        document.getElementById(
            "resultsLink"
        );

    const editLink =
        document.getElementById(
            "editLink"
        );

    const photoEditLink =
        document.getElementById(
            "photoEditLink"
        );

    if (attendanceLink) {
        attendanceLink.href =
            "/pages/student-attendance.html?id=" +
            encodedId;
    }

    if (feesLink) {
        feesLink.href =
            "/pages/fees.html?studentId=" +
            encodedId;
    }

    if (resultsLink) {
        resultsLink.href =
            "/pages/student-results.html?id=" +
            encodedId;
    }

    if (editLink) {
        editLink.href =
            "/pages/student-form.html?id=" +
            encodedId;
    }

    if (photoEditLink) {
        photoEditLink.href =
            "/pages/student-form.html?id=" +
            encodedId;
    }

    const editButton =
        document.getElementById(
            "editStudentButton"
        );

    if (editButton) {
        editButton.dataset.studentId =
            String(studentId);
    }

    const deleteButton =
        document.getElementById(
            "deleteStudentButton"
        );

    if (deleteButton) {
        deleteButton.dataset.studentId =
            String(studentId);
    }
}

/*
|--------------------------------------------------------------------------
| PROFILE ACTIONS
|--------------------------------------------------------------------------
*/

function setupProfileActions() {
    const retryButton =
        document.getElementById(
            "retryButton"
        );

    if (retryButton) {
        retryButton.addEventListener(
            "click",
            function () {
                loadStudentProfile();
            }
        );
    }

    const editButton =
        document.getElementById(
            "editStudentButton"
        );

    if (editButton) {
        editButton.addEventListener(
            "click",
            function () {
                const studentId =
                    getStudentIdFromUrl();

                if (!studentId) {
                    return;
                }

                window.location.href =
                    "/pages/student-form.html?id=" +
                    encodeURIComponent(studentId);
            }
        );
    }

    const editLink =
        document.getElementById(
            "editLink"
        );

    if (editLink) {
        editLink.addEventListener(
            "click",
            function (event) {
                const studentId =
                    getStudentIdFromUrl();

                if (!studentId) {
                    event.preventDefault();
                    return;
                }

                editLink.href =
                    "/pages/student-form.html?id=" +
                    encodeURIComponent(studentId);
            }
        );
    }

    const deleteButton =
        document.getElementById(
            "deleteStudentButton"
        );

    if (deleteButton) {
        deleteButton.addEventListener(
            "click",
            async function () {
                const studentId =
                    getStudentIdFromUrl();

                if (!studentId) {
                    showPageMessage(
                        "Student ID is missing.",
                        "danger"
                    );
                    return;
                }

                const confirmed =
                    window.confirm(
                        "Are you sure you want to delete this student? This action cannot be undone."
                    );

                if (!confirmed) {
                    return;
                }

                await deleteStudent(studentId);
            }
        );
    }
}

/*
|--------------------------------------------------------------------------
| DELETE STUDENT
|--------------------------------------------------------------------------
*/

async function deleteStudent(studentId) {
    try {
        const response = await apiRequest(
            "/students/" +
                encodeURIComponent(studentId),
            {
                method: "DELETE"
            }
        );

        if (
            !response ||
            response.success === false
        ) {
            throw new Error(
                response && response.message
                    ? response.message
                    : "Unable to delete student."
            );
        }

        showPageMessage(
            "Student deleted successfully.",
            "success"
        );

        setTimeout(function () {
            window.location.href =
                "/pages/students.html";
        }, 800);
    } catch (error) {
        console.error(
            "Delete student error:",
            error
        );

        showPageMessage(
            getErrorMessage(error),
            "danger"
        );
    }
}

/*
|--------------------------------------------------------------------------
| MOBILE SIDEBAR
|--------------------------------------------------------------------------
*/

function setupMobileSidebar() {
    const sidebarToggle =
        document.getElementById(
            "sidebarToggle"
        );

    const sidebar =
        document.getElementById("sidebar") ||
        document.getElementById("smsSidebar");

    const sidebarOverlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (!sidebarToggle || !sidebar) {
        return;
    }

    sidebarToggle.addEventListener(
        "click",
        function () {
            const isOpen =
                sidebar.classList.contains(
                    "show"
                );

            sidebar.classList.toggle("show");

            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle(
                    "show"
                );
            }

            sidebarToggle.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );
        }
    );

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener(
            "click",
            closeMobileSidebar
        );
    }

    document
        .querySelectorAll(".sidebar-link")
        .forEach(function (link) {
            link.addEventListener(
                "click",
                function () {
                    if (window.innerWidth <= 991) {
                        closeMobileSidebar();
                    }
                }
            );
        });

    function closeMobileSidebar() {
        sidebar.classList.remove("show");

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove(
                "show"
            );
        }

        sidebarToggle.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}

/*
|--------------------------------------------------------------------------
| PROFILE DISPLAY STATES
|--------------------------------------------------------------------------
*/

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

function showProfileContent() {
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
        loading.hidden = true;
    }

    if (error) {
        error.hidden = true;
    }

    if (content) {
        content.hidden = false;
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
            "Unable to load student profile.";
    }

    if (error) {
        error.hidden = false;
    }
}

/*
|--------------------------------------------------------------------------
| API COLLECTION HELPER
|--------------------------------------------------------------------------
*/

function extractCollection(response, keys) {
    if (Array.isArray(response)) {
        return response;
    }

    if (
        !response ||
        typeof response !== "object"
    ) {
        return [];
    }

    for (const key of keys) {
        if (Array.isArray(response[key])) {
            return response[key];
        }
    }

    if (
        response.data &&
        typeof response.data === "object"
    ) {
        if (Array.isArray(response.data)) {
            return response.data;
        }

        for (const key of keys) {
            if (
                Array.isArray(
                    response.data[key]
                )
            ) {
                return response.data[key];
            }
        }
    }

    return [];
}

/*
|--------------------------------------------------------------------------
| GENERIC VALUE HELPER
|--------------------------------------------------------------------------
*/

function getValue(
    object,
    keys,
    fallback = null
) {
    if (
        !object ||
        typeof object !== "object"
    ) {
        return fallback;
    }

    for (const key of keys) {
        const value = object[key];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }
    }

    return fallback;
}

/*
|--------------------------------------------------------------------------
| FORMATTING
|--------------------------------------------------------------------------
*/

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) {
        return "—";
    }

    const birthDate = new Date(dateOfBirth);

    if (Number.isNaN(birthDate.getTime())) {
        return "—";
    }

    const today = new Date();

    let age =
        today.getFullYear() -
        birthDate.getFullYear();

    const monthDifference =
        today.getMonth() -
        birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() <
                birthDate.getDate()
        )
    ) {
        age--;
    }

    if (age < 0 || age > 150) {
        return "—";
    }

    return String(age);
}

function getInitials(name) {
    if (!name) {
        return "ST";
    }

    const parts = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}

/*
|--------------------------------------------------------------------------
| HTML SAFETY
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

function escapeAttribute(value) {
    return escapeHtml(value);
}

/*
|--------------------------------------------------------------------------
| PAGE MESSAGE
|--------------------------------------------------------------------------
*/

function showPageMessage(
    message,
    type
) {
    const element =
        document.getElementById(
            "pageMessage"
        );

    if (!element) {
        return;
    }

    element.className =
        "alert mb-4 alert-" +
        (type || "info");

    element.textContent =
        message || "";

    element.hidden = false;
}

/*
|--------------------------------------------------------------------------
| ERROR MESSAGE
|--------------------------------------------------------------------------
*/

function getErrorMessage(error) {
    if (
        error &&
        error.message
    ) {
        return error.message;
    }

    return (
        "Unable to load student profile. Please try again."
    );
}

/*
|--------------------------------------------------------------------------
| GLOBAL FUNCTIONS
|--------------------------------------------------------------------------
*/

window.loadStudentProfile =
    loadStudentProfile;

window.initializeStudentProfile =
    initializeStudentProfile;