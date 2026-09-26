BEGIN;

ALTER TABLE attendance
    ALTER COLUMN student_id DROP NOT NULL;

ALTER TABLE attendance
    ADD COLUMN IF NOT EXISTS staff_id UUID
        REFERENCES staff(id)
        ON DELETE CASCADE;

ALTER TABLE attendance
    ADD COLUMN IF NOT EXISTS attendance_method VARCHAR(30)
        NOT NULL DEFAULT 'Manual';

ALTER TABLE attendance
    ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_attendance_staff
ON attendance (staff_id)
WHERE staff_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_staff_date
ON attendance (staff_id, attendance_date)
WHERE staff_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_staff_date
ON attendance (staff_id, attendance_date)
WHERE staff_id IS NOT NULL;

ALTER TABLE attendance
    DROP CONSTRAINT IF EXISTS attendance_person_check;

ALTER TABLE attendance
    ADD CONSTRAINT attendance_person_check
    CHECK (
        (student_id IS NOT NULL AND staff_id IS NULL)
        OR
        (student_id IS NULL AND staff_id IS NOT NULL)
    );

ALTER TABLE attendance
    DROP CONSTRAINT IF EXISTS attendance_method_check;

ALTER TABLE attendance
    ADD CONSTRAINT attendance_method_check
    CHECK (
        attendance_method IN (
            'Manual',
            'Fingerprint',
            'Device Import',
            'Admin Correction'
        )
    );

COMMIT;