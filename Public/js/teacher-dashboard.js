"use strict";

(function () {
const TOKEN_KEY = "school_management_token";
const USER_KEY = "school_management_user";

```
function getStoredUser() {
    try {
        const rawUser = localStorage.getItem(USER_KEY);

        if (!rawUser) {
            return null;
        }

        return JSON.parse(rawUser);
    } catch (error) {
        console.error("Unable to read stored user:", error);
        return null;
    }
}

function getUserDisplayName(user) {
    if (!user) {
        return "Teacher";
    }

    const firstName = user.firstName || user.first_name || "";
    const middleName = user.middleName || user.middle_name || "";
    const lastName = user.lastName || user.last_name || "";

    const fullName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    if (fullName) {
        return fullName;
    }

    return user.name || user.fullName || user.email || "Teacher";
}

function getUserEmail(user) {
    if (!user) {
        return "Not available";
    }

    return user.email || user.emailAddress || "Not available";
}

function getUserRole(user) {
    if (!user) {
        return "Teacher";
    }

    return (
        user.roleName ||
        user.role_name ||
        user.role ||
        "Teacher"
    );
}

function updateElement(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function updateTeacherInformation(user) {
    const displayName = getUserDisplayName(user);
    const email = getUserEmail(user);
    const role = getUserRole(user);

    updateElement("teacherWelcome", "Welcome, " + displayName);
    updateElement("teacherName", displayName);
    updateElement("teacherEmail", email);
    updateElement("teacherRole", role);
}

function isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        return false;
    }

    return true;
}

function redirectToLogin() {
    window.location.href = "/pages/login.html";
}

function checkAuthentication() {
    if (!isAuthenticated()) {
        redirectToLogin();
        return false;
    }

    return true;
}

function performLogout() {
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

        performLogout();
    });
}

function initializeTeacherDashboard() {
    if (!checkAuthentication()) {
        return;
    }

    const user = getStoredUser();

    updateTeacherInformation(user);
    setupLogoutButton();
}

window.TeacherDashboard = {
    initialize: initializeTeacherDashboard,
    getStoredUser: getStoredUser,
    getUserDisplayName: getUserDisplayName,
    updateTeacherInformation: updateTeacherInformation,
    performLogout: performLogout
};

document.addEventListener("DOMContentLoaded", function () {
    initializeTeacherDashboard();
});
```

})();
