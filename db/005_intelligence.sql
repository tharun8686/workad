CREATE TABLE IF NOT EXISTS workforce_outcomes (
 id text PRIMARY KEY, owner_id text NOT NULL, decision_id text NOT NULL REFERENCES decisions(id),
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outcomes_owner_idx ON workforce_outcomes(owner_id,decision_id);
CREATE TABLE IF NOT EXISTS pay_policies (
 id text PRIMARY KEY, owner_id text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pay_owner_idx ON pay_policies(owner_id);
CREATE INDEX IF NOT EXISTS talent_embedding_idx ON talent_records USING hnsw (embedding vector_cosine_ops);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['workforce_outcomes','pay_policies'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('DROP POLICY IF EXISTS tenant_access ON %I',t);
 EXECUTE format('CREATE POLICY tenant_access ON %I USING(owner_id=current_setting(''app.user_id'',true)) WITH CHECK(owner_id=current_setting(''app.user_id'',true))',t);
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='workforce_runtime') THEN
 EXECUTE format('GRANT SELECT,INSERT ON %I TO workforce_runtime',t);
 END IF;
 END LOOP;
END $$;
DROP TRIGGER IF EXISTS outcomes_immutable ON workforce_outcomes;
CREATE TRIGGER outcomes_immutable BEFORE UPDATE OR DELETE ON workforce_outcomes FOR EACH ROW EXECUTE FUNCTION reject_audit_change();
INSERT INTO schema_migrations(version) VALUES('005') ON CONFLICT DO NOTHING;
