"use strict";

const STUDENT_API = "/api/students";
const ACADEMIC_LEVELS_API = "/api/academic-levels";
const ACADEMIC_SESSIONS_API = "/api/academic-sessions";
const DEPARTMENTS_API = "/api/departments";
const CLASSES_API = "/api/classes";
const CLASS_ARMS_API = "/api/class-arms";
const ENROLLMENT_API = "/api/enrollment";

let editingStudentId = null;
let existingStudent = null;

document.addEventListener("DOMContentLoaded", initialiseStudentForm);

async function initialiseStudentForm() {
setupFormEvents();
setupPhotoPreview();

try {
    await loadAcademicLevels();
    await loadAcademicSessions();
    await loadDepartments();
    await loadClasses();
    await loadClassArms();

    const params = new URLSearchParams(window.location.search);
    editingStudentId =
        params.get("id") ||
        params.get("studentId") ||
        params.get("student_id") ||
        null;

    if (editingStudentId) {
        await loadExistingStudent(editingStudentId);
        setPageMode("Edit Student");
    } else {
        setPageMode("Add Student");
    }
} catch (error) {
    console.error("Student form initialization error:", error);
    showAlert(
        error.message || "Unable to load the student form.",
        "danger"
    );
}

}

function setupFormEvents() {
const form = document.getElementById("studentForm");

if (form) {
    form.addEventListener("submit", handleFormSubmit);
}

const resetButton = document.getElementById("resetButton");

if (resetButton) {
    resetButton.addEventListener("click", handleReset);
}

const cancelButton = document.getElementById("cancelButton");

if (cancelButton) {
    cancelButton.addEventListener("click", function () {
        window.location.href = "/pages/students.html";
    });
}

const academicLevel = document.getElementById("academic_level");

if (academicLevel) {
    academicLevel.addEventListener("change", async function () {
        await loadClasses();
        await loadClassArms();
    });
}

const classSelect = document.getElementById("class_name");

if (classSelect) {
    classSelect.addEventListener("change", async function () {
        await loadClassArms();
    });
}

}

function setupPhotoPreview() {
const photoInput = document.getElementById("photo");
const preview = document.getElementById("photoPreview");

if (!photoInput) {
    return;
}

photoInput.addEventListener("change", function () {
    const file = photoInput.files && photoInput.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        photoInput.value = "";
        showAlert("Please select a valid image file.", "danger");
        return;
    }

    const maximumSize = 5 * 1024 * 1024;

    if (file.size > maximumSize) {
        photoInput.value = "";
        showAlert("Student photograph must not exceed 5 MB.", "danger");
        return;
    }

    if (preview) {
        const reader = new FileReader();

        reader.onload = function (event) {
            preview.src = event.target.result;
            preview.style.display = "block";
        };

        reader.readAsDataURL(file);
    }
});

}

async function loadAcademicLevels() {
const select = document.getElementById("academic_level");

if (!select) {
    return;
}

const response = await apiRequest(ACADEMIC_LEVELS_API);
const items = extractArray(response);

populateSelect(
    select,
    items,
    "Select academic level",
    getItemId,
    function (item) {
        return (
            item.name ||
            item.level_name ||
            item.levelName ||
            item.title ||
            ""
        );
    }
);

}

async function loadAcademicSessions() {
const select = document.getElementById("academic_session");

if (!select) {
    return;
}

const response = await apiRequest(ACADEMIC_SESSIONS_API);
const items = extractArray(response);

populateSelect(
    select,
    items,
    "Select academic session",
    getItemId,
    function (item) {
        return (
            item.name ||
            item.session_name ||
            item.sessionName ||
            item.title ||
            item.academic_session ||
            ""
        );
    }
);

}

async function loadDepartments() {
const select = document.getElementById("department");

if (!select) {
    return;
}

try {
    const response = await apiRequest(DEPARTMENTS_API);
    const items = extractArray(response);

    populateSelect(
        select,
        items,
        "Select department",
        getItemId,
        function (item) {
            return (
                item.name ||
                item.department_name ||
                item.departmentName ||
                item.title ||
                ""
            );
        }
    );
} catch (error) {
    console.warn("Departments could not be loaded:", error);

    select.innerHTML =
        '<option value="">Select department</option>';
}

}

