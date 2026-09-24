"use strict";

const guardianModel = require("../models/guardianModel");

function resolveSchoolId(req) {
return (
req.user?.schoolId ||
req.user?.school_id ||
req.body?.schoolId ||
req.query?.schoolId ||
null
);
}

async function createGuardian(req, res, next) {
try {
const schoolId = resolveSchoolId(req);

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    const guardian = await guardianModel.createGuardian({
        ...req.body,
        schoolId
    });

    return res.status(201).json({
        success: true,
        message: "Guardian created successfully.",
        data: guardian
    });
} catch (error) {
    return next(error);
}

}

async function getGuardians(req, res, next) {
try {
const schoolId = resolveSchoolId(req);

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    const limit = Number(req.query.limit) || 100;
    const offset = Number(req.query.offset) || 0;

    const guardians = await guardianModel.findGuardians({
        schoolId,
        limit,
        offset
    });

    return res.status(200).json({
        success: true,
        data: guardians,
        count: guardians.length
    });
} catch (error) {
    return next(error);
}

}

async function getGuardianById(req, res, next) {
try {
const schoolId = resolveSchoolId(req);
const guardianId = req.params.id;

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    if (!guardianId) {
        return res.status(400).json({
            success: false,
            message: "Guardian ID is required."
        });
    }

    const guardian = await guardianModel.findGuardianById(
        guardianId,
        schoolId
    );

    if (!guardian) {
        return res.status(404).json({
            success: false,
            message: "Guardian not found."
        });
    }

    return res.status(200).json({
        success: true,
        data: guardian
    });
} catch (error) {
    return next(error);
}

}

async function getGuardiansByStudent(req, res, next) {
try {
const schoolId = resolveSchoolId(req);
const studentId = req.params.studentId;

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: "Student ID is required."
        });
    }

    const guardians = await guardianModel.getStudentGuardians(
        studentId,
        schoolId
    );

    return res.status(200).json({
        success: true,
        data: guardians,
        count: guardians.length
    });
} catch (error) {
    return next(error);
}

}

async function searchGuardians(req, res, next) {
try {
const schoolId = resolveSchoolId(req);

    const searchTerm =
        req.query.q ||
        req.query.search ||
        req.query.term ||
        "";

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    const guardians = await guardianModel.searchGuardians(
        searchTerm,
        schoolId
    );

    return res.status(200).json({
        success: true,
        data: guardians,
        count: guardians.length
    });
} catch (error) {
    return next(error);
}

}

async function updateGuardian(req, res, next) {
try {
const schoolId = resolveSchoolId(req);
const guardianId = req.params.id;

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    if (!guardianId) {
        return res.status(400).json({
            success: false,
            message: "Guardian ID is required."
        });
    }

    const guardian = await guardianModel.updateGuardian(
        guardianId,
        schoolId,
        req.body
    );

    if (!guardian) {
        return res.status(404).json({
            success: false,
            message: "Guardian not found."
        });
    }

    return res.status(200).json({
        success: true,
        message: "Guardian updated successfully.",
        data: guardian
    });
} catch (error) {
    return next(error);
}

}

async function deleteGuardian(req, res, next) {
try {
const schoolId = resolveSchoolId(req);
const guardianId = req.params.id;

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    if (!guardianId) {
        return res.status(400).json({
            success: false,
            message: "Guardian ID is required."
        });
    }

    const deleted = await guardianModel.deleteGuardian(
        guardianId,
        schoolId
    );

    if (!deleted) {
        return res.status(404).json({
            success: false,
            message: "Guardian not found."
        });
    }

    return res.status(200).json({
        success: true,
        message: "Guardian deleted successfully."
    });
} catch (error) {
    return next(error);
}

}

