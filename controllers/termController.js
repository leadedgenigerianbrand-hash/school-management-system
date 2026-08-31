const termModel = require("../models/termModel");


/*
|--------------------------------------------------------------------------
| Term Controller
|--------------------------------------------------------------------------
|
| Handles academic term operations.
|
*/


/*
|--------------------------------------------------------------------------
| Get All Terms
|--------------------------------------------------------------------------
|
| GET /api/terms
|
*/

async function getTerms(req, res, next) {

    try {

        const schoolId = req.user.schoolId || req.user.school_id;

        if (!schoolId) {

            return res.status(400).json({
                success: false,
                message: "School ID is required."
            });

        }

        const {
            sessionId,
            status
        } = req.query;


        let terms;


        if (sessionId) {

            terms = await termModel.findTermsBySession(
                sessionId,
                schoolId,
                {
                    includeInactive: status === "inactive"
                }
            );

        } else {

            terms = await termModel.findTermsBySchool(
                schoolId,
                {
                    status: status || null
                }
            );

        }


        return res.status(200).json({

            success: true,

            count: terms.length,

            data: terms

        });

    } catch (error) {

        console.error(
            "Get terms error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Get Term By ID
|--------------------------------------------------------------------------
|
| GET /api/terms/:id
|
*/

async function getTermById(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const schoolId =
            req.user.schoolId ||
            req.user.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const term =
            await termModel.findTermById(
                id,
                schoolId
            );


        if (!term) {

            return res.status(404).json({

                success: false,

                message:
                    "Term not found."

            });

        }


        return res.status(200).json({

            success: true,

            data: term

        });

    } catch (error) {

        console.error(
            "Get term by ID error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Create Term
|--------------------------------------------------------------------------
|
| POST /api/terms
|
*/

async function createTerm(req, res, next) {

    try {

        const schoolId =
            req.user.schoolId ||
            req.user.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            sessionId,
            termName,
            termCode,
            startDate,
            endDate,
            description,
            displayOrder,
            status
        } = req.body;


        if (!sessionId) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        if (!termName || !termName.trim()) {

            return res.status(400).json({

                success: false,

                message:
                    "Term name is required."

            });

        }


        const exists =
            await termModel.termExists(
                sessionId,
                termName.trim(),
                schoolId
            );


        if (exists) {

            return res.status(409).json({

                success: false,

                message:
                    "A term with this name already exists in this academic session."

            });

        }


        const term =
            await termModel.createTerm({

                schoolId,

                sessionId,

                termName:
                    termName.trim(),

                termCode:
                    termCode || null,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                description:
                    description || null,

                displayOrder:
                    displayOrder !== undefined
                        ? displayOrder
                        : 0,

                status:
                    status || "upcoming"

            });


        return res.status(201).json({

            success: true,

            message:
                "Term created successfully.",

            data: term

        });

    } catch (error) {

        console.error(
            "Create term error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Update Term
|--------------------------------------------------------------------------
|
| PUT /api/terms/:id
|
*/

async function updateTerm(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const schoolId =
            req.user.schoolId ||
            req.user.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            sessionId,
            termName,
            termCode,
            startDate,
            endDate,
            description,
            displayOrder,
            status
        } = req.body;


        if (!sessionId) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        if (!termName || !termName.trim()) {

            return res.status(400).json({

                success: false,

                message:
                    "Term name is required."

            });

        }


        const existing =
            await termModel.findTermById(
                id,
                schoolId
            );


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Term not found."

            });

        }


        const duplicate =
            await termModel.findTermByName(
                sessionId,
                termName.trim(),
                schoolId
            );


        if (
            duplicate &&
            String(duplicate.id) !== String(id)
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "A term with this name already exists in this academic session."

            });

        }


        const term =
            await termModel.updateTerm(

                id,

                schoolId,

                {

                    sessionId,

                    termName:
                        termName.trim(),

                    termCode:
                        termCode || null,

                    startDate:
                        startDate || null,

                    endDate:
                        endDate || null,

                    description:
                        description || null,

                    displayOrder:
                        displayOrder !== undefined
                            ? displayOrder
                            : 0,

                    status:
                        status || "upcoming"

                }

            );


        if (!term) {

            return res.status(404).json({

                success: false,

                message:
                    "Term not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Term updated successfully.",

            data: term

        });

    } catch (error) {

        console.error(
            "Update term error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Delete Term
|--------------------------------------------------------------------------
|
| DELETE /api/terms/:id
|
*/

async function deleteTerm(req, res, next) {

    try {

        const {
            id
        } = req.params;


        const schoolId =
            req.user.schoolId ||
            req.user.school_id;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const existing =
            await termModel.findTermById(
                id,
                schoolId
            );


        if (!existing) {

            return res.status(404).json({

                success: false,

                message:
                    "Term not found."

            });

        }


        const term =
            await termModel.deleteTerm(
                id,
                schoolId
            );


        if (!term) {

            return res.status(404).json({

                success: false,

                message:
                    "Term not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Term deleted successfully.",

            data: term

        });

    } catch (error) {

        console.error(
            "Delete term error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

module.exports = {

    getTerms,

    getTermById,

    createTerm,

    updateTerm,

    deleteTerm

};