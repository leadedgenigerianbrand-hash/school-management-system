BEGIN;

ALTER TABLE announcements
    DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;

ALTER TABLE announcements
    ADD CONSTRAINT announcements_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE SET NULL;

COMMIT;
