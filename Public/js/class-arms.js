"use strict";

const addClassArmBtn = document.getElementById("addClassArmBtn");
const classArmModalElement = document.getElementById("classArmModal");
const classArmForm = document.getElementById("classArmForm");
const modalTitle = document.getElementById("modalTitle");
const saveClassArmBtn = document.getElementById("saveClassArmBtn");

const classIdInput = document.getElementById("classId");
const armNameInput = document.getElementById("armName");
const armCodeInput = document.getElementById("armCode");
const capacityInput = document.getElementById("capacity");
const armStatusInput = document.getElementById("armStatus");
const descriptionInput = document.getElementById("description");

const table = document.getElementById("classArmsTable");
const tableBody = document.getElementById("classArmsTableBody");
const emptyState = document.getElementById("emptyState");
const alertMessage = document.getElementById("alertMessage");

const totalClassArms = document.getElementById("totalClassArms");
const activeClassArms = document.getElementById("activeClassArms");
const inactiveClassArms = document.getElementById("inactiveClassArms");
const studentsAssigned = document.getElementById("studentsAssigned");

const searchInput = document.getElementById("searchInput");
const classFilter = document.getElementById("classFilter");
const statusFilter = document.getElementById("statusFilter");

const CLASSES_API = "/api/classes";
const CLASS_ARMS_API = "/api/class-arms";

let classArms = [];
let classes = [];
let editingClassArmId = null;
let bootstrapModal = null;

if (
classArmModalElement &&
typeof bootstrap !== "undefined"
) {
bootstrapModal = new bootstrap.Modal(
classArmModalElement
);
}

function getToken() {
const keys = [
"school_management_token",
"token",
"accessToken"
];

```
for (const key of keys) {
    const sessionToken =
        sessionStorage.getItem(key);

    if (sessionToken) {
        return sessionToken;
    }

    const localToken =
        localStorage.getItem(key);

    if (localToken) {
        return localToken;
    }
}

return null;
```

}

function buildHeaders(options = {}) {
const headers = {
...(options.headers || {})
};

```
if (!headers["Content-Type"] && options.body !== undefined) {
    headers["Content-Type"] =
        "application/json";
}

const token = getToken();

if (token) {
    headers.Authorization =
        "Bearer " + token;
}

return headers;
```

}

async function apiRequest(url, options = {}) {
const requestOptions = {
...options,
headers: buildHeaders(options)
};

```
const response = await fetch(
    url,
    requestOptions
);

let data = null;

const contentType =
    response.headers.get("content-type") || "";

if (contentType.includes("application/json")) {
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }
} else {
    try {
        const text = await response.text();

        data = text
            ? {
                message: text
            }
            : null;
    } catch (error) {
        data = null;
    }
}

if (!response.ok) {
    const error = new Error(
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );

    error.status =
        response.status;

    error.data = data;

    throw error;
}

return data;
```

}

function extractArray(data, keys = []) {
if (Array.isArray(data)) {
return data;
}

```
if (!data || typeof data !== "object") {
    return [];
}

for (const key of keys) {
    if (Array.isArray(data[key])) {
        return data[key];
    }
}

if (Array.isArray(data.data)) {
    return data.data;
}

return [];
```

}

function showAlert(
message,
type = "success"
) {
if (!alertMessage) {
return;
}

```
alertMessage.className =
    "alert alert-" + type;

alertMessage.textContent =
    message;

alertMessage.classList.remove(
    "d-none"
);

alertMessage.style.display =
    "block";

window.clearTimeout(
    showAlert.timeoutId
);

showAlert.timeoutId =
    window.setTimeout(() => {
        alertMessage.classList.add(
            "d-none"
        );

        alertMessage.style.display =
            "none";
    }, 4000);
```

}

function showFormAlert(
message,
type = "danger"
) {
const formAlert =
document.getElementById(
"formAlertMessage"
);

```
if (!formAlert) {
    showAlert(message, type);
    return;
}

formAlert.className =
    "alert alert-" + type;

formAlert.textContent =
    message;

formAlert.classList.remove(
    "d-none"
);
```

}

function clearFormAlert() {
const formAlert =
document.getElementById(
"formAlertMessage"
);

```
if (!formAlert) {
    return;
}

formAlert.textContent = "";

formAlert.className =
    "alert d-none";
```

}

function escapeHtml(value) {
if (
value === null ||
value === undefined
) {
return "";
}

```
return String(value)
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
```

}

