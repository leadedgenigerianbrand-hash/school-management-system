"use strict";

const schoolSettingModel =
    require("../models/schoolSettingModel");


/*
===============================================================================
 SCHOOL SETTINGS CONTROLLER
===============================================================================

Handles school-wide settings.

The authenticated user's school is the authoritative school context.

The client must NOT be able to select another school through a submitted
schoolId.
===============================================================================
*/


/*
===============================================================================
 SCHOOL RESOLUTION
===============================================================================
*/

function resolveSchoolId(req) {

    return (
        req.user?.schoolId ||
        req.user?.school_id ||
        null
    );
}


/*
===============================================================================
 GET SETTINGS
===============================================================================

GET /api/school-settings
===============================================================================
*/

async function getSchoolSettings(
    req,
    res,
    next
) {

    try {

        const schoolId =
            resolveSchoolId(req);

        if (!schoolId) {

            const error =
                new Error(
                    "School context is required."
                );

            error.statusCode = 400;

            throw error;
        }

        const settings =
            await schoolSettingModel
                .getOrCreateSchoolSettings(
                    schoolId
                );

        return res.status(200).json({

            success: true,

            data: settings

        });

    } catch (error) {

        return next(error);

    }

}


/*
===============================================================================
 UPDATE SETTINGS
===============================================================================

PUT /api/school-settings
===============================================================================
*/

async function updateSchoolSettings(
    req,
    res,
    next
) {

    try {

        const schoolId =
            resolveSchoolId(req);

        if (!schoolId) {

            const error =
                new Error(
                    "School context is required."
                );

            error.statusCode = 400;

            throw error;
        }

        const settings =
            await schoolSettingModel
                .updateSchoolSettings(
                    schoolId,
                    req.body || {}
                );

        return res.status(200).json({

            success: true,

            message:
                "School settings updated successfully.",

            data: settings

        });

    } catch (error) {

        return next(error);

    }

}


/*
===============================================================================
 RESET SETTINGS
===============================================================================

POST /api/school-settings/reset
===============================================================================
*/

async function resetSchoolSettings(
    req,
    res,
    next
) {

    try {

        const schoolId =
            resolveSchoolId(req);

        if (!schoolId) {

            const error =
                new Error(
                    "School context is required."
                );

            error.statusCode = 400;

            throw error;
        }

        const settings =
            await schoolSettingModel
                .resetSchoolSettings(
                    schoolId
                );

        return res.status(200).json({

            success: true,

            message:
                "School settings restored to defaults.",

            data: settings

        });

    } catch (error) {

        return next(error);

    }

}


/*
===============================================================================
 EXPORT
===============================================================================
*/

module.exports = {

    getSchoolSettings,

    updateSchoolSettings,

    resetSchoolSettings

};