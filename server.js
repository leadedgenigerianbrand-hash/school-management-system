const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const { testDatabaseConnection } = require("./config/database");

const app = express();

const PORT = process.env.PORT || 4000;


/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const staffRoutes = require("./routes/staffRoutes");
const guardianRoutes = require("./routes/guardianRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const classRoutes = require("./routes/classRoutes");
const classArmRoutes = require("./routes/classArmRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const academicSessionRoutes = require("./routes/academicSessionRoutes");
const termRoutes = require("./routes/termRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const feeRoutes = require("./routes/feeRoutes");
const resultRoutes = require("./routes/resultRoutes");
const documentRoutes = require("./routes/documentRoutes");
const reportRoutes = require("./routes/reportRoutes");
const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const userRoutes = require("./routes/userRoutes");
const schoolRoutes = require("./routes/schoolRoutes");


/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


/*
|--------------------------------------------------------------------------
| STATIC FILES
|--------------------------------------------------------------------------
*/

app.use(
    express.static(
        path.join(__dirname, "Public")
    )
);


/*
|--------------------------------------------------------------------------
| UPLOADS
|--------------------------------------------------------------------------
*/

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);


/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/students",
    studentRoutes
);

app.use(
    "/api/staff",
    staffRoutes
);

app.use(
    "/api/guardians",
    guardianRoutes
);

app.use(
    "/api/subjects",
    subjectRoutes
);

app.use(
    "/api/classes",
    classRoutes
);

app.use(
    "/api/class-arms",
    classArmRoutes
);

app.use(
    "/api/departments",
    departmentRoutes
);

app.use(
    "/api/academic-sessions",
    academicSessionRoutes
);

app.use(
    "/api/terms",
    termRoutes
);

app.use(
    "/api/attendance",
    attendanceRoutes
);

app.use(
    "/api/fees",
    feeRoutes
);

app.use(
    "/api/results",
    resultRoutes
);

app.use(
    "/api/documents",
    documentRoutes
);

app.use(
    "/api/reports",
    reportRoutes
);

app.use(
    "/api/roles",
    roleRoutes
);

app.use(
    "/api/permissions",
    permissionRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/schools",
    schoolRoutes
);


/*
|--------------------------------------------------------------------------
| HOME ROUTE
|--------------------------------------------------------------------------
*/

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "Public",
                "index.html"
            )
        );

    }
);


/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get(
    "/api/health",
    async (req, res) => {

        try {

            await testDatabaseConnection();

            res.status(200).json({

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

            res.status(500).json({

                success: false,

                message:
                    "Server is running, but PostgreSQL connection failed.",

                error:
                    error.message

            });

        }

    }
);


/*
|--------------------------------------------------------------------------
| 404 HANDLER
|--------------------------------------------------------------------------
*/

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "Route not found."

        });

    }
);


/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
    (error, req, res, next) => {

        console.error(
            "Server error:",
            error
        );

        res.status(
            error.status || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Internal server error."

        });

    }
);


/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

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
                    ` Student API: http://localhost:${PORT}/api/students`
                );

                console.log(
                    ` Staff API: http://localhost:${PORT}/api/staff`
                );

                console.log(
                    ` Guardian API: http://localhost:${PORT}/api/guardians`
                );

                console.log(
                    ` Subject API: http://localhost:${PORT}/api/subjects`
                );

                console.log(
                    ` Class API: http://localhost:${PORT}/api/classes`
                );

                console.log(
                    ` Class Arm API: http://localhost:${PORT}/api/class-arms`
                );

                console.log(
                    ` Department API: http://localhost:${PORT}/api/departments`
                );

                console.log(
                    ` Academic Session API: http://localhost:${PORT}/api/academic-sessions`
                );

                console.log(
                    ` Term API: http://localhost:${PORT}/api/terms`
                );

                console.log(
                    ` Attendance API: http://localhost:${PORT}/api/attendance`
                );

                console.log(
                    ` Fee API: http://localhost:${PORT}/api/fees`
                );

                console.log(
                    ` Result API: http://localhost:${PORT}/api/results`
                );

                console.log(
                    ` Document API: http://localhost:${PORT}/api/documents`
                );

                console.log(
                    ` Report API: http://localhost:${PORT}/api/reports`
                );

                console.log(
                    ` Role API: http://localhost:${PORT}/api/roles`
                );

                console.log(
                    ` Permission API: http://localhost:${PORT}/api/permissions`
                );

                console.log(
                    ` User API: http://localhost:${PORT}/api/users`
                );

                console.log(
                    ` School API: http://localhost:${PORT}/api/schools`
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


/*
|--------------------------------------------------------------------------
| APPLICATION START
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| TEMPORARY RENDER ADMIN SETUP
|--------------------------------------------------------------------------
*/

app.get("/api/setup-render-admin", async (req, res) => {

    try {

        const bcrypt = require("bcryptjs");
        const { query } = require("./config/database");

        const passwordHash = await bcrypt.hash(
            "Admin@123",
            10
        );

        const schoolResult = await query(`
            SELECT id
            FROM schools
            WHERE school_code = 'LMC001'
            LIMIT 1
        `);

        if (!schoolResult.rows.length) {

            return res.status(500).json({
                success: false,
                message: "School LMC001 does not exist in Render database."
            });

        }

        const roleResult = await query(`
            SELECT id
            FROM roles
            WHERE LOWER(role_name) = 'administrator'
            LIMIT 1
        `);

        if (!roleResult.rows.length) {

            return res.status(500).json({
                success: false,
                message: "Administrator role does not exist in Render database."
            });

        }

        const existingUser = await query(`
            SELECT id
            FROM users
            WHERE LOWER(username) = 'admin'
            LIMIT 1
        `);

        let result;

        if (existingUser.rows.length) {

            result = await query(`
                UPDATE users
                SET
                    school_id = $1,
                    role_id = $2,
                    first_name = 'System',
                    last_name = 'Administrator',
                    email = 'admin@leadedgecollege.local',
                    password_hash = $3,
                    is_active = TRUE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING
                    id,
                    username,
                    email,
                    is_active
            `, [
                schoolResult.rows[0].id,
                roleResult.rows[0].id,
                passwordHash,
                existingUser.rows[0].id
            ]);

        } else {

            result = await query(`
                INSERT INTO users (
                    school_id,
                    role_id,
                    first_name,
                    last_name,
                    email,
                    username,
                    password_hash,
                    is_active
                )
                VALUES (
                    $1,
                    $2,
                    'System',
                    'Administrator',
                    'admin@leadedgecollege.local',
                    'admin',
                    $3,
                    TRUE
                )
                RETURNING
                    id,
                    username,
                    email,
                    is_active
            `, [
                schoolResult.rows[0].id,
                roleResult.rows[0].id,
                passwordHash
            ]);

        }

        return res.status(200).json({

            success: true,

            message:
                "Render administrator account is ready.",

            login: {
                username: "admin",
                password: "Admin@123"
            },

            user: result.rows[0]

        });

    } catch (error) {

        console.error(
            "Render admin setup error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Render administrator setup failed.",

            error:
                error.message

        });

    }

});

startServer();