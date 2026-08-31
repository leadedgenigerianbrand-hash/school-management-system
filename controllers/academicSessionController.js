const academicSessionModel = require("../models/academicSessionModel");


/*
|--------------------------------------------------------------------------
Academic Session Controller
|--------------------------------------------------------------------------

Handles:

- Create academic session
- Get all academic sessions
- Get academic session by ID
- Get current/active session
- Get upcoming sessions
- Get completed sessions
- Update academic session
- Rename academic session
- Activate academic session
- Set session as upcoming
- Complete academic session
- Update session dates
- Delete academic session
- Search academic sessions
- Get session statistics
- Get session with terms

|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
Get School ID
|--------------------------------------------------------------------------

The school ID can come from:

1. Authenticated user
2. Request body
3. Query string

|--------------------------------------------------------------------------
*/

function getSchoolId(req) {

    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        req.body?.schoolId ||
        req.query?.schoolId
    );

}


/*
|--------------------------------------------------------------------------
Create Academic Session
|--------------------------------------------------------------------------
*/

async function createAcademicSession(req, res, next) {

    try {

        const schoolId = getSchoolId(req);


        const {
            sessionName,
            sessionCode,
            startDate,
            endDate,
            description,
            status
        } = req.body;


        /*
        |--------------------------------------------------------------------------
        | Validate School
        |--------------------------------------------------------------------------
        */

        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | Validate Session Name
        |--------------------------------------------------------------------------
        */

        if (
            !sessionName ||
            typeof sessionName !== "string" ||
            !sessionName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session name is required."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | Create Session
        |--------------------------------------------------------------------------
        */

        const session =
            await academicSessionModel.createAcademicSession({

                schoolId,

                sessionName:
                    sessionName.trim(),

                sessionCode:
                    sessionCode || null,

                startDate:
                    startDate || null,

                endDate:
                    endDate || null,

                description:
                    description || null,

                status:
                    status || "upcoming"

            });


        return res.status(201).json({

            success: true,

            message:
                "Academic session created successfully.",

            data: session

        });


    } catch (error) {

        console.error(
            "Create academic session error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Get Academic Sessions
|--------------------------------------------------------------------------
*/

async function getAcademicSessions(req, res, next) {

    try {

        const schoolId = getSchoolId(req);


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const {
            status,
            limit = 100,
            offset = 0
        } = req.query;


        /*
        |--------------------------------------------------------------------------
        | Validate Pagination
        |--------------------------------------------------------------------------
        */

        const parsedLimit =
            Number.parseInt(limit, 10);

        const parsedOffset =
            Number.parseInt(offset, 10);


        if (
            Number.isNaN(parsedLimit) ||
            parsedLimit < 1
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Limit must be a positive number."

            });

        }


        if (
            Number.isNaN(parsedOffset) ||
            parsedOffset < 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Offset must be zero or greater."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | Find Sessions
        |--------------------------------------------------------------------------
        */

        const sessions =
            await academicSessionModel.findAcademicSessionsBySchool(

                schoolId,

                {

                    status:
                        status || null

                }

            );


        /*
        |--------------------------------------------------------------------------
        | Apply Pagination
        |--------------------------------------------------------------------------
        |
        | The current model method does not accept limit/offset.
        | Therefore pagination is safely applied here.
        |
        |--------------------------------------------------------------------------
        */

        const paginatedSessions =
            sessions.slice(
                parsedOffset,
                parsedOffset + parsedLimit
            );


        return res.status(200).json({

            success: true,

            count:
                paginatedSessions.length,

            total:
                sessions.length,

            limit:
                parsedLimit,

            offset:
                parsedOffset,

            data:
                paginatedSessions

        });


    } catch (error) {

        console.error(
            "Get academic sessions error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Get Academic Session By ID
|--------------------------------------------------------------------------
*/

async function getAcademicSessionById(req, res, next) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        const session =
            await academicSessionModel.findAcademicSessionById(

                id,

                schoolId

            );


        if (!session) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                session

        });


    } catch (error) {

        console.error(
            "Get academic session by ID error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Get Current Academic Session
|--------------------------------------------------------------------------
*/

async function getCurrentAcademicSession(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const session =
            await academicSessionModel.findCurrentSession(

                schoolId

            );


        if (!session) {

            return res.status(404).json({

                success: false,

                message:
                    "No current academic session has been set."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                session

        });


    } catch (error) {

        console.error(
            "Get current academic session error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Get Upcoming Academic Sessions
|--------------------------------------------------------------------------
*/

async function getUpcomingAcademicSessions(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const sessions =
            await academicSessionModel.findUpcomingSessions(

                schoolId

            );


        return res.status(200).json({

            success: true,

            count:
                sessions.length,

            data:
                sessions

        });


    } catch (error) {

        console.error(
            "Get upcoming academic sessions error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Get Completed Academic Sessions
|--------------------------------------------------------------------------
*/

async function getCompletedAcademicSessions(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        const sessions =
            await academicSessionModel.findCompletedSessions(

                schoolId

            );


        return res.status(200).json({

            success: true,

            count:
                sessions.length,

            data:
                sessions

        });


    } catch (error) {

        console.error(
            "Get completed academic sessions error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Update Academic Session
|--------------------------------------------------------------------------
*/

async function updateAcademicSession(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        const {
            sessionName,
            sessionCode,
            startDate,
            endDate,
            description,
            status
        } = req.body;


        /*
        |--------------------------------------------------------------------------
        | First retrieve the existing session.
        |--------------------------------------------------------------------------
        |
        | This allows partial updates while keeping the model's update
        | method compatible with the database.
        |
        |--------------------------------------------------------------------------
        */

        const existingSession =
            await academicSessionModel.findAcademicSessionById(

                id,

                schoolId

            );


        if (!existingSession) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        const finalSessionName =
            sessionName !== undefined
                ? sessionName
                : existingSession.session_name;


        if (
            !finalSessionName ||
            typeof finalSessionName !== "string" ||
            !finalSessionName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session name is required."

            });

        }


        const session =
            await academicSessionModel.updateAcademicSession(

                id,

                schoolId,

                {

                    sessionName:
                        finalSessionName.trim(),

                    sessionCode:
                        sessionCode !== undefined
                            ? sessionCode
                            : existingSession.session_code,

                    startDate:
                        startDate !== undefined
                            ? startDate
                            : existingSession.start_date,

                    endDate:
                        endDate !== undefined
                            ? endDate
                            : existingSession.end_date,

                    description:
                        description !== undefined
                            ? description
                            : existingSession.description,

                    status:
                        status !== undefined
                            ? status
                            : existingSession.status

                }

            );


        if (!session) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Academic session updated successfully.",

            data:
                session

        });


    } catch (error) {

        console.error(
            "Update academic session error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Rename Academic Session
|--------------------------------------------------------------------------
*/

async function renameAcademicSession(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;

        const {
            sessionName,
            newName
        } = req.body;


        const finalName =
            newName ||
            sessionName;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        if (
            !finalName ||
            typeof finalName !== "string" ||
            !finalName.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New session name is required."

            });

        }


        const session =
            await academicSessionModel.renameAcademicSession(

                id,

                schoolId,

                finalName.trim()

            );


        if (!session) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Academic session renamed successfully.",

            data:
                session

        });


    } catch (error) {

        console.error(
            "Rename academic session error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Set Current / Activate Academic Session
|--------------------------------------------------------------------------
*/

async function setCurrentAcademicSession(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        const session =
            await academicSessionModel.activateSession(

                id,

                schoolId

            );


        if (!session) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Current academic session updated successfully.",

            data:
                session

        });


    } catch (error) {

        console.error(
            "Set current academic session error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Set Academic Session As Upcoming
|--------------------------------------------------------------------------
*/

async function setAcademicSessionUpcoming(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        const session =
            await academicSessionModel.setSessionUpcoming(

                id,

                schoolId

            );


        if (!session) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Academic session set as upcoming successfully.",

            data:
                session

        });


    } catch (error) {

        console.error(
            "Set academic session upcoming error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Complete Academic Session
|--------------------------------------------------------------------------
*/

async function completeAcademicSession(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        const session =
            await academicSessionModel.completeSession(

                id,

                schoolId

            );


        if (!session) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Academic session completed successfully.",

            data:
                session

        });


    } catch (error) {

        console.error(
            "Complete academic session error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Update Academic Session Dates
|--------------------------------------------------------------------------
*/

async function updateAcademicSessionDates(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;

        const {
            startDate,
            endDate
        } = req.body;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        if (!startDate) {

            return res.status(400).json({

                success: false,

                message:
                    "Start date is required."

            });

        }


        if (!endDate) {

            return res.status(400).json({

                success: false,

                message:
                    "End date is required."

            });

        }


        if (
            new Date(startDate) > new Date(endDate)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Start date cannot be after end date."

            });

        }


        const session =
            await academicSessionModel.updateSessionDates(

                id,

                schoolId,

                startDate,

                endDate

            );


        if (!session) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Academic session dates updated successfully.",

            data:
                session

        });


    } catch (error) {

        console.error(
            "Update academic session dates error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Delete Academic Session
|--------------------------------------------------------------------------
*/

async function deleteAcademicSession(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        const session =
            await academicSessionModel.deleteAcademicSession(

                id,

                schoolId

            );


        if (!session) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Academic session deleted successfully.",

            data:
                session

        });


    } catch (error) {

        console.error(
            "Delete academic session error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Search Academic Sessions
|--------------------------------------------------------------------------
*/

async function searchAcademicSessions(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            q,
            search
        } = req.query;


        const searchTerm =
            (
                q ||
                search ||
                ""
            ).trim();


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!searchTerm) {

            return res.status(400).json({

                success: false,

                message:
                    "Search term is required."

            });

        }


        const sessions =
            await academicSessionModel.searchAcademicSessions(

                searchTerm,

                schoolId

            );


        return res.status(200).json({

            success: true,

            count:
                sessions.length,

            data:
                sessions

        });


    } catch (error) {

        console.error(
            "Search academic sessions error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Get Academic Session Statistics
|--------------------------------------------------------------------------
*/

async function getAcademicSessionStatistics(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        const statistics =
            await academicSessionModel.getSessionStatistics(

                id,

                schoolId

            );


        if (!statistics) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        return res.status(200).json({

            success: true,

            data:
                statistics

        });


    } catch (error) {

        console.error(
            "Get academic session statistics error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
Get Academic Session With Terms
|--------------------------------------------------------------------------
*/

async function getAcademicSessionWithTerms(
    req,
    res,
    next
) {

    try {

        const schoolId = getSchoolId(req);

        const {
            id
        } = req.params;


        if (!schoolId) {

            return res.status(400).json({

                success: false,

                message:
                    "School ID is required."

            });

        }


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Academic session ID is required."

            });

        }


        const rows =
            await academicSessionModel.getSessionWithTerms(

                id,

                schoolId

            );


        if (!rows.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Academic session not found."

            });

        }


        /*
        |--------------------------------------------------------------------------
        | Convert flat SQL rows into a cleaner API response.
        |--------------------------------------------------------------------------
        */

        const firstRow =
            rows[0];


        const terms =
            rows
                .filter(
                    row => row.term_id !== null
                )
                .map(
                    row => ({

                        id:
                            row.term_id,

                        termName:
                            row.term_name,

                        termCode:
                            row.term_code,

                        startDate:
                            row.term_start_date,

                        endDate:
                            row.term_end_date,

                        status:
                            row.term_status

                    })
                );


        return res.status(200).json({

            success: true,

            data: {

                id:
                    firstRow.session_id,

                sessionName:
                    firstRow.session_name,

                sessionCode:
                    firstRow.session_code,

                startDate:
                    firstRow.session_start_date,

                endDate:
                    firstRow.session_end_date,

                status:
                    firstRow.session_status,

                terms

            }

        });


    } catch (error) {

        console.error(
            "Get academic session with terms error:",
            error
        );

        next(error);

    }

}


/*
|--------------------------------------------------------------------------
EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    createAcademicSession,

    getAcademicSessions,

    getAcademicSessionById,

    getCurrentAcademicSession,

    getUpcomingAcademicSessions,

    getCompletedAcademicSessions,

    updateAcademicSession,

    renameAcademicSession,

    setCurrentAcademicSession,

    setAcademicSessionUpcoming,

    completeAcademicSession,

    updateAcademicSessionDates,

    deleteAcademicSession,

    searchAcademicSessions,

    getAcademicSessionStatistics,

    getAcademicSessionWithTerms

};
