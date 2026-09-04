/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| API.JS
|--------------------------------------------------------------------------
| Central frontend API communication layer.
|
| IMPORTANT:
| Authentication is shared with auth.js.
|
| Official authentication keys:
| - school_management_token
| - school_management_user
|
| api.js does NOT maintain a separate token system.
|--------------------------------------------------------------------------
*/

(function () {
    "use strict";


    /* ============================================================
       CONFIGURATION
       ============================================================ */

    const API_BASE_URL = "/api";

    const TOKEN_KEY =
        "school_management_token";

    const USER_KEY =
        "school_management_user";


    /* ============================================================
       TOKEN
       ============================================================ */

    /*
     * There is ONE official token.
     *
     * auth.js stores:
     *
     * school_management_token
     *
     * api.js reads the exact same key.
     */

    function getApiToken() {

        return (
            localStorage.getItem(TOKEN_KEY) ||
            sessionStorage.getItem(TOKEN_KEY) ||
            ""
        );
    }


    /* ============================================================
       CLEAR AUTHENTICATION
       ============================================================ */

    /*
     * Authentication is normally cleared through auth.js.
     *
     * The fallback below keeps api.js safe if auth.js is not
     * available for some reason.
     */

    function clearApiAuthentication() {

        if (
            window.Auth &&
            typeof window.Auth.clearAuthentication ===
            "function"
        ) {

            window.Auth.clearAuthentication();

            return;
        }


        localStorage.removeItem(
            TOKEN_KEY
        );

        localStorage.removeItem(
            USER_KEY
        );

        sessionStorage.removeItem(
            TOKEN_KEY
        );

        sessionStorage.removeItem(
            USER_KEY
        );
    }


    /* ============================================================
       LOGIN PAGE CHECK
       ============================================================ */

    function isLoginPage() {

        return window.location.pathname
            .toLowerCase()
            .endsWith("/login.html");
    }


    /* ============================================================
       API REQUEST
       ============================================================ */

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const token =
            getApiToken();


        /*
         * Build API URL.
         */

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
                    "/" + url;
            }


            if (
                !url.startsWith(
                    API_BASE_URL + "/"
                )
            ) {

                url =
                    API_BASE_URL + url;
            }
        }


        /*
         * Build request options.
         */

        const requestOptions = {
            ...options,

            headers: {
                ...(options.headers || {})
            },

            credentials: "include"
        };


        /* ========================================================
           AUTHORIZATION
           ======================================================== */

        /*
         * Use the SAME token as auth.js.
         */

        if (token) {

            requestOptions.headers.Authorization =
                `Bearer ${token}`;
        }


        /* ========================================================
           CONTENT TYPE
           ======================================================== */

        if (
            requestOptions.body &&
            !(requestOptions.body instanceof FormData) &&
            !requestOptions.headers["Content-Type"] &&
            !requestOptions.headers["content-type"]
        ) {

            requestOptions.headers["Content-Type"] =
                "application/json";
        }


        /* ========================================================
           ACCEPT
           ======================================================== */

        if (
            !requestOptions.headers.Accept &&
            !requestOptions.headers.accept
        ) {

            requestOptions.headers.Accept =
                "application/json";
        }


        /* ========================================================
           REQUEST
           ======================================================== */

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

            throw new Error(
                "Unable to connect to the server. Please check your connection."
            );
        }


        /* ========================================================
           AUTHENTICATION ERROR
           ======================================================== */

        if (
            response.status === 401
        ) {

            console.warn(
                "Authentication rejected by server:",
                url
            );


            /*
             * Clear the SAME authentication used by auth.js.
             */

            clearApiAuthentication();


            /*
             * Redirect only when we are not already
             * on the login page.
             */

            if (!isLoginPage()) {

                window.location.replace(
                    "/pages/login.html"
                );
            }


            throw new Error(
                "Authentication required."
            );
        }


        /* ========================================================
           PERMISSION ERROR
           ======================================================== */

        if (
            response.status === 403
        ) {

            throw new Error(
                "You do not have permission to perform this action."
            );
        }


        /* ========================================================
           RESPONSE PARSING
           ======================================================== */

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

            try {

                data =
                    await response.json();

            } catch (error) {

                console.error(
                    "Unable to parse JSON response:",
                    error
                );

                throw new Error(
                    "The server returned invalid JSON."
                );
            }

        } else {

            data =
                await response.text();
        }


        /* ========================================================
           HTTP ERRORS
           ======================================================== */

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
                    data;
            }


            throw new Error(
                message
            );
        }


        return data;
    }


    /* ============================================================
       GET
       ============================================================ */

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


    /* ============================================================
       POST
       ============================================================ */

    async function apiPost(
        endpoint,
        body,
        options = {}
    ) {

        const requestBody =
            body instanceof FormData
                ? body
                : body !== undefined
                    ? JSON.stringify(body)
                    : undefined;


        return apiRequest(
            endpoint,
            {
                ...options,

                method: "POST",

                body:
                    requestBody
            }
        );
    }


    /* ============================================================
       PUT
       ============================================================ */

    async function apiPut(
        endpoint,
        body,
        options = {}
    ) {

        const requestBody =
            body instanceof FormData
                ? body
                : body !== undefined
                    ? JSON.stringify(body)
                    : undefined;


        return apiRequest(
            endpoint,
            {
                ...options,

                method: "PUT",

                body:
                    requestBody
            }
        );
    }


    /* ============================================================
       PATCH
       ============================================================ */

    async function apiPatch(
        endpoint,
        body,
        options = {}
    ) {

        const requestBody =
            body instanceof FormData
                ? body
                : body !== undefined
                    ? JSON.stringify(body)
                    : undefined;


        return apiRequest(
            endpoint,
            {
                ...options,

                method: "PATCH",

                body:
                    requestBody
            }
        );
    }


    /* ============================================================
       DELETE
       ============================================================ */

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


    /* ============================================================
       CURRENT USER
       ============================================================ */

    async function getCurrentUserFromAPI() {

        return apiGet(
            "/auth/me"
        );
    }


    /* ============================================================
       API HEALTH
       ============================================================ */

    async function checkApiHealth() {

        try {

            const response =
                await fetch(
                    "/api/health"
                );


            if (!response.ok) {
                return false;
            }


            const data =
                await response.json();


            return (
                data &&
                (
                    data.success === true ||
                    data.status === "ok" ||
                    data.status === "healthy"
                )
            );

        } catch (error) {

            console.error(
                "API health check failed:",
                error
            );

            return false;
        }
    }


    /* ============================================================
       GLOBAL EXPORTS
       ============================================================ */

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

    window.clearApiAuthentication =
        clearApiAuthentication;

})();