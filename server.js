"use strict";

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const {
    testDatabaseConnection
} = require("./config/database");

const app = express();

const PORT =
    Number(process.env.PORT) || 4000;

app.disable("x-powered-by");

app.use(
    cors()
);

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);

const publicPath = path.join(
    __dirname,
    "Public"
);

app.use(
    express.static(publicPath)
);

const uploadsPath = path.join(
    __dirname,
    "uploads"
);

if (fs.existsSync(uploadsPath)) {
    app.use(
        "/uploads",
        express.static(uploadsPath)
    );
}

const routeMap = {
    authRoutes: "/api/auth",
    userRoutes: "/api/users",
    roleRoutes: "/api/roles",
    permissionRoutes: "/api/permissions",
    schoolRoutes: "/api/schools",
    academicSessionRoutes: "/api/academic-sessions",
    termRoutes: "/api/terms",
    academicLevelRoutes: "/api/academic-levels",
    classRoutes: "/api/classes",
    classArmRoutes: "/api/class-arms",
    departmentRoutes: "/api/departments",
    subjectRoutes: "/api/subjects",
    studentRoutes: "/api/students",
    enrollmentRoutes: "/api/enrollments",
    staffRoutes: "/api/staff",
    guardianRoutes: "/api/guardians",
    attendanceRoutes: "/api/attendance",
    feeRoutes: "/api/fees",
    paymentRoutes: "/api/payments",
    resultSettingRoutes: "/api/result-settings",
    resultRoutes: "/api/results",
    timetableRoutes: "/api/timetable",
    notificationRoutes: "/api/notifications",
    announcementRoutes: "/api/announcements",
    documentRoutes: "/api/documents",
    reportRoutes: "/api/reports",
    auditLogRoutes: "/api/audit-logs"
};

function loadRoutes() {
    const routesDirectory =
        path.join(
            __dirname,
            "routes"
        );

    for (
        const [fileName, routePath]
        of Object.entries(routeMap)
    ) {
        const routeFile =
            path.join(
                routesDirectory,
                `${fileName}.js`
            );

        if (
            !fs.existsSync(routeFile)
        ) {
            continue;
        }

        try {
            const router =
                require(routeFile);

            if (
                typeof router !==
                "function"
            ) {
                throw new TypeError(
                    `${fileName}.js does not export an Express router.`
                );
            }

            app.use(
                routePath,
                router
            );

            console.log(
                `Route loaded: ${routePath}`
            );
        } catch (error) {
            console.error(
                `Failed to load route: ${fileName}.js`
            );

            throw error;
        }
    }
}

loadRoutes();

app.get(
    "/",
    (req, res) => {
        return res.sendFile(
            path.join(
                publicPath,
                "index.html"
            )
        );
    }
);

app.get(
    "/api/health",
    async (req, res) => {
        try {
            await testDatabaseConnection();

            return res.status(200).json({
                success: true,
                message:
                    "School Management System API is running.",
                database:
                    "PostgreSQL connected",
                timestamp:
                    new Date().toISOString()
            });
        } catch (error) {
            console.error(
                "Database health check failed:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server is running, but PostgreSQL connection failed.",
                error:
                    error.message
            });
        }
    }
);

app.use(
    (req, res) => {
        return res.status(404).json({
            success: false,
            message:
                "Route not found."
        });
    }
);

app.use(
    (error, req, res, next) => {
        console.error(
            "Server error:",
            error
        );

        if (
            res.headersSent
        ) {
            return next(error);
        }

        const errorStatus =
            Number(error.status);

        const statusCode =
            errorStatus >= 400 &&
            errorStatus < 600
                ? errorStatus
                : 500;

        return res
            .status(statusCode)
            .json({
                success: false,
                message:
                    error.message ||
                    "Internal server error."
            });
    }
);

async function startServer() {
    try {
        console.log(
            "Connecting to PostgreSQL..."
        );

        await testDatabaseConnection();

        app.listen(
            PORT,
            () => {
                console.log(
                    "=============================================="
                );

                console.log(
                    " SCHOOL MANAGEMENT SYSTEM"
                );

                console.log(
                    "=============================================="
                );

                console.log(
                    ` Server running on: http://localhost:${PORT}`
                );

                console.log(
                    ` Health check: http://localhost:${PORT}/api/health`
                );

                console.log(
                    ` Login API: http://localhost:${PORT}/api/auth/login`
                );

                console.log(
                    " PostgreSQL: Connected"
                );

                console.log(
                    "=============================================="
                );
            }
        );
    } catch (error) {
        console.error(
            "=============================================="
        );

        console.error(
            " SERVER STARTUP FAILED"
        );

        console.error(
            "=============================================="
        );

        console.error(
            error.message
        );

        console.error("");

        console.error(
            "Please check your PostgreSQL service and .env configuration."
        );

        process.exit(1);
    }
}

startServer();

module.exports = app;