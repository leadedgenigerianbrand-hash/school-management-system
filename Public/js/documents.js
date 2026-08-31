const API_BASE = "/api";

let documents = [];


/*
|--------------------------------------------------------------------------
| DOM ELEMENTS
|--------------------------------------------------------------------------
*/

const tableBody =
    document.getElementById("documentsTableBody") ||
    document.getElementById("documentTableBody") ||
    document.querySelector("#documentsTable tbody");

const searchInput =
    document.getElementById("searchInput") ||
    document.getElementById("documentSearch");

const typeFilter =
    document.getElementById("typeFilter") ||
    document.getElementById("documentTypeFilter");

const statusFilter =
    document.getElementById("statusFilter");

const messageContainer =
    document.getElementById("message") ||
    document.getElementById("messageContainer");


/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

function getToken() {

    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token")
    );

}


/*
|--------------------------------------------------------------------------
| API REQUEST
|--------------------------------------------------------------------------
*/

async function apiRequest(
    url,
    options = {}
) {

    const token = getToken();

    const headers = {
        ...(options.headers || {})
    };


    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {

        headers["Content-Type"] =
            "application/json";

    }


    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }


    const response =
        await fetch(
            API_BASE + url,
            {
                ...options,
                headers
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        data = null;

    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            "Request failed."
        );

    }


    return data;

}


/*
|--------------------------------------------------------------------------
| SHOW MESSAGE
|--------------------------------------------------------------------------
*/

function showMessage(
    text,
    type = "success"
) {

    if (!messageContainer) {
        return;
    }


    messageContainer.textContent =
        text;


    messageContainer.className =
        `message ${type}`;


    setTimeout(
        function() {

            messageContainer.textContent =
                "";

            messageContainer.className =
                "message";

        },
        4000
    );

}


/*
|--------------------------------------------------------------------------
| LOAD DOCUMENTS
|--------------------------------------------------------------------------
*/

async function loadDocuments() {

    try {

        showLoading();


        const result =
            await apiRequest(
                "/documents"
            );


        documents =
            Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.documents)
                    ? result.documents
                    : Array.isArray(result)
                        ? result
                        : [];


        renderDocuments();


    } catch (error) {

        console.error(
            "Load documents error:",
            error
        );


        showEmpty(
            "Unable to load documents."
        );


        showMessage(
            error.message ||
            "Unable to load documents.",
            "error"
        );

    }

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


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedType =
        typeFilter
            ? typeFilter.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .trim()
                .toLowerCase()
            : "";


    const filteredDocuments =
        documents.filter(
            document => {

                const name =
                    String(
                        document.document_name ||
                        document.documentName ||
                        document.name ||
                        document.title ||
                        ""
                    ).toLowerCase();


                const type =
                    String(
                        document.document_type ||
                        document.documentType ||
                        document.type ||
                        ""
                    ).toLowerCase();


                const description =
                    String(
                        document.description ||
                        ""
                    ).toLowerCase();


                const fileName =
                    String(
                        document.file_name ||
                        document.fileName ||
                        ""
                    ).toLowerCase();


                const status =
                    String(
                        document.status ||
                        "active"
                    ).toLowerCase();


                const studentName =
                    String(
                        document.student_name ||
                        document.studentName ||
                        ""
                    ).toLowerCase();


                const staffName =
                    String(
                        document.staff_name ||
                        document.staffName ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    name.includes(searchTerm) ||
                    type.includes(searchTerm) ||
                    description.includes(searchTerm) ||
                    fileName.includes(searchTerm) ||
                    studentName.includes(searchTerm) ||
                    staffName.includes(searchTerm);


                const matchesType =
                    !selectedType ||
                    type === selectedType;


                const matchesStatus =
                    !selectedStatus ||
                    status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesStatus
                );

            }
        );


    if (
        filteredDocuments.length === 0
    ) {

        showEmpty(
            "No documents found."
        );

        return;

    }


    tableBody.innerHTML =
        filteredDocuments
            .map(
                document =>
                    createDocumentRow(
                        document
                    )
            )
            .join("");

}


/*
|--------------------------------------------------------------------------
| CREATE DOCUMENT ROW
|--------------------------------------------------------------------------
*/

