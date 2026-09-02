```javascript
"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| API JAVASCRIPT
|--------------------------------------------------------------------------
|
| Central API communication for the frontend.
|
| This file is synchronized with auth.js.
|
| JWT TOKEN:
| school_management_token
|
| USER:
| school_management_user
|
|--------------------------------------------------------------------------
*/

const API_BASE_URL = "/api";

/*
|--------------------------------------------------------------------------
| TOKEN HELPERS
|--------------------------------------------------------------------------
*/

function getApiToken() {
    return (
        localStorage.getItem("school_management_token") ||
        sessionStorage.getItem("school_management_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        null
    );
}

/*
|--------------------------------------------------------------------------
| CLEAR AUTHENTICATION
|--------------------------------------------------------------------------
*/

function clearApiAuthentication() {
    // Current authentication storage
    localStorage.removeItem("school_management_token");
    localStorage.removeItem("school_management_user");

    sessionStorage.removeItem("school_management_token");
    sessionStorage.removeItem("school_management_user");

    // Legacy storage
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("currentUser");
}

/*
|--------------------------------------------------------------------------
| LOGIN PAGE CHECK
|--------------------------------------------------------------------------
*/

function isLoginPage() {
    return window.location.pathname
        .toLowerCase()
        .includes("login.html");
}

/*
|--------------------------------------------------------------------------
| REDIRECT TO LOGIN
|--------------------------------------------------------------------------
*/

function redirectToLogin() {
    if (!isLoginPage()) {
        window.location.replace("/pages/login.html");
    }
}

/*
|--------------------------------------------------------------------------
| PARSE RESPONSE
|--------------------------------------------------------------------------
*/

async function parseApiResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch (error) {
            console.error(
                "Failed to parse JSON response:",
                error
            );

            throw new Error(
                "The server returned invalid JSON."
            );
        }
    }

    const text = await response.text();

    console.error(
        "API returned a non-JSON response:",
        text
    );

    throw new Error(
        `Server returned an unexpected response (${response.status}).`
    );
}

/*
|--------------------------------------------------------------------------
| MAIN API REQUEST
|--------------------------------------------------------------------------
*/

async function apiRequest(endpoint, options = {}) {
    try {
        const token = getApiToken();

        const headers = {
            Accept: "application/json"
        };

        /*
        |--------------------------------------------------------------------------
        | CONTENT TYPE
        |--------------------------------------------------------------------------
        */

        if (
            options.body &&
            typeof options.body === "string"
        ) {
            headers["Content-Type"] =
                "application/json";
        }

        /*
        |--------------------------------------------------------------------------
        | JWT AUTHORIZATION
        |--------------------------------------------------------------------------
        */

        if (token) {
            headers["Authorization"] =
                `Bearer ${token}`;
        }

        /*
        |--------------------------------------------------------------------------
        | CUSTOM HEADERS
        |--------------------------------------------------------------------------
        */

        if (options.headers) {
            Object.assign(
                headers,
                options.headers
            );
        }

        /*
        |--------------------------------------------------------------------------
        | URL
        |--------------------------------------------------------------------------
        */

        const url =
            endpoint.startsWith("http")
                ? endpoint
                : `${API_BASE_URL}${endpoint}`;

        console.log(
            "API Request:",
            options.method || "GET",
            url,
            token
                ? "Authenticated"
                : "No authentication token"
        );

        /*
        |--------------------------------------------------------------------------
        | FETCH
        |--------------------------------------------------------------------------
        */

        const response = await fetch(url, {
            ...options,
            headers,
            credentials: "include"
        });

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        const data =
            await parseApiResponse(response);

        /*
        |--------------------------------------------------------------------------
        | UNAUTHORIZED
        |--------------------------------------------------------------------------
        |
        | Only clear authentication when the server actually
        | confirms that the token is invalid/expired.
        |
        |--------------------------------------------------------------------------
        */

        if (response.status === 401) {
            console.error(
                "API authentication failed (401):",
                endpoint,
                data
            );

            clearApiAuthentication();

            redirectToLogin();

            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | FORBIDDEN
        |--------------------------------------------------------------------------
        */

        if (response.status === 403) {
            console.error(
                "API access forbidden (403):",
                endpoint,
                data
            );

            throw new Error(
                data?.message ||
                "You do not have permission to perform this action."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | OTHER ERRORS
        |--------------------------------------------------------------------------
        */

        if (!response.ok) {
            throw new Error(
                data?.message ||
                `Request failed with status ${response.status}.`
            );
        }

        return data;

    } catch (error) {
        console.error(
            "API request error:",
            endpoint,
            error
        );

        throw error;
    }
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

async function apiGet(endpoint) {
    return apiRequest(endpoint, {
        method: "GET"
    });
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

async function apiPost(endpoint, data = {}) {
    return apiRequest(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}

/*
|--------------------------------------------------------------------------
| PUT
|--------------------------------------------------------------------------
*/

async function apiPut(endpoint, data = {}) {
    return apiRequest(endpoint, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
*/

async function apiPatch(endpoint, data = {}) {
    return apiRequest(endpoint, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

async function apiDelete(endpoint) {
    return apiRequest(endpoint, {
        method: "DELETE"
    });
}

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
|
| IMPORTANT:
| The working authentication endpoint is:
|
| /api/auth/me
|
|--------------------------------------------------------------------------
*/

async function getCurrentUserFromAPI() {
    return apiRequest("/auth/me", {
        method: "GET"
    });
}

/*
|--------------------------------------------------------------------------
| API HEALTH CHECK
|--------------------------------------------------------------------------
*/

async function checkApiHealth() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/health`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            }
        );

        if (!response.ok) {
            return false;
        }

        const contentType =
            response.headers.get("content-type") || "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {
            return false;
        }

        const data =
            await response.json();

        return data.success !== false;

    } catch (error) {
        console.error(
            "API health check failed:",
            error
        );

        return false;
    }
}

/*
|--------------------------------------------------------------------------
| EXPOSE FUNCTIONS GLOBALLY
|--------------------------------------------------------------------------
*/

window.apiRequest = apiRequest;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiPatch = apiPatch;
window.apiDelete = apiDelete;
window.getCurrentUserFromAPI =
    getCurrentUserFromAPI;
window.checkApiHealth =
    checkApiHealth;
window.getApiToken =
    getApiToken;
window.clearApiAuthentication =
    clearApiAuthentication;
```
