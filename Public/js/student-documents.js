"use strict";

const DOCUMENTS_API = "/api/documents";
const STUDENTS_API = "/api/students";
const LOGIN_PAGE = "/pages/login.html";
const STUDENTS_PAGE = "/pages/students.html";

let currentStudentId = null;
let currentStudent = null;
let currentDocuments = [];

function getToken() {
return (
localStorage.getItem("token") ||
localStorage.getItem("authToken") ||
localStorage.getItem("accessToken") ||
sessionStorage.getItem("token") ||
sessionStorage.getItem("authToken") ||
sessionStorage.getItem("accessToken") ||
null
);
}

function getStudentId() {
const params = new URLSearchParams(window.location.search);

```
return (
    params.get("id") ||
    params.get("studentId") ||
    params.get("student_id") ||
    params.get("student") ||
    null
);
```

}

function normalizeId(value) {
const id = Number(value);

```
if (!Number.isInteger(id) || id <= 0) {
    return null;
}

return id;
```

}

function escapeHtml(value) {
if (value === null || value === undefined) {
return "";
}

```
return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
```

}

function normalizeObject(payload) {
if (!payload) {
return null;
}

```
if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
) {
    return payload.data;
}

if (
    payload.student &&
    typeof payload.student === "object" &&
    !Array.isArray(payload.student)
) {
    return payload.student;
}

if (
    payload.document &&
    typeof payload.document === "object" &&
    !Array.isArray(payload.document)
) {
    return payload.document;
}

if (
    payload.result &&
    typeof payload.result === "object" &&
    !Array.isArray(payload.result)
) {
    return payload.result;
}

return payload;
```

}

function normalizeArray(payload) {
if (!payload) {
return [];
}

```
if (Array.isArray(payload)) {
    return payload;
}

if (Array.isArray(payload.data)) {
    return payload.data;
}

if (Array.isArray(payload.documents)) {
    return payload.documents;
}

if (Array.isArray(payload.results)) {
    return payload.results;
}

return [];
```

}

async function apiRequest(url, options = {}) {
const token = getToken();

```
const headers = {
    Accept: "application/json",
    ...(options.headers || {})
};

if (token) {
    headers.Authorization = `Bearer ${token}`;
}

const response = await fetch(url, {
    ...options,
    headers
});

let payload = null;

const contentType = response.headers.get("content-type") || "";

if (contentType.includes("application/json")) {
    payload = await response.json();
} else {
    const text = await response.text();

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch (error) {
            payload = {
                message: text
            };
        }
    }
}

if (!response.ok) {
    const message =
        payload?.message ||
        payload?.error ||
        `Request failed with status ${response.status}.`;

    const error = new Error(message);

    error.status = response.status;
    error.payload = payload;

    throw error;
}

return payload;
```

}

function showMessage(message, type = "info") {
const element = document.getElementById("documentsMessage");

```
if (!element) {
    return;
}

element.className = `alert alert-${type}`;
element.textContent = message;
element.classList.remove("d-none");
```

}

function hideMessage() {
const element = document.getElementById("documentsMessage");

```
if (!element) {
    return;
}

element.classList.add("d-none");
element.textContent = "";
```

}

function setPageLoading(isLoading) {
const loading = document.getElementById("documentsLoading");
const content = document.getElementById("documentsContent");
const error = document.getElementById("documentsError");

```
if (loading) {
    loading.classList.toggle("d-none", !isLoading);
}

if (isLoading) {
    if (content) {
        content.classList.add("d-none");
    }

    if (error) {
        error.classList.add("d-none");
    }
}
```

}

function showContent() {
const loading = document.getElementById("documentsLoading");
const content = document.getElementById("documentsContent");
const error = document.getElementById("documentsError");

```
if (loading) {
    loading.classList.add("d-none");
}

if (content) {
    content.classList.remove("d-none");
}

if (error) {
    error.classList.add("d-none");
}
```

}

function showError(message) {
const loading = document.getElementById("documentsLoading");
const content = document.getElementById("documentsContent");
const error = document.getElementById("documentsError");
const errorMessage = document.getElementById("documentsErrorMessage");

```
if (loading) {
    loading.classList.add("d-none");
}

if (content) {
    content.classList.add("d-none");
}

if (errorMessage) {
    errorMessage.textContent = message;
}

if (error) {
    error.classList.remove("d-none");
}
```

}

