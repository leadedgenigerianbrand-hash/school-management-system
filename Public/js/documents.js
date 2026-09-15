"use strict";

(function () {

```
const DOCUMENTS_API =
    "/api/documents";

let documents = [];

let documentTypes = [];

let editingDocumentId = null;


const tableBody =
    document.getElementById(
        "documentsTableBody"
    );

const tableWrapper =
    document.getElementById(
        "documentsTableWrapper"
    );

const loadingState =
    document.getElementById(
        "loadingState"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const typeFilter =
    document.getElementById(
        "documentTypeFilter"
    );

const refreshButton =
    document.getElementById(
        "refreshDocumentsBtn"
    );

const addDocumentButton =
    document.getElementById(
        "addDocumentBtn"
    );

const alertMessage =
    document.getElementById(
        "alertMessage"
    );

const documentModalElement =
    document.getElementById(
        "documentModal"
    );

const documentForm =
    document.getElementById(
        "documentForm"
    );

const modalTitle =
    document.getElementById(
        "modalTitle"
    );

const closeModalButton =
    document.getElementById(
        "closeModalBtn"
    );

const cancelModalButton =
    document.getElementById(
        "cancelModalBtn"
    );

const saveDocumentButton =
    document.getElementById(
        "saveDocumentBtn"
    );

const formMessage =
    document.getElementById(
        "formMessage"
    );

const studentIdInput =
    document.getElementById(
        "studentId"
    );

const documentTypeInput =
    document.getElementById(
        "documentType"
    );

const documentNameInput =
    document.getElementById(
        "documentName"
    );

const fileUrlInput =
    document.getElementById(
        "fileUrl"
    );

const fileSizeInput =
    document.getElementById(
        "fileSize"
    );

const mimeTypeInput =
    document.getElementById(
        "mimeType"
    );

const documentUrlPreview =
    document.getElementById(
        "documentUrlPreview"
    );

const documentUrlPreviewLink =
    document.getElementById(
        "documentUrlPreviewLink"
    );

const totalDocumentsElement =
    document.getElementById(
        "totalDocuments"
    );

const pdfDocumentsElement =
    document.getElementById(
        "pdfDocuments"
    );

const imageDocumentsElement =
    document.getElementById(
        "imageDocuments"
    );

const studentDocumentsElement =
    document.getElementById(
        "studentDocuments"
    );


let documentModal = null;


/*
|--------------------------------------------------------------------------
| API REQUEST
|--------------------------------------------------------------------------
*/

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        localStorage.getItem(
            "school_management_token"
        ) ||
        sessionStorage.getItem(
            "school_management_token"
        ) ||
        localStorage.getItem(
            "token"
        ) ||
        sessionStorage.getItem(
            "token"
        ) ||
        localStorage.getItem(
            "accessToken"
        ) ||
        sessionStorage.getItem(
            "accessToken"
        ) ||
        "";


    let url =
        endpoint;


    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {

        if (
            !url.startsWith("/")
        ) {
            url =
                `/${url}`;
        }

    }


    const headers = {

        Accept:
            "application/json",

        ...(options.headers || {})

    };


    if (
        options.body &&
        typeof options.body === "string" &&
        !headers["Content-Type"] &&
        !headers["content-type"]
    ) {

        headers["Content-Type"] =
            "application/json";

    }


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    let response;


    try {

        response =
            await fetch(
                url,
                {
                    ...options,
                    headers
                }
            );

    } catch (error) {

        console.error(
            "Documents API request failed:",
            error
        );

        throw new Error(
            "Unable to connect to the server. Please check that the school management server is running."
        );

    }


    if (
        response.status === 401
    ) {

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

            window.location.replace(
                "/pages/login.html"
            );

        }


        throw new Error(
            "Authentication required."
        );

    }


    if (
        response.status === 403
    ) {

        throw new Error(
            "You do not have permission to perform this action."
        );

    }


    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    let data;


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        data =
            await response.json();

    } else {

        data =
            await response.text();

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
                data.trim();

        }


        throw new Error(
            message
        );

    }


    return data;

}


/*
|--------------------------------------------------------------------------
| MESSAGE HELPERS
|--------------------------------------------------------------------------
*/

function showMessage(
    message,
    type = "success"
) {

    if (!alertMessage) {
        return;
    }


    alertMessage.textContent =
        message;


    alertMessage.className =
        `alert alert-${type === "error"
            ? "danger"
            : type} ` +
        "page-message";


    alertMessage.classList.remove(
        "d-none"
    );


    window.clearTimeout(
        showMessage.timeout
    );


    showMessage.timeout =
        window.setTimeout(
            () => {

                alertMessage.classList.add(
                    "d-none"
                );

            },
            4500
        );

}


function showFormMessage(
    message,
    type = "danger"
) {

    if (!formMessage) {
        return;
    }


    formMessage.textContent =
        message;


    formMessage.className =
        `alert alert-${type}`;


    formMessage.classList.remove(
        "d-none"
    );

}


function clearFormMessage() {

    if (!formMessage) {
        return;
    }


    formMessage.textContent =
        "";

    formMessage.className =
        "alert d-none";

}


/*
|--------------------------------------------------------------------------
| LOAD DOCUMENTS
|--------------------------------------------------------------------------
*/

async function loadDocuments() {

    showLoading();


    try {

        const result =
            await apiRequest(
                DOCUMENTS_API
            );


        documents =
            normalizeArrayResponse(
                result
            );


        await loadDocumentTypes(
            false
        );


        updateStatistics();

        renderDocuments();


    } catch (error) {

        console.error(
            "Load documents error:",
            error
        );


        documents =
            [];


        updateStatistics();

        showEmptyState(
            "Unable to load documents."
        );


        showMessage(
            error.message ||
            "Unable to load documents.",
            "danger"
        );

    }

}


/*
|--------------------------------------------------------------------------
| LOAD DOCUMENT TYPES
|--------------------------------------------------------------------------
*/

async function loadDocumentTypes(
    showError = true
) {

    try {

        const result =
            await apiRequest(
                `${DOCUMENTS_API}/types`
            );


        documentTypes =
            normalizeArrayResponse(
                result
            );


        populateDocumentTypeFilters();


    } catch (error) {

        console.error(
            "Load document types error:",
            error
        );


        if (showError) {

            showMessage(
                error.message ||
                "Unable to load document types.",
                "danger"
            );

        }

    }

}


/*
|--------------------------------------------------------------------------
| NORMALIZE API ARRAY
|--------------------------------------------------------------------------
*/

function normalizeArrayResponse(
    response
) {

    if (
        Array.isArray(response)
    ) {

        return response;

    }


    if (
        response &&
        Array.isArray(response.data)
    ) {

        return response.data;

    }


    if (
        response &&
        Array.isArray(response.documents)
    ) {

        return response.documents;

    }


    return [];

}


/*
|--------------------------------------------------------------------------
| POPULATE DOCUMENT TYPE FILTERS
|--------------------------------------------------------------------------
*/

function populateDocumentTypeFilters() {

    if (!typeFilter) {
        return;
    }


    const currentValue =
        typeFilter.value;


    typeFilter.innerHTML =
        `
            <option value="">
                All Types
            </option>
        `;


    documentTypes
        .forEach(
            type => {

                if (
                    type === null ||
                    type === undefined ||
                    String(type).trim() === ""
                ) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(type);


                option.textContent =
                    String(type);


                typeFilter.appendChild(
                    option
                );

            }
        );


    if (
        currentValue &&
        documentTypes.some(
            type =>
                String(type).toLowerCase() ===
                currentValue.toLowerCase()
        )
    ) {

        typeFilter.value =
            currentValue;

    }

}


/*
|--------------------------------------------------------------------------
| FILTER DOCUMENTS
|--------------------------------------------------------------------------
*/

function getFilteredDocuments() {

    const searchTerm =
        String(
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    const selectedType =
        String(
            typeFilter?.value || ""
        )
            .trim()
            .toLowerCase();


    return documents.filter(
        documentRecord => {

            const documentName =
                String(
                    documentRecord.document_name ||
                    ""
                ).toLowerCase();


            const documentType =
                String(
                    documentRecord.document_type ||
                    ""
                ).toLowerCase();


            const studentNumber =
                String(
                    documentRecord.student_number ||
                    ""
                ).toLowerCase();


            const admissionNumber =
                String(
                    documentRecord.admission_number ||
                    ""
                ).toLowerCase();


            const firstName =
                String(
                    documentRecord.first_name ||
                    ""
                ).toLowerCase();


            const middleName =
                String(
                    documentRecord.middle_name ||
                    ""
                ).toLowerCase();


            const lastName =
                String(
                    documentRecord.last_name ||
                    ""
                ).toLowerCase();


            const fileUrl =
                String(
                    documentRecord.file_url ||
                    ""
                ).toLowerCase();


            const matchesSearch =
                !searchTerm ||
                documentName.includes(
                    searchTerm
                ) ||
                documentType.includes(
                    searchTerm
                ) ||
                studentNumber.includes(
                    searchTerm
                ) ||
                admissionNumber.includes(
                    searchTerm
                ) ||
                firstName.includes(
                    searchTerm
                ) ||
                middleName.includes(
                    searchTerm
                ) ||
                lastName.includes(
                    searchTerm
                ) ||
                fileUrl.includes(
                    searchTerm
                );


            const matchesType =
                !selectedType ||
                documentType ===
                    selectedType;


            return (
                matchesSearch &&
                matchesType
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| RENDER DOCUMENTS
|--------------------------------------------------------------------------
*/

function renderDocuments() {

    if (!tableBody) {
        return;
    }


    const filteredDocuments =
        getFilteredDocuments();


    if (
        filteredDocuments.length === 0
    ) {

        showEmptyState(
            documents.length === 0
                ? "No documents have been added yet."
                : "No documents match your search."
        );

        return;

    }


    hideLoading();

    hideEmptyState();


    if (tableWrapper) {

        tableWrapper.style.display =
            "block";

    }


    tableBody.innerHTML =
        filteredDocuments
            .map(
                createDocumentRow
            )
            .join("");

}


/*
|--------------------------------------------------------------------------
| CREATE DOCUMENT ROW
|--------------------------------------------------------------------------
*/

function createDocumentRow(
    documentRecord
) {

    const id =
        documentRecord.id;


    const documentName =
        documentRecord.document_name ||
        "Unnamed document";


    const documentType =
        documentRecord.document_type ||
        "Unclassified";


    const studentName =
        buildStudentName(
            documentRecord
        );


    const studentIdentifier =
        documentRecord.admission_number ||
        documentRecord.student_number ||
        "";


    const fileUrl =
        documentRecord.file_url ||
        "";


    const fileSize =
        formatFileSize(
            documentRecord.file_size
        );


    const mimeType =
        documentRecord.mime_type ||
        "";


    const createdAt =
        documentRecord.created_at;


    const fileIcon =
        getFileIcon(
            mimeType,
            fileUrl
        );


    return `
        <tr>

            <td>

                <div class="document-info">

                    <span class="document-name">

                        ${escapeHtml(
                            documentName
                        )}

                    </span>

                    ${
                        studentIdentifier
                            ? `
                                <small>
                                    ${escapeHtml(
                                        studentIdentifier
                                    )}
                                </small>
                            `
                            : ""
                    }

                </div>

            </td>


            <td>

                <span class="document-type">

                    ${escapeHtml(
                        documentType
                    )}

                </span>

            </td>


            <td>

                <div class="document-info">

                    <span class="owner-name">

                        ${escapeHtml(
                            studentName
                        )}

                    </span>

                    ${
                        documentRecord.student_id
                            ? `
                                <small>
                                    Student record
                                </small>
                            `
                            : ""
                    }

                </div>

            </td>


            <td>

                <div class="document-info">

                    <span class="file-type">

                        <i class="bi ${fileIcon}"></i>

                        ${escapeHtml(
                            getFileLabel(
                                mimeType,
                                fileUrl
                            )
                        )}

                    </span>

                    ${
                        fileSize
                            ? `
                                <small>
                                    ${escapeHtml(
                                        fileSize
                                    )}
                                </small>
                            `
                            : ""
                    }

                </div>

            </td>


            <td>

                <span class="file-size">

                    ${escapeHtml(
                        formatDate(
                            createdAt
                        )
                    )}

                </span>

            </td>


            <td>

                <div class="actions">

                    ${
                        fileUrl
                            ? `
                                <button
                                    type="button"
                                    class="btn btn-sm btn-primary"
                                    data-action="view"
                                    data-id="${escapeHtml(
                                        id
                                    )}"
                                >
                                    <i class="bi bi-eye me-1"></i>
                                    View
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary"
                                    data-action="download"
                                    data-id="${escapeHtml(
                                        id
                                    )}"
                                >
                                    <i class="bi bi-download me-1"></i>
                                    Download
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary"
                                    disabled
                                >
                                    No File
                                </button>
                            `
                    }


                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        data-action="edit"
                        data-id="${escapeHtml(
                            id
                        )}"
                    >
                        <i class="bi bi-pencil me-1"></i>
                        Edit
                    </button>


                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        data-action="delete"
                        data-id="${escapeHtml(
                            id
                        )}"
                    >
                        <i class="bi bi-trash me-1"></i>
                        Delete
                    </button>

                </div>

            </td>

        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| BUILD STUDENT NAME
