"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL =
    process.env.TEST_BASE_URL ||
    "http://localhost:4000";

const REPORTS_URL =
    `${BASE_URL}/api/reports`;

const AUTH_ME_URL =
    `${BASE_URL}/api/auth/me`;

async function requestJson(
    url,
    options = {}
) {
    let response;

    try {
        response = await fetch(url, options);
    } catch (error) {
        throw new Error(
            `Unable to connect to ${BASE_URL}. Start the server with npm start before running the reports tests.`
        );
    }

    const contentType =
        response.headers.get("content-type") || "";

    let body = null;

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
    let response;

    try {
        response = await fetch(
            `${BASE_URL}/api/health`
        );
    } catch (error) {
        throw new Error(
            `School Management System is not running at ${BASE_URL}. Start the server with npm start before running the reports tests.`
        );
    }

    assert.notEqual(
        response.status,
        404,
        `The server responded, but ${BASE_URL}/api/health was not found.`
    );
}

test.before(
    async () => {
        await assertServerIsAvailable();
    }
);

test(
    "reports API endpoint exists",
    async () => {
        const response =
            await requestJson(
                REPORTS_URL
            );

        assert.notEqual(
            response.status,
            404,
            "The /api/reports endpoint was not found."
        );
    }
);

test(
    "unauthenticated reports access is rejected",
    async () => {
        const response =
            await requestJson(
                REPORTS_URL
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
    "malformed bearer authentication is rejected",
    async () => {
        const response =
            await requestJson(
                REPORTS_URL,
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
            `Expected 401 or 403, received ${response.status}.`
        );
    }
);

test(
    "unauthenticated current-user request is rejected",
    async () => {
        const response =
            await requestJson(
                AUTH_ME_URL
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
    "invalid report request is handled safely",
    async () => {
        const response =
            await requestJson(
                REPORTS_URL,
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
            500,
            "An invalid report request must not cause an unexpected server error."
        );
    }
);

test(
    "unsupported PATCH request is rejected",
    async () => {
        const response =
            await requestJson(
                REPORTS_URL,
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
            "An unsupported PATCH request must not cause a server error."
        );

        assert.notEqual(
            response.status,
            200,
            "The reports collection must not accept an unsupported PATCH request."
        );
    }
);

test(
    "unauthenticated report search access is rejected when the search endpoint exists",
    async () => {
        const response =
            await requestJson(
                `${REPORTS_URL}/search?q=test`
            );

        if (response.status === 404) {
            return;
        }

        assert.ok(
            [401, 403].includes(
                response.status
            ),
            `Expected 401 or 403, received ${response.status}.`
        );
    }
);