function getStudentName(student) {
if (!student) {
return "—";
}

```
if (student.name) {
    return student.name;
}

const fullName = [
    student.first_name,
    student.middle_name,
    student.last_name
]
    .filter(Boolean)
    .join(" ")
    .trim();

if (fullName) {
    return fullName;
}

return [
    student.firstName,
    student.middleName,
    student.lastName
]
    .filter(Boolean)
    .join(" ")
    .trim() || "—";
```

}

function getStudentNumber(student) {
if (!student) {
return "—";
}

```
return (
    student.student_number ||
    student.studentNumber ||
    student.admission_number ||
    student.admissionNumber ||
    "—"
);
```

}

function getStudentClass(student) {
if (!student) {
return "—";
}

```
return (
    student.class_name ||
    student.className ||
    student.class ||
    "—"
);
```

}

function getStudentSession(student) {
if (!student) {
return "—";
}

```
return (
    student.academic_session_name ||
    student.academicSessionName ||
    student.session_name ||
    student.sessionName ||
    student.academic_session ||
    student.academicSession ||
    "—"
);
```

}

function formatDate(value) {
if (!value) {
return "—";
}

```
const date = new Date(value);

if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
}

return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric"
});
```

}

function getDocumentId(document) {
return (
document.id ||
document.document_id ||
document.documentId ||
null
);
}

function getDocumentName(document) {
return (
document.document_name ||
document.documentName ||
document.file_name ||
document.fileName ||
document.name ||
document.filename ||
"Unnamed document"
);
}

function getDocumentType(document) {
return (
document.document_type ||
document.documentType ||
document.type ||
"Other"
);
}

function getDocumentDescription(document) {
return (
document.description ||
document.notes ||
"—"
);
}

function getDocumentDate(document) {
return (
document.uploaded_at ||
document.uploadedAt ||
document.created_at ||
document.createdAt ||
document.document_date ||
document.documentDate ||
null
);
}

function getUploadedBy(document) {
return (
document.uploaded_by_name ||
document.uploadedByName ||
document.uploaded_by ||
document.uploadedBy ||
document.created_by_name ||
document.createdByName ||
document.created_by ||
document.createdBy ||
"—"
);
}

function getDocumentStatus(document) {
return (
document.status ||
"Active"
);
}

function getDocumentUrl(document) {
return (
document.file_url ||
document.fileUrl ||
document.url ||
document.file_path ||
document.filePath ||
document.path ||
null
);
}

function isSafeDocumentUrl(url) {
if (!url) {
return false;
}

```
const value = String(url).trim();

if (!value) {
    return false;
}

if (
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../")
) {
    return true;
}

try {
    const parsed = new URL(value, window.location.origin);

    return (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
    );
} catch (error) {
    return false;
}
```

}

function renderStudentSummary(student) {
const nameElement = document.getElementById("studentName");
const numberElement = document.getElementById("studentNumber");
const classElement = document.getElementById("studentClass");
const sessionElement = document.getElementById("studentSession");

```
if (nameElement) {
    nameElement.textContent = getStudentName(student);
}

if (numberElement) {
    numberElement.textContent = getStudentNumber(student);
}

if (classElement) {
    classElement.textContent = getStudentClass(student);
}

if (sessionElement) {
    sessionElement.textContent = getStudentSession(student);
}
```

}

function renderDocuments(documents) {
const tableBody = document.getElementById("documentsTableBody");
const emptyState = document.getElementById("documentsEmpty");
const countElement = document.getElementById("documentsCount");

```
if (!tableBody) {
    return;
}

currentDocuments = Array.isArray(documents)
    ? documents
    : [];

tableBody.innerHTML = "";

if (countElement) {
    countElement.textContent =
        `${currentDocuments.length} ${
            currentDocuments.length === 1
                ? "document"
                : "documents"
        }`;
}

if (currentDocuments.length === 0) {
    if (emptyState) {
        emptyState.classList.remove("d-none");
    }

    return;
}

if (emptyState) {
    emptyState.classList.add("d-none");
}

currentDocuments.forEach((document, index) => {
    const documentId = getDocumentId(document);
    const documentName = getDocumentName(document);
    const documentType = getDocumentType(document);
    const description = getDocumentDescription(document);
    const uploadedDate = getDocumentDate(document);
    const uploadedBy = getUploadedBy(document);
    const status = getDocumentStatus(document);
    const documentUrl = getDocumentUrl(document);

    const row = document.createElement("tr");

    const viewButton = isSafeDocumentUrl(documentUrl)
        ? `
            <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                data-action="view"
                data-url="${escapeHtml(documentUrl)}"
            >
                View
            </button>
        `
        : "";

    const deleteButton = documentId
        ? `
            <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                data-action="delete"
                data-document-id="${escapeHtml(documentId)}"
            >
                Delete
            </button>
        `
        : "";

    row.innerHTML = `
        <td>${index + 1}</td>

        <td>
            <div class="document-name">
                ${escapeHtml(documentName)}
            </div>
        </td>

        <td>
            ${escapeHtml(documentType)}
        </td>

        <td>
            <div class="document-description">
                ${escapeHtml(description)}
            </div>
        </td>

        <td>
            ${formatDate(uploadedDate)}
        </td>

        <td>
            ${escapeHtml(uploadedBy)}
        </td>

        <td>
            <span class="badge bg-success">
                ${escapeHtml(status)}
            </span>
        </td>

        <td>
            <div class="document-actions">
                ${viewButton}
                ${deleteButton}
            </div>
        </td>
    `;

    tableBody.appendChild(row);
});
```

}

