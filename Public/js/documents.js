"use strict";

(function () {
    const API_BASE = "/api";
    let documents = [];

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

    async function apiRequest(endpoint, options = {}) {
        const token =
            localStorage.getItem("school_management_token") ||
            sessionStorage.getItem("school_management_token") ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            "";

        let url = endpoint;

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            if (!url.startsWith("/")) {
                url = `/${url}`;
            }

            if (!url.startsWith(`${API_BASE}/`)) {
                url = `${API_BASE}${url}`;
            }
        }

        const headers = {
            Accept: "application/json",
            ...(options.headers || {})
        };

        if (
            options.body &&
            !(options.body instanceof FormData) &&
            !headers["Content-Type"] &&
            !headers["content-type"]
        ) {
            headers["Content-Type"] = "application/json";
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        let response;

        try {
            response = await fetch(url, {
                ...options,
                headers
            });
        } catch (error) {
            console.error("API request failed:", error);
            throw new Error(
                "Unable to connect to the server. Please check your connection."
            );
        }

        if (response.status === 401) {
            localStorage.removeItem("school_management_token");
            localStorage.removeItem("school_management_user");
            sessionStorage.removeItem("school_management_token");
            sessionStorage.removeItem("school_management_user");

            if (!window.location.pathname.endsWith("/login.html")) {
                window.location.replace("/pages/login.html");
            }

            throw new Error("Authentication required.");
        }

        if (response.status === 403) {
            throw new Error(
                "You do not have permission to perform this action."
            );
        }

        const contentType =
            response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            let message = "Request failed.";

            if (data && typeof data === "object") {
                message =
                    data.message ||
                    data.error ||
                    message;
            } else if (typeof data === "string" && data.trim()) {
                message = data;
            }

            throw new Error(message);
        }

        return data;
    }

    function showMessage(text, type = "success") {
        if (!messageContainer) {
            return;
        }

        messageContainer.textContent = text;
        messageContainer.className = `message ${type}`;

        setTimeout(() => {
            messageContainer.textContent = "";
            messageContainer.className = "message";
        }, 4000);
    }

    async function loadDocuments() {
        try {
            showLoading();

            const result =
                await apiRequest("/documents");

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

    function renderDocuments() {
        if (!tableBody) {
            return;
        }

        const searchTerm =
            searchInput?.value
                .trim()
                .toLowerCase() || "";

        const selectedType =
            typeFilter?.value
                .trim()
                .toLowerCase() || "";

        const selectedStatus =
            statusFilter?.value
                .trim()
                .toLowerCase() || "";

        const filteredDocuments =
            documents.filter(documentRecord => {
                const name =
                    String(
                        documentRecord.document_name ||
                        documentRecord.documentName ||
                        documentRecord.name ||
                        documentRecord.title ||
                        ""
                    ).toLowerCase();

                const type =
                    String(
                        documentRecord.document_type ||
                        documentRecord.documentType ||
                        documentRecord.type ||
                        ""
                    ).toLowerCase();

                const description =
                    String(
                        documentRecord.description ||
                        ""
                    ).toLowerCase();

                const fileName =
                    String(
                        documentRecord.file_name ||
                        documentRecord.fileName ||
                        ""
                    ).toLowerCase();

                const status =
                    String(
                        documentRecord.status ||
                        "active"
                    ).toLowerCase();

                const studentName =
                    String(
                        documentRecord.student_name ||
                        documentRecord.studentName ||
                        ""
                    ).toLowerCase();

                const staffName =
                    String(
                        documentRecord.staff_name ||
                        documentRecord.staffName ||
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
            });

        if (!filteredDocuments.length) {
            showEmpty("No documents found.");
            return;
        }

        tableBody.innerHTML =
            filteredDocuments
                .map(createDocumentRow)
                .join("");
    }

    function createDocumentRow(documentRecord) {
        const id =
            documentRecord.id;

        const name =
            documentRecord.document_name ||
            documentRecord.documentName ||
            documentRecord.name ||
            documentRecord.title ||
            documentRecord.file_name ||
            documentRecord.fileName ||
            "-";

        const type =
            documentRecord.document_type ||
            documentRecord.documentType ||
            documentRecord.type ||
            "-";

        const fileName =
            documentRecord.file_name ||
            documentRecord.fileName ||
            "-";

        const description =
            documentRecord.description ||
            "-";

        const status =
            String(
                documentRecord.status ||
                "active"
            ).toLowerCase();

        const studentName =
            documentRecord.student_name ||
            documentRecord.studentName ||
            "-";

        const staffName =
            documentRecord.staff_name ||
            documentRecord.staffName ||
            "-";

        const owner =
            studentName !== "-"
                ? studentName
                : staffName;

        const createdAt =
            documentRecord.created_at ||
            documentRecord.createdAt;

        const fileUrl =
            documentRecord.file_url ||
            documentRecord.fileUrl ||
            documentRecord.url ||
            documentRecord.path ||
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
                    ${escapeHtml(description)}
                </td>

                <td>
                    <span class="status-badge status-${escapeHtml(status)}">
                        ${escapeHtml(formatStatus(status))}
                    </span>
                </td>

                <td>
                    ${escapeHtml(formatDate(createdAt))}
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

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-secondary"
                                        onclick="downloadDocument('${escapeJs(fileUrl)}', '${escapeJs(fileName)}')"
                                    >
                                        Download
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

    function addDocument() {
        window.location.href =
            "document-form.html";
    }

    function editDocument(id) {
        window.location.href =
            `document-form.html?id=${encodeURIComponent(id)}`;
    }

    function viewDocument(url) {
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

    function downloadDocument(url, fileName = "document") {
        if (!url) {
            showMessage(
                "Document file is not available.",
                "error"
            );
            return;
        }

        const link =
            document.createElement("a");

        link.href = url;
        link.download = fileName;
        link.target = "_blank";
        link.rel = "noopener";

        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    async function deleteDocument(id) {
        const documentRecord =
            documents.find(
                item =>
                    String(item.id) === String(id)
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
                `/documents/${encodeURIComponent(id)}`,
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

    function showLoading() {
        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="text-align:center; padding:30px;"
                >
                    Loading documents...
                </td>
            </tr>
        `;
    }

    function showEmpty(text) {
        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="text-align:center; padding:30px;"
                >
                    ${escapeHtml(text)}
                </td>
            </tr>
        `;
    }

    function formatStatus(status) {
        const normalized =
            String(status || "active")
                .toLowerCase();

        const labels = {
            active: "Active",
            inactive: "Inactive",
            archived: "Archived",
            pending: "Pending",
            approved: "Approved"
        };

        return (
            labels[normalized] ||
            normalized
                .replace(/_/g, " ")
                .replace(/\b\w/g, letter =>
                    letter.toUpperCase()
                )
        );
    }

    function formatDate(value) {
        if (!value) {
            return "-";
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
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

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeJs(value) {
        return String(value ?? "")
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'");
    }

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

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            renderDocuments
        );
    }

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

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            loadDocuments,
            { once: true }
        );
    } else {
        loadDocuments();
    }
})();