async function loadClasses() {
const select = document.getElementById("class_name");

if (!select) {
    return;
}

try {
    const academicLevelSelect =
        document.getElementById("academic_level");

    const academicLevelId =
        academicLevelSelect?.value || "";

    let url = CLASSES_API;

    if (academicLevelId) {
        url += "?academicLevelId=" +
            encodeURIComponent(academicLevelId);
    }

    const response = await apiRequest(url);
    let items = extractArray(response);

    if (academicLevelId) {
        items = items.filter(function (item) {
            const itemLevelId =
                item.academic_level_id ??
                item.academicLevelId ??
                item.level_id ??
                item.levelId;

            if (
                itemLevelId === undefined ||
                itemLevelId === null ||
                itemLevelId === ""
            ) {
                return true;
            }

            return String(itemLevelId) === String(academicLevelId);
        });
    }

    populateSelect(
        select,
        items,
        "Select class",
        getItemId,
        function (item) {
            return (
                item.name ||
                item.class_name ||
                item.className ||
                item.title ||
                ""
            );
        }
    );
} catch (error) {
    console.warn("Classes could not be loaded:", error);

    select.innerHTML =
        '<option value="">Select class</option>';
}

}

async function loadClassArms() {
const select = document.getElementById("class_arm");

if (!select) {
    return;
}

try {
    const classSelect = document.getElementById("class_name");
    const classId = classSelect?.value || "";

    let url = CLASS_ARMS_API;

    if (classId) {
        url += "?classId=" +
            encodeURIComponent(classId);
    }

    const response = await apiRequest(url);
    let items = extractArray(response);

    if (classId) {
        items = items.filter(function (item) {
            const itemClassId =
                item.class_id ??
                item.classId;

            if (
                itemClassId === undefined ||
                itemClassId === null ||
                itemClassId === ""
            ) {
                return true;
            }

            return String(itemClassId) === String(classId);
        });
    }

    populateSelect(
        select,
        items,
        "Select class arm",
        getItemId,
        function (item) {
            return (
                item.name ||
                item.arm_name ||
                item.armName ||
                item.class_arm_name ||
                item.classArmName ||
                item.title ||
                ""
            );
        }
    );
} catch (error) {
    console.warn("Class arms could not be loaded:", error);

    select.innerHTML =
        '<option value="">Select class arm</option>';
}

}

async function loadExistingStudent(studentId) {
const response = await apiRequest(
STUDENT_API + "/" + encodeURIComponent(studentId)
);

existingStudent = extractObject(response);

if (!existingStudent) {
    throw new Error("Student record could not be loaded.");
}

populateStudentForm(existingStudent);

const enrollment =
    await loadExistingEnrollment(studentId);

if (enrollment) {
    populateEnrollmentForm(enrollment);
}

}

async function loadExistingEnrollment(studentId) {
try {
const response = await apiRequest(
ENROLLMENT_API +
"/" +
encodeURIComponent(studentId)
);

    return extractObject(response);
} catch (error) {
    if (
        error.message &&
        error.message.toLowerCase().includes("not found")
    ) {
        return null;
    }

    console.warn(
        "Existing enrollment could not be loaded:",
        error
    );

    return null;
}

}

function populateStudentForm(student) {
setValue(
"admission_number",
student.admission_number ??
student.admissionNumber ??
""
);

setValue(
    "first_name",
    student.first_name ??
    student.firstName ??
    ""
);

setValue(
    "middle_name",
    student.middle_name ??
    student.middleName ??
    ""
);

setValue(
    "last_name",
    student.last_name ??
    student.lastName ??
    ""
);

setValue(
    "gender",
    student.gender ?? ""
);

setValue(
    "date_of_birth",
    formatDateForInput(
        student.date_of_birth ??
        student.dateOfBirth ??
        ""
    )
);

setValue(
    "nationality",
    student.nationality ?? ""
);

setValue(
    "state_of_origin",
    student.state_of_origin ??
    student.stateOfOrigin ??
    ""
);

setValue(
    "local_government",
    student.local_government ??
    student.localGovernment ??
    student.lga ??
    ""
);

setValue(
    "email",
    student.email ?? ""
);

setValue(
    "phone",
    student.phone ??
    student.phone_number ??
    student.phoneNumber ??
    ""
);

setValue(
    "address",
    student.address ?? ""
);

setValue(
    "admission_date",
    formatDateForInput(
        student.admission_date ??
        student.admissionDate ??
        ""
    )
);

setValue(
    "status",
    student.status ??
    student.admission_status ??
    student.admissionStatus ??
    "Active"
);

setValue(
    "notes",
    student.notes ?? ""
);

displayExistingPhoto(student);

}