function getClassId(classArm) {
return (
classArm?.classId ||
classArm?.class_id ||
""
);
}

function getClassName(classArm) {
return (
classArm?.className ||
classArm?.class_name ||
classArm?.class?.className ||
classArm?.class?.class_name ||
classArm?.name ||
"—"
);
}

function getArmName(classArm) {
return (
classArm?.armName ||
classArm?.arm_name ||
"—"
);
}

function getArmCode(classArm) {
return (
classArm?.armCode ||
classArm?.arm_code ||
"—"
);
}

function getCapacity(classArm) {
const value =
classArm?.capacity ??
classArm?.studentCapacity ??
classArm?.student_capacity ??
null;

```
if (
    value === null ||
    value === undefined ||
    value === ""
) {
    return "—";
}

return value;
```

}

function getDescription(classArm) {
return (
classArm?.description ||
""
);
}

function getStatus(classArm) {
if (
classArm?.status !== undefined &&
classArm?.status !== null
) {
return String(
classArm.status
).toLowerCase();
}

```
if (
    classArm?.isActive !== undefined &&
    classArm?.isActive !== null
) {
    return classArm.isActive
        ? "active"
        : "inactive";
}

if (
    classArm?.is_active !== undefined &&
    classArm?.is_active !== null
) {
    return classArm.is_active
        ? "active"
        : "inactive";
}

return "active";
```

}

function getStudentCount(classArm) {
const value =
classArm?.studentCount ??
classArm?.student_count ??
classArm?.studentsCount ??
classArm?.students_count ??
classArm?.studentsAssigned ??
0;

```
const number =
    Number(value);

return Number.isFinite(number)
    ? number
    : 0;
```

}

function getClassArmId(classArm) {
return (
classArm?.id ||
classArm?.classArmId ||
classArm?.class_arm_id ||
""
);
}

function updateStatistics() {
const total =
classArms.length;

```
const active =
    classArms.filter(
        arm =>
            getStatus(arm) ===
            "active"
    ).length;

const inactive =
    total - active;

const students =
    classArms.reduce(
        (sum, arm) =>
            sum +
            getStudentCount(arm),
        0
    );

if (totalClassArms) {
    totalClassArms.textContent =
        total;
}

if (activeClassArms) {
    activeClassArms.textContent =
        active;
}

if (inactiveClassArms) {
    inactiveClassArms.textContent =
        inactive;
}

if (studentsAssigned) {
    studentsAssigned.textContent =
        students;
}
```

}

