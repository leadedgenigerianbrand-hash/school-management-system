"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| FRONTEND AUTHENTICATION
|--------------------------------------------------------------------------
|
| IMPORTANT:
| The backend is the source of truth.
|
| Backend authentication routes:
|
| POST /api/auth/login
| GET  /api/auth/me
| POST /api/auth/logout
|
| This file is written to work with those routes exactly.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| FRONTEND PAGES
|--------------------------------------------------------------------------
*/

const LOGIN_PAGE =
    "/pages/login.html";

const DEFAULT_PAGE =
    "/pages/dashboard.html";

const ACCESS_DENIED_PAGE =
    "/pages/access-denied.html";


/*
|--------------------------------------------------------------------------
| BACKEND API ROUTES
|--------------------------------------------------------------------------
*/

const LOGIN_API =
    "/api/auth/login";

const AUTH_ME_API =
    "/api/auth/me";

const LOGOUT_API =
    "/api/auth/logout";


/*
|--------------------------------------------------------------------------
| STORAGE KEYS
|--------------------------------------------------------------------------
*/

const TOKEN_KEY =
    "token";

const USER_KEY =
    "currentUser";

const REMEMBER_ME_KEY =
    "rememberMe";

const LOGIN_IDENTIFIER_KEY =
    "loginIdentifier";


/*
|--------------------------------------------------------------------------
| INITIALIZE AUTHENTICATION
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAuthentication();

    }
);


/*
|--------------------------------------------------------------------------
| INITIALIZE AUTHENTICATION
|--------------------------------------------------------------------------
*/

async function initializeAuthentication() {

    /*
    |----------------------------------------------------------------------
    | LOGIN PAGE
    |----------------------------------------------------------------------
    */

    if (isLoginPage()) {

        initializeLoginForm();

        return;

    }


    /*
    |----------------------------------------------------------------------
    | PUBLIC PAGE
    |----------------------------------------------------------------------
    */

    if (isPublicPage()) {

        return;

    }


    /*
    |----------------------------------------------------------------------
    | PROTECTED PAGE
    |----------------------------------------------------------------------
    */

    await protectPage();

}


/*
|--------------------------------------------------------------------------
| CHECK LOGIN PAGE
|--------------------------------------------------------------------------
*/

function isLoginPage() {

    const path =
        window.location.pathname
            .toLowerCase()
            .replace(/\/+$/, "");


    return (
        path === "/pages/login.html" ||
        path.endsWith("/pages/login.html")
    );

}


/*
|--------------------------------------------------------------------------
| CHECK PUBLIC PAGE
|--------------------------------------------------------------------------
*/