function populateEnrollmentForm(enrollment) {
const levelValue =
enrollment.academic_level_id ??
enrollment.academicLevelId ??
enrollment.level_id ??
enrollment.levelId ??
"";

const sessionValue =
    enrollment.academic_session_id ??
    enrollment.academicSessionId ??
    enrollment.session_id ??
    enrollment.sessionId ??
    "";

const classValue =
    enrollment.class_id ??
    enrollment.classId ??
    "";

const classArmValue =
    enrollment.class_arm_id ??
    enrollment.classArmId ??
    "";

const departmentValue =
    enrollment.department_id ??
    enrollment.departmentId ??
    "";

setValue("academic_level", levelValue);
setValue("academic_session", sessionValue);

loadClasses()
    .then(function () {
        setValue("class_name", classValue);

        return loadClassArms();
    })
    .then(function () {
        setValue("class_arm", classArmValue);
    })
    .catch(function (error) {
        console.warn(
            "Unable to restore class selection:",
            error
        );
    });

setValue("department", departmentValue);

}

function displayExistingPhoto(student) {
const preview = document.getElementById("photoPreview");

if (!preview) {
    return;
}

const photo =
    student.photo ||
    student.photo_url ||
    student.photoUrl ||
    student.profile_picture ||
    student.profilePicture ||
    student.picture ||
    "";

if (!photo) {
    preview.style.display = "none";
    return;
}

let photoUrl = String(photo);

if (
    !photoUrl.startsWith("http://") &&
    !photoUrl.startsWith("https://") &&
    !photoUrl.startsWith("/")
) {
    photoUrl = "/" + photoUrl;
}

preview.src = photoUrl;
preview.style.display = "block";

}

async function handleFormSubmit(event) {
event.preventDefault();

const form = event.currentTarget;

if (!form.checkValidity()) {
    form.reportValidity();
    return;
}

const submitButton =
    form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

setSubmitState(submitButton, true);

try {
    const studentData = collectStudentData(form);

    validateStudentData(studentData);

    const studentId = editingStudentId
        ? await updateStudent(studentData)
        : await createStudent(studentData);

    if (!studentId) {
        throw new Error(
            "Student was saved, but the student ID was not returned."
        );
    }

    const enrollmentData = collectEnrollmentData();

    if (enrollmentData) {
        await saveEnrollment(
            studentId,
            enrollmentData,
            Boolean(editingStudentId)
        );
    }

    showAlert(
        editingStudentId
            ? "Student updated successfully."
            : "Student created successfully.",
        "success"
    );

    setTimeout(function () {
        window.location.href =
            "/pages/student-profile.html?id=" +
            encodeURIComponent(studentId);
    }, 700);
} catch (error) {
    console.error("Student form submission error:", error);

    showAlert(
        error.message ||
        "Unable to save the student.",
        "danger"
    );
} finally {
    setSubmitState(submitButton, false);
}

}

function collectStudentData(form) {
const photoInput = document.getElementById("photo");
const photoFile =
photoInput?.files?.[0] || null;

return {
    admission_number:
        getValue("admission_number"),

    first_name:
        getValue("first_name"),

    middle_name:
        getValue("middle_name"),

    last_name:
        getValue("last_name"),

    gender:
        getValue("gender"),

    date_of_birth:
        getValue("date_of_birth"),

    nationality:
        getValue("nationality"),

    state_of_origin:
        getValue("state_of_origin"),

    local_government:
        getValue("local_government"),

    email:
        getValue("email"),

    phone:
        getValue("phone"),

    address:
        getValue("address"),

    admission_date:
        getValue("admission_date"),

    status:
        getValue("status"),

    notes:
        getValue("notes"),

    photoFile
};

}

function validateStudentData(data) {
if (!data.admission_number) {
throw new Error("Admission number is required.");
}

if (!data.first_name) {
    throw new Error("First name is required.");
}

if (!data.last_name) {
    throw new Error("Last name is required.");
}

if (data.email && !isValidEmail(data.email)) {
    throw new Error("Please enter a valid email address.");
}

if (data.photoFile) {
    if (!data.photoFile.type.startsWith("image/")) {
        throw new Error(
            "Student photograph must be an image."
        );
    }

    if (data.photoFile.size > 5 * 1024 * 1024) {
        throw new Error(
            "Student photograph must not exceed 5 MB."
        );
    }
}

}

async function createStudent(data) {
const formData = buildStudentFormData(data);

const response = await apiRequest(
    STUDENT_API,
    {
        method: "POST",
        body: formData
    }
);

const student = extractObject(response);

return getStudentIdFromObject(
    student
) || getStudentIdFromObject(
    response
);

}

async function updateStudent(data) {
const formData = buildStudentFormData(data);

const response = await apiRequest(
    STUDENT_API +
    "/" +
    encodeURIComponent(editingStudentId),
    {
        method: "PUT",
        body: formData
    }
);

const student = extractObject(response);

return (
    getStudentIdFromObject(student) ||
    getStudentIdFromObject(response) ||
    editingStudentId
);

}