|--------------------------------------------------------------------------
*/

function buildStudentName(
    documentRecord
) {

    const nameParts = [

        documentRecord.first_name,

        documentRecord.middle_name,

        documentRecord.last_name

    ]
        .filter(
            value =>
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
        )
        .map(
            value =>
                String(value).trim()
        );


    if (
        nameParts.length > 0
    ) {

        return nameParts.join(" ");

    }


    return "Student record";

}


/*
|--------------------------------------------------------------------------
| UPDATE STATISTICS
|--------------------------------------------------------------------------
*/

function updateStatistics() {

    if (totalDocumentsElement) {

        totalDocumentsElement.textContent =
            documents.length;

    }


    let pdfCount = 0;

    let imageCount = 0;

    let studentCount = 0;


    documents.forEach(
        documentRecord => {

            const mimeType =
                String(
                    documentRecord.mime_type ||
                    ""
                ).toLowerCase();


            const fileUrl =
                String(
                    documentRecord.file_url ||
                    ""
                ).toLowerCase();


            if (
                mimeType ===
                    "application/pdf" ||
                fileUrl.endsWith(
                    ".pdf"
                )
            ) {

                pdfCount++;

            }


            if (
                mimeType.startsWith(
                    "image/"
                ) ||
                /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                    fileUrl
                )
            ) {

                imageCount++;

            }


            if (
                documentRecord.student_id
            ) {

                studentCount++;

            }

        }
    );


    if (pdfDocumentsElement) {

        pdfDocumentsElement.textContent =
            pdfCount;

    }


    if (imageDocumentsElement) {

        imageDocumentsElement.textContent =
            imageCount;

    }


    if (studentDocumentsElement) {

        studentDocumentsElement.textContent =
            studentCount;

    }

}


