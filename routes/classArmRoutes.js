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
        "authenticate must be a function in middleware/authMiddleware.js"
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
    typeof roleMiddleware.requireRole === "function"
        ? roleMiddleware.requireRole
        : null;


/*
|--------------------------------------------------------------------------
| CLASS ARM CONTROLLER
|--------------------------------------------------------------------------
*/

const classArmController =
    require("../controllers/classArmController");


const create =
    classArmController.create;

const getAll =
    classArmController.getAll;

const getById =
    classArmController.getById;

const update =
    classArmController.update;

const remove =
    classArmController.remove;

const search =
    classArmController.search;


/*
|--------------------------------------------------------------------------
| VALIDATE CONTROLLER FUNCTIONS
|--------------------------------------------------------------------------
*/

if (typeof create !== "function") {

    throw new TypeError(
        "classArmController.create is not a function."
    );

}


if (typeof getAll !== "function") {

    throw new TypeError(
        "classArmController.getAll is not a function."
    );

}


if (typeof getById !== "function") {

    throw new TypeError(
        "classArmController.getById is not a function."
    );

}


if (typeof update !== "function") {

    throw new TypeError(
        "classArmController.update is not a function."
    );

}


if (typeof remove !== "function") {

    throw new TypeError(
        "classArmController.remove is not a function."
    );

}


if (typeof search !== "function") {

    throw new TypeError(
        "classArmController.search is not a function."
    );

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
|--------------------------------------------------------------------------
*/

if (requireRole) {

    router.post(
        "/",
        authenticate,
        requireRole("Administrator"),
        create
    );

} else {

    router.post(
        "/",
        authenticate,
        create
    );

}


/*
|--------------------------------------------------------------------------
| UPDATE CLASS ARM
|--------------------------------------------------------------------------
|
| PUT /api/class-arms/:id
|
|--------------------------------------------------------------------------
*/

if (requireRole) {

    router.put(
        "/:id",
        authenticate,
        requireRole("Administrator"),
        update
    );

} else {

    router.put(
        "/:id",
        authenticate,
        update
    );

}


/*
|--------------------------------------------------------------------------
| DELETE CLASS ARM
|--------------------------------------------------------------------------
|
| DELETE /api/class-arms/:id
|
|--------------------------------------------------------------------------
*/

if (requireRole) {

    router.delete(
        "/:id",
        authenticate,
        requireRole("Administrator"),
        remove
    );

} else {

    router.delete(
        "/:id",
        authenticate,
        remove
    );

}


/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;