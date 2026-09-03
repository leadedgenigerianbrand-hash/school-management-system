document.addEventListener("DOMContentLoaded", initializeDashboard);

async function initializeDashboard() {
    try {
        await loadDashboardData();
        await loadRecentStudents();
        await loadRecentPayments();
        await loadCurrentUser();
        setupDashboardNavigation();
    } catch (error) {
        console.error("Dashboard initialization error:", error);
    }
}

async function loadDashboardData() {
    try {
        const response = await apiRequest("/api/reports/dashboard", {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error("Failed to load dashboard statistics.");
        }

        const data = await response.json();

        if (data.success && data.data) {
            updateDashboardStatistics(data.data);
        }
    } catch (error) {
        console.error("Dashboard statistics error:", error);
    }
}

async function loadRecentStudents() {
    try {
        const response = await apiRequest("/api/students?limit=5", {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error("Failed to load recent students.");
        }

        const data = await response.json();

        if (data.success) {
            renderRecentStudents(data.data || data.students || []);
        }
    } catch (error) {
        console.error("Recent students error:", error);
    }
}

async function loadRecentPayments() {
    try {
        const response = await apiRequest("/api/fees/payments/recent", {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error("Failed to load recent payments.");
        }

        const data = await response.json();

        if (data.success) {
            renderRecentPayments(data.data || data.payments || []);
        }
    } catch (error) {
        console.error("Recent payments error:", error);
    }
}

async function loadCurrentUser() {
    try {
        if (typeof getCurrentUserFromAPI !== "function") {
            return;
        }

        const user = await getCurrentUserFromAPI();

        if (!user) {
            return;
        }

        const userName =
            user.firstName ||
            user.first_name ||
            user.name ||
            user.username ||
            "Administrator";

        const userRole =
            user.roleName ||
            user.role_name ||
            user.role ||
            "Administrator";

        const nameElements = document.querySelectorAll(
            "[data-user-name], #userName, #profileName, .user-name"
        );

        nameElements.forEach(function (element) {
            element.textContent = userName;
        });

        const roleElements = document.querySelectorAll(
            "[data-user-role], #userRole, #profileRole, .user-role"
        );

        roleElements.forEach(function (element) {
            element.textContent = userRole;
        });
    } catch (error) {
        console.error("Current user error:", error);
    }
}

function updateDashboardStatistics(stats) {
    const mappings = {
        totalStudents: [
            "totalStudents",
            "studentCount",
            "studentsCount",
            "total_students"
        ],
        totalStaff: [
            "totalStaff",
            "staffCount",
            "staff_count"
        ],
        totalGuardians: [
            "totalGuardians",
            "guardianCount",
            "guardiansCount",
            "guardian_count"
        ],
        totalClasses: [
            "totalClasses",
            "classCount",
            "classesCount",
            "class_count"
        ]
    };

    Object.keys(mappings).forEach(function (targetId) {
        const element = document.getElementById(targetId);

        if (!element) {
            return;
        }

        let value = null;

        for (const key of mappings[targetId]) {
            if (stats[key] !== undefined && stats[key] !== null) {
                value = stats[key];
                break;
            }
        }

        if (value !== null) {
            element.textContent = Number(value).toLocaleString();
        }
    });

    updateElementFromStats(
        ["activeStudents", "studentsActive"],
        stats.activeStudents ?? stats.active_students
    );

    updateElementFromStats(
        ["maleStudents", "studentsMale"],
        stats.maleStudents ?? stats.male_students
    );

    updateElementFromStats(
        ["femaleStudents", "studentsFemale"],
        stats.femaleStudents ?? stats.female_students
    );
}

function updateElementFromStats(ids, value) {
    if (value === undefined || value === null) {
        return;
    }

    ids.forEach(function (id) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = Number(value).toLocaleString();
        }
    });
}

function renderRecentStudents(students) {
    const tableBody =
        document.getElementById("recentStudentsTableBody") ||
        document.getElementById("recentStudentsBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!Array.isArray(students) || students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    No students found.
                </td>
            </tr>
        `;
        return;
    }

    students.slice(0, 5).forEach(function (student) {
        const id = student.id || "";
        const studentNumber =
            student.studentNumber ||
            student.student_number ||
            student.admissionNumber ||
            student.admission_number ||
            "-";

        const name = [
            student.firstName || student.first_name || "",
            student.middleName || student.middle_name || "",
            student.lastName || student.last_name || ""
        ]
            .filter(Boolean)
            .join(" ");

        const gender = student.gender || "-";
        const status = student.status || "Active";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHtml(studentNumber)}</td>
            <td>
                <a href="/pages/student-profile.html?id=${encodeURIComponent(id)}"
                   class="text-decoration-none fw-semibold">
                    ${escapeHtml(name || "Unnamed Student")}
                </a>
            </td>
            <td>${escapeHtml(gender)}</td>
            <td>
                <span class="badge ${
                    String(status).toLowerCase() === "active"
                        ? "bg-success"
                        : "bg-secondary"
                }">
                    ${escapeHtml(status)}
                </span>
            </td>
            <td>
                <a href="/pages/student-profile.html?id=${encodeURIComponent(id)}"
                   class="btn btn-sm btn-outline-primary">
                    View
                </a>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function renderRecentPayments(payments) {
    const tableBody =
        document.getElementById("recentPaymentsTableBody") ||
        document.getElementById("recentPaymentsBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!Array.isArray(payments) || payments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    No recent payments found.
                </td>
            </tr>
        `;
        return;
    }

    payments.slice(0, 5).forEach(function (payment) {
        const studentName =
            payment.studentName ||
            payment.student_name ||
            [
                payment.firstName || payment.first_name || "",
                payment.lastName || payment.last_name || ""
            ]
                .filter(Boolean)
                .join(" ") ||
            "Unknown Student";

        const amount =
            payment.amount ??
            payment.paidAmount ??
            payment.paid_amount ??
            0;

        const date =
            payment.paymentDate ||
            payment.payment_date ||
            payment.createdAt ||
            payment.created_at ||
            null;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHtml(studentName)}</td>
            <td>₦${Number(amount).toLocaleString()}</td>
            <td>${formatDate(date)}</td>
            <td>
                <span class="badge bg-success">Paid</span>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function setupDashboardNavigation() {
    const sidebarToggle = document.querySelector(
        "[data-sidebar-toggle], #sidebarToggle, .sidebar-toggle"
    );

    const sidebar = document.querySelector(
        "#sidebar, .sidebar, .dashboard-sidebar"
    );

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener("click", function () {
            sidebar.classList.toggle("show");
            sidebar.classList.toggle("active");
        });
    }

    const logoutButtons = document.querySelectorAll(
        "[data-logout], #logoutButton, .logout-button"
    );

    logoutButtons.forEach(function (button) {
        button.addEventListener("click", async function (event) {
            event.preventDefault();

            try {
                if (typeof logout === "function") {
                    await logout();
                    return;
                }

                localStorage.removeItem("school_management_token");
                localStorage.removeItem("school_management_user");
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");

                window.location.href = "/pages/login.html";
            } catch (error) {
                console.error("Logout error:", error);
                window.location.href = "/pages/login.html";
            }
        });
    });
}

window.loadDashboardData = loadDashboardData;
window.loadRecentStudents = loadRecentStudents;
window.loadRecentPayments = loadRecentPayments;
window.loadCurrentUser = loadCurrentUser;