function isPublicPage() {

    const path =
        window.location.pathname
            .toLowerCase()
            .replace(/\/+$/, "");


    const publicPages = [

        "/pages/login.html",

        "/pages/forgot-password.html",

        "/forgot-password.html",

        "/index-public.html"

    ];


    return publicPages.some(
        function (page) {

            return (
                path === page ||
                path.endsWith(page)
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| INITIALIZE LOGIN FORM
|--------------------------------------------------------------------------
*/

function initializeLoginForm() {

    const form =
        document.getElementById(
            "loginForm"
        );


    if (!form) {

        console.error(
            "Authentication: #loginForm was not found."
        );

        return;

    }


    /*
    |----------------------------------------------------------------------
    | Prevent duplicate initialization
    |----------------------------------------------------------------------
    */

    if (
        form.dataset.authInitialized ===
        "true"
    ) {

        return;

    }


    form.dataset.authInitialized =
        "true";


    /*
    |----------------------------------------------------------------------
    | PASSWORD TOGGLE
    |----------------------------------------------------------------------
    */

    const togglePassword =
        document.getElementById(
            "togglePassword"
        );


    const passwordInput =
        document.getElementById(
            "password"
        );


    const passwordIcon =
        document.getElementById(
            "passwordIcon"
        );


    if (
        togglePassword &&
        passwordInput
    ) {

        togglePassword.addEventListener(
            "click",
            function () {

                const isPassword =
                    passwordInput.type ===
                    "password";


                passwordInput.type =
                    isPassword
                        ? "text"
                        : "password";


                if (passwordIcon) {

                    passwordIcon.className =
                        isPassword
                            ? "bi bi-eye-slash"
                            : "bi bi-eye";

                }


                togglePassword.setAttribute(
                    "aria-label",
                    isPassword
                        ? "Hide password"
                        : "Show password"
                );

            }
        );

    }


    /*
    |----------------------------------------------------------------------
    | LOGIN SUBMIT
    |----------------------------------------------------------------------
    */

    form.addEventListener(
        "submit",
        handleLoginSubmit
    );


    /*
    |----------------------------------------------------------------------
    | REMEMBERED USERNAME
    |----------------------------------------------------------------------
    */

    loadRememberedIdentifier();


    /*
    |----------------------------------------------------------------------
    | FORGOT PASSWORD
    |----------------------------------------------------------------------
    */

    const forgotPassword =
        document.getElementById(
            "forgotPassword"
        );


    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                showLoginMessage(
                    "Please contact your school administrator to reset your password.",
                    "info"
                );

            }
        );

    }

}


/*
|--------------------------------------------------------------------------
| HANDLE LOGIN
|--------------------------------------------------------------------------
*/

async function handleLoginSubmit(event) {

    event.preventDefault();


    const identifierInput =
        document.getElementById(
            "identifier"
        );


    const passwordInput =
        document.getElementById(
            "password"
        );


    const rememberMe =
        document.getElementById(
            "rememberMe"
        );


    const identifier =
        identifierInput
            ? identifierInput.value.trim()
            : "";


    const password =
        passwordInput
            ? passwordInput.value
            : "";


    clearLoginMessage();


    /*
    |----------------------------------------------------------------------
    | VALIDATE USERNAME / EMAIL
    |----------------------------------------------------------------------
    */

    if (!identifier) {

        showLoginMessage(
            "Please enter your username or email.",
            "danger"
        );


        if (identifierInput) {

            identifierInput.focus();

        }


        return;

    }


    /*
    |----------------------------------------------------------------------
    | VALIDATE PASSWORD
    |----------------------------------------------------------------------
    */

    if (!password) {

        showLoginMessage(
            "Please enter your password.",
            "danger"
        );


        if (passwordInput) {

            passwordInput.focus();

        }


        return;

    }


    setLoginLoading(true);


    try {

        console.log(
            "Authentication: sending login request to",
            LOGIN_API
        );


        /*
        |------------------------------------------------------------------
        | SEND LOGIN REQUEST
        |------------------------------------------------------------------
        |
        | Backend expects:
        |
        | {
        |     identifier,
        |     password
        | }
        |
        */

        const response =
            await fetch(
                LOGIN_API,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            identifier:
                                identifier,

                            password:
                                password

                        })

                }
            );


        /*
        |------------------------------------------------------------------
        | READ RESPONSE
        |------------------------------------------------------------------
        */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType
                .toLowerCase()
                .includes(
                    "application/json"
                )
        ) {

            const text =
                await response.text();


            console.error(
                "Login endpoint returned non-JSON:",
                text
            );


            throw new Error(
                "The server returned an unexpected response."
            );

        }


        const data =
            await response.json();


        console.log(
            "Authentication login response:",
            data
        );


        /*
        |------------------------------------------------------------------
        | CHECK BACKEND RESULT
        |------------------------------------------------------------------
        */

        if (
            !response.ok ||
            data.success !== true
        ) {

            throw new Error(
                data.message ||
                "Invalid username/email or password."
            );

        }


        /*
        |------------------------------------------------------------------
        | BACKEND RETURNS:
        |
        | {
        |     success: true,
        |     token: "...",
        |     user: {...}
        | }
        |
        |------------------------------------------------------------------
        */

        const token =
            data.token;


        if (!token) {

            console.error(
                "Login succeeded but backend did not return a token.",
                data
            );


            throw new Error(
                "Login succeeded, but the authentication token was not received."
            );

        }


        /*
        |------------------------------------------------------------------
        | SAVE TOKEN
        |------------------------------------------------------------------
        */

        saveToken(
            token,
            rememberMe
                ? rememberMe.checked
                : false
        );


        /*
        |------------------------------------------------------------------
        | SAVE USER
        |------------------------------------------------------------------
        */

        if (data.user) {

            localStorage.setItem(
                USER_KEY,
                JSON.stringify(
                    data.user
                )
            );

        }


        /*
        |------------------------------------------------------------------
        | REMEMBER ME
        |------------------------------------------------------------------
        */

        if (
            rememberMe &&
            rememberMe.checked
        ) {

            localStorage.setItem(
                REMEMBER_ME_KEY,
                "true"
            );


            localStorage.setItem(
                LOGIN_IDENTIFIER_KEY,
                identifier
            );

        } else {

            localStorage.removeItem(
                REMEMBER_ME_KEY
            );


            localStorage.removeItem(
                LOGIN_IDENTIFIER_KEY
            );

        }


        /*
        |------------------------------------------------------------------
        | VERIFY TOKEN WITH BACKEND
        |------------------------------------------------------------------
        |
        | We do not assume login is complete simply because we received
        | a token.
        |
        | We ask the backend:
        |
        | GET /api/auth/me
        |
        |------------------------------------------------------------------
        */

        console.log(
            "Authentication: verifying token with backend..."
        );


        const verifiedUser =
            await getCurrentUser();


        if (!verifiedUser) {

            clearAuthentication();


            throw new Error(
                "Login succeeded, but authentication could not be verified."
            );

        }


        /*
        |------------------------------------------------------------------
        | SAVE VERIFIED USER
        |------------------------------------------------------------------
        */

        localStorage.setItem(
            USER_KEY,
            JSON.stringify(
                verifiedUser
            )
        );


        /*
        |------------------------------------------------------------------
        | LOGIN SUCCESS
        |------------------------------------------------------------------
        */

        showLoginMessage(
            "Login successful. Redirecting...",
            "success"
        );


        const redirect =
            getLoginRedirect();


        console.log(
            "Authentication successful. Redirecting to:",
            redirect
        );


        /*
        |------------------------------------------------------------------
        | REDIRECT
        |------------------------------------------------------------------
        */

        setTimeout(
            function () {

                window.location.replace(
                    redirect
                );

            },
            500
        );


    } catch (error) {

        console.error(
            "Authentication login error:",
            error
        );


        showLoginMessage(
            error.message ||
            "Unable to connect to the server.",
            "danger"
        );


    } finally {

        setLoginLoading(false);

    }

}


