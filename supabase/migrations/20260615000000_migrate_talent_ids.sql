-- Migrate all existing talent IDs to the new format: ETHNICITY-GENDER-XX
-- where XX is 2 random uppercase alphanumeric characters (A-Z, 0-9).
-- Run once in the Supabase SQL Editor.

DO $$
DECLARE
  rec         RECORD;
  eth_code    TEXT;
  gen_code    TEXT;
  new_id      TEXT;
  existing    INT;
  chars       TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  attempts    INT;
BEGIN
  FOR rec IN
    SELECT id, ethnicity, gender FROM talents ORDER BY position NULLS LAST
  LOOP
    eth_code := CASE rec.ethnicity
      WHEN 'Malay'         THEN 'MY'
      WHEN 'Chinese'       THEN 'CN'
      WHEN 'Indian'        THEN 'IN'
      WHEN 'Iban'          THEN 'IB'
      WHEN 'Kadazan-Dusun' THEN 'KD'
      ELSE 'OT'
    END;

    gen_code := CASE WHEN rec.gender = 'F' THEN 'F' ELSE 'M' END;

    -- Generate a unique 2-char random alphanumeric suffix, retry on collision
    attempts := 0;
    LOOP
      new_id := eth_code || '-' || gen_code || '-' ||
                substr(chars, floor(random() * 36)::int + 1, 1) ||
                substr(chars, floor(random() * 36)::int + 1, 1);

      SELECT COUNT(*) INTO existing FROM talents WHERE id = new_id;
      EXIT WHEN existing = 0;

      attempts := attempts + 1;
      IF attempts > 100 THEN
        RAISE EXCEPTION 'Could not find a unique ID for talent % after 100 attempts', rec.id;
      END IF;
    END LOOP;

    UPDATE talents SET id = new_id WHERE id = rec.id;
    RAISE NOTICE '% → %', rec.id, new_id;
  END LOOP;
END $$;
