"use strict";

(function () {
"use strict";

```
const API_BASE = "/api";
const TOKEN_KEYS = [
    "token",
    "authToken",
    "accessToken"
];
const LOGIN_PAGE = "/pages/login.html";
const STUDENTS_PAGE = "/pages/students.html";

let currentStudent = null;
let currentEnrollment = null;

function findElement(ids) {
    const list = Array.isArray(ids) ? ids : [ids];

    for (const id of list) {
        const element = document.getElementById(id);

        if (element) {
            return element;
        }
    }

    return null;
}

function getToken() {
    for (const key of TOKEN_KEYS) {
        const localValue = localStorage.getItem(key);

        if (localValue) {
            return localValue;
        }

        const sessionValue = sessionStorage.getItem(key);

        if (sessionValue) {
            return sessionValue;
        }
    }

    return "";
}

function clearAuthentication() {
    TOKEN_KEYS.forEach(function (key) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

function getStudentId() {
    const params = new URLSearchParams(
        window.location.search
    );

    return (
        params.get("id") ||
        params.get("studentId") ||
        params.get("student_id") ||
        params.get("student") ||
        ""
    );
}

function escapeHtml(value) {
    return String(
        value === undefined || value === null
            ? ""
            : value
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function displayValue(value, fallback) {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return fallback || "Not provided";
    }

    return escapeHtml(value);
}

function formatDate(value) {
    if (!value) {
        return "Not provided";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return escapeHtml(value);
    }

    return date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatMoney(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "₦0.00";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return escapeHtml(value);
    }

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2
    }).format(number);
}

function normalizeObject(data) {
    if (!data) {
        return null;
    }

    if (
        data.data &&
        data.data.student
    ) {
        return data.data.student;
    }

    if (data.student) {
        return data.student;
    }

    if (data.data) {
        return data.data;
    }

    return data;
}

function normalizeArray(data, keys) {
    if (Array.isArray(data)) {
        return data;
    }

    if (!data) {
        return [];
    }

    const possibleKeys = Array.isArray(keys)
        ? keys
        : [];

    for (const key of possibleKeys) {
        if (Array.isArray(data[key])) {
            return data[key];
        }

        if (
            data.data &&
            Array.isArray(data.data[key])
        ) {
            return data.data[key];
        }
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    return [];
}

function getFullName(student) {
    if (!student) {
        return "Student";
    }

    const existingName =
        student.full_name ||
        student.fullName ||
        student.name;

    if (existingName) {
        return String(existingName).trim();
    }

    const firstName =
        student.first_name ||
        student.firstName ||
        "";

    const middleName =
        student.middle_name ||
        student.middleName ||
        "";

    const lastName =
        student.last_name ||
        student.lastName ||
        "";

    return [
        firstName,
        middleName,
        lastName
    ]
        .filter(function (value) {
            return String(value).trim() !== "";
        })
        .join(" ")
        .trim() || "Student";
}

function getStudentNumber(student) {
    if (!student) {
        return "";
    }

    return (
        student.student_number ||
        student.studentNumber ||
        student.admission_number ||
        student.admissionNumber ||
        student.registration_number ||
        student.registrationNumber ||
        ""
    );
}

function getInitials(student) {
    const fullName = getFullName(student);

    if (!fullName || fullName === "Student") {
        return "ST";
    }

    const parts = fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
    ).toUpperCase();
}

function normalizeFileUrl(value) {
    if (!value) {
        return "";
    }

    let url = String(value).trim();

    if (!url) {
        return "";
    }

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    ) {
        return url;
    }

    url = url.replace(/\\/g, "/");

    if (!url.startsWith("/")) {
        url = "/" + url;
    }

    return url;
}

function setText(ids, value, fallback) {
    const list = Array.isArray(ids) ? ids : [ids];

    list.forEach(function (id) {
        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {
            element.textContent =
                fallback || "Not provided";
        } else {
            element.textContent =
                String(value);
        }
    });
}

function showLoading() {
    const loading = findElement([
        "profileLoading",
        "loadingState"
    ]);

    if (loading) {
        loading.style.display = "";
    }
}

function hideLoading() {
    const loading = findElement([
        "profileLoading",
        "loadingState"
    ]);

    if (loading) {
        loading.style.display = "none";
    }
}

function showProfileContent() {
    const content = findElement([
        "profileContent",
        "studentProfile",
        "profileContainer",
        "profilePageContent"
    ]);

    if (content) {
        content.style.display = "";
    }

    document.body.classList.remove(
        "profile-loading"
    );
}

function hideProfileContent() {
    const content = findElement([
        "profileContent",
        "studentProfile",
        "profileContainer",
        "profilePageContent"
    ]);

    if (content) {
        content.style.display = "none";
    }
}

function showPageMessage(message) {
    const element = findElement([
        "pageMessage",
        "profileMessage"
    ]);

    if (element) {
        element.textContent = message;
        element.style.display = "";
    }
}

function hidePageMessage() {
    const element = findElement([
        "pageMessage",
        "profileMessage"
    ]);

    if (element) {
        element.style.display = "none";
    }
}

function showProfileError(message) {
    const errorBox = findElement([
        "profileError",
        "errorState"
    ]);

    const errorMessage = findElement([
        "profileErrorMessage",
        "errorMessage"
    ]);

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    if (errorBox) {
        errorBox.style.display = "";
    } else {
        showPageMessage(message);
    }
}

function hideProfileError() {
    const errorBox = findElement([
        "profileError",
        "errorState"
    ]);

    if (errorBox) {
        errorBox.style.display = "none";
    }
}

async function apiRequest(url, options) {
    const token = getToken();

    const requestOptions = {
        method: "GET",
        credentials: "include",
        ...(options || {})
    };

    requestOptions.headers = {
        Accept: "application/json",
        ...(requestOptions.headers || {})
    };

    if (token) {
        requestOptions.headers.Authorization =
            "Bearer " + token;
    }

    const response = await fetch(
        url,
        requestOptions
    );

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
        const text = await response.text();

        if (!text) {
            data = {};
        } else {
            try {
                data = JSON.parse(text);
            } catch (error) {
                throw new Error(
                    "The server returned an invalid response."
                );
            }
        }
    }

    if (response.status === 401) {
        clearAuthentication();

        window.location.href = LOGIN_PAGE;

        throw new Error(
            "Your session has expired. Please log in again."
        );
    }

    if (!response.ok) {
        const message =
            data &&
            (
                data.message ||
                data.error
            );

        throw new Error(
            message ||
            "Unable to load the requested information."
        );
    }

    return data;
}

async function loadStudent(studentId) {
    if (!studentId) {
        throw new Error(
            "No student ID was provided."
        );
    }

    const url =
        API_BASE +
        "/students/" +
        encodeURIComponent(studentId);

    const data = await apiRequest(url);

    const student =
        normalizeObject(data);

    if (!student) {
        throw new Error(
            "Student could not be found."
        );
    }

    return student;
}

async function loadStudentEnrollment(studentId) {
    if (!studentId) {
        return null;
    }

    const url =
        API_BASE +
        "/students/" +
        encodeURIComponent(studentId) +
        "/enrollment";

    try {
        const data =
            await apiRequest(url);

        return normalizeObject(data);
    } catch (error) {
        console.warn(
            "Student enrollment could not be loaded:",
            error.message
        );

        return null;
    }
}

async function loadGuardians(studentId) {
    if (!studentId) {
        renderGuardians([]);
        return [];
    }

    const url =
        API_BASE +
        "/students/" +
        encodeURIComponent(studentId) +
        "/guardians";

    try {
        const data =
            await apiRequest(url);

        const guardians =
            normalizeArray(data, [
                "guardians"
            ]);

        renderGuardians(guardians);

        return guardians;
    } catch (error) {
        console.warn(
            "Student guardians could not be loaded:",
            error.message
        );

        renderGuardians([]);

        return [];
    }
}

async function loadDocuments(studentId) {
    if (!studentId) {
        renderDocuments([]);
        return [];
    }

    const url =
        API_BASE +
        "/students/" +
        encodeURIComponent(studentId) +
        "/documents";

    try {
        const data =
            await apiRequest(url);

        const documents =
            normalizeArray(data, [
                "documents"
            ]);

        renderDocuments(documents);

        return documents;
    } catch (error) {
        console.warn(
            "Student documents could not be loaded:",
            error.message
        );

        renderDocuments([]);

        return [];
    }
}

function renderStudent(student) {
    currentStudent = student;

    const fullName =
        getFullName(student);

    const studentNumber =
        getStudentNumber(student);

    document.title =
        fullName +
        " - Student Profile";

    setText(
        [
            "studentName",
            "profileStudentName",
            "fullName",
            "studentFullName",
            "studentTitle"
        ],
        fullName,
        "Student"
    );

    setText(
        [
            "studentNumber",
            "studentId",
            "admissionNumber",
            "profileStudentNumber"
        ],
        studentNumber
    );

    const email =
        student.email ||
        student.student_email ||
        "";

    const phone =
        student.phone ||
        student.phone_number ||
        student.phoneNumber ||
        "";

    const gender =
        student.gender || "";

    const dateOfBirth =
        student.date_of_birth ||
        student.dateOfBirth ||
        student.dob ||
        "";

    const age =
        student.age !== undefined &&
        student.age !== null
            ? student.age
            : "";

    const className =
        student.class_name ||
        student.className ||
        student.class ||
        "";

    const classArm =
        student.class_arm_name ||
        student.classArmName ||
        student.class_arm ||
        student.classArm ||
        student.arm ||
        "";

    const academicLevel =
        student.academic_level_name ||
        student.academicLevelName ||
        student.academic_level ||
        student.academicLevel ||
        student.level ||
        "";

    const department =
        student.department_name ||
        student.departmentName ||
        student.department ||
        "";

    const academicSession =
        student.academic_session_name ||
        student.academicSessionName ||
        student.academic_session ||
        student.academicSession ||
        student.session ||
        "";

    const status =
        student.status ||
        "Active";

    setText(
        [
            "studentEmail",
            "profileEmail"
        ],
        email
    );

    setText(
        [
            "studentPhone",
            "profilePhone"
        ],
        phone
    );

    setText(
        [
            "studentGender",
            "profileGender",
            "genderPersonal"
        ],
        gender
    );

    setText(
        [
            "studentAge",
            "profileAge"
        ],
        age
    );

    setText(
        [
            "studentDateOfBirth",
            "dateOfBirth",
            "profileDateOfBirth"
        ],
        dateOfBirth
            ? formatDate(dateOfBirth)
            : ""
    );

    setText(
        [
            "studentClass",
            "className",
            "profileClass"
        ],
        className
    );

    setText(
        [
            "studentArm",
            "classArm",
            "profileClassArm"
        ],
        classArm
    );

    setText(
        [
            "academicLevel",
            "studentLevel",
            "profileLevel"
        ],
        academicLevel
    );

    setText(
        [
            "studentDepartment",
            "department",
            "profileDepartment"
        ],
        department
    );

    setText(
        [
            "academicSession",
            "studentSession",
            "profileSession"
        ],
        academicSession
    );

    setText(
        [
            "studentStatus",
            "status",
            "profileStatus"
        ],
        status
    );

    renderStudentImage(student);
    renderStudentDetails(student);
    renderFinancialInformation(student);
    renderUniformInformation(student);
    renderAddressInformation(student);
}

function renderStudentDetails(student) {
    const details = findElement([
        "studentDetails",
        "profileDetails",
        "studentInformation"
    ]);

    if (!details) {
        return;
    }

    const fields =
        details.querySelectorAll(
            "[data-student-field]"
        );

    if (fields.length) {
        fields.forEach(function (element) {
            const field =
                element.getAttribute(
                    "data-student-field"
                );

            element.textContent =
                getStudentField(
                    student,
                    field
                );
        });

        return;
    }

    details.innerHTML = [
        '<div class="student-detail-grid">',
        '<div class="student-detail-item">',
        '<span class="detail-label">Student Number</span>',
        "<strong>",
        displayValue(
            getStudentNumber(student)
        ),
        "</strong>",
        "</div>",
        '<div class="student-detail-item">',
        '<span class="detail-label">Full Name</span>',
        "<strong>",
        displayValue(
            getFullName(student)
        ),
        "</strong>",
        "</div>",
        '<div class="student-detail-item">',
        '<span class="detail-label">Email</span>',
        "<strong>",
        displayValue(student.email),
        "</strong>",
        "</div>",
        '<div class="student-detail-item">',
        '<span class="detail-label">Phone</span>',
        "<strong>",
        displayValue(
            student.phone ||
            student.phone_number
        ),
        "</strong>",
        "</div>",
        '<div class="student-detail-item">',
        '<span class="detail-label">Gender</span>',
        "<strong>",
        displayValue(student.gender),
        "</strong>",
        "</div>",
        '<div class="student-detail-item">',
        '<span class="detail-label">Date of Birth</span>',
        "<strong>",
        displayValue(
            student.date_of_birth ||
            student.dateOfBirth ||
            student.dob
                ? formatDate(
                    student.date_of_birth ||
                    student.dateOfBirth ||
                    student.dob
                )
                : ""
        ),
        "</strong>",
        "</div>",
        '<div class="student-detail-item">',
        '<span class="detail-label">Age</span>',
        "<strong>",
        displayValue(student.age),
        "</strong>",
        "</div>",
        '<div class="student-detail-item">',
        '<span class="detail-label">Address</span>',
        "<strong>",
        displayValue(
            student.address ||
            student.home_address ||
            student.homeAddress
        ),
        "</strong>",
        "</div>",
        "</div>"
    ].join("");
}

function getStudentField(student, field) {
    const values = {
        id: student.id,

        student_id:
            student.id,

        student_number:
            getStudentNumber(student),

        name:
            getFullName(student),

        full_name:
            getFullName(student),

        email:
            student.email,

        phone:
            student.phone ||
            student.phone_number,

        gender:
            student.gender,

        age:
            student.age,

        date_of_birth:
            student.date_of_birth ||
            student.dateOfBirth ||
            student.dob,

        address:
            student.address ||
            student.home_address ||
            student.homeAddress,

        class:
            student.class_name ||
            student.className ||
            student.class,

        class_arm:
            student.class_arm_name ||
            student.classArmName ||
            student.class_arm ||
            student.classArm ||
            student.arm,

        department:
            student.department_name ||
            student.departmentName ||
            student.department,

        level:
            student.academic_level_name ||
            student.academicLevelName ||
            student.academic_level ||
            student.academicLevel ||
            student.level,

        session:
            student.academic_session_name ||
            student.academicSessionName ||
            student.academic_session ||
            student.academicSession ||
            student.session,

        status:
            student.status ||
            "Active"
    };

    const value =
        values[field];

    return value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
        ? String(value)
        : "Not provided";
}

function renderStudentImage(student) {
    const image = findElement([
        "studentPhoto",
        "studentImage",
        "profilePhoto",
        "profileImage",
        "studentPicture"
    ]);

    const placeholder = findElement([
        "studentPhotoPlaceholder",
        "photoPlaceholder",
        "profilePhotoPlaceholder"
    ]);

    if (!image) {
        if (placeholder) {
            placeholder.textContent =
                getInitials(student);
            placeholder.style.display = "";
        }

        return;
    }

    const imageUrl =
        normalizeFileUrl(
            student.photo ||
            student.picture ||
            student.image ||
            student.profile_picture ||
            student.profilePicture ||
            student.photo_url ||
            student.photoUrl
        );

    if (!imageUrl) {
        image.style.display = "none";

        if (placeholder) {
            placeholder.textContent =
                getInitials(student);

            placeholder.style.display = "";
        }

        return;
    }

    image.onerror = function () {
        image.style.display = "none";

        if (placeholder) {
            placeholder.textContent =
                getInitials(student);

            placeholder.style.display = "";
        }
    };

    image.src = imageUrl;
    image.alt = getFullName(student);
    image.style.display = "";

    if (placeholder) {
        placeholder.style.display = "none";
    }
}

function renderFinancialInformation(student) {
    const paid =
        student.school_fee_paid ??
        student.schoolFeePaid ??
        student.fees_paid ??
        student.feesPaid ??
        student.amount_paid ??
        student.amountPaid;

    const fee =
        student.school_fee_amount ??
        student.schoolFeeAmount ??
        student.fee_amount ??
        student.feeAmount;

    const balance =
        student.school_fee_balance ??
        student.schoolFeeBalance ??
        student.fee_balance ??
        student.feeBalance;

    setText(
        [
            "schoolFeePaid",
            "feesPaid",
            "amountPaid"
        ],
        paid !== undefined
            ? formatMoney(paid)
            : ""
    );

    setText(
        [
            "schoolFeeAmount",
            "feeAmount",
            "totalSchoolFee"
        ],
        fee !== undefined
            ? formatMoney(fee)
            : ""
    );

    setText(
        [
            "schoolFeeBalance",
            "feeBalance",
            "balance"
        ],
        balance !== undefined
            ? formatMoney(balance)
            : ""
    );
}

function renderUniformInformation(student) {
    const uniform =
        student.uniform_purchased ??
        student.uniformPurchased;

    if (
        uniform === undefined ||
        uniform === null
    ) {
        setText(
            [
                "uniformPurchased",
                "uniformStatus"
            ],
            ""
        );

        return;
    }

    let value;

    if (typeof uniform === "boolean") {
        value = uniform
            ? "Purchased"
            : "Not Purchased";
    } else {
        value = String(uniform);
    }

    setText(
        [
            "uniformPurchased",
            "uniformStatus"
        ],
        value
    );
}

function renderAddressInformation(student) {
    const address =
        student.address ||
        student.home_address ||
        student.homeAddress ||
        "";

    setText(
        [
            "studentAddress",
            "homeAddress",
            "profileAddress"
        ],
        address
    );
}

function renderEnrollment(enrollment) {
    if (!enrollment) {
        return;
    }

    currentEnrollment =
        enrollment;

    const className =
        enrollment.class_name ||
        enrollment.className ||
        enrollment.class ||
        "";

    const classArm =
        enrollment.class_arm_name ||
        enrollment.classArmName ||
        enrollment.class_arm ||
        enrollment.classArm ||
        enrollment.arm ||
        "";

    const level =
        enrollment.academic_level_name ||
        enrollment.academicLevelName ||
        enrollment.academic_level ||
        enrollment.academicLevel ||
        enrollment.level ||
        "";

    const session =
        enrollment.academic_session_name ||
        enrollment.academicSessionName ||
        enrollment.academic_session ||
        enrollment.academicSession ||
        enrollment.session ||
        "";

    const admissionDate =
        enrollment.enrollment_date ||
        enrollment.enrollmentDate ||
        enrollment.admission_date ||
        enrollment.admissionDate ||
        "";

    setText(
        [
            "enrollmentClass"
        ],
        className
    );

    setText(
        [
            "enrollmentArm"
        ],
        classArm
    );

    setText(
        [
            "enrollmentLevel"
        ],
        level
    );

    setText(
        [
            "enrollmentSession"
        ],
        session
    );

    setText(
        [
            "admissionDate",
            "enrollmentDate"
        ],
        admissionDate
            ? formatDate(admissionDate)
            : ""
    );

    setText(
        [
            "studentClass",
            "className",
            "profileClass"
        ],
        className
    );

    setText(
        [
            "studentArm",
            "classArm",
            "profileClassArm"
        ],
        classArm
    );

    setText(
        [
            "academicLevel",
            "studentLevel",
            "profileLevel"
        ],
        level
    );

    setText(
        [
            "academicSession",
            "studentSession",
            "profileSession"
        ],
        session
    );
}

function renderGuardians(guardians) {
    const container = findElement([
        "guardiansList",
        "guardianList",
        "studentGuardians",
        "guardiansContainer"
    ]);

    if (!container) {
        return;
    }

    if (!Array.isArray(guardians) ||
        guardians.length === 0) {
        container.innerHTML =
            '<div class="empty-state">' +
            "No guardian information available." +
            "</div>";

        return;
    }

    container.innerHTML =
        guardians
            .map(function (guardian) {
                const name =
                    guardian.full_name ||
                    guardian.fullName ||
                    guardian.name ||
                    [
                        guardian.first_name ||
                        guardian.firstName ||
                        "",
                        guardian.last_name ||
                        guardian.lastName ||
                        ""
                    ]
                        .filter(Boolean)
                        .join(" ") ||
                    "Guardian";

                const relationship =
                    guardian.relationship ||
                    guardian.relation ||
                    "";

                const phone =
                    guardian.phone ||
                    guardian.phone_number ||
                    guardian.phoneNumber ||
                    "";

                const email =
                    guardian.email ||
                    "";

                return [
                    '<div class="guardian-card">',
                    "<h4>",
                    displayValue(name),
                    "</h4>",
                    "<p>",
                    "<strong>Relationship:</strong> ",
                    displayValue(relationship),
                    "</p>",
                    "<p>",
                    "<strong>Phone:</strong> ",
                    displayValue(phone),
                    "</p>",
                    "<p>",
                    "<strong>Email:</strong> ",
                    displayValue(email),
                    "</p>",
                    "</div>"
                ].join("");
            })
            .join("");
}

function renderDocuments(documents) {
    const container = findElement([
        "documentsList",
        "studentDocuments",
        "documentsContainer"
    ]);

    if (!container) {
        return;
    }

    if (!Array.isArray(documents) ||
        documents.length === 0) {
        container.innerHTML =
            '<div class="empty-state">' +
            "No documents available." +
            "</div>";

        return;
    }

    container.innerHTML =
        documents
            .map(function (documentRecord) {
                const name =
                    documentRecord.name ||
                    documentRecord.document_name ||
                    documentRecord.documentName ||
                    "Document";

                const url =
                    normalizeFileUrl(
                        documentRecord.url ||
                        documentRecord.file_url ||
                        documentRecord.fileUrl ||
                        documentRecord.path
                    );

                if (!url) {
                    return [
                        '<div class="document-item">',
                        displayValue(name),
                        "</div>"
                    ].join("");
                }

                return [
                    '<div class="document-item">',
                    '<a href="',
                    escapeHtml(url),
                    '" target="_blank"',
                    ' rel="noopener noreferrer">',
                    displayValue(name),
                    "</a>",
                    "</div>"
                ].join("");
            })
            .join("");
}

function setupNavigation() {
    const backButtons =
        document.querySelectorAll(
            "[data-action='back'], #backButton, #backBtn"
        );

    backButtons.forEach(function (button) {
        button.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                if (
                    window.history.length > 1
                ) {
                    window.history.back();
                } else {
                    window.location.href =
                        STUDENTS_PAGE;
                }
            }
        );
    });

    const editButtons =
        document.querySelectorAll(
            "[data-action='edit-student'], #editStudentButton, #editStudentBtn"
        );

    editButtons.forEach(function (button) {
        button.addEventListener(
            "click",
            function (event) {
                event.preventDefault();

                if (!currentStudent) {
                    return;
                }

                const id =
                    currentStudent.id ||
                    currentStudent.student_id;

                if (!id) {
                    showPageMessage(
                        "Student ID is not available."
                    );

                    return;
                }

                window.location.href =
                    "/pages/student-form.html?id=" +
                    encodeURIComponent(id);
            }
        );
    });
}

async function loadStudentProfile(studentId) {
    hideProfileError();
    hidePageMessage();

    if (!studentId) {
        hideLoading();
        hideProfileContent();

        showProfileError(
            "No student ID was provided."
        );

        return;
    }

    try {
        const student =
            await loadStudent(studentId);

        renderStudent(student);

        hideLoading();
        showProfileContent();

        Promise.allSettled([
            loadStudentEnrollment(studentId),
            loadGuardians(studentId),
            loadDocuments(studentId)
        ]).then(function (results) {
            const enrollmentResult =
                results[0];

            if (
                enrollmentResult &&
                enrollmentResult.status === "fulfilled" &&
                enrollmentResult.value
            ) {
                renderEnrollment(
                    enrollmentResult.value
                );
            }
        });
    } catch (error) {
        hideLoading();
        hideProfileContent();

        console.error(
            "Student profile error:",
            error
        );

        showProfileError(
            error.message ||
            "Unable to load student profile."
        );
    }
}

async function initializeStudentProfile() {
    setupNavigation();

    const studentId =
        getStudentId();

    showLoading();

    await loadStudentProfile(
        studentId
    );
}

window.initializeStudentProfile =
    initializeStudentProfile;

window.loadStudentProfile =
    loadStudentProfile;

window.loadStudentEnrollment =
    loadStudentEnrollment;

window.loadGuardians =
    loadGuardians;

window.loadDocuments =
    loadDocuments;

if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeStudentProfile
    );
} else {
    initializeStudentProfile();
}
```

})();