function createDocumentRow(
    document
) {

    const id =
        document.id;


    const name =
        document.document_name ||
        document.documentName ||
        document.name ||
        document.title ||
        document.file_name ||
        document.fileName ||
        "-";


    const type =
        document.document_type ||
        document.documentType ||
        document.type ||
        "-";


    const fileName =
        document.file_name ||
        document.fileName ||
        "-";


    const description =
        document.description ||
        "-";


    const status =
        String(
            document.status ||
            "active"
        ).toLowerCase();


    const studentName =
        document.student_name ||
        document.studentName ||
        "-";


    const staffName =
        document.staff_name ||
        document.staffName ||
        "-";


    const owner =
        studentName !== "-"
            ? studentName
            : staffName;


    const createdAt =
        document.created_at ||
        document.createdAt;


    const fileUrl =
        document.file_url ||
        document.fileUrl ||
        document.url ||
        document.path ||
        "";


    return `
        <tr>

            <td>
                ${escapeHtml(name)}
            </td>

            <td>
                ${escapeHtml(fileName)}
            </td>

            <td>
                ${escapeHtml(type)}
            </td>

            <td>
                ${escapeHtml(owner)}
            </td>

            <td>
                <span class="status-badge status-${escapeHtml(status)}">
                    ${formatStatus(status)}
                </span>
            </td>

            <td>
                ${formatDate(createdAt)}
            </td>

            <td>

                <div class="action-buttons">

                    ${
                        fileUrl
                            ? `
                                <button
                                    type="button"
                                    class="btn btn-sm btn-primary"
                                    onclick="viewDocument('${escapeJs(fileUrl)}')"
                                >
                                    View
                                </button>
                            `
                            : ""
                    }

                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        onclick="deleteDocument('${escapeJs(id)}')"
                    >
                        Delete
                    </button>

                </div>

            </td>

        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| ADD DOCUMENT
|--------------------------------------------------------------------------
*/

function addDocument() {

    window.location.href =
        "document-form.html";

}


/*
|--------------------------------------------------------------------------
| EDIT DOCUMENT
|--------------------------------------------------------------------------
*/

function editDocument(
    id
) {

    window.location.href =
        `document-form.html?id=${encodeURIComponent(id)}`;

}


/*
|--------------------------------------------------------------------------
| VIEW DOCUMENT
|--------------------------------------------------------------------------
*/

function viewDocument(
    url
) {

    if (!url) {

        showMessage(
            "Document file is not available.",
            "error"
        );

        return;

    }


    window.open(
        url,
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
    url,
    fileName = "document"
) {

    if (!url) {

        showMessage(
            "Document file is not available.",
            "error"
        );

        return;

    }


    const link =
        document.createElement("a");


    link.href =
        url;


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
| DELETE DOCUMENT
|--------------------------------------------------------------------------
*/

async function deleteDocument(
    id
) {

    const documentRecord =
        documents.find(
            item =>
                String(item.id) ===
                String(id)
        );


    const documentName =
        documentRecord
            ? (
                documentRecord.document_name ||
                documentRecord.documentName ||
                documentRecord.name ||
                documentRecord.title ||
                documentRecord.file_name ||
                documentRecord.fileName ||
                "this document"
            )
            : "this document";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${documentName}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/documents/${id}`,
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
            "error"
        );

    }

}


/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderDocuments
    );

}


/*
|--------------------------------------------------------------------------
| TYPE FILTER
|--------------------------------------------------------------------------
*/

if (typeFilter) {

    typeFilter.addEventListener(
        "change",
        renderDocuments
    );

}


/*
|--------------------------------------------------------------------------
| STATUS FILTER
|--------------------------------------------------------------------------
*/

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        renderDocuments
    );

}


/*
|--------------------------------------------------------------------------
| LOADING STATE
|--------------------------------------------------------------------------
*/

function showLoading() {

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>

            <td
                colspan="7"
                style="
                    text-align:center;
                    padding:30px;
                "
            >
                Loading documents...
            </td>

        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

function showEmpty(
    text
) {

    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>

            <td
                colspan="7"
                style="
                    text-align:center;
                    padding:30px;
                "
            >
                ${escapeHtml(text)}
            </td>

        </tr>
    `;

}


/*
|--------------------------------------------------------------------------
| FORMAT STATUS
|--------------------------------------------------------------------------
*/

function formatStatus(
    status
) {

    const labels = {

        active:
            "Active",

        inactive:
            "Inactive",

        archived:
            "Archived",

        pending:
            "Pending",

        approved:
            "Approved"

    };


    return (
        labels[status] ||
        status
            .replace(
                /_/g,
                " "
            )
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            )
    );

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
        new Date(value);


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
| ESCAPE JAVASCRIPT
|--------------------------------------------------------------------------
*/

function escapeJs(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        );

}


/*
|--------------------------------------------------------------------------
| GLOBAL FUNCTIONS
|--------------------------------------------------------------------------
*/

window.loadDocuments =
    loadDocuments;

window.addDocument =
    addDocument;

window.editDocument =
    editDocument;

window.viewDocument =
    viewDocument;

window.downloadDocument =
    downloadDocument;

window.deleteDocument =
    deleteDocument;


/*
|--------------------------------------------------------------------------
| INITIALISE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadDocuments();

    }
);