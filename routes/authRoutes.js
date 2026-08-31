"use strict";

const express = require("express");

const {
    login,
    getCurrentUser
} = require("../controllers/authController");

const authenticate =
    require("../middleware/authMiddleware");


/*
|--------------------------------------------------------------------------
| AUTHENTICATION ROUTES
|--------------------------------------------------------------------------
|
| Base route:
| /api/auth
|
| Endpoints:
| POST /api/auth/login
| GET  /api/auth/me
| POST /api/auth/logout
|
|--------------------------------------------------------------------------
*/


const router = express.Router();


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post(
    "/login",
    login
);


/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

router.get(
    "/me",
    authenticate,
    getCurrentUser
);


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

router.post(
    "/logout",
    authenticate,
    (req, res) => {

        return res.status(200).json({

            success: true,

            message:
                "Logout successful."

        });

    }
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = router;