/*
|--------------------------------------------------------------------------
| SAVE TOKEN
|--------------------------------------------------------------------------
*/

function saveToken(
    token,
    rememberMe
) {

    if (!token) {

        return;

    }


    /*
    |----------------------------------------------------------------------
    | REMEMBER ME = LOCAL STORAGE
    |----------------------------------------------------------------------
    */

    if (rememberMe) {

        localStorage.setItem(
            TOKEN_KEY,
            token
        );


        sessionStorage.removeItem(
            TOKEN_KEY
        );

        return;

    }


    /*
    |----------------------------------------------------------------------
    | REMEMBER ME OFF = SESSION STORAGE
    |----------------------------------------------------------------------
    */

    sessionStorage.setItem(
        TOKEN_KEY,
        token
    );


    localStorage.removeItem(
        TOKEN_KEY
    );

}


/*
|--------------------------------------------------------------------------
| GET TOKEN
|--------------------------------------------------------------------------
*/

function getToken() {

    return (

        localStorage.getItem(
            TOKEN_KEY
        ) ||

        sessionStorage.getItem(
            TOKEN_KEY
        ) ||

        null

    );

}


/*
|--------------------------------------------------------------------------
| GET CURRENT USER FROM BACKEND
|--------------------------------------------------------------------------
*/

