"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL =
    process.env.TEST_BASE_URL ||
    "http://localhost:4000";

const STUDENTS_URL =
    `${BASE_URL}/api/students`;

const AUTH_ME_URL =
    `${BASE_URL}/api/auth/me`;

async function requestJson(
    url,
    options = {}
) {
    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: "application/json",
            ...(options.headers || {})
        }
    });

    const contentType =
        response.headers.get("content-type") || "";

    let body = null;

    if (
        contentType.includes(
            "application/json"
        )
    ) {
        body = await response.json();
    } else {
        body = await response.text();
    }

    return {
        response,
        body
    };
}

async function assertServerIsAvailable() {
    try {
        const response = await fetch(
            `${BASE_URL}/api/health`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            }
        );

        assert.notEqual(
            response.status,
            404,
            "The application health endpoint was not found."
        );

        return true;
    } catch (error) {
        throw new Error(
            `School Management System is not running at ${BASE_URL}. ` +
            "Start the server with npm start before running the student tests."
        );
    }
}

async function getUnauthenticatedStudentsRequest() {
    return requestJson(
        STUDENTS_URL,
        {
            method: "GET"
        }
    );
}

test.before(async () => {
    await assertServerIsAvailable();
});

test(
    "students API: student endpoint exists",
    async () => {
        const {
            response
        } =
            await getUnauthenticatedStudentsRequest();

        assert.notEqual(
            response.status,
            404,
            "GET /api/students must exist."
        );
    }
);

test(
    "students API: unauthenticated access is rejected",
    async () => {
        const {
            response,
            body
        } =
            await getUnauthenticatedStudentsRequest();

        assert.ok(
            response.status === 401 ||
            response.status === 403,
            `Unauthenticated student access must be rejected. Received ${response.status}.`
        );

        assert.ok(
            body !== null &&
            typeof body === "object",
            "Authentication errors should return a JSON object."
        );
    }
);

test(
    "students API: malformed bearer token is rejected",
    async () => {
        const {
            response,
            body
        } =
            await requestJson(
                STUDENTS_URL,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            "Bearer invalid-test-token"
                    }
                }
            );

        assert.ok(
            response.status === 401 ||
            response.status === 403,
            `Malformed bearer token must be rejected. Received ${response.status}.`
        );

        assert.ok(
            body !== null &&
            typeof body === "object",
            "Malformed-token response should be a JSON object."
        );
    }
);

test(
    "students API: protected /api/auth/me rejects unauthenticated access",
    async () => {
        const {
            response,
            body
        } =
            await requestJson(
                AUTH_ME_URL,
                {
                    method: "GET"
                }
            );

        assert.ok(
            response.status === 401 ||
            response.status === 403,
            `Unauthenticated /api/auth/me access must be rejected. Received ${response.status}.`
        );

        assert.ok(
            body !== null &&
            typeof body === "object",
            "Authentication response should be a JSON object."
        );
    }
);

test(
    "students API: empty student creation request is rejected",
    async () => {
        const {
            response,
            body
        } =
            await requestJson(
                STUDENTS_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({})
                }
            );

        assert.notEqual(
            response.status,
            404,
            "POST /api/students must exist."
        );

        assert.ok(
            response.status === 401 ||
            response.status === 403 ||
            response.status === 400 ||
            response.status === 422,
            `An empty student creation request must not succeed. Received ${response.status}.`
        );

        assert.ok(
            body !== null,
            "Student creation error should return a response body."
        );
    }
);

test(
    "students API: unsupported HTTP method is rejected",
    async () => {
        const response =
            await fetch(
                STUDENTS_URL,
                {
                    method: "PATCH",
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        assert.notEqual(
            response.status,
            200,
            "Unsupported PATCH request must not succeed."
        );
    }
);

test(
    "students API: protected student search endpoint does not allow unauthenticated access",
    async () => {
        const {
            response,
            body
        } =
            await requestJson(
                `${STUDENTS_URL}/search?q=test`,
                {
                    method: "GET"
                }
            );

        assert.ok(
            response.status === 401 ||
            response.status === 403 ||
            response.status === 404,
            `Unauthenticated student search must not succeed. Received ${response.status}.`
        );

        if (
            response.status !== 404
        ) {
            assert.ok(
                body !== null,
                "Student search authentication response should contain a body."
            );
        }
    }
);