function sortClasses(items) {
return items
.slice()
.sort((a, b) => {
const nameA =
a?.className ||
a?.class_name ||
"";

```
        const nameB =
            b?.className ||
            b?.class_name ||
            "";

        return String(nameA).localeCompare(
            String(nameB),
            undefined,
            {
                numeric: true,
                sensitivity: "base"
            }
        );
    });
```

}

function renderClassFilter() {
if (!classFilter) {
return;
}

```
const currentValue =
    classFilter.value;

classFilter.innerHTML =
    '<option value="">All Classes</option>';

sortClasses(classes)
    .forEach(classItem => {
        const id =
            classItem?.id ||
            classItem?.classId ||
            classItem?.class_id ||
            "";

        const name =
            classItem?.className ||
            classItem?.class_name ||
            "Unnamed Class";

        if (!id) {
            return;
        }

        const option =
            document.createElement(
                "option"
            );

        option.value = id;
        option.textContent = name;

        classFilter.appendChild(
            option
        );
    });

if (
    currentValue &&
    Array.from(
        classFilter.options
    ).some(
        option =>
            option.value ===
            currentValue
    )
) {
    classFilter.value =
        currentValue;
}
```

}

function renderClassDropdown(
selectedValue = ""
) {
if (!classIdInput) {
return;
}

```
classIdInput.innerHTML =
    '<option value="">Select Class</option>';

sortClasses(classes)
    .forEach(classItem => {
        const id =
            classItem?.id ||
            classItem?.classId ||
            classItem?.class_id ||
            "";

        const name =
            classItem?.className ||
            classItem?.class_name ||
            "Unnamed Class";

        if (!id) {
            return;
        }

        const option =
            document.createElement(
                "option"
            );

        option.value = id;
        option.textContent = name;

        if (
            selectedValue &&
            String(id) ===
                String(selectedValue)
        ) {
            option.selected = true;
        }

        classIdInput.appendChild(
            option
        );
    });
```

}

function renderTable() {
if (
!table ||
!tableBody ||
!emptyState
) {
return;
}

```
const searchTerm =
    searchInput
        ? searchInput.value
            .trim()
            .toLowerCase()
        : "";

const selectedClass =
    classFilter
        ? classFilter.value
        : "";

const selectedStatus =
    statusFilter
        ? statusFilter.value
            .toLowerCase()
        : "";

const filtered =
    classArms.filter(arm => {
        const className =
            getClassName(
                arm
            ).toLowerCase();

        const armName =
            getArmName(
                arm
            ).toLowerCase();

        const armCode =
            getArmCode(
                arm
            ).toLowerCase();

        const status =
            getStatus(arm);

        const matchesSearch =
            !searchTerm ||
            className.includes(
                searchTerm
            ) ||
            armName.includes(
                searchTerm
            ) ||
            armCode.includes(
                searchTerm
            );

        const matchesClass =
            !selectedClass ||
            String(
                getClassId(arm)
            ) ===
                String(
                    selectedClass
                );

        const matchesStatus =
            !selectedStatus ||
            status ===
                selectedStatus;

        return (
            matchesSearch &&
            matchesClass &&
            matchesStatus
        );
    });

tableBody.innerHTML = "";

if (filtered.length === 0) {
    table.style.display =
        "none";

    emptyState.style.display =
        "block";

    return;
}

table.style.display =
    "table";

emptyState.style.display =
    "none";

filtered.forEach(arm => {
    const row =
        document.createElement(
            "tr"
        );

    const status =
        getStatus(arm);

    const statusBadge =
        status === "active"
            ? `
                <span class="badge bg-success-subtle text-success status-badge">
                    Active
                </span>
            `
            : `
                <span class="badge bg-secondary-subtle text-secondary status-badge">
                    Inactive
                </span>
            `;

    const id =
        getClassArmId(arm);

    row.innerHTML = `
        <td class="ps-4 fw-semibold">
            ${escapeHtml(
                getClassName(arm)
            )}
        </td>

        <td>
            ${escapeHtml(
                getArmName(arm)
            )}
        </td>

        <td>
            <span class="arm-code text-secondary">
                ${escapeHtml(
                    getArmCode(arm)
                )}
            </span>
        </td>

        <td>
            ${escapeHtml(
                getCapacity(arm)
            )}
        </td>

        <td>
            ${escapeHtml(
                getStudentCount(arm)
            )}
        </td>

        <td>
            ${statusBadge}
        </td>

        <td class="pe-4">
            <div
                class="action-buttons"
                role="group"
                aria-label="Class arm actions"
            >

                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary edit-arm-btn"
                    data-id="${escapeHtml(id)}"
                    title="Edit class arm"
                >
                    <i class="bi bi-pencil"></i>
                </button>

                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger delete-arm-btn"
                    data-id="${escapeHtml(id)}"
                    title="Delete class arm"
                >
                    <i class="bi bi-trash"></i>
                </button>

            </div>
        </td>
    `;

    tableBody.appendChild(
        row
    );
});

attachRowActions();
```

}

function attachRowActions() {
document
.querySelectorAll(
".edit-arm-btn"
)
.forEach(button => {
button.addEventListener(
"click",
() => {
openEditModal(
button.dataset.id
);
}
);
});

```
document
    .querySelectorAll(
        ".delete-arm-btn"
    )
    .forEach(button => {
        button.addEventListener(
            "click",
            () => {
                deleteClassArm(
                    button.dataset.id
                );
            }
        );
    });
```

}

function resetForm() {
if (!classArmForm) {
return;
}

```
classArmForm.reset();

editingClassArmId = null;

clearFormAlert();

if (modalTitle) {
    modalTitle.textContent =
        "Add Class Arm";
}

if (saveClassArmBtn) {
    saveClassArmBtn.disabled =
        false;

    saveClassArmBtn.innerHTML =
        '<i class="bi bi-check2-circle me-2"></i>Save Class Arm';
}

if (armStatusInput) {
    armStatusInput.value =
        "active";
}

if (capacityInput) {
    capacityInput.value =
        "";
}

if (classIdInput) {
    classIdInput.value =
        "";
}
```

}

function openAddModal() {
resetForm();

```
renderClassDropdown();

if (bootstrapModal) {
    bootstrapModal.show();
}
```

}

function openEditModal(id) {
const arm =
classArms.find(
item =>
String(
getClassArmId(item)
) ===
String(id)
);

```
if (!arm) {
    showAlert(
        "Class arm could not be found.",
        "danger"
    );

    return;
}

editingClassArmId =
    getClassArmId(arm);

clearFormAlert();

renderClassDropdown(
    getClassId(arm)
);

if (classIdInput) {
    classIdInput.value =
        getClassId(arm);
}

if (armNameInput) {
    armNameInput.value =
        getArmName(arm) === "—"
            ? ""
            : getArmName(arm);
}

if (armCodeInput) {
    armCodeInput.value =
        getArmCode(arm) === "—"
            ? ""
            : getArmCode(arm);
}

if (capacityInput) {
    const capacity =
        getCapacity(arm);

    capacityInput.value =
        capacity === "—"
            ? ""
            : capacity;
}

if (armStatusInput) {
    armStatusInput.value =
        getStatus(arm) ===
        "inactive"
            ? "inactive"
            : "active";
}

if (descriptionInput) {
    descriptionInput.value =
        getDescription(arm);
}

if (modalTitle) {
    modalTitle.textContent =
        "Edit Class Arm";
}

if (saveClassArmBtn) {
    saveClassArmBtn.disabled =
        false;

    saveClassArmBtn.innerHTML =
        '<i class="bi bi-check2-circle me-2"></i>Update Class Arm';
}

if (bootstrapModal) {
    bootstrapModal.show();
}
```

}

async function loadClasses() {
const data =
await apiRequest(
CLASSES_API
);

```
classes =
    extractArray(
        data,
        [
            "classes",
            "rows",
            "items"
        ]
    );

renderClassDropdown();
renderClassFilter();
```

}

async function loadClassArms() {
const data =
await apiRequest(
CLASS_ARMS_API
);

```
classArms =
    extractArray(
        data,
        [
            "classArms",
            "class_arms",
            "rows",
            "items"
        ]
    );

updateStatistics();
renderTable();
```

}

async function loadPageData() {
try {
if (table) {
table.style.display =
"none";
}

```
    if (emptyState) {
        emptyState.style.display =
            "none";
    }

    await loadClasses();
    await loadClassArms();

} catch (error) {
    console.error(
        "Class arms loading error:",
        error
    );

    if (error.status === 401) {
        showAlert(
            "Your session has expired. Please log in again.",
            "warning"
        );
    } else if (
        error.status === 403
    ) {
        showAlert(
            "You do not have permission to access class arms.",
            "danger"
        );
    } else {
        showAlert(
            error.message ||
            "Unable to load class arms.",
            "danger"
        );
    }

} finally {
    const loadingState =
        document.getElementById(
            "loadingState"
        );

    if (loadingState) {
        loadingState.style.display =
            "none";
    }
}
```

}

async function saveClassArm(event) {
event.preventDefault();

```
clearFormAlert();

const classId =
    classIdInput
        ? classIdInput.value.trim()
        : "";

const armName =
    armNameInput
        ? armNameInput.value.trim()
        : "";

const armCode =
    armCodeInput
        ? armCodeInput.value.trim()
        : "";

const capacityValue =
    capacityInput
        ? capacityInput.value.trim()
        : "";

const status =
    armStatusInput
        ? armStatusInput.value
        : "active";

const description =
    descriptionInput
        ? descriptionInput.value.trim()
        : "";

if (!classId) {
    showFormAlert(
        "Please select a class.",
        "warning"
    );

    if (classIdInput) {
        classIdInput.focus();
    }

    return;
}

if (!armName) {
    showFormAlert(
        "Please enter the arm name.",
        "warning"
    );

    if (armNameInput) {
        armNameInput.focus();
    }

    return;
}

if (armName.length > 100) {
    showFormAlert(
        "Arm name must not exceed 100 characters.",
        "warning"
    );

    if (armNameInput) {
        armNameInput.focus();
    }

    return;
}

if (armCode.length > 50) {
    showFormAlert(
        "Arm code must not exceed 50 characters.",
        "warning"
    );

    if (armCodeInput) {
        armCodeInput.focus();
    }

    return;
}

let capacity = null;

if (capacityValue !== "") {
    capacity =
        Number(capacityValue);

    if (
        !Number.isInteger(
            capacity
        ) ||
        capacity < 1
    ) {
        showFormAlert(
            "Student capacity must be a whole number greater than zero.",
            "warning"
        );

        if (capacityInput) {
            capacityInput.focus();
        }

        return;
    }
}

if (
    description.length > 1000
) {
    showFormAlert(
        "Description must not exceed 1000 characters.",
        "warning"
    );

    if (descriptionInput) {
        descriptionInput.focus();
    }

    return;
}

if (
    status !== "active" &&
    status !== "inactive"
) {
    showFormAlert(
        "Please select a valid status.",
        "warning"
    );

    return;
}

const payload = {
    classId,
    armName,
    armCode:
        armCode || null,
    capacity,
    description:
        description || null,
    isActive:
        status === "active"
};

const wasEditing =
    Boolean(
        editingClassArmId
    );

try {
    if (saveClassArmBtn) {
        saveClassArmBtn.disabled =
            true;

        saveClassArmBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
    }

    if (editingClassArmId) {
        await apiRequest(
            `${CLASS_ARMS_API}/${encodeURIComponent(
                editingClassArmId
            )}`,
            {
                method: "PUT",
                body: JSON.stringify(
                    payload
                )
            }
        );
    } else {
        await apiRequest(
            CLASS_ARMS_API,
            {
                method: "POST",
                body: JSON.stringify(
                    payload
                )
            }
        );
    }

    if (bootstrapModal) {
        bootstrapModal.hide();
    }

    resetForm();

    await loadClassArms();

    showAlert(
        wasEditing
            ? "Class arm updated successfully."
            : "Class arm created successfully.",
        "success"
    );

} catch (error) {
    console.error(
        "Save class arm error:",
        error
    );

    if (error.status === 401) {
        showFormAlert(
            "Your session has expired. Please log in again.",
            "warning"
        );
    } else if (
        error.status === 403
    ) {
        showFormAlert(
            "You do not have permission to save this class arm.",
            "danger"
        );
    } else if (
        error.status === 409
    ) {
        showFormAlert(
            error.message ||
            "This class arm already exists.",
            "warning"
        );
    } else {
        showFormAlert(
            error.message ||
            "Unable to save class arm. Please try again.",
            "danger"
        );
    }

} finally {
    if (saveClassArmBtn) {
        saveClassArmBtn.disabled =
            false;

        saveClassArmBtn.innerHTML =
            wasEditing
                ? '<i class="bi bi-check2-circle me-2"></i>Update Class Arm'
                : '<i class="bi bi-check2-circle me-2"></i>Save Class Arm';
    }
}
```

}

async function deleteClassArm(id) {
const arm =
classArms.find(
item =>
String(
getClassArmId(item)
) ===
String(id)
);

```
if (!arm) {
    showAlert(
        "Class arm could not be found.",
        "danger"
    );

    return;
}

const className =
    getClassName(arm);

const armName =
    getArmName(arm);

const confirmed =
    window.confirm(
        `Are you sure you want to delete ${className} ${armName}?`
    );

if (!confirmed) {
    return;
}

try {
    await apiRequest(
        `${CLASS_ARMS_API}/${encodeURIComponent(
            id
        )}`,
        {
            method: "DELETE"
        }
    );

    await loadClassArms();

    showAlert(
        "Class arm deleted successfully.",
        "success"
    );

} catch (error) {
    console.error(
        "Delete class arm error:",
        error
    );

    if (error.status === 401) {
        showAlert(
            "Your session has expired. Please log in again.",
            "warning"
        );
    } else if (
        error.status === 403
    ) {
        showAlert(
            "You do not have permission to delete this class arm.",
            "danger"
        );
    } else {
        showAlert(
            error.message ||
            "Unable to delete class arm.",
            "danger"
        );
    }
}
```

}

function closeModal() {
if (bootstrapModal) {
bootstrapModal.hide();
}
}

if (addClassArmBtn) {
addClassArmBtn.addEventListener(
"click",
openAddModal
);
}

if (classArmForm) {
classArmForm.addEventListener(
"submit",
saveClassArm
);
}

if (searchInput) {
searchInput.addEventListener(
"input",
renderTable
);
}

if (classFilter) {
classFilter.addEventListener(
"change",
renderTable
);
}

if (statusFilter) {
statusFilter.addEventListener(
"change",
renderTable
);
}

if (classArmModalElement) {
classArmModalElement.addEventListener(
"hidden.bs.modal",
() => {
resetForm();
}
);
}

window.editClassArm =
openEditModal;

window.deleteClassArm =
deleteClassArm;

window.openAddClassArmModal =
openAddModal;

window.closeClassArmModal =
closeModal;

loadPageData();