async function linkGuardianToStudent(req, res, next) {
try {
const schoolId = resolveSchoolId(req);

    const guardianId =
        req.body.guardianId ||
        req.body.guardian_id;

    const studentId =
        req.body.studentId ||
        req.body.student_id;

    let isPrimary = false;

    if (req.body.isPrimary !== undefined) {
        isPrimary = Boolean(req.body.isPrimary);
    } else if (req.body.is_primary !== undefined) {
        isPrimary = Boolean(req.body.is_primary);
    }

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    if (!guardianId) {
        return res.status(400).json({
            success: false,
            message: "Guardian ID is required."
        });
    }

    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: "Student ID is required."
        });
    }

    const relationship = await guardianModel.linkGuardianToStudent({
        studentId,
        guardianId,
        isPrimary
    });

    return res.status(201).json({
        success: true,
        message: "Guardian linked to student successfully.",
        data: relationship
    });
} catch (error) {
    return next(error);
}

}

async function unlinkGuardianFromStudent(req, res, next) {
try {
const schoolId = resolveSchoolId(req);

    const guardianId =
        req.body.guardianId ||
        req.body.guardian_id;

    const studentId =
        req.body.studentId ||
        req.body.student_id;

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    if (!guardianId) {
        return res.status(400).json({
            success: false,
            message: "Guardian ID is required."
        });
    }

    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: "Student ID is required."
        });
    }

    const removed = await guardianModel.unlinkGuardianFromStudent({
        studentId,
        guardianId
    });

    if (!removed) {
        return res.status(404).json({
            success: false,
            message: "Guardian-student relationship not found."
        });
    }

    return res.status(200).json({
        success: true,
        message: "Guardian unlinked from student successfully."
    });
} catch (error) {
    return next(error);
}

}

async function getGuardianStudents(req, res, next) {
try {
const schoolId = resolveSchoolId(req);
const guardianId =
req.params.guardianId ||
req.params.id;

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    if (!guardianId) {
        return res.status(400).json({
            success: false,
            message: "Guardian ID is required."
        });
    }

    const students = await guardianModel.getGuardianStudents(
        guardianId,
        schoolId
    );

    return res.status(200).json({
        success: true,
        data: students,
        count: students.length
    });
} catch (error) {
    return next(error);
}

}

async function setPrimaryGuardian(req, res, next) {
try {
const schoolId = resolveSchoolId(req);

    const guardianId =
        req.body.guardianId ||
        req.body.guardian_id;

    const studentId =
        req.body.studentId ||
        req.body.student_id;

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    if (!guardianId) {
        return res.status(400).json({
            success: false,
            message: "Guardian ID is required."
        });
    }

    if (!studentId) {
        return res.status(400).json({
            success: false,
            message: "Student ID is required."
        });
    }

    const relationship = await guardianModel.setPrimaryGuardian({
        studentId,
        guardianId,
        schoolId
    });

    return res.status(200).json({
        success: true,
        message: "Primary guardian updated successfully.",
        data: relationship
    });
} catch (error) {
    return next(error);
}

}

async function countGuardians(req, res, next) {
try {
const schoolId = resolveSchoolId(req);

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    const count = await guardianModel.countGuardians(schoolId);

    return res.status(200).json({
        success: true,
        data: {
            count
        }
    });
} catch (error) {
    return next(error);
}

}

async function getGuardianRelationshipStats(req, res, next) {
try {
const schoolId = resolveSchoolId(req);

    if (!schoolId) {
        return res.status(400).json({
            success: false,
            message: "School ID is required."
        });
    }

    const stats =
        await guardianModel.getGuardianRelationshipStats(schoolId);

    return res.status(200).json({
        success: true,
        data: stats
    });
} catch (error) {
    return next(error);
}

}

module.exports = {
createGuardian,
getGuardians,
getGuardianById,
getGuardiansByStudent,
searchGuardians,
updateGuardian,
deleteGuardian,
linkGuardianToStudent,
unlinkGuardianFromStudent,
getGuardianStudents,
setPrimaryGuardian,
countGuardians,
getGuardianRelationshipStats
};
