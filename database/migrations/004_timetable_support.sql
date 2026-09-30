BEGIN;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    academic_session_id UUID NOT NULL
        REFERENCES academic_sessions(id)
        ON DELETE CASCADE,

    class_id UUID NOT NULL
        REFERENCES classes(id)
        ON DELETE CASCADE,

    class_arm_id UUID
        REFERENCES class_arms(id)
        ON DELETE SET NULL,

    subject_id UUID NOT NULL
        REFERENCES subjects(id)
        ON DELETE CASCADE,

    teacher_id UUID
        REFERENCES staff(id)
        ON DELETE SET NULL,

    day_of_week VARCHAR(20) NOT NULL
        CHECK (
            day_of_week IN (
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday'
            )
        ),

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    room VARCHAR(100),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_timetable_school
ON timetable (school_id);

CREATE INDEX IF NOT EXISTS idx_timetable_academic_session
ON timetable (academic_session_id);

CREATE INDEX IF NOT EXISTS idx_timetable_class
ON timetable (class_id);

CREATE INDEX IF NOT EXISTS idx_timetable_class_arm
ON timetable (class_arm_id);

CREATE INDEX IF NOT EXISTS idx_timetable_subject
ON timetable (subject_id);

CREATE INDEX IF NOT EXISTS idx_timetable_teacher
ON timetable (teacher_id);

CREATE INDEX IF NOT EXISTS idx_timetable_day
ON timetable (day_of_week);

DROP TRIGGER IF EXISTS trg_timetable_updated_at
ON timetable;

CREATE TRIGGER trg_timetable_updated_at
BEFORE UPDATE ON timetable
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;