async function getCurrentUser() {

    const token =
        getToken();


    if (!token) {

        return null;

    }


    try {

        const response =
            await fetch(
                AUTH_ME_API,
                {
                    method: "GET",

                    headers: {

                        "Accept":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    cache:
                        "no-store"

                }
            );


        /*
        |------------------------------------------------------------------
        | BACKEND REJECTED TOKEN
        |------------------------------------------------------------------
        */

        if (
            response.status === 401
        ) {

            console.error(
                "Authentication token rejected by backend."
            );


            return null;

        }


        /*
        |------------------------------------------------------------------
        | FORBIDDEN
        |------------------------------------------------------------------
        */

        if (
            response.status === 403
        ) {

            console.error(
                "Authentication request forbidden."
            );


            return null;

        }


        /*
        |------------------------------------------------------------------
        | RESPONSE MUST BE JSON
        |------------------------------------------------------------------
        */

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            !contentType
                .toLowerCase()
                .includes(
                    "application/json"
                )
        ) {

            const text =
                await response.text();


            console.error(
                "Authentication /me returned non-JSON:",
                text
            );


            return null;

        }


        const data =
            await response.json();


        console.log(
            "Authentication /me response:",
            data
        );


        /*
        |------------------------------------------------------------------
        | BACKEND SUCCESS FORMAT
        |------------------------------------------------------------------
        |
        | {
        |     success: true,
        |     user: {...}
        | }
        |
        |------------------------------------------------------------------
        */

        if (
            !response.ok ||
            data.success !== true
        ) {

            return null;

        }


        return (
            data.user ||
            null
        );


    } catch (error) {

        console.error(
            "Unable to verify authentication:",
            error
        );


        return null;

    }

}


/*
|--------------------------------------------------------------------------
| PROTECT PAGE
|--------------------------------------------------------------------------
*/

async function protectPage() {

    if (isPublicPage()) {

        return;

    }


    const token =
        getToken();


    /*
    |----------------------------------------------------------------------
    | NO TOKEN
    |----------------------------------------------------------------------
    */

    if (!token) {

        console.log(
            "Authentication: no token found."
        );


        redirectToLogin();

        return;

    }


    try {

        /*
        |------------------------------------------------------------------
        | ASK BACKEND TO VERIFY TOKEN
        |------------------------------------------------------------------
        */

        const user =
            await getCurrentUser();


        if (!user) {

            console.log(
                "Authentication: backend rejected current token."
            );


            clearAuthentication();

            redirectToLogin();

            return;

        }


        /*
        |------------------------------------------------------------------
        | SAVE VERIFIED USER
        |------------------------------------------------------------------
        */

        localStorage.setItem(
            USER_KEY,
            JSON.stringify(
                user
            )
        );


        /*
        |------------------------------------------------------------------
        | POPULATE PAGE
        |------------------------------------------------------------------
        */

        populateAuthenticatedUser(
            user
        );


        /*
        |------------------------------------------------------------------
        | ROLE CONTROL
        |------------------------------------------------------------------
        */

        applyRolePermissions(
            user
        );


        /*
        |------------------------------------------------------------------
        | LOGOUT BUTTONS
        |------------------------------------------------------------------
        */

        initializeLogoutButtons();


        console.log(
            "Authentication verified successfully."
        );


    } catch (error) {

        console.error(
            "Authentication protection error:",
            error
        );


        clearAuthentication();

        redirectToLogin();

    }

}


/*
|--------------------------------------------------------------------------
| IS AUTHENTICATED
|--------------------------------------------------------------------------
*/

function isAuthenticated() {

    return Boolean(
        getToken()
    );

}


/*
|--------------------------------------------------------------------------
| GET STORED USER
|--------------------------------------------------------------------------
*/

function getStoredUser() {

    try {

        const stored =
            localStorage.getItem(
                USER_KEY
            );


        if (!stored) {

            return null;

        }


        return JSON.parse(
            stored
        );


    } catch (error) {

        console.error(
            "Unable to read stored user:",
            error
        );


        return null;

    }

}


/*
|--------------------------------------------------------------------------
| CLEAR AUTHENTICATION
|--------------------------------------------------------------------------
*/

