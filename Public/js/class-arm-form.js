"use strict";

const CLASS_API = "/api/classes";
const CLASS_ARM_API = "/api/class-arms";
const STAFF_API = "/api/staff";

const form = document.getElementById("classArmForm");
const message = document.getElementById("message");
const loading = document.getElementById("loading");
const submitButton = document.getElementById("submitButton");

const pageTitle = document.getElementById("pageTitle");
const formTitle = document.getElementById("formTitle");

const classSelect = document.getElementById("classId");
const teacherSelect = document.getElementById("classTeacherId");

const armNameInput = document.getElementById("armName");
const armCodeInput = document.getElementById("armCode");
const capacityInput = document.getElementById("capacity");
const descriptionInput = document.getElementById("description");

let editingId = null;

function getToken() {
return (
sessionStorage.getItem("school_management_token") ||
localStorage.getItem("school_management_token") ||
sessionStorage.getItem("token") ||
localStorage.getItem("token") ||
sessionStorage.getItem("accessToken") ||
localStorage.getItem("accessToken") ||
""
);
}

function buildHeaders() {
const headers = {
"Content-Type": "application/json"
};

```
const token = getToken();

if (token) {
    headers.Authorization = `Bearer ${token}`;
}

return headers;
```

}

async function apiRequest(url, options = {}) {
const response = await fetch(`/api${url}`, {
...options,
headers: {
...buildHeaders(),
...(options.headers || {})
}
});

```
let data = null;

try {
    data = await response.json();
} catch {
    data = null;
}

if (response.status === 401) {
    throw new Error("Your session has expired. Please log in again.");
}

if (response.status === 403) {
    throw new Error("You do not have permission to perform this action.");
}

if (!response.ok) {
    throw new Error(
        data?.message ||
        data?.error ||
        "Request failed."
    );
}

return data;
```

}

function extractArray(result) {
if (Array.isArray(result)) {
return result;
}

```
if (Array.isArray(result?.data)) {
    return result.data;
}

if (Array.isArray(result?.data?.rows)) {
    return result.data.rows;
}

if (Array.isArray(result?.rows)) {
    return result.rows;
}

if (Array.isArray(result?.classes)) {
    return result.classes;
}

if (Array.isArray(result?.staff)) {
    return result.staff;
}

return [];
```

}

function extractObject(result) {
if (!result) {
return null;
}

```
if (result?.data && !Array.isArray(result.data)) {
    return result.data;
}

if (result?.classArm) {
    return result.classArm;
}

if (result?.class_arm) {
    return result.class_arm;
}

return result;
```

}

function showMessage(text, type = "error") {
if (!message) {
return;
}

```
message.textContent = text || "";
message.className = `message ${type}`;
```

}

function hideMessage() {
if (!message) {
return;
}

```
message.textContent = "";
message.className = "message";
```

}

function setLoading(state) {
if (loading) {
loading.style.display = state ? "block" : "none";
}

```
if (!submitButton) {
    return;
}

submitButton.disabled = state;

if (state) {
    submitButton.innerHTML =
        '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
    return;
}

submitButton.innerHTML = editingId
    ? '<i class="bi bi-check-lg me-1"></i> Update Class Arm'
    : '<i class="bi bi-check-lg me-1"></i> Save Class Arm';
```

}

function getClassId(item) {
return (
item?.id ||
item?.class_id ||
item?.classId ||
""
);
}

function getClassName(item) {
return (
item?.class_name ||
item?.className ||
item?.name ||
""
);
}

function getStaffId(item) {
return (
item?.id ||
item?.staff_id ||
item?.staffId ||
""
);
}

function getStaffName(item) {
const firstName =
item?.first_name ||
item?.firstName ||
"";

```
const middleName =
    item?.middle_name ||
    item?.middleName ||
    "";

const lastName =
    item?.last_name ||
    item?.lastName ||
    "";

const fullName = [
    firstName,
    middleName,
    lastName
]
    .filter(Boolean)
    .join(" ")
    .trim();

return (
    fullName ||
    item?.staff_name ||
    item?.staffName ||
    item?.name ||
    item?.full_name ||
    item?.fullName ||
    ""
);
```

}

function getClassArmId(arm) {
return (
arm?.id ||
arm?.class_arm_id ||
arm?.classArmId ||
""
);
}