/*
|--------------------------------------------------------------------------
| SHOW LOADING
|--------------------------------------------------------------------------
*/

function showLoading() {

    if (loadingState) {

        loadingState.style.display =
            "block";

    }


    if (tableWrapper) {

        tableWrapper.style.display =
            "none";

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }

}


/*
|--------------------------------------------------------------------------
| HIDE LOADING
|--------------------------------------------------------------------------
*/

function hideLoading() {

    if (loadingState) {

        loadingState.style.display =
            "none";

    }

}


/*
|--------------------------------------------------------------------------
| SHOW EMPTY STATE
|--------------------------------------------------------------------------
*/

function showEmptyState(
    message
) {

    hideLoading();


    if (tableWrapper) {

        tableWrapper.style.display =
            "none";

    }


    if (emptyState) {

        emptyState.style.display =
            "block";


        const paragraph =
            emptyState.querySelector(
                "p"
            );


        if (paragraph) {

            paragraph.textContent =
                message;

        }

    }

}


/*
|--------------------------------------------------------------------------
| HIDE EMPTY STATE
|--------------------------------------------------------------------------
*/

function hideEmptyState() {

    if (emptyState) {

        emptyState.style.display =
            "none";

    }

}


/*
|--------------------------------------------------------------------------
| OPEN ADD MODAL
|--------------------------------------------------------------------------
*/