async function loadStudent() {
const response = await apiRequest(
`${STUDENTS_API}/${encodeURIComponent(currentStudentId)}`
);

```
const student = normalizeObject(response);

if (!student) {
    throw new Error("Student record could not be found.");
}

return student;
```

}

async function loadDocuments() {
const studentDocumentsUrl =
`${STUDENTS_API}/${encodeURIComponent(currentStudentId)}/documents`;

```
try {
    const response = await apiRequest(studentDocumentsUrl);

    return normalizeArray(response);
} catch (error) {
    if (error.status !== 404) {
        throw error;
    }
}

const generalDocumentsUrl =
    `${DOCUMENTS_API}?studentId=${encodeURIComponent(currentStudentId)}`;

try {
    const response = await apiRequest(generalDocumentsUrl);

    return normalizeArray(response);
} catch (error) {
    if (error.status === 404) {
        return [];
    }

    throw error;
}
```

}

function getUploadFormData() {
const form = document.getElementById("documentUploadForm");

```
if (!form) {
    throw new Error("Document upload form was not found.");
}

const documentType =
    document.getElementById("documentType")?.value?.trim() || "";

const description =
    document.getElementById("documentDescription")?.value?.trim() || "";

const fileInput =
    document.getElementById("documentFile");

if (!documentType) {
    throw new Error("Please select a document type.");
}

if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    throw new Error("Please select a document file.");
}

const file = fileInput.files[0];

if (!file) {
    throw new Error("Please select a document file.");
}

const formData = new FormData();

formData.append("studentId", currentStudentId);
formData.append("student_id", currentStudentId);
formData.append("documentType", documentType);
formData.append("document_type", documentType);
formData.append("description", description);
formData.append("document", file);

return formData;
```

}

async function uploadDocument() {
const formData = getUploadFormData();

```
const token = getToken();

const headers = {
    Accept: "application/json"
};

if (token) {
    headers.Authorization = `Bearer ${token}`;
}

const response = await fetch(
    `${STUDENTS_API}/${encodeURIComponent(currentStudentId)}/documents`,
    {
        method: "POST",
        headers,
        body: formData
    }
);

let payload = null;

const contentType =
    response.headers.get("content-type") || "";

if (contentType.includes("application/json")) {
    payload = await response.json();
} else {
    const text = await response.text();

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch (error) {
            payload = {
                message: text
            };
        }
    }
}

if (!response.ok) {
    const message =
        payload?.message ||
        payload?.error ||
        `Document upload failed with status ${response.status}.`;

    const error = new Error(message);

    error.status = response.status;
    error.payload = payload;

    throw error;
}

return payload;
```

}

async function handleUpload(event) {
event.preventDefault();

```
hideMessage();

const button =
    document.getElementById("uploadDocumentButton");

if (button) {
    button.disabled = true;
    button.textContent = "Uploading...";
}

try {
    await uploadDocument();

    showMessage(
        "Student document uploaded successfully.",
        "success"
    );

    resetUploadForm();

    const documents = await loadDocuments();

    renderDocuments(documents);
} catch (error) {
    console.error("Document upload error:", error);

    showMessage(
        error.message ||
        "Unable to upload the student document.",
        "danger"
    );
} finally {
    if (button) {
        button.disabled = false;
        button.textContent = "Upload Document";
    }
}
```

}

function resetUploadForm() {
const form = document.getElementById("documentUploadForm");
const fileName = document.getElementById("selectedFileName");

```
if (form) {
    form.reset();
}

if (fileName) {
    fileName.textContent = "";
}
```

}

