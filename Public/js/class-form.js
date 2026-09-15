"use strict";

const API_BASE_URL = "/api";

const classForm = document.getElementById("classForm");
const academicLevelSelect = document.getElementById("academicLevelId");
const classNameInput = document.getElementById("className");
const classCodeInput = document.getElementById("classCode");
const statusSelect = document.getElementById("status");
const descriptionInput = document.getElementById("description");

const pageTitle = document.getElementById("pageTitle");
const modeBadge = document.getElementById("modeBadge");
const messageBox = document.getElementById("message");
const cancelButton = document.getElementById("cancelButton");
const submitButton = document.getElementById("submitButton");
const loadingBox = document.getElementById("loading");

let editingClassId = null;
let isSubmitting = false;

function getToken() {
const storageKeys = [
"school_management_token",
"token",
"accessToken"
];

```
for (const key of storageKeys) {
    const localToken = localStorage.getItem(key);
    if (localToken) {
        return localToken;
    }

    const sessionToken = sessionStorage.getItem(key);
    if (sessionToken) {
        return sessionToken;
    }
}

return null;
```

}

function getHeaders() {
const token = getToken();

```
const headers = {
    "Content-Type": "application/json"
};

if (token) {
    headers.Authorization = `Bearer ${token}`;
}

return headers;
```

}

function showMessage(message, type = "danger") {
if (!messageBox) {
return;
}

```
messageBox.className = `alert alert-${type}`;
messageBox.textContent = message;
messageBox.classList.remove("d-none");
```

}

function clearMessage() {
if (!messageBox) {
return;
}

```
messageBox.textContent = "";
messageBox.className = "alert d-none";
```

}

function setLoading(isLoading, text = "Loading...") {
if (loadingBox) {
loadingBox.textContent = text;
loadingBox.classList.toggle("d-none", !isLoading);
}

```
if (submitButton) {
    submitButton.disabled = isLoading || isSubmitting;
}

if (cancelButton) {
    cancelButton.disabled = isLoading || isSubmitting;
}
```

}

async function apiRequest(endpoint, options = {}) {
const config = {
method: options.method || "GET",
headers: {
...getHeaders(),
...(options.headers || {})
}
};

```
if (options.body !== undefined) {
    config.body =
        typeof options.body === "string"
            ? options.body
            : JSON.stringify(options.body);
}

const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

let data = null;

const contentType = response.headers.get("content-type") || "";

if (contentType.includes("application/json")) {
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }
} else {
    try {
        const text = await response.text();
        data = text ? { message: text } : null;
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

    error.status = response.status;
    error.data = data;

    throw error;
}

return data;
```

}

function extractList(data, possibleKeys = []) {
if (Array.isArray(data)) {
return data;
}

```
if (!data || typeof data !== "object") {
    return [];
}

for (const key of possibleKeys) {
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

function getAcademicLevelId(level) {
return (
level?.id ||
level?.academicLevelId ||
level?.academic_level_id ||
""
);
}

function getAcademicLevelName(level) {
return (
level?.levelName ||
level?.level_name ||
level?.name ||
""
);
}

function getAcademicLevelOrder(level) {
const order =
level?.levelOrder ??
level?.level_order ??
0;

```
const number = Number(order);

return Number.isFinite(number) ? number : 0;
```

}

async function loadAcademicLevels(selectedLevelId = "") {
if (!academicLevelSelect) {
return;
}

```
academicLevelSelect.innerHTML = "";

const loadingOption = document.createElement("option");
loadingOption.value = "";
loadingOption.textContent = "Loading academic levels...";
loadingOption.disabled = true;
loadingOption.selected = true;

academicLevelSelect.appendChild(loadingOption);

try {
    const response = await apiRequest("/academic-levels");

    const levels = extractList(response, [
        "academicLevels",
        "academic_levels",
        "levels",
        "items"
    ]);

    academicLevelSelect.innerHTML = "";

    if (levels.length === 0) {
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "No academic levels available";
        emptyOption.disabled = true;
        emptyOption.selected = true;

        academicLevelSelect.appendChild(emptyOption);
        return;
    }

    levels.sort((a, b) => {
        return getAcademicLevelOrder(a) - getAcademicLevelOrder(b);
    });

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select academic level";
    defaultOption.disabled = true;
    defaultOption.selected = true;

    academicLevelSelect.appendChild(defaultOption);

    levels.forEach((level) => {
        const id = getAcademicLevelId(level);
        const name = getAcademicLevelName(level);

        if (!id || !name) {
            return;
        }

        const option = document.createElement("option");
        option.value = id;
        option.textContent = name;

        if (String(id) === String(selectedLevelId)) {
            option.selected = true;
            defaultOption.selected = false;
        }

        academicLevelSelect.appendChild(option);
    });

    if (selectedLevelId) {
        academicLevelSelect.value = String(selectedLevelId);
    }
} catch (error) {
    console.error("Failed to load academic levels:", error);

    academicLevelSelect.innerHTML = "";

    const errorOption = document.createElement("option");
    errorOption.value = "";
    errorOption.textContent = "Unable to load academic levels";
    errorOption.disabled = true;
    errorOption.selected = true;

    academicLevelSelect.appendChild(errorOption);

    if (error.status === 401) {
        showMessage(
            "Your session has expired. Please log in again.",
            "warning"
        );
    } else if (error.status === 403) {
        showMessage(
            "You do not have permission to access academic levels.",
            "danger"
        );
    } else {
        showMessage(
            error.message || "Unable to load academic levels.",
            "danger"
        );
    }

    throw error;
}
```

}

function extractClass(data) {
if (!data || typeof data !== "object") {
return null;
}

```
if (data.class && typeof data.class === "object") {
    return data.class;
}

if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    if (data.data.class && typeof data.data.class === "object") {
        return data.data.class;
    }

    return data.data;
}

