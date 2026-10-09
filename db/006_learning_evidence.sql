CREATE TABLE IF NOT EXISTS course_events (
 id text PRIMARY KEY, owner_id text NOT NULL, decision_id text NOT NULL REFERENCES decisions(id),
 event_key text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,event_key)
);
CREATE INDEX IF NOT EXISTS course_events_owner_idx ON course_events(owner_id,decision_id);
ALTER TABLE course_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access ON course_events;
CREATE POLICY tenant_access ON course_events USING(owner_id=current_setting('app.user_id',true)) WITH CHECK(owner_id=current_setting('app.user_id',true));
DROP TRIGGER IF EXISTS course_events_immutable ON course_events;
CREATE TRIGGER course_events_immutable BEFORE UPDATE OR DELETE ON course_events FOR EACH ROW EXECUTE FUNCTION reject_audit_change();
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='workforce_runtime') THEN GRANT SELECT,INSERT ON course_events TO workforce_runtime; END IF; END $$;
INSERT INTO schema_migrations(version) VALUES('006') ON CONFLICT DO NOTHING;