function openAddModal() {

    editingDocumentId =
        null;


    resetForm();


    if (modalTitle) {

        modalTitle.innerHTML =
            `
                <i class="bi bi-file-earmark-plus me-2 text-primary"></i>
                Add Student Document
            `;

    }


    if (saveDocumentButton) {

        saveDocumentButton.innerHTML =
            `
                <i class="bi bi-check-circle me-2"></i>
                Save Document
            `;

    }


    showModal();

}


/*
|--------------------------------------------------------------------------
| OPEN EDIT MODAL
|--------------------------------------------------------------------------
*/

async function openEditModal(
    id
) {

    const documentRecord =
        documents.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!documentRecord) {

        showMessage(
            "Document record could not be found.",
            "danger"
        );

        return;

    }


    editingDocumentId =
        id;


    resetForm();


    if (studentIdInput) {

        studentIdInput.value =
            documentRecord.student_id ||
            "";

        studentIdInput.readOnly =
            true;

    }


    if (documentTypeInput) {

        ensureDocumentTypeOption(
            documentRecord.document_type
        );


        documentTypeInput.value =
            documentRecord.document_type ||
            "";

    }


    if (documentNameInput) {

        documentNameInput.value =
            documentRecord.document_name ||
            "";

    }


    if (fileUrlInput) {

        fileUrlInput.value =
            documentRecord.file_url ||
            "";

        updateUrlPreview();

    }


    if (fileSizeInput) {

        fileSizeInput.value =
            documentRecord.file_size ??
            "";

    }


    if (mimeTypeInput) {

        mimeTypeInput.value =
            documentRecord.mime_type ||
            "";

    }


    if (modalTitle) {

        modalTitle.innerHTML =
            `
                <i class="bi bi-pencil-square me-2 text-primary"></i>
                Edit Student Document
            `;

    }


    if (saveDocumentButton) {

        saveDocumentButton.innerHTML =
            `
                <i class="bi bi-check-circle me-2"></i>
                Update Document
            `;

    }


    showModal();

}


