BEGIN;

CREATE INDEX IF NOT EXISTS idx_students_school_id
ON students (school_id);

CREATE INDEX IF NOT EXISTS idx_students_student_number
ON students (student_number);

CREATE INDEX IF NOT EXISTS idx_students_class_id
ON students (class_id);

CREATE INDEX IF NOT EXISTS idx_students_class_arm_id
ON students (class_arm_id);

CREATE INDEX IF NOT EXISTS idx_staff_school_id
ON staff (school_id);

CREATE INDEX IF NOT EXISTS idx_staff_department_id
ON staff (department_id);

CREATE INDEX IF NOT EXISTS idx_guardians_school_id
ON guardians (school_id);

CREATE INDEX IF NOT EXISTS idx_attendance_school_id
ON attendance (school_id);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id
ON attendance (student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_class_id
ON attendance (class_id);

CREATE INDEX IF NOT EXISTS idx_fees_school_id
ON fees (school_id);

CREATE INDEX IF NOT EXISTS idx_fees_student_id
ON fees (student_id);

CREATE INDEX IF NOT EXISTS idx_results_school_id
ON results (school_id);

CREATE INDEX IF NOT EXISTS idx_results_student_id
ON results (student_id);

CREATE INDEX IF NOT EXISTS idx_results_class_id
ON results (class_id);

CREATE INDEX IF NOT EXISTS idx_results_subject_id
ON results (subject_id);

CREATE INDEX IF NOT EXISTS idx_classes_school_id
ON classes (school_id);

CREATE INDEX IF NOT EXISTS idx_class_arms_school_id
ON class_arms (school_id);

CREATE INDEX IF NOT EXISTS idx_class_arms_class_id
ON class_arms (class_id);

CREATE INDEX IF NOT EXISTS idx_subjects_school_id
ON subjects (school_id);

CREATE INDEX IF NOT EXISTS idx_departments_school_id
ON departments (school_id);

CREATE INDEX IF NOT EXISTS idx_academic_sessions_school_id
ON academic_sessions (school_id);

CREATE INDEX IF NOT EXISTS idx_terms_school_id
ON terms (school_id);

CREATE INDEX IF NOT EXISTS idx_documents_school_id
ON documents (school_id);

CREATE INDEX IF NOT EXISTS idx_documents_student_id
ON documents (student_id);

CREATE INDEX IF NOT EXISTS idx_documents_staff_id
ON documents (staff_id);

COMMIT;