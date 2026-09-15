"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL =
    process.env.TEST_BASE_URL ||
    "http://localhost:4000";

const AUTH_LOGIN_URL =
    `${BASE_URL}/api/auth/login`;

const AUTH_ME_URL =
    `${BASE_URL}/api/auth/me`;

async function requestJson(url, options = {}) {
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

    if (contentType.includes("application/json")) {
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
            "Start the server with npm start before running the authentication tests."
        );
    }
}

test.before(async () => {
    await assertServerIsAvailable();
});

test("authentication API: login endpoint is available", async () => {
    const { response } =
        await requestJson(AUTH_LOGIN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        });

    assert.notEqual(
        response.status,
        404,
        "POST /api/auth/login must exist."
    );

    assert.ok(
        response.status >= 400 &&
        response.status < 500,
        `Expected a client validation/authentication error, received ${response.status}.`
    );
});

test("authentication API: empty login credentials are rejected", async () => {
    const { response, body } =
        await requestJson(AUTH_LOGIN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        });

    assert.ok(
        response.status === 400 ||
        response.status === 401 ||
        response.status === 422,
        `Expected 400, 401, or 422 for empty credentials, received ${response.status}.`
    );

    assert.equal(
        response.headers.get("content-type")?.includes(
            "application/json"
        ),
        true,
        "Authentication errors should be returned as JSON."
    );

    assert.ok(
        body !== null &&
        typeof body === "object",
        "Authentication error response must be a JSON object."
    );
});

test("authentication API: invalid credentials are rejected", async () => {
    const { response, body } =
        await requestJson(AUTH_LOGIN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: "invalid-authentication-test@example.invalid",
                username: "invalid-authentication-test",
                password: "DefinitelyNotARealPassword!987654"
            })
        });

    assert.ok(
        response.status === 400 ||
        response.status === 401 ||
        response.status === 422,
        `Invalid credentials must not authenticate successfully. Received ${response.status}.`
    );

    assert.ok(
        body !== null &&
        typeof body === "object",
        "Invalid authentication response must be a JSON object."
    );
});

test("authentication API: protected /me endpoint rejects unauthenticated requests", async () => {
    const { response, body } =
        await requestJson(AUTH_ME_URL, {
            method: "GET"
        });

    assert.ok(
        response.status === 401 ||
        response.status === 403,
        `Unauthenticated /api/auth/me request must be rejected. Received ${response.status}.`
    );

    assert.ok(
        body !== null &&
        typeof body === "object",
        "Protected authentication endpoint must return a JSON error object."
    );
});

test("authentication API: malformed bearer token is rejected", async () => {
    const { response, body } =
        await requestJson(AUTH_ME_URL, {
            method: "GET",
            headers: {
                Authorization: "Bearer invalid-test-token"
            }
        });

    assert.ok(
        response.status === 401 ||
        response.status === 403,
        `Malformed bearer token must be rejected. Received ${response.status}.`
    );

    assert.ok(
        body !== null &&
        typeof body === "object",
        "Malformed-token response must be a JSON object."
    );
});

test("authentication API: login endpoint does not accept GET requests", async () => {
    const response =
        await fetch(AUTH_LOGIN_URL, {
            method: "GET",
            headers: {
                Accept: "application/json"
            }
        });

    assert.notEqual(
        response.status,
        200,
        "The login endpoint must not authenticate users through GET."
    );
});