return data;
```

}

function getClassField(classData, ...keys) {
for (const key of keys) {
if (
classData &&
classData[key] !== undefined &&
classData[key] !== null
) {
return classData[key];
}
}

```
return "";
```

}

async function loadClass(classId) {
if (!classId) {
return;
}

```
setLoading(true, "Loading class...");
clearMessage();

try {
    const response = await apiRequest(`/classes/${encodeURIComponent(classId)}`);
    const classData = extractClass(response);

    if (!classData) {
        throw new Error("Class information could not be loaded.");
    }

    const academicLevelId = getClassField(
        classData,
        "academicLevelId",
        "academic_level_id",
        "levelId",
        "level_id"
    );

    const className = getClassField(
        classData,
        "className",
        "class_name"
    );

    const classCode = getClassField(
        classData,
        "classCode",
        "class_code"
    );

    const description = getClassField(
        classData,
        "description"
    );

    const status = getClassField(
        classData,
        "status"
    );

    const isActive = getClassField(
        classData,
        "isActive",
        "is_active"
    );

    if (academicLevelSelect) {
        academicLevelSelect.value = academicLevelId || "";
    }

    if (classNameInput) {
        classNameInput.value = className || "";
    }

    if (classCodeInput) {
        classCodeInput.value = classCode || "";
    }

    if (descriptionInput) {
        descriptionInput.value = description || "";
    }

    if (statusSelect) {
        if (status !== "") {
            statusSelect.value = String(status).toLowerCase() === "active"
                ? "active"
                : "inactive";
        } else if (isActive !== "") {
            statusSelect.value =
                isActive === true ||
                String(isActive).toLowerCase() === "true"
                    ? "active"
                    : "inactive";
        } else {
            statusSelect.value = "active";
        }
    }
} catch (error) {
    console.error("Failed to load class:", error);

    if (error.status === 401) {
        showMessage(
            "Your session has expired. Please log in again.",
            "warning"
        );
    } else if (error.status === 403) {
        showMessage(
            "You do not have permission to view this class.",
            "danger"
        );
    } else if (error.status === 404) {
        showMessage(
            "The requested class could not be found.",
            "danger"
        );
    } else {
        showMessage(
            error.message || "Unable to load class.",
            "danger"
        );
    }

    throw error;
} finally {
    setLoading(false);
}
```

}

function validateForm() {
clearMessage();

```
const academicLevelId = academicLevelSelect
    ? academicLevelSelect.value.trim()
    : "";

const className = classNameInput
    ? classNameInput.value.trim()
    : "";

const classCode = classCodeInput
    ? classCodeInput.value.trim()
    : "";

const description = descriptionInput
    ? descriptionInput.value.trim()
    : "";

const status = statusSelect
    ? statusSelect.value
    : "active";