/*
|--------------------------------------------------------------------------
| RESET FORM
|--------------------------------------------------------------------------
*/

function resetForm() {

    if (documentForm) {

        documentForm.reset();

    }


    editingDocumentId =
        null;


    if (studentIdInput) {

        studentIdInput.readOnly =
            false;

    }


    if (documentUrlPreview) {

        documentUrlPreview.style.display =
            "none";

    }


    if (documentUrlPreviewLink) {

        documentUrlPreviewLink.href =
            "#";

    }


    clearFormMessage();


    if (documentTypeInput) {

        ensureDocumentTypeOption(
            ""
        );

    }

}


/*
|--------------------------------------------------------------------------
| ENSURE DOCUMENT TYPE OPTION
|--------------------------------------------------------------------------
*/

function ensureDocumentTypeOption(
    value
) {

    if (
        !documentTypeInput ||
        !value
    ) {
        return;
    }


    const exists =
        Array.from(
            documentTypeInput.options
        ).some(
            option =>
                option.value ===
                String(value)
        );


    if (!exists) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            String(value);


        option.textContent =
            String(value);


        documentTypeInput.appendChild(
            option
        );

    }

}


/*
|--------------------------------------------------------------------------
| SHOW MODAL
|--------------------------------------------------------------------------
*/

function showModal() {

    if (!documentModalElement) {
        return;
    }


    if (
        window.bootstrap &&
        bootstrap.Modal
    ) {

        if (!documentModal) {

            documentModal =
                bootstrap.Modal.getOrCreateInstance(
                    documentModalElement
                );

        }


        documentModal.show();

    } else {

        documentModalElement.classList.add(
            "show"
        );

        documentModalElement.style.display =
            "block";

        documentModalElement.setAttribute(
            "aria-hidden",
            "false"
        );

    }

}


/*
|--------------------------------------------------------------------------
| HIDE MODAL
|--------------------------------------------------------------------------
*/

function hideModal() {

    if (!documentModalElement) {
        return;
    }


    if (
        documentModal
    ) {

        documentModal.hide();

        return;

    }


    if (
        window.bootstrap &&
        bootstrap.Modal
    ) {

        documentModal =
            bootstrap.Modal.getOrCreateInstance(
                documentModalElement
            );


        documentModal.hide();

        return;

    }


    documentModalElement.classList.remove(
        "show"
    );

    documentModalElement.style.display =
        "none";

    documentModalElement.setAttribute(
        "aria-hidden",
        "true"
    );

}