function buildStudentFormData(data) {
const formData = new FormData();

appendFormValue(
    formData,
    "admission_number",
    data.admission_number
);

appendFormValue(
    formData,
    "first_name",
    data.first_name
);

appendFormValue(
    formData,
    "middle_name",
    data.middle_name
);

appendFormValue(
    formData,
    "last_name",
    data.last_name
);

appendFormValue(
    formData,
    "gender",
    data.gender
);

appendFormValue(
    formData,
    "date_of_birth",
    data.date_of_birth
);

appendFormValue(
    formData,
    "nationality",
    data.nationality
);

appendFormValue(
    formData,
    "state_of_origin",
    data.state_of_origin
);

appendFormValue(
    formData,
    "local_government",
    data.local_government
);

appendFormValue(
    formData,
    "email",
    data.email
);

appendFormValue(
    formData,
    "phone",
    data.phone
);

appendFormValue(
    formData,
    "address",
    data.address
);

appendFormValue(
    formData,
    "admission_date",
    data.admission_date
);

appendFormValue(
    formData,
    "status",
    data.status
);

appendFormValue(
    formData,
    "notes",
    data.notes
);

if (data.photoFile) {
    formData.append(
        "photo",
        data.photoFile
    );
}

return formData;

}

function collectEnrollmentData() {
const academicSession =
getValue("academic_session");

const classId =
    getValue("class_name");

const academicLevel =
    getValue("academic_level");

const classArm =
    getValue("class_arm");

const department =
    getValue("department");

if (
    !academicSession &&
    !classId &&
    !academicLevel
) {
    return null;
}

if (!academicSession) {
    throw new Error(
        "Academic session is required."
    );
}

if (!classId) {
    throw new Error(
        "Class is required."
    );
}

return {
    academicSessionId:
        academicSession,

    classId:
        classId,

    classArmId:
        classArm || null,

    departmentId:
        department || null,

    academicLevelId:
        academicLevel || null,

    enrollmentDate:
        getValue("admission_date") || null,

    admissionStatus:
        getValue("status") ||
        "Active"
};

}

async function saveEnrollment(
studentId,
data,
isUpdate
) {
const url =
ENROLLMENT_API +
"/" +
encodeURIComponent(studentId);

const response = await apiRequest(
    url,
    {
        method: isUpdate
            ? "POST"
            : "POST",
        body: JSON.stringify({
            studentId,
            academicSessionId:
                data.academicSessionId,
            classId:
                data.classId,
            classArmId:
                data.classArmId,
            departmentId:
                data.departmentId,
            academicLevelId:
                data.academicLevelId,
            enrollmentDate:
                data.enrollmentDate,
            admissionStatus:
                data.admissionStatus,
            status:
                data.admissionStatus
        })
    }
);

return extractObject(response);

}

function handleReset() {
const form = document.getElementById("studentForm");

if (!form) {
    return;
}

if (editingStudentId && existingStudent) {
    populateStudentForm(existingStudent);
    return;
}

form.reset();

const preview =
    document.getElementById("photoPreview");

if (preview) {
    preview.src = "";
    preview.style.display = "none";
}

}

function populateSelect(
select,
items,
placeholder,
valueGetter,
textGetter
) {
const currentValue = select.value;

select.innerHTML = "";

const placeholderOption =
    document.createElement("option");

placeholderOption.value = "";
placeholderOption.textContent = placeholder;

select.appendChild(placeholderOption);

items.forEach(function (item) {
    const value = valueGetter(item);

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return;
    }

    const option =
        document.createElement("option");

    option.value = value;
    option.textContent =
        textGetter(item) || value;

    select.appendChild(option);
});

if (currentValue) {
    select.value = currentValue;
}

}

function getItemId(item) {
return (
item.id ??
item.academic_level_id ??
item.academicLevelId ??
item.academic_session_id ??
item.academicSessionId ??
item.class_id ??
item.classId ??
item.class_arm_id ??
item.classArmId ??
item.department_id ??
item.departmentId ??
""
);
}

function extractArray(response) {
if (Array.isArray(response)) {
return response;
}

if (!response || typeof response !== "object") {
    return [];
}

if (Array.isArray(response.data)) {
    return response.data;
}

if (Array.isArray(response.students)) {
    return response.students;
}

if (Array.isArray(response.items)) {
    return response.items;
}

if (Array.isArray(response.rows)) {
    return response.rows;
}

if (Array.isArray(response.results)) {
    return response.results;
}

return [];

}