if (!academicLevelId) {
    showMessage(
        "Please select an academic level.",
        "warning"
    );

    if (academicLevelSelect) {
        academicLevelSelect.focus();
    }

    return null;
}

if (!className) {
    showMessage(
        "Please enter the class name.",
        "warning"
    );

    if (classNameInput) {
        classNameInput.focus();
    }

    return null;
}

if (className.length > 100) {
    showMessage(
        "Class name must not exceed 100 characters.",
        "warning"
    );

    if (classNameInput) {
        classNameInput.focus();
    }

    return null;
}

if (classCode.length > 50) {
    showMessage(
        "Class code must not exceed 50 characters.",
        "warning"
    );

    if (classCodeInput) {
        classCodeInput.focus();
    }

    return null;
}

if (description.length > 1000) {
    showMessage(
        "Description must not exceed 1000 characters.",
        "warning"
    );

    if (descriptionInput) {
        descriptionInput.focus();
    }

    return null;
}

if (status !== "active" && status !== "inactive") {
    showMessage(
        "Please select a valid class status.",
        "warning"
    );

    if (statusSelect) {
        statusSelect.focus();
    }

    return null;
}

return {
    academicLevelId,
    className,
    classCode,
    description,
    status
};
```

}

function setEditMode() {
if (pageTitle) {
pageTitle.textContent = "Edit Class";
}

```
if (modeBadge) {
    modeBadge.textContent = "Edit";
    modeBadge.className = "badge bg-warning text-dark";
}

if (submitButton) {
    submitButton.innerHTML = `
        <i class="bi bi-check-circle me-1"></i>
        Update Class
    `;
}
```

}

function setCreateMode() {
if (pageTitle) {
pageTitle.textContent = "Add Class";
}

```
if (modeBadge) {
    modeBadge.textContent = "New";
    modeBadge.className = "badge bg-primary";
}

if (submitButton) {
    submitButton.innerHTML = `
        <i class="bi bi-check-circle me-1"></i>
        Save Class
    `;
}
```

}

function getClassIdFromUrl() {
const params = new URLSearchParams(window.location.search);

```
return (
    params.get("id") ||
    params.get("classId") ||
    null
);
```

}

async function saveClass(formData) {
const payload = {
className: formData.className,
classCode: formData.classCode || null,
levelId: formData.academicLevelId,
description: formData.description || null,
status: formData.status
};

```
if (editingClassId) {
    return apiRequest(
        `/classes/${encodeURIComponent(editingClassId)}`,
        {
            method: "PUT",
            body: payload
        }
    );
}

return apiRequest("/classes", {
    method: "POST",
    body: payload
});
```

}

if (classForm) {
classForm.addEventListener("submit", async (event) => {
event.preventDefault();

```
    if (isSubmitting) {
        return;
    }

    const formData = validateForm();

    if (!formData) {
        return;
    }

    isSubmitting = true;
    setLoading(true, editingClassId ? "Updating class..." : "Saving class...");
    clearMessage();

    try {
        await saveClass(formData);

        showMessage(
            editingClassId
                ? "Class updated successfully."
                : "Class created successfully.",
            "success"
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        setTimeout(() => {
            window.location.href = "classes.html";
        }, 900);
    } catch (error) {
        console.error("Failed to save class:", error);

        if (error.status === 401) {
            showMessage(
                "Your session has expired. Please log in again.",
                "warning"
            );
        } else if (error.status === 403) {
            showMessage(
                "You do not have permission to save this class.",
                "danger"
            );
        } else if (error.status === 409) {
            showMessage(
                error.message ||
                "A class with this name already exists.",
                "warning"
            );
        } else {
            showMessage(
                error.message ||
                "Unable to save class. Please try again.",
                "danger"
            );
        }
    } finally {
        isSubmitting = false;
        setLoading(false);
    }
});
```

}

if (cancelButton) {
cancelButton.addEventListener("click", () => {
window.location.href = "classes.html";
});
}

async function initialize() {
clearMessage();

```
editingClassId = getClassIdFromUrl();

if (editingClassId) {
    setEditMode();
} else {
    setCreateMode();
}

setLoading(true, "Loading form...");

try {
    await loadAcademicLevels();

    if (editingClassId) {
        await loadClass(editingClassId);
    }
} catch (error) {
    console.error("Class form initialization failed:", error);
} finally {
    setLoading(false);
}
```

}

document.addEventListener("DOMContentLoaded", initialize);