/*
|--------------------------------------------------------------------------
| SAVE DOCUMENT
|--------------------------------------------------------------------------
*/

async function saveDocument(
    event
) {

    event.preventDefault();


    clearFormMessage();


    const studentId =
        String(
            studentIdInput?.value ||
            ""
        ).trim();


    const documentType =
        String(
            documentTypeInput?.value ||
            ""
        ).trim();


    const documentName =
        String(
            documentNameInput?.value ||
            ""
        ).trim();


    const fileUrl =
        String(
            fileUrlInput?.value ||
            ""
        ).trim();


    const fileSizeValue =
        String(
            fileSizeInput?.value ||
            ""
        ).trim();


    const mimeType =
        String(
            mimeTypeInput?.value ||
            ""
        ).trim();


    if (!studentId) {

        showFormMessage(
            "Student ID is required."
        );

        return;

    }


    if (!documentType) {

        showFormMessage(
            "Document type is required."
        );

        return;

    }


    if (!documentName) {

        showFormMessage(
            "Document name is required."
        );

        return;

    }


    if (!fileUrl) {

        showFormMessage(
            "Document file URL is required."
        );

        return;

    }


    try {

        new URL(
            fileUrl
        );

    } catch (error) {

        showFormMessage(
            "Please enter a valid document file URL."
        );

        return;

    }


    let fileSize =
        null;


    if (fileSizeValue) {

        fileSize =
            Number(
                fileSizeValue
            );


        if (
            !Number.isFinite(
                fileSize
            ) ||
            fileSize < 0
        ) {

            showFormMessage(
                "File size must be a valid non-negative number."
            );

            return;

        }

    }


    const payload = {

        studentId,

        documentType,

        documentName,

        fileUrl,

        fileSize,

        mimeType:
            mimeType || null

    };


    const originalButtonText =
        saveDocumentButton
            ? saveDocumentButton.innerHTML
            : "";


    if (saveDocumentButton) {

        saveDocumentButton.disabled =
            true;


        saveDocumentButton.innerHTML =
            `
                <span
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                ></span>
                Saving...
            `;

    }


    try {

        let result;


        if (
            editingDocumentId
        ) {

            result =
                await apiRequest(
                    `${DOCUMENTS_API}/${encodeURIComponent(
                        editingDocumentId
                    )}`,
                    {
                        method: "PUT",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


        } else {

            result =
                await apiRequest(
                    DOCUMENTS_API,
                    {
                        method: "POST",
                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );

        }


        showMessage(
            result?.message ||
            (
                editingDocumentId
                    ? "Document updated successfully."
                    : "Student document created successfully."
            ),
            "success"
        );


        hideModal();


        resetForm();


        await loadDocuments();


    } catch (error) {

        console.error(
            "Save document error:",
            error
        );


        showFormMessage(
            error.message ||
            "Unable to save document."
        );

    } finally {

        if (saveDocumentButton) {

            saveDocumentButton.disabled =
                false;


            saveDocumentButton.innerHTML =
                originalButtonText ||
                `
                    <i class="bi bi-check-circle me-2"></i>
                    Save Document
                `;

        }

    }

}


/*
|--------------------------------------------------------------------------
| DELETE DOCUMENT
|--------------------------------------------------------------------------
*/

async function removeDocument(
    id
) {

    const documentRecord =
        documents.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const documentName =
        documentRecord?.document_name ||
        "this document";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${documentName}"? This action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `${DOCUMENTS_API}/${encodeURIComponent(
                id
            )}`,
            {
                method: "DELETE"
            }
        );


        showMessage(
            "Document deleted successfully.",
            "success"
        );


        await loadDocuments();


    } catch (error) {

        console.error(
            "Delete document error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to delete document.",
            "danger"
        );

    }

}


/*
|--------------------------------------------------------------------------
| VIEW DOCUMENT
|--------------------------------------------------------------------------
*/

function viewDocument(
    id
) {

    const documentRecord =
        documents.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const fileUrl =
        documentRecord?.file_url ||
        "";


    if (!fileUrl) {

        showMessage(
            "Document file is not available.",
            "warning"
        );

        return;

    }


    window.open(
        fileUrl,
        "_blank",
        "noopener,noreferrer"
    );

}


/*
|--------------------------------------------------------------------------
| DOWNLOAD DOCUMENT
|--------------------------------------------------------------------------
*/

function downloadDocument(
    id
) {

    const documentRecord =
        documents.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const fileUrl =
        documentRecord?.file_url ||
        "";


    if (!fileUrl) {

        showMessage(
            "Document file is not available.",
            "warning"
        );

        return;

    }


    const fileName =
        buildDownloadFileName(
            documentRecord
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        fileUrl;


    link.download =
        fileName;


    link.target =
        "_blank";


    link.rel =
        "noopener";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();

}


/*
|--------------------------------------------------------------------------
| BUILD DOWNLOAD FILE NAME
|--------------------------------------------------------------------------
*/

function buildDownloadFileName(
    documentRecord
) {

    const documentName =
        documentRecord?.document_name ||
        "document";


    const extension =
        getFileExtension(
            documentRecord?.file_url ||
            "",
            documentRecord?.mime_type ||
            ""
        );


    return (
        sanitizeFileName(
            documentName
        ) +
        (
            extension
                ? `.${extension}`
                : ""
        )
    );

}


/*
|--------------------------------------------------------------------------
| URL PREVIEW
|--------------------------------------------------------------------------
*/

function updateUrlPreview() {

    if (
        !documentUrlPreview ||
        !documentUrlPreviewLink
    ) {
        return;
    }


    const url =
        String(
            fileUrlInput?.value ||
            ""
        ).trim();


    if (!url) {

        documentUrlPreview.style.display =
            "none";


        documentUrlPreviewLink.href =
            "#";


        return;

    }


    try {

        new URL(
            url
        );


        documentUrlPreviewLink.href =
            url;


        documentUrlPreview.style.display =
            "block";


    } catch (error) {

        documentUrlPreview.style.display =
            "none";

    }

}


/*
|--------------------------------------------------------------------------
| FILE SIZE
|--------------------------------------------------------------------------
*/

function formatFileSize(
    bytes
) {

    if (
        bytes === null ||
        bytes === undefined ||
        bytes === ""
    ) {
        return "";
    }


    const number =
        Number(
            bytes
        );


    if (
        !Number.isFinite(
            number
        ) ||
        number < 0
    ) {
        return "";
    }


    if (
        number === 0
    ) {
        return "0 Bytes";
    }


    const units = [

        "Bytes",

        "KB",

        "MB",

        "GB"

    ];


    const exponent =
        Math.min(
            Math.floor(
                Math.log(
                    number
                ) /
                Math.log(1024)
            ),
            units.length - 1
        );


    const value =
        number /
        Math.pow(
            1024,
            exponent
        );


    return (
        `${value.toFixed(
            exponent === 0
                ? 0
                : 1
        )} ${units[exponent]}`
    );

}


/*
|--------------------------------------------------------------------------
| FILE ICON
|--------------------------------------------------------------------------
*/

function getFileIcon(
    mimeType,
    fileUrl
) {

    const mime =
        String(
            mimeType || ""
        ).toLowerCase();


    const url =
        String(
            fileUrl || ""
        ).toLowerCase();


    if (
        mime ===
            "application/pdf" ||
        url.endsWith(
            ".pdf"
        )
    ) {

        return "bi-file-earmark-pdf";

    }


    if (
        mime.startsWith(
            "image/"
        ) ||
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
            url
        )
    ) {

        return "bi-file-earmark-image";

    }


    if (
        mime.includes(
            "word"
        ) ||
        mime.includes(
            "document"
        ) ||
        /\.(doc|docx)$/i.test(
            url
        )
    ) {

        return "bi-file-earmark-word";

    }


    if (
        mime.includes(
            "sheet"
        ) ||
        mime.includes(
            "excel"
        ) ||
        /\.(xls|xlsx|csv)$/i.test(
            url
        )
    ) {

        return "bi-file-earmark-spreadsheet";

    }


    return "bi-file-earmark";

}


/*
|--------------------------------------------------------------------------
| FILE LABEL
|--------------------------------------------------------------------------
*/

function getFileLabel(
    mimeType,
    fileUrl
) {

    const mime =
        String(
            mimeType || ""
        ).toLowerCase();


    if (
        mime ===
            "application/pdf"
    ) {

        return "PDF";

    }


    if (
        mime.startsWith(
            "image/"
        )
    ) {

        return "Image";

    }


    if (
        mime.includes(
            "word"
        ) ||
        mime.includes(
            "document"
        )
    ) {

        return "Word";

    }


    if (
        mime.includes(
            "sheet"
        ) ||
        mime.includes(
            "excel"
        )
    ) {

        return "Spreadsheet";

    }


    const extension =
        getFileExtension(
            fileUrl,
            mimeType
        );


    return extension
        ? extension.toUpperCase()
        : "File";

}


/*
|--------------------------------------------------------------------------
| FILE EXTENSION
|--------------------------------------------------------------------------
*/

function getFileExtension(
    fileUrl,
    mimeType
) {

    const url =
        String(
            fileUrl || ""
        );


    try {

        const parsedUrl =
            new URL(
                url,
                window.location.origin
            );


        const pathname =
            parsedUrl.pathname;


        const match =
            pathname.match(
                /\.([a-zA-Z0-9]+)$/
            );


        if (match) {

            return match[1]
                .toLowerCase();

        }

    } catch (error) {
    }


    const mime =
        String(
            mimeType || ""
        ).toLowerCase();


    const mimeExtensions = {

        "application/pdf":
            "pdf",

        "image/jpeg":
            "jpg",

        "image/png":
            "png",

        "image/gif":
            "gif",

        "image/webp":
            "webp",

        "application/msword":
            "doc",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            "docx",

        "application/vnd.ms-excel":
            "xls",

        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            "xlsx"

    };


    return (
        mimeExtensions[mime] ||
        ""
    );

}


/*
|--------------------------------------------------------------------------
| SANITIZE FILE NAME
|--------------------------------------------------------------------------
*/

function sanitizeFileName(
    value
) {

    return String(
        value || "document"
    )
        .trim()
        .replace(
            /[<>:"/\\|?*\x00-\x1F]/g,
            "-"
        )
        .replace(
            /\s+/g,
            " "
        )
        .substring(
            0,
            150
        ) ||
        "document";

}


/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleDateString(
        "en-NG",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(
    value
) {

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
| EVENT HANDLERS
|--------------------------------------------------------------------------
*/

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderDocuments
    );

}


if (typeFilter) {

    typeFilter.addEventListener(
        "change",
        renderDocuments
    );

}


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            await loadDocuments();

        }
    );

}


if (addDocumentButton) {

    addDocumentButton.addEventListener(
        "click",
        openAddModal
    );

}


if (documentForm) {

    documentForm.addEventListener(
        "submit",
        saveDocument
    );

}


if (closeModalButton) {

    closeModalButton.addEventListener(
        "click",
        hideModal
    );

}


if (cancelModalButton) {

    cancelModalButton.addEventListener(
        "click",
        hideModal
    );

}


if (fileUrlInput) {

    fileUrlInput.addEventListener(
        "input",
        updateUrlPreview
    );

}


if (tableBody) {

    tableBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (!id) {
                return;
            }


            if (
                action === "view"
            ) {

                viewDocument(
                    id
                );

                return;

            }


            if (
                action === "download"
            ) {

                downloadDocument(
                    id
                );

                return;

            }


            if (
                action === "edit"
            ) {

                openEditModal(
                    id
                );

                return;

            }


            if (
                action === "delete"
            ) {

                removeDocument(
                    id
                );

            }

        }
    );

}


/*
|--------------------------------------------------------------------------
| BOOTSTRAP
|--------------------------------------------------------------------------
*/

async function initialize() {

    if (
        documentModalElement &&
        window.bootstrap &&
        bootstrap.Modal
    ) {

        documentModal =
            bootstrap.Modal.getOrCreateInstance(
                documentModalElement
            );

    }


    await loadDocuments();

}


/*
|--------------------------------------------------------------------------
| PUBLIC API
|--------------------------------------------------------------------------
*/

window.DocumentsPage = {

    loadDocuments,

    renderDocuments,

    openAddModal,

    openEditModal,

    viewDocument,

    downloadDocument,

    removeDocument

};


window.loadDocuments =
    loadDocuments;


window.viewDocument =
    viewDocument;


window.downloadDocument =
    downloadDocument;


window.deleteDocument =
    removeDocument;


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