function extractObject(response) {
if (!response || typeof response !== "object") {
return null;
}

if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
) {
    return response.data;
}

if (
    response.student &&
    typeof response.student === "object"
) {
    return response.student;
}

if (
    response.enrollment &&
    typeof response.enrollment === "object"
) {
    return response.enrollment;
}

if (
    response.result &&
    typeof response.result === "object"
) {
    return response.result;
}

return response;

}

function getStudentIdFromObject(object) {
if (!object || typeof object !== "object") {
return null;
}

return (
    object.id ??
    object.student_id ??
    object.studentId ??
    object.data?.id ??
    object.data?.student_id ??
    object.data?.studentId ??
    null
);

}

async function apiRequest(
url,
options = {}
) {
const requestOptions = {
...options,
headers: {
...(options.headers || {})
}
};

const token =
    getStoredToken();

if (token) {
    requestOptions.headers.Authorization =
        "Bearer " + token;
}

if (
    requestOptions.body &&
    typeof requestOptions.body === "string" &&
    !requestOptions.headers["Content-Type"]
) {
    requestOptions.headers["Content-Type"] =
        "application/json";
}

const response =
    await fetch(url, requestOptions);

let payload = null;

const contentType =
    response.headers.get("content-type") || "";

if (contentType.includes("application/json")) {
    payload = await response.json();
} else {
    const text = await response.text();

    try {
        payload = text
            ? JSON.parse(text)
            : null;
    } catch (error) {
        payload = {
            message: text
        };
    }
}

if (!response.ok) {
    throw new Error(
        payload?.message ||
        payload?.error ||
        "Request failed with status " +
        response.status
    );
}

return payload;

}

function getStoredToken() {
return (
localStorage.getItem("token") ||
sessionStorage.getItem("token") ||
localStorage.getItem("accessToken") ||
sessionStorage.getItem("accessToken") ||
""
);
}

function appendFormValue(
formData,
key,
value
) {
if (
value !== undefined &&
value !== null &&
value !== ""
) {
formData.append(key, value);
}
}

function setValue(id, value) {
const element =
document.getElementById(id);

if (!element) {
    return;
}

element.value =
    value === undefined ||
    value === null
        ? ""
        : value;

}

function getValue(id) {
const element =
document.getElementById(id);

if (!element) {
    return "";
}

return String(element.value || "").trim();

}

function formatDateForInput(value) {
if (!value) {
return "";
}

const stringValue =
    String(value);

if (
    /^\d{4}-\d{2}-\d{2}$/.test(
        stringValue
    )
) {
    return stringValue;
}

const date =
    new Date(stringValue);

if (Number.isNaN(date.getTime())) {
    return "";
}

const year =
    date.getFullYear();

const month =
    String(
        date.getMonth() + 1
    ).padStart(2, "0");

const day =
    String(
        date.getDate()
    ).padStart(2, "0");

return (
    year +
    "-" +
    month +
    "-" +
    day
);

}

function isValidEmail(email) {
return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(
email
);
}

function setSubmitState(
button,
loading
) {
if (!button) {
return;
}

if (loading) {
    button.dataset.originalText =
        button.textContent;

    button.disabled = true;
    button.textContent = "Saving...";
} else {
    button.disabled = false;

    if (
        button.dataset.originalText
    ) {
        button.textContent =
            button.dataset.originalText;
    }
}

}

function setPageMode(title) {
document.title =
title + " | School Management System";

const heading =
    document.querySelector(
        "h1, h2, .page-title"
    );

if (
    heading &&
    heading.textContent
        .toLowerCase()
        .includes("student")
) {
    heading.textContent = title;
}

}

function showAlert(
message,
type = "info"
) {
const pageMessage =
document.getElementById(
"pageMessage"
);

if (pageMessage) {
    pageMessage.className =
        "alert alert-" + type;

    pageMessage.textContent =
        message;

    pageMessage.style.display =
        "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    return;
}

const alertBox =
    document.createElement("div");

alertBox.className =
    "alert alert-" + type;

alertBox.textContent =
    message;

alertBox.style.position =
    "fixed";

alertBox.style.top =
    "20px";

alertBox.style.right =
    "20px";

alertBox.style.zIndex =
    "9999";

document.body.appendChild(
    alertBox
);

setTimeout(function () {
    alertBox.remove();
}, 5000);

}

window.studentForm = {
initialiseStudentForm,
loadAcademicLevels,
loadAcademicSessions,
loadDepartments,
loadClasses,
loadClassArms,
loadExistingStudent,
handleFormSubmit
};
