/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| API.JS
|--------------------------------------------------------------------------
| Central frontend API communication layer.
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";

    const API_BASE_URL = "/api";
    const TOKEN_KEY = "school_management_token";
    const USER_KEY = "school_management_user";

    /*
    |--------------------------------------------------------------------------
    | Token
    |--------------------------------------------------------------------------
    */

    function getApiToken() {
        return (
            localStorage.getItem(TOKEN_KEY) ||
            sessionStorage.getItem(TOKEN_KEY) ||
            localStorage.getItem("token") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            ""
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Clear Authentication
    |--------------------------------------------------------------------------
    */

    function clearApiAuthentication() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);

        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("accessToken");
    }

    /*
    |--------------------------------------------------------------------------
    | API Request
    |--------------------------------------------------------------------------
    */

    async function apiRequest(endpoint, options = {}) {
        const token = getApiToken();

        let url = endpoint;

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            if (!url.startsWith("/")) {
                url = "/" + url;
            }

            if (!url.startsWith(API_BASE_URL + "/")) {
                url = API_BASE_URL + url;
            }
        }

        const requestOptions = {
            ...options,
            headers: {
                ...(options.headers || {})
            }
        };

        /*
        |--------------------------------------------------------------------------
        | Authorization
        |--------------------------------------------------------------------------
        */

        if (token) {
            requestOptions.headers.Authorization = `Bearer ${token}`;
        }

        /*
        |--------------------------------------------------------------------------
        | Content-Type
        |--------------------------------------------------------------------------
        */

        if (
            requestOptions.body &&
            !(requestOptions.body instanceof FormData) &&
            !requestOptions.headers["Content-Type"] &&
            !requestOptions.headers["content-type"]
        ) {
            requestOptions.headers["Content-Type"] = "application/json";
        }

        /*
        |--------------------------------------------------------------------------
        | Request
        |--------------------------------------------------------------------------
        */

        let response;

        try {
            response = await fetch(url, requestOptions);
        } catch (error) {
            console.error("API request failed:", error);
            throw new Error(
                "Unable to connect to the server. Please check your connection."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Authentication Error
        |--------------------------------------------------------------------------
        */

        if (response.status === 401) {
            clearApiAuthentication();

            const currentPath = window.location.pathname;

            if (!currentPath.endsWith("/login.html")) {
                window.location.href = "/pages/login.html";
            }

            throw new Error("Authentication required.");
        }

        /*
        |--------------------------------------------------------------------------
        | Permission Error
        |--------------------------------------------------------------------------
        */

        if (response.status === 403) {
            throw new Error(
                "You do not have permission to perform this action."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Response Parsing
        |--------------------------------------------------------------------------
        */

        const contentType =
            response.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        /*
        |--------------------------------------------------------------------------
        | HTTP Errors
        |--------------------------------------------------------------------------
        */

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

    /*
    |--------------------------------------------------------------------------
    | GET
    |--------------------------------------------------------------------------
    */

    async function apiGet(endpoint, options = {}) {
        return apiRequest(endpoint, {
            ...options,
            method: "GET"
        });
    }

    /*
    |--------------------------------------------------------------------------
    | POST
    |--------------------------------------------------------------------------
    */

    async function apiPost(endpoint, body, options = {}) {
        const requestBody =
            body instanceof FormData
                ? body
                : body !== undefined
                    ? JSON.stringify(body)
                    : undefined;

        return apiRequest(endpoint, {
            ...options,
            method: "POST",
            body: requestBody
        });
    }

    /*
    |--------------------------------------------------------------------------
    | PUT
    |--------------------------------------------------------------------------
    */

    async function apiPut(endpoint, body, options = {}) {
        const requestBody =
            body instanceof FormData
                ? body
                : body !== undefined
                    ? JSON.stringify(body)
                    : undefined;

        return apiRequest(endpoint, {
            ...options,
            method: "PUT",
            body: requestBody
        });
    }

    /*
    |--------------------------------------------------------------------------
    | PATCH
    |--------------------------------------------------------------------------
    */

    async function apiPatch(endpoint, body, options = {}) {
        const requestBody =
            body instanceof FormData
                ? body
                : body !== undefined
                    ? JSON.stringify(body)
                    : undefined;

        return apiRequest(endpoint, {
            ...options,
            method: "PATCH",
            body: requestBody
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    async function apiDelete(endpoint, options = {}) {
        return apiRequest(endpoint, {
            ...options,
            method: "DELETE"
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Current User
    |--------------------------------------------------------------------------
    */

    async function getCurrentUserFromAPI() {
        return apiGet("/auth/me");
    }

    /*
    |--------------------------------------------------------------------------
    | API Health
    |--------------------------------------------------------------------------
    */

    async function checkApiHealth() {
        try {
            const response = await fetch("/api/health");

            if (!response.ok) {
                return false;
            }

            const data = await response.json();

            return data && (
                data.success === true ||
                data.status === "ok" ||
                data.status === "healthy"
            );
        } catch (error) {
            console.error("API health check failed:", error);
            return false;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Global Exports
    |--------------------------------------------------------------------------
    */

    window.apiRequest = apiRequest;
    window.apiGet = apiGet;
    window.apiPost = apiPost;
    window.apiPut = apiPut;
    window.apiPatch = apiPatch;
    window.apiDelete = apiDelete;

    window.getCurrentUserFromAPI = getCurrentUserFromAPI;
    window.checkApiHealth = checkApiHealth;

    window.getApiToken = getApiToken;
    window.clearApiAuthentication = clearApiAuthentication;

})();