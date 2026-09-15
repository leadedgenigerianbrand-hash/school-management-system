"use strict";

const academicSessionModel =
    require("../models/academicSessionModel");

function getSchoolId(req) {
    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        null
    );
}

function isValidDateRange(
    startDate,
    endDate
) {
    if (
        !startDate ||
        !endDate
    ) {
        return true;
    }

    return (
        new Date(startDate) <=
        new Date(endDate)
    );
}

function sendError(
    next,
    message,
    statusCode = 400
) {
    const error =
        new Error(message);

    error.statusCode =
        statusCode;

    return next(error);
}

async function createAcademicSession(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        const {
            sessionName,
            startDate = null,
            endDate = null,
            status = "upcoming"
        } = req.body || {};

        if (
            typeof sessionName !== "string" ||
            !sessionName.trim()
        ) {
            return sendError(
                next,
                "Academic session name is required."
            );
        }

        if (
            !isValidDateRange(
                startDate,
                endDate
            )
        ) {
            return sendError(
                next,
                "Session start date cannot be later than the end date."
            );
        }

        const session =
            await academicSessionModel.createAcademicSession(
                {
                    schoolId,
                    sessionName:
                        sessionName.trim(),
                    startDate:
                        startDate || null,
                    endDate:
                        endDate || null,
                    status:
                        status || "upcoming"
                }
            );

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

        return next(error);
    }
}

async function getAcademicSessions(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        const {
            status = null,
            limit = 100,
            offset = 0
        } = req.query;

        const parsedLimit =
            Number.parseInt(
                limit,
                10
            );

        const parsedOffset =
            Number.parseInt(
                offset,
                10
            );

        if (
            !Number.isInteger(
                parsedLimit
            ) ||
            parsedLimit < 1 ||
            parsedLimit > 500
        ) {
            return sendError(
                next,
                "Limit must be between 1 and 500."
            );
        }

        if (
            !Number.isInteger(
                parsedOffset
            ) ||
            parsedOffset < 0
        ) {
            return sendError(
                next,
                "Offset must be zero or greater."
            );
        }

        const sessions =
            await academicSessionModel.findAcademicSessionsBySchool(
                schoolId,
                {
                    status:
                        status || null
                }
            );

        const paginatedSessions =
            sessions.slice(
                parsedOffset,
                parsedOffset +
                    parsedLimit
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

        return next(error);
    }
}

async function getAcademicSessionById(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            id
        } = req.params;

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!id) {
            return sendError(
                next,
                "Academic session ID is required."
            );
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
            data: session
        });
    } catch (error) {
        console.error(
            "Get academic session by ID error:",
            error
        );

        return next(error);
    }
}

async function getCurrentAcademicSession(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
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
            data: session
        });
    } catch (error) {
        console.error(
            "Get current academic session error:",
            error
        );

        return next(error);
    }
}

async function getUpcomingAcademicSessions(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
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

        return next(error);
    }
}

async function getCompletedAcademicSessions(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
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

        return next(error);
    }
}

async function updateAcademicSession(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            id
        } = req.params;

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!id) {
            return sendError(
                next,
                "Academic session ID is required."
            );
        }

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

        const {
            sessionName,
            startDate,
            endDate,
            status
        } = req.body || {};

        const finalSessionName =
            sessionName !== undefined
                ? sessionName
                : existingSession.session_name;

        const finalStartDate =
            startDate !== undefined
                ? startDate
                : existingSession.start_date;

        const finalEndDate =
            endDate !== undefined
                ? endDate
                : existingSession.end_date;

        const finalStatus =
            status !== undefined
                ? status
                : (
                    existingSession.is_current
                        ? "active"
                        : (
                            existingSession.is_active
                                ? "upcoming"
                                : "completed"
                        )
                );

        if (
            typeof finalSessionName !==
                "string" ||
            !finalSessionName.trim()
        ) {
            return sendError(
                next,
                "Academic session name is required."
            );
        }

        if (
            !isValidDateRange(
                finalStartDate,
                finalEndDate
            )
        ) {
            return sendError(
                next,
                "Session start date cannot be later than the end date."
            );
        }

        const session =
            await academicSessionModel.updateAcademicSession(
                id,
                schoolId,
                {
                    sessionName:
                        finalSessionName.trim(),
                    startDate:
                        finalStartDate,
                    endDate:
                        finalEndDate,
                    status:
                        finalStatus
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
            data: session
        });
    } catch (error) {
        console.error(
            "Update academic session error:",
            error
        );

        return next(error);
    }
}

async function renameAcademicSession(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            id
        } = req.params;

        const {
            newName,
            sessionName
        } = req.body || {};

        const finalName =
            newName !== undefined
                ? newName
                : sessionName;

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!id) {
            return sendError(
                next,
                "Academic session ID is required."
            );
        }

        if (
            typeof finalName !==
                "string" ||
            !finalName.trim()
        ) {
            return sendError(
                next,
                "New academic session name is required."
            );
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
            data: session
        });
    } catch (error) {
        console.error(
            "Rename academic session error:",
            error
        );

        return next(error);
    }
}

