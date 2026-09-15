"use strict";

(function () {
const TOKEN_KEY = "school_management_token";
const USER_KEY = "school_management_user";

```
function getStoredParent() {
    try {
        const rawUser = localStorage.getItem(USER_KEY);

        if (!rawUser) {
            return null;
        }

        return JSON.parse(rawUser);
    } catch (error) {
        console.error("Unable to read stored parent:", error);
        return null;
    }
}

function getParentDisplayName(parent) {
    if (!parent) {
        return "Parent";
    }

    const firstName = parent.firstName || parent.first_name || "";
    const middleName = parent.middleName || parent.middle_name || "";
    const lastName = parent.lastName || parent.last_name || "";

    const fullName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    if (fullName) {
        return fullName;
    }

    return (
        parent.name ||
        parent.fullName ||
        parent.full_name ||
        parent.email ||
        "Parent"
    );
}

function getParentEmail(parent) {
    if (!parent) {
        return "Not available";
    }

    return (
        parent.email ||
        parent.emailAddress ||
        parent.email_address ||
        "Not available"
    );
}

function getParentPhone(parent) {
    if (!parent) {
        return "Not available";
    }

    return (
        parent.phone ||
        parent.phoneNumber ||
        parent.phone_number ||
        "Not available"
    );
}

function updateElement(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function updateParentInformation(parent) {
    const displayName = getParentDisplayName(parent);
    const email = getParentEmail(parent);
    const phone = getParentPhone(parent);

    updateElement(
        "parentWelcome",
        "Welcome, " + displayName
    );

    updateElement(
        "parentName",
        displayName
    );

    updateElement(
        "parentEmail",
        email
    );

    updateElement(
        "parentPhone",
        phone
    );
}

function hasAuthenticationToken() {
    const token = localStorage.getItem(TOKEN_KEY);

    return Boolean(token);
}

function redirectToLogin() {
    window.location.href = "/pages/login.html";
}

function checkAuthentication() {
    if (!hasAuthenticationToken()) {
        redirectToLogin();
        return false;
    }

    return true;
}

function logoutParent() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    window.location.href = "/pages/login.html";
}

function setupLogoutButton() {
    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", function () {
        if (typeof window.logout === "function") {
            try {
                window.logout();
                return;
            } catch (error) {
                console.error("Existing logout function failed:", error);
            }
        }

        logoutParent();
    });
}

function initializeParentDashboard() {
    if (!checkAuthentication()) {
        return;
    }

    const parent = getStoredParent();

    updateParentInformation(parent);
    setupLogoutButton();
}

window.ParentDashboard = {
    initialize: initializeParentDashboard,
    getStoredParent: getStoredParent,
    getParentDisplayName: getParentDisplayName,
    updateParentInformation: updateParentInformation,
    logout: logoutParent
};

document.addEventListener("DOMContentLoaded", function () {
    initializeParentDashboard();
});
```

})();
