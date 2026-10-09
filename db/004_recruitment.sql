CREATE TABLE IF NOT EXISTS talent_profiles (
 id text PRIMARY KEY, owner_id text NOT NULL, payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS recruitment_jobs (
 id text PRIMARY KEY, owner_id text NOT NULL, requirement_id text REFERENCES requirements(id),
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS recruitment_applications (
 id text PRIMARY KEY, owner_id text NOT NULL, job_id text NOT NULL REFERENCES recruitment_jobs(id),
 profile_id text NOT NULL REFERENCES talent_profiles(id), payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(job_id,profile_id)
);
CREATE TABLE IF NOT EXISTS recruitment_events (
 id text PRIMARY KEY, owner_id text NOT NULL, application_id text NOT NULL REFERENCES recruitment_applications(id),
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS profile_invitations (
 token_hash text PRIMARY KEY, owner_id text NOT NULL, expires_at timestamptz NOT NULL,
 used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['talent_profiles','recruitment_jobs','recruitment_applications','recruitment_events','profile_invitations'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('DROP POLICY IF EXISTS tenant_access ON %I',t);
 EXECUTE format('CREATE POLICY tenant_access ON %I USING(owner_id=current_setting(''app.user_id'',true)) WITH CHECK(owner_id=current_setting(''app.user_id'',true))',t);
 EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(owner_id)',t||'_owner_idx',t);
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='workforce_runtime') THEN
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I TO workforce_runtime',t);
 END IF;
 END LOOP;
END $$;
-- A one-use invitation accepts only a new consented profile; it never grants read access.
CREATE OR REPLACE FUNCTION submit_invited_profile(invitation_hash text, profile_id text, profile_payload jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE owner_key text; BEGIN
 UPDATE profile_invitations SET used_at=now()
 WHERE token_hash=invitation_hash AND used_at IS NULL AND expires_at>now() RETURNING owner_id INTO owner_key;
 IF owner_key IS NULL THEN RAISE EXCEPTION 'Invitation unavailable'; END IF;
 INSERT INTO talent_profiles(id,owner_id,payload) VALUES(profile_id,owner_key,profile_payload);
 RETURN profile_id;
END $$;
REVOKE ALL ON FUNCTION submit_invited_profile(text,text,jsonb) FROM PUBLIC;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='workforce_runtime') THEN
 GRANT EXECUTE ON FUNCTION submit_invited_profile(text,text,jsonb) TO workforce_runtime;
END IF; END $$;
INSERT INTO schema_migrations(version) VALUES('004') ON CONFLICT DO NOTHING;