async function setCurrentAcademicSession(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            id
        } = req.params;

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!id) {
            return sendError(
                next,
                "Academic session ID is required."
            );
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
            data: session
        });
    } catch (error) {
        console.error(
            "Set current academic session error:",
            error
        );

        return next(error);
    }
}

async function setAcademicSessionUpcoming(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            id
        } = req.params;

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!id) {
            return sendError(
                next,
                "Academic session ID is required."
            );
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
            data: session
        });
    } catch (error) {
        console.error(
            "Set academic session upcoming error:",
            error
        );

        return next(error);
    }
}

async function completeAcademicSession(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            id
        } = req.params;

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!id) {
            return sendError(
                next,
                "Academic session ID is required."
            );
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
            data: session
        });
    } catch (error) {
        console.error(
            "Complete academic session error:",
            error
        );

        return next(error);
    }
}

async function updateAcademicSessionDates(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            id
        } = req.params;

        const {
            startDate,
            endDate
        } = req.body || {};

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!id) {
            return sendError(
                next,
                "Academic session ID is required."
            );
        }

        if (!startDate) {
            return sendError(
                next,
                "Start date is required."
            );
        }

        if (!endDate) {
            return sendError(
                next,
                "End date is required."
            );
        }

        if (
            !isValidDateRange(
                startDate,
                endDate
            )
        ) {
            return sendError(
                next,
                "Start date cannot be after end date."
            );
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
            data: session
        });
    } catch (error) {
        console.error(
            "Update academic session dates error:",
            error
        );

        return next(error);
    }
}

async function deleteAcademicSession(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            id
        } = req.params;

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!id) {
            return sendError(
                next,
                "Academic session ID is required."
            );
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
            data: session
        });
    } catch (error) {
        console.error(
            "Delete academic session error:",
            error
        );

        return next(error);
    }
}

async function searchAcademicSessions(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            q,
            search
        } = req.query;

        const searchTerm =
            String(
                q ||
                search ||
                ""
            ).trim();

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!searchTerm) {
            return sendError(
                next,
                "Search term is required."
            );
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

        return next(error);
    }
}

async function getAcademicSessionStatistics(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            id
        } = req.params;

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!id) {
            return sendError(
                next,
                "Academic session ID is required."
            );
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
            data: statistics
        });
    } catch (error) {
        console.error(
            "Get academic session statistics error:",
            error
        );

        return next(error);
    }
}

async function getAcademicSessionWithTerms(
    req,
    res,
    next
) {
    try {
        const schoolId =
            getSchoolId(req);

        const {
            id
        } = req.params;

        if (!schoolId) {
            return sendError(
                next,
                "Authenticated school context is required.",
                401
            );
        }

        if (!id) {
            return sendError(
                next,
                "Academic session ID is required."
            );
        }

        const result =
            await academicSessionModel.getSessionWithTerms(
                id,
                schoolId
            );

        if (!result) {
            return res.status(404).json({
                success: false,
                message:
                    "Academic session not found."
            });
        }

        if (
            Array.isArray(result)
        ) {
            if (
                result.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Academic session not found."
                });
            }

            const firstRow =
                result[0];

            const terms =
                result
                    .filter(
                        row =>
                            row.term_id !== null &&
                            row.term_id !== undefined
                    )
                    .map(
                        row => ({
                            id:
                                row.term_id,
                            termName:
                                row.term_name,
                            termOrder:
                                row.term_order,
                            startDate:
                                row.term_start_date,
                            endDate:
                                row.term_end_date,
                            isCurrent:
                                row.term_is_current,
                            isActive:
                                row.term_is_active
                        })
                    );

            return res.status(200).json({
                success: true,
                data: {
                    id:
                        firstRow.session_id,
                    sessionName:
                        firstRow.session_name,
                    startDate:
                        firstRow.session_start_date,
                    endDate:
                        firstRow.session_end_date,
                    isCurrent:
                        firstRow.session_is_current,
                    isActive:
                        firstRow.session_is_active,
                    terms
                }
            });
        }

        const session =
            result.session ||
            result;

        const terms =
            Array.isArray(
                result.terms
            )
                ? result.terms.map(
                    term => ({
                        id:
                            term.id,
                        termName:
                            term.term_name ||
                            term.termName,
                        termOrder:
                            term.term_order ??
                            term.termOrder,
                        startDate:
                            term.start_date ||
                            term.startDate,
                        endDate:
                            term.end_date ||
                            term.endDate,
                        isCurrent:
                            term.is_current ??
                            term.isCurrent,
                        isActive:
                            term.is_active ??
                            term.isActive
                    })
                )
                : [];

        return res.status(200).json({
            success: true,
            data: {
                ...session,
                terms
            }
        });
    } catch (error) {
        console.error(
            "Get academic session with terms error:",
            error
        );

        return next(error);
    }
}

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