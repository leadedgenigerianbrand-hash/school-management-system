"use strict";

const express = require("express");

const router = express.Router();

const authenticate =
    require("../middleware/authMiddleware");

const {
    administratorOnly,
    requireSchoolContext
} = require("../middleware/roleMiddleware");

const {
    createUser,
    getUsers,
    getUserById,
    getCurrentUser,
    updateUser,
    changePassword,
    activateUser,
    deactivateUser,
    deleteUser,
    updateLastLogin
} = require("../controllers/userController");


/*
|--------------------------------------------------------------------------
| USER ROUTES
|--------------------------------------------------------------------------
|
| These routes manage system users/staff login accounts.
|
| A user belongs to:
|
|     School
|        ↓
|      Role
|        ↓
|      User
|
| Authentication:
|
|     authenticate
|
| Authorization:
|
|     administratorOnly
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
|
| GET /api/users/me
|
| Returns the currently authenticated user.
|
| Any authenticated user can access this route.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/me",
    authenticate,
    getCurrentUser
);


/*
|--------------------------------------------------------------------------
| UPDATE CURRENT USER LAST LOGIN
|--------------------------------------------------------------------------
|
| POST /api/users/me/last-login
|
| Used to update the authenticated user's last login timestamp.
|
|--------------------------------------------------------------------------
*/

router.post(
    "/me/last-login",
    authenticate,
    updateLastLogin
);


/*
|--------------------------------------------------------------------------
| CHANGE CURRENT USER PASSWORD
|--------------------------------------------------------------------------
|
| PUT /api/users/:id/password
|
| The controller verifies the current password before changing it.
|
|--------------------------------------------------------------------------
*/

router.put(
    "/:id/password",
    authenticate,
    changePassword
);


/*
|--------------------------------------------------------------------------
| GET ALL USERS
|--------------------------------------------------------------------------
|
| GET /api/users
|
| Only administrators should be able to see the complete user list.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    getUsers
);


/*
|--------------------------------------------------------------------------
| GET USER BY ID
|--------------------------------------------------------------------------
|
| GET /api/users/:id
|
| Administrator can inspect a user belonging to the same school.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    getUserById
);


/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
|
| POST /api/users
|
| Administrator creates:
|
| - Administrator
| - Admissions Officer
| - Data Officer
| - Examination Officer
| - Account Officer
|
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    createUser
);


/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
|
| PUT /api/users/:id
|
| Administrator can update the user's profile.
|
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    updateUser
);


/*
|--------------------------------------------------------------------------
| ACTIVATE USER
|--------------------------------------------------------------------------
|
| PATCH /api/users/:id/activate
|
|--------------------------------------------------------------------------
*/

router.patch(
    "/:id/activate",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    activateUser
);


/*
|--------------------------------------------------------------------------
| DEACTIVATE USER
|--------------------------------------------------------------------------
|
| PATCH /api/users/:id/deactivate
|
|--------------------------------------------------------------------------
*/

router.patch(
    "/:id/deactivate",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    deactivateUser
);


/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
|
| DELETE /api/users/:id
|
| This is an administrative operation.
|
| In normal school operation, deactivation is preferred to deletion.
|
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    authenticate,
    administratorOnly,
    requireSchoolContext,
    deleteUser
);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;