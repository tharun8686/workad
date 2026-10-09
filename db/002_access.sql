-- Apply as the database owner after choosing the runtime database role.
-- Replace workforce_runtime with a user-owned non-superuser role. Never use the owner URL at runtime.
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='workforce_runtime') THEN CREATE ROLE workforce_runtime NOLOGIN; END IF; END $$;
GRANT USAGE ON SCHEMA public TO workforce_runtime;
GRANT SELECT ON data_sources,skills,employees,contractors,ats_candidates,employee_skills,contractor_skills,candidate_skills,locations,market_data,automation_profiles,projects,employee_projects,certifications,employee_availability,schema_migrations TO workforce_runtime;
GRANT SELECT,INSERT,UPDATE ON requirements,requirement_skills,strategy_scores,scenarios,actions,normalization_reviews,learning_records,simulator_executions TO workforce_runtime;
GRANT SELECT,INSERT ON decisions,decision_audit,action_history TO workforce_runtime;
-- Taxonomy writes are additionally restricted to ADMIN_EMAILS in the API.
GRANT UPDATE ON skills TO workforce_runtime;
DO $$ DECLARE tbl text; BEGIN
  FOREACH tbl IN ARRAY ARRAY['scenarios','decisions','actions','decision_audit','strategy_scores','requirement_skills'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',tbl);
    EXECUTE format('DROP POLICY IF EXISTS owner_scope ON %I',tbl);
    EXECUTE format('CREATE POLICY owner_scope ON %I USING (EXISTS (SELECT 1 FROM requirements r WHERE r.id = requirement_id AND r.owner_id = current_setting(''app.user_id'',true))) WITH CHECK (EXISTS (SELECT 1 FROM requirements r WHERE r.id = requirement_id AND r.owner_id = current_setting(''app.user_id'',true)))',tbl);
  END LOOP;
END $$;
ALTER TABLE normalization_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_scope ON normalization_reviews;
CREATE POLICY owner_scope ON normalization_reviews USING(owner_id=current_setting('app.user_id',true)) WITH CHECK(owner_id=current_setting('app.user_id',true));
ALTER TABLE action_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_scope ON action_history;
CREATE POLICY owner_scope ON action_history USING(EXISTS(SELECT 1 FROM actions a WHERE a.id=action_id)) WITH CHECK(EXISTS(SELECT 1 FROM actions a WHERE a.id=action_id));
ALTER TABLE simulator_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_scope ON simulator_executions;
CREATE POLICY owner_scope ON simulator_executions USING(EXISTS(SELECT 1 FROM actions a WHERE a.id=action_id)) WITH CHECK(EXISTS(SELECT 1 FROM actions a WHERE a.id=action_id));
ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_scope ON learning_records;
CREATE POLICY owner_scope ON learning_records USING(action_id IS NULL OR EXISTS(SELECT 1 FROM actions a WHERE a.id=action_id)) WITH CHECK(EXISTS(SELECT 1 FROM actions a WHERE a.id=action_id));
INSERT INTO schema_migrations(version) VALUES('002') ON CONFLICT DO NOTHING;