function getArmName(arm) {
return (
arm?.arm_name ||
arm?.armName ||
""
);
}

function getArmCode(arm) {
return (
arm?.arm_code ||
arm?.armCode ||
""
);
}

function getCapacity(arm) {
if (
arm?.capacity === null ||
arm?.capacity === undefined ||
arm?.capacity === ""
) {
return "";
}

```
return arm.capacity;
```

}

function getClassTeacherId(arm) {
return (
arm?.class_teacher_id ||
arm?.classTeacherId ||
arm?.teacher_id ||
arm?.teacherId ||
""
);
}

function getDescription(arm) {
return arm?.description || "";
}

function getIsActive(arm) {
if (typeof arm?.is_active === "boolean") {
return arm.is_active;
}

```
if (typeof arm?.isActive === "boolean") {
    return arm.isActive;
}

if (typeof arm?.status === "string") {
    return arm.status.toLowerCase() === "active";
}

return true;
```

}

function getSelectedStatus() {
const selected = document.querySelector(
'input[name="status"]:checked'
);

```
return selected?.value === "inactive"
    ? "inactive"
    : "active";
```

}

function setSelectedStatus(status) {
const normalized =
String(status || "active").toLowerCase();

```
const activeInput =
    document.getElementById("statusActive");

const inactiveInput =
    document.getElementById("statusInactive");

if (normalized === "inactive") {
    if (inactiveInput) {
        inactiveInput.checked = true;
    }

    return;
}

if (activeInput) {
    activeInput.checked = true;
}
```

}

function populateClassSelect(classes) {
if (!classSelect) {
return;
}

```
classSelect.innerHTML =
    '<option value="">Select class</option>';

classes.forEach(schoolClass => {
    const classId = getClassId(schoolClass);
    const className = getClassName(schoolClass);

    if (!classId) {
        return;
    }

    const option =
        document.createElement("option");

    option.value = classId;
    option.textContent =
        className || `Class ${classId}`;

    classSelect.appendChild(option);
});
```

}

function populateTeacherSelect(staff) {
if (!teacherSelect) {
return;
}

```
teacherSelect.innerHTML =
    '<option value="">Select class teacher</option>';

staff.forEach(member => {
    const staffId = getStaffId(member);
    const staffName = getStaffName(member);

    if (!staffId) {
        return;
    }

    const option =
        document.createElement("option");

    option.value = staffId;
    option.textContent =
        staffName || `Staff ${staffId}`;

    teacherSelect.appendChild(option);
});
```

}

async function loadClasses() {
if (!classSelect) {
return;
}

```
classSelect.innerHTML =
    '<option value="">Loading classes...</option>';

try {
    const result =
        await apiRequest(CLASS_API);

    const classes =
        extractArray(result);

    populateClassSelect(classes);

} catch (error) {
    console.error(
        "Load classes error:",
        error
    );

    classSelect.innerHTML =
        '<option value="">Unable to load classes</option>';

    throw error;
}
```

}

async function loadTeachers() {
if (!teacherSelect) {
return;
}

```
teacherSelect.innerHTML =
    '<option value="">Loading teachers...</option>';

try {
    const result =
        await apiRequest(STAFF_API);

    const staff =
        extractArray(result);

    populateTeacherSelect(staff);

} catch (error) {
    console.error(
        "Load teachers error:",
        error
    );

    teacherSelect.innerHTML =
        '<option value="">Unable to load teachers</option>';

    showMessage(
        `Classes can still be selected, but teachers could not be loaded. ${error.message}`,
        "error"
    );
}
```

}

