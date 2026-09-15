"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL =
    process.env.TEST_BASE_URL ||
    "http://localhost:4000";

const API_MODULES = [
    "users",
    "roles",
    "permissions",
    "schools",
    "academic-sessions",
    "terms",
    "academic-levels",
    "classes",
    "class-arms",
    "departments",
    "subjects",
    "students",
    "enrollments",
    "staff",
    "guardians",
    "attendance",
    "fees",
    "payments",
    "result-settings",
    "results",
    "timetable",
    "notifications",
    "announcements",
    "documents",
    "reports",
    "audit-logs"
];

async function request(url, options = {}) {
    let response;

    try {
        response = await fetch(url, options);
    } catch (error) {
        throw new Error(
            `Unable to connect to ${BASE_URL}. Start the server with npm start before running the final system tests.`
        );
    }

    let body = null;

    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            body = await response.json();
        } catch (error) {
            body = null;
        }
    } else {
        try {
            body = await response.text();
        } catch (error) {
            body = null;
        }
    }

    return {
        status: response.status,
        body
    };
}

async function assertServerIsAvailable() {
    const response =
        await request(
            `${BASE_URL}/api/health`
        );

    assert.notEqual(
        response.status,
        404,
        `The health endpoint was not found at ${BASE_URL}/api/health.`
    );

    assert.ok(
        response.status >= 200 &&
        response.status < 500,
        `The health endpoint returned unexpected status ${response.status}.`
    );
}

test.before(
    async () => {
        await assertServerIsAvailable();
    }
);

test(
    "system health endpoint responds successfully",
    async () => {
        const response =
            await request(
                `${BASE_URL}/api/health`
            );

        assert.ok(
            response.status >= 200 &&
            response.status < 300,
            `Expected a successful health response, received ${response.status}.`
        );

        assert.equal(
            response.body?.success,
            true,
            "The health endpoint should report success as true."
        );
    }
);

test(
    "login API endpoint exists",
    async () => {
        const response =
            await request(
                `${BASE_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({})
                }
            );

        assert.notEqual(
            response.status,
            404,
            "The /api/auth/login endpoint was not found."
        );

        assert.notEqual(
            response.status,
            500,
            "The login endpoint must not return an unexpected server error for an empty request."
        );
    }
);

test(
    "unauthenticated current-user endpoint is protected",
    async () => {
        const response =
            await request(
                `${BASE_URL}/api/auth/me`
            );

        assert.ok(
            [401, 403].includes(
                response.status
            ),
            `Expected 401 or 403, received ${response.status}.`
        );
    }
);

test(
    "major API modules are mounted",
    async () => {
        const missingModules = [];

        for (
            const moduleName of API_MODULES
        ) {
            const response =
                await request(
                    `${BASE_URL}/api/${moduleName}`
                );

            if (
                response.status === 404
            ) {
                missingModules.push(
                    moduleName
                );
            }
        }

        assert.deepEqual(
            missingModules,
            [],
            `The following API modules were not found: ${missingModules.join(", ")}`
        );
    }
);

test(
    "unauthenticated access to protected API modules is rejected",
    async () => {
        const failures = [];

        for (
            const moduleName of API_MODULES
        ) {
            const response =
                await request(
                    `${BASE_URL}/api/${moduleName}`
                );

            if (
                response.status === 200
            ) {
                failures.push(
                    `${moduleName}: returned 200 without authentication`
                );
            }

            if (
                response.status >= 500
            ) {
                failures.push(
                    `${moduleName}: returned ${response.status}`
                );
            }
        }

        assert.deepEqual(
            failures,
            [],
            `Protected API validation failures: ${failures.join("; ")}`
        );
    }
);

test(
    "malformed bearer authentication is rejected",
    async () => {
        const response =
            await request(
                `${BASE_URL}/api/students`,
                {
                    headers: {
                        Authorization:
                            "Bearer invalid-token"
                    }
                }
            );

        assert.ok(
            [401, 403].includes(
                response.status
            ),
            `Expected 401 or 403 for malformed authentication, received ${response.status}.`
        );
    }
);

test(
    "unsupported system-level HTTP method does not produce an unexpected server error",
    async () => {
        const response =
            await request(
                `${BASE_URL}/api/students`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({})
                }
            );

        assert.notEqual(
            response.status,
            500,
            "The system must not return an unexpected 500 response for an unsupported request."
        );
    }
);