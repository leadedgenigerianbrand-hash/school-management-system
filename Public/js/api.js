(function () {
    "use strict";

    const API_BASE_URL = "/api";

    const TOKEN_KEY =
        "school_management_token";

    const USER_KEY =
        "school_management_user";

    function getApiToken() {
        return (
            localStorage.getItem(TOKEN_KEY) ||
            sessionStorage.getItem(TOKEN_KEY) ||
            ""
        );
    }

    function getStoredUser() {
        const storedUser =
            localStorage.getItem(USER_KEY) ||
            sessionStorage.getItem(USER_KEY);

        if (!storedUser) {
            return null;
        }

        try {
            return JSON.parse(storedUser);
        } catch (error) {
            localStorage.removeItem(USER_KEY);
            sessionStorage.removeItem(USER_KEY);
            return null;
        }
    }

    function clearApiAuthentication() {
        if (
            window.Auth &&
            typeof window.Auth.clearAuthentication ===
                "function"
        ) {
            window.Auth.clearAuthentication();
            return;
        }

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
    }

    function isLoginPage() {
        return window.location.pathname
            .toLowerCase()
            .endsWith("/login.html");
    }

    function buildApiUrl(endpoint) {
        if (
            typeof endpoint !== "string" ||
            !endpoint.trim()
        ) {
            throw new Error(
                "API endpoint is required."
            );
        }

        let url = endpoint.trim();

        if (
            url.startsWith("http://") ||
            url.startsWith("https://")
        ) {
            return url;
        }

        if (!url.startsWith("/")) {
            url = `/${url}`;
        }

        if (
            url === API_BASE_URL ||
            url.startsWith(
                `${API_BASE_URL}/`
            )
        ) {
            return url;
        }

        return `${API_BASE_URL}${url}`;
    }

    function buildRequestHeaders(
        options,
        token
    ) {
        const headers = {
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization =
                `Bearer ${token}`;
        }

        const hasBody =
            options.body !== undefined &&
            options.body !== null;

        const isFormData =
            typeof FormData !== "undefined" &&
            options.body instanceof FormData;

        const hasContentType =
            Boolean(
                headers["Content-Type"] ||
                headers["content-type"]
            );

        if (
            hasBody &&
            !isFormData &&
            !hasContentType
        ) {
            headers["Content-Type"] =
                "application/json";
        }

        if (
            !headers.Accept &&
            !headers.accept
        ) {
            headers.Accept =
                "application/json";
        }

        return headers;
    }

    async function parseResponse(response) {
        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            contentType
                .toLowerCase()
                .includes("application/json")
        ) {
            try {
                return await response.json();
            } catch (error) {
                throw new Error(
                    "The server returned invalid JSON."
                );
            }
        }

        return response.text();
    }

    function getResponseErrorMessage(
        data
    ) {
        if (
            data &&
            typeof data === "object"
        ) {
            return (
                data.message ||
                data.error ||
                "Request failed."
            );
        }

        if (
            typeof data === "string" &&
            data.trim()
        ) {
            return data.trim();
        }

        return "Request failed.";
    }

    async function apiRequest(
        endpoint,
        options = {}
    ) {
        const url =
            buildApiUrl(endpoint);

        const token =
            getApiToken();

        const requestOptions = {
            ...options,
            headers:
                buildRequestHeaders(
                    options,
                    token
                ),
            credentials:
                options.credentials ||
                "include"
        };

        let response;

        try {
            response =
                await fetch(
                    url,
                    requestOptions
                );
        } catch (error) {
            console.error(
                "API request failed:",
                error
            );

            const networkError =
                new Error(
                    "Unable to connect to the server. Please check your connection."
                );

            networkError.cause =
                error;

            throw networkError;
        }

        if (
            response.status === 401
        ) {
            console.warn(
                "Authentication rejected by server:",
                url
            );

            clearApiAuthentication();

            if (!isLoginPage()) {
                window.location.replace(
                    "/pages/login.html"
                );
            }

            const error =
                new Error(
                    "Authentication required."
                );

            error.statusCode = 401;

            throw error;
        }

        if (
            response.status === 403
        ) {
            const error =
                new Error(
                    "You do not have permission to perform this action."
                );

            error.statusCode = 403;

            throw error;
        }

        const data =
            await parseResponse(
                response
            );

        if (!response.ok) {
            const error =
                new Error(
                    getResponseErrorMessage(
                        data
                    )
                );

            error.statusCode =
                response.status;

            error.response =
                data;

            throw error;
        }

        return data;
    }

    async function apiGet(
        endpoint,
        options = {}
    ) {
        return apiRequest(
            endpoint,
            {
                ...options,
                method: "GET"
            }
        );
    }

    async function apiPost(
        endpoint,
        body,
        options = {}
    ) {
        const requestBody =
            body instanceof FormData
                ? body
                : body !== undefined &&
                  body !== null
                    ? JSON.stringify(body)
                    : undefined;

        return apiRequest(
            endpoint,
            {
                ...options,
                method: "POST",
                body: requestBody
            }
        );
    }

    async function apiPut(
        endpoint,
        body,
        options = {}
    ) {
        const requestBody =
            body instanceof FormData
                ? body
                : body !== undefined &&
                  body !== null
                    ? JSON.stringify(body)
                    : undefined;

        return apiRequest(
            endpoint,
            {
                ...options,
                method: "PUT",
                body: requestBody
            }
        );
    }

    async function apiPatch(
        endpoint,
        body,
        options = {}
    ) {
        const requestBody =
            body instanceof FormData
                ? body
                : body !== undefined &&
                  body !== null
                    ? JSON.stringify(body)
                    : undefined;

        return apiRequest(
            endpoint,
            {
                ...options,
                method: "PATCH",
                body: requestBody
            }
        );
    }

    async function apiDelete(
        endpoint,
        options = {}
    ) {
        return apiRequest(
            endpoint,
            {
                ...options,
                method: "DELETE"
            }
        );
    }

    async function getCurrentUserFromAPI() {
        return apiGet(
            "/auth/me"
        );
    }

    async function checkApiHealth() {
        try {
            const response =
                await fetch(
                    "/api/health",
                    {
                        method: "GET",
                        headers: {
                            Accept:
                                "application/json"
                        },
                        credentials:
                            "include"
                    }
                );

            if (!response.ok) {
                return false;
            }

            const data =
                await response.json();

            return (
                data &&
                data.success === true
            );
        } catch (error) {
            console.error(
                "API health check failed:",
                error
            );

            return false;
        }
    }

    window.apiRequest =
        apiRequest;

    window.apiGet =
        apiGet;

    window.apiPost =
        apiPost;

    window.apiPut =
        apiPut;

    window.apiPatch =
        apiPatch;

    window.apiDelete =
        apiDelete;

    window.getCurrentUserFromAPI =
        getCurrentUserFromAPI;

    window.checkApiHealth =
        checkApiHealth;

    window.getApiToken =
        getApiToken;

    window.getStoredUser =
        getStoredUser;

    window.clearApiAuthentication =
        clearApiAuthentication;
})();