async function loadClassArm(id) {
if (!id) {
return;
}

```
try {
    setLoading(true);

    const result =
        await apiRequest(
            `${CLASS_ARM_API}/${encodeURIComponent(id)}`
        );

    const arm =
        extractObject(result);

    if (!arm) {
        throw new Error(
            "Class arm could not be found."
        );
    }

    const classId =
        arm.class_id ||
        arm.classId ||
        "";

    classSelect.value = classId;

    armNameInput.value =
        getArmName(arm);

    armCodeInput.value =
        getArmCode(arm);

    capacityInput.value =
        getCapacity(arm);

    teacherSelect.value =
        getClassTeacherId(arm);

    descriptionInput.value =
        getDescription(arm);

    setSelectedStatus(
        getIsActive(arm)
            ? "active"
            : "inactive"
    );

    if (pageTitle) {
        pageTitle.innerHTML =
            '<i class="bi bi-pencil-square me-2 text-primary"></i> Edit Class Arm';
    }

    if (formTitle) {
        formTitle.textContent =
            "Update Class Arm";
    }

    if (submitButton) {
        submitButton.innerHTML =
            '<i class="bi bi-check-lg me-1"></i> Update Class Arm';
    }

    hideMessage();

} catch (error) {
    console.error(
        "Load class arm error:",
        error
    );

    showMessage(
        error.message ||
        "Unable to load class arm.",
        "error"
    );

} finally {
    setLoading(false);
}
```

}

function getFormData() {
const capacityValue =
capacityInput?.value.trim() || "";

```
const capacity =
    capacityValue === ""
        ? null
        : Number(capacityValue);

return {
    classId:
        classSelect?.value || "",

    armName:
        armNameInput?.value.trim() || "",

    armCode:
        armCodeInput?.value.trim() || null,

    capacity,

    classTeacherId:
        teacherSelect?.value || null,

    description:
        descriptionInput?.value.trim() || null,

    status:
        getSelectedStatus(),

    isActive:
        getSelectedStatus() === "active"
};
```

}

function validateForm(data) {
if (!data.classId) {
showMessage(
"Please select a class.",
"error"
);

```
    classSelect?.focus();
    return false;
}

if (!data.armName) {
    showMessage(
        "Please enter the arm name.",
        "error"
    );

    armNameInput?.focus();
    return false;
}

if (data.armName.length > 100) {
    showMessage(
        "Arm name cannot exceed 100 characters.",
        "error"
    );

    armNameInput?.focus();
    return false;
}

if (data.armCode && data.armCode.length > 50) {
    showMessage(
        "Arm code cannot exceed 50 characters.",
        "error"
    );

    armCodeInput?.focus();
    return false;
}

if (
    data.capacity !== null &&
    (
        !Number.isInteger(data.capacity) ||
        data.capacity < 1 ||
        data.capacity > 1000
    )
) {
    showMessage(
        "Capacity must be a whole number between 1 and 1000.",
        "error"
    );

    capacityInput?.focus();
    return false;
}

if (
    data.description &&
    data.description.length > 500
) {
    showMessage(
        "Description cannot exceed 500 characters.",
        "error"
    );

    descriptionInput?.focus();
    return false;
}

return true;
```

}

function buildPayload(data) {
return {
classId: data.classId,
armName: data.armName,
armCode: data.armCode,
capacity: data.capacity,
classTeacherId: data.classTeacherId,
description: data.description,
isActive: data.isActive
};
}

async function saveClassArm(data) {
const payload =
buildPayload(data);

```
if (editingId) {
    return apiRequest(
        `${CLASS_ARM_API}/${encodeURIComponent(editingId)}`,
        {
            method: "PUT",
            body: JSON.stringify(payload)
        }
    );
}

return apiRequest(
    CLASS_ARM_API,
    {
        method: "POST",
        body: JSON.stringify(payload)
    }
);
```

}

function redirectToClassArms() {
window.location.href =
"class-arms.html";
}

if (form) {
form.addEventListener(
"submit",
async event => {
event.preventDefault();

```
        hideMessage();

        const data =
            getFormData();

        if (!validateForm(data)) {
            return;
        }

        try {
            setLoading(true);

            const result =
                await saveClassArm(data);

            showMessage(
                result?.message ||
                (
                    editingId
                        ? "Class arm updated successfully."
                        : "Class arm created successfully."
                ),
                "success"
            );

            setTimeout(
                redirectToClassArms,
                1000
            );

        } catch (error) {
            console.error(
                "Save class arm error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to save class arm.",
                "error"
            );

        } finally {
            setLoading(false);
        }
    }
);
```

}

async function initialisePage() {
const params =
new URLSearchParams(
window.location.search
);

```
editingId =
    params.get("id");

try {
    await Promise.all([
        loadClasses(),
        loadTeachers()
    ]);
} catch (error) {
    console.error(
        "Initial page loading error:",
        error
    );
}

if (editingId) {
    await loadClassArm(editingId);
}
```

}

initialisePage();