function handleFileSelection() {
const fileInput =
document.getElementById("documentFile");

```
const fileName =
    document.getElementById("selectedFileName");

if (!fileInput || !fileName) {
    return;
}

if (!fileInput.files || fileInput.files.length === 0) {
    fileName.textContent = "";
    return;
}

const file = fileInput.files[0];

fileName.textContent =
    `Selected file: ${file.name}`;
```

}

function openDocument(url) {
if (!isSafeDocumentUrl(url)) {
showMessage(
"This document does not have a valid file link.",
"warning"
);

```
    return;
}

window.open(url, "_blank", "noopener,noreferrer");
```

}

async function deleteDocument(documentId) {
const id = normalizeId(documentId);

```
if (!id) {
    showMessage(
        "A valid document ID is required.",
        "danger"
    );

    return;
}

const confirmed = window.confirm(
    "Are you sure you want to delete this student document?"
);

if (!confirmed) {
    return;
}

try {
    hideMessage();

    const token = getToken();

    const headers = {
        Accept: "application/json"
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response = await fetch(
        `${STUDENTS_API}/${encodeURIComponent(currentStudentId)}/documents/${encodeURIComponent(id)}`,
        {
            method: "DELETE",
            headers
        }
    );

    if (response.status === 404) {
        response = await fetch(
            `${DOCUMENTS_API}/${encodeURIComponent(id)}`,
            {
                method: "DELETE",
                headers
            }
        );
    }

    let payload = null;

    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        payload = await response.json();
    } else {
        const text = await response.text();

        if (text) {
            try {
                payload = JSON.parse(text);
            } catch (error) {
                payload = {
                    message: text
                };
            }
        }
    }

    if (!response.ok) {
        throw new Error(
            payload?.message ||
            payload?.error ||
            `Unable to delete document. Status ${response.status}.`
        );
    }

    showMessage(
        "Student document deleted successfully.",
        "success"
    );

    const documents = await loadDocuments();

    renderDocuments(documents);
} catch (error) {
    console.error("Document deletion error:", error);

    showMessage(
        error.message ||
        "Unable to delete the student document.",
        "danger"
    );
}
```

}

function handleDocumentTableClick(event) {
const button = event.target.closest("button[data-action]");

```
if (!button) {
    return;
}

const action = button.dataset.action;

if (action === "view") {
    openDocument(button.dataset.url);
    return;
}

if (action === "delete") {
    deleteDocument(button.dataset.documentId);
}
```

}

function setupNavigation() {
const backButton =
document.getElementById("backToProfileButton");

```
if (!backButton) {
    return;
}

backButton.addEventListener("click", () => {
    if (currentStudentId) {
        window.location.href =
            `/pages/student-profile.html?id=${encodeURIComponent(currentStudentId)}`;
    } else {
        window.location.href = STUDENTS_PAGE;
    }
});
```

}

function setupUploadForm() {
const form =
document.getElementById("documentUploadForm");

```
const fileInput =
    document.getElementById("documentFile");

const resetButton =
    document.getElementById("resetDocumentButton");

if (form) {
    form.addEventListener("submit", handleUpload);
}

if (fileInput) {
    fileInput.addEventListener(
        "change",
        handleFileSelection
    );
}

if (resetButton) {
    resetButton.addEventListener(
        "click",
        () => {
            const fileName =
                document.getElementById("selectedFileName");

            if (fileName) {
                fileName.textContent = "";
            }
        }
    );
}
```

}

function setupDocumentTable() {
const tableBody =
document.getElementById("documentsTableBody");

```
if (!tableBody) {
    return;
}

tableBody.addEventListener(
    "click",
    handleDocumentTableClick
);
```

}

function protectPage() {
const token = getToken();

```
if (!token) {
    window.location.href = LOGIN_PAGE;
    return false;
}

return true;
```

}

async function initialisePage() {
hideMessage();

```
currentStudentId = normalizeId(getStudentId());

if (!currentStudentId) {
    showError("No valid student ID was supplied.");
    return;
}

if (!protectPage()) {
    return;
}

setPageLoading(true);

try {
    const student = await loadStudent();

    currentStudent = student;

    renderStudentSummary(student);

    const documents = await loadDocuments();

    renderDocuments(documents);

    showContent();
} catch (error) {
    console.error("Student documents error:", error);

    showError(
        error.message ||
        "Unable to load the student's documents."
    );
}
```

}

document.addEventListener("DOMContentLoaded", () => {
setupNavigation();
setupUploadForm();
setupDocumentTable();
initialisePage();
});

window.StudentDocumentsPage = {
initialisePage,
loadStudent,
loadDocuments,
uploadDocument,
deleteDocument,
renderStudentSummary,
renderDocuments,
resetUploadForm,
getStudentId
};
