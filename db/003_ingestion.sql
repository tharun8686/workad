CREATE TABLE IF NOT EXISTS import_batches (
 id text PRIMARY KEY, owner_id text NOT NULL, source_name text NOT NULL,
 checksum text NOT NULL, observed_at timestamptz NOT NULL, imported_at timestamptz NOT NULL DEFAULT now(),
 record_count integer NOT NULL, authority text NOT NULL, UNIQUE(owner_id,checksum)
);
CREATE TABLE IF NOT EXISTS talent_records (
 id text PRIMARY KEY, owner_id text NOT NULL, external_id text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('employee','candidate','contractor')),
 payload jsonb NOT NULL, batch_id text NOT NULL REFERENCES import_batches(id),
 embedding vector(1536), embedding_model text, embedding_hash text,
 updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(owner_id,kind,external_id)
);
CREATE INDEX IF NOT EXISTS talent_owner_idx ON talent_records(owner_id);
CREATE INDEX IF NOT EXISTS talent_batch_idx ON talent_records(batch_id);
CREATE TABLE IF NOT EXISTS source_documents (
 id text PRIMARY KEY, owner_id text NOT NULL, filename text NOT NULL, mime text NOT NULL,
 checksum text NOT NULL, content bytea NOT NULL, extracted jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(owner_id,checksum)
);
CREATE TABLE IF NOT EXISTS resource_reservations (
 person_id text PRIMARY KEY REFERENCES talent_records(id), requirement_id text NOT NULL REFERENCES requirements(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reservations_requirement_idx ON resource_reservations(requirement_id);
CREATE TABLE IF NOT EXISTS integration_runs (
 id text PRIMARY KEY, owner_id text NOT NULL, provider text NOT NULL, status text NOT NULL,
 details jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS market_observations (
 id text PRIMARY KEY, owner_id text NOT NULL, provider text NOT NULL, query text NOT NULL,
 payload jsonb NOT NULL, retrieved_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_runs (
 id text PRIMARY KEY, owner_id text NOT NULL, purpose text NOT NULL, model text NOT NULL,
 input_hash text NOT NULL, output jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['import_batches','talent_records','source_documents','integration_runs','market_observations','ai_runs'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('DROP POLICY IF EXISTS tenant_access ON %I',t);
 EXECUTE format('CREATE POLICY tenant_access ON %I USING(owner_id=current_setting(''app.user_id'',true)) WITH CHECK(owner_id=current_setting(''app.user_id'',true))',t);
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='workforce_runtime') THEN
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I TO workforce_runtime',t);
 END IF;
 END LOOP;
END $$;
INSERT INTO schema_migrations(version) VALUES('003') ON CONFLICT DO NOTHING;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='workforce_runtime') THEN
 GRANT INSERT,UPDATE ON data_sources,skills TO workforce_runtime;
 GRANT SELECT,INSERT,DELETE ON resource_reservations TO workforce_runtime;
END IF; END $$;
ALTER TABLE resource_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reservation_access ON resource_reservations;
CREATE POLICY reservation_access ON resource_reservations USING(EXISTS(SELECT 1 FROM requirements WHERE id=requirement_id)) WITH CHECK(EXISTS(SELECT 1 FROM requirements WHERE id=requirement_id));
