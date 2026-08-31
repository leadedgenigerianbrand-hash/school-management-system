"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| API JAVASCRIPT
|--------------------------------------------------------------------------
|
| Central API communication layer for the frontend.
|
| IMPORTANT:
| The backend is the source of truth.
| This file follows the existing backend API structure.
|
|--------------------------------------------------------------------------
*/

const API_BASE_URL = "/api";


/*
|--------------------------------------------------------------------------
| AUTHENTICATION STORAGE
|--------------------------------------------------------------------------
*/

const API_TOKEN_KEYS = [
    "token",
    "accessToken"
];

const API_USER_KEY = "currentUser";


/*
|--------------------------------------------------------------------------
| GET STORED TOKEN
|--------------------------------------------------------------------------
*/

function getApiToken() {

    for (const key of API_TOKEN_KEYS) {

        const localToken =
            localStorage.getItem(key);

        if (localToken) {
            return localToken;
        }

        const sessionToken =
            sessionStorage.getItem(key);

        if (sessionToken) {
            return sessionToken;
        }
    }

    return null;
}


/*
|--------------------------------------------------------------------------
| CLEAR AUTHENTICATION
|--------------------------------------------------------------------------
*/

function clearApiAuthentication() {

    API_TOKEN_KEYS.forEach(function (key) {

        localStorage.removeItem(key);

        sessionStorage.removeItem(key);

    });


    localStorage.removeItem(
        API_USER_KEY
    );

    sessionStorage.removeItem(
        API_USER_KEY
    );
}


/*
|--------------------------------------------------------------------------
| BUILD API URL
|--------------------------------------------------------------------------
*/

function buildApiUrl(endpoint) {

    if (!endpoint) {
        return API_BASE_URL;
    }


    if (
        endpoint.startsWith("http://") ||
        endpoint.startsWith("https://")
    ) {

        return endpoint;

    }


    if (
        endpoint.startsWith("/api/")
    ) {

        return endpoint;

    }


    if (
        endpoint.startsWith("/")
    ) {

        return `${API_BASE_URL}${endpoint}`;

    }


    return `${API_BASE_URL}/${endpoint}`;

}


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
        getApiToken();


    const headers = {

        "Accept":
            "application/json"

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
    | AUTHORIZATION
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
    | REQUEST URL
    |--------------------------------------------------------------------------
    */

    const url =
        buildApiUrl(endpoint);


    /*
    |--------------------------------------------------------------------------
    | SEND REQUEST
    |--------------------------------------------------------------------------
    */

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
            "API connection error:",
            error
        );

        throw new Error(
            "Unable to connect to the School Management System server."
        );

    }


    /*
    |--------------------------------------------------------------------------
    | RESPONSE CONTENT TYPE
    |--------------------------------------------------------------------------
    */

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    let data = null;


    /*
    |--------------------------------------------------------------------------
    | JSON RESPONSE
    |--------------------------------------------------------------------------
    */

    if (
        contentType
            .toLowerCase()
            .includes("application/json")
    ) {

        try {

            data =
                await response.json();

        } catch (error) {

            console.error(
                "Unable to read API JSON response:",
                error
            );

            throw new Error(
                "The server returned an invalid JSON response."
            );

        }

    } else {

        const text =
            await response.text();


        console.error(
            "API returned non-JSON response:",
            text
        );


        throw new Error(
            `Server returned an unexpected response (${response.status}).`
        );

    }


    /*
    |--------------------------------------------------------------------------
    | UNAUTHORIZED
    |--------------------------------------------------------------------------
    */

    if (
        response.status === 401
    ) {

        clearApiAuthentication();


        const currentPath =
            window.location.pathname
                .toLowerCase();


        if (
            !currentPath.includes(
                "/login.html"
            )
        ) {

            window.location.replace(
                "/pages/login.html"
            );

        }


        return null;

    }


    /*
    |--------------------------------------------------------------------------
    | FORBIDDEN
    |--------------------------------------------------------------------------
    */

    if (
        response.status === 403
    ) {

        throw new Error(
            data?.message ||
            "You do not have permission to perform this action."
        );

    }


    /*
    |--------------------------------------------------------------------------
    | OTHER API ERRORS
    |--------------------------------------------------------------------------
    */

    if (
        !response.ok
    ) {

        throw new Error(
            data?.message ||
            `Request failed with status ${response.status}.`
        );

    }


    /*
    |--------------------------------------------------------------------------
    | RETURN API DATA
    |--------------------------------------------------------------------------
    */

    return data;

}


/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

async function apiGet(
    endpoint
) {

    return apiRequest(
        endpoint,
        {
            method: "GET"
        }
    );

}


/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

async function apiPost(
    endpoint,
    data = {}
) {

    return apiRequest(
        endpoint,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify(data)
        }
    );

}


/*
|--------------------------------------------------------------------------
| PUT
|--------------------------------------------------------------------------
*/

async function apiPut(
    endpoint,
    data = {}
) {

    return apiRequest(
        endpoint,
        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify(data)
        }
    );

}


/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
*/

async function apiPatch(
    endpoint,
    data = {}
) {

    return apiRequest(
        endpoint,
        {
            method: "PATCH",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify(data)
        }
    );

}


/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

async function apiDelete(
    endpoint
) {

    return apiRequest(
        endpoint,
        {
            method: "DELETE"
        }
    );

}


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
|
| Backend:
|
| POST /api/auth/login
|
| Request:
|
| {
|     identifier,
|     password
| }
|
|--------------------------------------------------------------------------
*/

async function apiLogin(
    identifier,
    password
) {

    return apiPost(
        "/auth/login",
        {
            identifier,
            password
        }
    );

}


/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
|
| Backend:
|
| GET /api/auth/me
|
| Authentication:
|
| Authorization: Bearer <token>
|
|--------------------------------------------------------------------------
*/

async function getCurrentUserFromAPI() {

    return apiGet(
        "/auth/me"
    );

}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
|
| Backend:
|
| POST /api/auth/logout
|
|--------------------------------------------------------------------------
*/

async function apiLogout() {

    return apiPost(
        "/auth/logout"
    );

}


/*
|--------------------------------------------------------------------------
| API HEALTH CHECK
|--------------------------------------------------------------------------
|
| Backend:
|
| GET /api/health
|
|--------------------------------------------------------------------------
*/

async function checkApiHealth() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/health`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {
            return false;
        }


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType
                .toLowerCase()
                .includes("application/json")
        ) {

            return false;

        }


        const data =
            await response.json();


        return (
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


/*
|--------------------------------------------------------------------------
| GLOBAL API FUNCTIONS
|--------------------------------------------------------------------------
*/

window.API_BASE_URL =
    API_BASE_URL;

window.getApiToken =
    getApiToken;

window.clearApiAuthentication =
    clearApiAuthentication;

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

window.apiLogin =
    apiLogin;

window.getCurrentUserFromAPI =
    getCurrentUserFromAPI;

window.apiLogout =
    apiLogout;

window.checkApiHealth =
    checkApiHealth;