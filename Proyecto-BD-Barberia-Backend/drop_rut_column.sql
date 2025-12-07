-- Drop RUT column from LTEB_BARBERO table
-- This script removes the RUT column which is no longer needed

ALTER TABLE LTEB_BARBERO DROP COLUMN RUT;

COMMIT;

EXIT;
