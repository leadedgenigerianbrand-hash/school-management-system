BEGIN;

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    school_id UUID NOT NULL
        REFERENCES schools(id)
        ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,

    content TEXT NOT NULL,

    type VARCHAR(100) NOT NULL DEFAULT 'General',

    priority VARCHAR(50) NOT NULL DEFAULT 'Normal',

    audience VARCHAR(100) NOT NULL DEFAULT 'All',

    is_published BOOLEAN NOT NULL DEFAULT FALSE,

    published_at TIMESTAMP NULL,

    start_date DATE NULL,

    end_date DATE NULL,

    created_by UUID NULL
        REFERENCES staff(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT announcements_date_range_check
        CHECK (
            end_date IS NULL
            OR start_date IS NULL
            OR end_date >= start_date
        )
);

CREATE INDEX IF NOT EXISTS idx_announcements_school_id
    ON announcements(school_id);

CREATE INDEX IF NOT EXISTS idx_announcements_school_published
    ON announcements(school_id, is_published);

CREATE INDEX IF NOT EXISTS idx_announcements_school_priority
    ON announcements(school_id, priority);

CREATE INDEX IF NOT EXISTS idx_announcements_school_created_at
    ON announcements(school_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_start_date
    ON announcements(start_date);

CREATE INDEX IF NOT EXISTS idx_announcements_end_date
    ON announcements(end_date);

COMMIT;