function clearAuthentication() {

    localStorage.removeItem(
        TOKEN_KEY
    );


    sessionStorage.removeItem(
        TOKEN_KEY
    );


    localStorage.removeItem(
        USER_KEY
    );


    sessionStorage.removeItem(
        USER_KEY
    );

}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

async function handleLogout(event) {

    if (event) {

        event.preventDefault();

        event.stopPropagation();

    }


    console.log(
        "Authentication: logging out..."
    );


    const token =
        getToken();


    try {

        /*
        |------------------------------------------------------------------
        | BACKEND LOGOUT
        |------------------------------------------------------------------
        */

        if (token) {

            const response =
                await fetch(
                    LOGOUT_API,
                    {
                        method: "POST",

                        headers: {

                            "Accept":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`

                        }

                    }
                );


            console.log(
                "Backend logout response:",
                response.status
            );

        }


    } catch (error) {

        /*
        |------------------------------------------------------------------
        | Even if the request fails, local authentication is removed.
        |------------------------------------------------------------------
        */

        console.warn(
            "Backend logout request failed. Continuing with local logout.",
            error
        );

    }


    clearAuthentication();


    /*
    |----------------------------------------------------------------------
    | RETURN TO LOGIN
    |----------------------------------------------------------------------
    */

    window.location.replace(
        LOGIN_PAGE
    );

}


/*
|--------------------------------------------------------------------------
| INITIALIZE LOGOUT BUTTONS
|--------------------------------------------------------------------------
*/

function initializeLogoutButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-logout], " +
            "#logoutButton, " +
            "#logoutBtn, " +
            ".logout-button, " +
            ".logout-link"
        );


    buttons.forEach(
        function (button) {

            if (
                button.dataset.logoutInitialized ===
                "true"
            ) {

                return;

            }


            button.dataset.logoutInitialized =
                "true";


            button.addEventListener(
                "click",
                handleLogout
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| REDIRECT TO LOGIN
|--------------------------------------------------------------------------
*/

function redirectToLogin() {

    if (isLoginPage()) {

        return;

    }


    const currentPath =
        window.location.pathname +
        window.location.search;


    const loginUrl =
        `${LOGIN_PAGE}?redirect=${encodeURIComponent(
            currentPath
        )}`;


    console.log(
        "Authentication: redirecting to login:",
        loginUrl
    );


    window.location.replace(
        loginUrl
    );

}


/*
|--------------------------------------------------------------------------
| LOGIN REDIRECT
|--------------------------------------------------------------------------
*/

function getLoginRedirect() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const redirect =
        params.get(
            "redirect"
        );


    /*
    |----------------------------------------------------------------------
    | Only allow internal redirects
    |----------------------------------------------------------------------
    */

    if (
        redirect &&
        redirect.startsWith("/") &&
        !redirect.startsWith("//")
    ) {

        if (
            redirect
                .toLowerCase()
                .includes(
                    "login.html"
                )
        ) {

            return DEFAULT_PAGE;

        }


        return redirect;

    }


    return DEFAULT_PAGE;

}


/*
|--------------------------------------------------------------------------
| POPULATE AUTHENTICATED USER
|--------------------------------------------------------------------------
*/

function populateAuthenticatedUser(
    user
) {

    if (!user) {

        return;

    }


    /*
    |----------------------------------------------------------------------
    | USER NAME
    |----------------------------------------------------------------------
    */

    const fullName = [

        user.firstName,

        user.middleName,

        user.lastName

    ]
        .filter(Boolean)
        .join(" ");


    const displayName =
        fullName ||
        user.username ||
        user.email ||
        "User";


    /*
    |----------------------------------------------------------------------
    | DISPLAY NAME
    |----------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "[data-user-name]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    displayName;

            }
        );


    /*
    |----------------------------------------------------------------------
    | USERNAME
    |----------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "[data-user-username]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    user.username ||
                    "";

            }
        );


    /*
    |----------------------------------------------------------------------
    | EMAIL
    |----------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "[data-user-email]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    user.email ||
                    "";

            }
        );


    /*
    |----------------------------------------------------------------------
    | ROLE
    |----------------------------------------------------------------------
    */

    const role =
        user.roleName ||
        user.role ||
        "";


    document
        .querySelectorAll(
            "[data-user-role]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    role;

            }
        );


    /*
    |----------------------------------------------------------------------
    | SCHOOL NAME
    |----------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "[data-school-name]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    user.schoolName ||
                    "";

            }
        );


    /*
    |----------------------------------------------------------------------
    | SCHOOL CODE
    |----------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "[data-school-code]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    user.schoolCode ||
                    "";

            }
        );


    /*
    |----------------------------------------------------------------------
    | PROFILE PHOTO
    |----------------------------------------------------------------------
    */

    if (
        user.profilePhotoUrl
    ) {

        document
            .querySelectorAll(
                "[data-user-photo]"
            )
            .forEach(
                function (element) {

                    element.src =
                        user.profilePhotoUrl;

                }
            );

    }


    /*
    |----------------------------------------------------------------------
    | AVATAR
    |----------------------------------------------------------------------
    */

    const avatar =
        document.getElementById(
            "userAvatar"
        );


    if (avatar) {

        avatar.textContent =
            getUserInitials();

    }

}


/*
|--------------------------------------------------------------------------
| APPLY ROLE PERMISSIONS
|--------------------------------------------------------------------------
*/

function applyRolePermissions(
    user
) {

    if (!user) {

        return;

    }


    const role =
        String(
            user.roleName ||
            user.role ||
            ""
        )
            .trim()
            .toLowerCase();


    /*
    |----------------------------------------------------------------------
    | data-role
    |----------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "[data-role]"
        )
        .forEach(
            function (element) {

                const allowedRoles =
                    element.dataset.role
                        .split(",")
                        .map(
                            function (item) {

                                return item
                                    .trim()
                                    .toLowerCase();

                            }
                        );


                element.hidden =
                    !allowedRoles.includes(
                        role
                    );

            }
        );


    /*
    |----------------------------------------------------------------------
    | data-roles
    |----------------------------------------------------------------------
    */

    document
        .querySelectorAll(
            "[data-roles]"
        )
        .forEach(
            function (element) {

                const allowedRoles =
                    element.dataset.roles
                        .split(",")
                        .map(
                            function (item) {

                                return item
                                    .trim()
                                    .toLowerCase();

                            }
                        );


                element.hidden =
                    !allowedRoles.includes(
                        role
                    );

            }
        );

}


/*
|--------------------------------------------------------------------------
| REQUIRE ROLE
|--------------------------------------------------------------------------
*/

function requireRole(
    ...allowedRoles
) {

    const user =
        getStoredUser();


    if (!user) {

        redirectToLogin();

        return false;

    }


    const currentRole =
        String(
            user.roleName ||
            user.role ||
            ""
        )
            .trim()
            .toLowerCase();


    const allowed =
        allowedRoles.some(
            function (role) {

                return (
                    String(role)
                        .trim()
                        .toLowerCase() ===
                    currentRole
                );

            }
        );


    if (!allowed) {

        showAccessDenied();

        return false;

    }


    return true;

}


/*
|--------------------------------------------------------------------------
| ACCESS DENIED
|--------------------------------------------------------------------------
*/

function showAccessDenied() {

    if (
        window.location.pathname
            .toLowerCase()
            .includes(
                "access-denied"
            )
    ) {

        return;

    }


    window.location.replace(
        ACCESS_DENIED_PAGE
    );

}


/*
|--------------------------------------------------------------------------
| USER DISPLAY NAME
|--------------------------------------------------------------------------
*/

function getUserDisplayName() {

    const user =
        getStoredUser();


    if (!user) {

        return "User";

    }


    return (

        [

            user.firstName,

            user.middleName,

            user.lastName

        ]
            .filter(Boolean)
            .join(" ") ||

        user.username ||

        user.email ||

        "User"

    );

}


/*
|--------------------------------------------------------------------------
| USER INITIALS
|--------------------------------------------------------------------------
*/

function getUserInitials() {

    const user =
        getStoredUser();


    if (!user) {

        return "U";

    }


    const first =
        (
            user.firstName ||
            ""
        )
            .charAt(0)
            .toUpperCase();


    const last =
        (
            user.lastName ||
            ""
        )
            .charAt(0)
            .toUpperCase();


    if (
        first ||
        last
    ) {

        return `${first}${last}`;

    }


    return (

        user.username ||
        user.email ||
        "U"

    )
        .charAt(0)
        .toUpperCase();

}


/*
|--------------------------------------------------------------------------
| LOAD REMEMBERED IDENTIFIER
|--------------------------------------------------------------------------
*/

function loadRememberedIdentifier() {

    const identifierInput =
        document.getElementById(
            "identifier"
        );


    const rememberMe =
        document.getElementById(
            "rememberMe"
        );


    if (!identifierInput) {

        return;

    }


    const savedIdentifier =
        localStorage.getItem(
            LOGIN_IDENTIFIER_KEY
        );


    const remembered =
        localStorage.getItem(
            REMEMBER_ME_KEY
        );


    if (savedIdentifier) {

        identifierInput.value =
            savedIdentifier;

    }


    if (
        rememberMe &&
        remembered === "true"
    ) {

        rememberMe.checked =
            true;

    }

}


/*
|--------------------------------------------------------------------------
| LOGIN MESSAGE
|--------------------------------------------------------------------------
*/

function showLoginMessage(
    message,
    type = "danger"
) {

    const element =
        document.getElementById(
            "loginMessage"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message || "";


    element.className =
        `alert alert-${type}`;


    element.classList.remove(
        "d-none"
    );

}


/*
|--------------------------------------------------------------------------
| CLEAR LOGIN MESSAGE
|--------------------------------------------------------------------------
*/

function clearLoginMessage() {

    const element =
        document.getElementById(
            "loginMessage"
        );


    if (!element) {

        return;

    }


    element.textContent =
        "";


    element.className =
        "alert d-none";

}


/*
|--------------------------------------------------------------------------
| LOGIN LOADING
|--------------------------------------------------------------------------
*/

function setLoginLoading(
    loading
) {

    const button =
        document.getElementById(
            "loginButton"
        );


    const text =
        document.getElementById(
            "loginButtonText"
        );


    const spinner =
        document.getElementById(
            "loginSpinner"
        );


    if (!button) {

        return;

    }


    button.disabled =
        loading;


    if (text) {

        text.textContent =
            loading
                ? "Signing in..."
                : "Sign In";

    }


    if (spinner) {

        spinner.classList.toggle(
            "d-none",
            !loading
        );

    }

}


/*
|--------------------------------------------------------------------------
| CROSS-TAB AUTHENTICATION
|--------------------------------------------------------------------------
*/

window.addEventListener(
    "storage",
    function (event) {

        if (
            event.key === TOKEN_KEY &&
            !event.newValue
        ) {

            if (!isLoginPage()) {

                window.location.replace(
                    LOGIN_PAGE
                );

            }

        }

    }
);


/*
|--------------------------------------------------------------------------
| GLOBAL FUNCTIONS
|--------------------------------------------------------------------------
*/

window.initializeAuthentication =
    initializeAuthentication;

window.initializeLoginForm =
    initializeLoginForm;

window.handleLoginSubmit =
    handleLoginSubmit;

window.protectPage =
    protectPage;

window.initializeLogoutButtons =
    initializeLogoutButtons;

window.handleLogout =
    handleLogout;

window.requireRole =
    requireRole;

window.getUserDisplayName =
    getUserDisplayName;

window.getUserInitials =
    getUserInitials;

window.populateAuthenticatedUser =
    populateAuthenticatedUser;

window.applyRolePermissions =
    applyRolePermissions;

window.isAuthenticated =
    isAuthenticated;

window.getToken =
    getToken;

window.getStoredUser =
    getStoredUser;

window.clearAuthentication =
    clearAuthentication;

window.getCurrentUser =
    getCurrentUser;

window.redirectToLogin =
    redirectToLogin;