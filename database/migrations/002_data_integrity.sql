BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_students_school_student_number
ON students (school_id, student_number)
WHERE student_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_school_staff_number
ON staff (school_id, staff_number)
WHERE staff_number IS NOT NULL;

COMMIT;