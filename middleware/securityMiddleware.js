"use strict";

/*
|--------------------------------------------------------------------------
| SCHOOL MANAGEMENT SYSTEM
| SECURITY MIDDLEWARE
|--------------------------------------------------------------------------
|
| File:
| middleware/securityMiddleware.js
|
| Purpose:
| - Apply common HTTP security headers.
| - Remove unnecessary Express identification headers.
| - Reduce browser security risks.
| - Provide a central security layer for the application.
|
| Important:
| - This middleware does NOT authenticate users.
| - This middleware does NOT authorize users.
| - JWT authentication remains the responsibility of authMiddleware.js.
| - Route-level permissions remain the responsibility of the
|   appropriate authorization middleware.
|
|--------------------------------------------------------------------------
*/

function securityMiddleware(req, res, next) {
    /*
    |--------------------------------------------------------------------------
    | Remove Express technology disclosure
    |--------------------------------------------------------------------------
    */

    res.removeHeader("X-Powered-By");

    /*
    |--------------------------------------------------------------------------
    | Prevent MIME-type sniffing
    |--------------------------------------------------------------------------
    |
    | Browsers should use the declared Content-Type rather than attempting
    | to guess the content type.
    |
    */

    res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
    );

    /*
    |--------------------------------------------------------------------------
    | Prevent the application from being embedded in a frame
    |--------------------------------------------------------------------------
    |
    | This protects against common clickjacking attacks.
    |
    */

    res.setHeader(
        "X-Frame-Options",
        "SAMEORIGIN"
    );

    /*
    |--------------------------------------------------------------------------
    | Control referrer information
    |--------------------------------------------------------------------------
    |
    | The browser will not unnecessarily send the full application URL
    | to external websites.
    |
    */

    res.setHeader(
        "Referrer-Policy",
        "strict-origin-when-cross-origin"
    );

    /*
    |--------------------------------------------------------------------------
    | Restrict browser features
    |--------------------------------------------------------------------------
    |
    | Only features required by the application should be enabled.
    |
    */

    res.setHeader(
        "Permissions-Policy",
        [
            "camera=()",
            "microphone=()",
            "geolocation=()",
            "payment=()",
            "usb=()",
            "magnetometer=()",
            "gyroscope=()",
            "accelerometer=()"
        ].join(", ")
    );

    /*
    |--------------------------------------------------------------------------
    | Cross-domain browser policy
    |--------------------------------------------------------------------------
    |
    | Prevent browsers from making the response available to documents
    | opened from unrelated origins.
    |
    */

    res.setHeader(
        "Cross-Origin-Opener-Policy",
        "same-origin"
    );

    /*
    |--------------------------------------------------------------------------
    | Cross-origin resource policy
    |--------------------------------------------------------------------------
    |
    | Resources served by this application should normally be requested
    | from the same origin.
    |
    */

    res.setHeader(
        "Cross-Origin-Resource-Policy",
        "same-origin"
    );

    /*
    |--------------------------------------------------------------------------
    | Content Security Policy
    |--------------------------------------------------------------------------
    |
    | The current application uses:
    | - Same-origin scripts and resources.
    | - Bootstrap resources.
    | - Bootstrap Icons.
    | - Google Fonts.
    | - Inline styles used by some existing pages.
    |
    | Inline scripts are deliberately NOT enabled here.
    |
    | If the frontend architecture later removes inline styles and moves
    | everything into local CSS files, this policy can be tightened further.
    |
    */

    res.setHeader(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "object-src 'none'",
            "script-src 'self' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
            "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com data:",
            "img-src 'self' data: blob:",
            "connect-src 'self'",
            "media-src 'self' blob:",
            "worker-src 'self' blob:"
        ].join("; ")
    );

    /*
    |--------------------------------------------------------------------------
    | API and authenticated-response cache control
    |--------------------------------------------------------------------------
    |
    | Sensitive API responses should not be stored by shared browser or
    | proxy caches.
    |
    | We apply this to API requests rather than disabling caching for every
    | static CSS, JavaScript, image, or HTML resource in the application.
    |
    */

    if (req.path.startsWith("/api/")) {
        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );

        res.setHeader(
            "Pragma",
            "no-cache"
        );

        res.setHeader(
            "Expires",
            "0"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent browsers and proxies from caching authenticated responses
    |--------------------------------------------------------------------------
    |
    | If an Authorization header is present, the response contains data
    | associated with an authenticated request.
    |
    */

    if (req.headers.authorization) {
        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );

        res.setHeader(
            "Pragma",
            "no-cache"
        );

        res.setHeader(
            "Expires",
            "0"
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Continue to the next middleware
    |--------------------------------------------------------------------------
    */

    next();
}

module.exports = securityMiddleware;