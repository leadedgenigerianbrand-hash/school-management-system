"use strict";

const express = require("express");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| AUTHENTICATION MIDDLEWARE
|--------------------------------------------------------------------------
*/

const authMiddleware =
    require("../middleware/authMiddleware");


const authenticate =
    typeof authMiddleware === "function"
        ? authMiddleware
        : authMiddleware.authenticate;


if (typeof authenticate !== "function") {

    throw new TypeError(
        "Authentication middleware is not exported correctly from middleware/authMiddleware.js"
    );

}


/*
|--------------------------------------------------------------------------
| ROLE MIDDLEWARE
|--------------------------------------------------------------------------
*/

const roleMiddleware =
    require("../middleware/roleMiddleware");


const requireRole =
    roleMiddleware &&
    typeof roleMiddleware.requireRole === "function"
        ? roleMiddleware.requireRole
        : null;


if (!requireRole) {

    throw new TypeError(
        "Role middleware is not exported correctly from middleware/roleMiddleware.js"
    );

}


/*
|--------------------------------------------------------------------------
| CLASS ARM CONTROLLER
|--------------------------------------------------------------------------
*/

const classArmController =
    require("../controllers/classArmController");


const {
    create,
    getAll,
    getById,
    update,
    remove,
    search
} = classArmController;


/*
|--------------------------------------------------------------------------
| VALIDATE CONTROLLER FUNCTIONS
|--------------------------------------------------------------------------
*/

const controllerFunctions = {

    create,

    getAll,

    getById,

    update,

    remove,

    search

};


for (
    const [name, handler]
    of Object.entries(controllerFunctions)
) {

    if (typeof handler !== "function") {

        throw new TypeError(
            `Class arm controller "${name}" is not exported as a function.`
        );

    }

}


/*
|--------------------------------------------------------------------------
| CLASS ARM ROUTES
|--------------------------------------------------------------------------
|
| Base URL:
|
| /api/class-arms
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| SEARCH CLASS ARMS
|--------------------------------------------------------------------------
|
| GET /api/class-arms/search?q=
|
|--------------------------------------------------------------------------
*/

router.get(
    "/search",
    authenticate,
    search
);


/*
|--------------------------------------------------------------------------
| GET ALL CLASS ARMS
|--------------------------------------------------------------------------
|
| GET /api/class-arms
|
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authenticate,
    getAll
);


/*
|--------------------------------------------------------------------------
| GET CLASS ARM BY ID
|--------------------------------------------------------------------------
|
| GET /api/class-arms/:id
|
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    authenticate,
    getById
);


/*
|--------------------------------------------------------------------------
| CREATE CLASS ARM
|--------------------------------------------------------------------------
|
| POST /api/class-arms
|
| Administrator only.
|
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authenticate,
    requireRole("Administrator"),
    create
);


/*
|--------------------------------------------------------------------------
| UPDATE CLASS ARM
|--------------------------------------------------------------------------
|
| PUT /api/class-arms/:id
|
| Administrator only.
|
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    authenticate,
    requireRole("Administrator"),
    update
);


/*
|--------------------------------------------------------------------------
| DELETE CLASS ARM
|--------------------------------------------------------------------------
|
| DELETE /api/class-arms/:id
|
| Administrator only.
|
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    authenticate,
    requireRole("Administrator"),
    remove
);


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;